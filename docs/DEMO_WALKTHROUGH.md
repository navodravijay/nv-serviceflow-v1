# Final demo walkthrough

NV. ServiceFlow V1 · Release 1.1.0 · NV SHARP SOLUTIONS

Created by **Navod Ravindu Jayaweera**. All profiles, staff, jobs, prices and stock are synthetic.

## Open the final version

Open the project in VS Code, run `npm.cmd ci` if dependencies are not installed, then `npm.cmd run dev`. Visit `http://127.0.0.1:5173/` and refresh with **Ctrl+Shift+R** after an upgrade. Existing browser edits are preserved by migration; a reset is not required.

## A five-minute client presentation

1. **Overview:** explain that counters and charts use saved demo records. Show active work, pickup jobs and estimated pipeline. The sample workshop day is 28 October 2026.
2. **Service jobs:** show the seven-column board, table/card toggles, technician workload, search and combined filters. Move a job using drag/drop on desktop or its native stage selector on mobile/keyboard. Open `NV-1048` for a guided example.
3. **Inside the job:** assign a fictional technician. Expand intake to show serial number, accessories, condition, warranty and internal diagnostics. Save a fictional edit. These details stay out of customer-facing outputs.
4. **Quotations:** save a non-zero estimate, select **Issue demo quotation**, then **Record demo approval**. Explain that this is a local operator simulation. Change the estimate, save, and show that R1 is superseded while its original printed amount stays fixed. Issue R2 and record a new demo approval.
5. **Parts inventory:** inspect low-stock items and make a reasoned positive adjustment. Return to the job, expand **Parts used from inventory**, choose an available part and use one unit. Show that stock cost is recorded separately and the customer estimate remains unchanged. Return unused stock once if desired.
6. **Customer preview and documents:** open the local customer preview and show stage/cost/completion estimates without internal notes or contacts. Print the current quote or an older revision. If demonstrating a receipt, record a full demo payment after approval; no money is collected.
7. **Reports:** inspect the saved-data totals and stage/device breakdowns. Filter to Delivered jobs and export the scoped CSV. Explain that paid values are synthetic records and are not real revenue.
8. **Data & backups:** download JSON before changing data. Choose that file again, review its validation preview, and show that the restore button stays disabled until replacement is acknowledged. Restore only if you want to replace the current local workspace.
9. **WhatsApp:** prepare a link with your own test number, review its text, and explain that sending is manual. Do not use fictional customer numbers or claim automatic messaging.

If `NV-1048` was already marked paid in earlier exploration, use a new synthetic job for the quotation flow. If a job has an issued quote, a current demo-approved revision is needed before later repair stages or payment. Jobs without a quote keep the original demo workflow.

## Before sharing

- Use fictional information throughout; JSON backups include internal notes and are unencrypted.
- Test the built files with `npm.cmd run build` and `npm.cmd run preview`.
- Run `npm.cmd run check`, `npm.cmd run test:install`, and `npm.cmd run test:e2e` to reproduce verification.
- A Cloudflare Pages build can serve `dist`. Hosting, production authentication, D1, payment collection and automated messaging have not been implemented or deployed.
- See `PRODUCTION.md` for the separate secure backend work required before real customer use.
