# cyber-board-report

A local-first web app for creating, editing, presenting, and exporting quarterly cyber security board reports.

The app is now a client-only Vite/React single page app. There is no backend, no API server, no authentication service, and no database process. Report data is saved in the browser on the client side using IndexedDB, with localStorage as a fallback.

## Local-First Model

- All reports and profile settings stay in the current browser profile.
- The built app is static HTML, CSS, and JavaScript.
- Import and backup use JSON files that you download or select manually.
- There is no multi-user sharing. Use JSON backup/import when you need to move data between browsers or machines.
- Clearing browser site data removes the reports unless you have exported a backup.

## Features

- Guided report editor with structured board-report sections
- Automatic local autosave while editing
- Dashboard for create, duplicate, delete, import, and backup
- Slide preview and full-screen presentation mode
- PDF export with `jsPDF` and `html2canvas-pro`
- JSON export for all data or a single report
- Browser-only persistence through IndexedDB

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

### Build Static Assets

```bash
npm run build
```

The production build is written to `dist/`.

### Preview The Build

```bash
npm run preview
```

The app uses hash routes and relative asset paths, so it is suitable for simple local static hosting.

## Docker

Build the image locally:

```bash
docker build -t cyber-board-report:local .
```

Run it:

```bash
docker run --rm -p 8080:8080 cyber-board-report:local
```

Open:

```text
http://127.0.0.1:8080
```

Or use Compose:

```bash
docker compose up --build
```

The container serves the static `dist/` build with nginx on port `8080`. Report data still stays in the user's browser through IndexedDB/localStorage; the container does not store application data.

## Data Backup

Use **Backup** in the dashboard or profile page to download a JSON snapshot containing:

- profile settings
- all local reports

Use **Import** on the dashboard to restore a snapshot or import a single exported report. If an imported report ID already exists in the browser, the app assigns a new ID to avoid overwriting existing data.

## Tech Stack

| Layer | Technology |
|---|---|
| App shell | Vite + React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + DaisyUI 5 |
| Charts | Recharts |
| Persistence | IndexedDB with localStorage fallback |
| PDF export | jsPDF + html2canvas-pro |
| Icons | lucide-react |

## Project Structure

```text
src/
├── pages/                     # Client-only dashboard, editor, slides, profile
├── components/
│   ├── editors/               # Section editor components
│   ├── slides/                # Slide renderer components
│   └── ui/                    # Shared UI primitives
├── lib/
│   ├── storage.ts             # IndexedDB/localStorage persistence
│   ├── reportFactory.ts       # Report creation and normalization
│   ├── navigation.ts          # Hash routing
│   └── files.ts               # JSON import/export helpers
├── styles/
│   └── globals.css
├── App.tsx
├── main.tsx
└── types.ts
```

## Development

```bash
npm run dev        # Vite dev server
npm run build      # Type check and production build
npm run preview    # Serve dist locally
npm run typecheck  # TypeScript only
```

## CI, Packages, And Pages

The workflow at `.github/workflows/release.yml` does the following:

- On pull requests to `main`: installs dependencies, builds the app, and runs `npm audit --audit-level=moderate`.
- On pushes to `main`: verifies the app, publishes a Docker image to GitHub Container Registry, and deploys the static build to GitHub Pages.
- On semantic version tags like `v1.2.3` and published GitHub releases: verifies the app and publishes a versioned Docker image to GitHub Container Registry.
- Publishes multi-architecture images for `linux/amd64` and `linux/arm64`.

Published image name:

```text
ghcr.io/<owner>/<repo>
```

Typical tags include:

- `latest` for the default branch
- the branch name
- semantic version tags from `v1.2.3`
- `sha-<commit>`

For GitHub Pages, set the repository's Pages source to **GitHub Actions** in repository settings. The app uses hash routing and relative assets, so it works under a repository Pages path without a custom Vite base path.

## Security Notes

This app is designed for local deployment and local browser storage. It does not provide server-side access controls, central backups, audit logs, or collaborative permissions. Treat exported JSON/PDF files as sensitive board-report material and store them accordingly.

## License

[MIT](LICENSE)
