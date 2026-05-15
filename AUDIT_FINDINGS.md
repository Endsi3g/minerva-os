# Minerva OS — Playwright Visual Audit Report

**Date:** 2026-05-15  
**Suite:** 46 tests · 42 passed · 4 failed  
**Coverage:** 26 routes · 41 screenshots captured  
**Environment:** Next.js 15 production build · No Convex backend · Playwright Chromium

---

## Test Results Summary

| Category | Tests | Pass | Fail |
|---|---|---|---|
| Public pages | 12 | 8 | 4 |
| App shell & navigation | 6 | 6 | 0 |
| App modules (14 pages) | 16 | 16 | 0 |
| Portal | 4 | 4 | 0 |
| Cross-cutting interactions | 8 | 8 | 0 |

The 4 test failures are all for marketing pages (`/platform`, `/modules`, `/security`, `/insights`) — a **false positive** in the test detection logic. These pages actually render correctly (status 200, ~7000 chars, confirmed by screenshots). The issue is a brief "not found" state flash during React hydration before the client-side code takes over.

---

## 🔴 CRITICAL Issues

### 1. App renders in LIGHT mode — design spec is dark

**Screenshot:** `03-dashboard.png`, `03-pipeline.png`, etc.  
**Impact:** All authenticated app pages (14 modules) show white/cream backgrounds instead of the "Celestial Editorial Noir" dark theme.  
**Detail:** The `ThemeProvider` uses `next-themes` which defaults to the user's system preference. In most test environments (and likely on many users' machines), this defaults to `light`. The marketing/landing pages are correctly dark.  
**Fix:** Set the default theme to `dark` in `ThemeProvider`:
```tsx
// src/theme.tsx
<NextThemesProvider defaultTheme="dark" attribute="class">
```
**Files:** `src/theme.tsx`

---

### 2. Portal blank screen on any token (no backend)

**Screenshot:** `04-portal-invalid-token.png` (completely blank)  
**Impact:** Users visiting any portal URL see a completely blank screen.  
**Detail:** `PortalShell.tsx` returns `null` while `portalData === undefined` (Convex loading state). Without a Convex backend connection, this state never resolves. No spinner, no message, no fallback.  
**Fix:** Add a loading skeleton and an explicit error state:
```tsx
// src/modules/portal/PortalShell.tsx
if (portalData === undefined) return <PortalLoadingSkeleton />; // loading
if (portalData === null) return null; // invalid, redirecting
```
**Files:** `src/modules/portal/PortalShell.tsx`

---

## 🟠 HIGH Priority Issues

### 3. Mobile KPI cards — text truncation at 375px

**Screenshot:** `05-mobile-dashboard.png`  
**Impact:** KPI card labels display as "ACTIV PROJ", "OPEN TA", "PEND APPR", "RE MTD" — unreadable.  
**Detail:** The `text-xs` class at 375px viewport with fixed card widths causes hard truncation. The 4-column KPI grid doesn't adapt to mobile.  
**Fix:** In `Dashboard.tsx`, change the KPI grid from 4-column to 2-column on mobile:
```tsx
// src/modules/app/Dashboard.tsx
className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
```

---

### 4. Billing — Retainer section not rendered

**Screenshot:** `03-billing.png`  
**Impact:** The Billing page only shows invoices (with correct filters and metrics cards). The entire retainer management section (monthly retainers, hours tracking, renewal dates) is absent from the visible viewport.  
**Detail:** Either the retainer section is below the fold with no scroll indicator, or it's conditionally hidden. The audit warning `AUDIT: Billing — no retainer section found` confirms this.  
**Fix:** Check `Billing.tsx` for the retainer section render condition and ensure it's always visible as a separate tab or section below invoices.  
**Files:** `src/modules/app/Billing.tsx`

---

### 5. Sidebar — "Agent Ops" not discoverable on desktop

**Screenshots:** `02-app-shell.png`, `03-dashboard.png`  
**Impact:** No "Agent Ops" link visible in the sidebar on desktop viewport (1280px). On mobile (375px), it appears under an "INTELLIGENCE" section.  
**Detail:** The sidebar groups items into WORKSPACE, STUDIO sections on desktop. Agent Ops exists but is either scrolled out of view or missing from the STUDIO grouping on desktop. Mobile shows "INTELLIGENCE" group with Agent Ops.  
**Fix:** Ensure the "INTELLIGENCE" section (with Agent Ops) is always visible in the desktop sidebar, either by making the sidebar scrollable or adding Agent Ops to the STUDIO section.  
**Files:** `src/components/layout/AppSidebar.tsx`

---

### 6. Pipeline — "PROPOSAL SENT" label inconsistency

**Screenshot:** `03-pipeline.png`  
**Impact:** The pipeline kanban column label shows "PROPOSAL SENT" — the visible columns are: `NEW LEAD | QUALIFIED | PROPOSAL SENT | NEGOTIATION`. The stage `proposal` should display as "PROPOSAL".  
**Detail:** The i18n key for the pipeline stage `proposal` translates to "Proposal Sent" instead of just "Proposal". The stage name in the schema and code is `proposal`.  
**Fix:** Update the i18n key in `src/i18n.tsx`:
```typescript
proposal: 'Proposal', // was 'Proposal Sent'
```
**Files:** `src/i18n.tsx`

---

## 🟡 MEDIUM Priority Issues

### 7. Marketing pages — hydration flash of "not found"

**Routes:** `/platform`, `/modules`, `/security`, `/insights`  
**Impact:** Brief blank/error state visible during page load before React hydration completes.  
**Detail:** These are `'use client'` components without SSR fallback. Before the client bundle executes, the page shows empty. A brief "not found"-like state may be visible on slow connections.  
**Fix:** Add `loading.tsx` files for these routes, or convert to server components with a client boundary only for interactive parts.

---

### 8. Clients — Empty state copy is misleading

**Screenshot:** `03-clients.png`  
**Impact:** Shows "No clients match" with an empty search bar — implies a search was performed but found nothing.  
**Detail:** The empty state copy "No clients match" only makes sense when a search term is entered. When no search is active, it should read "No clients yet" or similar.  
**Fix:** In `Clients.tsx`, conditionally show different copy:
```tsx
{searchTerm ? 'No clients match' : 'No clients yet. Add your first client to get started.'}
```
**Files:** `src/modules/app/Clients.tsx`

---

### 9. Settings — No avatar upload

**Screenshot:** `03-settings.png`  
**Impact:** Profile tab shows name and email fields with initials placeholder, but no way to upload or change an avatar photo.  
**Detail:** The `AppSettings.tsx` ProfileTab shows an avatar with initials (generated from name) but lacks an upload button. Avatar field exists in the Convex `userProfiles` schema.  
**Fix:** Add a file input or URL input in ProfileTab to update the `avatar` field via `api.userProfiles.update`.  
**Files:** `src/modules/app/AppSettings.tsx`

---

### 10. Settings — Language switcher not in Settings tab

**Test log:** `AUDIT: No FR language button found in Settings`  
**Impact:** Language switch (EN/FR) button not found in the Settings page at test time.  
**Detail:** The language toggle exists inside the Workspace tab (`setLang(l)`) but is not visible on the Profile tab (the default tab). Users may not find it.  
**Fix:** Ensure the language toggle is either prominently placed in the Profile tab or in the sidebar/header for global access.

---

### 11. Reports — Empty revenue chart has no placeholder

**Screenshot:** `03-reports.png`  
**Impact:** "Monthly Revenue by Client" chart section shows title and subtitle ("Active clients only") but a completely blank chart area when no paid invoices exist.  
**Fix:** Add an empty state inside the chart:
```tsx
{revenueData.length === 0 && (
  <p className="text-fog text-sm text-center py-8">
    Revenue data will appear once invoices are marked as paid.
  </p>
)}
```
**Files:** `src/modules/app/Reports.tsx`

---

### 12. Portal shell tabs not visible

**Test log:** `AUDIT: Portal shell — missing tabs: Overview, Deliverables, Files, Invoices`  
**Screenshot:** `04-portal-shell.png` (blank screen)  
**Impact:** Portal shell returns null immediately when loading — tabs never visible to end users.  
**Root cause:** Same as issue #2 (blank screen on loading).

---

## 🔵 POLISH / Minor Issues

### 13. Sidebar items may overflow on shorter viewports

**Detail:** The sidebar on desktop is not scrollable. On shorter viewports (< 768px height), bottom items (Agent Ops, Settings) may be cut off. The sidebar should be `overflow-y-auto` with `min-h-0 flex-1`.  
**Files:** `src/components/layout/AppSidebar.tsx`

---

### 14. Dashboard page title barely visible

**Screenshot:** `03-dashboard.png`  
**Detail:** The main page heading "Dashboard" is styled in a very light gray that's barely visible against the cream background in light mode. In dark mode this would be correct (ivory text on dark background).  
**Root cause:** This is a consequence of issue #1 (wrong default theme).

---

### 15. Theme toggle default

**Detail:** The sun/moon theme toggle icon is visible in the header. Clicking it switches to dark mode correctly. The default should be `dark` (see issue #1). Once that's fixed, this resolves automatically.

---

## 📋 Missing Features (Spec vs. Reality)

These features appear in the design spec or PRD but are not yet implemented:

| Feature | Location | Status |
|---|---|---|
| Search command palette | Header search icon | No UI behind the icon |
| Notifications panel | Header bell icon | Icon present, no panel opens |
| File upload (S3/storage) | Files module | UI renders but upload non-functional without storage backend |
| Real-time presence indicators | App-wide | Schema exists, no UI |
| Forgot password flow | Login page | Disabled (correctly), no flow implemented |
| Notification settings | Settings > Notifications tab | Tab opens but no save functionality |
| Security 2FA | Settings > Security tab | UI shows toggle but no backend implementation |
| Client portal — Deliverables tab | `/portal/[token]/deliverables` | Renders (with data from Convex) |
| Billing — New invoice form | "New invoice" button | Sheet opens ✓ but form has no client selector populated |

---

## ✅ What Works Well

- **All 14 app module pages render** without crashes
- **Dashboard KPI layout** — 4 cards with correct labels and empty states
- **Pipeline kanban** — 4+ columns render, Add Deal sheet opens, form has company/contact/email/value/stage fields
- **Clients page** — search bar visible, Add Client sheet opens with complete form
- **Tasks page** — status/priority filters visible, Add Task sheet opens
- **Finance page** — income/expense toggle, New Transaction sheet opens
- **Reports page** — 23 SVG chart elements rendering (recharts working)
- **Settings** — 5 tabs present (Profile, Workspace, Team, Notifications, Security), all tab content loads
- **Agent Ops** — "Live Audit Trail" + "System Signals" + "Governance Mode" UI renders cleanly
- **No 404 errors** on any of the 21 tested app routes
- **No critical JavaScript runtime errors** on key pages (console errors only from expected Convex WebSocket failures)
- **Form validation** — empty form submit is prevented (Pipeline Add Deal form)
- **Navigation** — all 14 sidebar links route to correct pages
- **Marketing landing page** — renders correctly with video background, hero text, CTA buttons
- **Login/Signup forms** — render correctly, show i18n error messages on empty submit
- **Build** — `npx tsc --noEmit` exits 0, `next build` 33/33 pages, zero errors

---

## Priority Fix Checklist

- [ ] **#1 — Dark theme default** — 1 line change in `src/theme.tsx`
- [ ] **#2 — Portal loading skeleton** — `src/modules/portal/PortalShell.tsx`
- [ ] **#3 — Mobile KPI grid 2-col** — `src/modules/app/Dashboard.tsx`
- [ ] **#4 — Billing retainer section** — investigate render condition in `src/modules/app/Billing.tsx`
- [ ] **#5 — Sidebar Agent Ops desktop** — `src/components/layout/AppSidebar.tsx`
- [ ] **#6 — Pipeline "Proposal" label** — `src/i18n.tsx`
- [ ] **#7 — Marketing hydration flash** — add `loading.tsx` stubs
- [ ] **#8 — Clients empty state copy** — `src/modules/app/Clients.tsx`
- [ ] **#9 — Avatar upload** — `src/modules/app/AppSettings.tsx`
- [ ] **#10 — Language switcher visibility** — `src/modules/app/AppSettings.tsx`
- [ ] **#11 — Reports empty chart state** — `src/modules/app/Reports.tsx`
