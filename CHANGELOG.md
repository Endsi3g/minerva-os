# Changelog — Minerva OS

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
