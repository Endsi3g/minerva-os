# Next Steps — Phase 4 and Beyond

## Current State (Phase 3 complete)

All core delivery modules are built with local mock data:
- Landing page (premium marketing shell with video hero, bento grid, metrics, testimonial, FAQ, CTA)
- App shell (collapsible sidebar, breadcrumb header, scroll area, routing)
- CRM Pipeline (6-stage kanban with deal cards and add-deal sheet)
- Clients (card grid with search and status filtering)
- Projects (card grid with task progress + budget bars, new project sheet)
- Tasks (flat list, tab filters, inline status cycling, add task sheet)
- Approvals (grouped queue, approve/revise actions, summary strip)
- Files (type-icon grid with search)

---

## Phase 4 — Client Experience

### 4.1 Client Portal (priority)

A separate shell (`/portal/:token`) accessible without login via a secure encrypted link. Clients see only their deliverables, project status, invoices, and approvals — nothing internal.

**Route:** `/portal/:token` — renders `ClientPortalShell` (no sidebar, branded header)

**Pages to build:**
- `/portal/:token` — Overview: project health card, upcoming milestones, pending approvals count
- `/portal/:token/deliverables` — Approval queue (client-facing read + approve/comment only)
- `/portal/:token/files` — Shared files (client_visible only)
- `/portal/:token/invoices` — Invoice list with status (draft/sent/paid) and download CTA

**Key components:**
- `ClientPortalShell` — minimal header with agency logo + client name, no sidebar
- `DeliverableReview` — full-screen deliverable view with approve / request changes modal
- `InvoiceCard` — invoice line with status pill, amount, due date, download button

### 4.2 Billing Module

Internal billing management for agency owners and finance roles.

**Pages:**
- `/app/billing` (upgrade stub to full page) — invoice list, retainer tracker, revenue summary
- `InvoiceDetail` — line items, client info, payment status, send/resend actions

**Key data:**
```typescript
type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid';
interface Invoice {
  id: string; number: string; client: string; clientId: string;
  amount: number; currency: string; status: InvoiceStatus;
  issuedDate: string; dueDate: string; items: InvoiceLineItem[];
}
interface InvoiceLineItem { description: string; qty: number; rate: number; }
interface Retainer { id: string; client: string; amount: number; billingCycle: 'monthly' | 'quarterly'; nextBillingDate: string; }
```

### 4.3 Notifications

In-app notification system (no email yet).

**Components:**
- `NotificationCenter` — slide-over panel triggered from bell icon in AppHeader
- `NotificationItem` — icon + message + timestamp + mark-as-read action

**Notification types:** approval_submitted, approval_action, task_due_soon, invoice_overdue, new_client_message

---

## Phase 5 — Intelligence

### 5.1 Reports

**Page:** `/app/reports` — agency health dashboard

Metrics to surface:
- Revenue per client (bar chart)
- Pipeline conversion rate by stage
- Project on-time delivery rate
- Approval cycle time (avg days pending → resolved)
- Team utilisation (tasks per assignee)

**Charting library:** Recharts (lightweight, composable, compatible with Tailwind) — add via npm when building this phase.

### 5.2 Risk Flags

Proactive warnings surfaced in Dashboard and project cards:
- Projects past due date without status update
- Invoices overdue by 7+ days
- Approvals pending more than 5 business days
- Pipeline deals stale in stage for 14+ days

### 5.3 AI Summaries (future)

- Brief-to-proposal generation (Claude API)
- Project status summary generation
- Client-ready progress report drafting

---

## Technical Debt to Address in Phase 4

1. **Real authentication** — replace stub with Supabase or Clerk (email + magic link, role-based)
2. **Database** — migrate mock data to PostgreSQL via Prisma or Drizzle; deploy on Railway or Supabase
3. **File storage** — connect Files module to S3 or R2; implement actual upload
4. **Stripe integration** — wire Billing module to Stripe for invoice sending and payment tracking
5. **Next.js migration** — evaluate migration from Vite for SSR, image optimisation, and API routes
6. **i18n completeness audit** — several Phase 3 pages have hardcoded English strings; move to `useLang()`

---

## Immediate Pre-Phase-4 Tasks

- [ ] Add `.gitignore` if not present (ensure `node_modules`, `dist`, `.env` are excluded)
- [ ] Set up GitHub Actions CI (type check on push to main)
- [ ] Upgrade stub pages: Billing, Reports, Settings (currently just `<p>Coming soon</p>` placeholders)
- [ ] Add `MOCK_INVOICES` and `MOCK_RETAINERS` to mock-data.ts
- [ ] Add invoice/retainer types to types.ts
- [ ] Design client portal routes and token-based access pattern (even if stubbed initially)
