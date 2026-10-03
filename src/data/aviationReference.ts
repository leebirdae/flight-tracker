import { Airport } from '../types/aviation.js';

export const MAJOR_AIRPORTS: Airport[] = [
  { code: 'JFK', icao: 'KJFK', name: 'John F. Kennedy Intl', city: 'New York', country: 'USA', lat: 40.6413, lon: -73.7781 },
  { code: 'LAX', icao: 'KLAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'USA', lat: 33.9416, lon: -118.4085 },
  { code: 'ORD', icao: 'KORD', name: "O'Hare Intl", city: 'Chicago', country: 'USA', lat: 41.9742, lon: -87.9073 },
  { code: 'DFW', icao: 'KDFW', name: 'Dallas/Fort Worth Intl', city: 'Dallas', country: 'USA', lat: 32.8998, lon: -97.0403 },
  { code: 'DEN', icao: 'KDEN', name: 'Denver Intl', city: 'Denver', country: 'USA', lat: 39.8561, lon: -104.6737 },
  { code: 'SFO', icao: 'KSFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'USA', lat: 37.6188, lon: -122.3754 },
  { code: 'ATL', icao: 'KATL', name: 'Hartsfield-Jackson Atlanta Intl', city: 'Atlanta', country: 'USA', lat: 33.6407, lon: -84.4277 },
  { code: 'SEA', icao: 'KSEA', name: 'Seattle-Tacoma Intl', city: 'Seattle', country: 'USA', lat: 47.4502, lon: -122.3088 },
  { code: 'LAS', icao: 'KLAS', name: 'Harry Reid Intl', city: 'Las Vegas', country: 'USA', lat: 36.0840, lon: -115.1537 },
  { code: 'MCO', icao: 'KMCO', name: 'Orlando Intl', city: 'Orlando', country: 'USA', lat: 28.4312, lon: -81.3081 },
  { code: 'EWR', icao: 'KEWR', name: 'Newark Liberty Intl', city: 'Newark', country: 'USA', lat: 40.6895, lon: -74.1745 },
  { code: 'MIA', icao: 'KMIA', name: 'Miami Intl', city: 'Miami', country: 'USA', lat: 25.7959, lon: -80.2870 },
  { code: 'CLT', icao: 'KCLT', name: 'Charlotte Douglas Intl', city: 'Charlotte', country: 'USA', lat: 35.2140, lon: -80.9431 },
  { code: 'PHX', icao: 'KPHX', name: 'Phoenix Sky Harbor Intl', city: 'Phoenix', country: 'USA', lat: 33.4342, lon: -112.0080 },
  { code: 'IAH', icao: 'KIAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'USA', lat: 29.9902, lon: -95.3368 },
  { code: 'BOS', icao: 'KBOS', name: 'Boston Logan Intl', city: 'Boston', country: 'USA', lat: 42.3656, lon: -71.0096 },
  { code: 'MSP', icao: 'KMSP', name: 'Minneapolis-Saint Paul Intl', city: 'Minneapolis', country: 'USA', lat: 44.8848, lon: -93.2223 },
  { code: 'DTW', icao: 'KDTW', name: 'Detroit Metropolitan', city: 'Detroit', country: 'USA', lat: 42.2162, lon: -83.3554 },
  { code: 'FLL', icao: 'KFLL', name: 'Fort Lauderdale-Hollywood Intl', city: 'Fort Lauderdale', country: 'USA', lat: 26.0742, lon: -80.1506 },
  { code: 'PHL', icao: 'KPHL', name: 'Philadelphia Intl', city: 'Philadelphia', country: 'USA', lat: 39.8729, lon: -75.2437 },
  { code: 'LGA', icao: 'KLGA', name: 'LaGuardia Airport', city: 'New York', country: 'USA', lat: 40.7769, lon: -73.8740 },
  { code: 'BWI', icao: 'KBWI', name: 'Baltimore/Washington Intl', city: 'Baltimore', country: 'USA', lat: 39.1754, lon: -76.6683 },
  { code: 'SLC', icao: 'KSLC', name: 'Salt Lake City Intl', city: 'Salt Lake City', country: 'USA', lat: 40.7899, lon: -111.9791 },
  { code: 'SAN', icao: 'KSAN', name: 'San Diego Intl', city: 'San Diego', country: 'USA', lat: 32.7338, lon: -117.1933 },
  { code: 'IAD', icao: 'KIAD', name: 'Washington Dulles Intl', city: 'Washington D.C.', country: 'USA', lat: 38.9531, lon: -77.4565 },
  { code: 'DCA', icao: 'KDCA', name: 'Ronald Reagan Washington Natl', city: 'Washington D.C.', country: 'USA', lat: 38.8512, lon: -77.0402 },
  { code: 'MDW', icao: 'KMDW', name: 'Chicago Midway Intl', city: 'Chicago', country: 'USA', lat: 41.7868, lon: -87.7522 },
  { code: 'TPA', icao: 'KTPA', name: 'Tampa Intl', city: 'Tampa', country: 'USA', lat: 27.9755, lon: -82.5332 },
  { code: 'PDX', icao: 'KPDX', name: 'Portland Intl', city: 'Portland', country: 'USA', lat: 45.5898, lon: -122.5951 },
  { code: 'HNL', icao: 'PHNL', name: 'Daniel K. Inouye Intl', city: 'Honolulu', country: 'USA', lat: 21.3187, lon: -157.9224 },
  { code: 'LHR', icao: 'EGLL', name: 'London Heathrow', city: 'London', country: 'UK', lat: 51.4700, lon: -0.4543 },
  { code: 'LGW', icao: 'EGKK', name: 'London Gatwick', city: 'London', country: 'UK', lat: 51.1537, lon: -0.1821 },
  { code: 'CDG', icao: 'LFPG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479 },
  { code: 'AMS', icao: 'EHAM', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683 },
  { code: 'FRA', icao: 'EDDF', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622 },
  { code: 'MUC', icao: 'EDDM', name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3537, lon: 11.7860 },
  { code: 'MAD', icao: 'LEMD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain', lat: 40.4839, lon: -3.5680 },
  { code: 'BCN', icao: 'LEBL', name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lon: 2.0833 },
  { code: 'FCO', icao: 'LIRF', name: 'Leonardo da Vinci-Fiumicino', city: 'Rome', country: 'Italy', lat: 41.8003, lon: 12.2389 },
  { code: 'ZRH', icao: 'LSZH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4582, lon: 8.5555 },
  { code: 'HND', icao: 'RJTT', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798 },
  { code: 'NRT', icao: 'RJAA', name: 'Narita Intl', city: 'Tokyo', country: 'Japan', lat: 35.7647, lon: 140.3863 },
  { code: 'ICN', icao: 'RKSI', name: 'Incheon Intl', city: 'Seoul', country: 'South Korea', lat: 37.4602, lon: 126.4407 },
  { code: 'SIN', icao: 'WSSS', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915 },
  { code: 'DXB', icao: 'OMDB', name: 'Dubai Intl', city: 'Dubai', country: 'UAE', lat: 25.2532, lon: 55.3657 },
  { code: 'SYD', icao: 'YSSY', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', lat: -33.9399, lon: 151.1753 },
  { code: 'YYZ', icao: 'CYYZ', name: 'Toronto Pearson Intl', city: 'Toronto', country: 'Canada', lat: 43.6777, lon: -79.6248 },
  { code: 'YVR', icao: 'CYVR', name: 'Vancouver Intl', city: 'Vancouver', country: 'Canada', lat: 49.1967, lon: -123.1815 },
  { code: 'MEX', icao: 'MMMX', name: 'Mexico City Benito Juárez Intl', city: 'Mexico City', country: 'Mexico', lat: 19.4361, lon: -99.0719 },
];

export const AIRLINE_PREFIXES: Record<string, string> = {
  AAL: 'American Airlines',
  AAR: 'Asiana Airlines',
  ACA: 'Air Canada',
  AFR: 'Air France',
  AIC: 'Air India',
  AMX: 'Aeroméxico',
  ANA: 'All Nippon Airways',
  ASA: 'Alaska Airlines',
  AUA: 'Austrian Airlines',
  AVA: 'Avianca',
  AZA: 'ITA Airways',
  BAW: 'British Airways',
  BER: 'Air Berlin',
  CCA: 'Air China',
  CES: 'China Eastern Airlines',
  CPA: 'Cathay Pacific',
  CSN: 'China Southern Airlines',
  DAL: 'Delta Air Lines',
  DLH: 'Lufthansa',
  EDW: 'Edelweiss Air',
  EIN: 'Aer Lingus',
  ETD: 'Etihad Airways',
  ETH: 'Ethiopian Airlines',
  EVA: 'EVA Air',
  EZY: 'easyJet',
  FDX: 'FedEx Express',
  FIN: 'Finnair',
  GIA: 'Garuda Indonesia',
  HAL: 'Hawaiian Airlines',
  IBE: 'Iberia',
  JAL: 'Japan Airlines',
  JBU: 'JetBlue Airways',
  KAL: 'Korean Air',
  KLM: 'KLM Royal Dutch Airlines',
  QFA: 'Qantas',
  QTR: 'Qatar Airways',
  RPA: 'Republic Airways',
  RYR: 'Ryanair',
  SAS: 'Scandinavian Airlines',
  SIA: 'Singapore Airlines',
  SKW: 'SkyWest Airlines',
  SWA: 'Southwest Airlines',
  SWR: 'Swiss International Air Lines',
  TAP: 'TAP Air Portugal',
  THY: 'Turkish Airlines',
  UAE: 'Emirates',
  UAL: 'United Airlines',
  UPS: 'UPS Airlines',
  VIR: 'Virgin Atlantic',
  VOZ: 'Virgin Australia',
  WJA: 'WestJet',
};

export const AIRCRAFT_TYPES: Record<string, { model: string; category: string; maxSpeed: number }> = {
  B737: { model: 'Boeing 737-700', category: 'Narrow-body Jet', maxSpeed: 470 },
  B738: { model: 'Boeing 737-800', category: 'Narrow-body Jet', maxSpeed: 475 },
  B739: { model: 'Boeing 737-900', category: 'Narrow-body Jet', maxSpeed: 475 },
  B38M: { model: 'Boeing 737 MAX 8', category: 'Narrow-body Jet', maxSpeed: 480 },
  B39M: { model: 'Boeing 737 MAX 9', category: 'Narrow-body Jet', maxSpeed: 480 },
  A319: { model: 'Airbus A319', category: 'Narrow-body Jet', maxSpeed: 470 },
  A320: { model: 'Airbus A320-200', category: 'Narrow-body Jet', maxSpeed: 475 },
  A20N: { model: 'Airbus A320neo', category: 'Narrow-body Jet', maxSpeed: 480 },
  A321: { model: 'Airbus A321-200', category: 'Narrow-body Jet', maxSpeed: 480 },
  A21N: { model: 'Airbus A321neo', category: 'Narrow-body Jet', maxSpeed: 485 },
  A332: { model: 'Airbus A330-200', category: 'Wide-body Heavy', maxSpeed: 495 },
  A333: { model: 'Airbus A330-300', category: 'Wide-body Heavy', maxSpeed: 495 },
  A339: { model: 'Airbus A330-900neo', category: 'Wide-body Heavy', maxSpeed: 500 },
  A359: { model: 'Airbus A350-900', category: 'Wide-body Heavy', maxSpeed: 510 },
  A35K: { model: 'Airbus A350-1000', category: 'Wide-body Heavy', maxSpeed: 510 },
  A388: { model: 'Airbus A380-800 Superjumbo', category: 'Super Heavy', maxSpeed: 510 },
  B744: { model: 'Boeing 744 Queen of the Skies', category: 'Heavy 4-Engine', maxSpeed: 515 },
  B748: { model: 'Boeing 747-8 Intercontinental', category: 'Heavy 4-Engine', maxSpeed: 520 },
  B752: { model: 'Boeing 757-200', category: 'Narrow-body Twin', maxSpeed: 480 },
  B763: { model: 'Boeing 767-300ER', category: 'Wide-body Heavy', maxSpeed: 490 },
  B772: { model: 'Boeing 777-200ER', category: 'Wide-body Heavy', maxSpeed: 510 },
  B77W: { model: 'Boeing 777-300ER', category: 'Wide-body Heavy', maxSpeed: 515 },
  B788: { model: 'Boeing 787-8 Dreamliner', category: 'Wide-body Heavy', maxSpeed: 510 },
  B789: { model: 'Boeing 787-9 Dreamliner', category: 'Wide-body Heavy', maxSpeed: 515 },
  B78X: { model: 'Boeing 787-10 Dreamliner', category: 'Wide-body Heavy', maxSpeed: 515 },
  E190: { model: 'Embraer E190', category: 'Regional Jet', maxSpeed: 460 },
  E75L: { model: 'Embraer 175 (Enhanced)', category: 'Regional Jet', maxSpeed: 460 },
  CRJ9: { model: 'Bombardier CRJ-900', category: 'Regional Jet', maxSpeed: 465 },
  BCS3: { model: 'Airbus A220-300', category: 'Narrow-body Jet', maxSpeed: 475 },
  C172: { model: 'Cessna 172 Skyhawk', category: 'Single-Engine Piston', maxSpeed: 125 },
  C208: { model: 'Cessna 208 Caravan', category: 'Single Turboprop', maxSpeed: 185 },
  PC12: { model: 'Pilatus PC-12 NGX', category: 'Single Turboprop', maxSpeed: 285 },
  GLF6: { model: 'Gulfstream G650', category: 'Ultra Long-Range Bizjet', maxSpeed: 530 },
  CL35: { model: 'Bombardier Challenger 350', category: 'Super-Midsize Bizjet', maxSpeed: 485 },
};

export function lookupAirline(ident: string): { name: string; icao: string } {
  if (!ident || ident.length < 3) return { name: 'Private / General Aviation', icao: '' };
  const prefix = ident.substring(0, 3).toUpperCase();
  if (AIRLINE_PREFIXES[prefix]) {
    return { name: AIRLINE_PREFIXES[prefix], icao: prefix };
  }
  return { name: 'Charter / Commercial Operator', icao: prefix };
}

export function lookupAircraft(typeCode?: string): { code: string; model: string; category: string } {
  if (!typeCode) return { code: 'A320', model: 'Airbus A320-200', category: 'Narrow-body Jet' };
  const upper = typeCode.toUpperCase().trim();
  if (AIRCRAFT_TYPES[upper]) {
    return { code: upper, ...AIRCRAFT_TYPES[upper] };
  }
  // Try partial match
  for (const [key, val] of Object.entries(AIRCRAFT_TYPES)) {
    if (upper.includes(key) || key.includes(upper)) {
      return { code: key, ...val };
    }
  }
  return { code: upper, model: `Aircraft Type ${upper}`, category: 'Commercial Aircraft' };
}
