@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

cls
echo.
echo   ======================================================
echo     MINERVA OS  v7.0.1  -  Deploy Script
echo     Uprising Studio
echo   ======================================================
echo.
echo   Choisissez votre cible de deploiement :
echo   Select your deployment target:
echo.
echo   [1]  Vercel (Web)       - Production / Preview
echo   [2]  Electron Windows   - Build installateur .exe
echo   [3]  Electron Mac       - Build .dmg
echo   [4]  Electron Toutes    - Win + Mac
echo   [5]  Preflight checks   - Verifier l environnement
echo   [Q]  Quitter / Quit
echo.
set /p "CHOICE=  > "

if /i "%CHOICE%"=="1" goto WEB_VERCEL
if /i "%CHOICE%"=="2" goto ELECTRON_WIN
if /i "%CHOICE%"=="3" goto ELECTRON_MAC
if /i "%CHOICE%"=="4" goto ELECTRON_ALL
if /i "%CHOICE%"=="5" goto PREFLIGHT
if /i "%CHOICE%"=="q" goto EOF
if /i "%CHOICE%"=="Q" goto EOF

echo   Choix invalide. Relancez le script.
pause
goto EOF

:: ======================================================
:PREFLIGHT
cls
echo.
echo   [CHECK] Verification de l environnement...
echo.

set ERRORS=0

where node >nul 2>&1
if errorlevel 1 (
  echo   [FAIL] Node.js n est pas installe.
  set /a ERRORS+=1
) else (
  for /f "tokens=*" %%v in ('node --version') do echo   [OK]   Node.js %%v
)

where pnpm >nul 2>&1
if errorlevel 1 (
  echo   [FAIL] pnpm absent.  npm install -g pnpm
  set /a ERRORS+=1
) else (
  for /f "tokens=*" %%v in ('pnpm --version') do echo   [OK]   pnpm %%v
)

where vercel >nul 2>&1
if errorlevel 1 (
  echo   [WARN] Vercel CLI absent.  npm install -g vercel
) else (
  for /f "tokens=*" %%v in ('vercel --version 2^>nul') do echo   [OK]   Vercel CLI %%v
)

where git >nul 2>&1
if errorlevel 1 (
  echo   [FAIL] Git absent.
  set /a ERRORS+=1
) else (
  for /f "tokens=*" %%v in ('git --version') do echo   [OK]   %%v
)

cd /d "%~dp0.."
if not exist ".env.local" (
  echo   [FAIL] .env.local introuvable.
  set /a ERRORS+=1
) else (
  echo   [OK]   .env.local present.
)

if not exist "node_modules" (
  echo   [WARN] node_modules absent - lancez pnpm install
) else (
  echo   [OK]   node_modules present.
)

echo.
if !ERRORS!==0 (
  echo   Environnement pret pour le deploiement.
) else (
  echo   !ERRORS! erreur(s) detectee(s). Corrigez avant de deployer.
)
echo.
pause
goto EOF

:: ======================================================
:WEB_VERCEL
cls
echo.
echo   [VERCEL] Deploiement vers Vercel
echo.
echo   [1]  Production  (vercel --prod)
echo   [2]  Preview     (vercel)
echo.
set /p "ENV_CHOICE=  > "

cd /d "%~dp0.."

if not exist "node_modules" (
  echo   Installation des dependances...
  call pnpm install
  if errorlevel 1 goto ERR_INSTALL
)

echo.
echo   Verification TypeScript...
call npx tsc --noEmit
if errorlevel 1 (
  echo.
  echo   Des erreurs TypeScript ont ete detectees.
  set /p "CONT=  Continuer quand meme? (o/n): "
  if /i "!CONT!" neq "o" goto EOF
)

echo.
echo   Build Next.js...
call pnpm build
if errorlevel 1 (
  echo   ERREUR: Le build Next.js a echoue.
  pause
  goto EOF
)
echo   Build OK.

echo.
where vercel >nul 2>&1
if errorlevel 1 (
  echo   Vercel CLI absent - installation...
  call npm install -g vercel
)

if /i "%ENV_CHOICE%"=="1" (
  echo   Deploiement PRODUCTION...
  call vercel --prod
) else (
  echo   Deploiement PREVIEW...
  call vercel
)

if errorlevel 1 (
  echo   ERREUR: Deploiement Vercel echoue.
  pause
) else (
  echo.
  echo   Deploiement Vercel termine avec succes!
)
echo.
pause
goto EOF

:: ======================================================
:ELECTRON_WIN
cls
echo.
echo   [ELECTRON-WIN] Build Windows (.exe)...
echo.

cd /d "%~dp0.."

if not exist "node_modules" (
  echo   Installation des dependances...
  call pnpm install
  if errorlevel 1 goto ERR_INSTALL
)

echo   [1/3] Compilation TypeScript Electron...
call npx tsc --project electron\tsconfig.json
if errorlevel 1 (
  echo   ERREUR: Compilation electron TS echouee.
  pause
  goto EOF
)
echo   OK.

echo   [2/3] Build Next.js...
call pnpm build
if errorlevel 1 (
  echo   ERREUR: Build Next.js echoue.
  pause
  goto EOF
)
echo   OK.

echo   [3/3] Package Electron Windows...
call npx electron-builder --win
if errorlevel 1 (
  echo   ERREUR: electron-builder echoue.
  pause
  goto EOF
)

echo.
echo   ======================================================
echo   Build Windows termine! Fichiers dans : dist-electron\
echo   ======================================================
echo.
pause
goto EOF

:: ======================================================
:ELECTRON_MAC
cls
echo.
echo   [ELECTRON-MAC] Build macOS (.dmg)...
echo   ATTENTION: necessite un certificat Apple Developer.
echo.

cd /d "%~dp0.."

if not exist "node_modules" (
  echo   Installation des dependances...
  call pnpm install
  if errorlevel 1 goto ERR_INSTALL
)

echo   [1/3] Compilation TypeScript Electron...
call npx tsc --project electron\tsconfig.json
if errorlevel 1 (
  echo   ERREUR: Compilation electron TS echouee.
  pause
  goto EOF
)
echo   OK.

echo   [2/3] Build Next.js...
call pnpm build
if errorlevel 1 (
  echo   ERREUR: Build Next.js echoue.
  pause
  goto EOF
)
echo   OK.

echo   [3/3] Package Electron Mac...
call npx electron-builder --mac
if errorlevel 1 (
  echo   ERREUR: electron-builder --mac echoue.
  pause
  goto EOF
)

echo.
echo   ======================================================
echo   Build Mac termine! Fichiers dans : dist-electron\
echo   ======================================================
echo.
pause
goto EOF

:: ======================================================
:ELECTRON_ALL
cls
echo.
echo   [ELECTRON] Build Windows + Mac...
echo.

cd /d "%~dp0.."

if not exist "node_modules" (
  echo   Installation des dependances...
  call pnpm install
  if errorlevel 1 goto ERR_INSTALL
)

echo   [1/4] Compilation TypeScript Electron...
call npx tsc --project electron\tsconfig.json
if errorlevel 1 (
  echo   ERREUR: Compilation electron TS.
  pause
  goto EOF
)
echo   OK.

echo   [2/4] Build Next.js...
call pnpm build
if errorlevel 1 (
  echo   ERREUR: Build Next.js.
  pause
  goto EOF
)
echo   OK.

echo   [3/4] Build Windows...
call npx electron-builder --win
if errorlevel 1 (
  echo   AVERTISSEMENT: Build Windows echoue.
)

echo   [4/4] Build Mac...
call npx electron-builder --mac
if errorlevel 1 (
  echo   AVERTISSEMENT: Build Mac echoue.
)

echo.
echo   ======================================================
echo   Builds termines. Verifiez dist-electron\ pour les artefacts.
echo   ======================================================
echo.
pause
goto EOF

:: ======================================================
:ERR_INSTALL
echo.
echo   ERREUR: pnpm install a echoue.
pause
goto EOF

:EOF
endlocal
