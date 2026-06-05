# Minerva OS

![Version](https://img.shields.io/badge/version-3.3.0-ivory?style=flat-square) ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square)

**The intelligent operating system for agencies and creative studios.**

Minerva OS centralises CRM, project delivery, client approvals, billing, file storage and AI-powered intelligence in one cohesive workspace — so your team spends time on creative work, not administration.

> _"Your agency, on autopilot."_

---

## Who it's for

| Profile | Size | What Minerva solves |
|---|---|---|
| **Micro-studio** | 1-3 people | Look more professional, win bigger clients, replace 5 scattered tools |
| **Small agency** | 4-15 people | Stop chasing approvals, get financial clarity, scale without hiring |
| **Established agency** | 15+ people | Multi-workspace, white-label portal, AI agents, enterprise reporting |

Minerva detects your team size at onboarding and adapts the experience accordingly — **SMB mode** for small teams (simplified nav, action-first dashboard) and the **full suite** for larger organisations.

---

## What Minerva replaces

| Tool category | Replaced by |
|---|---|
| CRM (HubSpot, Pipedrive) | Pipeline + Clients module |
| Project management (Asana, ClickUp) | Projects + Tasks + Kanban |
| Client portal (Notion links, email threads) | Token-scoped Client Portal |
| Billing (HoneyBook, Bonsai, Stripe standalone) | Finance Hub + Stripe integration |
| File storage (Google Drive, Dropbox) | File Vault + Supabase Storage |
| AI tools (ChatGPT tabs) | Built-in Hermes AI + Module Agents |

---

## Core modules

| Module | Route | What it does |
|---|---|---|
| Dashboard | `/app/dashboard` | Action queue, revenue snapshot, active projects (SMB) or portfolio cockpit (agency) |
| CRM + Pipeline | `/app/clients` `/app/pipeline` | Lead scoring, deal stages, account management |
| Projects + Tasks | `/app/projects` `/app/tasks` | Kanban, Gantt, priorities, drag-and-drop, comments |
| Approvals | `/app/approvals` | Deliverable review, choice polls, comment threads, SLA tracking |
| File Vault | `/app/files` | Asset storage, folder navigation, project/client associations |
| Finance Hub | `/app/finance-hub` | Billing, retainers, expenses, profitability, cashflow forecast |
| Proposals | `/app/proposals` | AI-drafted proposals, PDF export, e-signature via portal |
| Intelligence | `/app/intelligence` | Health scores, NPS, team scorecards, AI audit |
| Workflows | `/app/workflows` | Automation builder, triggers, conditions, SLA policies |
| Marketplace | `/app/marketplace` | Templates, automations, playbooks |
| Time Tracking | `/app/time-tracking` | Billable hours, unbilled alerts |
| Support Hub | `/app/support-hub` | Tickets, knowledge base, FAQ |
| AI Agents | `/app/agents` | Custom agent builder, RAG, Agent Ops terminal |
| AI Copilot | `/app/copilot` | Hermes — workspace-aware chat assistant |

---

## AI & Agents

Minerva OS is built AI-first with Anthropic's Claude (`claude-sonnet-4-6`) and prompt caching throughout.

- **Hermes AI** — in-app assistant for daily briefings, strategic audit, call prep, workspace insights
- **Proposal Copilot** — generates full proposals (scope, timeline, pricing) from a 3-line brief
- **Portal Copilot** — client-facing Claude assistant embedded in the portal, context-aware
- **Agent Builder** — build custom AI agents with RAG, tool use, and workspace data access
- **Agent Ops** — monitor agent activity, runs, logs, and performance
- **AI Summarize** — monthly client summaries with `cache_control: ephemeral` for cost efficiency

All AI routes require authentication. Prompt caching is applied to system context for performance.

---

## Client Portal

The Client Portal is Minerva's flagship feature — a token-scoped, white-labeled space where clients can review, approve, and collaborate without accessing the internal workspace.

| Route | Content |
|---|---|
| `/portal/[token]` | Overview: active projects, pending decisions, upcoming deadlines, AI monthly summary |
| `/portal/[token]/deliverables` | Approval submissions with choice polls, comments, status badges |
| `/portal/[token]/proposals` | Proposal viewer with Accept & Sign / Decline actions |
| `/portal/[token]/invoices` | Invoice list, due dates, payment status |
| `/portal/[token]/files` | Document centre (Proposals, Deliverables, Invoices, References) |
| `/portal/[token]/journal` | Chronological decision journal |
| `/portal/[token]/timeline` | Activity feed with stagger animations |
| `/portal/[token]/reports` | Shareable KPI snapshot |
| `/portal/[token]/tickets` | Support ticket submission |
| `/portal/[token]/nps` | Satisfaction survey |
| `/portal/[token]/settings` | Notification preferences (instant / daily / weekly) |

**Portal capabilities:**
- Granular token scopes: view, approve, download, upload, billing, proposals, reports
- Email gate: clients verify their email before accessing
- Activity audit log on every action
- Notification bell with Resend email digest
- Public shareable reports at `/reports/[shareToken]` (no auth required)

---

## Platforms

| Platform | Technology | Status |
|---|---|---|
| **Web** | Next.js 15 · Vercel | Production |
| **Desktop** | Electron 42 — macOS (.dmg arm64/x64) + Windows (.exe) | Production |
| **Mobile** | Expo SDK 54 · React Native 0.81 — iOS + Android | TestFlight-ready |
| **MCP Server** | Model Context Protocol integration | Available |

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 + React 18 + TypeScript (strict) |
| Mobile | Expo SDK 54 + React Native 0.81 + NativeWind v4 |
| Desktop | Electron 42 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Styling | Tailwind CSS v4 + shadcn/ui (Celestial Editorial Noir) |
| Animation | motion/react (Framer Motion v11+) |
| AI | Anthropic SDK · claude-sonnet-4-6 · prompt caching |
| Email | Resend (portal notifications + digests) |
| Payments | Stripe (invoices + checkout + webhooks) |
| Monitoring | Sentry + PostHog |
| Deployment | Vercel (web) · EAS (mobile) · GitHub Actions (desktop) |

---

## Design system — Celestial Editorial Noir

Dark-first editorial aesthetic. No neon, no generic SaaS gradients.

| Token | Hex | Use |
|---|---|---|
| `obsidian` | `#0A0D14` | Page background |
| `midnight` | `#111522` | Cards, inputs, surfaces |
| `dusk` | `#171C2A` | Elevated surfaces |
| `ivory` | `#F5F1E8` | Primary text, CTA buttons |
| `silver` | `#B8BDC7` | Secondary text |
| `fog` | `#8A9099` | Metadata, tertiary labels |
| `sage` | `#7FA38A` | Success, active indicators |
| `amber` | `#B89B6A` | Warning |
| `rose` | `#A86A6A` | Error, danger |

Typography: **Playfair Display** (display / headings) · **Inter** (all UI text).

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/Endsi3g/minerva-os.git
cd minerva-os
pnpm install

# 2. Environment variables
cp .env.example .env.local
# Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
#           ANTHROPIC_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY,
#           STRIPE_WEBHOOK_SECRET, SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY

# 3. Run the dev server
pnpm dev

# 4. Mobile (separate terminal)
cd minerva-mobile && pnpm install && npx expo start
```

Windows: double-click `scripts/dev.bat` for an interactive menu (web, Electron, mobile, MCP).

---

## Auth flows

### Sign up
1. `/signup` → `supabase.auth.signUp()` → Sonner toast → redirect to `/onboarding/discover`
2. Discovery questionnaire (4 steps: source, role, team size, priorities)
3. Workspace setup wizard (name, invite team, first client, first project)
4. `onboarding_complete: true` written to user profile → redirect to `/app/dashboard`

### Forgot password (PKCE)
1. `/forgot-password` → `resetPasswordForEmail()` sends link
2. Link hits `/auth/callback?next=/reset-password` — code exchanged server-side
3. `/reset-password` — user sets new password with active session
4. Redirect to `/login`

---

## Deployment

See **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** for full instructions:
- Supabase project setup + RLS policies
- Vercel web deployment + env vars
- Electron macOS/Windows build + code signing
- iOS TestFlight + Android APK
- GitHub Actions release pipeline

---

## Releases

| Version | Date | Highlights |
|---|---|---|
| `v3.3.0` | Jun 2026 | SMB mode (simplified UX for 1-15 person teams), login glassmorphism, performance optimisation |
| `v3.2.0` | Jun 2026 | Multi-tier system, workspace switcher, white-label portal, API keys, audit log |
| `v3.1.0` | Jun 2026 | 6-space navigation, Finance Hub, Intelligence Hub, Support & Knowledge Hub |
| `v3.0.0` | Jun 2026 | Cockpit operating review, portfolio health scores, workflow analytics, marketplace |
| `v2.7.0` | Jun 2026 | Client Portal V2 — Decision Journal, notification bell, AI Copilot, shareable reports |
| `v2.3.0` | Jun 2026 | Collapsible sidebar, AnimatedNumber / TextAnimate / DirectionAwareTabs, full responsive audit |

---

## Testing

```bash
pnpm test:audit              # Run all Playwright E2E tests
pnpm test:audit:report       # Open HTML test report

# Individual suites
npx playwright test tests/audit/01-auth.spec.ts
npx playwright test tests/audit/11-crud-flows.spec.ts
npx playwright test tests/audit/15-i18n-complete.spec.ts
```

---

## Key conventions

- TypeScript strict — `noUnusedLocals`, `noUnusedParameters` enforced
- All UI strings through `useLang()` — zero hardcoded copy, fully bilingual EN/FR
- RBAC: every protected route checks session via Supabase middleware
- No `overflow-hidden + maxHeight` for animated panels — use `translateY` slides
- Commit messages in English · code comments in English · UI copy bilingual
- Package manager: **pnpm** (both web root and `minerva-mobile/`)

---

## Roadmap

Minerva v4 focuses on becoming an **AI-native agency OS** — autonomous agents per module, an AI proposal copilot, and a dedicated mode for solo/duo freelance studios.

See **[docs/ROADMAP.md](./docs/ROADMAP.md)** for the full v4 plan and GitHub milestones.
