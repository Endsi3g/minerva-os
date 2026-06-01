# Minerva OS — Deployment Guide

Version 1.0.0 · Uprising Studio

---

## Architecture overview

Minerva OS ships on three surfaces from a single codebase:

| Surface | Stack | Target |
|---|---|---|
| Web app | Next.js 15 on Vercel | `.vercel.app` (EU, cdg1) |
| Desktop | Electron 42 wrapping the web app | macOS `.dmg`, Windows `.exe` |
| Mobile | Expo SDK 52 (React Native 0.76) | iOS TestFlight, Android APK |

All three surfaces share the same Supabase backend.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| npm | 10+ |
| Convex CLI | `npm i -g convex` |
| EAS CLI | `npm i -g eas-cli` |
| Expo account | expo.dev (free) |
| Apple Developer account | developer.apple.com ($99 /yr) |
| GitHub account | Access to `Endsi3g/minerva-os` |
| Vercel account | vercel.com |
| Resend account | resend.com (for transactional email) |
| Sentry account | sentry.io (optional but recommended) |
| PostHog account | posthog.com (optional but recommended) |

---

## Part 1 — Supabase backend

### 1.1 Create a Supabase project

1. Go to [database.new](https://database.new) to create a new project in Supabase.
2. Retrieve your database connection string and API keys under Project Settings > API:
   - `NEXT_PUBLIC_SUPABASE_URL` — e.g. `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Publishable anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` — Service role secret key (keep secure)

### 1.2 Deploy schema migrations

1. Run the SQL schema files located in the `supabase/migrations/` directory in the SQL Editor of your Supabase project dashboard.
2. Enable Row Level Security (RLS) policies to isolate data by `workspace_id`.

### 1.3 Seed initial database data

- Use the seed queries provided in the migrations or administrative CLI to populate initial profiles, workspaces, and demo records.

---

## Part 2 — Web app (Vercel)

### 2.1 Create the Vercel project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `Endsi3g/minerva-os` from GitHub
3. Set the **Root Directory** to `/` (the repo root)
4. Framework preset: **Next.js**
5. Click **Deploy** (first deploy will fail — that is expected until env vars are set)

### 2.2 Set environment variables

In your Vercel project settings (Settings > Environment Variables), add:

```
NEXT_PUBLIC_SUPABASE_URL               https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   sb_publishable_xxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY              eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
AUTH_SECRET                            <openssl rand -base64 32>
RESEND_API_KEY                         re_xxxxxxxxxxxx
NEXT_PUBLIC_APP_URL                    https://your-app.vercel.app
NEXT_PUBLIC_SENTRY_DSN                 https://xxx@sentry.io/xxx       (optional)
SENTRY_AUTH_TOKEN                      sntrys_xxxxxxxxxxxx              (optional)
NEXT_PUBLIC_POSTHOG_KEY                phc_xxxxxxxxxxxx                 (optional)
NEXT_PUBLIC_POSTHOG_HOST               https://app.posthog.com          (optional)
ANTHROPIC_API_KEY                      sk-ant-xxxxxxxxxxxx
```

### 2.3 Redeploy

In the Vercel dashboard: **Deployments > Redeploy** (select the latest). Or push any commit to `main`.

### 2.4 Custom domain (optional)

Settings > Domains > Add `app.yourdomain.com` and follow DNS instructions.

### 2.5 Verify the deployment

- [ ] Open `https://your-app.vercel.app/login` — login page loads
- [ ] Create a workspace — wizard appears
- [ ] Create a project — project appears in list
- [ ] Open Sentry dashboard — errors appear after triggering one
- [ ] Open PostHog Live Events — events appear after navigating

---

## Part 3 — Desktop app (Electron)

The desktop app is a native shell that loads the web app from Vercel. No Next.js server is bundled — the binary is lightweight and auto-updates via GitHub Releases.

### 3.1 Set the production URL

Before building, set your Vercel URL as an environment variable:

```bash
export MINERVA_APP_URL=https://your-app.vercel.app
```

Or permanently, add it to your shell profile / CI secrets.

### 3.2 Build macOS DMG (requires macOS)

```bash
npm ci
npm run build
npm run electron:compile
npx electron-builder --mac
```

Output: `dist-electron/Minerva OS-1.0.0-arm64.dmg` and `dist-electron/Minerva OS-1.0.0.dmg`

**Code signing (for distribution outside Mac App Store):**

1. Export your Developer ID Application certificate as `.p12` from Keychain Access
2. Set env vars before building:
   ```
   CSC_LINK=/path/to/certificate.p12
   CSC_KEY_PASSWORD=your-password
   APPLE_ID=your@appleid.com
   APPLE_TEAM_ID=XXXXXXXXXX
   APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
   ```
3. Rebuild — electron-builder will sign and notarize automatically

### 3.3 Build Windows EXE (requires Windows or cross-compile on Linux)

```bash
npm ci
npm run build
npm run electron:compile
npx electron-builder --win
```

Output: `dist-electron/Minerva OS Setup 1.0.0.exe`

**Code signing (recommended for Windows):**

1. Purchase or obtain an EV Code Signing certificate (Sectigo, DigiCert, etc.)
2. Set env vars:
   ```
   WIN_CSC_LINK=/path/to/certificate.p12
   WIN_CSC_KEY_PASSWORD=your-password
   ```

### 3.4 Automated releases via GitHub Actions

Push a version tag to trigger the full release pipeline:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions (`.github/workflows/desktop-release.yml`) will:
1. Build on `macos-latest` (DMG · arm64 + x64)
2. Build on `windows-latest` (NSIS installer · x64)
3. Upload both artifacts to the GitHub Release automatically

**Required GitHub Secrets** (Settings > Secrets and variables > Actions):

| Secret | Description |
|---|---|
| `MINERVA_APP_URL` | Your Vercel deployment URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase endpoint URL |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (optional) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog key (optional) |
| `MAC_CERTIFICATE_P12` | Base64-encoded macOS .p12 cert |
| `MAC_CERTIFICATE_PASSWORD` | Certificate password |
| `APPLE_ID` | Apple ID email |
| `APPLE_TEAM_ID` | Apple Team ID (10-char string) |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password from appleid.apple.com |
| `WIN_CERTIFICATE_P12` | Base64-encoded Windows .p12 cert |
| `WIN_CERTIFICATE_PASSWORD` | Certificate password |

### 3.5 Auto-update

The desktop app uses `electron-updater` to check for new releases on GitHub. When a new version tag is pushed and the release is published, users will see an in-app update notification automatically.

---

## Part 4 — Mobile app (iOS TestFlight + Android APK)

### 4.1 Prerequisites

1. **Expo account** — log in: `eas login`
2. **Apple Developer account** — enrolled in the Apple Developer Program ($99/yr)
3. **EAS project** — link the project:
   ```bash
   cd minerva-mobile
   eas init   # Creates a project on expo.dev
   ```

### 4.2 Configure environment variables

Create `minerva-mobile/.env` (not committed — see `.env.example`):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 4.3 Configure Supabase Clients

The mobile app accesses the same Supabase database backend via environment variables. Ensure the client libraries are initialized with your Supabase URL and anonymous key.

### 4.4 iOS — Submit to TestFlight

#### Step 1: Build for iOS

```bash
cd minerva-mobile
eas build --profile preview --platform ios
```

EAS will:
- Prompt for your Apple Developer credentials (first run only)
- Create provisioning profiles and certificates automatically
- Build the `.ipa` on Expo's cloud infrastructure
- Return a download URL when done (10-20 min)

#### Step 2: Submit to TestFlight

```bash
eas submit --platform ios --latest
```

EAS will:
- Upload the latest iOS build to App Store Connect
- Create a TestFlight build automatically

#### Step 3: Add internal testers

1. Open [App Store Connect](https://appstoreconnect.apple.com)
2. Go to your app > TestFlight > Internal Testing
3. Click "+" to create an internal group
4. Add tester emails (must have accepted Apple's TestFlight beta agreement)
5. Select the build and enable it for the group
6. Testers receive an email invitation

#### Step 4: Install on device

1. Tester installs [TestFlight](https://apps.apple.com/app/testflight/id899247664) from the App Store
2. Opens the invitation email and taps "Start Testing"
3. App installs and launches with a beta indicator

#### Optional: External testing (up to 10,000 testers)

1. App Store Connect > TestFlight > External Testing > Add external group
2. Submit for Beta App Review (1-2 days)
3. Share the public TestFlight link

### 4.5 Android — Build and distribute APK

#### Internal APK

```bash
cd minerva-mobile
eas build --profile preview --platform android
```

Download the APK from the EAS dashboard or the returned URL and share directly.

#### Production App Bundle (Play Store)

```bash
eas build --profile production --platform android
```

Then submit via Google Play Console.

### 4.6 Automated mobile builds via GitHub Actions

Pushing to `main` with changes in `minerva-mobile/**` or `convex/**` triggers `.github/workflows/mobile.yml`:

- Runs `eas build --profile preview --platform all --non-interactive`
- Requires `EXPO_TOKEN` secret in GitHub (Settings > Secrets > `EXPO_TOKEN`)

Generate your Expo token: `expo.dev` > Account > Access Tokens > Create

### 4.7 Mobile TestFlight checklist

Before submitting to TestFlight, verify:

- [ ] `EXPO_PUBLIC_SUPABASE_URL` is set to the **production** Supabase URL
- [ ] App icon and splash screen are present in `minerva-mobile/assets/`
- [ ] `app.json` has correct `bundleIdentifier` (iOS) and `package` (Android)
- [ ] `eas.json` is configured (present in this repo)
- [ ] `eas init` has been run and project is linked
- [ ] Login flow works on physical device
- [ ] Push notifications are tested (requires physical device)
- [ ] Sentry DSN is set and errors are captured correctly
- [ ] App does not crash on cold start

---

## Part 5 — Environment variables reference

### Web / Vercel

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase endpoint URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role secret |
| `AUTH_SECRET` | Yes | Random 32-byte secret for Convex Auth |
| `RESEND_API_KEY` | Yes | Resend API key for transactional email |
| `NEXT_PUBLIC_APP_URL` | Yes | Your Vercel deployment URL |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Hermes AI features |
| `NEXT_PUBLIC_SENTRY_DSN` | Recommended | Sentry error tracking |
| `SENTRY_AUTH_TOKEN` | Recommended | Sentry source maps upload |
| `NEXT_PUBLIC_POSTHOG_KEY` | Recommended | PostHog analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | Recommended | PostHog ingestion endpoint |

### Desktop / GitHub Secrets (for CI release builds)

| Secret | Description |
|---|---|
| `MINERVA_APP_URL` | Vercel deployment URL loaded by Electron |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase endpoint (used during Next.js build) |
| `MAC_CERTIFICATE_P12` | Base64 macOS Developer ID cert |
| `MAC_CERTIFICATE_PASSWORD` | Cert password |
| `APPLE_ID` / `APPLE_TEAM_ID` | For notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password (appleid.apple.com) |
| `WIN_CERTIFICATE_P12` | Base64 Windows code signing cert |
| `WIN_CERTIFICATE_PASSWORD` | Cert password |

### Mobile / EAS / .env

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase endpoint (baked in at build time) |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for mobile crash reporting |
| `EXPO_TOKEN` | Expo access token (GitHub Secret for CI) |

---

## Part 6 — Release process

### Regular release

```bash
# 1. Merge all feature branches to main
git checkout main && git pull

# 2. Bump version in package.json and minerva-mobile/app.json
# (edit manually or use: npm version patch|minor|major)

# 3. Commit
git add package.json minerva-mobile/app.json
git commit -m "chore: release v1.x.x"

# 4. Tag and push — triggers GitHub Actions
git tag v1.x.x
git push origin main --tags

# 5. GitHub Actions builds DMG + EXE and attaches to the release
# 6. Publish the GitHub Release (from draft → published)
# 7. Run EAS mobile build separately (see Part 4)
```

### Hotfix release

```bash
git checkout -b hotfix/v1.x.y main
# ... fix ...
git commit -m "fix: ..."
git checkout main && git merge hotfix/v1.x.y
git tag v1.x.y
git push origin main --tags
```

---

## Part 7 — Post-deployment health checks

Run after every production deploy:

- [ ] Web: `/login` loads under 2 seconds on mobile connection
- [ ] Web: Create workspace → onboarding wizard appears
- [ ] Web: Invite team member → invitation email received
- [ ] Web: Create invoice → mark as Sent → invoice email received
- [ ] Web: Forgot password → reset email received → login with new password
- [ ] Web: Theme toggle → full UI switches correctly
- [ ] Sentry: Trigger a 404 → error appears in Sentry dashboard
- [ ] PostHog: Navigate to Projects → `project_viewed` event in Live Events
- [ ] Desktop: App launches and loads the dashboard (macOS + Windows)
- [ ] Desktop: Auto-updater shows notification when new version is released
- [ ] Mobile: Cold start on physical iOS device (no crash)
- [ ] Mobile: Timer start/stop → entry appears in Time Tracking
- [ ] Mobile: Swipe to approve on Approvals screen
- [ ] Mobile: Push notification delivered for new approval
