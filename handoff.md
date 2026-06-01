# Handoff Report — Minerva OS v2.2.0

**Date:** 2026-06-01  
**Stack:** Next.js 15 · Supabase · TypeScript strict · Tailwind CSS v4  
**Mobile:** Expo SDK 54 · React Native 0.81 · pnpm  
**Status:** 80% production-ready — auth, secure client portal, and UI complete, database tables mocked

---

## 1. What is built and working

### Auth (100% complete)
| Flow | Status | Notes |
|---|---|---|
| Sign up | Live | Supabase Auth · toast confirmation · redirect to onboarding |
| Login | Live | Email + password · show/hide · "Forgot password?" link |
| Forgot password | Live | PKCE-secure email reset via `/auth/callback` route |
| Reset password | Live | `supabase.auth.updateUser` · success toast · redirect to login |
| Session persistence | Live | Supabase SSR middleware refreshes cookies on every request |
| Protected routes | Live | Middleware redirects `/app/*` to `/login` if no session |

### Entry point (updated v2.1.0)
- Root `/` now renders the **Welcome splash screen** (flickering grid, 8-petal mark, cycling feature labels, 6s auto-advance)
- Splash is **skippable**: click anywhere, press Space/Enter/Escape, or click the "Skip" button
- Auto-redirects to `/signup`
- The former landing page (`Landing.tsx`) is no longer the entry point — the marketing site will be built separately on Framer

### App modules (UI complete, data mocked)
All 22 modules exist at `/app/*` and render correctly with mock data:
Dashboard · Pipeline · Clients · Projects · Tasks · Approvals · Files · Billing · Proposals · Expenses · Knowledge Base · Tickets · NPS · Resource Planning · Time Tracking · Agent Ops · Services · Fulfillment · Finance · Call Preps · Reports · Settings

### Mobile app (Expo 54 · React Native 0.81)
17 screens across iOS and Android:
Dashboard · Pipeline · Clients · Projects · Approvals · Files · Billing · Expenses · Knowledge Base · Proposals · Tickets · Time Entries · Timer · Notifications · Profile · More

Key mobile features:
- **Sentry crash reporting** — root layout wrapped with `Sentry.wrap()`, using `@sentry/react-native ~7.2.0`
- **pnpm** — migrated from npm/`package-lock.json` to `pnpm-lock.yaml`
- **Expo 54** — upgraded from SDK 52 (React 19.1, RN 0.81.5)
- **iOS-native UX** — ActionSheetIOS, Haptics, BlurView, SegmentedControl
- **Offline detection** — NetInfo banner
- **Background timer sync** — via `expo-task-manager` + `expo-background-fetch`
- **EAS build profiles** — preview + production

### Design system
**Celestial Editorial Noir** — obsidian background (`#0A0D14`), midnight cards (`#111522`), ivory text (`#F5F1E8`). All tokens defined in `src/index.css` as `@theme` variables generating Tailwind utilities. Dark mode forced via custom `ThemeProvider`.

### i18n
Full EN/FR coverage via `useLang()` hook in `src/i18n.tsx`. Every user-visible string goes through the context — zero hardcoded copy. Recent additions: `forgotPassword`, `resetPassword`, `signup.toastSuccess`.

### Notifications
Sonner v2 wired into root providers. `toast.success()` fires on signup. Available for use anywhere in the app.

### Dev service worker cleanup (v2.1.0)
`providers.tsx` now auto-unregisters stale service workers in development mode to prevent caching issues that caused blank pages or stale assets during local dev.

### Secure Client Portal & Proposals (v2.2.0)
- **Secure public routes**: Public guests do not query Supabase directly. All database reads and updates route through server-side Next.js API endpoints (`/api/portal/*`) using a secure `supabaseAdmin` client.
- **Identity validation gate**: Visitors are redirected to an email verification gate that validates their identity against registered client records. Successful validation sets a secure HTTP-only verification cookie (`minerva_portal_email`).
- **Scope-based navigation**: Side navigation tabs (Approvals, Files, Invoices, Tickets, NPS) are dynamically enabled or blocked based on the specific portal token's `scopes` array.
- **Auditing & event logging**: Activity logging records events such as `portal_accessed`, `email_verified`, `file_downloaded`, `approval_approved`, `comment_added`, `proposal_signed`, etc.
- **Bilingual support**: Full English and French translation switcher on both the Client Portal and Proposal Viewer.

---

## 2. Project structure

```
minerva-os/
  src/
    app/
      page.tsx              Root → WelcomePage
      welcome/page.tsx      Splash screen (flickering grid + skip)
      login/page.tsx        Login (split-screen video)
      signup/page.tsx       Sign up (split-screen video)
      forgot-password/      PKCE reset request
      reset-password/       New password form
      auth/callback/        PKCE code exchange route
      app/                  Protected app shell + 22 modules
      portal/[token]/       Client-facing portal
    contexts/
      AuthContext.tsx        Supabase session + user state
    lib/
      supabase.ts            Plain supabase-js client
      supabase/client.ts     SSR browser client (createBrowserClient)
      supabase/server.ts     SSR server client (createServerClient)
      supabase/middleware.ts Session refresh middleware
    components/
      ui/                   shadcn/ui components reskinned to Minerva tokens
      layout/               AppShell, Sidebar, AppHeader, CommandPalette, TimerWidget
      minerva/              Business composites (GettingStartedChecklist, etc.)
    i18n.tsx                EN/FR translations (1900+ lines)
    providers.tsx           ThemeProvider + LangProvider + AuthProvider + Toaster + dev SW cleanup
  minerva-mobile/           Expo 54 mobile app (pnpm)
  minerva-mcp/              MCP server for AI tool integrations
  electron/                 Electron desktop shell
  scripts/                  dev.bat interactive launcher
  tests/                    Playwright audit suite
  docs/                     Deployment + next steps
```

---

## 3. Supabase project

**Project ref:** `kcwdmufkyjsitsuxmqld`  
**URL:** `https://kcwdmufkyjsitsuxmqld.supabase.co`

### Environment variables

`.env.local` (web app):
```env
NEXT_PUBLIC_SUPABASE_URL=https://kcwdmufkyjsitsuxmqld.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fJZzWMwE5Sl1zkr9h7fiLQ_6-OOCDIB
```

### Tables (DDL in Supabase SQL editor)
39 tables defined. Key ones: `organizations`, `workspaces`, `user_profiles`, `clients`, `projects`, `tasks`, `approvals`, `invoices`, `proposals`, `deals`, `assets`, `knowledge_base`, `agents`, `risk_flags`.

### Auth trigger needed
The following trigger must be applied in Supabase SQL editor so that a `user_profiles` row is created on every signup:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, email, name, role, onboarding_completed)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'owner',
    false
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 4. CI / Release pipeline

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | PR to `main` | `npm ci` + `npx tsc --noEmit` |
| `release.yml` | Push `v*` tag | Build + GitHub release + Electron .dmg + .exe |
| `desktop-release.yml` | Push `v*` tag | Electron builds |
| `mobile.yml` | Manual | EAS build (iOS + Android) |

### Releases to date
| Tag | Highlights |
|---|---|
| `v2.2.0` | Secure Client Portal email gate, token scopes, activity logging, and API-driven proposal viewer |
| `v2.1.0` | Expo 54 upgrade, Sentry wrap, pnpm migration, dev SW cleanup |
| `v2.0.1` | Redesign landing CTA, fix login page, grey signup video, Electron welcome |
| `v2.0.0` | Landing overhaul, animations, nav links, i18n toggle, changelog |

To publish a release:
```bash
git tag -a v2.3.0 -m "description"
git push origin v2.3.0
```

---

## 5. Local development

```bash
# Web
npm ci
cp .env.example .env.local   # add Supabase keys
npm run dev                   # http://localhost:3000

# Mobile
cd minerva-mobile
pnpm install
npx expo start
```

Windows shortcut: double-click `scripts/dev.bat` for an interactive menu (web, Electron, mobile, MCP server).

---

## 6. What is NOT yet connected to real data

Every app module uses static mock data. The data layer is Priority 1 — see **`docs/NEXT_STEPS.md`** for the full 75% → 100% roadmap covering:
- Supabase RLS setup
- Module-by-module data wiring (15 modules, ordered by business value)
- File storage
- Transactional email (Resend)
- Client portal token generation
- Hermes AI real API calls
- Stripe billing
- Realtime collaboration
- UI polish (skeletons, optimistic updates, error boundaries)
- Testing with real data

---

## 7. Key conventions

- **TypeScript strict** — `noUnusedLocals`, `noUnusedParameters` enforced
- **i18n always** — all copy via `useLang()`, never hardcoded in JSX
- **No overflow-hidden + maxHeight** for animated panels — use `translateY` slides
- **Left column on auth pages** — `justify-center` over video background, never `justify-end`
- **Commits in English** — UI copy bilingual via i18n
- **No em dashes** — use commas, full stops, or middle dots in UI copy
- **Mobile uses pnpm** — do not use npm in `minerva-mobile/`
