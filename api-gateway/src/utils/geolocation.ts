export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoLocationEntry extends Coordinates {
  city: string;
  country: string;
}

export const knownLocations: Record<string, GeoLocationEntry> = {
  ny: { latitude: 40.7128, longitude: -74.006, city: 'New York', country: 'United States' },
  newyork: { latitude: 40.7128, longitude: -74.006, city: 'New York', country: 'United States' },
  ca: { latitude: 36.7783, longitude: -119.4179, city: 'California', country: 'United States' },
  california: { latitude: 36.7783, longitude: -119.4179, city: 'California', country: 'United States' },
  tx: { latitude: 31.9686, longitude: -99.9018, city: 'Texas', country: 'United States' },
  texas: { latitude: 31.9686, longitude: -99.9018, city: 'Texas', country: 'United States' },
  fl: { latitude: 27.6648, longitude: -81.5158, city: 'Florida', country: 'United States' },
  florida: { latitude: 27.6648, longitude: -81.5158, city: 'Florida', country: 'United States' },
  wa: { latitude: 47.7511, longitude: -120.7401, city: 'Washington', country: 'United States' },
  washington: { latitude: 47.7511, longitude: -120.7401, city: 'Washington', country: 'United States' },
  london: { latitude: 51.5072, longitude: -0.1276, city: 'London', country: 'United Kingdom' },
  delhi: { latitude: 28.6139, longitude: 77.209, city: 'Delhi', country: 'India' },
  tokyo: { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
  dubai: { latitude: 25.2048, longitude: 55.2708, city: 'Dubai', country: 'United Arab Emirates' },
  sydney: { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', country: 'Australia' }
};

export const normalizeLocation = (location: string): string => location.trim().toLowerCase().replace(/\s+/g, '');

export const geocodeLocation = (location: string): GeoLocationEntry | null => {
  const key = normalizeLocation(location);
  return knownLocations[key] ?? null;
};

export const haversineKm = (from: Coordinates, to: Coordinates): number => {
  const toRadians = (value: number): number => (value * Math.PI) / 180;

  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};
