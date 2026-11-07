# Deployment and operations

The supported production topology is a same-origin React/Nginx frontend, Django/Gunicorn API, and PostgreSQL database. Local development uses a separate SQLite database. SQLite is not the production database: row locks used for payment, enrollment, and capacity workflows require PostgreSQL.

## Local setup

Install Python 3.13 and Node.js 22, then run from the repository root:

```
python scripts/dev.py setup
python scripts/dev.py api
```

In a second terminal:

```
python scripts/dev.py web
```

Open http://127.0.0.1:5173. The setup creates `.local/demo.sqlite3` and writes the generated credentials to `.local/DEMO_ACCESS.md`. It does not modify the original backend database. The seed command refuses to run with DEBUG=False and preserves an existing demo institution.

Run backend tests with `python scripts/dev.py test`. Frontend checks are `npm run typecheck`, `npm run build`, and `npm run test:e2e` from the frontend folder. Browser tests use the running local demo and credentials from the ignored local configuration.

## Production container setup

1. Copy `deploy/production.env.example` to `deploy/production.env`.
2. Generate independent random secrets. Set the actual hostname, HTTPS origin, and institution timezone. Use a URL-safe database password because it is embedded in DATABASE_URL.
3. Put an HTTPS reverse proxy in front of loopback port 8080. It must overwrite X-Forwarded-Proto and forward the real Host. The database and API have no published host ports.
4. Build and initialize:

```
docker compose --env-file deploy/production.env build
docker compose --env-file deploy/production.env up -d db
docker compose --env-file deploy/production.env run --rm api python manage.py migrate --noinput
docker compose --env-file deploy/production.env run --rm api python manage.py collectstatic --noinput
docker compose --env-file deploy/production.env run --rm api python manage.py createsuperuser
docker compose --env-file deploy/production.env run --rm api python manage.py check --deploy
docker compose --env-file deploy/production.env up -d
```

Use the Django admin to establish the first institution and administrator, or explicitly enable institution registration during controlled onboarding. Disable public registration when onboarding is complete. The standard application admin role does not grant Django admin access.

Health endpoint: `/health/`. Logs go to stdout/stderr. Uploaded files require authenticated ownership checks and are served as attachments. Nginx must not directly expose the media volume.

## Backups and restore

For the isolated local database:

```
python scripts/backup.py .local/demo.sqlite3
```

For production, schedule encrypted PostgreSQL backups using `pg_dump -Fc`, store them outside the application host, and back up the media volume on the same schedule. Do not rely on a Docker volume as a backup. Restore into a separate database and run application checks before changing the production connection.

On Linux, a database backup command is:

```
docker compose --env-file deploy/production.env exec -T db pg_dump -U sukun -d sukun -Fc > sukun.dump
```

On Windows PowerShell, use binary-safe output redirection or run pg_dump inside the container to a mounted backup directory; older PowerShell redirection can corrupt binary dumps. Keep backup retention and access aligned with the institution's data policy.

## Release process

Back up first, run CI, build the new images, run migrations once, collect static assets, then restart API and web. Validate login, a read from each enabled module, a reversible workflow on a test institution, and health status. Keep the previous images and a tested database restore path. Schema downgrades are not assumed safe.

Use `python manage.py flushexpiredtokens` daily to remove expired JWT blacklist records. Audit records contain actor, time, path, method, and status; they do not contain passwords or request bodies.

## Integration boundaries

This version records payments received by staff; it does not charge cards or connect to a payment gateway. Notices are delivered inside the application, not through SMS, WhatsApp, or email. Transport and hostel fees are reference amounts; recurring fee invoices should be defined in Fee Structures. Payroll is a salary register with approval and payment references, not a statutory payroll/tax engine. Video lessons use external URLs and do not host live video meetings.

Before serving real users, configure the hosting domain and TLS, independently verify backup restoration, review institution-specific rules, and complete acceptance testing for your chosen workflows and expected load. See the implementation progress and validation records for what has actually been tested.

References: [Django deployment guidance](https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/) and [Playwright web-server testing](https://playwright.dev/docs/test-webserver).

The deployment system check intentionally leaves HSTS preload disabled (`security.W021`). Enable preload only after validating HTTPS ownership and the consequences for all subdomains; it is not needed for normal HTTPS operation.
