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
- Dev service worker auto-cleanup to prevent stale cache issues

### Desktop (Electron 42)
- macOS (arm64 + x64) `.dmg`
- Windows (x64) `.exe` NSIS installer
- System tray, `minerva://` deep links, auto-updater

### Mobile (Expo SDK 54 · React Native 0.81)
- 17 screens for iOS and Android
- 100% bilingual EN / FR via `MobileLangProvider`
- iOS-native UX: ActionSheetIOS, Haptics, BlurView, SegmentedControl
- Sentry crash reporting via `@sentry/react-native` — root layout wrapped with `Sentry.wrap()`
- Offline detection, background timer sync
- EAS build profiles (preview + production)
- pnpm package manager
- TestFlight-ready

### MCP server (minerva-mcp)
- Model Context Protocol server for AI tool integrations
- Browser session management + Supabase client
- Extensible tool system

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 + React 18 + TypeScript (strict) |
| Mobile | Expo SDK 54 + React Native 0.81 + NativeWind v4 + pnpm |
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
| `fog` | `#8A9099` | Metadata, tertiary |
| `sage` | `#7FA38A` | Success, active |
| `amber` | `#B89B6A` | Warning |
| `rose` | `#A86A6A` | Error, danger |

---

## Quick start (development)

```bash
# 1. Clone and install
git clone https://github.com/Endsi3g/minerva-os.git
cd minerva-os
npm ci

# 2. Copy env vars
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, etc.

# 3. Start Next.js
npm run dev

# 4. Mobile (separate terminal)
cd minerva-mobile
pnpm install
npx expo start
```

Windows shortcut: double-click `scripts/dev.bat` for an interactive menu (web, Electron, mobile, MCP server).

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

## Releases

| Tag | Date | Highlights |
|---|---|---|
| `v2.1.0` | 2026-06-01 | Expo 54 upgrade, Sentry wrap, pnpm migration, dev SW cleanup |
| `v2.0.1` | — | Redesign landing CTA, fix login page, Electron welcome |
| `v2.0.0` | — | Landing overhaul, animations, i18n toggle, changelog |

To publish a new release:
```bash
git tag -a v2.2.0 -m "description"
git push origin v2.2.0
```

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
- Mobile uses **pnpm** — do not use npm in `minerva-mobile/`
