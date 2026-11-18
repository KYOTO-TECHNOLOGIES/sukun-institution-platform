# Deploy lms.sukunweb.com alongside existing applications

This runbook assumes an Ubuntu/Debian-style Linux host with the existing Nginx installed on the host, Docker Engine with Compose v2, and a new Sukun production database. It does not modify your server automatically. Keep both existing applications and their configurations in place.

Use `https://lms.sukunweb.com` on public port 443. The existing Nginx selects Sukun by hostname and proxies to `127.0.0.1:18080`. Sukun's frontend container then routes API and WebSocket requests to its private API container. PostgreSQL and Redis are private containers with no host ports. No `.deb` package is needed; the two application Docker images are the release artifacts.

## 1. Check the host before changing it

Run these read-only commands on the server:

```sh
nproc
uname -m
free -h
df -h
uptime
sudo ss -lntp
docker ps --format 'table {{.Names}}\t{{.Ports}}'
docker compose version
sudo nginx -t
```

Ports 80 and 443 already belonging to **the existing Nginx** are expected. Add a virtual host to that same Nginx; do not start another Nginx on those ports. If another proxy or a container owns these ports, adapt that existing proxy instead: the host-Nginx file paths and loopback upstream in this guide cannot be copied unchanged into a containerized proxy.

Check that `18080` is unused in both the listener and container lists. If occupied, choose another free high port and change `SUKUN_HTTP_PORT` and the Nginx `proxy_pass` together. Do not stop the application that already owns a port. Database port 5432 and Redis port 6379 inside this Compose network can coexist with other projects because neither is published to the host.

Four cores alone are not a blocker. Free memory, disk space, existing workloads and actual usage determine capacity. The optional `deploy/compose.small-server.yaml` starts with these **runtime caps**, not a benchmark or user-capacity promise:

- API: 1 CPU, 768 MiB; one Daphne process.
- PostgreSQL: 0.75 CPU, 768 MiB.
- Redis: 0.25 CPU, 128 MiB, with a 64 MB data limit and no eviction.
- Frontend Nginx: 0.25 CPU, 128 MiB.

These total 2.25 CPU cores and 1.75 GiB of container memory. Budget roughly 2.5 GiB of currently available RAM for an initial small deployment, including operating headroom, while preserving the existing apps' peak requirements. This is a starting operational allowance, not measured application capacity. With only 4 GiB total RAM and two busy apps, there may be insufficient headroom. Do not deploy merely because the machine has four cores.

The override disables additional swap for these containers and rotates their Docker logs. It does not cap image builds, migrations outside these services, disk/database/media growth, shared host Nginx, backups, or the other applications. A memory cap can terminate Sukun processes if undersized. Monitor restarts, Redis capacity, disk, latency and peak load; tune or move Sukun to a separate VPS if headroom is inadequate. Containers reduce conflicts but cannot guarantee zero impact on a shared host.

If Docker or Certbot is absent, use the official installation instructions for the actual OS. Installing Docker changes host networking, so schedule that initial setup appropriately; do not run an unrelated system-wide upgrade or replace the existing Nginx configuration as part of this rollout.

## 2. Add the DNS record

In the DNS settings for `sukunweb.com`, add an **A** record with name **lms**, pointing to the server's public IPv4 address. Leave the root domain and existing application records unchanged. Add an AAAA record only if IPv6 is configured end to end; an incorrect AAAA record can break validation and access.

Start with DNS-only routing if the DNS service also offers a CDN/proxy. The provided proxy trust settings assume the browser connects directly to the host Nginx. Adding a CDN/load balancer needs explicit trusted-client-IP handling and a reviewed proxy chain.

```sh
getent ahostsv4 lms.sukunweb.com
```

Confirm public DNS from outside the server too. A dedicated hostname avoids sharing Sukun's host-only cookies with apps on different hostnames. Separate ports on the same hostname/IP do **not** isolate cookies. Production cookie names are also prefixed to avoid accidental collisions; leave `JWT_COOKIE_DOMAIN` unset so cookies do not apply to all of `sukunweb.com`.

## 3. Prepare the source and production environment

Copy this committed repository to a dedicated directory such as `/opt/sukun`, owned by your deployment user. Use Git or a tracked-source archive. Do not upload `.local`, local credentials, `node_modules`, the local venv, the demo SQLite database, or any real data without a separate migration plan. Do not seed demo records in production.

From `/opt/sukun`, create a private environment file **once**:

```sh
cd /opt/sukun
umask 077
test ! -e deploy/production.env && cp deploy/production.env.example deploy/production.env
python3 - <<'PY'
from pathlib import Path
import secrets
p = Path('deploy/production.env')
text = p.read_text()
text = text.replace('replace-with-at-least-50-random-characters-generated-for-this-deployment', secrets.token_urlsafe(64))
text = text.replace('replace-with-a-long-random-database-password', secrets.token_urlsafe(32))
p.write_text(text)
PY
chmod 600 deploy/production.env
nano deploy/production.env
```

Set the following values in that file, keeping the two generated secrets intact:

```dotenv
SUKUN_HTTP_PORT=18080
SUKUN_API_IMAGE=sukun-platform-api:release-1
SUKUN_WEB_IMAGE=sukun-platform-web:release-1
ALLOWED_HOSTS=lms.sukunweb.com,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=https://lms.sukunweb.com
WEBSOCKET_ALLOWED_ORIGINS=https://lms.sukunweb.com
TIME_ZONE=Asia/Kolkata
ALLOW_INSTITUTION_REGISTRATION=False
JWT_COOKIE_SECURE=True
JWT_ACCESS_COOKIE_NAME=sukun_access
JWT_REFRESH_COOKIE_NAME=sukun_refresh
CSRF_COOKIE_NAME=sukun_csrf
SESSION_COOKIE_NAME=sukun_session
CSRF_COOKIE_SECURE=True
SESSION_COOKIE_SECURE=True
SECURE_SSL_REDIRECT=True
TRUST_PROXY_SSL_HEADER=True
TRUSTED_PROXY_COUNT=2
REDIS_URL=redis://redis:6379/0
OPENAI_API_KEY=
ASSISTANT_MODEL=
BILLING_WEBHOOK_SECRET=
```

Compose forces `DEBUG=False` and supplies the private PostgreSQL URL. Keep AI and billing secrets empty: no external AI or payment gateway is required. Local workflow guidance and manual subscription administration remain available. These settings do not remove existing fee/accounting records or workflows.

## 4. Build elsewhere, then transfer the images

Avoid running the frontend compiler on the busy four-core production host. On another Docker-equipped machine or CI runner, build from the **same source revision** you copied to the server. This example targets a Linux x86_64 server (`uname -m` reports `x86_64`); use `linux/arm64` instead for an ARM64 host.

```sh
docker buildx build --platform linux/amd64 --load -t sukun-platform-api:release-1 institution_management_application/sukun_lms
docker buildx build --platform linux/amd64 --load -t sukun-platform-web:release-1 sukun_lms_frontend
docker image save -o sukun-release-1.tar sukun-platform-api:release-1 sukun-platform-web:release-1
```

Transfer the archive securely to the server (for example with SFTP/SCP), retaining enough disk space for the archive, extracted images, backups and records. A private container registry is an alternative. On the server:

```sh
docker image load -i /path/to/sukun-release-1.tar
```

Do not copy production secrets to the build machine. App Dockerfiles exclude environment files and local databases from the image context.

## 5. Initialize only the Sukun project

Use the unique project name `sukun_prod` consistently for start, backup, migration and stop commands. Check `docker compose ls` first and choose another unused name if necessary. Project naming isolates this stack's networks, containers and named volumes; changing the name later would select different volumes.

Define this shell helper while working in `/opt/sukun`:

```sh
dc() {
  docker compose -p sukun_prod --env-file deploy/production.env \
    -f compose.yaml -f deploy/compose.small-server.yaml "$@"
}
dc config --quiet
dc pull db redis
dc up -d --wait db redis
dc run --rm --no-deps api python manage.py migrate --noinput
dc run --rm --no-deps api python manage.py collectstatic --noinput
dc run --rm --no-deps api python manage.py create_platform_admin --phone +YOUR_REAL_PHONE --name "Software administrator"
dc run --rm --no-deps api python manage.py check --deploy
dc up -d --no-build --wait
dc ps
curl --fail http://127.0.0.1:18080/health/
```

Replace the phone placeholder with your actual international phone number. The administrator command prompts for a password; do not put the password in the command line. Stop if any migration, bootstrap, container health, or configuration error occurs. HSTS preload being disabled is the existing intentional `security.W021` warning; investigate any other deployment warning. Do not run `scripts/dev.py` on production, because it selects the local debug/demo environment.

The `dc` helper lasts only for this shell session. Define it again in later sessions or use its complete Compose command. Never use a different project's Compose file, `docker stop $(docker ps -q)`, global prune commands, or `down -v`; the latter deletes this application's data volumes.

## 6. Add HTTPS without stopping the existing sites

These steps assume host Nginx includes `/etc/nginx/conf.d/*.conf` inside its `http` block. Check your installation first; Debian `sites-available`/`sites-enabled` is also supported if used consistently. Ensure no existing server block already owns `lms.sukunweb.com`, and that `sukun.conf` is an unused filename. Keep a backup of the existing Nginx configuration before adding this site.

First install the **HTTP bootstrap site only** and its dedicated ACME webroot:

```sh
sudo install -d -m 755 /var/www/sukun-acme
sudo install -m 644 deploy/nginx-sukun-bootstrap.conf.example /etc/nginx/conf.d/sukun.conf
sudo nginx -t && sudo systemctl reload nginx
```

With DNS pointing to this server and public port 80 reaching the existing Nginx, obtain a certificate using Certbot's webroot method:

```sh
sudo certbot certonly --webroot -w /var/www/sukun-acme -d lms.sukunweb.com \
  --deploy-hook 'nginx -t && systemctl reload nginx'
```

Use the existing Certbot installation if present. This method does not stop Nginx, bind a competing standalone webserver, or rewrite the other applications' sites. Complete the certificate authority's prompts. If a certificate with this exact domain already exists, reuse its actual paths shown by `certbot certificates`; do not create a duplicate blindly.

After the certificate exists, replace **only the Sukun bootstrap file** with the final site:

```sh
sudo install -m 644 deploy/nginx-sukun-domain.conf.example /etc/nginx/conf.d/sukun.conf
sudo nginx -t && sudo systemctl reload nginx
curl --fail https://lms.sukunweb.com/health/
sudo certbot renew --cert-name lms.sukunweb.com --dry-run
```

If Certbot used a different certificate name/path, adjust the final site's certificate paths and the renewal command accordingly. Confirm the existing Certbot timer/cron renews certificates; do not add duplicate renewal jobs. Keep the ACME path accessible. Both server blocks use explicit hostnames and neither declares `default_server`. Check the loaded configuration to ensure the existing default/catch-all server remains selected; Nginx otherwise uses the first server for that listener. Existing port 80/443 sites stay in place. Reload applies a valid configuration gracefully; do not stop/restart Nginx or the Docker daemon for this deployment.

Keep the server's existing SSH and application firewall rules. Public ports 80/443 must already be permitted or be added through the server's established firewall/security-group process. Do not reset the firewall. Do not open 18080, 8000, 5432 or 6379 publicly. Only the frontend has a published Docker port, bound to loopback.

The alternate `deploy/nginx-sukun-port.conf.example` is for a separately reviewed IP/custom-port setup and is not needed for `lms.sukunweb.com`. Do not enable it alongside the domain template; both define the same Sukun upgrade map.

## 7. Launch without AI or payment collection

Open `https://lms.sukunweb.com`, sign in with the new software administrator and create a plan and institution. Give the institution administrator the temporary password through your secure onboarding process; its first sign-in requires a password change.

For institutions you are operating without subscription billing, change the organization from TRIAL to **ACTIVE**, leave the paid-through date empty, and turn off overdue enforcement and suspension after payment failure. Record the reason for the access decision. A newly provisioned organization starts as a timed trial, so skipping this step would eventually restrict it even without a payment gateway. Choose seat limits appropriate to the intended institution. No invoice or payment-provider setup is necessary for this mode.

Verify login/logout, a reversible institution workflow, protected attachments, notification delivery, password recovery, and both existing applications. Monitor CPU/memory/restarts and disk while testing real workloads before inviting all users. The four-core profile has not been load-tested on your server.

## Backups, updates and rollback

Back up PostgreSQL and the media volume, encrypt off-server copies, and test restoration before real use. `dc exec -T db pg_dump -U sukun -d sukun -Fc > /secure/backup/location/sukun.dump` is a Linux database-backup example; the destination must exist and be restricted. The database dump does not include uploaded media. Follow [DEPLOYMENT.md](DEPLOYMENT.md#backups-and-restore) for the wider backup policy. Schedule JWT token cleanup with `python manage.py flushexpiredtokens` inside the API container.

For updates, use new image tags and the matching source revision, back up first, load/pull the new images, run migrations once, collect static assets, then `dc up -d --no-build --wait`. Keep prior image tags and a tested restore path. Do not assume database migrations can be reversed safely. A single API instance can have a short Sukun-only interruption during updates; this is not a zero-downtime deployment design.

If launch needs to be paused, `dc stop` stops only this project's containers and retains volumes. Keep the other two applications running. Do not delete volumes to troubleshoot startup.

The authentication changes have regression tests, but Docker/host Nginx and this resource profile have not been run against your actual server. Run the configuration and live checks above. Remaining dependency advisories are documented in [PLATFORM_OPERATIONS.md](PLATFORM_OPERATIONS.md#deployment-and-remaining-operational-work); recheck them before release.

References: [Docker project isolation](https://docs.docker.com/compose/how-tos/project-name/), [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/), [Compose resource controls](https://docs.docker.com/reference/compose-file/services/), [Nginx virtual hosts](https://nginx.org/en/docs/http/request_processing.html), [graceful Nginx reload](https://nginx.org/en/docs/control.html), [Certbot webroot](https://eff-certbot.readthedocs.io/en/stable/using.html#webroot), and [cookie port scope](https://www.rfc-editor.org/rfc/rfc6265#section-8.5).
