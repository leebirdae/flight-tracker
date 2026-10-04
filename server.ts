import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  calculateDistanceKm,
  kmToNm,
  kmToMiles,
  calculateBearingDeg,
  bearingToCardinal,
  calculateElevationAngleDeg,
  calculateCpaMinutes,
  feetToMeters,
  knotsToMph,
  knotsToKmh,
} from './src/utils/geo.js';
import {
  MAJOR_AIRPORTS,
  lookupAirline,
  lookupAircraft,
} from './src/data/aviationReference.js';
import { AircraftInfo, RadarDataResponse, Airport, ReceiverStatus, TrailPoint } from './src/types/aviation.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory store of the last 5 positions for each tracked aircraft
const aircraftTrails = new Map<string, TrailPoint[]>();

// Enable CORS and generous JSON parsing for live aircraft feeds
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-receiver-url');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '15mb' }));

// In-memory feed for ingested / streamed tar1090 data (via curl bridge or client)
interface IngestedFeed {
  timestamp: number;
  data: any;
  receiverUrl: string;
  source: 'tar1090-ingest' | 'tar1090-direct';
  autoCentroid?: { lat: number; lon: number };
}

let latestIngestedFeed: IngestedFeed | null = null;

// Simulation fleet for fallback
interface SimAircraft {
  icao24: string;
  ident: string;
  registration: string;
  callsign: string;
  airline: string;
  aircraftType: string;
  aircraftModel: string;
  aircraftCategory: string;
  lat: number;
  lon: number;
  altitudeFt: number;
  speedKts: number;
  headingDeg: number;
  verticalRateFpm: number;
  rssi: number;
  messages: number;
  origin: Airport;
  destination: Airport;
  lastUpdate: number;
}

let simulatedFleet: SimAircraft[] = [];
let simCenterLat = 37.7749;
let simCenterLon = -122.4194;
let simFleetTime = Date.now();

// Cache detected tar1090 working path per base URL
const detectedEndpointsCache = new Map<string, string>();
const receiverConfigCache = new Map<string, { lat?: number; lon?: number; version?: string }>();

function findNearestAirport(lat: number, lon: number, excludeCode?: string): Airport {
  let closest = MAJOR_AIRPORTS[0];
  let minDist = Infinity;
  for (const ap of MAJOR_AIRPORTS) {
    if (excludeCode && ap.code === excludeCode) continue;
    const d = calculateDistanceKm(lat, lon, ap.lat, ap.lon);
    if (d < minDist) {
      minDist = d;
      closest = ap;
    }
  }
  return closest;
}

function getRandomAirport(excludeCode?: string): Airport {
  const filtered = MAJOR_AIRPORTS.filter((a) => a.code !== excludeCode);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function initializeSimFleet(centerLat: number, centerLon: number) {
  simCenterLat = centerLat;
  simCenterLon = centerLon;
  simFleetTime = Date.now();

  const presets = [
    { prefix: 'UAL', num: 428, reg: 'N29985', type: 'B789', orig: 'SFO', dest: 'JFK', alt: 35000, spd: 485, dist: 12, angle: 45, rssi: -11.4 },
    { prefix: 'DAL', num: 1204, reg: 'N531DN', type: 'A321', orig: 'LAX', dest: 'SEA', alt: 28000, spd: 440, dist: 22, angle: 160, rssi: -14.2 },
    { prefix: 'AAL', num: 890, reg: 'N902AN', type: 'B738', orig: 'DFW', dest: 'ORD', alt: 31000, spd: 460, dist: 35, angle: 280, rssi: -18.7 },
    { prefix: 'SWA', num: 1542, reg: 'N8714Q', type: 'B38M', orig: 'DEN', dest: 'LAS', alt: 18500, spd: 390, dist: 7, angle: 95, rssi: -8.1 },
    { prefix: 'BAW', num: 286, reg: 'G-XWBG', type: 'A359', orig: 'LHR', dest: 'SFO', alt: 11000, spd: 280, dist: 18, angle: 310, rssi: -12.9 },
    { prefix: 'ASA', num: 337, reg: 'N419AS', type: 'B739', orig: 'SEA', dest: 'SAN', alt: 33000, spd: 470, dist: 48, angle: 215, rssi: -22.3 },
    { prefix: 'AFR', num: 84, reg: 'F-HREB', type: 'A35K', orig: 'CDG', dest: 'LAX', alt: 37000, spd: 505, dist: 55, angle: 10, rssi: -24.8 },
  ];

  simulatedFleet = presets.map((p, idx) => {
    const ident = `${p.prefix}${p.num}`;
    const airlineInfo = lookupAirline(ident);
    const aircraftInfo = lookupAircraft(p.type);
    const origin = MAJOR_AIRPORTS.find((a) => a.code === p.orig) || getRandomAirport();
    const destination = MAJOR_AIRPORTS.find((a) => a.code === p.dest) || getRandomAirport(origin.code);

    const angleRad = (p.angle * Math.PI) / 180;
    const distDeg = (p.dist * 1.852) / 111;
    const lat = centerLat + distDeg * Math.cos(angleRad);
    const lon = centerLon + (distDeg * Math.sin(angleRad)) / Math.cos((centerLat * Math.PI) / 180);
    const heading = (p.angle + 85 + (Math.random() * 20 - 10)) % 360;

    return {
      icao24: `a${(100000 + idx * 12345).toString(16)}`,
      ident,
      registration: p.reg,
      callsign: `${airlineInfo.name.split(' ')[0]} ${p.num}`,
      airline: airlineInfo.name,
      aircraftType: p.type,
      aircraftModel: aircraftInfo.model,
      aircraftCategory: aircraftInfo.category,
      lat,
      lon,
      altitudeFt: p.alt,
      speedKts: p.spd,
      headingDeg: Math.round(heading),
      verticalRateFpm: Math.random() > 0.6 ? (Math.random() > 0.5 ? 400 : -600) : 0,
      rssi: p.rssi,
      messages: Math.floor(250 + Math.random() * 1200),
      origin,
      destination,
      lastUpdate: Date.now(),
    };
  });
}

function updateSimFleet(userLat: number, userLon: number) {
  const now = Date.now();
  const dtSec = Math.max(0.5, (now - simFleetTime) / 1000);
  simFleetTime = now;

  if (
    simulatedFleet.length === 0 ||
    calculateDistanceKm(userLat, userLon, simCenterLat, simCenterLon) > 100
  ) {
    initializeSimFleet(userLat, userLon);
    return;
  }

  for (const ac of simulatedFleet) {
    const distKm = (ac.speedKts * 1.852 * dtSec) / 3600;
    const headingRad = (ac.headingDeg * Math.PI) / 180;

    const deltaLat = (distKm * Math.cos(headingRad)) / 111;
    const deltaLon = (distKm * Math.sin(headingRad)) / (111 * Math.cos((ac.lat * Math.PI) / 180));

    ac.lat += deltaLat;
    ac.lon += deltaLon;
    ac.messages += Math.floor(1 + Math.random() * 3);

    if (ac.verticalRateFpm !== 0) {
      ac.altitudeFt += (ac.verticalRateFpm * dtSec) / 60;
      if (ac.altitudeFt > 41000) ac.verticalRateFpm = -400;
      if (ac.altitudeFt < 3000) ac.verticalRateFpm = 500;
    }

    const distToUserNm = kmToNm(calculateDistanceKm(userLat, userLon, ac.lat, ac.lon));
    if (distToUserNm > 85) {
      const entryAngle = (ac.headingDeg + 180 + (Math.random() * 40 - 20)) % 360;
      const entryRad = (entryAngle * Math.PI) / 180;
      const entryDistDeg = (55 * 1.852) / 111;
      ac.lat = userLat + entryDistDeg * Math.cos(entryRad);
      ac.lon = userLon + (entryDistDeg * Math.sin(entryRad)) / Math.cos((userLat * Math.PI) / 180);
      ac.headingDeg = (calculateBearingDeg(ac.lat, ac.lon, userLat, userLon) + (Math.random() * 30 - 15) + 360) % 360;
    }
  }
}

// Calculate centroid of aircraft coordinates
function calculateAircraftCentroid(aircraftList: any[]): { lat: number; lon: number } | null {
  const valid = aircraftList.filter((a) => typeof a.lat === 'number' && typeof a.lon === 'number');
  if (valid.length === 0) return null;

  let sumLat = 0;
  let sumLon = 0;
  for (const a of valid) {
    sumLat += a.lat;
    sumLon += a.lon;
  }
  return {
    lat: Math.round((sumLat / valid.length) * 10000) / 10000,
    lon: Math.round((sumLon / valid.length) * 10000) / 10000,
  };
}

// Transform raw tar1090/readsb aircraft JSON item into AircraftInfo
function processTar1090Aircraft(
  raw: any,
  userLat: number,
  userLon: number,
  receiverBaseUrl: string,
  source: 'tar1090' | 'simulated'
): AircraftInfo | null {
  if (typeof raw.lat !== 'number' || typeof raw.lon !== 'number') {
    return null;
  }

  const icao24 = (raw.hex || raw.icao24 || '').toLowerCase().trim();
  const rawFlight = (raw.flight || raw.ident || '').trim().toUpperCase();
  const ident = rawFlight || (raw.r ? raw.r.trim().toUpperCase() : icao24.toUpperCase());

  const distKm = calculateDistanceKm(userLat, userLon, raw.lat, raw.lon);
  const distNm = kmToNm(distKm);
  const distMiles = kmToMiles(distKm);
  const bearingDeg = calculateBearingDeg(userLat, userLon, raw.lat, raw.lon);
  const cardinal = bearingToCardinal(bearingDeg);

  // Altitude can be number, or 'ground'
  let altitudeFt = 0;
  if (typeof raw.alt_baro === 'number') {
    altitudeFt = raw.alt_baro;
  } else if (typeof raw.alt_geom === 'number') {
    altitudeFt = raw.alt_geom;
  } else if (typeof raw.altitudeFt === 'number') {
    altitudeFt = raw.altitudeFt;
  } else if (raw.alt_baro === 'ground') {
    altitudeFt = 0;
  }

  const speedKts = typeof raw.gs === 'number'
    ? raw.gs
    : typeof raw.speedKts === 'number'
    ? raw.speedKts
    : 0;

  const headingDeg = typeof raw.track === 'number'
    ? raw.track
    : typeof raw.headingDeg === 'number'
    ? raw.headingDeg
    : 0;

  const verticalRateFpm = typeof raw.baro_rate === 'number'
    ? raw.baro_rate
    : typeof raw.geom_rate === 'number'
    ? raw.geom_rate
    : typeof raw.verticalRateFpm === 'number'
    ? raw.verticalRateFpm
    : 0;

  const elevationAngleDeg = calculateElevationAngleDeg(distKm, altitudeFt);
  const cpaMin = calculateCpaMinutes(userLat, userLon, raw.lat, raw.lon, headingDeg, speedKts);

  const airlineInfo = lookupAirline(ident);
  const aircraftTypeCode = (raw.t || raw.aircraftType || '').trim().toUpperCase();
  const aircraftInfo = lookupAircraft(aircraftTypeCode);

  const origin = raw.origin || findNearestAirport(raw.lat, raw.lon);
  const destination = raw.destination || getRandomAirport(origin.code);

  const totalRouteDist = calculateDistanceKm(origin.lat, origin.lon, destination.lat, destination.lon);
  const currentFromOrigin = calculateDistanceKm(origin.lat, origin.lon, raw.lat, raw.lon);
  const progressPct = totalRouteDist > 0
    ? Math.min(100, Math.max(5, Math.round((currentFromOrigin / totalRouteDist) * 100)))
    : 50;

  // Clean base URL for direct tar1090 link
  const cleanBase = (receiverBaseUrl || 'http://localhost:8080').replace(/\/data\/.*$/, '').replace(/\/$/, '');
  const tar1090Url = `${cleanBase}/?icao=${icao24}`;

  // Maintain last 5 positions in trail array
  let trail = aircraftTrails.get(icao24) || [];
  const lastPoint = trail[trail.length - 1];

  const hasMoved = !lastPoint ||
    Math.abs(lastPoint.lat - raw.lat) > 0.00008 ||
    Math.abs(lastPoint.lon - raw.lon) > 0.00008;

  if (hasMoved) {
    trail.push({
      lat: raw.lat,
      lon: raw.lon,
      altitudeFt: Math.round(altitudeFt),
      timestamp: Date.now(),
    });
    // Keep exactly the last 5 positions
    if (trail.length > 5) {
      trail = trail.slice(-5);
    }
    aircraftTrails.set(icao24, trail);
  }

  // If newly seen and moving, populate initial historical trail points based on heading and speed
  if (trail.length === 1 && speedKts > 20) {
    const syntheticPoints: TrailPoint[] = [];
    const backHeadingRad = ((headingDeg + 180) * Math.PI) / 180;
    for (let i = 4; i >= 1; i--) {
      const dtSec = i * 2.5;
      const backDistKm = (speedKts * 1.852 * dtSec) / 3600;
      const pLat = raw.lat + (backDistKm * Math.cos(backHeadingRad)) / 111;
      const pLon = raw.lon + (backDistKm * Math.sin(backHeadingRad)) / (111 * Math.cos((raw.lat * Math.PI) / 180));
      syntheticPoints.push({
        lat: pLat,
        lon: pLon,
        altitudeFt: Math.round(altitudeFt - (verticalRateFpm * dtSec) / 60),
        timestamp: Date.now() - dtSec * 1000,
      });
    }
    trail = [...syntheticPoints, trail[0]];
    aircraftTrails.set(icao24, trail);
  }

  return {
    icao24,
    ident,
    registration: raw.r || raw.registration,
    callsign: rawFlight ? `${airlineInfo.name.split(' ')[0]} ${rawFlight.replace(/\D/g, '') || rawFlight}` : (raw.r ? `Tail ${raw.r}` : 'General Aviation'),
    airline: airlineInfo.name,
    airlineIcao: airlineInfo.icao,
    lat: raw.lat,
    lon: raw.lon,
    altitudeFt: Math.round(altitudeFt),
    altitudeM: Math.round(feetToMeters(altitudeFt)),
    speedKts: Math.round(speedKts),
    speedMph: Math.round(knotsToMph(speedKts)),
    speedKmh: Math.round(knotsToKmh(speedKts)),
    verticalRateFpm: Math.round(verticalRateFpm),
    headingDeg: Math.round(headingDeg),
    squawk: raw.squawk || '1200',
    aircraftType: aircraftTypeCode || aircraftInfo.code,
    aircraftModel: raw.desc || aircraftInfo.model,
    aircraftCategory: aircraftInfo.category,
    origin,
    destination,
    distanceKm: Math.round(distKm * 10) / 10,
    distanceNm: Math.round(distNm * 10) / 10,
    distanceMiles: Math.round(distMiles * 10) / 10,
    bearingDeg: Math.round(bearingDeg),
    cardinalDirection: cardinal,
    elevationAngleDeg: Math.round(elevationAngleDeg * 10) / 10,
    estimatedTimeToCpaMin: cpaMin,
    routeProgressPct: progressPct,
    source,
    lastSeen: new Date().toISOString(),
    rssi: typeof raw.rssi === 'number' ? Math.round(raw.rssi * 10) / 10 : undefined,
    messages: typeof raw.messages === 'number' ? raw.messages : undefined,
    seenSec: typeof raw.seen === 'number' ? Math.round(raw.seen * 10) / 10 : undefined,
    tar1090Url,
    trail,
  };
}

// Fetch data from local tar1090 / readsb instance with auto-path discovery
async function fetchLocalTar1090(
  receiverUrl: string
): Promise<{
  aircraft: any[];
  totalMessages?: number;
  receiverLat?: number;
  receiverLon?: number;
  version?: string;
  activeEndpoint: string;
  latencyMs: number;
} | null> {
  const startTime = Date.now();
  const cleanInput = receiverUrl.trim();

  // 1. Direct local filesystem check (e.g. /run/readsb/aircraft.json in container/host)
  if (cleanInput.startsWith('/') || cleanInput.startsWith('file://')) {
    const filePath = cleanInput.replace(/^file:\/\//, '');
    try {
      if (fs.existsSync(filePath)) {
        const raw = await fs.promises.readFile(filePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data && (Array.isArray(data.aircraft) || Array.isArray(data))) {
          const aircraftList = Array.isArray(data.aircraft) ? data.aircraft : (Array.isArray(data) ? data : []);
          return {
            aircraft: aircraftList,
            totalMessages: data.messages,
            receiverLat: typeof data.lat === 'number' ? data.lat : undefined,
            receiverLon: typeof data.lon === 'number' ? data.lon : undefined,
            version: data.version || 'readsb/dump1090 (local file)',
            activeEndpoint: filePath,
            latencyMs: Date.now() - startTime,
          };
        }
      }
    } catch {
      // Local file unreadable or invalid JSON
    }
  }

  // 2. Network HTTP/HTTPS fetch
  let base = cleanInput.replace(/\/$/, '');
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = `http://${base}`;
  }

  const urlObj = (() => {
    try {
      return new URL(base);
    } catch {
      return null;
    }
  })();

  const candidatePaths: string[] = [];
  const cachedSuccess = detectedEndpointsCache.get(base);
  if (cachedSuccess) {
    candidatePaths.push(cachedSuccess);
  }

  if (base.endsWith('.json')) {
    candidatePaths.push(base);
  } else {
    candidatePaths.push(
      `${base}/data/aircraft.json`,
      `${base}/tar1090/data/aircraft.json`,
      `${base}/dump1090-fa/data/aircraft.json`,
      `${base}/readsb/data/aircraft.json`,
      `${base}/aircraft.json`
    );
    // If port was omitted, also test standard port 8080
    if (urlObj && !urlObj.port) {
      const port8080 = `${urlObj.protocol}//${urlObj.hostname}:8080`;
      candidatePaths.push(
        `${port8080}/data/aircraft.json`,
        `${port8080}/tar1090/data/aircraft.json`,
        `${port8080}/dump1090-fa/data/aircraft.json`,
        `${port8080}/readsb/data/aircraft.json`,
        `${port8080}/aircraft.json`
      );
    }
  }

  const fetchEndpoint = async (url: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && (Array.isArray(data.aircraft) || Array.isArray(data))) {
          return { endpoint: url, payload: data };
        }
      }
    } catch {
      // not available
    } finally {
      clearTimeout(timeout);
    }
    throw new Error('Endpoint not responding');
  };

  let successfulEndpoint = '';
  let payload: any = null;

  try {
    const winner = await Promise.any(candidatePaths.map(fetchEndpoint));
    successfulEndpoint = winner.endpoint;
    payload = winner.payload;
    detectedEndpointsCache.set(base, winner.endpoint);
  } catch {
    // None succeeded
  }

  if (!payload || !successfulEndpoint) {
    return null;
  }

  const latencyMs = Date.now() - startTime;
  const aircraftList = Array.isArray(payload.aircraft) ? payload.aircraft : (Array.isArray(payload) ? payload : []);

  let receiverLat: number | undefined = typeof payload.lat === 'number' ? payload.lat : undefined;
  let receiverLon: number | undefined = typeof payload.lon === 'number' ? payload.lon : undefined;
  let version = payload.version;

  const cachedConfig = receiverConfigCache.get(base);
  if (cachedConfig) {
    if (typeof cachedConfig.lat === 'number') receiverLat = cachedConfig.lat;
    if (typeof cachedConfig.lon === 'number') receiverLon = cachedConfig.lon;
    if (cachedConfig.version) version = cachedConfig.version;
  } else {
    try {
      const receiverConfigUrl = successfulEndpoint.replace('aircraft.json', 'receiver.json');
      const rRes = await fetch(receiverConfigUrl, { signal: AbortSignal.timeout(1500) });
      if (rRes.ok) {
        const rData = await rRes.json();
        if (typeof rData.lat === 'number' && typeof rData.lon === 'number') {
          receiverLat = rData.lat;
          receiverLon = rData.lon;
        }
        if (rData.version) version = rData.version;
        receiverConfigCache.set(base, { lat: receiverLat, lon: receiverLon, version });
      }
    } catch {
      // Optional config file not found
    }
  }

  return {
    aircraft: aircraftList,
    totalMessages: payload.messages,
    receiverLat,
    receiverLon,
    version,
    activeEndpoint: successfulEndpoint,
    latencyMs,
  };
}

// ---------------- API ROUTES ----------------

// Public client configuration (CartoDB API key, local receiver default)
app.get('/api/config', (_req: Request, res: Response) => {
  const cartodbApiKey =
    process.env.CARTODB_API_KEY ||
    process.env.VITE_CARTODB_API_KEY ||
    '';

  res.json({
    cartodbApiKey,
    localAdsbUrl: process.env.LOCAL_ADSB_URL || 'http://localhost:8080',
  });
});

// Receiver connection diagnostics endpoint
app.get('/api/receiver/status', async (req: Request, res: Response) => {
  const receiverUrl =
    (req.query.receiverUrl as string) ||
    (req.headers['x-receiver-url'] as string) ||
    process.env.LOCAL_ADSB_URL ||
    'http://localhost:8080';

  // 1. Check DIRECT connection to the local receiver first
  const directResult = await fetchLocalTar1090(receiverUrl);
  if (directResult) {
    return res.json({
      connected: true,
      url: receiverUrl,
      activeEndpoint: directResult.activeEndpoint,
      latencyMs: directResult.latencyMs,
      aircraftCount: directResult.aircraft.length,
      totalMessages: directResult.totalMessages,
      version: directResult.version,
      receiverLat: directResult.receiverLat,
      receiverLon: directResult.receiverLon,
      isDirectConnection: true,
    });
  }

  // 2. Check if we have recently ingested data via stream bridge (fallback for remote cloud)
  const isRecentIngest = latestIngestedFeed && Date.now() - latestIngestedFeed.timestamp < 35000;
  if (isRecentIngest && latestIngestedFeed) {
    const rawList = Array.isArray(latestIngestedFeed.data.aircraft)
      ? latestIngestedFeed.data.aircraft
      : (Array.isArray(latestIngestedFeed.data) ? latestIngestedFeed.data : []);

    return res.json({
      connected: true,
      url: latestIngestedFeed.receiverUrl,
      activeEndpoint: 'Live Stream Bridge / Ingested JSON',
      latencyMs: 1,
      aircraftCount: rawList.length,
      totalMessages: latestIngestedFeed.data.messages,
      version: latestIngestedFeed.data.version || 'readsb/tar1090',
      receiverLat: latestIngestedFeed.autoCentroid?.lat,
      receiverLon: latestIngestedFeed.autoCentroid?.lon,
      isIngestedStream: true,
    });
  }

  // 3. Not reachable directly or via stream
  res.json({
    connected: false,
    url: receiverUrl,
    latencyMs: 0,
    aircraftCount: 0,
    error: `Could not reach ${receiverUrl}. Ensure your local tar1090 / readsb / dump1090 receiver is running.`,
  });
});

// Ingest endpoint: accepts JSON piped from curl, a local cron, or the browser directly
app.post('/api/aircraft/ingest', (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload) {
    return res.status(400).json({ error: 'Empty JSON payload' });
  }

  const aircraftList = Array.isArray(payload.aircraft)
    ? payload.aircraft
    : (Array.isArray(payload) ? payload : []);

  const receiverUrl =
    (req.query.receiverUrl as string) ||
    (req.headers['x-receiver-url'] as string) ||
    'http://10.17.20.132:8080';

  const centroid = calculateAircraftCentroid(aircraftList);

  latestIngestedFeed = {
    timestamp: Date.now(),
    data: payload,
    receiverUrl,
    source: 'tar1090-ingest',
    autoCentroid: centroid || undefined,
  };

  res.json({
    success: true,
    aircraftCount: aircraftList.length,
    centroid,
    message: `Successfully ingested ${aircraftList.length} aircraft from tar1090 live transponder feed.`,
    timestamp: new Date().toISOString(),
  });
});

// Process raw aircraft JSON on demand with user location
app.post('/api/aircraft/process', (req: Request, res: Response) => {
  const { rawData, userLat = 37.7749, userLon = -122.4194, radiusNm = 60, receiverUrl = 'http://localhost:8080' } = req.body;

  if (!rawData) {
    return res.status(400).json({ error: 'rawData is required' });
  }

  const rawList = Array.isArray(rawData.aircraft)
    ? rawData.aircraft
    : (Array.isArray(rawData) ? rawData : []);

  const processed = rawList
    .map((raw: any) => processTar1090Aircraft(raw, userLat, userLon, receiverUrl, 'tar1090'))
    .filter((ac: any): ac is AircraftInfo => ac !== null && ac.distanceNm <= radiusNm);

  processed.sort((a: any, b: any) => a.distanceNm - b.distanceNm);
  const closest = processed.length > 0 ? processed[0] : null;

  res.json({
    userLocation: { lat: userLat, lon: userLon },
    closestAircraft: closest,
    allAircraft: processed,
    scanRadiusNm: radiusNm,
    totalTracked: processed.length,
    source: 'tar1090',
  });
});

// Main aircraft radar query: checks direct local ADS-B first, then ingested stream, then simulation
app.get('/api/aircraft/closest', async (req: Request, res: Response) => {
  const latStr = req.query.lat as string;
  const lonStr = req.query.lon as string;
  const radiusStr = req.query.radius as string;
  const receiverUrl =
    (req.query.receiverUrl as string) ||
    (req.headers['x-receiver-url'] as string) ||
    process.env.LOCAL_ADSB_URL ||
    'http://10.17.20.132:8080';

  let userLat = parseFloat(latStr) || 37.7749;
  let userLon = parseFloat(lonStr) || -122.4194;
  const radiusNm = Math.min(300, Math.max(5, parseFloat(radiusStr) || 60));

  let aircraftList: AircraftInfo[] = [];
  let source: 'tar1090' | 'simulated' = 'simulated';
  let activeProvider = 'Local ADS-B Receiver';
  let statusMessage = '';
  let receiverStatus: ReceiverStatus = {
    connected: false,
    url: receiverUrl,
    latencyMs: 0,
    aircraftCount: 0,
  };

  // 1. Direct local ADS-B query (PRIORITY 1: if server can reach radio locally or via LAN, read directly!)
  const directData = await fetchLocalTar1090(receiverUrl);

  if (directData) {
    receiverStatus = {
      connected: true,
      url: receiverUrl,
      activeEndpoint: directData.activeEndpoint,
      latencyMs: directData.latencyMs,
      aircraftCount: directData.aircraft.length,
      totalMessages: directData.totalMessages,
      version: directData.version,
      receiverLat: directData.receiverLat,
      receiverLon: directData.receiverLon,
    };

    // Auto-center on antenna location if available
    if (directData.receiverLat && directData.receiverLon && !req.query.lat) {
      userLat = directData.receiverLat;
      userLon = directData.receiverLon;
    } else if (!req.query.lat && directData.aircraft.length > 0) {
      // If receiver coordinates not in receiver.json, auto-center on centroid of tracked aircraft
      const centroid = calculateAircraftCentroid(directData.aircraft);
      if (centroid) {
        userLat = centroid.lat;
        userLon = centroid.lon;
        receiverStatus.receiverLat = centroid.lat;
        receiverStatus.receiverLon = centroid.lon;
      }
    }

    const processed = directData.aircraft
      .map((raw) => processTar1090Aircraft(raw, userLat, userLon, receiverUrl, 'tar1090'))
      .filter((ac): ac is AircraftInfo => ac !== null && ac.distanceNm <= radiusNm);

    source = 'tar1090';
    activeProvider = `Local ADS-B (Direct: ${receiverUrl})`;

    if (processed.length > 0) {
      aircraftList = processed;
      statusMessage = `Direct local connection: Tracking ${aircraftList.length} aircraft via ${directData.activeEndpoint}.`;
    } else {
      aircraftList = [];
      statusMessage = `Direct local connection active: ${directData.aircraft.length} aircraft tracked by antenna (0 currently within ${radiusNm} NM).`;
    }
  }

  // 2. If direct fetch was not reachable, check if user has active stream bridge from remote container
  if (!directData) {
    const isIngestedActive = latestIngestedFeed && Date.now() - latestIngestedFeed.timestamp < 35000;

    if (isIngestedActive && latestIngestedFeed) {
      const rawList = Array.isArray(latestIngestedFeed.data.aircraft)
        ? latestIngestedFeed.data.aircraft
        : (Array.isArray(latestIngestedFeed.data) ? latestIngestedFeed.data : []);

      if (!req.query.lat && latestIngestedFeed.autoCentroid) {
        userLat = latestIngestedFeed.autoCentroid.lat;
        userLon = latestIngestedFeed.autoCentroid.lon;
      }

      receiverStatus = {
        connected: true,
        url: latestIngestedFeed.receiverUrl,
        activeEndpoint: 'Live Stream Bridge / Ingested JSON',
        latencyMs: 1,
        aircraftCount: rawList.length,
        totalMessages: latestIngestedFeed.data.messages,
        version: latestIngestedFeed.data.version || 'readsb/tar1090',
        receiverLat: latestIngestedFeed.autoCentroid?.lat,
        receiverLon: latestIngestedFeed.autoCentroid?.lon,
      };

      const processed = rawList
        .map((raw: any) => processTar1090Aircraft(raw, userLat, userLon, latestIngestedFeed!.receiverUrl, 'tar1090'))
        .filter((ac: any): ac is AircraftInfo => ac !== null && ac.distanceNm <= radiusNm);

      source = 'tar1090';
      activeProvider = `Local ADS-B Stream (${latestIngestedFeed.receiverUrl})`;

      if (processed.length > 0) {
        aircraftList = processed;
        statusMessage = `Receiving live transponder signals from ${aircraftList.length} aircraft via tar1090 stream.`;
      } else {
        aircraftList = [];
        statusMessage = `Connected to tar1090 stream with ${rawList.length} aircraft, but none currently within ${radiusNm} NM of observer.`;
      }
    }
  }

  // 3. Fallback: Airspace simulation ONLY if local receiver could not be reached AND no stream bridge exists
  if (!directData && !receiverStatus.connected) {
    updateSimFleet(userLat, userLon);
    aircraftList = simulatedFleet
      .map((ac) => processTar1090Aircraft(ac, userLat, userLon, receiverUrl, 'simulated'))
      .filter((ac): ac is AircraftInfo => ac !== null);
    source = 'simulated';
    activeProvider = `Simulation (Receiver at ${receiverUrl} unreachable)`;
    statusMessage = `Could not reach ${receiverUrl} directly. Ensure readsb/tar1090 is running at this address.`;
  }

  aircraftList.sort((a, b) => a.distanceNm - b.distanceNm);
  const closest = aircraftList.length > 0 ? aircraftList[0] : null;

  const response: RadarDataResponse = {
    userLocation: {
      lat: userLat,
      lon: userLon,
      isReceiverPosition: !!(receiverStatus.receiverLat && receiverStatus.receiverLat === userLat),
    },
    closestAircraft: closest,
    allAircraft: aircraftList,
    scanRadiusNm: radiusNm,
    timestamp: new Date().toISOString(),
    source,
    activeProvider,
    totalTracked: aircraftList.length,
    statusMessage,
    receiver: receiverStatus,
  };

  res.json(response);
});

// Vite & Static middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`📡 AeroProximity Local tar1090 ADS-B Server running on port ${PORT}`);
  });
}

startServer();
