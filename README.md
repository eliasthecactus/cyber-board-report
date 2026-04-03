# IN DEVELOPMENT - DO NOT USE IN PRODUCTION - NO SECURITY AUDIT DONE - ONLY DEPLOY LOCALLY

---

# cyber-board-report

A web application for security leaders to create, manage, and present quarterly board reports. Transforms complex security data into executive-friendly slide presentations in under 30 minutes.

**Not a technical dashboard.** Built specifically for C-suite and board-level audiences.

---

## Features

- **Guided report editor** — 11 structured sections with constrained inputs, no blank-page anxiety
- **Instant slide generation** — Reports automatically render as executive presentations
- **Risk matrix** — Interactive 4×4 likelihood × impact visualization with trend tracking
- **KPI trend charts** — Historical quarterly data with target tracking
- **Full-screen presentation mode** — Board-ready slideshow with keyboard navigation
- **PDF export** — One-click download via jsPDF + html2canvas
- **Passkey authentication** — Passwordless login using WebAuthn (no passwords stored)
- **Multi-user support** — Each user's reports are fully isolated
- **Report sharing** — Share any report with collaborators by username; owners can add/remove access
- **Profile management** — Update your display name; all reports reflect changes immediately

---

## Quick Start

### Prerequisites
- Node.js 18+

### Installation

```bash
git clone https://github.com/eliasthecactus/cyber-board-report
cd cyber-board-report
npm install
```

### Environment

Create a `.env.local` file:

```env
JWT_SECRET=your-super-secret-key-min-32-chars
RP_ID=localhost
ORIGIN=http://localhost:3000
```

> For production, set `RP_ID` and `ORIGIN` to your actual domain (e.g. `RP_ID=yourdomain.com`, `ORIGIN=https://yourdomain.com`).

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register with a passkey, and create your first report.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + DaisyUI 5 |
| Charts | Recharts |
| Auth | SimpleWebAuthn + Jose JWT |
| Database | SQLite 3 (via `sqlite` + `sqlite3`) |
| PDF export | jsPDF + html2canvas-pro |
| Icons | lucide-react |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/              # register, login, logout, me, profile
│   │   └── reports/           # CRUD + per-report share management
│   ├── auth/                  # Passkey registration & login page
│   ├── editor/[id]/           # Report section editor
│   ├── slides/[id]/           # Slide preview & presentation
│   ├── profile/               # Account settings
│   └── page.tsx               # Dashboard (report listing)
├── components/
│   ├── editors/               # 12 section editor components
│   └── slides/                # 13 slide renderer components
├── lib/
│   ├── auth.ts                # JWT session helpers
│   ├── db.ts                  # SQLite schema + connection
│   └── reports.ts             # Report & share CRUD
└── types.ts                   # TypeScript interfaces
```

---

## Data Model

### Report (11 sections)

| Section | Type |
|---|---|
| Executive Summary | string |
| Top Risks | `Risk[]` (likelihood × impact × trend) |
| Threat Landscape | string |
| KPIs | `KPI[]` (value, target, historical data) |
| Incidents | `Incident[]` (business impact focus) |
| Program Status | achievements / challenges |
| Budget & Resources | allocation breakdown |
| Compliance & Audit | status, findings, gaps |
| Supply Chain Risk | vendor assessment |
| Initiatives | `Initiative[]` (status, progress, blockers) |
| Outlook | string |
| Decisions Required | `Decision[]` (rationale, impact) |

### Sharing model

- Only the **owner** can share, delete, or remove collaborators
- **Collaborators** can view and edit; cannot delete or re-share
- Enforced at SQL level (ownership check in every mutating query)

---

## Security

- Passwordless — credentials are WebAuthn public keys, never passwords
- Passkey login bound to `RP_ID`/`ORIGIN` (phishing-resistant)
- JWT stored in httpOnly cookie (not accessible to JavaScript)
- All report queries scope to `userId` — no cross-user data leakage
- Ownership verified before any write or delete operation
- Generic error messages in all API 500 responses (no stack trace leakage)
- Cascade delete: removing an account removes all credentials, sessions, and reports

---

## Development

```bash
npm run dev       # dev server (http://localhost:3000)
npm run build     # production build
npm start         # run production build
npx tsc --noEmit  # type check
```

---


**Before deploying, update `.env`:**
```env
JWT_SECRET=<strong random secret, 32+ chars>
RP_ID=<your domain, e.g. yourdomain.com>
ORIGIN=<your full origin, e.g. https://yourdomain.com>
DATABASE_URL=<absolute path to db, e.g. /data/reports.db>
```

---

## License

[MIT](LICENSE)
