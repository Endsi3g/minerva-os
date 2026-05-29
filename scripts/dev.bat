@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

cls
echo.
echo   ======================================================
echo     MINERVA OS  v1.7.0  -  Uprising Studio
echo   ======================================================
echo.
echo   Choisissez votre cible de developpement :
echo   Select your dev target:
echo.
echo   [1]  Web App         (Next.js  http://localhost:3000)
echo   [2]  Electron        (Desktop  - lance Next.js + Electron)
echo   [3]  Mobile          (Expo / React Native)
echo   [4]  MCP Server      (minerva-mcp - Claude tools)
echo   [5]  Tout installer  (Install all deps)
echo   [Q]  Quitter / Quit
echo.
set /p "CHOICE=  > "

if /i "%CHOICE%"=="1" goto :WEB
if /i "%CHOICE%"=="2" goto :ELECTRON
if /i "%CHOICE%"=="3" goto :MOBILE
if /i "%CHOICE%"=="4" goto :MCP
if /i "%CHOICE%"=="5" goto :INSTALL_ALL
if /i "%CHOICE%"=="q" goto :EOF
if /i "%CHOICE%"=="Q" goto :EOF

echo   Choix invalide. Relancez le script.
pause
goto :EOF

:: ─────────────────────────────────────────────────────────────────────────────
:WEB
cls
echo.
echo   [WEB] Demarrage du serveur Next.js...
echo   Ouvrira automatiquement http://localhost:3000
echo.

:: Check .env.local
if not exist "%~dp0..\.env.local" (
  echo   ATTENTION: .env.local introuvable - copiez .env.example en .env.local
  echo   WARNING: .env.local not found - copy .env.example to .env.local
  pause
)

cd /d "%~dp0.."
pnpm dev
goto :EOF

:: ─────────────────────────────────────────────────────────────────────────────
:ELECTRON
cls
echo.
echo   [ELECTRON] Compilation TypeScript + lancement Electron...
echo   Prerequis: npm install -g electron electron-builder
echo.

cd /d "%~dp0.."

:: Compile electron TypeScript
echo   Compiling electron/main.ts...
call npx tsc --project electron\tsconfig.json
if errorlevel 1 (
  echo.
  echo   ERREUR: Compilation TypeScript electron echouee.
  pause
  goto :EOF
)
echo   Compilation OK.

:: Start Next.js in background then wait for it before launching Electron
echo.
echo   Demarrage Next.js en arriere-plan (port 3000)...
start "Minerva Next.js" cmd /c "pnpm dev"

echo   Attente que Next.js soit pret...
:WAIT_NEXT
timeout /t 3 /nobreak >nul
curl -s -o nul http://localhost:3000
if errorlevel 1 goto :WAIT_NEXT

echo   Next.js pret. Lancement Electron...
set NODE_ENV=development
npx electron electron\dist\main.js
goto :EOF

:: ─────────────────────────────────────────────────────────────────────────────
:MOBILE
cls
echo.
echo   [MOBILE] Demarrage Expo (React Native)...
echo.
echo   Prerequis : avoir expo-go sur votre appareil iOS/Android
echo   Prerequis : EXPO_PUBLIC_SUPABASE_URL dans minerva-mobile/.env.local
echo.
echo   Options:
echo   [1] Expo Go (QR code - recommande)
echo   [2] Android emulator
echo   [3] iOS simulator
echo   [4] Retour / Back
echo.
set /p "MOBILE_CHOICE=  > "

cd /d "%~dp0..\minerva-mobile"

if /i "%MOBILE_CHOICE%"=="1" (
  npx expo start
) else if /i "%MOBILE_CHOICE%"=="2" (
  npx expo start --android
) else if /i "%MOBILE_CHOICE%"=="3" (
  npx expo start --ios
) else (
  goto :EOF
)
goto :EOF

:: ─────────────────────────────────────────────────────────────────────────────
:MCP
cls
echo.
echo   [MCP] Demarrage du serveur MCP Minerva OS...
echo.
echo   Le serveur MCP expose les donnees Minerva a Claude Desktop.
echo   Variables requises: SUPABASE_URL et SUPABASE_KEY
echo.

cd /d "%~dp0..\minerva-mcp"

:: Compile TypeScript first
echo   Compilation...
call npx tsc
if errorlevel 1 (
  echo.
  echo   ERREUR: Compilation TypeScript MCP echouee.
  pause
  goto :EOF
)
echo   Compilation OK.
echo.

:: Check env vars
if "%SUPABASE_URL%"=="" (
  echo   ATTENTION: SUPABASE_URL non definie.
  echo   Definissez-la dans votre environment avant de lancer le serveur.
  echo.
  echo   Exemple:
  echo   set SUPABASE_URL=https://kcwdmufkyjsitsuxmqld.supabase.co
  echo   set SUPABASE_KEY=votre_cle_anon
  echo.
  set /p "START_ANYWAY=  Continuer quand meme? (o/n): "
  if /i "!START_ANYWAY!" neq "o" goto :EOF
)

echo   Lancement du serveur MCP en mode stdio...
echo   (Configurez Claude Desktop pour pointer vers ce processus)
echo.
node dist\server.js
goto :EOF

:: ─────────────────────────────────────────────────────────────────────────────
:INSTALL_ALL
cls
echo.
echo   [INSTALL] Installation de toutes les dependances...
echo.

cd /d "%~dp0.."

echo   [1/3] Installation racine (Next.js / Electron)...
call pnpm install
echo   Racine OK.
echo.

echo   [2/3] Installation minerva-mcp...
cd minerva-mcp
call pnpm install
cd ..
echo   MCP OK.
echo.

echo   [3/3] Installation minerva-mobile...
cd minerva-mobile
call pnpm install
cd ..
echo   Mobile OK.
echo.

echo   ======================================================
echo   Toutes les dependances sont installees.
echo   All dependencies installed.
echo   ======================================================
echo.
pause
goto :EOF
