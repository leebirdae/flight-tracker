export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function kmToNm(km: number): number {
  return km * 0.539957;
}

export function kmToMiles(km: number): number {
  return km * 0.621371;
}

export function feetToMeters(ft: number): number {
  return ft * 0.3048;
}

export function metersToFeet(m: number): number {
  return m / 0.3048;
}

export function knotsToMph(kts: number): number {
  return kts * 1.15078;
}

export function knotsToKmh(kts: number): number {
  return kts * 1.852;
}

export function calculateBearingDeg(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): number {
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const dLon = ((toLon - fromLon) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export function bearingToCardinal(deg: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index];
}

export function calculateElevationAngleDeg(
  groundDistanceKm: number,
  altitudeFt: number
): number {
  if (groundDistanceKm <= 0.05) return 89.9;
  const altitudeKm = (altitudeFt * 0.3048) / 1000;
  const angleRad = Math.atan2(altitudeKm, groundDistanceKm);
  return Math.min(90, Math.max(0, (angleRad * 180) / Math.PI));
}

export function calculateCpaMinutes(
  userLat: number,
  userLon: number,
  acLat: number,
  acLon: number,
  headingDeg: number,
  speedKts: number
): number {
  if (speedKts <= 10) return 0;
  // Convert speed knots to km/min
  const speedKmPerMin = (speedKts * 1.852) / 60;
  const distKm = calculateDistanceKm(userLat, userLon, acLat, acLon);
  const bearingAcToUser = calculateBearingDeg(acLat, acLon, userLat, userLon);

  const angleDiffRad = ((headingDeg - bearingAcToUser) * Math.PI) / 180;
  const closingSpeed = speedKmPerMin * Math.cos(angleDiffRad);

  if (closingSpeed <= 0.01) {
    // Aircraft is flying away or parallel
    return 0;
  }
  const timeMin = (distKm * Math.cos(angleDiffRad)) / speedKmPerMin;
  return Math.max(0, Math.round(timeMin * 10) / 10);
}
