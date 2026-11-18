import copy
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest

from scripts.deploy_server import extract_source, validate_compose, validate_image_archive, validate_loaded_image, image_configurations, verify_checksums, FILES, checksum


class DeploymentBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.images = {r: f'sukun-platform-{r}:sha-' + 'a' * 40 + '-amd64' for r in ('api', 'web')}

    def archive(self, entries):
        path = self.root / 'input.tar.gz'
        with tarfile.open(path, 'w:gz') as archive:
            for name, data, kind in entries:
                member = tarfile.TarInfo(name)
                member.type = kind
                member.size = len(data)
                archive.addfile(member, io.BytesIO(data))
        return path

    def test_source_extraction_rejects_escape_links_and_duplicate_files(self):
        for index, entries in enumerate([
            [('../outside', b'x', tarfile.REGTYPE)],
            [('/etc/unsafe', b'x', tarfile.REGTYPE)],
            [('path\\outside', b'x', tarfile.REGTYPE)],
            [('link', b'', tarfile.SYMTYPE)],
            [('link', b'', tarfile.LNKTYPE)],
            [('duplicate', b'a', tarfile.REGTYPE), ('duplicate', b'b', tarfile.REGTYPE)],
        ]):
            with self.subTest(entries=entries):
                with self.assertRaises((ValueError, FileExistsError)):
                    extract_source(self.archive(entries), self.root / str(index))

    def test_image_archive_cannot_overwrite_another_project_tag(self):
        expected = list(self.images.values())
        for tags, accepted in [(expected, True), ([*expected, 'other-app:latest'], False), (['other-app:latest', expected[1]], False)]:
            manifest = [{'RepoTags': [tag]} for tag in tags]
            path = self.archive([('manifest.json', json.dumps(manifest).encode(), tarfile.REGTYPE)])
            if accepted:
                validate_image_archive(path, expected)
            else:
                with self.assertRaises(ValueError):
                    validate_image_archive(path, expected)

    def test_oci_index_cannot_hide_unrelated_image_tag(self):
        expected = list(self.images.values())
        manifest = [{'RepoTags': [tag]} for tag in expected]
        index = {'manifests': [{'annotations': {'io.containerd.image.name': 'other-app:latest'}}]}
        path = self.archive([(name, json.dumps(value).encode(), tarfile.REGTYPE) for name, value in [('manifest.json', manifest), ('index.json', index)]])
        with self.assertRaises(ValueError):
            validate_image_archive(path, expected)

    def config(self):
        mounts = {'db': [('postgres_data', '/var/lib/postgresql/data')], 'redis': [],
                  'api': [('media_data', '/app/media'), ('static_data', '/app/staticfiles')], 'web': [('static_data', '/static')]}
        images = {**self.images, 'db': 'postgres:17-alpine', 'redis': 'redis:7.4-alpine'}
        return {'services': {role: {'image': image, 'cpus': 0.1, 'mem_limit': 128 * 1024 ** 2,
                    'networks': {'default': None},
                    'volumes': [{'type': 'volume', 'source': source, 'target': target} for source, target in mounts[role]],
                    'ports': [{'host_ip': '127.0.0.1', 'published': '18080', 'target': 80}] if role == 'web' else []}
                    for role, image in images.items()},
                'volumes': {name: {'name': 'sukun_prod_' + name} for name in ('postgres_data', 'media_data', 'static_data')},
                'networks': {'default': {'name': 'sukun_prod_default'}}}

    def test_loaded_image_identity_works_across_stores_but_rejects_changed_content(self):
        expected = {'os': 'linux', 'architecture': 'amd64',
                    'config': {'Env': ['APP=production'], 'User': '10001', 'Cmd': ['daphne'],
                               'Labels': {'org.opencontainers.image.revision': 'a' * 40}},
                    'rootfs': {'type': 'layers', 'diff_ids': ['sha256:' + 'b' * 64]}}
        actual = {'Id': 'sha256:' + 'c' * 64, 'Os': 'linux', 'Architecture': 'amd64',
                  'RepoTags': [self.images['api']], 'Config': copy.deepcopy(expected['config']),
                  'RootFS': {'Type': 'layers', 'Layers': expected['rootfs']['diff_ids'][:]}}
        path = self.archive([
            ('manifest.json', json.dumps([{'RepoTags': [self.images['api']], 'Config': 'config.json'}]).encode(), tarfile.REGTYPE),
            ('config.json', json.dumps(expected).encode(), tarfile.REGTYPE)])
        archived = image_configurations(path)[self.images['api']]
        validate_loaded_image(actual, archived, self.images['api'], 'a' * 40, 'amd64')
        for mutation in [
            lambda i: i['Config'].update(Env=['APP=changed']),
            lambda i: i['Config'].update(User='root'),
            lambda i: i['Config'].update(Cmd=['unexpected']),
            lambda i: i['RootFS'].update(Layers=['sha256:' + 'd' * 64]),
            lambda i: i.update(Architecture='arm64'),
            lambda i: i.update(RepoTags=['other:latest']),
        ]:
            changed = copy.deepcopy(actual)
            mutation(changed)
            with self.assertRaises(ValueError):
                validate_loaded_image(changed, archived, self.images['api'], 'a' * 40, 'amd64')

    def test_compose_rejects_host_access_external_storage_and_uncapped_resources(self):
        config = self.config()
        validate_compose(config, self.images)
        mutations = [
            lambda c: c['services']['api'].update(privileged=True),
            lambda c: c['services']['api'].update(network_mode='host'),
            lambda c: c['services']['api'].update(post_start=[{'command': 'true'}]),
            lambda c: c['services']['api'].update(volumes=[{'type': 'bind', 'source': '/', 'target': '/host'}]),
            lambda c: c['services']['api'].update(cpus=0),
            lambda c: c['services']['db'].update(mem_limit=0),
            lambda c: c['services']['web']['ports'][0].update(host_ip='0.0.0.0'),
            lambda c: c['services']['db'].update(volumes=[]),
            lambda c: c['volumes']['postgres_data'].update(name='other_database'),
            lambda c: c['networks']['default'].update(external=True),
        ]
        for mutation in mutations:
            changed = copy.deepcopy(config)
            mutation(changed)
            with self.assertRaises(ValueError):
                validate_compose(changed, self.images)

    def test_release_checksums_require_all_files_and_detect_tampering(self):
        for name in FILES:
            (self.root / name).write_bytes(name.encode())
        manifest = self.root / 'SHA256SUMS'
        manifest.write_text(''.join(checksum(self.root / name) + '  ' + name + '\n' for name in FILES))
        verify_checksums(self.root)
        (self.root / 'release.json').write_bytes(b'changed')
        with self.assertRaises(ValueError):
            verify_checksums(self.root)
        manifest.write_text('../outside\n')
        with self.assertRaises(ValueError):
            verify_checksums(self.root)
