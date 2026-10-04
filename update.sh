#!/usr/bin/env bash
# ==============================================================================
# AeroProximity - Automated Updater Script
# Pulls latest code from GitHub, installs dependencies, rebuilds frontend assets,
# and safely restarts the service in a container or Linux environment.
# ==============================================================================

set -e

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "  ✈️  ========================================================"
echo "      AEROPROXIMITY - APPLICATION UPDATER"
echo "     ========================================================${NC}"
echo ""

# 1. Root / Sudo Check
if [ "$EUID" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 2. Check if git repository
if [ ! -d ".git" ]; then
  echo -e "${RED}❌ Error: This directory is not a git repository. Cannot pull updates.${NC}"
  exit 1
fi

# 3. Pull latest code from GitHub
echo -e "${CYAN}==> [1/4] Pulling latest updates from GitHub...${NC}"
# Stash any accidental local modifications to tracked files while keeping .env untouched
git stash --include-untracked 2>/dev/null || true
git fetch origin
git pull --rebase origin main || git pull origin main || git pull
git stash pop 2>/dev/null || true

# 4. Update Node dependencies
echo -e "${CYAN}==> [2/4] Updating application dependencies...${NC}"
npm install --legacy-peer-deps || npm install

# 5. Rebuild production bundle
echo -e "${CYAN}==> [3/4] Rebuilding production assets with Vite...${NC}"
npm run build

# 6. Restart running service
echo -e "${CYAN}==> [4/4] Restarting application service...${NC}"
RESTARTED=false

if command -v systemctl >/dev/null 2>&1; then
  if systemctl list-unit-files aeroproximity.service >/dev/null 2>&1; then
    echo -e "${CYAN}    Restarting systemd service 'aeroproximity.service'...${NC}"
    $SUDO systemctl restart aeroproximity.service
    sleep 1
    if systemctl is-active --quiet aeroproximity.service; then
      echo -e "${GREEN}✓ Service aeroproximity.service successfully restarted and active!${NC}"
      RESTARTED=true
    else
      echo -e "${YELLOW}⚠️  Service restarted, but is not currently active. Check: sudo systemctl status aeroproximity${NC}"
    fi
  fi
fi

if [ "$RESTARTED" = false ]; then
  echo -e "${YELLOW}ℹ️  Systemd service not active or running inside a standalone container.${NC}"
  echo -e "${YELLOW}   If running manually, restart your process with:${NC} ${BOLD}npm start${NC}"
fi

echo ""
echo -e "${GREEN}${BOLD}========================================================${NC}"
echo -e "${GREEN}${BOLD}   ✅ AeroProximity Successfully Updated to Latest Version!${NC}"
echo -e "${GREEN}${BOLD}========================================================${NC}"
echo ""
