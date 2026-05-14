# Minerva OS - Application Audit & Handoff

This document details the current state of Minerva OS, identifying functional gaps, "hallucinations" (mock logic), and technical debt before the final production push.

## 1. High-Level Status

- **UI/UX**: High-fidelity "Celestial Editorial Noir" theme applied globally.
- **Backend**: Convex-backed with real-time subscriptions.
- **I18n**: Fully integrated with English and French support.
- **Authentication**: Convex Auth implemented but needs tighter integration with user profiles.

---

## 2. Identified "Hallucinations" (Mock Logic)

### 2.1. AppSettings Module
- **Team Management**: `MOCK_TEAM` is still used. Needs to fetch from `userProfiles` table.
- **Persistence**: Save buttons only trigger local state changes; they do not update Convex.
- **Profile Sync**: User name and avatar updates are not persisted to the database.

### 2.2. Agent Operations (AgentOps)
- **System Signals**: KPI cards for "Active Workflows", "Success Rate", and "Human Interventions" are hardcoded values.
- **Governance Mode**: The governance status ("Suggest-then-Approve") is a static UI element and not reflecting a real system setting.

### 2.3. Dashboard KPIs
- **Deltas**: The comparison deltas (e.g., "+18% vs last month") are hardcoded strings in the i18n files instead of being calculated from historical data.

---

## 3. Functional Gaps & TODOs

### 3.1. Billing & Finance
- **Invoice Creation**: The "New Invoice" button has no click handler/form.
- **Workspace Scoping**: `invoices` table is missing a `workspaceId` index and scoping in queries.
- **Stripe Integration**: Planned but not implemented. Payments are currently marked "paid" manually in the database.

### 3.2. Data Consistency
- **Workspace Selection**: Most modules default to `workspaces[0]`. A proper workspace switcher or context-based selection is missing for true multi-tenancy.
- **Milestones**: Schema exists but there's no UI in the main app to create or manage milestones (only visible in Portal).

### 3.3. Search & Discovery
- **Vector Search**: The infrastructure for `knowledgeBase` vector search is in the schema but not fully exposed in the UI.

---

## 4. Technical Debt

- **TypeScript**: Many `any` types remain in array handlers (`.map((x: any) => ...)`). These should be replaced with `Doc<"table">` or defined interfaces.
- **Z-Index Issues**: Some sheets and modals occasionally overlap with the sidebar in certain viewports.
- **Form Validation**: Many forms lack robust client-side validation (regex for emails, etc.).

---

## 5. Next Steps for Production

1.  **Implement `settings.updateProfile` and `settings.updateWorkspace` mutations.**
2.  **Replace `MOCK_TEAM` with a query to `userProfiles`.**
3.  **Add a "New Invoice" sheet/form in `Billing.tsx`.**
4.  **Implement dynamic KPI delta calculations** (even if simple count comparison).
5.  **Audit all `useQuery` calls** to ensure `workspaceId` is passed if available.
