# Minerva OS

**The strategic operating system for elite agencies. v1.0.0**

Minerva OS is the internal agency platform for [Uprising Studio](https://uprisingstudio.com) — a premium platform that centralises CRM, project management, approvals, billing, file storage, AI-powered risk monitoring, and reporting in one cohesive experience.

**[Deployment guide →](./docs/DEPLOYMENT.md)**

---

## What's included

### Backend (Convex)
- 49 tables, 47 Convex modules
- RBAC with `requireWorkspaceMember` / `requireOwner` guards on every mutation
- Transactional email via Resend (invoices, proposals, invitations, password reset, risk alerts)
- Team invitations with 7-day expiry tokens
- AI agent layer (Hermes) with suggestion queue and audit log
- Risk flag detection + escalation workflow
- Push notifications via Expo (iOS + Android)
- Full-text search, vector embeddings (1536-dim)

### Web app (Next.js 15 · Vercel)
- 22 modules: Dashboard, Pipeline, Clients, Projects, Tasks, Approvals, Files, Billing, Proposals, Expenses, Knowledge Base, Tickets, NPS, Resource Planning, Time Tracking, Agent Ops, Services, Fulfillment, Finance, Call Preps, Reports, Settings
- Dark / light mode (system preference aware)
- Onboarding wizard (4 steps) + Getting Started checklist
- PDF export for invoices and proposals
- Forgot password / reset password flows
- Team invite accept page (`/invite/[token]`)
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
| Backend | Convex (real-time DB + serverless functions) |
| Auth | @convex-dev/auth (Password provider) |
| Styling | Tailwind CSS v4 + shadcn/ui (Minerva design tokens) |
| Animation | motion/react (Framer Motion v11+) |
| Email | Resend |
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
| `warm` | `#B89B6A` | Warning |
| `ember` | `#A86A6A` | Error, danger |

---

## Quick start (development)

```bash
# 1. Clone and install
git clone https://github.com/Endsi3g/minerva-os.git
cd minerva-os
npm ci

# 2. Copy env vars
cp .env.example .env.local
# Fill in NEXT_PUBLIC_CONVEX_URL, AUTH_SECRET, etc.

# 3. Start Convex dev server
npx convex dev

# 4. Start Next.js
npm run dev

# 5. Mobile (separate terminal)
cd minerva-mobile
npm ci
npx expo start
```

---

## Deployment

See **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** for full instructions covering:
- Convex backend deploy
- Vercel web deployment + env vars
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
- RBAC: every Convex mutation calls `requireWorkspaceMember(ctx, workspaceId)` before writing
- No `overflow-hidden + maxHeight` for animated panels — use `translateY` slides
- Commit messages in English, code comments in English, UI copy bilingual (EN/FR)
