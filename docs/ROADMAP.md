# Minerva OS — Roadmap v4

## Vision

> Minerva v4 transforms the platform from an organised workspace into an intelligent partner. Every module gets a dedicated AI layer that watches, suggests, and acts — so the agency owner spends time on creative work, not administration.

**Tagline:** *"Your agency, on autopilot."*

Minerva OS is not compared to ClickUp, Asana, HoneyBook, or Bonsai. It is the **intelligent Agency OS** — the first platform that centralises CRM + delivery + billing + client portal + AI in a single cohesive interface, purpose-built for agencies and creative studios.

---

## Phase 1 — AI Foundation (v4.0 → v4.1) ✅

### 1.1 Agents per Module ✅

Each core module gets a dedicated AI agent that runs autonomously in the background:

**CRM Agent**
- Lead scoring based on engagement history, deal size, and close rate patterns
- Automatic follow-up reminders when deals go quiet for 5+ days
- Pipeline health alerts: deals stalling, opportunities at risk, win-rate drops

**PM Agent**
- Scope drift detection: flags tasks added after project kick-off
- Delay prediction: highlights projects trending past their due date before it happens
- Action suggestions: "3 tasks are blocked — reassign or escalate?"

**Finance Agent**
- Billing anomaly flags: invoices sent but not viewed in 7 days, unusual expense categories
- Cash flow forecast: projected income vs. expected outflow for the next 30/60/90 days
- Late payment alerts with suggested follow-up copy

### 1.2 Proposal Copilot ✅

- Input: 3-line brief (client name, service type, approximate budget)
- Output: complete proposal — intro, scope, timeline, deliverables, pricing, T&C
- Intelligent pricing suggestion based on historical projects in the workspace
- One-click PDF export and portal delivery
- Powered by Anthropic claude-sonnet-4-6 with prompt caching for workspace context

### 1.3 Daily AI Briefing ✅

- Dashboard widget: "Today" generated each morning at 6 AM
- Content: top 3 urgent actions, projects drifting, invoices to send, approvals waiting
- Push notification (mobile) + optional email digest
- Role-aware: Owner sees financials + pipeline; PM sees tasks + blockers; Designer sees approvals due

---

## Phase 2 — Solo Studio Mode (v4.2 → v4.3) ✅

Target audience: solo/duo studios (1-2 people) — independent creative consultants, freelance designers, and freelance developers who want to look and operate like a professional agency without the friction.

### 2.1 Solo Studio Onboarding ✅

- Onboarding in under 5 minutes: name → first client → first proposal → portal link sent
- Ultra-simplified navigation (3 core items: Clients, Projects, Revenue)
- Terminology tuned for freelancers: "mandate" instead of "project", retainers foregrounded

### 2.2 Quick Proposal (10-minute flow) ✅

- Template library by service type: brand identity, web, content strategy, audit, development
- E-signature directly in the client portal — no DocuSign required
- Automatic reminder if no response within 3 days
- Proposal accepted → invoice auto-drafted from agreed scope

### 2.3 Premium Solo Portal ✅

- Custom domain support: `client.yourstudio.com` via CNAME
- Full branding control: logo, colours, typography, domain
- Client experience identical to a large agency — "look bigger than you are"

### 2.4 Frictionless Billing ✅

- Invoice auto-generated from signed proposal
- Stripe + bank transfer support
- Automatic receipt on payment, auto-reminders for overdue invoices
- Real-time payment status visible in the client portal

---

## Phase 3 — Intelligence and Ecosystem (v4.4 → v4.7) ✅

**Client Intelligence** ✅
- Portal behaviour analytics: which sections clients read, where they stall before approving, sentiment trends from NPS
- Proactive alerts: "Client hasn't viewed the proposal you sent 4 days ago"

**Auto-Workflow Suggestions** ✅
- Minerva detects recurring patterns and proposes automating them
- Example: "You always send a follow-up 3 days after invoice delivery — want to automate that?"

**Public API + Webhooks** ✅
- REST API for workspace data (clients, projects, invoices, approvals)
- Webhook events for all major state changes
- Native connectors: Zapier, Make (formerly Integromat), Slack, Linear

**Marketplace Community Tier** ✅
- Community-contributed templates, automation playbooks, and agent configurations
- One-click install from the marketplace into any workspace

---

## GitHub Milestones

| Milestone | Focus | Target | Status |
|---|---|---|---|
| **v4.0 — AI Agents** | CRM Agent, PM Agent, Finance Agent | Q3 2026 | ✅ Done |
| **v4.1 — Proposal Copilot** | Brief input → full proposal + AI pricing | Q3 2026 | ✅ Done |
| **v4.2 — Solo Studio Mode** | Onboarding, simplified nav, freelance terminology | Q4 2026 | ✅ Done |
| **v4.3 — Quick Proposal + Portal** | Templates, e-signature, custom domain | Q4 2026 | ✅ Done |
| **v4.4 — Intelligence + API** | Client analytics, auto-workflows, public API | Q1 2027 | ✅ Done |
| **v4.5 — Daily AI Briefing** | MinervaDaily widget, role-aware digest, email | Q1 2027 | ✅ Done |
| **v4.6 — UI/UX Audit** | Bug fixes, feedback validation, i18n hardening | Q2 2027 | ✅ Done |
| **v4.7 — Marketplace Community** | Community contributions, one-click install | Q2 2027 | ✅ Done |

---

## Issues by Milestone

### v4.0 — AI Agents ✅
- `feat: CRM Agent — lead scoring + pipeline health alerts`
- `feat: PM Agent — scope drift detection and delay prediction`
- `feat: Finance Agent — cash flow forecast and billing anomaly flags`
- `feat: Agent activity log — unified audit trail for all AI actions`

### v4.1 — Proposal Copilot ✅
- `feat: Proposal Copilot — brief input to full proposal generation`
- `feat: AI pricing suggestion from historical workspace projects`
- `feat: One-click PDF export from AI-generated proposals`

### v4.2 — Solo Studio Mode ✅
- `feat: Solo Studio onboarding path (under 5 minutes)`
- `feat: Freelance-adapted navigation — 3-item simplified sidebar`
- `feat: Mandate and retainer terminology mode for solo workspaces`

### v4.3 — Quick Proposal + Portal ✅
- `feat: Quick Proposal templates by service type`
- `feat: E-signature in client portal (no third-party required)`
- `feat: Custom domain support for client portal (CNAME)`

### v4.4 — Intelligence + API ✅
- `feat: Client portal behaviour analytics and engagement insights`
- `feat: Auto-workflow suggestions from detected usage patterns`
- `feat: Public REST API and webhook events`

### v4.5 — Daily AI Briefing ✅
- `feat: MinervaDaily widget — role-aware morning briefing on dashboard`
- `feat: Email digest — optional daily summary sent at 6 AM`
- `feat: Push notification support for briefing delivery`

### v4.6 — UI/UX Audit ✅
- `fix: Resolve critical JS errors across all modules`
- `fix: Form validation and error feedback improvements`
- `fix: i18n coverage — all untranslated strings identified and localised`
- `test: Full-coverage Playwright audit suite with generated report`

### v4.7 — Marketplace Community ✅
- `feat: Community tab in Marketplace — browse community-submitted items`
- `feat: Contribute modal — submit templates, automations, playbooks for review`
- `feat: POST /api/marketplace/submit — community contribution API endpoint`
- `feat: marketplace_submissions table — review workflow draft → approved → published`
