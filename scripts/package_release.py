"""Package already-tested Docker images and their exact Git source for server transfer."""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

if __package__:
    from .deploy_server import validate_image_archive
else:
    from deploy_server import validate_image_archive

ROOT = Path(__file__).resolve().parent.parent


def image_references(commit, architecture):
    if not re.fullmatch(r'[0-9a-f]{40}', commit) or architecture not in {'amd64', 'arm64'}:
        raise ValueError('Expected a full Git commit SHA and amd64 or arm64 architecture.')
    return {role: f'sukun-platform-{role}:sha-{commit}-{architecture}' for role in ('api', 'web')}


def digest(path):
    value = hashlib.sha256()
    with Path(path).open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()


def inspect_images(images, commit, architecture):
    result = subprocess.check_output(['docker', 'image', 'inspect', *images.values()], text=True)
    data = json.loads(result)
    if len(data) != len(images):
        raise ValueError('Both Docker images must be present.')
    manifest = {}
    for (role, reference), item in zip(images.items(), data):
        if item.get('Os') != 'linux' or item.get('Architecture') != architecture:
            raise ValueError(f'{role} image does not match the chosen Linux architecture.')
        if (item.get('Config', {}).get('Labels') or {}).get('org.opencontainers.image.revision') != commit:
            raise ValueError(f'{role} image does not match the checked-out source revision.')
        if reference not in (item.get('RepoTags') or []):
            raise ValueError(f'{role} image tag does not match the release reference.')
        manifest[role] = {'reference': reference, 'id': item['Id']}
    return manifest


def package_release(output, architecture):
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    subprocess.run(['git', 'diff', '--exit-code', 'HEAD', '--'], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
    images = image_references(commit, architecture)
    manifest = inspect_images(images, commit, architecture)
    output = Path(output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    if any(output.iterdir()):
        raise ValueError('The output directory must be empty; existing releases are never overwritten.')
    # git archive includes committed source only, not generated CI credentials or demo data.
    subprocess.run(['git', 'archive', '--format=tar.gz', '--output=' + str(output / 'source.tar.gz'), commit], cwd=ROOT, check=True)
    with gzip.open(output / 'images.tar.gz', 'wb', compresslevel=1) as destination:
        with subprocess.Popen(['docker', 'image', 'save', *images.values()], stdout=subprocess.PIPE) as process:
            shutil.copyfileobj(process.stdout, destination, length=1024 * 1024)
            if process.wait() != 0:
                raise RuntimeError('Docker image export failed; this release is incomplete.')
    validate_image_archive(output / 'images.tar.gz', list(images.values()))
    (output / 'images.env').write_text(''.join(f'SUKUN_{role.upper()}_IMAGE={reference}\n' for role, reference in images.items()), encoding='utf-8')
    metadata = {'commit': commit, 'architecture': architecture, 'images': manifest,
                'github_run_id': os.environ.get('GITHUB_RUN_ID'),
                'github_run_attempt': os.environ.get('GITHUB_RUN_ATTEMPT')}
    (output / 'release.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
    shutil.copyfile(ROOT / 'docs' / 'ACTIONS_DEPLOYMENT.md', output / 'DEPLOY.md')
    checksum_files = sorted(path for path in output.iterdir() if path.is_file())
    (output / 'SHA256SUMS').write_text(''.join(f'{digest(path)}  {path.name}\n' for path in checksum_files), encoding='ascii')
    print(f'Packaged {commit} for Linux {architecture} in {output}.')
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a', encoding='utf-8') as stream:
            stream.write(f'## Server release verified\n\nCommit: `{commit}`\n\nArchitecture: `linux/{architecture}`\n\n'
                         'The deployment job uses this verified artifact. DEPLOY.md documents setup and recovery. '
                         'The package contains no production credentials.\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--architecture', choices=['amd64', 'arm64'], required=True)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist' / 'server-release')
    args = parser.parse_args()
    package_release(args.output, args.architecture)
