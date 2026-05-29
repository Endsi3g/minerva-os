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
├── convex/                 Convex backend (DB + serverless functions)
│   ├── schema.ts           49-table schema
│   ├── auth.ts             RBAC helpers (requireWorkspaceMember, requireOwner)
│   ├── email.ts            Resend transactional emails (6 actions)
│   ├── invitations.ts      Team invitations with 7-day expiry
│   └── *.ts                47 modules (projects, clients, invoices, …)
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
| Convex CLI | latest | `npm i -g convex` |
| EAS CLI | latest | `npm i -g eas-cli` (mobile only) |

---

## Environment variables

Copy `.env.example` → `.env.local` and fill in:

### Required for dev

```env
# Convex — get these from `npx convex dev`
CONVEX_DEPLOYMENT=dev:your-project-name
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud

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

### 1. Start Convex backend

```bash
npx convex dev
```

- Opens a browser to authenticate with Convex (first time)
- Creates a dev deployment automatically
- Watches `convex/*.ts` for changes and pushes instantly
- Outputs `NEXT_PUBLIC_CONVEX_URL` — paste it in `.env.local`

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

## Auth & RBAC

### Roles

| Role | Capabilities |
|---|---|
| `owner` | Full access, can invite/remove members |
| `member` | Read/write all workspace data |

### How it works

Every Convex mutation calls one of these before writing:

```typescript
// Any authenticated workspace member
await requireWorkspaceMember(ctx, args.workspaceId);

// Owner only (e.g., inviting team members, changing billing)
await requireOwner(ctx, args.workspaceId);
```

Both helpers live in `convex/auth.ts`. They use `identity.tokenIdentifier` (not `identity.subject`) as the user ID, per Convex auth guidelines.

### Backward compatibility

If `workspace.memberIds` is empty (legacy workspaces), all authenticated users pass through. Only enforced when `memberIds` has at least one entry.

---

## Email (Resend)

Triggered automatically from Convex mutations:

| Trigger | Template | File |
|---|---|---|
| Invoice status → `sent` | Invoice with amount + due date | `convex/invoices.ts` |
| Proposal sent | Proposal link + signing URL | `convex/proposals.ts` |
| Team invitation created | Invite link (7-day expiry) | `convex/invitations.ts` |
| Workspace created | Welcome email | `convex/workspaces.ts` |
| Risk flag escalated | Risk summary | `convex/riskWorkflow.ts` |
| Password reset | Reset link | Convex Auth built-in |

All email logic is in `convex/email.ts` via `internalAction`. Uses `ctx.scheduler.runAfter(0, ...)` to call from mutations.

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

## Convex schema

Key tables added in Sprint 11:

```typescript
// workspaces — RBAC fields
memberIds: v.optional(v.array(v.string())),
ownerUserId: v.optional(v.string()),

// userProfiles — onboarding state
onboardingCompleted: v.optional(v.boolean()),
onboardingTourCompleted: v.optional(v.boolean()),
completedChecklist: v.optional(v.array(v.string())),

// invitations — team invite tokens
invitations: defineTable({
  token: v.string(),
  email: v.string(),
  workspaceId: v.id("workspaces"),
  role: v.union(v.literal("owner"), v.literal("member")),
  expiresAt: v.number(),
  acceptedAt: v.optional(v.number()),
}).index("by_token", ["token"]).index("by_workspace", ["workspaceId"]),
```

To update the schema in dev: edit `convex/schema.ts` → `npx convex dev` applies changes automatically.

To update generated types after adding new Convex functions:

```bash
npx convex dev   # auto-regenerates convex/_generated/
```

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
EXPO_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
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
npx convex dev                 # Convex backend watcher
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

# Convex
npx convex dev                 # Dev mode (auto-sync)
npx convex deploy              # Deploy to production
npx convex run init:seed       # Seed demo data

# Mobile
npx expo start                 # Mobile dev server
eas build --profile preview --platform ios      # iOS TestFlight build
eas build --profile preview --platform android  # Android APK
eas submit --platform ios --latest              # Submit to TestFlight
```

---

## Troubleshooting

### "Module not found: convex/_generated/api"

The Convex generated files are stale. Run:
```bash
npx convex dev
```

### "NEXT_PUBLIC_CONVEX_URL is not set"

Copy it from the `npx convex dev` output into `.env.local`. Restart `npm run dev`.

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
