# Minerva OS

![Version](https://img.shields.io/badge/version-7.0.1-indigo?style=flat-square) ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square)

**Minerva OS is the operating system for creative agencies** — one workspace that replaces your CRM, project tracker, client portal, billing software, and AI tools.

Built for Uprising Studio and designed to scale from a solo freelancer to a 50-person agency.

---

## What it does

When you open Minerva, you land on a **Dashboard** that shows your priority queue for the day: overdue tasks, invoices to send, approvals waiting from clients, and a revenue snapshot. From there, every piece of your agency lives in one place:

```
Prospect → Client → Project → Deliverables → Approvals → Invoice → Paid
```

Each step of that flow is a module in the sidebar. Nothing lives in email or spreadsheets.

---

## The two sides of Minerva

### Your workspace (internal)

Everything your team touches lives at `/app/*`. Access requires login.

| What you do | Where |
|---|---|
| Track leads and manage accounts | Pipeline + Clients |
| Run projects and assign tasks | Projects + Tasks |
| Review and approve deliverables | Approvals |
| Store files and assets | File Vault |
| Send proposals and invoices | Proposals + Finance Hub |
| Monitor agency health | Intelligence + Reports |
| Build AI agents for your workflow | Agent Builder + Agent Ops |
| Chat with your workspace AI | Copilot (Hermes) |
| Automate repetitive work | Workflows |

### Your client portal (external)

Every client gets a private, white-labeled portal at `/portal/[token]` — no login required, just an email verification. Clients can:

- Review project status and upcoming deliverables
- Approve or reject submissions with comments
- Read and sign proposals
- View invoices and payment status
- Download files
- Submit support tickets
- Fill NPS satisfaction surveys

The portal is fully token-scoped: you control exactly what each client can see and do. Every action is logged in an audit trail and can trigger email notifications.

---

## AI built in

Minerva uses Anthropic's Claude (`claude-sonnet-4-6`) throughout the app — not bolted on after the fact.

| Feature | What it does |
|---|---|
| **Hermes (Copilot)** | Workspace-aware chat — ask anything about your projects, clients, or pipeline |
| **MinervaDaily** | Morning briefing on the Dashboard — top 3 priorities, drifting projects, invoices to chase |
| **Proposal Copilot** | Write a 3-line brief, get a full proposal with scope, timeline, and pricing |
| **CRM Agent** | Scans your client activity and surfaces relationship risks before they become problems |
| **PM Agent** | Flags tasks at risk, detects scope creep, suggests resource adjustments |
| **Finance Agent** | Cashflow forecast, profitability by client, unbilled hours alerts |
| **Agent Builder** | Create custom AI agents with RAG (your own knowledge base), tool use, and workspace data |
| **Portal Copilot** | Client-facing Claude assistant inside the portal — context-aware, no internal data exposed |

All AI routes require authentication. Prompt caching keeps costs low on repeated system context.

---

## Platforms

| Platform | Stack | Status |
|---|---|---|
| **Web** | Next.js 15 · Vercel | Production |
| **Desktop** | Electron 42 · macOS + Windows | Production |
| **Mobile** | Expo SDK 54 · React Native 0.81 · iOS + Android | TestFlight-ready |
| **MCP Server** | Model Context Protocol · Claude Desktop integration | Available |

---

## Quick start

### Prerequisites
- Node.js 20+
- pnpm (`npm i -g pnpm`)
- A Supabase project (free tier works)
- An Anthropic API key

### Run locally

```bash
git clone https://github.com/Endsi3g/minerva-os.git
cd minerva-os
pnpm install

cp .env.example .env.local
# Fill in .env.local — minimum required:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
#   ANTHROPIC_API_KEY

pnpm dev
# → http://localhost:3000
```

**Windows shortcut:** double-click `scripts/dev.bat` for an interactive menu (web, Electron, mobile, MCP server).

### First login

1. Go to `/signup` — create your account
2. Complete the onboarding wizard (workspace name, first client, first project)
3. You land on the Dashboard

### Forgot password

`/forgot-password` → email link → `/reset-password` → back to `/login`. Uses Supabase PKCE flow with a server-side code exchange at `/auth/callback`.

---

## Architecture

```
src/
  app/                  Next.js App Router
    app/                Protected routes (/app/dashboard, /app/projects, ...)
    portal/[token]/     Client portal (public, token-scoped)
    api/                48 API routes (AI, auth, Stripe, Supabase, webhooks)
  components/
    layout/             AppShell, AppSidebar, AppHeader, ChatSidebar
    ui/                 shadcn/ui primitives
    minerva/            App-specific components
  modules/
    app/                40 feature modules (one per sidebar route)
    portal/             10 portal modules
  contexts/             AuthContext, WorkspaceContext, ThemeContext
  i18n.tsx              Bilingual EN/FR — all UI strings go through useLang()
  lib/                  Hooks, types, mock data, status helpers
  index.css             Design tokens + Tailwind v4 theme
```

### Data flow

- **Auth**: Supabase Auth (email + magic link). Session validated server-side via middleware at every protected route.
- **Database**: PostgreSQL via Supabase. Row Level Security enforces workspace isolation on every table.
- **Real-time**: Supabase Realtime used for notifications in the header.
- **Files**: Supabase Storage (`assets` / `avatars` buckets).
- **AI**: All AI calls go through `/api/ai/*` routes on the server — API keys never exposed to the client.
- **Payments**: Stripe. Webhooks handled at `/api/stripe/webhook`.

### Roles

| Role | What they can access |
|---|---|
| Agency Owner | Everything |
| Strategist | CRM, Discovery, Proposals |
| Project Manager | Projects, Tasks, Files, Approvals |
| Designer / Developer | Tasks, Files, Approvals (read-only finance) |
| Finance | Billing, Invoices, Retainers |
| Client Stakeholder | Client portal only |
| Client Reviewer | Client portal — deliverables and approvals only |

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 · App Router · React 18 · TypeScript strict |
| Styling | Tailwind CSS v4 · shadcn/ui · StackAI Light Mode design system |
| Animation | motion/react (Framer Motion v11+) |
| Icons | lucide-react |
| Backend | Supabase — PostgreSQL, Auth, Storage, Realtime |
| AI | Anthropic SDK · claude-sonnet-4-6 · prompt caching |
| Email | Resend — portal notifications + daily digests |
| Payments | Stripe — invoices, checkout, webhook handler |
| Monitoring | Sentry (errors) + PostHog (analytics) |
| Mobile | Expo SDK 54 · React Native 0.81 · NativeWind v4 |
| Desktop | Electron 42 |
| Deploy | Vercel (web) · EAS (mobile) · GitHub Actions (desktop) |
| Package manager | pnpm |

---

## Design system

StackAI Light Mode — clean, enterprise-grade. White surfaces, indigo `#4F46E5` accent, subtle shadows. Dark mode available via toggle in the header.

Key tokens (defined in `src/index.css`, used as Tailwind utilities):

| Token | Light | Dark |
|---|---|---|
| `background` | `#FFFFFF` | `#090909` |
| `foreground` | `#0F172A` | `#F1F5F9` |
| `primary` | `#4F46E5` | `#818CF8` |
| `sidebar` | `#F8FAFC` | `#111827` |
| `border` | `#E2E8F0` | `rgba(255,255,255,0.08)` |

Typography: **Inter** everywhere. Icons: **Lucide React**.

Status badges are centralised in `src/lib/status.ts` — import `statusClass('active')` anywhere to get consistent pastel pill styles.

---

## Key conventions

- **TypeScript strict** — `noUnusedLocals`, `noUnusedParameters` on. No `any` in new code.
- **i18n always** — every UI string goes through `useLang()` / `t.xxx`. Zero hardcoded copy. Fully bilingual EN/FR.
- **CSS tokens over hex** — use Tailwind semantic classes (`bg-primary`, `text-muted-foreground`) not raw hex values.
- **RBAC enforced server-side** — Supabase middleware checks session on every `/app/*` and `/api/*` request.
- **Commit messages in English** · code comments in English · UI copy bilingual.

---

## Testing

```bash
pnpm test:audit              # Full Playwright E2E suite
pnpm test:audit:report       # Open HTML report in browser
```

---

## Deployment

See **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** for step-by-step instructions covering Supabase setup, Vercel deployment, Electron builds, and the iOS/Android release pipeline.

---

## Releases

| Version | Highlights |
|---|---|
| **v7.0.0** | StackAI Light Mode — full design system migration, indigo accent, semantic tokens, Next.js 15 build fixes |
| **v6.0.0** | Unified Agency Platform — Cockpit Dashboard, consolidated workspace routes, tier-based settings gating |
| **v5.0.0** | Multi-role dashboard switcher, global Command Bar (CMD+K), Agent Builder redesign |
| **v4.7.0** | Marketplace Community Tier — browse, contribute, and install community templates |
| **v4.5.0** | MinervaDaily — AI morning briefing widget + Resend email digest |
| **v4.3.0** | Quick Proposal templates, e-signature modal, custom domain portal |
| **v4.0.0** | AI Module Agents — CRM, PM, Finance agents with dashboard integration |
| **v3.2.0** | Multi-tier billing, workspace switcher, white-label portal, API keys |
| **v3.0.0** | Cockpit operating review, portfolio health scores, workflow analytics |
| **v2.7.0** | Client Portal V2 — Decision Journal, AI Copilot, shareable reports |

Full history: [CHANGELOG.md](./CHANGELOG.md)
