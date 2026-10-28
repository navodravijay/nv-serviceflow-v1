# Production architecture proposal

**This is guidance for a future implementation, not a description of implemented security.** The shipped application is a public, browser-only portfolio prototype. There is no login, Worker API, D1 binding, payment processor, public tracking endpoint, or messaging provider. Do not put real customer data in this build or treat an “Admin” label as authentication.

## Trust boundary and deployment

```text
React on Cloudflare Pages
  └─ HTTPS same-origin /api/* → Worker or Pages Function
       ├─ identity/session verification → membership + role + tenant
       ├─ rate limiting, schema validation, CSRF checks
       ├─ tenant-scoped service layer → D1 binding (server only)
       └─ atomic job mutation + append-only audit event
```

Replace `DemoRepository` with an HTTP adapter implementing `ServiceRepository`, or a paginated successor to it. The demo loads a complete snapshot; a real service should paginate and minimize fields. Keep server DTO schemas in a shared package, while database bindings and secrets live in Worker code only. A browser must never receive D1 account credentials, API tokens, signing keys, or SQL access. Anything prefixed `VITE_` is public build-time configuration, never a secret. Use Worker secrets/bindings, distinct dev/staging/production resources, restricted CI tokens, and secret scanning. Do not sync demo localStorage into production.

Pages can serve the Vite `dist` directory. Add a same-origin Worker route or Pages Function for `/api/*` only after security gates exist. If no API is deployed, keep the demo adapter selected; do not silently send data elsewhere. API routes must return JSON 401/403/404 rather than falling back to SPA HTML. For authenticated responses use `Cache-Control: no-store`, prevent shared CDN caching, and vary only where required. Keep credentialed CORS disabled unless a precise origin allowlist is necessary.

## Authentication and session handling

Use an established OIDC provider or a validated Cloudflare Access setup. For Access, verify JWT signature, issuer, audience, expiry, and allowed algorithms at the Worker; do not trust identity headers directly. Use supported key rotation/JWKS handling. Require MFA for privileged users. For an application session, use short-lived, rotated opaque tokens with `Secure`, `HttpOnly`, and appropriate `SameSite` cookies; never store access tokens in localStorage. Implement logout/revocation, inactivity and absolute expiry, and session-fixation protection. Validate CSRF tokens and request Origin on cookie-authenticated writes. Do not ship a cosmetic login screen in place of this.

## Authorization and data isolation

Resolve tenant and membership from the verified identity for **every request**, never from a client-supplied tenant ID. Deny by default. Suggested roles: viewer reads permitted records; technician reads and changes assigned repair stages/notes; admin manages customers, quotes, payments and memberships. Validate object-level access for every job, customer, document, and event. A guessed `NV-1048` is not permission. D1 does not supply application row-level authorization; every query needs a tenant predicate.

`database/migrations/0001_initial.sql` proposes composite tenant foreign keys, stage/cost constraints, membership, token and audit tables. It does not implement authorization. Public status must use a **separate allowlisted response** excluding customer names, contacts, private notes, payments, and internal IDs. Issue at least 128-bit cryptographically random, expiring, revocable tracking tokens; store only a hash; rate-limit lookup and return uniform not-found responses. Use `Referrer-Policy: no-referrer` and avoid logging tokens. The shipped local preview is not public access control.

The prototype now includes fictional technician assignments, a Kanban board, and internal device intake. `0002_workshop_intake.sql` extends the proposed schema with tenant-scoped technicians, assignments and a separate intake table. Apply migrations in numeric order before the optional SQL seed. Technician records are not authentication identities; a future backend must explicitly map verified subjects to allowed assignments, check tenant membership, and enforce who can assign or change repair stages. Drag/drop and stage selectors must use the same authorized mutation endpoint; the UI must never bypass transition or approval rules. A technician workload filter is not an access boundary.

Keep serial numbers, accessories, condition observations, warranty state and diagnostic notes restricted to authorized staff. Validate their lengths/enums server-side, reject device passwords, redact note contents from audit summaries, and apply retention rules. The local UI intentionally omits these from customer status, printed documents and prepared messages; production must omit them **before serializing responses**, rather than downloading all fields and hiding them. Test tracking/document response schemas for these exclusions. Assignment and intake changes should produce actor-attributed audit entries atomically with the update, without logging free-text note contents. The provided migration and synthetic tests exercise constraints only; no server enforcement is implemented.

## Validation and business rules

Validate parsed bodies server-side with a strict schema: reject unknown keys, constrain UTF-8 byte sizes, enforce content type, limit body size (for example 16 KiB for these text records), and validate identifiers, real calendar dates, lengths, enum values, integer money ranges, currency, pagination and sort options. Never trust frontend validation or localStorage. React renders strings as text; continue avoiding raw HTML and unsafe URLs. Parameterize SQL with `prepare(...).bind(...)`; never concatenate client input, sort columns, or filters into SQL. Allowlist dynamic sort fields.

Agree on permitted repair transitions, explicit customer approval, quote revisions, taxes, device identifiers, collection consent, and cancellation rules before launch. The final demo records local operator-simulated approval/decline, keeps quotation amount snapshots and supersedes approval after price changes. Once a quote exists, later repair stages/payment require a current demo-approved revision. This is local business logic, not verified customer consent or server authorization; old jobs without quotations retain the original workflow. Freeze issued documents server-side with immutable line-item snapshots and unique identifiers. A real receipt must reference a verified payment event, not a client `paid: true` flag. Verify payment webhooks, deduplicate by provider event ID, and reconcile amounts/currency. Keep reversals and refunds auditable. All costs in the prototype are integer minor units in LKR; it performs no tax calculation.

`0003_quotations_inventory.sql` proposes tenant-scoped quotations, parts, job stock usage and movement tables. It does not implement the required atomic service layer. In a real backend, condition stock changes on available balance and expected revision, then atomically record usage/returns, movement and audit entries. A zero-row conditional update must become an explicit conflict/error; merely placing SQL statements in a batch does not validate business conditions. Use unique idempotency keys and enforce one-time returns. Cloudflare documents rollback on a failed statement in a [D1 batch transaction](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch). Keep inventory cost separate from invoiced customer prices, and protect quote decision provenance and immutable financial snapshots server-side.

Local JSON backup validation checks bounded fields, references and balances; it does not authenticate or encrypt exported data. Never use the browser restore function to import into a production tenant. A production import/export service needs explicit permission, tenant scoping, redaction, resource limits, staging/preview, audited atomic application and encrypted retention. Reports and CSV exports require the same authorization as their source records, formula-injection protections and privacy review.

## Concurrency, reliability and rate limits

Use optimistic concurrency (`revision`/`If-Match`) and return 409 for stale writes. Use D1 transactional batch operations to combine a mutation and audit event; use database constraints for uniqueness and invariants. Generate internal IDs server-side rather than `max(id)+1`. Require scoped idempotency keys on create/payment operations. Design bounded retries and safe duplicate handling. The demo has no multi-tab or multi-user synchronization and localStorage is not transactional between tabs.

Apply Cloudflare edge protections plus application limits by authenticated subject, tenant, and source IP. Enforce tighter limits on login, token lookup, expensive search, document generation and writes; cap burst and sustained traffic, return 429 with `Retry-After`, and bound database query work. Do not use a per-isolate in-memory counter as a global limiter. Choose platform rate-limit bindings or consistent shared state where needed. Test behavior through proxies and IPv6, and keep failures generic. Configure request timeouts and observability alerts.

## Audit logs, privacy and operations

Append server-generated audit events including actor, tenant, action, object ID, revision, timestamp, request ID, and a minimal redacted change summary. Separate customer-visible events from security audit logs. Deny normal application users permission to alter audit records; export to a restricted durable destination if stronger tamper evidence is needed. Never log passwords, session tokens, tracking tokens, message content, full customer contacts, or secrets. The prototype's editable local history is not a secure audit log.

Document data retention, consent, export and deletion policies, backup encryption/access, database recovery objectives, restoration drills, incident response and dependency maintenance. Restrict support access and production database console access. Do not collect device passwords in repair notes. WhatsApp click-to-chat sends a number/message to an external service when opened; obtain appropriate consent and minimize contents. Automated WhatsApp messages would require a separate official provider integration and consent controls, which are absent here.

`public/_headers` supplies baseline static security headers, including a same-origin CSP and frame restrictions. Its inline-style exception supports React chart dimensions; tighten with a deliberate strategy before launch. Pages `_headers` do not automatically secure responses generated by Workers/Functions; set headers explicitly there. Add HSTS only with appropriate control of HTTPS across the target domain/subdomains. Validate actual deployed headers and CSP reporting after deployment.

## Required verification before real data

- Unit tests for schemas, money, state transitions, authorization decisions, redaction and document totals.
- Worker integration tests for 401/403, forged/expired identity, tenant isolation, ID enumeration, CSRF, SQL injection, invalid bodies and limits. Use local D1 and a separate staging environment.
- Concurrency/idempotency tests for duplicate creates, parallel quote edits, failed batches, stale revisions and payment webhook replay.
- Rate-limit tests including distributed requests, 429 responses, retry handling, abuse of public tracking and resource exhaustion.
- Audit completeness and sensitive-value log scanning; backup restore and token revocation drills.
- Browser tests for authorized roles and denied operations, keyboard-only workflows, screen readers, mobile layouts, contrast, reduced motion, print pagination, errors and expired sessions. Run automated accessibility scans as well as manual review.
- Dependency and secret scanning, pinned lockfile builds, deployed header checks, and an independent security review.

Current included tests cover the **demo repository, domain logic, and browser workflows only**, not these unimplemented backend guarantees.

## Primary references

- [Vite: deploying to Cloudflare Pages](https://vite.dev/guide/static-deploy#cloudflare-pages)
- [Cloudflare D1 Worker bindings](https://developers.cloudflare.com/d1/worker-api/)
- [D1 prepared statements and bound parameters](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)
- [Cloudflare Pages static deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)
