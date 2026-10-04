#!/usr/bin/env bash
# ==============================================================================
# AeroProximity - Automated Installer for Debian / Ubuntu Linux Containers
# Works on Debian 11 (Bullseye), Debian 12 (Bookworm), Ubuntu 22.04 / 24.04,
# Proxmox LXC containers, and Raspberry Pi OS.
# ==============================================================================

set -e

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "  ✈️  ========================================================"
echo "      AEROPROXIMITY - DEBIAN INSTALLATION SCRIPT"
echo "      Real-time Closest Aircraft Tracker with tar1090 ADS-B"
echo "     ========================================================${NC}"
echo ""

# 1. Root / Sudo Check
if [ "$EUID" -ne 0 ]; then
  SUDO="sudo"
  echo -e "${YELLOW}ℹ️  Running as non-root user. 'sudo' will be used for system package installs.${NC}"
else
  SUDO=""
fi

# 2. Update Package Index and Install Essential Tools
echo -e "${CYAN}==> [1/5] Updating Debian package repositories...${NC}"
$SUDO apt-get update -y

echo -e "${CYAN}==> [2/5] Installing essential build and networking tools...${NC}"
$SUDO apt-get install -y --no-install-recommends \
  curl \
  ca-certificates \
  gnupg \
  git \
  build-essential

# 3. Check / Install Node.js (Node 20 LTS recommended)
echo -e "${CYAN}==> [3/5] Verifying Node.js environment...${NC}"
NEED_NODE=true

if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -ge 18 ]; then
    echo -e "${GREEN}✓ Node.js $(node -v) is already installed.${NC}"
    NEED_NODE=false
  else
    echo -e "${YELLOW}⚠️  Existing Node.js version is too old ($NODE_VER < 18). Upgrading to Node 20 LTS...${NC}"
  fi
fi

if [ "$NEED_NODE" = true ]; then
  echo -e "${CYAN}    Setting up NodeSource repository for Node.js 20 LTS...${NC}"
  $SUDO mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | $SUDO gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | $SUDO tee /etc/apt/sources.list.d/nodesource.list > /dev/null
  $SUDO apt-get update -y
  $SUDO apt-get install -y nodejs
  echo -e "${GREEN}✓ Node.js $(node -v) and npm $(npm -v) installed successfully.${NC}"
fi

# 4. Install Project NPM Dependencies
echo -e "${CYAN}==> [4/5] Installing application dependencies...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

npm install

# 5. Build Production Frontend Bundle
echo -e "${CYAN}==> [5/5] Compiling application production assets...${NC}"
npm run build

# 6. Configure Environment Defaults
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo -e "${CYAN}    Creating default .env file...${NC}"
  cat << 'EOF' > "$SCRIPT_DIR/.env"
# Port for the AeroProximity server
PORT=3000

# URL of your local tar1090 / readsb / dump1090-fa instance
# Examples: http://localhost:8080, http://10.17.20.132:8080, http://adsb.local:8080
LOCAL_ADSB_URL=http://localhost:8080
EOF
  echo -e "${GREEN}✓ Generated default .env file.${NC}"
fi

# 7. Optional Systemd Service Setup
if [ -d "/etc/systemd/system" ] && command -v systemctl >/dev/null 2>&1; then
  echo ""
  echo -e "${CYAN}Would you like to install AeroProximity as a systemd service (auto-start on boot)? [Y/n]${NC}"
  read -r -t 15 INSTALL_SYSTEMD || INSTALL_SYSTEMD="Y"
  if [[ "$INSTALL_SYSTEMD" =~ ^[Yy]$ ]] || [ -z "$INSTALL_SYSTEMD" ]; then
    SERVICE_USER="${SUDO_USER:-$(whoami)}"
    NODE_BIN="$(which node)"
    NPX_BIN="$(which npx)"

    $SUDO bash -c "cat << EOF > /etc/systemd/system/aeroproximity.service
[Unit]
Description=AeroProximity Closest Aircraft Radar Service
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$NPX_BIN tsx server.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF"

    $SUDO systemctl daemon-reload
    $SUDO systemctl enable aeroproximity.service
    $SUDO systemctl restart aeroproximity.service
    echo -e "${GREEN}✓ Systemd service 'aeroproximity.service' created and started!${NC}"
    echo -e "${GREEN}  Check status with: sudo systemctl status aeroproximity${NC}"
  fi
fi

# Summary
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo -e "${GREEN}${BOLD}========================================================${NC}"
echo -e "${GREEN}${BOLD}   🎉 AeroProximity Installation Completed Successfully!${NC}"
echo -e "${GREEN}${BOLD}========================================================${NC}"
echo ""
echo -e "  🌐 Web Interface:     ${CYAN}${BOLD}http://${IP_ADDR}:3000${NC}"
echo -e "  📡 Configured Radio:   ${YELLOW}$(grep LOCAL_ADSB_URL "$SCRIPT_DIR/.env" | cut -d= -f2 || echo "http://localhost:8080")${NC}"
echo ""
echo -e "  To start the application manually:"
echo -e "    ${BOLD}npm start${NC}  or  ${BOLD}npm run dev${NC}"
echo ""
echo -e "  To edit your radio IP/URL:"
echo -e "    ${BOLD}nano .env${NC}  (or change it inside the web app settings)"
echo ""
