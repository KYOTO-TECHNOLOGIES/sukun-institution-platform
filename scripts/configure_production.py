"""Create a fresh server environment from a verified Actions release, without replacing secrets."""
import argparse
import os
from pathlib import Path
import re
import secrets

ROOT = Path(__file__).resolve().parent.parent
IMAGE_RE = re.compile(r'sukun-platform-(api|web):sha-([0-9a-f]{40})-(amd64|arm64)')


def read_images(path):
    values = {}
    for line in Path(path).read_text(encoding='utf-8').splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        key, separator, value = line.partition('=')
        if not separator or key not in {'SUKUN_API_IMAGE', 'SUKUN_WEB_IMAGE'} or key in values:
            raise ValueError('images.env must contain exactly one API and one web image reference.')
        match = IMAGE_RE.fullmatch(value)
        if not match or match[1].upper() != key.split('_')[1]:
            raise ValueError('Unexpected release image reference.')
        values[key] = value
    if set(values) != {'SUKUN_API_IMAGE', 'SUKUN_WEB_IMAGE'}:
        raise ValueError('Both release images are required.')
    references = [IMAGE_RE.fullmatch(value).groups()[1:] for value in values.values()]
    if references[0] != references[1]:
        raise ValueError('Both images must come from the same commit and architecture.')
    return values


def write_environment(root, images_path, hostname='lms.sukunweb.com', port=18080):
    if len(hostname) > 253 or not re.fullmatch(r'(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}', hostname):
        raise ValueError('Use a lowercase DNS hostname without a scheme, port, or path.')
    if not 1024 <= port <= 65535:
        raise ValueError('Choose an unused private port between 1024 and 65535.')
    root = Path(root)
    target = root / 'deploy' / 'production.env'
    if target.exists():
        raise FileExistsError('production.env already exists. Keep its secrets; update image references separately.')
    values = {
        **read_images(images_path),
        'SECRET_KEY': secrets.token_urlsafe(64),
        'POSTGRES_PASSWORD': secrets.token_urlsafe(32),
        'SUKUN_HTTP_PORT': str(port),
        'ALLOWED_HOSTS': hostname + ',localhost,127.0.0.1',
        'CSRF_TRUSTED_ORIGINS': 'https://' + hostname,
        'WEBSOCKET_ALLOWED_ORIGINS': 'https://' + hostname,
        'OPENAI_API_KEY': '', 'ASSISTANT_MODEL': '', 'BILLING_WEBHOOK_SECRET': '',
    }
    lines = []
    for line in (root / 'deploy' / 'production.env.example').read_text(encoding='utf-8').splitlines():
        key = line.partition('=')[0]
        lines.append(key + '=' + values.pop(key) if key in values else line)
    lines.extend(key + '=' + value for key, value in values.items())
    # Exclusive creation also protects against a file appearing after the initial check.
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as output:
        output.write('\n'.join(lines) + '\n')
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--images-env', required=True, type=Path)
    parser.add_argument('--hostname', default='lms.sukunweb.com')
    parser.add_argument('--port', type=int, default=18080)
    args = parser.parse_args()
    try:
        path = write_environment(ROOT, args.images_env, args.hostname, args.port)
    except (OSError, ValueError) as error:
        parser.exit(1, str(error) + '\n')
    print(f'Created {path}. Secrets were generated locally and have not been printed.')
    print('AI and payment integrations are disabled. This command does not start services.')


if __name__ == '__main__':
    main()
