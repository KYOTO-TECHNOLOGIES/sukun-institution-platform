# Validation record

Local checks use an isolated demo database and synthetic records. No real institution data was published.

- Backend: 49 security and business workflow tests pass locally, including stale-update regressions for payments and approvals. The same 49 tests pass on PostgreSQL in CI.
- Frontend: full TypeScript check and production Vite build passed.
- Browser: 14 end-to-end tests pass locally. Coverage includes all management pages/forms and API field/choice compatibility, role access, student submissions, mobile navigation, approved admission through certificate issuance, and collection/receipt/refund reconciliation.
- Manual visual review: desktop leadership dashboard, learner classroom and mobile navigation screenshots.
- Python dependencies: the patched requirements resolve to a dependency set with no known vulnerabilities reported by `pip-audit` on 7 November 2026. Django 6.0.10, REST framework 3.18.2 and Pillow 13.0.0 replace the inherited vulnerable versions.
- JavaScript dependencies: npm audit reports **0 critical, 0 high, 11 moderate, 4 low** after targeted upgrades. Remaining advisories concern inherited template dependencies/tooling (`minimatch`, `glob`, `uuid`, `deepmerge` and dependents); unsafe automatic major downgrades were not applied. Review updates before a production release.

## Remaining production verification

The local database is SQLite. PostgreSQL transaction behavior is checked by the CI API job. Production containers successfully built and started in GitHub CI, including PostgreSQL migrations, static collection, health, frontend, CSRF proxy and print-asset checks. Host-level TLS, production backup restoration, monitoring and load testing still need verification on the actual deployment host. The local SQLite backup helper was executed and the resulting backup passed integrity checking. Audit entries record successful API changes, not full immutable field-by-field history.

Browser tests run against synthetic demo data and change that data (for example, creating an enquiry and submitting homework). They do not certify every possible institution policy or integration. See DEPLOYMENT.md for current payment, messaging, payroll and video integration boundaries.

## CI evidence

- [Final patched-dependency verification](https://github.com/rizanep/sukun-institution-platform/actions/runs/42353519998) covers PostgreSQL, frontend TypeScript/build/browser tests and production container startup.
- [Previous complete green run](https://github.com/rizanep/sukun-institution-platform/actions/runs/42353128251) verified all three jobs before the final dependency security patch.

The local application is available at http://127.0.0.1:5173 while its development processes are running. Generated role credentials are deliberately excluded from Git and saved only in `.local/DEMO_ACCESS.md`.


## Realtime inbox verification (2026-11-11)

The local runtime now uses Django Channels 4.3.2 and Daphne 4.2.3. `python scripts/dev.py dev` was used to start both services, and the frontend and API health endpoints returned HTTP 200. Notifications use a persistent per-user inbox and private institution/user rooms; local tests use the in-memory channel layer.

The Django suite passes 70 tests. Notification checks cover tenant and module boundaries, teacher course ownership, guardian links, addressed notices, independent read state, permission changes, bulk attendance, manual and automatically generated fee bills, failed/no-op writes, commit timing, and recovery when live delivery fails. WebSocket checks cover cookie authentication, origin rejection, expired tokens, deactivated users, private rooms, and rejection of client-selected rooms.

Playwright exercised live notice delivery between accounts, read synchronization between tabs, popup preferences across reloads, quiet routine updates, record links, offline catch-up without replayed popups, and the mobile keyboard dialog. The existing attendance test was updated to wait for the asynchronous roster before counting rows. All workspace/create-form and record-detail checks were also exercised. TypeScript checking and the production frontend build pass; existing CSS-property and bundle-size warnings remain.

Compose, the backend image, Nginx, environment examples, and CI now configure Daphne and Redis. Docker and Redis are not installed in this local environment, so the production container topology has not been executed here. The configured CI container job remains the production-stack check.
