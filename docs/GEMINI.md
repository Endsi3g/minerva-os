# GEMINI.md — Context for Gemini CLI

This document provides context for working on the Minerva OS codebase using Gemini CLI or Google AI tools. For the full product requirements, see [minerva-os-prd.md](./minerva-os-prd.md). For comprehensive project conventions, see [CLAUDE.md](../CLAUDE.md). For development patterns, see [AGENTS.md](../AGENTS.md).

---

## Project Overview

**Minerva OS** is the internal agency operating system for Uprising Studio. It is a premium SaaS platform that centralises:
- CRM and lead pipeline
- Client onboarding and account management
- Project hub, tasks, and kanban
- Deliverable approvals
- File and asset management
- Billing and retainers
- Reporting and analytics
- Client-facing portal

**Current state:** Phases 0–3 complete. The landing page, auth screens, app shell, and all Phase 3 modules (Projects, Tasks, Approvals, Files) are built and working with local mock data. Phase 4 (client portal + billing) is next.

---

## Tech Stack

```
Runtime:        Node 20+
Framework:      Vite 6 + React 18
Language:       TypeScript 5.6 (strict mode)
Routing:        react-router-dom v7
Styling:        Tailwind CSS v4 (no postcss, no tailwind.config.js)
Animation:      motion/react (Framer Motion v11+)
Icons:          lucide-react
UI components:  Radix UI primitives + custom shadcn/ui reskin
i18n:           Custom LangContext (English + French)
State:          Local React state (useState) + mock data — no backend yet
```

---

## Design System at a Glance

The design is **Celestial Editorial Noir** — premium, dark, editorial.

| Token | Value | Usage |
|---|---|---|
| Obsidian | `#0A0D14` | Page background |
| Midnight | `#111522` | Cards, inputs |
| Dusk | `#171C2A` | Elevated surfaces |
| Ivory | `#F5F1E8` | Primary text, CTA buttons |
| Silver | `#B8BDC7` | Secondary text |
| Fog | `#8A9099` | Metadata, tertiary |
| Sage | `#7FA38A` | Success, active |
| Warm | `#B89B6A` | Warning |
| Ember | `#A86A6A` | Error / destructive |

**Typography:** Playfair Display (display headings only) + Inter (all body/UI text).

**Motion:** Slow, cinematic. Duration 0.4–0.9s. Easing `cubic-bezier(0.22, 1, 0.36, 1)`. No bouncy springs.

**Never use:** neon colors, saturated gradients, `overflow-hidden` + `maxHeight` for animated panels, em dashes in UI copy.

---

## Key Files

| File | Purpose |
|---|---|
| `src/index.css` | Tailwind v4 config, `@theme` tokens, Google Fonts |
| `src/i18n.tsx` | All EN/FR translations via `useLang()` |
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/lib/mock-data.ts` | Seed data for all modules |
| `src/lib/utils.ts` | `cn()` helper |
| `src/App.tsx` | Route table |
| `src/components/layout/AppShell.tsx` | App shell, SidebarContext |
| `src/components/layout/AppSidebar.tsx` | Collapsible nav sidebar |
| `src/components/layout/AppHeader.tsx` | Breadcrumb + search + user menu |

---

## Critical Rules

1. Run `npx tsc --noEmit` before marking any task done. TypeScript strict mode is active — `noUnusedLocals` and `noUnusedParameters` will catch unused imports.
2. All user-visible strings must go through `useLang()`. Add to `src/i18n.tsx` for both `en` and `fr` keys.
3. Do not add `tailwind.config.js` or `postcss.config.js` — Tailwind v4 uses `@tailwindcss/vite`.
4. Mock data lives in `src/lib/mock-data.ts`. There is no database yet.
5. Inline styles (`style={{ backgroundColor: '#111522' }}`) are used for non-tokenised values. Tailwind utilities (`bg-midnight`) are used for tokenised values.

---

## Adding a New Page (Quick Reference)

1. `src/pages/app/NewPage.tsx` — create page component
2. `src/App.tsx` — add `<Route path="new-page" element={<NewPage />}>`
3. `src/components/layout/AppSidebar.tsx` — add nav entry
4. `src/components/layout/AppHeader.tsx` — add to `PAGE_LABELS` map
5. `src/i18n.tsx` — add copy keys for both languages
6. `src/lib/types.ts` + `src/lib/mock-data.ts` — add types and seed data
