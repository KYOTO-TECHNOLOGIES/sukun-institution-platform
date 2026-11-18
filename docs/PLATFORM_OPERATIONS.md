# Software administration and institution independence

Sukun has two separate administration levels. A **software administrator** manages organizations, commercial plans, trials, invoices, access decisions, and administrator recovery at `/platform`. An **institution administrator** manages the people and records of one institution. Institution administrators are never Django superusers. Platform API sessions cannot use institution data APIs; use an appropriately authorized institution account for institution work.

## Try it locally

Run `python scripts/dev.py seed` to migrate and prepare the existing local demo. The seed preserves existing institution records and passwords. Start both services with `python scripts/dev.py dev` if they are not already running. Open `http://127.0.0.1:5173`.

The software administrator phone is `+919900009001`. Its generated password, along with the institution role logins, is stored only in the ignored `.local/DEMO_ACCESS.md`. The demonstration plan and sample invoice are examples, not suggested commercial prices. Never seed a production database.

## Bootstrap a production operator

Run migrations before starting the updated server. In the configured backend environment:

```sh
python manage.py migrate --noinput
python manage.py create_platform_admin --phone +COUNTRY_CODE_AND_NUMBER --name "Software administrator"
```

The command prompts for a password. For unattended bootstrap, supply `PLATFORM_ADMIN_PASSWORD` through a secret manager or environment, not a shell argument. Existing accounts are never overwritten or elevated. Public institution registration defaults to disabled; keep `ALLOW_INSTITUTION_REGISTRATION=False` for operator-managed onboarding.

Existing institutions receive an active, custom subscription during migration, with no invented expiration date or charge. Configure their plans and commercial terms explicitly in the console. PostgreSQL is required for production seat limits and concurrent billing transactions; SQLite is a local development option.

## Onboard and operate an organization

1. Create an active plan with currency, monthly reference price, active student limit, and active login-account limit. Login seats include students, staff, and guardians. Price changes do not rewrite issued invoices or automatically charge anyone.
2. Choose **New organization**, fill in its institution details and administrator login, and select a trial of 1–90 days. Share the temporary password through your established secure onboarding channel. The administrator must change it before opening institution modules.
3. Create an invoice with the agreed subtotal, explicit tax amount, currency, due date, and service period. The application is not a tax rules engine. Configure the legal issuer details before issuing real invoices.
4. After independently verifying receipt, use **Record decision** with a unique, provider-prefixed bank reference. Paying an invoice extends the paid-through date and activates a trial. Payment recording does not itself initiate a card or bank charge. Incorrect invoices can be voided and reissued; paid financial history is retained.
5. Manage the grace period and overdue policy per organization. Access restrictions are evaluated on API requests, so trial expiry and overdue enforcement do not require a scheduler. Dates are inclusive: a 7-day grace period blocks the day after the seventh grace day.
6. Use **Access** to suspend, cancel, or activate an organization with a recorded reason. Suspension blocks institution APIs, exports, protected media, and live notification delivery; records remain retained. Administrators and principals can still review their own subscription and invoices. Students and staff see a recovery explanation. Restoring ACTIVE also reactivates a deactivated institution; unpaid invoices and expired service still apply.
7. Use **Login recovery** only after verifying the institution owner's identity. Select an institution administrator, set a new temporary password, and record the verification reason. Existing sessions are invalidated. Reactivation is an explicit option and still checks the seat limit. No credentials are written to audit records.

Recording a payment never silently reverses an explicit suspension or cancellation. Review the cause and make a separate access decision. A failed payment suspends an organization only when **Suspend after a recorded payment failure** is enabled. Otherwise, the unpaid invoice remains subject to the normal overdue policy. Billing retries use an event UUID and cannot double-settle an invoice. Operator actions are append-only through the API; database administrators remain capable of changing the database, so this is not a tamper-proof external ledger.

## Billing integration

`POST /api/saas/billing-events/` is a signed integration boundary for your trusted payment-provider adapter. It is disabled until `BILLING_WEBHOOK_SECRET` contains at least 32 characters. It is not a direct Stripe/Razorpay webhook and does not initiate payments. Your server-side adapter must verify the chosen provider’s native signature and payment status, map the event to an issued Sukun invoice, and then sign the Sukun request. Do not place this secret in the browser.

Send UTF-8 JSON with these fields:

```json
{
  "event_id": "a-stable-UUID-for-this-provider-event",
  "invoice": "the-issued-Sukun-invoice-UUID",
  "outcome": "PAID",
  "amount": "5310.00",
  "currency": "INR",
  "reference": "provider:unique-payment-id",
  "reason": "Provider confirmed full settlement"
}
```

Use `PAID` or `FAILED`. A trusted adapter cannot void invoices. The amount must equal the full issued total including tax, and the currency must match exactly. Partial settlements require operator reconciliation outside this endpoint.

Set `X-Sukun-Timestamp` to the current Unix timestamp in seconds. Set `X-Sukun-Signature` to the lowercase hex HMAC-SHA256 of `timestamp + "." + exact_raw_request_body`, using the shared secret. The server accepts a maximum five-minute clock difference and an 8 KB body. Use synchronized clocks. Keep the event UUID and payload stable on retries, but refresh the timestamp and signature. A reused UUID with changed payment facts is rejected. Reference uniqueness is enforced in the database for paid invoices. Rotate the shared secret through deployment secrets; never log the secret or full signed headers.

The endpoint responds with invoice ID, status, and event ID. Retry transport errors with backoff. Investigate validation errors rather than altering payment amounts to force acceptance. A `503` means the integration is not configured. No live provider has been connected in this checkout.

## Institution map and setup

The React Flow map at `/hierarchy` reads institution-scoped curricula, classes, and divisions, with active enrollment counts, capacity, rooms, and permitted teacher details. It supports pan/zoom, selection, collapsed class branches, search, and a hierarchy-table alternative. Source records remain editable in their directories; moving graph geometry does not change academic relationships. The graph is bounded to 150 classes and 600 divisions and explicitly reports truncation; use full directories for larger institutions. The API supports a `class_id` filter.

The dashboard’s setup checklist derives its state from real academic years, divisions, teachers, assignments, students, and timetables. Decorative 3D campus geometry uses CSS, no WebGL dependency, and respects reduced-motion preferences.

## Assistant and privacy

**Ask Sukun** is available inside an institution. Its local mode uses curated workflow help and permission-filtered live overview metrics. Learners receive portal guidance rather than institution-wide metrics. Questions and chat transcripts are not stored by the application; closing the panel clears the browser’s conversation state.

Optional generative AI requires all three conditions:

1. The deployment has `OPENAI_API_KEY` and an explicitly selected `ASSISTANT_MODEL` supporting the Responses API.
2. The institution administrator enables external AI in **Subscription & usage**. Principals and software-operator updates cannot grant this consent through their ordinary subscription endpoints.
3. The person using the assistant selects **Use external AI** for their requests.

The automatic provider context contains only the role, date, permitted aggregate metrics, and curated help. It excludes institution names, student names, contact details, record identifiers, alerts, and chat history. The current question itself is sent, so users must avoid entering personal information. No model tools, browsing, file access, or mutation functions are exposed. Answers render as plain text; clickable source links come from a server-controlled list. Verify important AI statements in the source application.

The adapter calls the [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create) with `store=false`, bounded input/output, an HTTPS-only fixed endpoint, a timeout, and no redirects. `store=false` is not a promise of zero provider retention; review the provider’s data controls and your institution’s obligations before enabling it. No API key has been supplied and no live model call was made during this implementation. Provider behavior was verified with mocked success, timeout, consent, privacy, and quota tests.

`ASSISTANT_DAILY_LIMIT` defaults to 100 external attempts per institution. Attempts, including failed calls, consume allowance. Request and token totals are stored without prompt content and shown in subscription usage. The counter uses database transactions, so it is shared across API workers. External failures or exhausted allowance fall back to local guidance. Per-user request throttles additionally apply. Production throttles use the Redis cache, configurable through `CACHE_URL` or `REDIS_URL`.

## Deployment and remaining operational work

Set `BILLING_BUSINESS_NAME`, `BILLING_BUSINESS_ADDRESS`, `BILLING_SUPPORT_EMAIL`, and `BILLING_TAX_ID` to your legal issuer details. Issued invoices capture these and the bill-to details as snapshots. Print or save a PDF using the browser’s print command. This implementation does not certify a jurisdiction’s invoice numbering, tax, payroll, or records-retention requirements.

Follow [DEPLOYMENT.md](DEPLOYMENT.md) for HTTPS, PostgreSQL, Redis, backups, restoration drills, and monitoring. Do not expose Vite to the internet. The production frontend is static content served by Nginx; Django/Daphne handles the API. Real payment-provider wiring, production credentials, email/SMS delivery, MFA/SSO, host-level load tests, restoration exercises, and institution acceptance remain deployment or integration tasks. Automated billing periods and recurring card charges are not implemented; the operator explicitly issues invoices and service periods.

The npm audit run on 18 November 2026 reports 23 high entries through the `picomatch` dependency chain after compatible updates and the UUID patch. The [upstream advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) lists no patched release. In this application the chain is build/development tooling, not a production Node server; never accept untrusted glob patterns or expose build tooling as a public service. This is a remaining supply-chain finding, not a clean security audit. The [UUID advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq) is addressed using the compatible 11.1.1 override. Recheck advisories before each production release.
