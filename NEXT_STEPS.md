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

### 4. Database & Real-time (Convex)

- Replace remaining mock data in `src/lib/mock-data.ts` with real Convex queries.
- Ensure all business logic is handled via Convex mutations and actions.
- Implement unified error handling for backend functions.

### 5. Stripe integration

- Synchronise `invoices` and `retainers` tables with Stripe via webhooks.
- Implement checkout flows for one-off payments and retainers.
- Handle subscription lifecycle events (renewal, cancellation).

### 6. File storage (Convex)

- Migrate `assets` to use Convex File Storage.
- Implement secure upload/download URLs.
- Integrate with `/app/files` and portal files view.

### 7. Light mode — marketing pages

The current light mode toggle applies CSS variable overrides that fully affect the app shell.
Marketing pages (Landing, Platform, Modules, etc.) use hardcoded dark inline styles
designed for the video background. A full light-mode pass for marketing pages is a separate task.

### 8. AI Summaries (Phase 5+)

- Brief-to-proposal generation (Claude 4.6 Sonnet API)
- Project status summary generation (GPT-5.4 API)
- Client-ready progress report drafting
- Risk flag explanations
