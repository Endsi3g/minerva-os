# Minerva OS — CLAUDE.md

## What this is

**Minerva OS** is the internal agency operating system for **Uprising Studio** — a premium platform that centralises CRM, client onboarding, project management, approvals, billing, file storage and reporting in a single cohesive experience. The full product requirements are in `minerva-os-prd.md`.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Vite + React 18 + TypeScript (strict) |
| Routing | react-router-dom v7 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` — no PostCSS config |
| Animation | `motion/react` (Framer Motion v11+) |
| Icons | `lucide-react` |
| i18n | Custom context in `src/i18n.tsx` (EN / FR) |
| Auth (planned) | Email + password, magic link, role-based |
| DB (planned) | PostgreSQL + Prisma or Drizzle |
| Payments (planned) | Stripe |
| Files (planned) | Cloud object storage |

> Next.js migration is planned for Phase 1+ once the marketing shell is done. Until then, Vite.

---

## Design system — Celestial Editorial Noir

### Palette

| Token | Hex | Use |
|---|---|---|
| `--color-obsidian` | `#0A0D14` | Page background |
| `--color-midnight` | `#111522` | Cards, inputs, surfaces |
| `--color-dusk` | `#171C2A` | Elevated surfaces |
| `--color-ivory` | `#F5F1E8` | Primary text, CTA buttons |
| `--color-silver` | `#B8BDC7` | Secondary text, muted labels |
| `--color-fog` | `#8A9099` | Tertiary / metadata |
| `--color-mist` | `#D8DDE6` | Accent highlights |
| `--color-sage` | `#7FA38A` | Success, active indicators |
| `--color-amber` | `#B89B6A` | Warning |
| `--color-rose` | `#A86A6A` | Error / danger |
| `--color-brand-gray` | `#1A1A1A` | Legacy input bg (prefer `midnight`) |

All tokens are defined in `src/index.css` under `@theme` and generate Tailwind utilities (`bg-obsidian`, `text-ivory`, etc.).

### Typography

- **Display / hero**: `Playfair Display` serif — headings on landing, empty states, brand moments
- **UI / app**: `Inter` sans-serif — everything inside the app
- Both loaded from Google Fonts in `src/index.css` (import must stay **before** `@import "tailwindcss"`)

### Motion rules

- Slow, atmospheric — default duration `0.4–0.6s`
- Easing: `cubic-bezier(0.23, 1, 0.32, 1)` for panels / slides
- `easeOut` for opacity fades
- No bouncy springs, no flashy sequences
- Stagger children: `0.15s` delay, `0.2s` delayChildren

### Component rules

- Inputs: `bg:#111522`, `border: 1px solid rgba(255,255,255,0.08)`, `color:#F5F1E8`, `rounded-xl`
- Cards / surfaces: `bg:#111522`, `border: 1px solid rgba(255,255,255,0.07–0.10)`
- Buttons primary: `bg:#F5F1E8`, `color:#0A0D14`, `rounded-full` (nav) or `rounded-xl` (forms)
- Buttons ghost: `color:#B8BDC7`, `border: 1px solid rgba(255,255,255,0.12–0.15)`
- Blur overlays: `backdropFilter: blur(10–12px)` on modals, mobile menus
- No neon, no saturated colours, no generic SaaS gradients
- No em dashes (`—`) in UI copy — use commas, full stops, or a middle dot (`·`)

---

## File structure (current)

```
src/
  index.css        Tailwind v4 + @theme tokens + Google Fonts
  main.tsx         BrowserRouter + LangProvider + App
  App.tsx          Route table: / → Landing, /signup → SignUp, /login → Login
  i18n.tsx         LangProvider, useLang(), full EN/FR translations
  Landing.tsx      Marketing hero page (video bg, nav pill, CTAs)
  SignUp.tsx       Two-column sign-up (video left, form right)
  Login.tsx        Two-column login (video left, form right)
  vite-env.d.ts
```

### Planned structure (build phases)

```
src/
  pages/
    dashboard/     Agency dashboard (owner / PM view)
    crm/           Pipeline, leads, accounts
    projects/      Project hub, tasks, kanban
    approvals/     Approval queue, deliverables
    files/         Asset vault
    billing/       Invoices, retainers
    reports/       Analytics, KPIs
    portal/        Client-facing portal (separate shell)
    settings/      Team, roles, workspace
  components/
    ui/            Base shadcn/ui components, reskinned to Minerva tokens
    layout/        AppShell, Sidebar, Header, CommandPalette
    minerva/       Business-specific composites (AccountCard, ProjectHealthCard, etc.)
  lib/
    motion.ts      Shared animation variants
    utils.ts       cn(), formatters, helpers
  hooks/           useDebounce, usePermission, etc.
```

---

## Roles and permissions

| Role | Access |
|---|---|
| Agency Owner | Everything |
| Strategist | CRM, Discovery, Proposals |
| Project Manager | Projects, Tasks, Files, Approvals |
| Designer | Tasks, Files, Approvals |
| Developer | Tasks, Files, Specs |
| Finance | Billing, Invoices, Retainers |
| Client Stakeholder | Client portal: overview, files, invoices, approvals |
| Client Reviewer | Client portal: deliverables, approvals |

Visibility levels: `internal_only` · `client_visible` · `client_approver_only` · `finance_only` · `admin_only`

---

## Build phases

| Phase | Goal | Key deliverables |
|---|---|---|
| 0 | Strategy | PRD, CLAUDE.md, design system, auth flows — **done** |
| 1 | Foundation | App shell, sidebar, routing, shadcn/ui setup, tokens |
| 2 | Revenue | CRM, intake forms, proposal builder, account creation |
| 3 | Delivery | Project hub, tasks, kanban, files, approvals |
| 4 | Client experience | Client portal, billing visibility, notifications |
| 5 | Intelligence | Reporting, risk flags, AI summaries |

---

## Key conventions

- **TypeScript strict** — `noUnusedLocals`, `noUnusedParameters` are on; no unused imports
- **i18n always** — all user-visible strings must go through `useLang()` / `t.xxx`, never hardcoded in JSX
- **Inline styles for Minerva tokens** — use `style={{ backgroundColor: '#111522' }}` for non-standard values; use Tailwind utilities (`bg-midnight`) where the token is in `@theme`
- **No `overflow-hidden` + `maxHeight` for animated panels** — use `translateY` slide instead to avoid clipping
- `@source not "**/*.md"` is set in `index.css` to prevent Tailwind scanning the PRD
- Commit messages in English; code comments in English; UI copy bilingual via i18n

---

## MVP modules (V1)

Auth · Roles · CRM lite · Brief intake · Project creation · Project dashboard · Tasks · Files · Approvals · Client dashboard · Invoice visibility · Basic notifications

## Out of scope V1

SSO · Advanced visual automations · Conversational AI · Multi-workspace · Advanced financial reporting

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
