import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from scripts.configure_production import read_images, write_environment
from scripts.package_release import digest, image_references, inspect_images


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'deploy').mkdir()
        template = Path(__file__).resolve().parents[2] / 'deploy' / 'production.env.example'
        (self.root / 'deploy' / 'production.env.example').write_text(template.read_text(encoding='utf-8'), encoding='utf-8')
        self.commit = 'a' * 40
        self.images = image_references(self.commit, 'amd64')
        self.env = self.root / 'images.env'
        self.env.write_text(''.join(f'SUKUN_{role.upper()}_IMAGE={ref}\n' for role, ref in self.images.items()), encoding='utf-8')

    def test_new_environment_uses_release_and_generates_private_secrets(self):
        target = write_environment(self.root, self.env)
        values = dict(line.split('=', 1) for line in target.read_text().splitlines() if '=' in line and not line.startswith('#'))
        self.assertEqual(values['SUKUN_API_IMAGE'], self.images['api'])
        self.assertEqual(values['SUKUN_HTTP_PORT'], '18080')
        self.assertEqual(values['ALLOWED_HOSTS'], 'lms.sukunweb.com,localhost,127.0.0.1')
        self.assertEqual(values['WEBSOCKET_ALLOWED_ORIGINS'], 'https://lms.sukunweb.com')
        self.assertEqual(values['OPENAI_API_KEY'], '')
        self.assertEqual(values['BILLING_WEBHOOK_SECRET'], '')
        self.assertGreaterEqual(len(values['SECRET_KEY']), 50)
        self.assertNotEqual(values['SECRET_KEY'], values['POSTGRES_PASSWORD'])
        self.assertNotIn('replace-with-', target.read_text())
        if os.name != 'nt':
            self.assertEqual(target.stat().st_mode & 0o777, 0o600)

    def test_existing_environment_is_never_replaced(self):
        target = write_environment(self.root, self.env)
        original = target.read_bytes()
        with self.assertRaises(FileExistsError):
            write_environment(self.root, self.env)
        self.assertEqual(target.read_bytes(), original)

    def test_release_values_cannot_inject_shell_or_extra_environment_keys(self):
        self.env.write_text('SUKUN_API_IMAGE=$(touch /tmp/unwanted)\nSECRET_KEY=override\n', encoding='utf-8')
        with self.assertRaises(ValueError):
            write_environment(self.root, self.env)
        self.assertFalse((self.root / 'deploy' / 'production.env').exists())

    def test_mismatched_commits_and_architectures_are_rejected(self):
        for web in ('sukun-platform-web:sha-' + 'b' * 40 + '-amd64', self.images['web'].replace('amd64', 'arm64')):
            self.env.write_text(f'SUKUN_API_IMAGE={self.images["api"]}\nSUKUN_WEB_IMAGE={web}\n', encoding='utf-8')
            with self.assertRaises(ValueError):
                read_images(self.env)

    def test_duplicate_or_missing_image_keys_are_rejected(self):
        self.env.write_text(f'SUKUN_API_IMAGE={self.images["api"]}\n' * 2, encoding='utf-8')
        with self.assertRaises(ValueError):
            read_images(self.env)
        self.env.write_text(f'SUKUN_API_IMAGE={self.images["api"]}\n', encoding='utf-8')
        with self.assertRaises(ValueError):
            read_images(self.env)

    def test_invalid_host_and_port_do_not_create_config(self):
        for host, port in [('https://lms.sukunweb.com', 18080), ('lms.sukunweb.com\nSECRET_KEY=x', 18080), ('lms.sukunweb.com', 80)]:
            with self.assertRaises(ValueError):
                write_environment(self.root, self.env, host, port)
        self.assertFalse((self.root / 'deploy' / 'production.env').exists())

    def test_image_architecture_and_source_revision_must_match(self):
        def inspected():
            return [{'Id': 'sha256:' + str(index) * 64, 'Os': 'linux', 'Architecture': 'amd64',
                     'RepoTags': [ref], 'Config': {'Labels': {'org.opencontainers.image.revision': self.commit}}}
                    for index, ref in enumerate(self.images.values())]
        with patch('scripts.package_release.subprocess.check_output', return_value=json.dumps(inspected())):
            self.assertEqual(inspect_images(self.images, self.commit, 'amd64')['api']['reference'], self.images['api'])
        for field, value in [('Architecture', 'arm64'), ('Os', 'windows'), ('RepoTags', ['wrong:tag'])]:
            data = inspected()
            data[0][field] = value
            with patch('scripts.package_release.subprocess.check_output', return_value=json.dumps(data)):
                with self.assertRaises(ValueError):
                    inspect_images(self.images, self.commit, 'amd64')
        data = inspected()
        data[0]['Config']['Labels']['org.opencontainers.image.revision'] = 'b' * 40
        with patch('scripts.package_release.subprocess.check_output', return_value=json.dumps(data)):
            with self.assertRaises(ValueError):
                inspect_images(self.images, self.commit, 'amd64')

    def test_checksums_detect_changed_release_bytes(self):
        self.env.write_bytes(b'original')
        original = digest(self.env)
        self.env.write_bytes(b'changed')
        self.assertNotEqual(original, digest(self.env))


if __name__ == '__main__':
    unittest.main()
