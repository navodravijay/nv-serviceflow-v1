# NV. ServiceFlow V1

The final client-ready demo release (**1.1.0**) of an original responsive service-management portfolio prototype for **NV SHARP SOLUTIONS**, created by **Navod Ravindu Jayaweera**. The literal **NV.** monogram is preserved throughout. React, TypeScript, Vite, Tailwind CSS v4, and Lucide icons; no external fonts or image services are needed. [Demo walkthrough](docs/DEMO_WALKTHROUGH.md) · [Verification notes](docs/VALIDATION.md).

**Prototype, not production software. All customer and service records are synthetic.** There is no implemented authentication, server, D1 connection, payment collection, public tracking portal, or automatic messaging. Use fictional data only. Demo edits stay in this browser's localStorage, not a cloud database.

## Launch in Windows VS Code

Use Node.js **24 or newer**, or **22.13+ within the 22.x line**, and VS Code. Open this project folder with **File → Open Folder**, then **Terminal → New Terminal**. The schema tests use built-in `node:sqlite`, which is unflagged from Node 22.13 and 23.4 onward; see [Node's SQLite documentation](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html). In PowerShell:

```powershell
cd "D:\Codex Projects\NV. ServiceFlow V1"
npm.cmd ci
npm.cmd run dev
```

Open **http://127.0.0.1:5173** (or the port Vite prints). Leave the terminal running; stop it with **Ctrl+C**. `npm.cmd`/`npx.cmd` work in PowerShell without changing execution policy. The commands also work from the VS Code Command Prompt terminal with the `.cmd` suffix. An internet connection is required for the initial dependency/browser downloads. `package-lock.json` pins the installed dependency tree; use `npm.cmd install` when deliberately changing dependencies.

## Explore the demo

- **Overview:** actual job counts, pickup/approval-stage totals and estimated pipeline. The selectable 7-day/4-week chart is calculated from saved received records and known delivery events through the disclosed sample day, 28 October 2026. Unknown delivery timestamps are excluded. Pipeline includes active job estimates, including demo-paid jobs; it is not revenue or an outstanding balance.
- **Service jobs:** opens a seven-stage Kanban repair board. Drag a job to another column on desktop, or use the **Move to stage** selector on each card with a keyboard or mobile device. Scroll horizontally inside the board to reach every stage. Table and card views remain available. Search by ID, device, serial/asset number, issue or customer; combine stage and technician filters. All stage changes go through the repository and appear in local demo history. The board shows matching jobs; moving a job outside a selected stage filter removes it from the current results. The stage order does not constitute verified customer approval.
- **Technician assignments:** three fictional technicians have specialty labels and active-job counts. Click a team workload card or use **Filter by technician**, including **Unassigned**. Open a job to change or clear its assigned technician, then choose **Save assignment**. Assignments are also available when creating a job. These profiles are demonstration staff records, not authenticated users or permission grants. Workload counts include all active stages; filters show matching jobs including delivered work.
- **Device intake:** expand **Device intake details** when creating a job, or **Device intake & diagnostics** in its workspace. Record a fictional serial/asset number, accessories, condition/condition notes, warranty state and diagnostic notes. Choose **Save intake details** after editing. Serial numbers are searchable internally. No passwords, files or photo uploads are collected. Intake, notes and technician names are omitted from customer previews, printable quotations/receipts and prepared WhatsApp messages. This is presentation separation inside a local demo, not server-enforced access control.
- **Customers:** searchable fictional profiles. Add a fictional name/company; the demo supplies an example.com address and does not collect live contacts. Use **View jobs** to filter that person's jobs.
- **New service job:** choose a customer, device category, issue, priority, completion date, estimated costs, optional technician and intake details. New jobs start at Received.
- **Quotations and receipts:** save an estimate, then **Issue demo quotation** to capture its price, device/service details and fictional customer in a numbered revision. Record a clearly labeled **demo approval** or **demo decline**. These are local operator simulations, not verified customer consent or messages. Changing prices supersedes the old revision without changing its saved amounts. Print any revision, including its superseded label. Once a quote exists, the current unchanged revision must be demo-approved before advancing into repair/quality/pickup/delivery or recording payment. Legacy jobs with no issued quote retain the original workflow. **Record demo payment** marks the full saved total paid, locks pricing and enables a receipt; it collects no money. Paid/zero-value jobs cannot issue new quotations. Use the browser print dialog to print or save PDF; choose A4 and disable browser headers/footers if desired. Documents prominently say synthetic demo and are not tax invoices.
- **Parts inventory:** searchable synthetic catalog, on-hand quantities, reorder levels and unit costs. Filter low/empty stock, add a uniquely coded part, or make a signed stock adjustment with a reason. In a job, expand **Parts used from inventory** to consume stock or return an unused entry once. Delivered jobs are closed to usage changes. Stock usage and historic unit costs are separate from customer pricing and never silently alter an estimate or quote. Movement history shows the latest 12 entries; full history is in JSON backups. No purchasing or supplier integration exists.
- **Reports:** figures come from saved records. Combine inclusive received-date filters (Asia/Colombo) with All/Active/Delivered scope. Review demo-paid totals, unpaid estimates, pending quote revisions, stage/category counts and observed turnaround for delivered jobs with known events. Paid totals follow the selected jobs, not payment dates, and are not revenue. Export the matching job register as CSV; internal notes and customer contacts are excluded, and spreadsheet formula prefixes are neutralized.
- **Data & backups:** download a complete unencrypted synthetic workspace as JSON, including internal notes. Choose an exported JSON file up to 5 MB to validate a preview; choosing a file changes nothing. Confirm replacement before restoring. Unsupported versions, unknown fields, invalid dates/amounts, duplicate IDs, bad references and inconsistent stock balances are rejected. Invalid files and failed storage writes leave current data intact. Validation is not proof of authenticity; this is not a secure audit archive or cloud backup. Export your edits before reset/restore.
- **Customer preview:** select a job to see its repair stage, device, cost and estimated completion without customer contact details. This is a local simulation, not a public/shared tracking URL. Earlier stage markers indicate workflow order, not verified approval history.
- **WhatsApp:** from a job, enter your own test number, prepare a message, then **Open WhatsApp**. Review and send manually in WhatsApp. Numbers are not saved. Seed phone numbers use the reserved fictional `+1 202 555 01xx` range, and the app does not attempt to contact them. No automated messages or API integration exists.
- **Demo settings:** restore the synthetic seed data after acknowledging that needed edits have been exported. This replaces local edits in this browser. There is no multi-tab/user sync; reload other tabs after changes. The sample workspace date is **28 October 2026** for consistent overdue labels; new history uses the real clock and displays Sri Lanka time. If storage is unavailable the UI identifies session-only mode. Storage write failures show an error and leave existing data intact.

Keyboard features include a skip link, visible focus indicators, native modal focus trapping/Escape, and Ctrl/Cmd+K job search. Decorative motion respects `prefers-reduced-motion`. Browser support targets current Chromium, Firefox and Safari; automated smoke tests run Chromium desktop and mobile emulation, not real devices or all browser engines.

Existing version-1 and version-2 browser data is upgraded automatically in memory and saved in version-3 form on the next successful edit, under the same `nv-serviceflow-demo-v1` storage key. Existing customers, jobs, payments and history are preserved; version-2 intake and assignments are preserved too. Version-1 intake starts blank/unassigned. No quotation approvals or historical stock usage are invented. The new inventory starts from the clearly fictional catalog. Fresh seed data includes fictional assignments and example intake records. Resetting is optional and replaces edits. After updating a running development server, press **Ctrl+Shift+R** to load the new schema and controls.

## Checks

```powershell
npm.cmd run check
npm.cmd run test:install
npm.cmd run test:e2e
```

`check` runs TypeScript, Vitest and the production build. `test:install` downloads Chromium to the ignored `.cache/ms-playwright` directory. `test:e2e` builds the app, starts Vite's production preview automatically on port **4173**, and exercises desktop and mobile layouts, job discovery, persistence, stage/estimate editing, customer/job creation, customer preview, quotation/receipt printing, manual WhatsApp URLs, and reduced motion. Browser tests use one worker to limit memory use. They never send a WhatsApp message. On a clean checkout run `npm.cmd ci` first. Optional: `npm.cmd run test:e2e:ui` opens the Playwright runner. Build artifacts, browser caches, test reports and PDF samples are ignored by Git.

The browser suite also covers desktop board drag/drop, mobile stage selectors, keyboard focus retention after moving a card, technician filtering/assignment persistence, and creating/editing intake details without including them in customer-facing outputs. Unit tests cover preserving legacy browser records and the second proposed D1 migration.

Final release coverage also includes quote revisions/approval/superseding, stock creation/adjustments/usage/returns, scoped report downloads, validated backup previews and confirmed restores, failed writes, and all three proposed D1 migrations. Tests never contact customers, collect money or send messages.

The browser runner uses Chromium's newer headless engine, one worker, software rendering and reduced motion for stable workflow checks. A dedicated check switches both motion preference states. `npm.cmd run test:install` installs the required Chromium build. See [verification notes](docs/VALIDATION.md) for the final results and testing limits.

To view the built application:

```powershell
npm.cmd run build
npm.cmd run preview
```

## Structure

```text
src/App.tsx                 Application shell, navigation and views
src/components/             Shared UI, forms, job detail, printable document
                            Kanban board, team workload, internal intake fields
src/styles.css              Original visual system, responsive/motion/print CSS
src/lib/domain.ts           Types, money, filtering, stages and manual chat links
src/data/seed.ts            Canonical synthetic application seed
src/data/technicians.ts     Fictional technician seed
src/data/inventory-seed.ts  Synthetic parts and opening stock movements
src/data/repository.ts      ServiceRepository contract and local demo adapter
src/data/validation.ts      Bounded schema checks and v1/v2 → v3 migration
src/lib/backups.ts          Validated JSON import/export and local downloads
src/lib/reports.ts          Saved-record reports, chart series and safe CSV
src/**/*.test.ts            Domain and repository unit tests
tests/smoke.spec.ts          Playwright desktop/mobile and drag/drop workflow tests
public/_headers             Cloudflare Pages static security headers
database/migrations/        Proposed tenant-scoped D1 schema
database/seed-demo.sql       Optional isolated local D1 seed matching the app
docs/PRODUCTION.md          Future backend and security requirements
```

## Cloudflare Pages compatibility

The application builds to static files and requires no Node.js server in production. In a Cloudflare Pages Git project select the Vite preset, use **`npm run build`**, and output directory **`dist`**. Set a compatible Node version in the build environment. The application uses in-memory view navigation, so no client route rewrites are required. `_headers` is copied into `dist` automatically. No deployment, account connection, or hosting claim is made by this project. See [Vite's Pages deployment instructions](https://vite.dev/guide/static-deploy#cloudflare-pages).

For secure persistence, implement a same-origin Worker/Pages Function and replace the demo repository with a credentialed HTTP adapter. Keep D1 bindings and secrets server-side. The provided migration/SQL seed are **unused scaffolding**, not a connected database; apply them only to an isolated local/staging D1 instance after configuring your own tooling and bindings. No Wrangler configuration with fake resource IDs is shipped. The future API must enforce identity, roles, tenant/object scope, validation, rate limits and audited atomic writes before accepting real records. [Production guidance](docs/PRODUCTION.md) describes the contract and required testing.

## Known prototype limits

No production security guarantees, real transactions, tax calculations, verified customer consent, refunds, attachments, live notifications, multi-user consistency, or verified SLA deadlines. Demo events/decisions can be edited through browser storage and are not a secure audit log. Reset/restore replace records without undo; export first. JSON backups are limited to 5 MB. Storage is intentionally one browser workspace; a future backend should paginate and use concurrency controls rather than loading all customer records. Baseline security headers and validation help the prototype, but do not make it production-ready. The NV. mark here is text because no separate source brand artwork was supplied.
