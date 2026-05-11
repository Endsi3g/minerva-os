# Minerva OS — Next Steps

## Recently completed

- Phase 4: Client portal, billing module
- Phase 5: Reports, risk flags
- Dark / light mode toggle (ThemeProvider + CSS variable overrides)

---

## In progress

### 1. Next.js migration

Evaluate migration from Vite for SSR, image optimisation, and API routes.
Planned for Phase 1+ once the marketing shell is stable.

### 2. i18n completeness audit

Several Phase 3+ pages contain hardcoded English strings.
All user-visible text must go through `useLang()` / `t.xxx`.

Pages to audit:
- `src/pages/app/Dashboard.tsx`
- `src/pages/app/Pipeline.tsx`
- `src/pages/app/Projects.tsx`
- `src/pages/app/Tasks.tsx`
- `src/pages/app/Approvals.tsx`
- `src/pages/app/Files.tsx`
- `src/pages/app/Billing.tsx`
- `src/pages/app/Reports.tsx`
- `src/pages/portal/PortalOverview.tsx`
- `src/pages/portal/PortalDeliverables.tsx`

---

## Upcoming

### 3. Authentication layer

- Email + password
- Magic link
- Role-based access control (see roles table in CLAUDE.md)
- Protect `/app/*` and `/portal/:token` routes

### 4. Database + ORM

- PostgreSQL + Prisma or Drizzle
- Replace mock data in `src/lib/mock-data.ts` with real queries

### 5. Stripe integration

- Invoice creation and payment
- Retainer recurring billing
- Webhook handling

### 6. File storage

- Cloud object storage (S3-compatible)
- Integrate with `/app/files` and portal files view

### 7. Light mode — marketing pages

The current light mode toggle applies CSS variable overrides that fully affect the app shell.
Marketing pages (Landing, Platform, Modules, etc.) use hardcoded dark inline styles
designed for the video background. A full light-mode pass for marketing pages is a separate task.

### 8. AI Summaries (Phase 5+)

- Brief-to-proposal generation (Claude API)
- Project status summary generation
- Client-ready progress report drafting
- Risk flag explanations
