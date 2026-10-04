# ✈️ AeroProximity

> **Real-time Tactical Airspace Radar & Nearest Aircraft Spotter powered by your local ADS-B receiver with tar1090 / readsb / dump1090-fa.**

AeroProximity turns your local RTL-SDR, FlightAware Pro Stick, or Airspy ADS-B receiver into a high-precision airspace monitoring and plane-spotting dashboard. It continuously scans 1090 MHz Mode-S transponder messages, identifies the **closest airplane to your antenna or device**, plots its flight vector with a **5-position historical breadcrumb trail**, and tells you exactly where to look up into the sky.

---

## 🌟 Key Features

- **Nearest Aircraft Telemetry Showcase**:
  - **Flight Number & Carrier**: Real-time identification (e.g. `UAL428`, `SWA1542`, `DAL1204`) with official airline names and callsigns.
  - **Altitude & Climb/Descent**: Instant altitude in feet, meters, and Flight Level (FL), paired with vertical speed indicator (`+fpm` climbing / `-fpm` descending).
  - **Groundspeed & Mach**: Speed reported in Knots (kts), Miles per Hour (mph), Kilometers per Hour (km/h), and estimated Mach number.
  - **Aircraft Type & Blueprint**: Official ICAO code (e.g. `B789`, `A359`, `B38M`), full model designation (e.g. *Boeing 787-9 Dreamliner*), and silhouette graphics with dynamic heading rotation.
  - **Visual Spotting Compass & Horizon Angle**: Tells you the compass bearing (`045° NE`) and elevation angle above the horizon (`Look 28° above the NE horizon right now!`).
  - **Route & En-Route Progress**: Origin and destination airports with IATA/ICAO codes and estimated route completion bar.
  - **Time to Closest Approach (CPA)**: Minutes until the aircraft reaches its closest point overhead.

- **5-Position Historical Vector Trail**:
  - Stores up to the last 5 transponder coordinates for tracked aircraft.
  - Renders a cyan phosphor polyline with graduated fading breadcrumb markers on both the **Tactical Radar Scope** and the **Aviation Chart**.

- **Tactical 360° Radar Scope**:
  - Phosphor circular radar sweep with authentic dark CRT aesthetic.
  - Range rings (20 NM, 40 NM, 60 NM, 100 NM) with True North azimuth markings.
  - Aircraft blips with velocity leader lines and avionics data tags (`IDENT`, `ALT/FL`, `SPEED`).

- **Interactive Aviation Navigation Map**:
  - Dark CartoDB tactical map tiles with aircraft icons oriented along their true flight track.
  - Polyline routes, antenna range radius, and historical position markers.

- **RF Transponder Signal Metrics**:
  - **Signal Strength (RSSI)**: Displays true antenna signal levels in dBFS (e.g. `-8.1 dBFS`).
  - **Message Counters**: Total Mode-S ADS-B frames received and ping freshness (`seen 0.4s ago`).
  - **Direct tar1090 Deep Link**: One-click jump to inspect any plane directly in your local tar1090 web UI (`/?icao=<hex>`).

- **Avionics Web Audio Synthesizer**:
  - Authentic procedural radar ping and target lock chimes using Web Audio API synthesis (zero external audio files).

---

## 🚀 Quick Start on a Blank Debian Container

AeroProximity includes an automated installation script (`install.sh`) that installs Node.js 20 LTS, system dependencies, compiles production assets, and sets up a background `systemd` service.

### 1. Requirements
- A blank container or VM running **Debian 11 (Bullseye)**, **Debian 12 (Bookworm)**, **Ubuntu 22.04 / 24.04**, or **Raspberry Pi OS**.
- Root or sudo privileges.
- Network access to install packages.

### 2. One-Line Installation

Log into your Debian container or terminal and run:

```bash
# 1. Update package lists and install git
apt-get update -y && apt-get install -y git

# 2. Clone the repository
git clone https://github.com/leebirdae/flight-tracker.git
cd flight-tracker

# 3. Run the automated installer
bash install.sh
```

### 3. What the Installer Does Automatically
1. Installs base utilities (`curl`, `ca-certificates`, `gnupg`, `build-essential`).
2. Configures the official NodeSource repository and installs **Node.js 20 LTS**.
3. Installs all application npm dependencies (`npm install`).
4. Compiles the optimized production frontend bundle (`npm run build`).
5. Generates the default `.env` configuration file.
6. Prompts to install and enable an automatic `systemd` background service (`aeroproximity.service`).

Once complete, open your browser and navigate to:
```
http://<your-container-ip>:3000
```

---

## 📡 Connecting Your ADS-B Radio (tar1090 / readsb / dump1090)

AeroProximity is designed to read data from your local ADS-B decoder:

### Supported Software
- **tar1090** (wiedehopf)
- **readsb**
- **dump1090-fa** (FlightAware)
- **dump1090-mutability**
- **PiAware / Flightradar24 / ADSBExchange** image installations

### Configuration
You can set your receiver's IP or hostname in `.env`:

```bash
# Edit .env in the aeroproximity root directory
nano .env
```

```env
PORT=3000

# Set to your receiver IP, hostname, or localhost
# Examples:
LOCAL_ADSB_URL=http://localhost:8080
# or if running on a separate device on your LAN:
# LOCAL_ADSB_URL=http://10.17.20.132:8080
# LOCAL_ADSB_URL=http://192.168.1.100:8080
# LOCAL_ADSB_URL=http://adsb.local:8080

# CartoDB Basemap API Key (optional for public tiles, required for high-volume or private Carto tiers)
CARTODB_API_KEY=your_cartodb_api_key_here
```

*Note: You can also change the receiver URL on the fly inside the web app by clicking the **tar1090 Receiver** button in the top navigation bar.*

---

## 🌉 Connecting a Private LAN Radio to a Remote Cloud Deployment

If you are hosting AeroProximity on a remote server or cloud container (e.g. Google Cloud Run, VPS, DigitalOcean) while your ADS-B receiver is on a private local network (such as `10.17.20.132` or `192.168.1.x`), the cloud server cannot directly route to your private home router.

AeroProximity provides a built-in **1-Line Stream Bridge**:

Run this command on any computer on your local home network (such as your Raspberry Pi or laptop where curl works):

```bash
while true; do \
  curl -s http://10.17.20.132:8080/data/aircraft.json | \
  curl -s -X POST -H "Content-Type: application/json" --data-binary @- \
  http://<your-server-ip-or-domain>:3000/api/aircraft/ingest; \
  sleep 2; \
done
```

The web app will immediately detect the live stream, calculate the geographic center of your antenna, and begin real-time radar tracking!

---

## 🛠️ Service Management

If you enabled the systemd service during installation:

```bash
# Check service status
sudo systemctl status aeroproximity

# Restart service
sudo systemctl restart aeroproximity

# Stop service
sudo systemctl stop aeroproximity

# View live application logs
sudo journalctl -u aeroproximity -f
```

---

## 💻 Manual Development & Build Commands

If you prefer running without systemd:

```bash
# Install dependencies
npm install

# Start development server with live reload (port 3000)
npm run dev

# Build production assets
npm run build

# Start production server
npm start

# Run TypeScript syntax and type checks
npm run lint
```

---

## 📂 Project Structure

```
├── install.sh                  # Automated Debian/Ubuntu installer script
├── server.ts                   # Express backend (tar1090 parser, ingest API, geo calculations)
├── src/
│   ├── App.tsx                 # Core application controller & polling engine
│   ├── components/
│   │   ├── Header.tsx          # Top navigation & status indicators
│   │   ├── ClosestAircraftCard # Telemetry hero card (altitude, airspeed, look-up angle)
│   │   ├── RadarScope.tsx      # 360° circular tactical radar with vector trails
│   │   ├── AviationMap.tsx     # Leaflet map with dark theme & flight paths
│   │   ├── SectorAircraftTable # Sortable & filterable aircraft table
│   │   ├── LocalAdsbSettings   # Receiver config, 1-line stream bridge, JSON paste
│   │   └── AircraftVectorIcon  # SVG silhouette with dynamic heading rotation
│   ├── data/
│   │   └── aviationReference   # Airlines, aircraft models, and major airports database
│   ├── types/
│   │   └── aviation.ts         # TypeScript definitions (AircraftInfo, TrailPoint, etc.)
│   └── utils/
│       ├── audio.ts            # Web Audio API radar ping & lock synthesizer
│       └── geo.ts              # Great-circle distance, bearing, and CPA math
├── package.json
└── vite.config.ts
```

---

## 📜 License

MIT License. Built for the ADS-B hobbyist and flight-tracking community.
