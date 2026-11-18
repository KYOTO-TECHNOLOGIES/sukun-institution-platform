# Automatic production deployment

The `production` branch deploys **lms.sukunweb.com** on `187.127.171.93`. Pushing other branches runs checks without deploying. AI provider and payment gateway keys remain empty. No Debian application package or local Docker installation is needed.

## What happens on a push

1. GitHub runs backend/PostgreSQL tests, deployment safety tests, TypeScript checks, frontend build and browser tests.
2. A GitHub runner builds the Linux amd64 images, starts the production containers with the small-server limits, migrates a temporary database and checks HTTP/static/CSRF responses.
3. The exact tested images and matching committed source are packaged with checksums and uploaded as a private repository Actions artifact. The artifact expires after seven days.
4. If repository variable `SUKUN_DEPLOY_ENABLED` is `true`, Actions downloads that artifact and connects with a dedicated SSH identity. Host-key verification is mandatory.
5. A root-owned server helper verifies the upload and image references, loads the images, backs up Sukun's database and media, pauses only Sukun's API/frontend, applies migrations and checks the new deployment. Successful releases update `/opt/sukun/current` and `/opt/sukun/deployment.json`.

The workflow serializes production runs and does not cancel a running deployment. GitHub may replace an older pending run with a newer push while another run is active; the latest pending commit is the one deployed next. A failed test prevents deployment. Schema updates cause a short Sukun maintenance window. A migration failure requires investigation or coordinated restoration of database, media and code; blindly restarting an older image can corrupt compatibility.

## Server layout and isolation

This server has 2 CPU cores and 7.8 GiB RAM. The initial container caps total 1.35 CPU cores and 1.75 GiB RAM. Builds run on GitHub, outside this host. These limits are a starting configuration, not a measured user-capacity guarantee.

- Project name: `sukun_prod`.
- Private frontend: `127.0.0.1:18080`. Host Nginx handles public 80/443 by hostname.
- Sukun PostgreSQL and Redis stay inside the private container network. Existing host ports 5432 and 6379 remain available to their current applications.
- Persistent volumes: `sukun_prod_postgres_data`, `sukun_prod_media_data`, `sukun_prod_static_data`.
- Secrets: `/opt/sukun/production.env`, root-owned mode 600. They are generated on first installation and preserved on update.
- Release records/source: `/opt/sukun/releases/<commit>-amd64-<run>-<attempt>`.
- Pre-update backups: `/var/backups/sukun/<release-id>`, accessible only to root.
- Upload staging: `/var/lib/sukun/incoming`, owned by `sukun-deploy`.
- Trusted helper/configuration: `/usr/local/lib/sukun`, root-owned. Uploaded source cannot replace these files or run host commands. Infrastructure/helper changes require reinstalling reviewed files as the server administrator.

The deployment user has neither Docker group membership nor general sudo. Its sudo permission invokes only `/usr/local/sbin/sukun-deploy`, which accepts a strict release identifier and operates on the fixed Sukun project. Anyone who can deploy application code can access Sukun's application data; restrict repository write access and protect the production branch accordingly.

Docker logs rotate. Release archives, images and backups are retained for recovery; monitor disk and archive/prune old **Sukun-only** releases regularly. Keep off-server backups and periodically test restoration. Do not run global Docker prune or delete named volumes. Resource caps do not isolate disk I/O or eliminate contention with other applications.

## One-time server preparation

These commands run on the server as `django_user`, not on your Windows computer. First inspect listeners, available RAM/disk and current Nginx configuration. Verify that 18080 is unused. The [shared-server guide](SHARED_SERVER_DEPLOYMENT.md) documents the inspection and domain setup.

On the inspected Ubuntu 24.04 server, Ubuntu's Docker/Compose packages can be installed without replacing the existing applications:

```sh
sudo apt-get update
sudo env DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=l apt-get install -y --no-install-recommends docker.io docker-compose-v2
sudo docker version
sudo docker compose version
```

Copy a reviewed checkout's `scripts/deploy_server.py`, `scripts/install_deploy_helper.sh`, `scripts/enable_https.sh`, `compose.yaml`, `deploy/compose.small-server.yaml` and both `deploy/nginx-sukun-*.conf.example` domain/bootstrap templates to a temporary directory, preserving their relative paths. From that directory:

```sh
sudo sh scripts/install_deploy_helper.sh
```

This installs the dedicated user, root-owned helper and fixed Compose files. It does not deploy the application or reload Nginx. To update infrastructure later, review the changes and rerun this installer as the server administrator; normal application pushes need no server login.

Generate a dedicated Ed25519 SSH key on a trusted administrator computer. Add only its public key to `/home/sukun-deploy/.ssh/authorized_keys`, prefixed with `restrict `. Use directory mode 700 and file mode 600, owned by `sukun-deploy`. Keep the private key outside Git and out of chat. Verify the host key against the trusted server/hosting console before adding it to Actions.

## One-time GitHub configuration

Open repository **Settings → Secrets and variables → Actions**. Set these secrets:

- `SUKUN_SSH_PRIVATE_KEY`: the complete dedicated private key, including its BEGIN/END lines.
- `SUKUN_SSH_KNOWN_HOSTS`: the verified OpenSSH known-hosts record for `187.127.171.93`.

Create repository variable `SUKUN_DEPLOY_ENABLED` with value `true` after server preparation. Set it to `false` to pause automatic deployment while keeping builds/tests enabled. Use a `production` environment restricted to the `production` branch. Keep any required reviewer rule consistent with whether you want unattended deployments.

The workflow is [Deploy production](https://github.com/KYOTO-TECHNOLOGIES/sukun-institution-platform/actions/workflows/release.yml). Its first push trigger works even when the workflow is only on `production`. GitHub's **Run workflow** button requires the workflow to exist on the default branch; until then, push a production commit or rerun an existing run. A run with a skipped deploy job is only a verified build, not a server deployment.

## DNS and HTTPS

At the DNS provider for `sukunweb.com`, add an A record: name `lms`, value `187.127.171.93`. Remove conflicting records for this name. Do not add an AAAA record unless IPv6 routing and the Nginx listener are configured. If using Cloudflare, begin in DNS-only mode.

Enable only the new hostname's bootstrap configuration from `deploy/nginx-sukun-bootstrap.conf.example`, leaving existing sites intact. Use Certbot **webroot** with `/var/www/sukun-acme`; never stop the shared Nginx for standalone certificate issuance. After the certificate exists, replace just the Sukun site with `deploy/nginx-sukun-domain.conf.example`, test `sudo nginx -t`, and reload Nginx. Configure a Certbot deploy hook to validate/reload Nginx on renewal. The full commands and rollback precautions are in the [shared-server guide](SHARED_SERVER_DEPLOYMENT.md).

On this server, Certbot already has an account from the existing HTTPS sites. Once DNS resolves to the server, the installed setup helper performs these steps with the reviewed templates:

```sh
sudo /usr/local/sbin/sukun-enable-https
```

Use `--bootstrap-only` to prepare the HTTP challenge site while waiting for DNS. It returns a maintenance response for Sukun and does not change existing sites. The helper refuses to overwrite an unrecognized Sukun configuration. A new server without an existing Certbot account must first register one using its administrator's email.

The private container health check can pass before DNS/TLS is ready. Public launch requires all three: successful Actions deployment, correct DNS, and a valid HTTPS certificate.

## Create the first software administrator

After deployment, log into the server interactively. Replace the phone placeholder with your real administrator phone. The command prompts for a password; never add it to command history, Actions or this repository.

```sh
cd /usr/local/lib/sukun
sudo docker compose -p sukun_prod --env-file /opt/sukun/production.env -f compose.yaml -f deploy/compose.small-server.yaml run --rm api python manage.py create_platform_admin --phone +YOUR_REAL_PHONE --name "Software administrator"
```

Sign in at `https://lms.sukunweb.com/platform` to create organizations and their administrators. No demo users or demo institutions are imported into production. Public institution registration is disabled.

## Daily updates

From the local repository, commit and test your changes. Merge them into production and push:

```sh
git switch production
git merge main
git push origin production
```

Resolve any merge conflict locally before pushing. Direct commits to `production` also trigger deployment. Main does not automatically merge into production. Watch the Actions run through the **deploy** job, then verify login and a real application workflow. The local computer can be turned off after the push completes.

## Status and recovery

On the server:

```sh
sudo cat /opt/sukun/deployment.json
cd /usr/local/lib/sukun
sudo docker compose -p sukun_prod --env-file /opt/sukun/production.env -f compose.yaml -f deploy/compose.small-server.yaml ps
sudo docker stats --no-stream
df -h
curl --fail https://lms.sukunweb.com/health/
```

If a release fails, inspect the Actions log and Sukun container logs. The helper prints the backup directory when a migration/startup failure occurs. Pause automatic deployment with `SUKUN_DEPLOY_ENABLED=false` during recovery. Keep API/web stopped while restoring a coordinated database/media snapshot; choose matching release images and validate them before reopening access. Do not restore another application's database or use `down -v`.

For a transfer failure before the helper starts, rerun the failed workflow jobs. A new run attempt produces a fresh release ID. Each artifact contains six files: `source.tar.gz`, `images.tar.gz`, `images.env`, `release.json`, `SHA256SUMS`, and `DEPLOY.md`. As an administrator fallback, download all six from a successful trusted run, upload to a fresh incoming directory with its matching release ID, and invoke the installed helper with that ID. Never load an unverified image archive from an unknown sender.
