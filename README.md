# Sukun Institution Platform

An institution management and learning platform built with Django REST Framework, React, TypeScript and PostgreSQL. The repository contains the original application plus the implemented institution workflows and redesigned role-based workspace.

## Run locally

Prerequisites: Python 3.13, Node.js 22.

```sh
python scripts/dev.py setup
python scripts/dev.py api
```

In a second terminal:

```sh
python scripts/dev.py web
```

Open **http://127.0.0.1:5173**. Generated demo credentials for all roles are in **`.local/DEMO_ACCESS.md`**. Setup uses an isolated demo database, preserves an existing demo institution and never resets existing passwords.

For a step-by-step institution setup and daily operations walkthrough, read the [Operator guide](docs/USER_GUIDE.md).

## Workflows

| Area | Features |
| --- | --- |
| Marketing | Campaign budgets/spend, enquiry stages, scheduled follow-ups, lead sources |
| Admissions | Applications, document verification, approval/rejection, capacity-checked student enrollment, optional guardian login |
| Academics | Academic years, classes/divisions, subjects, teaching assignments, timetable conflict checks, student/guardian directories |
| Learning | Courses, ordered lessons, resources/video links, enrollments, assignments, teacher grading, quizzes with attempt limits and automatic marking |
| Student and parent portals | Course progress, homework, attendance, published results, fee balances and addressed notices; parents have read-only access to linked children |
| Fees | Fee structures, student bills, payment collection, printable receipts, refunds, balance reconciliation, overdue alerts and exports |
| People | Teacher profiles, staff attendance, leave requests/approval, monthly payroll preparation/approval/payment recording |
| Operations | Expense approvals, library stock and loans, assets, transport and hostel allocations, support tickets, visitor queues |
| Leadership | Role-specific dashboard, enquiry funnel, overdue follow-ups, fee/attendance/grading alerts, CSV reports and activity audit |
| Access | Administrator, principal, teacher, student, parent, marketing, admissions, accountant, librarian, HR and front-desk roles; per-user module permission overrides |

Institution boundaries are enforced by the API, including related objects. Sensitive workflows use database transactions and PostgreSQL row locks. Historical payment and learner records are protected from accidental cascading deletes. Browser sessions use HttpOnly cookies with CSRF protection; passwords are validated and changes invalidate existing sessions.

## Repository

- `institution_management_application/sukun_lms/`: Django API, migrations, regression tests and demo seed.
- `sukun_lms_frontend/`: React workspace, role portals and Playwright browser tests.
- `scripts/`: isolated local setup and SQLite backup helpers.
- `deploy/`, `compose.yaml`: Nginx/Gunicorn/PostgreSQL deployment configuration.
- `docs/`: operational instructions and implementation progress.

The original queue project remains untouched and is excluded from this repository. Its templates informed the initial application; the new workspace uses the Sukun visual design.

## Checks

```sh
python scripts/dev.py test
cd sukun_lms_frontend
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests need the local API/frontend and seeded demo running. They exercise real login, role access, student submission, enquiry creation and responsive navigation. CI checks API tests with PostgreSQL and compiles the frontend.

## Production

Read [Deployment and operations](docs/DEPLOYMENT.md) for container setup, HTTPS, secrets, database migration, backups and release steps. PostgreSQL is required for production concurrency guarantees. This repository is a substantial working application, not a certification of readiness for every institution: real hosting, restoration drills, load testing and institution acceptance remain deployment tasks.

Payment gateways, outbound SMS/email/WhatsApp, statutory payroll and hosted live classes are integration boundaries; current payments record staff-confirmed collections and notices are in-app. See [Progress](docs/PROGRESS.md) for delivered features and [Validation](docs/VALIDATION.md) for verification evidence and remaining work.
