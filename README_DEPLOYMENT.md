# Production deployment handover

This README records the server setup from **18 November 2026**, the DNS/HTTPS launch completed on **19 November 2026**, and the remaining administrator and institution onboarding steps. Open **https://lms.sukunweb.com**. For the full deployment procedure, see [Actions deployment](docs/ACTIONS_DEPLOYMENT.md).

## Current position

The application is deployed through GitHub Actions and available at **https://lms.sukunweb.com/login**. Host Nginx proxies HTTPS to the private frontend at **127.0.0.1:18080**. The temporary setup page has been replaced by the application, and HTTP redirects to HTTPS.

The last confirmed successful deployment is application commit `098a9e6`, including the Docker compatibility fix, from [this successful Actions run](https://github.com/KYOTO-TECHNOLOGIES/sukun-institution-platform/actions/runs/44307069094). For the current deployed commit, use the status command below rather than assuming this dated snapshot is current.

The active Hostinger nameservers, `ns1.dns-parking.com` and `ns2.dns-parking.com`, now publish `lms.sukunweb.com A 187.127.171.93`. The server and Cloudflare DNS resolve it correctly. Some recursive resolvers were still caching the earlier missing-record response during launch; those caches must expire before affected clients can resolve the hostname.

Let's Encrypt issued the HTTPS certificate on 19 November 2026; its initial expiry is **17 February 2027**. The Certbot renewal timer is active and the Sukun Nginx renewal hook is installed. Public HTTPS health checks and a Chromium login-page check passed with certificate validation enabled. The browser check used the verified server IP to bypass the workstation's stale DNS cache; no certificate checks were disabled.

No production software administrator has been created by this setup. Production has not been seeded with demo institutions or demo accounts. External AI and payment gateway credentials are empty.

## What was completed

### Server preparation

- Connected to `django_user@187.127.171.93` over SSH port 22 using the existing trusted SSH setup.
- Confirmed Ubuntu 24.04.4 LTS, x86_64, **2 CPU cores** and about **7.8 GiB RAM**. The earlier four-core estimate was corrected.
- Installed Ubuntu's Docker Engine and Compose v2 packages. The inspected versions were Docker 29.1.3 and Compose 2.40.3.
- Created an isolated Compose project named `sukun_prod` with API, frontend Nginx, PostgreSQL and Redis containers.
- Published only the frontend on `127.0.0.1:18080`. The existing host PostgreSQL, Redis, Gunicorn and Nginx applications retain their own ports.
- Applied runtime caps totaling **1.35 CPU cores and 1.75 GiB RAM**, with Docker log rotation. Builds run on GitHub, not on this shared server.
- Created a dedicated `sukun-deploy` SSH account. It has no Docker group membership and no general sudo access; its sudo rule permits only the installed Sukun deployment helper.
- Generated application/database secrets on the server and stored them in root-owned `/opt/sukun/production.env` with mode 600. Secrets are preserved between releases.

These limits are an initial operating configuration, not a load-test result or a guarantee of no contention. Existing application responses and service states were checked before and after setup and matched the baseline.

### GitHub Actions and branches

- Created and pushed the separate `production` branch.
- Added the **Deploy production** workflow: a push to `production` runs tests, builds images on GitHub, verifies production containers, packages the tested release, transfers it over SSH and deploys it.
- Configured encrypted Actions secrets `SUKUN_SSH_PRIVATE_KEY` and `SUKUN_SSH_KNOWN_HOSTS`. Their values are not in Git.
- Set repository variable `SUKUN_DEPLOY_ENABLED=true` and restricted the `production` environment to the production branch.
- Enabled strict SSH host verification, release checksums, image-content verification and project-specific deployment controls.
- Added database/media backups before updates, migrations, static-file collection and health checks. Successful releases update `/opt/sukun/current` and `/opt/sukun/deployment.json`.

**Pushing `main` runs verification only. It does not deploy the server.** To release main's changes, merge them into `production` and push that branch. This handover and the production implementation have been brought into `main` so the default branch contains the setup and instructions.

### Nginx and HTTPS

- Installed the dedicated Sukun site in `/etc/nginx/sites-available/sukun-lms` and enabled its symlink. It now uses the final HTTPS configuration.
- Issued and installed the `lms.sukunweb.com` certificate with `/usr/local/sbin/sukun-enable-https` after DNS became available.
- Verified that public port 80 reaches the correct certificate challenge webroot, `/var/www/sukun-acme`.
- Confirmed the existing Certbot renewal timer is active and installed Sukun's Nginx renewal hook.

The supported public address is the HTTPS hostname. The earlier bare-IP setup page was only a bootstrap response while DNS and the certificate were pending.

### Fixes and validation

- Fixed the PostgreSQL test failure caused by running a Channels authentication check inside `APITestCase`'s enclosing transaction. The socket check now uses committed fixtures in `TransactionTestCase`; its security assertions remain intact.
- Fixed image verification across classic Docker and Docker 29's containerd image store. Verification compares the archived runtime configuration, platform, source revision and content-addressed filesystem layers instead of assuming both stores report the same image ID.
- All 111 backend tests passed locally and in the successful PostgreSQL CI run. Frontend type checking, build, browser tests and production-container checks passed in that run.
- All 14 deployment/helper tests passed locally after the Docker compatibility fix.
- Verified HTTP 200 responses from the private frontend, `/health/`, `/api/auth/csrf/` and `/static/core/receipt.js`, including the secure CSRF cookie setting.
- After enabling HTTPS, verified the HTTP-to-HTTPS redirect, public health response, visible sign-in form, secure CSRF cookie and absence of browser JavaScript errors. Existing application responses and service states still matched the pre-installation baseline.

## What to do next

**DNS and HTTPS (steps 1 and 2) are complete. Continue with step 3 to create your software administrator.** The DNS/HTTPS instructions remain here for future reference.

### 1. Add the record in the active DNS zone

Open **Hostinger's DNS Zone Editor for sukunweb.com** and add:

- Type: **A**
- Name: **lms**
- Points to: **187.127.171.93**
- TTL: default/automatic

The domain already uses Hostinger's nameservers. Keep those nameservers and the existing root, www, mail and other application records unchanged. Adding a record only in another provider's inactive DNS panel does not publish it through the active nameservers.

Hostinger documents the editor here: [How to use Hostinger's DNS Zone Editor](https://www.hostinger.com/support/how-to-use-hostingers-dns-zone-editor/).

From **local Windows PowerShell**, check the authoritative answer:

```powershell
Resolve-DnsName lms.sukunweb.com -Type A -Server ns1.dns-parking.com -DnsOnly
```

It should return `187.127.171.93`. Then confirm the server's resolver can see it:

```powershell
ssh django_user@187.127.171.93 "getent ahostsv4 lms.sukunweb.com"
```

If Hostinger has the record but a recursive resolver still returns an older answer, allow its cached answer to expire. If the authoritative server still says the name does not exist, verify the record was saved in the active zone.

### 2. Enable HTTPS

After DNS returns the correct address, run this from **local PowerShell**:

```powershell
ssh django_user@187.127.171.93 "sudo /usr/local/sbin/sukun-enable-https"
```

The installed helper verifies DNS, requests the certificate through Certbot webroot, installs the dedicated HTTPS site, validates Nginx, reloads it and adds a renewal hook. It uses the existing Certbot account. It does not stop the shared Nginx service or replace other sites.

Verify from your local computer:

```powershell
curl.exe --fail https://lms.sukunweb.com/health/
```

Expected response: `{"status":"ok"}`. Open **https://lms.sukunweb.com** in your browser. Do not treat the temporary bare-IP page as the application or disable secure cookies to work around unfinished HTTPS.

### 3. Create your software administrator

Open an interactive SSH session from **local PowerShell**:

```powershell
ssh django_user@187.127.171.93
```

Then run these commands **inside the server session**. Replace `+YOUR_REAL_PHONE` with your own administrator phone number, including country code:

```sh
cd /usr/local/lib/sukun
sudo docker compose -p sukun_prod --env-file /opt/sukun/production.env -f compose.yaml -f deploy/compose.small-server.yaml run --rm api python manage.py create_platform_admin --phone +YOUR_REAL_PHONE --name "Software administrator"
```

Enter a strong password when prompted. It will not be shown as you type. Do not put the password in Git, Actions logs or a shell command. This command refuses to overwrite an existing account.

Sign in and open **https://lms.sukunweb.com/platform**. Create the first organization and its institution administrator there. Organization administrators are separate from the software administrator. See [Platform operations](docs/PLATFORM_OPERATIONS.md) and the [Operator guide](docs/USER_GUIDE.md) for onboarding.

### 4. Check the first institution before inviting users

Verify login/logout, organization creation, the institution administrator's initial password change, role permissions, a student/staff workflow, protected attachments and notifications. Confirm the other server applications still behave as expected. Monitor RAM, CPU, restarts, disk and latency under representative use before relying on the initial resource limits for larger institutions.

Configure off-server backups and test restoration. The existing pre-deployment database/media snapshots protect updates, but they are not scheduled off-server backups and do not protect against losing the server.

## How to publish future changes

Run these commands in your **local repository** after reviewing, committing and testing the changes:

```sh
git switch main
git pull --ff-only origin main
git push origin main
git switch production
git pull --ff-only origin production
git merge main
git push origin production
```

The first push publishes development changes and starts checks. The production push starts deployment. If either pull or merge reports a conflict, resolve it before continuing; do not force-push over remote work.

Watch **[Actions > Deploy production](https://github.com/KYOTO-TECHNOLOGIES/sukun-institution-platform/actions/workflows/release.yml)** through the **deploy** job. A successful build with a skipped deployment is not a server release. Production runs are serialized; GitHub may replace an older pending run with the latest pending push. You can turn off your local device after the push finishes.

The workflow is also available on `main`, making GitHub's **Run workflow** button available. When starting a manual production release, select the **production** branch; selecting main will build/verify but skip deployment.

Normal application releases need no manual source copy to the server and no `.deb` package. Changes to the trusted deployment helper, resource limits or host Nginx templates require the administrator to review and reinstall the infrastructure files using the [Actions runbook](docs/ACTIONS_DEPLOYMENT.md#one-time-server-preparation); uploaded releases cannot replace the root-owned helper automatically.

## Useful status commands

Check the private application independently of public DNS from **local PowerShell**:

```powershell
ssh django_user@187.127.171.93 "curl -fsS http://127.0.0.1:18080/health/"
ssh django_user@187.127.171.93 "sudo cat /opt/sukun/deployment.json"
```

After connecting to the server interactively:

```sh
cd /usr/local/lib/sukun
sudo docker compose -p sukun_prod --env-file /opt/sukun/production.env -f compose.yaml -f deploy/compose.small-server.yaml ps
sudo docker compose -p sukun_prod --env-file /opt/sukun/production.env -f compose.yaml -f deploy/compose.small-server.yaml logs --tail=100 api web
sudo docker stats --no-stream
df -h
sudo nginx -t
```

`http://187.127.171.93:18080` is intentionally unavailable from outside the server because the port binds only to loopback. The supported public address is the HTTPS hostname once setup is complete.

## Files, secrets and recovery

- `/opt/sukun/production.env`: persistent application/database secrets, root-only. Never print or commit its contents.
- `/opt/sukun/deployment.json`: current successful release record.
- `/opt/sukun/current`: symlink to that release's source.
- `/opt/sukun/releases/`: verified release archives and source.
- `/usr/local/lib/sukun/`: trusted deployment helper and installed Compose configuration.
- `/var/lib/sukun/incoming/`: uploaded release packages.
- `/var/backups/sukun/<release-id>/`: pre-update `database.dump` and `media.tar.gz`.
- Docker named volumes: `sukun_prod_postgres_data`, `sukun_prod_media_data`, `sukun_prod_static_data`.

GitHub artifacts expire after seven days. Server release archives, images and backups currently remain until an administrator archives/prunes old Sukun releases. Monitor disk space and keep recovery copies off the server. Docker logs rotate separately.

To pause automatic deployment, set the repository Actions variable `SUKUN_DEPLOY_ENABLED` to `false`. This leaves the currently running application up. To resume, set it to `true` and trigger a production run.

If an update fails, inspect its Actions log and Sukun container logs. Migrations may have changed the schema: use a coordinated database/media restore and matching code when needed, rather than blindly starting an old image. Never use global Docker prune, `down -v`, or delete another application's volumes. Detailed operating guidance is in [Actions deployment](docs/ACTIONS_DEPLOYMENT.md) and [shared-server deployment](docs/SHARED_SERVER_DEPLOYMENT.md).
