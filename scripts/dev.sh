#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Minerva OS — Local development setup & launch script
# Usage: bash scripts/dev.sh [--reset] [--test]
# ─────────────────────────────────────────────────────────────────────────────

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}→${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC} $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }

RESET=false; RUN_TESTS=false
for arg in "$@"; do [[ $arg == "--reset" ]] && RESET=true; [[ $arg == "--test" ]] && RUN_TESTS=true; done

echo ""
echo "  ███╗   ███╗██╗███╗   ██╗███████╗██████╗ ██╗   ██╗ █████╗"
echo "  ████╗ ████║██║████╗  ██║██╔════╝██╔══██╗██║   ██║██╔══██╗"
echo "  ██╔████╔██║██║██╔██╗ ██║█████╗  ██████╔╝██║   ██║███████║"
echo "  ██║╚██╔╝██║██║██║╚██╗██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══██║"
echo "  ██║ ╚═╝ ██║██║██║ ╚████║███████╗██║  ██║ ╚████╔╝ ██║  ██║"
echo "  ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝"
echo "  OS v1.7.0 · Local Dev Setup (Supabase) · Uprising Studio"
echo ""

# ── 1. Prerequisites ────────────────────────────────────────────────────────

info "Checking prerequisites..."

command -v node >/dev/null 2>&1 || error "Node.js not found. Install from https://nodejs.org (v20+)"
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[[ $NODE_VER -lt 20 ]] && error "Node.js v20+ required (found v$NODE_VER). Update at https://nodejs.org"
success "Node.js $(node -v)"

command -v npm >/dev/null 2>&1 || error "npm not found"
success "npm $(npm -v)"

command -v npx >/dev/null 2>&1 || error "npx not found"

# ── 2. Environment file ─────────────────────────────────────────────────────

if [[ ! -f ".env.local" ]]; then
  warn ".env.local not found — creating from .env.example"
  cp .env.example .env.local
  echo ""
  echo -e "${YELLOW}  ┌─────────────────────────────────────────────────────┐${NC}"
  echo -e "${YELLOW}  │  ACTION REQUIRED: Edit .env.local before continuing │${NC}"
  echo -e "${YELLOW}  │                                                       │${NC}"
  echo -e "${YELLOW}  │  Required variables:                                  │${NC}"
  echo -e "${YELLOW}  │    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co  │${NC}"
  echo -e "${YELLOW}  │    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_pub_...  │${NC}"
  echo -e "${YELLOW}  │    RESEND_API_KEY=re_xxxxxxxx                         │${NC}"
  echo -e "${YELLOW}  │    ANTHROPIC_API_KEY=sk-ant-xxxxxxxx                  │${NC}"
  echo -e "${YELLOW}  └─────────────────────────────────────────────────────┘${NC}"
  echo ""
  read -p "  Press Enter once you've filled in .env.local..."
else
  success ".env.local found"
fi

# Check required vars
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)
if [[ -z "$SUPABASE_URL" || "$SUPABASE_URL" == *"xxx"* ]]; then
  warn "NEXT_PUBLIC_SUPABASE_URL not set in .env.local"
fi

# ── 3. Install dependencies ─────────────────────────────────────────────────

if [[ $RESET == true ]] || [[ ! -d "node_modules" ]]; then
  info "Installing dependencies..."
  npm ci
  success "Dependencies installed"
else
  success "node_modules exists (run with --reset to reinstall)"
fi

# ── 4. Build check & Dev Server ─────────────────────────────────────────────

echo ""
echo -e "${BLUE}─────────────────────────────────────────────────${NC}"
echo -e "${BLUE}  STEP 1/2 — Next.js Dev Server${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────${NC}"
echo ""

info "Starting Next.js dev server..."
echo "  The app will be available at: http://localhost:3000"
echo "  Press Ctrl+C to stop."
echo ""

# ── 5. Optional Playwright tests ────────────────────────────────────────────

if [[ $RUN_TESTS == true ]]; then
  echo ""
  echo -e "${BLUE}─────────────────────────────────────────────────${NC}"
  echo -e "${BLUE}  STEP 2/2 — Playwright Tests${NC}"
  echo -e "${BLUE}─────────────────────────────────────────────────${NC}"
  echo ""
  info "Building production bundle for tests..."
  npm run build
  info "Running Playwright tests (146 tests)..."
  npx playwright test --reporter=list
  echo ""
  success "All tests complete. Report: npm run test:audit:report"
  echo ""
fi

npm run dev
