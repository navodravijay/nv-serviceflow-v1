# Prototype verification — 28 October 2026

Final client-ready demo release **1.1.0**. This records the final completed checks, including the quotation, inventory, reporting and backup upgrades.

- TypeScript project check: passed.
- Vitest: **54 tests passed** across domain logic, browser repository behavior, legacy migration, assignments/intake, quotation revision rules, stock usage/returns, backup validation/restore, report totals, CSV safety and proposed database schema checks.
- Vite production build: passed; output in `dist/`.
- Playwright: **22 tests passed** in the final run, one worker, Chromium desktop and Pixel 7 emulation, against the production build. The final run completed successfully in 41.4 seconds.
- Desktop PDF generation and print styling: verified; sample output is ignored under `test-results/`.
- Responsive visual checks: no document-level horizontal overflow at 320, 375, 768, 1024, 1440 and 1920 pixels, including the new board. Wide job tables and the seven-stage board intentionally scroll inside their panels.
- Visually reviewed dashboard, Kanban repair board, technician workload, intake forms, job dialog, mobile customer status preview and printable quotation. Reduced motion, keyboard dialog activation/Escape and focus retention after a board move are exercised by smoke tests.
- Desktop drag/drop, mobile stage selection, combined technician/stage filtering, assignment persistence, intake create/edit/reload, and exclusion of internal intake/technician details from customer previews and quotations: passed.
- Issued quote snapshots, superseded revision printing, renewed demo approval after price changes, stock adjustments/usage/one-time returns, scoped CSV downloads, backup previews, invalid-import rejection and confirmed restores: passed on desktop and mobile emulation.
- Existing v1/v2 jobs, financial state, history and v2 intake/assignments are preserved by the tested schema-v3 migration. No old approvals or stock usage are invented. All three proposed D1 migrations and the synthetic seed apply successfully in local SQLite; tenant references and numeric/enum constraints were checked.
- Inventory, report and backup layouts were visually inspected. All three views have no page-level horizontal overflow at 320, 375, 768, 1024, 1440 and 1920 pixels; the inspection recorded no page JavaScript errors.

Initial checks identified and resolved exact form-label lookup issues and a visually hidden table heading that caused mobile page overflow and shifted native dialog hit targets. Restricted-runner resource/entropy errors were resolved by completing final build/browser verification outside the restricted runner with a single browser worker.

Final release checks also resolved ambiguous cost-panel test selectors, native drag handling that depended on React render timing, and an HTML SKU pattern incompatible with modern Unicode-set regex parsing. The final browser configuration uses Chromium's newer headless engine, software rendering and reduced-motion workflow tests for repeatable execution on this Windows machine. A dedicated test switches between both motion preferences and checks the expected animation styles. Hardware-accelerated rendering performance was not benchmarked.

These results cover the synthetic browser prototype. SQL checks use local SQLite, not a deployed D1 database. No production authentication, authorization, Worker endpoint, payment or messaging integration was tested because none is implemented. Cross-browser, real-device, manual screen-reader and production security reviews remain future work.
