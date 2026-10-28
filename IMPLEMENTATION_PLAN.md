# NV. ServiceFlow V1 implementation plan

1. Create a React + TypeScript + Vite application using Tailwind CSS, an original navy/blue/cyan visual system, responsive navigation, keyboard access, and reduced-motion support.
2. Seed clearly synthetic customers and service jobs. Implement overview metrics, searchable/filterable job cards and tables, customer directory, job creation, repair-stage updates, editable estimates, status preview, printable quotations/receipts, and manual WhatsApp click-to-chat.
3. Keep all demo persistence behind a typed repository. Add a D1 migration and document a fail-closed Workers API design; do not ship an unauthenticated write endpoint or imply working integrations.
4. Add unit and Playwright smoke tests, run type/build/test/browser checks, resolve errors, and document Windows VS Code setup plus Cloudflare Pages deployment and production security requirements.

All records are fictional. Browser storage is a demonstration only. Preserve the literal `NV.` monogram and credit Navod Ravindu Jayaweera.

## Authorized workshop upgrades

1. Add a seven-stage Kanban repair board with desktop drag/drop and equivalent keyboard/mobile stage selectors.
2. Add fictional technician assignments, workload summaries, and combined technician/stage/search filters across board, cards and table.
3. Add serial/asset number, received accessories, device condition, warranty state, and internal diagnostic notes to job creation and editing. Keep these out of customer-facing outputs.
4. Migrate existing version-1 browser records without losing edits or inventing assignments/observations. Extend unused D1 scaffolding, documentation and workflow tests.
