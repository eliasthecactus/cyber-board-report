# cyber-board-report

A local-first web app for creating, editing, presenting and exporting quarterly cyber security board reports.

The app is a client-only Vite/React single-page app. There is no backend, API server, authentication service or database process. Reports are stored in the browser's IndexedDB and the app works offline once it has loaded.

## Local-first model

- All reports and settings stay in the current browser profile.
- The built app is static HTML, CSS and JavaScript, and it installs as an offline-capable PWA.
- Backup and import use JSON files that you download or select yourself.
- There is no multi-user sharing. Use a JSON backup to move data between browsers or machines.
- **Clearing browser site data removes your reports.** The dashboard reminds you to back up when your last backup is older than two weeks. Under **Settings → Storage protection** you can ask the browser for persistent storage, so it won't evict the data when disk space runs low.

## Features

- Guided editor for the board-report sections, with autosave. Unsaved edits are saved when you leave the page and the browser warns before you close the tab.
- Copy a section from the previous quarter's report
- Dashboard with create, duplicate, change quarter, delete (with undo), import and backup
- Slide preview and full-screen presentation mode (arrow keys, Page Up/Down, Home/End)
- Option to hide empty slides; the editor warns when a section has more items than fit on its slide
- Exports:
  - **PDF with selectable text** via the browser's print dialog: vector output, small files
  - **PDF image** (lossless, pixel-exact), downloaded directly
  - **PowerPoint (.pptx)** with native, editable text boxes and charts
- Optional AI writing help (see below)
- English and German interface
- Custom logo and brand colour; text colours are adjusted automatically to stay readable

## AI assistance and privacy

AI help is **off** until you add an [OpenRouter](https://openrouter.ai) API key under **Settings**. When you use an AI action (Fill, Rephrase, Summarize, Extend), the app sends the field text **and the rest of the report** (as context) straight from your browser to OpenRouter and the model provider you selected. Nothing is sent otherwise.

- **Redaction rules** replace sensitive terms (company, product or people names) with placeholders before anything is sent, and swap them back in the answer. Matching ignores case and only replaces whole words; longer terms are replaced first. If you leave the placeholder empty, a neutral token like `[ENTITY_1]` is used.
- **"What's sent?"** under each AI-enabled field shows the exact redacted request before you send anything.
- The API key is stored in this browser only. It is **left out of backups** unless you explicitly tick it when exporting. When importing a backup, AI settings and keys are never preselected.

## Quick start

Prerequisites: Node.js 24 (see `.nvmrc`) and npm 10+.

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint 10 (TypeScript, React hooks, jsx-a11y) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end smoke tests against the production build (Playwright; run `npx playwright install chromium` once) |

The app uses hash routes and relative asset paths, so it works on any static host, including under a sub-path.

## Docker

```bash
docker compose up --build
# or
docker build -t cyber-board-report:local .
docker run --rm -p 8080:8080 --read-only --tmpfs /tmp --tmpfs /var/cache/nginx cyber-board-report:local
```

Open http://127.0.0.1:8080. The image serves the static build with unprivileged nginx on port 8080. It sends a strict Content-Security-Policy, other security headers and gzip. Compose runs the container read-only with all capabilities dropped. The container stores no application data.

## Data backup

**Backup** (dashboard or settings) downloads a JSON snapshot. You choose what to include: reports, display name, logo, colour, AI model and redaction rules, the API key (off by default), and language.

**Import** on the dashboard restores a snapshot or a single exported report. You choose what to restore. If an imported report ID already exists, the import gets a new ID instead of overwriting.

The file format and schema versioning are documented in [docs/data-model.md](docs/data-model.md).

## Security notes

- The app is designed for local use and local browser storage. It has no server-side access control, central backups, audit logs or collaboration permissions.
- The built `index.html` carries a Content-Security-Policy that only allows same-origin resources plus `https://openrouter.ai` for AI requests. The nginx image sends the same policy as a header, plus `frame-ancestors 'none'`. Keep `CONTENT_SECURITY_POLICY` in `vite.config.ts` and `nginx.conf` in sync.
- Imported data is validated field by field. Logos must be image data URLs, so an imported file can't make the app load remote resources.
- Treat exported JSON, PDF and PPTX files as sensitive board material.

## CI, packages and Pages

`.github/workflows/release.yml` (all actions pinned to commit SHAs):

- On pull requests to `main` or `dev`: lint, unit tests, build, `npm audit --omit=dev`, Playwright e2e tests.
- On pushes to `main` or `dev`: the same checks, then publish a multi-arch Docker image (`linux/amd64`, `linux/arm64`) to GitHub Container Registry and deploy GitHub Pages.
- On `v*.*.*` tags and published releases: the checks, then a versioned image.

Image name: `ghcr.io/<owner>/<repo>`, tagged `latest` (default branch), branch name, semver and `sha-<commit>`.

Dependabot (`.github/dependabot.yml`) opens weekly update PRs against `dev` for npm, GitHub Actions and the Docker base images.

### Production and dev deployments

| Branch | GitHub Pages | Docker tag |
|---|---|---|
| `main` | `https://<owner>.github.io/<repo>/` | `latest`, `main` |
| `dev` | `https://<owner>.github.io/<repo>/dev/` | `dev` |

Work on `dev` (or on feature branches merged into `dev`), check it on `/dev/`, then merge `dev` into `main` to release.

GitHub Pages serves one site per repository and every deployment replaces the whole site. So each push to either branch builds **both** branches and publishes them together. Pages also skips a deployment whose build version (normally the commit SHA) was deployed before, which happens whenever `main` and `dev` point at the same commit. The workflow therefore deploys through the Pages API using a marker commit that is unique per run: it has the same tree and is not on any branch. To redeploy manually, run the workflow from the Actions tab on `main` or `dev`.

The dev build is made with `VITE_APP_CHANNEL=dev`. Because it shares the browser origin with production, it:

- uses its own IndexedDB database (`cyber-board-reports-local-dev`), so dev data never mixes with production reports;
- shows a "Development version" banner, "(Dev)" in the tab title and its own PWA name;
- is excluded from production's service-worker navigation fallback, so `/dev/` always loads the dev app.

Setup (already done for this repository): set the Pages source to **GitHub Actions**, and allow both `main` and `dev` under **Settings → Environments → github-pages → Deployment branches**.

## Tech stack

| Layer | Technology |
|---|---|
| App shell | Vite 8 + React 19 |
| Language | TypeScript 6 (strict) |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Persistence | IndexedDB |
| Exports | Browser print (vector PDF), jsPDF + html2canvas-pro (image PDF), PptxGenJS (PowerPoint) |
| Offline | vite-plugin-pwa (Workbox) |
| Icons | lucide-react |
| Tests | Vitest, Testing Library, fake-indexeddb, Playwright |

## Project structure

```text
src/
├── pages/                  # Dashboard, editor, slide viewer, settings
├── components/
│   ├── dashboard/          # Report cards, backup dialogs, backup reminder
│   ├── editors/            # One editor per report section
│   ├── export/             # Export dialog, progress, useReportExport hook
│   ├── slides/             # Slide registry, palette, frame and slide components
│   └── ui/                 # Modal, ConfirmDialog, Toast, AiTextarea, NumberInput
├── lib/
│   ├── storage.ts          # IndexedDB persistence, backup/import
│   ├── reportFactory.ts    # Report creation, validation and schema upgrades
│   ├── useAutosave.ts      # Debounced autosave that never drops edits
│   ├── openrouter.ts       # AI requests and redaction
│   ├── exportPdf.ts        # Image PDF export
│   ├── exportPptx.ts       # PowerPoint export
│   ├── i18n/               # Typed en/de dictionaries
│   └── …
├── styles/globals.css
├── App.tsx
├── main.tsx
└── types.ts
e2e/                        # Playwright smoke tests
docs/data-model.md          # Report and backup file format
```

## Translations

UI text lives in `src/lib/i18n/en.ts` (the source of truth) and `de.ts`. Keys are type-checked: using an unknown key, or leaving a German key missing, fails `npm run typecheck`. For counts, add `key.one` / `key.other` variants and call `t("key", { count })`.

## License

[MIT](LICENSE)
