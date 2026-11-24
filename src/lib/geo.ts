// Cálculos de distancia y rumbo entre dos puntos GPS.

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

// Distancia en línea recta sobre la Tierra (fórmula de haversine).
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Rumbo desde "a" hacia "b": 0° = norte, 90° = este.
export function bearingDeg(a: LatLng, b: LatLng): number {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return normalizeDeg(toDeg(Math.atan2(y, x)));
}

export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
export function cardinal(deg: number): string {
  return CARDINALS[Math.round(normalizeDeg(deg) / 45) % 8];
}

export const kmToNauticalMiles = (km: number) => km / 1.852;
export const msToKnots = (ms: number) => ms * 1.943844;

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatCoords(p: LatLng): string {
  const lat = `${Math.abs(p.lat).toFixed(4)}° ${p.lat < 0 ? 'S' : 'N'}`;
  const lng = `${Math.abs(p.lng).toFixed(4)}° ${p.lng < 0 ? 'O' : 'E'}`;
  return `${lat}, ${lng}`;
}
