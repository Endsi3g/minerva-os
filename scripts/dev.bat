@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM Minerva OS — Local development setup script (Windows)
REM Usage: scripts\dev.bat [--reset] [--test]
REM ─────────────────────────────────────────────────────────────────────────────

setlocal EnableDelayedExpansion
set RESET=false
set RUN_TESTS=false

for %%a in (%*) do (
  if "%%a"=="--reset" set RESET=true
  if "%%a"=="--test" set RUN_TESTS=true
)

echo.
echo   MINERVA OS v1.7.0 ^| Local Dev Setup ^| Uprising Studio
echo   ══════════════════════════════════════════════════════
echo.

REM ── 1. Check Node.js ──────────────────────────────────────────────────────
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Node.js not found. Install from https://nodejs.org (v20+)
  pause & exit /b 1
)
for /f "tokens=1 delims=v." %%v in ('node -v') do set NODE_MAJ=%%v
echo [OK] Node.js found
echo.

REM ── 2. Environment file ───────────────────────────────────────────────────
if not exist ".env.local" (
  echo [WARN] .env.local not found — copying from .env.example
  copy .env.example .env.local >nul
  echo.
  echo  ┌──────────────────────────────────────────────────────┐
  echo  │  ACTION REQUIRED: Edit .env.local before continuing  │
  echo  │                                                        │
  echo  │  Required:                                             │
  echo  │    NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud    │
  echo  │    AUTH_SECRET=^<random 32-char string^>                │
  echo  │    RESEND_API_KEY=re_xxxxxxxx                          │
  echo  │    ANTHROPIC_API_KEY=sk-ant-xxxxxxxx                   │
  echo  └──────────────────────────────────────────────────────┘
  echo.
  echo Open .env.local in your editor, fill in the values, then press any key.
  pause >nul
) else (
  echo [OK] .env.local found
)

REM ── 3. Install dependencies ───────────────────────────────────────────────
if "%RESET%"=="true" (
  echo [INFO] Installing dependencies (--reset)...
  call npm ci
) else if not exist "node_modules" (
  echo [INFO] node_modules missing — installing...
  call npm ci
) else (
  echo [OK] node_modules exists
)

REM ── 4. Convex instructions ────────────────────────────────────────────────
echo.
echo  ─────────────────────────────────────────────────────────
echo  STEP 1/2 — Convex Backend
echo  ─────────────────────────────────────────────────────────
echo.
echo  Open a NEW PowerShell/Terminal window and run:
echo.
echo      npx convex dev
echo.
echo  Then come back here and press any key to continue.
echo.
pause >nul

REM ── 5. Tests (optional) ───────────────────────────────────────────────────
if "%RUN_TESTS%"=="true" (
  echo.
  echo  ─────────────────────────────────────────────────────────
  echo  Running Playwright Tests
  echo  ─────────────────────────────────────────────────────────
  echo.
  call npm run build
  call npx playwright test --reporter=list
)

REM ── 6. Start dev server ───────────────────────────────────────────────────
echo.
echo  ─────────────────────────────────────────────────────────
echo  STEP 2/2 — Starting Next.js Dev Server
echo  ─────────────────────────────────────────────────────────
echo.
echo  App will be at: http://localhost:3000
echo  Press Ctrl+C to stop.
echo.

call npm run dev
