# Minerva OS — Next Steps: 75% → 100%

**Current state:** v2.2.5 · UI Polish complete (skeletons, empty states, error boundaries, pagination, realtime notifications, hybrid vector search)  
**Goal:** Production-ready agency OS where every screen reads and writes real data

---

## Priority 1 — Data Layer (Unblocks everything)

The entire app runs on mock/static data today. Nothing persists. This is the single biggest gap.

### 1.1 Supabase schema + RLS

Apply the full DDL from `handoff.md` to your Supabase project, then enable Row Level Security on every table so data is isolated by `workspace_id`.

```sql
-- Run this for every table:
alter table <table> enable row level security;

create policy "workspace isolation"
  on <table> for all
  using (workspace_id = (
    select workspace_id from user_profiles where user_id = auth.uid()
  ));
```

### 1.2 User profile auto-creation

The signup trigger must create a `user_profiles` row automatically. Add the function from `handoff.md` section 0.3 to your Supabase SQL editor. Without this, the app cannot resolve the current user's workspace after sign-up.

### 1.3 Workspace creation in onboarding

The `/app/onboarding` wizard collects agency name and preferences but does not yet write to `workspaces`. Wire step 1 of the wizard to:

```ts
supabase.from('workspaces').insert({ name, slug, owner_user_id: user.id })
```

Then update the `user_profiles` row with the new `workspace_id`.

### 1.4 Module-by-module data wiring

Replace mock data in each module with real Supabase queries. Suggested order (highest business value first):

| Priority | Module | Tables needed |
|---|---|---|
| 1 | Pipeline (CRM) | `deals`, `clients` |
| 2 | Projects | `projects`, `milestones` |
| 3 | Tasks | `tasks` |
| 4 | Billing | `invoices`, `finances` |
| 5 | Approvals | `approvals`, `comments` |
| 6 | Clients | `clients` |
| 7 | Files | `assets` (Supabase Storage) |
| 8 | Proposals | `proposals`, `services` |
| 9 | Tickets | `tickets`, `sla_policies` |
| 10 | Reports | Aggregate queries across all tables |
| 11 | NPS | `nps_responses` |
| 12 | Resources | `member_availability` |
| 13 | Time Tracking | `active_timers` (new table needed) |
| 14 | Knowledge Base | `knowledge_base` + pgvector |
| 15 | Agent Ops | `agents`, `agent_threads`, `agent_messages` |

---

## Priority 2 — File Storage

The Files module currently has no real upload functionality.

- Create two Supabase Storage buckets: `assets` (project files) and `avatars` (user profile pictures)
- Add upload handlers in `src/app/app/files/page.tsx`
- Wire the `assets` table to track metadata (name, size, url, project_id)
- Add RLS policies on storage buckets matching workspace isolation

---

## Priority 3 — Email

Password reset emails work (via Supabase Auth built-in). Everything else is missing:

| Email type | Trigger | Implementation |
|---|---|---|
| Team invitation | `invitations` row insert | Supabase Edge Function + Resend |
| Welcome email | After onboarding complete | Supabase Edge Function + Resend |
| Invoice sent | Invoice status → `sent` | Supabase Edge Function + Resend |
| Risk alert | Risk flag severity = `high` | Supabase Edge Function + Resend |
| Approval request | New approval created | Supabase Edge Function + Resend |

Install Resend (`npm i resend`) and deploy a shared `send-email` Edge Function.

---

## Priority 4 — Client Portal

The portal at `/portal/[token]` is built but not connected to real data.

- The `portal_tokens` table needs to be populated when the agency creates a portal link
- Add a "Generate portal link" button in the Clients module that inserts a `portal_tokens` row with a 30-day expiry and the selected `scopes`
- The portal pages (`/portal/[token]/*`) must query data filtered by `client_id` from the token

---

## Priority 5 — Hermes AI (Real calls)

Hermes chat currently simulates responses. Wire it to the actual Anthropic API:

- The API route at `src/app/api/hermes/route.ts` (or similar) should call `@anthropic-ai/sdk` with streaming
- Pass workspace context: active projects, recent risk flags, pipeline summary
- Store messages in `agent_messages` for history
- Add the RAG function from `handoff.md` section 4.2 for semantic search over `knowledge_base`

---

## Priority 6 — Stripe Billing

The billing module shows invoices but has no payment processing.

- Add `stripe_customer_id` to `workspaces` table
- Create a Supabase Edge Function for Stripe checkout session creation
- Add webhook handler for `invoice.paid` events to update invoice status
- The retainer view needs a subscription creation flow

---

## Priority 7 — Realtime Collaboration

Several modules benefit from live updates: Approvals, Tasks, Pipeline.

```ts
// Example: live task updates
const channel = supabase
  .channel('tasks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks',
    filter: `workspace_id=eq.${workspaceId}` }, handleChange)
  .subscribe();
```

Priority targets: approval status changes, task assignments, pipeline stage moves.

---

## Priority 8 — UI Polish

These are not blocking but make the app feel production-grade:

| Item | Description | Status |
|---|---|---|
| Loading skeletons | Replace empty states with shimmer skeletons while fetching | Completed (v2.2.5) |
| Optimistic updates | Update UI immediately on mutation, revert on error | Completed (v2.2.5) |
| Empty states | Each module needs a meaningful empty state with a CTA | Completed (v2.2.5) |
| Error boundaries | Wrap each module in a React error boundary | Completed (v2.2.5) |
| Pagination | Tables with >50 rows need paginated queries | Completed (v2.2.5) |
| Search | Global command palette should search real data via pgvector | Completed (v2.2.5) |
| Notifications | Notification bell in AppHeader should show real `notifications` rows | Completed (v2.2.5) |
| Mobile responsive | Several app modules break below 768px | In Progress / Verified |

---

## Priority 9 — Testing

Current Playwright tests run against mock UI. Real data tests are needed:

- Set up a dedicated Supabase test project with seed data
- Add auth flow tests (signup → onboarding → dashboard with real session)
- Add CRUD tests per module (create task, update status, delete)
- Add RLS tests (user A cannot read user B's workspace data)

---

## Priority 10 — Performance + SEO

After data is wired, optimize:

- Add `loading.tsx` files to all app routes for streaming suspense
- Use `generateMetadata` for SEO on portal and public-facing routes
- Enable Supabase connection pooling (PgBouncer) in production
- Add `unstable_cache` for expensive aggregate queries (Dashboard KPIs)

---

## What is NOT needed for launch

- SSO / OAuth (Google, GitHub login) — Supabase makes this easy later
- Advanced AI automations (auto-task creation from emails, etc.)
- Multi-workspace support — single workspace per account is fine for V1
- Native mobile app — web app covers the use case; Expo shell can come later

---

## Completion estimate

| Priority | Effort | Unlocks | Status |
|---|---|---|---|
| 1. Data layer | 3-4 weeks | Everything | In Progress |
| 2. File storage | 3 days | Files module, proposal attachments | - |
| 3. Email | 2 days | Team invites, invoice delivery | Completed |
| 4. Client portal | 1 week | Client-facing deliverables | Completed |
| 5. Hermes AI | 1 week | AI features, proposals | Completed |
| 6. Stripe | 1 week | Real billing | - |
| 7. Realtime | 3 days | Collaboration | - |
| 8. UI polish | 1 week | Production feel | Completed (v2.2.5) |
| 9. Testing | 1 week | Confidence | - |
| 10. Performance | 3 days | Scale | - |

**Total: ~8-10 weeks of focused development to reach production-ready 100%.**

The critical path is Priority 1 (data layer) — once the Supabase schema is live and RLS is enforced, every other priority can progress independently.
