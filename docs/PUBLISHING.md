# Publish the synthetic demo to Cloudflare Pages

This guide publishes static release **1.1.0**. It does not add a backend, real customer access, payment collection, or automatic messaging. All uploaded seed records are synthetic. Browser edits remain in each visitor's own browser and are not uploaded by deployment.

## GitHub → Cloudflare Pages

This route stores the source in GitHub and lets Cloudflare rebuild the public demo after pushes to `main`. A private GitHub repository is supported; repository visibility and website visibility are separate.

1. Create an empty GitHub repository, such as `nv-serviceflow-v1`. Keep README, .gitignore and license initialization unchecked for the first push from this project.
2. Push the source, including `package.json`, `package-lock.json`, `src`, `public`, `index.html` and the Vite/TypeScript configuration. The project's `.gitignore` excludes build output, dependencies, local caches, release ZIPs, test output, credentials and known demo-backup filenames.
3. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git**. Authorize GitHub access to the selected repository and choose it.
4. Configure the build:

   | Setting | Value |
   | --- | --- |
   | Production branch | `main` |
   | Framework preset | Vite / React (or leave unset and enter the settings below) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | Repository root |
   | Node build environment | Set `NODE_VERSION` to `24` |

5. Choose **Save and Deploy**. Use the actual URL returned by the successful deployment. Future pushes to `main` trigger production rebuilds; other branches can produce preview deployments.

Cloudflare supports both private and public GitHub repositories. See its [Git integration guide](https://developers.cloudflare.com/pages/get-started/git-integration/). If you already created a Direct Upload project, create a Git-integrated project for this route rather than assuming its existing upload project has a Git connection.

## Ready-to-upload build

Build with `npm.cmd run build`. Upload **only the contents of `dist`**, including `index.html`, `favicon.svg`, `_headers`, and `assets/`. Never upload the whole project folder, `node_modules`, local backups, credentials, test reports, or caches.

The prepared archive is `release/nv-serviceflow-v1-1.1.0-pages.zip`. Its root contains the built application, not an extra `dist` directory. It contains no localStorage records or exported backups.

## Direct upload through your Cloudflare account

1. Sign in to the Cloudflare dashboard and open **Workers & Pages**.
2. Create a **Pages** project using the direct-upload/drag-and-drop option.
3. Choose a project name such as `nv-serviceflow-v1` and upload the prepared ZIP or the `dist` folder contents.
4. Deploy, then use the exact URL Cloudflare returns. Project-name availability is checked by Cloudflare; no URL is reserved by this repository.
5. Open the deployed site, check the synthetic-data labels, navigate its views, print a quote, and verify response security headers.

Cloudflare supports uploading a prebuilt folder or ZIP through the dashboard. See the [official Direct Upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## CLI publishing

From this folder in VS Code PowerShell:

```powershell
npm.cmd run build
npx.cmd wrangler@4 login --scopes account:read user:read pages:write
npx.cmd wrangler@4 pages project create nv-serviceflow-v1 --production-branch main
npx.cmd wrangler@4 pages deploy dist --project-name nv-serviceflow-v1 --branch main
```

Login opens Cloudflare's browser authorization flow; review and authorize your own account. Do not paste access tokens into this chat or source files. If the project already exists, inspect it and skip creation. If multiple accounts are available, select the intended account before deployment. Use the URL returned by a successful deployment rather than guessing it.

See [Wrangler Pages commands](https://developers.cloudflare.com/workers/wrangler/commands/pages/) for the current CLI contract. This deployment route does not require a Git repository. Direct-upload and Git-integrated Pages projects have different setup paths; choose deliberately if you later want automatic Git deployments.

## After publishing

- Hosting creates a fresh browser origin. Existing localhost edits do not automatically transfer; use a synthetic JSON backup to move your demo records if needed.
- Only use fictional data on the published portfolio demo.
- Baseline Pages headers are included in `_headers`; validate them on the live deployment.
- Keep `docs/PRODUCTION.md` as the separate plan for real authentication, authorization and persistence.
