"""Root-owned, project-scoped deployment entry point for the Sukun SSH account.

Install this file outside the writable upload directory. It never executes code
from the source archive on the host. Application commands run inside containers.
"""
import argparse
import datetime
try:
    import fcntl
except ImportError:  # Validation helpers also run in Windows developer tests.
    fcntl = None
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import secrets
import shutil
import stat
import subprocess
import tarfile

ROOT = Path('/opt/sukun')
INCOMING = Path('/var/lib/sukun/incoming')
BACKUPS = Path('/var/backups/sukun')
PROJECT = 'sukun_prod'
INSTALLED = Path('/usr/local/lib/sukun')
FILES = ('source.tar.gz', 'images.tar.gz', 'images.env', 'release.json', 'DEPLOY.md')


def run(command, **kwargs):
    return subprocess.run(command, check=True, **kwargs)


def checksum(path):
    value = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()


def verify_checksums(directory):
    expected = {}
    for line in (directory / 'SHA256SUMS').read_text().splitlines():
        match = re.fullmatch(r'([0-9a-f]{64})  ([A-Za-z0-9_.-]+)', line)
        if not match or match[2] not in FILES or match[2] in expected:
            raise ValueError('Invalid checksum manifest.')
        expected[match[2]] = match[1]
    if set(expected) != set(FILES):
        raise ValueError('Incomplete checksum manifest.')
    for name, value in expected.items():
        if checksum(directory / name) != value:
            raise ValueError('Release checksum mismatch: ' + name)


def validate_image_archive(path, expected):
    # docker save's compatibility manifest must contain only Sukun's two tags.
    # Refuse archives capable of replacing another application's image tags.
    with tarfile.open(path, 'r:gz') as archive:
        member = archive.getmember('manifest.json')
        if not member.isfile() or member.size > 1024 * 1024:
            raise ValueError('Invalid Docker archive manifest.')
        entries = json.load(archive.extractfile(member))
        tags = [tag for item in entries for tag in item.get('RepoTags', [])]
        if len(entries) != 2 or sorted(tags) != sorted(expected):
            raise ValueError('Docker archive must contain only this release\'s two Sukun images.')
        # Containerd-backed exports may additionally have an OCI index.
        try:
            index = archive.getmember('index.json')
        except KeyError:
            index = None
        if index:
            if not index.isfile() or index.size > 1024 * 1024:
                raise ValueError('Invalid OCI index.')
            data = json.load(archive.extractfile(index))
            for descriptor in data.get('manifests', []):
                annotation = descriptor.get('annotations', {})
                for key in ('io.containerd.image.name', 'org.opencontainers.image.ref.name'):
                    name = annotation.get(key)
                    if name and name not in expected and name not in [v.split(':', 1)[1] for v in expected] and name not in ['docker.io/library/' + v for v in expected]:
                        raise ValueError('Unexpected image reference in OCI index.')


def image_configurations(path):
    """Read portable image identities from the already-verified Docker archive."""
    configurations = {}
    with tarfile.open(path, 'r:gz') as archive:
        entries = json.load(archive.extractfile('manifest.json'))
        for entry in entries:
            member = archive.getmember(entry['Config'])
            if not member.isfile() or member.size > 1024 * 1024:
                raise ValueError('Invalid image configuration in release archive.')
            config = json.load(archive.extractfile(member))
            for tag in entry['RepoTags']:
                configurations[tag] = config
    return configurations


def validate_loaded_image(actual, expected, reference, commit, architecture):
    # Classic Docker reports the config digest as Id; Docker 29's containerd
    # store reports the target manifest/index digest. Compare the complete
    # runtime configuration and content-addressed layer chain across stores.
    if (actual.get('Os') != 'linux' or expected.get('os') != 'linux'
            or actual.get('Architecture') != architecture or expected.get('architecture') != architecture
            or reference not in (actual.get('RepoTags') or [])
            or not expected.get('config') or actual.get('Config') != expected['config']
            or actual.get('RootFS', {}).get('Type') != expected.get('rootfs', {}).get('type')
            or actual.get('RootFS', {}).get('Layers') != expected.get('rootfs', {}).get('diff_ids')
            or not expected.get('rootfs', {}).get('diff_ids')
            or (actual.get('Config', {}).get('Labels') or {}).get('org.opencontainers.image.revision') != commit):
        raise ValueError('Loaded image content does not match the verified release: ' + reference)


def extract_source(path, destination):
    total = 0
    with tarfile.open(path, 'r:gz') as archive:
        for index, member in enumerate(archive):
            parts = PurePosixPath(member.name).parts
            if not parts or member.name.startswith('/') or '..' in parts or '\\' in member.name:
                raise ValueError('Unsafe source archive path.')
            if not (member.isfile() or member.isdir()):
                raise ValueError('Links and special files are not allowed in source archives.')
            total += member.size
            if index > 30000 or total > 1024 ** 3:
                raise ValueError('Source archive exceeds deployment limits.')
            target = destination.joinpath(*parts)
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open('xb') as output, archive.extractfile(member) as source:
                    shutil.copyfileobj(source, output)
                target.chmod(0o755 if member.mode & 0o111 else 0o644)


def validate_compose(config, images):
    services = config.get('services', {})
    if set(services) != {'api', 'web', 'db', 'redis'}:
        raise ValueError('Only the four Sukun services may be deployed.')
    allowed_images = {**images, 'db': 'postgres:17-alpine', 'redis': 'redis:7.4-alpine'}
    mounts = {'db': {('postgres_data', '/var/lib/postgresql/data')}, 'redis': set(),
              'api': {('media_data', '/app/media'), ('static_data', '/app/staticfiles')},
              'web': {('static_data', '/static')}}
    for role, service in services.items():
        if service.get('image') != allowed_images[role]:
            raise ValueError('Unapproved service image: ' + role)
        if any(service.get(key) for key in ('privileged', 'network_mode', 'pid', 'ipc', 'devices', 'cap_add', 'container_name', 'volumes_from', 'develop', 'post_start', 'pre_stop', 'use_api_socket')):
            raise ValueError('Host access or lifecycle hooks are forbidden: ' + role)
        actual_mounts = set()
        for volume in service.get('volumes', []):
            if volume.get('type') != 'volume' or (volume.get('source'), volume.get('target')) not in mounts[role]:
                raise ValueError('Unapproved storage mount: ' + role)
            actual_mounts.add((volume['source'], volume['target']))
        if actual_mounts != mounts[role]:
            raise ValueError('Required persistent storage is missing: ' + role)
        if set(service.get('networks', {})) != {'default'}:
            raise ValueError('Services must use only the private Sukun network.')
        ports = service.get('ports', [])
        if role == 'web':
            if len(ports) != 1 or ports[0].get('host_ip') != '127.0.0.1' or str(ports[0].get('published')) != '18080' or ports[0].get('target') != 80:
                raise ValueError('Sukun frontend must use only 127.0.0.1:18080.')
        elif ports:
            raise ValueError('API, database and Redis cannot publish host ports.')
        if not 0 < float(service.get('cpus', 0)) <= 0.75 or not 0 < int(service.get('mem_limit', 0)) <= 768 * 1024 ** 2:
            raise ValueError('Runtime CPU and memory caps are required.')
    if set(config.get('volumes', {})) != {'postgres_data', 'media_data', 'static_data'}:
        raise ValueError('All three project volumes are required.')
    for name, volume in config.get('volumes', {}).items():
        if name not in {'postgres_data', 'media_data', 'static_data'} or volume.get('external') or volume.get('driver_opts') or volume.get('name') != PROJECT + '_' + name:
            raise ValueError('Volumes must belong only to the Sukun project.')
    networks = config.get('networks', {})
    if set(networks) != {'default'} or networks['default'].get('external') or networks['default'].get('name') != PROJECT + '_default' or networks['default'].get('driver_opts'):
        raise ValueError('Network must belong only to the Sukun project.')


def write_config(path, images):
    values = {
        'SECRET_KEY': secrets.token_urlsafe(64), 'POSTGRES_PASSWORD': secrets.token_urlsafe(32),
        'SUKUN_API_IMAGE': images['api'], 'SUKUN_WEB_IMAGE': images['web'],
        'SUKUN_HTTP_PORT': '18080', 'ALLOWED_HOSTS': 'lms.sukunweb.com,localhost,127.0.0.1',
        'CSRF_TRUSTED_ORIGINS': 'https://lms.sukunweb.com', 'WEBSOCKET_ALLOWED_ORIGINS': 'https://lms.sukunweb.com',
        'TIME_ZONE': 'Asia/Kolkata', 'ALLOW_INSTITUTION_REGISTRATION': 'False',
        'JWT_COOKIE_SECURE': 'True', 'JWT_ACCESS_COOKIE_NAME': 'sukun_access',
        'JWT_REFRESH_COOKIE_NAME': 'sukun_refresh', 'CSRF_COOKIE_NAME': 'sukun_csrf',
        'SESSION_COOKIE_NAME': 'sukun_session', 'CSRF_COOKIE_SECURE': 'True', 'SESSION_COOKIE_SECURE': 'True',
        'SECURE_SSL_REDIRECT': 'True', 'TRUST_PROXY_SSL_HEADER': 'True', 'TRUSTED_PROXY_COUNT': '2',
        'REDIS_URL': 'redis://redis:6379/0', 'OPENAI_API_KEY': '', 'ASSISTANT_MODEL': '', 'BILLING_WEBHOOK_SECRET': '',
    }
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as output:
        output.write(''.join(key + '=' + value + '\n' for key, value in values.items()))


def deploy(release_id):
    match = re.fullmatch(r'([0-9a-f]{40})-(amd64|arm64)-([0-9]+)-([0-9]+)', release_id)
    if not match or fcntl is None or os.geteuid() != 0:
        raise ValueError('Run the installed root-owned helper with a valid release identifier.')
    commit, architecture = match[1], match[2]
    if os.uname().machine != {'amd64': 'x86_64', 'arm64': 'aarch64'}[architecture]:
        raise ValueError('Release architecture does not match this server.')
    images = {role: f'sukun-platform-{role}:sha-{commit}-{architecture}' for role in ('api', 'web')}
    ROOT.mkdir(mode=0o750, exist_ok=True)
    with (ROOT / '.deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        destination = ROOT / 'releases' / release_id
        destination.mkdir(parents=True, mode=0o750, exist_ok=False)
        incoming = INCOMING / release_id
        fd = os.open(incoming, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            for name in (*FILES, 'SHA256SUMS'):
                source_fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW, dir_fd=fd)
                with os.fdopen(source_fd, 'rb') as source:
                    info = os.fstat(source.fileno())
                    limit = 4 * 1024 ** 3 if name == 'images.tar.gz' else 200 * 1024 ** 2 if name == 'source.tar.gz' else 1024 ** 2
                    if not stat.S_ISREG(info.st_mode) or info.st_size > limit:
                        raise ValueError('Invalid upload file: ' + name)
                    with (destination / name).open('xb') as output:
                        shutil.copyfileobj(source, output)
        finally:
            os.close(fd)
        verify_checksums(destination)
        metadata = json.loads((destination / 'release.json').read_text())
        if metadata.get('commit') != commit or metadata.get('architecture') != architecture:
            raise ValueError('Release metadata does not match the requested deployment.')
        validate_image_archive(destination / 'images.tar.gz', list(images.values()))
        configurations = image_configurations(destination / 'images.tar.gz')
        source = destination / 'source'
        source.mkdir()
        extract_source(destination / 'source.tar.gz', source)
        shared = ROOT / 'production.env'
        if not shared.exists():
            write_config(shared, images)
        (source / 'deploy' / 'production.env').symlink_to(shared)
        environment = {'PATH': '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', 'HOME': '/root',
                       'SUKUN_API_IMAGE': images['api'], 'SUKUN_WEB_IMAGE': images['web']}
        base = ['docker', '--host', 'unix:///var/run/docker.sock', 'compose', '-p', PROJECT,
                '--env-file', str(shared), '-f', str(INSTALLED / 'compose.yaml'), '-f', str(INSTALLED / 'deploy/compose.small-server.yaml')]
        def dc(*args, **kwargs):
            return run([*base, *args], env=environment, **kwargs)
        config = json.loads(dc('config', '--format', 'json', capture_output=True, text=True).stdout)
        validate_compose(config, images)
        run(['docker', '--host', 'unix:///var/run/docker.sock', 'image', 'load', '-i', str(destination / 'images.tar.gz')])
        actual = json.loads(subprocess.check_output(['docker', '--host', 'unix:///var/run/docker.sock', 'image', 'inspect', *images.values()], text=True))
        for role, item in zip(images, actual):
            validate_loaded_image(item, configurations[images[role]], images[role], commit, architecture)
        dc('up', '-d', '--no-build', '--wait', 'db', 'redis')
        db_size = int(dc('exec', '-T', 'db', 'psql', '-U', 'sukun', '-d', 'sukun', '-Atc', 'SELECT pg_database_size(current_database())', capture_output=True, text=True).stdout.strip())
        media_size = int(dc('run', '--rm', '--no-deps', '-T', 'api', 'du', '-sb', '/app/media', capture_output=True, text=True).stdout.split()[0])
        if shutil.disk_usage(ROOT).free < 2 * (db_size + media_size) + 2 * 1024 ** 3:
            raise ValueError('Insufficient disk headroom for a backup and deployment. Existing app remains running.')
        backup = BACKUPS / release_id
        backup.mkdir(parents=True, mode=0o700, exist_ok=False)
        # Only Sukun pauses for consistent backups and schema changes.
        dc('stop', 'api', 'web')
        try:
            with (backup / 'database.dump').open('xb') as output:
                dc('exec', '-T', 'db', 'pg_dump', '-U', 'sukun', '-d', 'sukun', '-Fc', stdout=output)
            with (backup / 'media.tar.gz').open('xb') as output:
                dc('run', '--rm', '--no-deps', '-T', 'api', 'tar', '-C', '/app/media', '-czf', '-', '.', stdout=output)
            dc('run', '--rm', '--no-deps', '-T', 'api', 'python', 'manage.py', 'migrate', '--noinput')
            dc('run', '--rm', '--no-deps', '-T', 'api', 'python', 'manage.py', 'collectstatic', '--noinput')
            dc('run', '--rm', '--no-deps', '-T', 'api', 'python', 'manage.py', 'check', '--deploy')
            dc('up', '-d', '--no-build', '--wait')
            run(['curl', '--fail', '--silent', '--show-error', 'http://127.0.0.1:18080/health/'])
        except Exception:
            print('Sukun deployment failed. Backups: ' + str(backup), flush=True)
            print('Database migrations may have started; review before restarting or restoring. Other projects were not stopped.', flush=True)
            raise
        pending = ROOT / ('current-' + release_id)
        pending.symlink_to(source)
        os.replace(pending, ROOT / 'current')
        state = {'release_id': release_id, 'commit': commit, 'images': images,
                 'deployed_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'backup': str(backup)}
        state_file = ROOT / ('deployment-' + release_id + '.json')
        state_file.write_text(json.dumps(state, indent=2) + '\n')
        os.replace(state_file, ROOT / 'deployment.json')
        # Preserve all secrets; only successful release image references change.
        lines = shared.read_text().splitlines()
        updates = {'SUKUN_API_IMAGE': images['api'], 'SUKUN_WEB_IMAGE': images['web']}
        updated = ROOT / ('environment-' + release_id)
        fd = os.open(updated, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as output:
            output.write('\n'.join(line.partition('=')[0] + '=' + updates[line.partition('=')[0]] if line.partition('=')[0] in updates else line for line in lines) + '\n')
        os.replace(updated, shared)
        print('\nSukun deployed successfully: ' + commit, flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('release_id')
    args = parser.parse_args()
    deploy(args.release_id)
