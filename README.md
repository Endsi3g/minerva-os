# Minerva OS

**The strategic operating system for elite agencies.**

Minerva OS is the internal agency platform for [Uprising Studio](https://uprisingstudio.com) — a premium SaaS that centralises CRM, client onboarding, project management, approvals, billing, file storage, and reporting into one cohesive experience.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Vite 6 + React 18 + TypeScript (strict) |
| Routing | react-router-dom v7 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Animation | `motion/react` (Framer Motion v11+) |
| Icons | `lucide-react` |
| UI Primitives | Radix UI + shadcn/ui (New York style, reskinned) |
| i18n | Custom context — English / French |

## Design System

**Celestial Editorial Noir** — obsidian backgrounds, serif editorial headings, slow atmospheric motion. No neon, no generic SaaS gradients.

Primary palette: `#0A0D14` obsidian · `#111522` midnight · `#F5F1E8` ivory · `#7FA38A` sage · `#B89B6A` warm · `#A86A6A` ember

---

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` for the landing page. App shell is at `/app/dashboard`.

## Build

```bash
npm run build
npm run preview
```

## Type Check

```bash
npx tsc --noEmit
```

---

## Project Structure

```
src/
  index.css            Tailwind v4 + @theme tokens + Google Fonts
  main.tsx             BrowserRouter + LangProvider + App
  App.tsx              Route table
  i18n.tsx             LangProvider, useLang(), EN/FR translations
  Landing.tsx          Marketing hero page
  SignUp.tsx           Sign-up flow
  Login.tsx            Login flow
  pages/
    app/
      Dashboard.tsx    Agency overview
      Pipeline.tsx     CRM kanban (6 stages)
      Clients.tsx      Account management
      Projects.tsx     Project hub with progress bars
      Tasks.tsx        Task list with status cycling
      Approvals.tsx    Deliverable approval queue
      Files.tsx        Asset vault with search
      Billing.tsx      (stub)
      Reports.tsx      (stub)
      Settings.tsx     (stub)
  components/
    layout/            AppShell, AppSidebar, AppHeader
    ui/                Reskinned shadcn/ui primitives
    minerva/           Business composites (ProjectCard, etc.)
    Header.tsx         Landing navigation
    LandingFooter.tsx  CTA banner, FAQ accordion, footer nav
  lib/
    types.ts           All TypeScript interfaces
    mock-data.ts       Seed data for all modules
    utils.ts           cn() helper
```

---

## Build Phases

| Phase | Status | Scope |
|---|---|---|
| 0 | Done | Strategy, PRD, design system |
| 1 | Done | App shell, sidebar, routing, shadcn/ui |
| 2 | Done | CRM pipeline, clients |
| 3 | Done | Projects, tasks, approvals, files |
| 4 | Upcoming | Client portal, billing, notifications |
| 5 | Planned | Reporting, risk flags, AI summaries |

---

## Contributing

See [AGENTS.md](AGENTS.md) for AI-assisted development conventions.

## License

Private — Uprising Studio internal project.
