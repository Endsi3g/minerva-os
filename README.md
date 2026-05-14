# Minerva OS

**The strategic operating system for elite agencies.**

Minerva OS is the internal agency platform for [Uprising Studio](https://uprisingstudio.com) — a premium SaaS that centralises CRM, client onboarding, project management, approvals, billing, file storage, and reporting into one cohesive experience.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Backend | Convex (Real-time DB, Actions, Workflows, Crons) |
| Auth | Convex Auth (OTP, Magic Link, Social) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Animation | `motion/react` (Framer Motion v12) |
| Icons | `lucide-react` |
| UI Primitives | Radix UI + shadcn/ui (New York style, reskinned) |
| i18n | Custom context — English / French |

## Design System

**Celestial Editorial Noir** — obsidian backgrounds, serif editorial headings, slow atmospheric motion. No neon, no generic SaaS gradients.

Primary palette: `#0A0D14` obsidian · `#111522` midnight · `#F5F1E8` ivory · `#7FA38A` sage · `#B89B6A` warm · `#A86A6A` ember

---

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up Convex:
```bash
npx convex dev
```

3. Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` for the landing page. App shell is at `/app/dashboard`.

---

## Project Structure

```
src/
  app/                 Next.js App Router (Dashboard, Portal, Auth)
  convex/              Backend queries, mutations, actions, and schema
  modules/
    app/               Internal agency dashboards
    portal/            Client-facing portals
  components/
    layout/            AppShell, AppSidebar, AppHeader
    ui/                Reskinned shadcn/ui primitives
    minerva/           Business composites (ProjectCard, etc.)
  lib/
    types.ts           All TypeScript interfaces
    utils.ts           cn() helper
  i18n.tsx             EN/FR translations
```

---

## Build Phases

| Phase | Status | Scope |
|---|---|---|
| 0 | Done | Strategy, PRD, design system |
| 1 | Done | App shell, sidebar, routing, shadcn/ui |
| 2 | Done | CRM pipeline, clients |
| 3 | Done | Projects, tasks, approvals, files |
| 4 | Done | Client portal, billing, notifications |
| 5 | Done | Agent Operations, Risk Workflows, AI Orchestration |
| 6 | Upcoming | Stripe Payments, Vector Search KB |

---

## Contributing

See [AGENTS.md](AGENTS.md) for AI-assisted development conventions and [handoff.md](handoff.md) for current audit findings.

## License

Private — Uprising Studio internal project.
