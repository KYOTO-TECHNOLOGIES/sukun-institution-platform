# Implementation progress

## Baseline

Existing Django apps cover institution settings, academics, students, staff, attendance, exams, seating, homework, finance, library and communications. The React frontend includes pages for these domains. Baseline Django system check passes.

## Delivery sequence

1. Repository setup and baseline snapshot.
2. Secure onboarding, institution isolation and role permissions.
3. Marketing campaigns, enquiries, follow-ups and admission conversion.
4. Course content, learner enrollment, lesson progress and assessment workflow.
5. Finance, attendance and operational workflow validation.
6. Dashboard reports, UI integration, demo setup, deployment and regression checks.

Each completed feature is committed and pushed independently. Known limitations and test results will be added as implementation proceeds.

## Secure foundation
- Prevented registration from overwriting existing accounts and required validated passwords.
- Enforced institution boundaries on reads, updates and related records, including exam seating.
- Added module permissions for administrators, teachers, accountants and librarians; unassigned and learner accounts cannot browse staff APIs.
- Protected cookie-authenticated writes with CSRF and removed browser-readable refresh-token persistence.
- Verification: all 17 backend tests pass; baseline frontend production build passes (large template bundle warning).


## Marketing and admissions
- Campaigns with budgets and channels, enquiry pipeline, follow-up completion, searchable paginated screens.
- Document verification, reviewed decisions and transactional student enrollment with class-capacity and duplicate-account checks.
- Enrollment creates student login, optional separate guardian login, and applicable mandatory fees.
- Added marketing, admissions and HR roles; UI permissions now come from the API.
- Verification: 23 backend tests pass, including enrollment idempotency and marketing role restrictions.


## Learning and family portal
- Course authoring, ordered lessons, resource links, enrollments, assignments, grading, quiz questions and automatic scoring.
- Student/parent portal for learning, homework, fees, attendance, published results and addressed notices.
- Teachers are limited to their assigned courses; guardians can review but cannot submit student work.
- Verified lesson completion idempotency, hidden drafts/answers, quiz attempt limits, grading bounds and learner isolation (7 learning regression tests).


## Finance and library operations
- Added immutable collections, printable receipts, refund register, balance reconciliation, overpayment prevention and duplicate-reference checks.
- Corrected mandatory fee assignment to the matching institution and academic year.
- Library stock updates transactionally on issue and return; return is idempotent and loan history is preserved.
- Added domain checks for class membership, timetable conflicts, exam marks and date ranges.
- Verification: 35 backend tests pass. Updated TypeScript DOM library configuration for browser form APIs.

