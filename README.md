# Minerva OS

**The strategic operating system for elite agencies. v3.1.0**

Minerva OS is the internal agency platform for [Uprising Studio](https://uprisingstudio.com) — a premium platform that centralises CRM, project management, approvals, billing, file storage, AI-powered risk monitoring, and reporting in one cohesive experience.

---

## What's included

### Auth + onboarding

- Email + password auth via Supabase
- PKCE-secure forgot password + reset password flows (auth callback route)
- Sonner toast notifications on signup for immediate visual feedback
- Onboarding wizard (4 steps) + Getting Started checklist on Dashboard
- Team invite accept page (`/invite/[token]`) with 7-day expiry tokens
- RBAC: 8 roles — Owner, Strategist, PM, Designer, Developer, Finance, Client Stakeholder, Client Reviewer

### Web app (Next.js 15 · Vercel)

**6-space navigation** (consolidated from 29 fragmented routes):

| Space | Primary route | What lives here |
|---|---|---|
| Home | `/app/command` | Operating review cockpit, portfolio health scores, role dashboard |
| Revenue | `/app/clients` | CRM, pipeline, proposals — Call Preps as tab inside Clients |
| Delivery | `/app/projects` | Projects, tasks, approvals, files, workflows, time tracking, resources |
| Finance | `/app/finance-hub` | Billing · Expenses · Profitability · Tax Ledger — one tabbed view |
| Intelligence | `/app/intelligence` | Reports · Health scores · NPS signal · Agent Ops — one tabbed view |
| Admin | `/app/settings` | Settings, Support & Knowledge, Operations Catalog, Marketplace, Scorecards |

**App modules:**
- Split-screen signup + login: cinematic video left, form right
- Fully bilingual EN / FR via custom `useLang()` context — zero hardcoded copy
- Dark mode enforced (Celestial Editorial Noir design system)
- PDF export for invoices and proposals
- Sentry error monitoring + PostHog product analytics
- PWA support + Electron desktop shell
- Dev service worker auto-cleanup to prevent stale cache issues
- Collapsible sidebar with 6 spaces — state persisted in localStorage
- Premium animation layer: `AnimatedNumber`, `TextAnimate`, `DirectionAwareTabs`
- Fully responsive: all modules audited for mobile (375px), tablet (768px), and desktop (1440px)

**Finance Hub** (`/app/finance-hub`):
- Billing: invoice creation, retainer tracking, status management
- Expenses: team and project expense logging with categories
- Profitability: project margin, cashflow forecast, disputed invoices
- Ledger: tax and VAT ledger with export

**Intelligence Hub** (`/app/intelligence`):
- Reports: overview, profitability, and time reporting with role-based views (Executive, Finance, PM, Delivery)
- Health Scores: per-client and per-project health across 4 dimensions (delivery, financial, engagement, risk) with animated SVG ring gauges
- NPS: satisfaction gauge + individual response tracking
- Agent Ops: AI agent activity terminal and logs

**Support & Knowledge Hub** (`/app/support-hub`):
- Tickets: issue tracking with status and priority
- Knowledge Base: article library with categories and search
- Help: FAQ accordion and contact form

**Operations Catalog** (`/app/services`):
- Services: productised service definitions with pricing
- Packages: bundled service packages
- Fulfillment: delivery templates and task scaffolding

**Marketplace** (`/app/marketplace`):
- Built-in templates, automations, views, and playbooks
- Workspace-custom items with install tracking and usage counts

**Team Scorecards** (`/app/scorecards`):
- Per-member delivery score, capacity %, task completion rate, on-time rate
- Period selector: week / month / quarter
- Team-level KPI ring + capacity bar

**Cockpit** (`/app/command`):
- Portfolio health ring with critical alert feed
- Revenue, delivery, and capacity KPIs
- Per-client health cards with dimension breakdown bars
- Recent wins and approval aging

**Workflow Analytics** (embedded in Workflows):
- Execution stats: total runs, success rate, avg duration
- Time saved estimate, daily series chart
- Top workflows and trigger breakdown

### Client Portal (`/portal/[token]`)

Secure, token-gated portal for client stakeholders and reviewers.

| Route | Content |
|---|---|
| `/portal/[token]` | Overview: project stats, pending decisions, upcoming deadlines, monthly summary |
| `/portal/[token]/deliverables` | Approvals with choice polls, comments, status badges |
| `/portal/[token]/files` | Document centre with folder navigation (Proposals, Deliverables, Invoices, References) |
| `/portal/[token]/invoices` | Invoice list with inline comment threads |
| `/portal/[token]/proposals` | Proposal viewer with sign / decline CTA |
| `/portal/[token]/journal` | Chronological decision journal (approvals, proposals, invoices) |
| `/portal/[token]/timeline` | Activity timeline with stagger animations |
| `/portal/[token]/reports` | KPI snapshot with shareable URL |
| `/portal/[token]/tickets` | Support ticket submission |
| `/portal/[token]/nps` | Satisfaction survey |
| `/portal/[token]/settings` | Notification preferences (instant / daily / weekly) |

**Portal features:**
- Token scopes: view, approve, download, upload, billing, proposals, reports
- Activity audit log on every action (download, approval, comment)
- API-driven: server-side routes using `supabaseAdmin` — no direct DB access from browser
- AI Copilot: floating Claude-powered assistant with full portal context + prompt caching
- Monthly AI summary generated per client with `cache_control: ephemeral`
- Notification bell: unread count badge, mark-all-read, instant / digest delivery via Resend

### Public shareable reports (`/reports/[shareToken]`)

- Agency generates a snapshot URL from the portal
- Public read-only viewer — no auth required
- "Powered by Minerva" footer, no share button

### Desktop (Electron 42)

- macOS (arm64 + x64) `.dmg`
- Windows (x64) `.exe` NSIS installer
- System tray, `minerva://` deep links, auto-updater

### Mobile (Expo SDK 54 · React Native 0.81)

- 17 screens for iOS and Android
- 100% bilingual EN / FR via `MobileLangProvider`
- iOS-native UX: ActionSheetIOS, Haptics, BlurView, SegmentedControl
- Sentry crash reporting via `@sentry/react-native`
- Offline detection, background timer sync
- EAS build profiles (preview + production)
- pnpm package manager
- TestFlight-ready

### MCP server (minerva-mcp)

- Model Context Protocol server for AI tool integrations
- Browser session management + Supabase client
- Extensible tool system

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 + React 18 + TypeScript (strict) |
| Mobile | Expo SDK 54 + React Native 0.81 + NativeWind v4 + pnpm |
| Desktop | Electron 42 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth — email/password, PKCE reset flow |
| Styling | Tailwind CSS v4 + shadcn/ui + Cult UI (Minerva design tokens) |
| Animation | motion/react (Framer Motion v11+) · AnimatedNumber · TextAnimate · DirectionAwareTabs |
| AI | Anthropic SDK · claude-sonnet-4-6 · prompt caching |
| Email | Resend (portal notifications + digests) |
| Notifications | Sonner v2 |
| Monitoring | Sentry + PostHog |
| Deployment | Vercel (web) · EAS (mobile) · GitHub Actions (desktop) |

## Design system — Celestial Editorial Noir

Dark-first editorial aesthetic. No neon, no generic SaaS gradients.

| Token | Hex | Use |
|---|---|---|
| `obsidian` | `#0A0D14` | Page background |
| `midnight` | `#111522` | Cards, inputs |
| `dusk` | `#171C2A` | Elevated surfaces |
| `ivory` | `#F5F1E8` | Primary text, CTA |
| `silver` | `#B8BDC7` | Secondary text |
| `fog` | `#8A9099` | Metadata, tertiary |
| `mist` | `#D8DDE6` | Accent highlights |
| `sage` | `#7FA38A` | Success, active |
| `amber` | `#B89B6A` | Warning |
| `rose` | `#A86A6A` | Error, danger |

Typography: **Playfair Display** for display headings · **Inter** for all UI text.

---

## Quick start (development)

```bash
# 1. Clone and install
git clone https://github.com/Endsi3g/minerva-os.git
cd minerva-os
pnpm install

# 2. Copy env vars
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
# ANTHROPIC_API_KEY, RESEND_API_KEY, etc.

# 3. Start Next.js
pnpm dev

# 4. Mobile (separate terminal)
cd minerva-mobile
pnpm install
npx expo start
```

Windows shortcut: double-click `scripts/dev.bat` for an interactive menu (web, Electron, mobile, MCP server).

---

## Auth flows

### Sign up

1. User fills the split-screen form at `/signup`
2. `supabase.auth.signUp()` creates the account
3. Sonner toast fires: "Account created — welcome to Minerva OS"
4. Redirect to `/app/onboarding`

### Forgot password

1. User clicks "Forgot password?" on `/login`
2. Enters email at `/forgot-password` → `resetPasswordForEmail()` sends the link
3. Email link hits `/auth/callback?next=/reset-password` — PKCE code is exchanged server-side
4. User lands on `/reset-password` with an active session and sets a new password
5. Sonner toast fires: "Password updated — please sign in"
6. Redirect to `/login`

---

## Deployment

See **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** for full instructions covering:

- Supabase project setup + env vars
- Vercel web deployment
- Electron desktop build (.dmg + .exe) + code signing
- iOS TestFlight step-by-step
- Android APK / Play Store
- GitHub Actions release pipeline
- Post-deploy health checklist

---

## Releases

| Tag | Date | Highlights |
|---|---|---|
| `v3.1.0` | 2026-06-04 | Module consolidation — 6-space nav (Home/Revenue/Delivery/Finance/Intelligence/Admin), Finance Hub, Intelligence Hub, Support & Knowledge Hub, Call Preps tab in Clients, Fulfillment tab in Services |
| `v3.0.0` | 2026-06-04 | Minerva OS as central system — Cockpit operating review, portfolio health scores, workflow analytics, marketplace, team scorecards, DB migration |
| `v2.7.0` | 2026-06-04 | Client Portal V2 — Decision Journal, notification bell, shareable reports, activity timeline, AI Copilot (Claude), monthly summaries |
| `v2.3.0` | 2026-06-02 | Collapsible sidebar groups, Support and Changelog pages, AnimatedNumber / TextAnimate / DirectionAwareTabs animation layer, full responsive audit |
| `v2.2.0` | 2026-06-01 | Secure Client Portal email gate, token scopes, activity logging, API-driven proposal viewer |
| `v2.1.0` | 2026-06-01 | Expo 54 upgrade, Sentry wrap, pnpm migration, dev SW cleanup |
| `v2.0.0` | — | Landing overhaul, animations, i18n toggle, changelog |

To publish a new release:

```bash
git tag -a v3.1.0 -m "description"
git push origin v3.1.0
```

---

## Testing

```bash
# Playwright end-to-end (web)
pnpm test:audit

# Individual test files
npx playwright test tests/audit/01-auth.spec.ts
npx playwright test tests/audit/11-crud-flows.spec.ts
npx playwright test tests/audit/15-i18n-complete.spec.ts

# View report
pnpm test:audit:report
```

---

## Key conventions

- TypeScript strict — `noUnusedLocals`, `noUnusedParameters` on
- All UI strings through `useLang()` / `useMobileLang()` — zero hardcoded copy
- RBAC: every protected route checks session via Supabase middleware before rendering
- No `overflow-hidden + maxHeight` for animated panels — use `translateY` slides
- Commit messages in English, code comments in English, UI copy bilingual (EN/FR)
- Left column of auth pages: centered content (`justify-center`) over video background
- Web uses **pnpm** — do not use npm at the root
- Mobile uses **pnpm** — do not use npm in `minerva-mobile/`
