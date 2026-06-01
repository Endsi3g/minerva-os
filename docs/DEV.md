# Minerva OS — Developer Guide

**v1.7.0 · Uprising Studio · Last updated: May 2026**

This document covers everything you need to develop, test, and ship Minerva OS.

---

## Quick start (5 minutes)

```bash
# Mac / Linux
git clone https://github.com/Endsi3g/minerva-os.git
cd minerva-os
bash scripts/dev.sh

# Windows (PowerShell)
git clone https://github.com/Endsi3g/minerva-os.git
cd minerva-os
scripts\dev.bat
```

The script checks prerequisites, sets up your `.env.local`, and launches the dev server.

---

## Architecture

```
minerva-os/
├── src/                    Next.js 15 web app
│   ├── app/                Route handlers (App Router)
│   │   ├── app/            Authenticated app routes (/app/dashboard, etc.)
│   │   ├── (auth)/         Auth pages (login, signup, forgot-password)
│   │   ├── portal/         Client-facing portal
│   │   └── api/            API routes (AI chat, files, auth)
│   ├── modules/app/        22 feature modules (Dashboard, Pipeline, Billing, …)
│   ├── components/
│   │   ├── ui/             shadcn/ui base components (Minerva tokens)
│   │   ├── layout/         AppShell, AppSidebar, AppHeader
│   │   └── minerva/        Business composites (PdfExport, OnboardingWizard, …)
│   ├── contexts/           AuthContext, ThemeProvider
│   ├── i18n.tsx            EN/FR translations (useLang() hook)
│   └── lib/                utils, analytics (PostHog), sentry helpers
├── supabase/               Supabase backend (SQL migrations)
│   └── migrations/         SQL migrations (schema, tables, triggers, and functions)
├── electron/               Desktop shell (Electron 42)
│   ├── main.ts             Main process (tray, deep links, auto-updater)
│   └── tsconfig.json       Electron-specific TypeScript config
├── minerva-mobile/         Expo SDK 52 mobile app
│   ├── screens/            22 screens (iOS + Android)
│   ├── components/         Native components (BottomSheet, SwipeableRow, …)
│   └── lib/                sentry, analytics, auth helpers
├── tests/audit/            15 Playwright test suites (146 tests)
└── scripts/                Dev setup scripts (dev.sh, dev.bat)
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | bundled with Node |
| Git | any | https://git-scm.com |
| Supabase CLI | latest | npm i -g supabase (optional) |
| EAS CLI | latest | `npm i -g eas-cli` (mobile only) |

---

## Environment variables

Copy `.env.example` → `.env.local` and fill in:

### Required for dev

```env
# Supabase - get these from your Supabase Project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Auth — generate with: openssl rand -base64 32
AUTH_SECRET=your-random-32-char-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Required for email

```env
RESEND_API_KEY=re_xxxxxxxx
```

Get a free key at https://resend.com. Without it, invitation/invoice emails will fail silently.

### Required for AI features (Hermes, daily briefing)

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

### Optional (monitoring)

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxx
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## Local development workflow

### 1. Apply Supabase Database Schema

Run the SQL migration scripts located in `/supabase/migrations` inside your Supabase project's SQL Editor to set up tables, RLS policies, triggers, and functions.

### 2. Start Next.js

```bash
npm run dev
```

App available at http://localhost:3000

### 3. Create your first workspace

1. Go to http://localhost:3000/signup
2. Create an account
3. The onboarding wizard opens automatically
4. Complete 4 steps: workspace name → invite team → add client → create project

---

## Feature modules

### 22 web modules

| Module | Route | Description |
|---|---|---|
| Dashboard | `/app/dashboard` | KPIs, risk flags, AI briefing, activity feed |
| Pipeline | `/app/pipeline` | CRM kanban (deals by stage) |
| Clients | `/app/clients` | Client list + detail + contacts |
| Projects | `/app/projects` | Project hub + Gantt timeline |
| Tasks | `/app/tasks` | Task list with assignee + status filters |
| Approvals | `/app/approvals` | Deliverable approval queue |
| Files | `/app/files` | Asset vault with upload |
| Billing | `/app/billing` | Invoices + retainers + PDF export |
| Proposals | `/app/proposals` | Proposal builder + signing portal |
| Expenses | `/app/expenses` | Expense tracking + approval |
| Knowledge Base | `/app/knowledge` | Internal wiki / articles |
| Tickets | `/app/tickets` | Support ticket system |
| NPS | `/app/nps` | Net Promoter Score tracking |
| Resources | `/app/resources` | Team capacity planning |
| Time Tracking | `/app/time-tracking` | Weekly timesheet + timer widget |
| Agent Ops | `/app/agent-ops` | Hermes AI suggestion queue |
| Services | `/app/services` | Service catalog + packages |
| Fulfillment | `/app/fulfillment` | Delivery tracking |
| Finance | `/app/finance` | Income/expense P&L |
| Call Preps | `/app/call-preps` | Client call preparation sheets |
| Reports | `/app/reports` | Charts: revenue, projects, time, NPS |
| Settings | `/app/settings` | Workspace, team, billing, security, privacy |

### Client portal

| Route | Description |
|---|---|
| `/portal` | Portal landing (enter workspace token) |
| `/portal/[token]` | Client overview (tabs: files, invoices, deliverables) |
| `/portal/proposal/[token]` | Proposal signing page |

### Auth routes

| Route | Description |
|---|---|
| `/login` | Email + password login |
| `/signup` | Account creation |
| `/forgot-password` | Password reset request |
| `/reset-password` | New password form |
| `/invite/[token]` | Team invitation accept |

---

### Row Level Security (RLS)

Every table has Row Level Security enabled. Security policies match rows against the authenticated user's workspace ID to ensure complete isolation between tenants.

For example, query filters:
```typescript
supabase.from('tasks').select('*').eq('workspace_id', workspaceId)
```

RLS on the backend rejects any requests for workspace IDs not associated with the user profile of `auth.uid()`.

---

## Email (Resend)

Transactional emails are triggered automatically from database insert/update actions via triggers and functions sending webhook requests using the `pg_net` extension:

- Team invitations insert triggers an invitation email.
- Complete onboarding updates profile, sending a welcome email.
- Invoice status transition to `sent` triggers invoice emails.
- High severity risk flags send alert emails.

All webhooks POST to the `send-email` Supabase Edge Function which integrates with the Resend client.

---

## Testing

### Playwright (146 tests)

```bash
# Build production bundle first (required)
npm run build

# Run all 15 suites
npx playwright test

# Single suite
npx playwright test tests/audit/01-public-pages.spec.ts

# With UI (visual browser)
npx playwright test --ui

# View HTML report
npm run test:audit:report
```

### Test suites overview

| Suite | Tests | Covers |
|---|---|---|
| 01-public-pages | 12 | Landing, login, signup, marketing, portal |
| 02-app-shell | 5 | Sidebar nav, header, mobile viewport |
| 03-app-modules | 22 | All 22 modules render without crashing |
| 04-portal-pages | 4 | Portal tabs, branding, invalid token |
| 05-interactions | 6 | 404 check, mobile/tablet, error monitoring |
| 06-new-modules | 22 | Sprint 9-10 module buttons + modals |
| 07-command-palette | 4 | Cmd+K opens, search, Escape closes |
| 08-timer-widget | 4 | Timer in sidebar, time-tracking page |
| 09-portal-proposal | 5 | Proposal signing flow |
| 10-dashboard-enhanced | 10 | Firefighter tab, Gantt, Reports tabs |
| 11-web-crud-flows | 6 | Create client, task, invoice, KB article, ticket |
| 12-billing-flows | 6 | KPI cards, invoice detail, PDF, payment link |
| 13-hermes-ai | 6 | Daily briefing, Hermes chat, risk flags |
| 14-portal-complete | 6 | Portal files, invoices, proposal, 404 |
| 15-i18n-complete | 28 | All 22 modules in EN + FR |

---

## Supabase Schema

The schema resides in the PostgreSQL instance of your project. Database structures are version-controlled via SQL files in the `supabase/migrations` directory. RLS policies, constraints, indexes, and triggers are all fully documented inside these migrations.

---

## Design system — Celestial Editorial Noir

### CSS tokens (`src/index.css`)

```css
/* Dark mode (default) */
--color-obsidian: #0A0D14;   /* page background */
--color-midnight: #111522;   /* cards, inputs */
--color-dusk:     #171C2A;   /* elevated surfaces */
--color-ivory:    #F5F1E8;   /* primary text */
--color-silver:   #B8BDC7;   /* secondary text */
--color-fog:      #8A9099;   /* metadata */
--color-sage:     #7FA38A;   /* success, active */
--color-amber:    #B89B6A;   /* warning */
--color-rose:     #A86A6A;   /* error */
```

### Dark/light mode

Controlled via `next-themes` with `data-theme` attribute. System preference detected on first load. Toggle button in `AppHeader.tsx` (Sun/Moon icons).

### i18n

All UI strings go through `useLang()`:

```typescript
const { t } = useLang();
// Use t.app.dashboard.title, t.app.billing.newInvoice, etc.
// Never hardcode English strings in JSX
```

Add new strings to both `en` and `fr` objects in `src/i18n.tsx`.

---

## Mobile development

### Prerequisites

```bash
npm install -g eas-cli
expo login   # create free account at expo.dev
```

### Start mobile dev server

```bash
cd minerva-mobile
cp .env.example .env
# Edit .env: set EXPO_PUBLIC_CONVEX_URL

npm install
npx expo start
```

Scan QR code with Expo Go app (iOS/Android).

### Build for TestFlight

```bash
cd minerva-mobile
eas build --profile preview --platform ios
eas submit --platform ios --latest
```

### Environment

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Desktop (Electron)

### Dev mode

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Electron (waits for localhost:3000)
npm run electron:dev
```

### Build locally

```bash
# macOS
export MINERVA_APP_URL=https://your-app.vercel.app
npm run electron:dist:mac

# Windows
set MINERVA_APP_URL=https://your-app.vercel.app
npm run electron:dist:win
```

### Production release

Go to **GitHub Actions → Desktop Release → Run workflow** with version `v1.7.0`.

Requires GitHub Secrets:
`MINERVA_APP_URL`, `NEXT_PUBLIC_CONVEX_URL`, `MAC_CERTIFICATE_P12`, `MAC_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `WIN_CERTIFICATE_P12`, `WIN_CERTIFICATE_PASSWORD`

---

## Common commands

```bash
# Development
npm run dev                    # Next.js dev server
npm run electron:dev           # Electron shell (requires npm run dev)

# Building
npm run build                  # Production Next.js build
npm run electron:compile       # Compile Electron TypeScript
npm run electron:dist:mac      # Build macOS .dmg
npm run electron:dist:win      # Build Windows .exe

# Testing
npx playwright test            # All 146 Playwright tests
npx playwright test --ui       # Visual Playwright UI
npm run test:audit:report      # Open HTML test report

# Mobile
npx expo start                 # Mobile dev server
eas build --profile preview --platform ios      # iOS TestFlight build
eas build --profile preview --platform android  # Android APK
eas submit --platform ios --latest              # Submit to TestFlight
```

---

## Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL is not set"

Ensure you have created a `.env.local` file copy from `.env.example` and set all necessary Supabase parameters. Restart the Next.js dev server.

### Playwright tests fail with timeout

Make sure the production build exists:
```bash
npm run build
npx playwright test
```

### "address already in use :3001" during tests

Kill the existing server:
```bash
# Mac/Linux
fuser -k 3001/tcp

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Electron shows blank screen in dev

Wait for Next.js to be fully up (http://localhost:3000 responds) before launching Electron.

### Mobile: "Could not connect to development server"

Ensure your phone and computer are on the same WiFi network. Or use the tunnel option:
```bash
npx expo start --tunnel
```

---

## Git workflow

```bash
# Feature branch
git checkout -b feat/your-feature main
# ... develop ...
git push origin feat/your-feature
# Open PR → merge → auto-deploys to Vercel

# Release
# Go to GitHub Actions → Desktop Release → Run workflow → v1.7.x
```

### Branch naming

| Type | Pattern |
|---|---|
| Feature | `feat/name` |
| Bug fix | `fix/name` |
| Chore / docs | `chore/name` |
| Hotfix | `hotfix/vX.Y.Z` |

### Commit messages

```
feat(module): add new feature
fix(billing): correct invoice total calculation
chore(release): bump version to 1.7.1
docs: update DEV.md with mobile instructions
```

---

## Sprint 11 — What was built

| System | Details |
|---|---|
| Auth RBAC | `requireWorkspaceMember` + `requireOwner` on all 16 mutation modules |
| Email (Resend) | 6 transactional actions: invoice, proposal, invitation, welcome, password reset, risk alert |
| Team invitations | `/convex/invitations.ts` — 7-day expiry, accept page at `/invite/[token]` |
| Forgot/reset password | `/src/app/forgot-password` + `/src/app/reset-password` via Convex Auth |
| Sentry | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` |
| PostHog | `src/lib/analytics.ts` — `initAnalytics`, `trackEvent`, `identifyUser` |
| Dark/light mode | Fixed class toggling (was inverted) + system preference detection |
| PDF export | `src/components/minerva/PdfExport.tsx` — invoices + proposals |
| Onboarding wizard | 4 steps: workspace → team → client → project |
| Getting Started checklist | 5-item progress widget on Dashboard |
| Deployment | `vercel.json`, `.env.example`, `DEPLOYMENT.md`, GitHub Actions desktop + mobile CI |
| Mobile | 22 Expo screens, full EN/FR i18n, Sentry, offline detection, push notifications |
| Tests | 146/146 Playwright passing across 15 suites |
