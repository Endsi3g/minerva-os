# Changelog — Minerva OS

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [8.1.0] — 2026-06-11

### Added

- **SLARiskAudit module** (`src/modules/app/SLARiskAudit.tsx`): New Hermes AI assistant page — animated health gauge (0–100), live scanning animation, violations table with expandable detail rows, severity filter tabs (Critical / High / Medium / Low), and SLA threshold reference panel.
- **`/app/sla-audit` route** (`src/app/app/sla-audit/page.tsx`): Dedicated page wrapping SLARiskAudit in ErrorBoundary + Suspense.
- **ClientForm module** (`src/modules/app/ClientForm.tsx`): Shared create/edit form for clients with Company, Classification, and Description sections; supabase insert/update/delete.
- **`/app/clients/create` + `/app/clients/[id]/edit` routes**: Thin page wrappers for ClientForm.
- **ProjectForm module** (`src/modules/app/ProjectForm.tsx`): Shared create/edit form for projects; loads clients dropdown from supabase.
- **`/app/projects/create` + `/app/projects/[id]/edit` routes**: Thin page wrappers for ProjectForm.
- **`/app/delivery/approvals` route**: Standalone approvals page wrapping the existing Approvals module.
- **Contracts module** (`src/modules/app/Contracts.tsx`): Full contract management — status filters (draft / sent / signed / declined), expandable cards, inline editor modal, duplicate/send actions, supabase clients dropdown.
- **`/app/contracts` route**: Page wrapper for Contracts.
- **DownloadsTab in AppSettings**: Desktop (Windows .exe, macOS .dmg) and mobile (iOS, Android) download links with 3-column layout.
- **Hermes Assistants sidebar section** (AppSidebar): Three nav links — Proposal Builder, Call Prepper, SLA Risk Audit — with dedicated icons.
- **i18n keys**: `settings.tabs.privacy`, `settings.tabs.downloads`, `settings.privacy.*`, `settings.downloads.*` added in EN and FR.

### Changed

- **Global accent color**: Indigo (#4F46E5) → Sage (#7FA38A) in both light (`:root`) and dark (`:root.dark`) modes across all semantic tokens (`--primary`, `--primary-hover`, `--primary-active`, `--primary-soft`, `--primary-soft-border`).
- **AppShell**: Sidebar collapse state removed; `collapsed` is always `false`, `toggle` is a no-op.
- **AppSidebar**: Fixed width 240px — collapse logic, collapse button, and Folder/Today sections removed. QUICK LINKS section replaces them (Projects, Tasks, Approvals, File Vault, Contracts). Logo fill updated to Sage.
- **AppHeader**: Sidebar toggle button removed. PAGE_LABELS extended with `/app/sla-audit`, `/app/contracts`, `/app/delivery/approvals`, `/app/intelligence`, `/app/delivery`, `/app/finance-hub`.
- **Files.tsx**: Full-screen drag-and-drop overlay using `dragCounter` ref. Category filter tabs (All / Images / Videos / Documents / Archives / Other) with live counts.
- **Dashboard Quick Actions**: Proposal Copilot, Call Prepper, SLA Risk Audit now navigate directly (`router.push`) to `/app/proposals`, `/app/call-preps`, `/app/sla-audit` instead of opening the AI Sheet.
- **proposals/page.tsx**: Redirect removed — now renders `<Proposals />` module directly inside ErrorBoundary + Suspense.
- **AppSettings**: Semantic token migration throughout — all hardcoded dark tokens (`text-ivory`, `text-fog`, `text-silver`, `bg-midnight`, `bg-dusk`, `bg-obsidian`, `text-ember`, `bg-ember`, `border-ember`, `text-warm`, `bg-warm`, `border-warm`, `text-sage`, `bg-sage`, `bg-ivory`, `text-obsidian`) replaced with `text-foreground`, `text-muted-foreground`, `bg-surface`, `bg-secondary`, `bg-background`, `text-destructive`, `text-warning`, `bg-primary`, `bg-foreground`, `text-background`. Toggle off-state: `bg-white/10` → `bg-secondary`. PrivacyTab strings externalized via i18n. Privacy and Downloads added to `settingsTabs`.
- **AgentsList, AgentOps, NPS**: Semantic token migration — hardcoded dark palette replaced with CSS variable tokens.
- **NPS**: Promoter / Passive / Detractor guide section added above the score gauge.

---

## [7.0.1] — 2026-06-08

### Changed
- **README.md**: Complete rewrite for clarity — "two sides of Minerva" framing, architecture overview with data flow, roles table, condensed releases table, cleaner quick start.
- **scripts/dev.bat** · **scripts/dev.sh**: Version bump v1.7.0 → v7.0.0, removed duplicate pnpm check in dev.sh.
- **scripts/generate-icons.mjs**: PWA icon background color `#0A0D14` → `#4F46E5` (StackAI indigo).
- **public/sw.js**: Rebuilt service worker from updated Next.js production build.

---

## [7.0.0] — 2026-06-08

### Changed — StackAI Light Mode design system

Complete visual redesign of Minerva OS from "Celestial Editorial Noir" (dark-first) to **StackAI Light Mode** — a clean, enterprise-grade light aesthetic with indigo accent, precise shadows, and full semantic token coverage.

- **Design tokens** (`src/index.css`): Full `:root` palette rewrite — white background (`#FFFFFF`), indigo primary (`#4F46E5`), `#F8FAFC` sidebar, slate foreground (`#0F172A`), soft borders (`#E2E8F0`). Dark mode preserved with toggle, updated to indigo primary (`#818CF8`).
- **Typography**: Playfair Display removed. Full Inter sans-serif across all surfaces.
- **AppSidebar** (`src/components/layout/AppSidebar.tsx`): Complete rewrite — inline SVG "M" logo with indigo badge, three nav sections (Workspace / Intelligence / Finance), collapsed 56px icon mode with Radix tooltips, plan usage card.
- **AppHeader** (`src/components/layout/AppHeader.tsx`): Light mode — white background, muted-foreground icons, semantic hover states.
- **AppShell** (`src/components/layout/AppShell.tsx`): Mobile nav redesigned with CSS variable colors, removed hardcoded dark values.
- **ChatSidebar** (`src/components/layout/ChatSidebar.tsx`): User bubbles indigo, assistant bubbles secondary, full light mode.
- **All 40 app modules**: 179 hardcoded hex values (`#0A0D14`, `#111522`, `#F5F1E8`, etc.) replaced with semantic Tailwind tokens.
- **All portal modules** (10 routes): Same hex-to-token migration.
- **Auth pages** (forgot-password, reset-password, verify-email, invite, offline, not-found): Inline dark styles converted to CSS variable references.
- **Theme default** (`src/theme.tsx`): `'dark'` → `'light'`.
- **Viewport theme color** (`src/app/layout.tsx`): `#0A0D14` → `#FFFFFF`.

### Added

- **`src/lib/status.ts`**: Centralised status pill styles (`STATUS_STYLES`, `STATUS_STYLES_DARK`, `statusClass()`) — soft pastel pills replacing hardcoded color strings across all modules.
- **i18n corrections**: Billing (21 toasts), Pipeline (1), Tasks (5), Projects (6) — replaced `lang === 'fr' ?` branching with `t.*` keys.

### Fixed — Next.js 15 build compatibility

- **`@thesvg/react` not installed**: Replaced `import { Google, Github }` in `SignUp.tsx` with inline SVG components.
- **`date-fns` + `motion` in `optimizePackageImports`**: Removed from `next.config.ts` — caused `TypeError: Cannot read properties of undefined (reading 'length')` during webpack compilation.
- **`/welcome/page.tsx`**: Converted `'use client'` redirect to server-side `redirect()` call.
- **`/login/page.tsx`**: Converted to server component with `force-dynamic` and `<Suspense>` boundary.
- **`/app/app/layout.tsx`**: Removed `'use client'`, added `export const dynamic = 'force-dynamic'` and `<Suspense>` — resolves `useSearchParams()` prerender errors across all `/app/*` routes.
- **`'use client'` directives**: Added to `Billing.tsx`, `Projects.tsx`, `Pipeline.tsx`, `Tasks.tsx`, `Approvals.tsx`, `Reports.tsx` — previously missing, causing server component import errors.
- **`/app/app/billing/page.tsx`**, **`/app/app/clients/page.tsx`**, **`/app/app/projects/page.tsx`**: Converted to server components with Suspense.

---

## [4.7.0] — 2026-06-07

### Added
- **Marketplace Community Tier**: New "Community" tab in the Marketplace — browse and install community-contributed templates, automations, and playbooks.
- **Contribute modal**: Any workspace member can submit a template or automation for community review directly from the Marketplace.
- **POST /api/marketplace/submit**: New API endpoint that creates a `marketplace_items` entry (status: submitted) and a `marketplace_submissions` record for the review workflow.
- **marketplace_submissions table**: Supabase migration adding the community submission table with RLS and a draft → submitted → approved → published review flow.
- **is_community column**: Added to `marketplace_items` to distinguish official from community-contributed items.

---

## [4.6.0] — 2026-06-07

### Changed
- Full UI/UX audit pass across all modules — fixed two critical JS runtime errors.
- Improved form validation and error feedback in Proposals, Tasks, and Approvals.
- i18n hardening: all previously untranslated strings localised in EN and FR.
- Added full-coverage Playwright audit suite with generated HTML report.

---

## [4.5.0] — 2026-06-05

### Added
- **MinervaDaily widget**: Role-aware AI morning briefing on the Dashboard — top 3 urgent actions, drifting projects, invoices to send, approvals waiting.
- **Email digest**: Optional daily summary delivered at 6 AM (Resend integration).
- **Push notification support**: Morning briefing delivered to mobile via push token.

---

## [4.4.0] — 2026-06-04

### Added
- **Client portal analytics**: Behaviour tracking — which sections clients visit, time spent, and engagement signals.
- **AI workflow suggestions**: Minerva detects recurring usage patterns and proposes automations automatically.
- **Public REST API v1**: Full workspace data API (clients, projects, invoices, approvals) — available on the Scale plan.
- **Webhook system**: Event subscriptions for all major state changes with delivery tracking.
- **API keys table**: Workspace-scoped API keys with scopes and rate limits.

---

## [4.3.0] — 2026-06-04

### Added
- **Quick Proposal templates**: Library by service type (brand identity, web, content strategy, audit, development).
- **E-signature in client portal**: Clients can sign proposals directly — no third-party DocuSign required.
- **Custom domain portal**: Support for `client.yourstudio.com` via CNAME configuration.

---

## [4.2.0] — 2026-06-04

### Added
- **Solo Studio Mode**: 3-item simplified sidebar navigation for solo/duo studios.
- **Mandate terminology**: Freelancer-adapted language — "mandate" instead of "project", retainers foregrounded.
- **Solo quick-start**: SoloQuickStart component with guided onboarding in under 5 minutes.

---

## [4.1.0] — 2026-06-04

### Added
- **Proposal Copilot**: 3-line brief input → complete proposal (intro, scope, timeline, pricing, T&C) powered by claude-sonnet-4-6 with prompt caching.
- **AI pricing suggestion**: Intelligent pricing based on historical workspace projects.
- **One-click PDF export**: AI-generated proposals exportable to PDF via `@react-pdf/renderer`.

---

## [4.0.0] — 2026-06-04

### Added
- **CRM Agent**: Lead scoring, automatic follow-up reminders, and pipeline health alerts.
- **PM Agent**: Scope drift detection, delay prediction, and task escalation suggestions.
- **Finance Agent**: Cash flow forecast, billing anomaly flags, and late payment alerts.
- **Agent activity log**: Unified audit trail for all AI agent actions across modules.
- **Agent builder**: Custom agent creation with goal descriptions, rules, system instructions, and RAG knowledge tables.

---

## [3.3.0] — 2026-06-04

### Added
- **AI Agent Builder**: Full custom agent creation with goal descriptions, custom rules, system instructions, and RAG knowledge tables.
- **Plan-Locked Custom API Keys**: Enabled custom OpenAI and Anthropic API key storage (backed by Supabase/localStorage) restricted to Growth and Scale plan tiers.
- **Relevance AI Sidebar Redesign**: Rebuilt from scratch with workspace selection, workforce groups, active agents list, and dynamic actions/credits progress card in footer.
- **Cosmic Welcome Dashboard**: Restructured dashboard with pixel-art space welcome banner, floating shortcuts, and orbital concentric "Recent" agent cards.
- **Supabase Realtime Synchronization**: Created migration `20260604000003_realtime_publications.sql` enabling full replica identity and adding core database tables to `supabase_realtime` publication.

### Changed
- Reorganized codebase structure: extracted inline sub-components (such as `AgentOrbit` and `CreateAgentModal`) from `AgentsList.tsx` and `AgentBuilder.tsx` to dedicated components in `src/components/agents/`.
- Pruned unused states and variables across the agent list and builder modules.

---

## [1.8.1] — 2026-06-03

### Changed
- Finance summary cards: replaced `shadow-none` with `shadow-card` elevation
- Finance summary cards: applied spotlight gradient backgrounds — amber (Revenue), rose (Expenses), sage (Net Profit) — consistent with Dashboard KPI cards

---

## [1.8.0] — 2026-06-02

Design system rewrite (Celestial Editorial Noir + Framer polish) on top of the v2.3.0 foundation.

### Added
- Cinematic video banner on Dashboard (`/dashboard-banner.mp4` — autoplay, loop, muted, parallax zoom on hover)
- Framer-inspired CSS tokens: `--tracking-display/heading/subheading`, `--shadow-card/raised/float`, `--gradient-sage/amber/rose-spot`
- Spotlight gradient utility classes: `.spotlight-sage`, `.spotlight-amber`, `.spotlight-rose`
- Elevation utility classes: `.shadow-card`, `.shadow-raised`, `.shadow-float`
- Inter Variable OpenType features globally (`cv01 cv05 cv09 cv11 ss03 ss07`)
- DynamicIsland component in AppShell header
- Global h1/h2 letter-spacing tightened to `-0.04em`, h3 to `-0.025em`
- Standalone onboarding routes at `/onboarding` and `/onboarding/discover` (no sidebar, no header)

### Changed
- Dashboard KPI cards: spotlight gradient backgrounds + `shadow-card` elevation
- AppSettings: hardcoded dark hex values replaced with CSS custom properties
- `Toaster` now reads `useTheme()` dynamically instead of hardcoded `dark`
- RunwayML monochrome design system applied across all app surfaces (obsidian/midnight/dusk palette, Inter + Playfair Display)

### Removed
- macOS-style floating Dock from AppShell (imports `Dock`, `DockCard`, `ClipboardCheck`, `FileBox`, `Settings` cleaned up)
- Duplicate onboarding routes under `/app/app/onboarding/` (replaced by standalone `/onboarding/`)
- Static `image.png` hero on Dashboard banner

### Fixed
- Onboarding redirect guards: middleware correctly protects `/onboarding` routes
- Responsive layout grids on Settings and Approvals pages

---

## [2.3.0] — 2026-06-02

### Added
- Collapsible sidebar groups with i18n labels (EN/FR)
- Support page with FAQ accordion, contact form, and keyboard shortcuts reference
- Changelog page
- `DirectionAwareTabs` component — animated tab transitions with directional awareness
- `AnimatedNumber` component — spring-animated numeric counters (KPI cards, Finance)
- `TextAnimate` component — staggered text reveal (calmInUp, fadeIn, etc.)
- shadcn `Badge`, `Kbd`, `Separator` components integrated

### Changed
- Dashboard, Pipeline, Projects, Tasks, Clients, Files, AppSettings all migrated to `TextAnimate` headings
- KPI cards updated with `AnimatedNumber` for live-counting values
- Responsive audit across all 19 app modules

### Fixed
- Duplicate `forgotPassword`/`resetPassword` i18n keys removed
- `PresenceAvatars` list key changed from index to `presence.user`
- Dashboard `DirectionAwareTabs` tab state restored after migration

---

## [2.1.0] — 2026-06-01

### Added
- Secure client portal with email verification gate, scope-filtered content, and activity logs
- Automatic mock-data fallback for client portal and proposals in demo/staging environments
- `DEMO_MODE` environment flag for safe demo environments
- Client portal shareable link generation
- Hermes message persistence across sessions
- Error boundary for portal and chat components

### Changed
- Mobile app upgraded to Expo 54 + Sentry error tracking
- Migrated from npm to pnpm
- Dev service worker auto-cleanup in development mode

### Fixed
- Comprehensive API route security hardening (input validation, auth checks, rate limiting)
- `createBrowserClient` used to properly share Supabase session between client and middleware

---

## [2.0.1] — 2026-05-29

### Changed
- Landing page CTA section redesigned
- Login page visual overhaul
- Signup hero video updated (greyscale treatment)
- Electron welcome screen launch sequence

---

## [2.0.0] — 2026-05-29

### Added
- Landing page rebuilt from scratch: hero sections, scroll animations, nav links
- i18n language toggle (EN/FR) on landing
- Back navigation buttons on auth pages
- In-app Changelog panel (clickable from sidebar)

### Changed
- Full landing overhaul with editorial editorial-noir aesthetic

---

## [1.9.2] — 2026-05-29

### Added
- Welcome splash screen as app entry point
- Separate onboarding flow (decoupled from main app shell)

### Changed
- Rebranded landing to **Minerva OS** (previously generic name)
- Signup page hue corrected

---

## [1.9.1] — 2026-05-29

### Added
- OpenRouter fallback logic for Hermes AI chat (failover when primary model unavailable)

---

## [1.9.0] — 2026-05-29

### Added
- VEX-inspired hero section on landing
- Cult UI component library integrated
- Aurora animated sign-up background
- Supabase live authentication (replaces mock auth)
- Changelog panel in sidebar

### Fixed
- Test suite failures resolved (passing suite restored)

---

## [1.7.0] — 2026-05-16

Sprint 11 — Production Readiness.

### Added
- Full RBAC (Role-Based Access Control) across all modules
- Transactional email triggers (onboarding, approvals, invoices)
- PDF export for proposals and invoices
- Application monitoring setup
- Mobile app foundation (React Native)
- 146/146 automated tests passing

---

## [1.0.0] — 2026-05-11

Initial release — Phases 0–4 complete.

### Added
- **Phase 0**: PRD, design system (Celestial Editorial Noir), auth flows
- **Phase 1**: App shell, sidebar, routing, shadcn/ui, design tokens
- **Phase 2**: CRM lite, intake forms, proposal builder, account creation, Pipeline board (kanban + DnD)
- **Phase 3**: Project hub, tasks, files, approvals
- **Phase 4**: Client portal, billing module, invoice visibility
- **Phase 5 (partial)**: Reports, risk flags, AI Daily Briefing, Hermes AI chat, RAG vector search
- Supabase backend (PostgreSQL, Auth, Storage)
- Bilingual UI — English / French (Canadian)
- Stripe checkout integration
- Multi-agent orchestration layer (Hermes streaming, AgentOps governance panel)
- AI tools: Strategic Audit, Proposal Writer co-pilot, Meeting Briefs, Lead scoring webhook
