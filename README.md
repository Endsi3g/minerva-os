# Minerva OS

**The strategic operating system for elite agencies. v2.1.0**

Minerva OS is the internal agency platform for [Uprising Studio](https://uprisingstudio.com) — a premium platform that centralises CRM, project management, approvals, billing, file storage, AI-powered risk monitoring, and reporting in one cohesive experience.

---

## What's included

### Auth + onboarding
- Email + password auth via Supabase
- PKCE-secure forgot password + reset password flows (auth callback route)
- Sonner toast notifications on signup for immediate visual feedback
- Onboarding wizard (4 steps) + Getting Started checklist on Dashboard
- Team invite accept page (`/invite/[token]`) with 7-day expiry tokens
- RBAC: 8 roles — Owner, Strategist, PM, Designer, Developer, Finance, Client Stakeholder, Client Reviewer

### Web app (Next.js 15 · Vercel)
- 22 modules: Dashboard, Pipeline, Clients, Projects, Tasks, Approvals, Files, Billing, Proposals, Expenses, Knowledge Base, Tickets, NPS, Resource Planning, Time Tracking, Agent Ops, Services, Fulfillment, Finance, Call Preps, Reports, Settings
- Split-screen signup + login: cinematic video left, form right
- Fully bilingual EN / FR via custom `useLang()` context — zero hardcoded copy
- Dark mode enforced (Celestial Editorial Noir design system)
- PDF export for invoices and proposals
- Sentry error monitoring + PostHog product analytics
- PWA support + Electron desktop shell

### Desktop (Electron 42)
- macOS (arm64 + x64) `.dmg`
- Windows (x64) `.exe` NSIS installer
- System tray, `minerva://` deep links, auto-updater

### Mobile (Expo SDK 52 · React Native 0.76)
- 22 screens for iOS and Android
- 100% bilingual EN / FR via `MobileLangProvider`
- iOS-native UX: ActionSheetIOS, Haptics, BlurView, SegmentedControl
- Sentry crash reporting, offline detection, background timer sync
- EAS build profiles (preview + production)
- TestFlight-ready

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 + React 18 + TypeScript (strict) |
| Mobile | Expo SDK 52 + React Native 0.76 + NativeWind v4 |
| Desktop | Electron 42 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth — email/password, PKCE reset flow |
| Styling | Tailwind CSS v4 + shadcn/ui (Minerva design tokens) |
| Animation | motion/react (Framer Motion v11+) |
| Notifications | Sonner v2 |
| Monitoring | Sentry + PostHog |
| Deployment | Vercel (web) · EAS (mobile) · GitHub Actions (desktop) |

## Design system — Celestial Editorial Noir

Dark-first editorial aesthetic. No neon, no generic SaaS gradients.

| Token | Hex | Use |
|---|---|---|
| `obsidian` | `#0A0D14` | Page background |
| `midnight` | `#111522` | Cards, inputs |
| `ivory` | `#F5F1E8` | Primary text, CTA |
| `silver` | `#B8BDC7` | Secondary text |
| `fog` | `#9FA8B5` | Metadata, tertiary (WCAG AAA 7.21:1 on midnight) |
| `sage` | `#7FA38A` | Success, active |
| `amber` | `#B89B6A` | Warning |
| `rose` | `#A86A6A` | Error, danger |

---

## Quick start (development)

```bash
# 1. Clone and install
git clone https://github.com/Endsi3g/minerva-os.git
cd minerva-os
pnpm install

# 2. Copy env vars
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, etc.

# 3. Start Next.js
pnpm dev

# 4. Mobile (separate terminal)
cd minerva-mobile
pnpm install
npx expo start
```

---

## Demo mode (no Supabase required)

All 23 authenticated routes can be explored with fully realistic mock data — no database connection needed.

### Activate

The repo ships with demo mode already enabled in `.env.local`:

```
NEXT_PUBLIC_PLAYWRIGHT_TEST=1
PLAYWRIGHT_TEST=1
```

### Run

```bash
pnpm dev   # starts on http://localhost:3001
# navigate to /app/dashboard — auth is bypassed, all modules show mock data
```

### What is mocked

| Layer | What you get |
|---|---|
| Auth | Demo user: Alex Martin (owner role) — no Supabase session needed |
| All 22 modules | Dashboard, Pipeline, Clients, Projects, Tasks, Approvals, Files, Billing, Proposals, Expenses, KB, Tickets, NPS, Resource Planning, Time Tracking, Agent Ops, Services, Fulfillment, Finance, Call Preps, Reports, Settings |
| CRUD operations | Add / edit / delete all update local state only — no DB writes |
| Notifications | 3 pre-seeded notifications in AppHeader |
| Timer widget | Start / stop timer persisted in memory |
| Command Palette | Search across mock clients and projects |
| Comments | Pre-loaded + submittable in memory |
| Presence | Disabled (no Realtime channel opened) |

### Electron demo mode

```bash
pnpm electron:compile   # compile main process once
pnpm electron:demo      # starts Next.js + opens Electron directly at /app/dashboard
```

### Switch to production

1. Replace the Supabase env vars in `.env.local` with your project's real keys
2. Remove `NEXT_PUBLIC_PLAYWRIGHT_TEST=1` and `PLAYWRIGHT_TEST=1`
3. `pnpm dev` — app authenticates via Supabase and reads live data

---

## Auth flows

### Sign up
1. User fills the split-screen form at `/signup`
2. `supabase.auth.signUp()` creates the account
3. Sonner toast fires: "Account created — welcome to Minerva OS"
4. Redirect to `/app/onboarding`

### Forgot password
1. User clicks "Forgot password?" on `/login`
2. Enters email at `/forgot-password` → `resetPasswordForEmail()` sends the link
3. Email link hits `/auth/callback?next=/reset-password` — PKCE code is exchanged server-side
4. User lands on `/reset-password` with an active session and sets a new password
5. Sonner toast fires: "Password updated — please sign in"
6. Redirect to `/login`

---

## Deployment

See **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** for full instructions covering:
- Supabase project setup + env vars
- Vercel web deployment
- Electron desktop build (.dmg + .exe) + code signing
- iOS TestFlight step-by-step
- Android APK / Play Store
- GitHub Actions release pipeline
- Post-deploy health checklist

---

## Testing

```bash
# Playwright end-to-end (web)
npm run test:audit

# Individual test files
npx playwright test tests/audit/01-auth.spec.ts
npx playwright test tests/audit/11-crud-flows.spec.ts
npx playwright test tests/audit/15-i18n-complete.spec.ts

# View report
npm run test:audit:report
```

---

## Key conventions

- TypeScript strict — `noUnusedLocals`, `noUnusedParameters` on
- All UI strings through `useLang()` / `useMobileLang()` — zero hardcoded copy
- RBAC: every protected route checks session via Supabase middleware before rendering
- No `overflow-hidden + maxHeight` for animated panels — use `translateY` slides
- Commit messages in English, code comments in English, UI copy bilingual (EN/FR)
- Left column of auth pages: centered content (`justify-center`) over video background
