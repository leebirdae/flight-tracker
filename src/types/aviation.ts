export interface Airport {
  code: string;
  icao?: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export interface TrailPoint {
  lat: number;
  lon: number;
  altitudeFt?: number;
  timestamp: number;
}

export interface AircraftInfo {
  icao24: string; // 24-bit Mode-S Hex (e.g. "a2174b")
  ident: string; // Flight number / callsign (e.g. "SWA1542")
  callsign: string;
  registration?: string; // Tail number (e.g. "N8714Q")
  airline: string;
  airlineIcao?: string;
  lat: number;
  lon: number;
  altitudeFt: number;
  altitudeM: number;
  speedKts: number;
  speedMph: number;
  speedKmh: number;
  verticalRateFpm: number;
  headingDeg: number;
  squawk?: string;
  aircraftType: string; // e.g. "B738"
  aircraftModel: string; // e.g. "Boeing 737-800"
  aircraftCategory: string; // e.g. "Narrow-body Jet"
  origin: Airport;
  destination: Airport;
  distanceKm: number;
  distanceNm: number;
  distanceMiles: number;
  bearingDeg: number;
  cardinalDirection: string;
  elevationAngleDeg: number; // Angle above observer horizon for visual spotting
  estimatedTimeToCpaMin: number; // Minutes to closest approach
  routeProgressPct: number;
  source: 'tar1090' | 'simulated';
  lastSeen: string;
  // Local tar1090 / readsb specific metrics
  rssi?: number; // Signal strength in dBFS (e.g. -12.4)
  messages?: number; // Total ADS-B frames received
  seenSec?: number; // Seconds since last message received
  tar1090Url?: string; // Direct link to this aircraft in local tar1090
  trail?: TrailPoint[]; // Last 5 historical positions
}

export interface ReceiverStatus {
  connected: boolean;
  url: string;
  activeEndpoint?: string;
  latencyMs: number;
  aircraftCount: number;
  totalMessages?: number;
  version?: string;
  receiverLat?: number;
  receiverLon?: number;
  refreshRateSec?: number;
  error?: string;
}

export interface RadarDataResponse {
  userLocation: {
    lat: number;
    lon: number;
    name?: string;
    isReceiverPosition?: boolean;
  };
  closestAircraft: AircraftInfo | null;
  allAircraft: AircraftInfo[];
  scanRadiusNm: number;
  timestamp: string;
  source: 'tar1090' | 'simulated';
  activeProvider: string;
  totalTracked: number;
  statusMessage?: string;
  receiver: ReceiverStatus;
}
