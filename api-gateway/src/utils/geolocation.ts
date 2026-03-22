export interface Coordinates {
  latitude: number;
  longitude: number;
}

const knownLocations: Record<string, Coordinates> = {
  ny: { latitude: 40.7128, longitude: -74.006 },
  newyork: { latitude: 40.7128, longitude: -74.006 },
  ca: { latitude: 36.7783, longitude: -119.4179 },
  california: { latitude: 36.7783, longitude: -119.4179 },
  tx: { latitude: 31.9686, longitude: -99.9018 },
  texas: { latitude: 31.9686, longitude: -99.9018 },
  fl: { latitude: 27.6648, longitude: -81.5158 },
  florida: { latitude: 27.6648, longitude: -81.5158 },
  wa: { latitude: 47.7511, longitude: -120.7401 },
  washington: { latitude: 47.7511, longitude: -120.7401 },
  london: { latitude: 51.5072, longitude: -0.1276 },
  delhi: { latitude: 28.6139, longitude: 77.209 },
  tokyo: { latitude: 35.6762, longitude: 139.6503 },
  dubai: { latitude: 25.2048, longitude: 55.2708 },
  sydney: { latitude: -33.8688, longitude: 151.2093 }
};

const normalizeLocation = (location: string): string => location.trim().toLowerCase().replace(/\s+/g, '');

const hashedCoordinates = (location: string): Coordinates => {
  let hash = 0;
  for (let i = 0; i < location.length; i += 1) {
    hash = (hash << 5) - hash + location.charCodeAt(i);
    hash |= 0;
  }

  const latitude = ((((hash % 120) + 120) % 120) - 60) + 0.1234;
  const longitude = ((((Math.floor(hash / 7) % 360) + 360) % 360) - 180) + 0.5678;

  return {
    latitude: Math.max(-85, Math.min(85, Number(latitude.toFixed(4)))),
    longitude: Math.max(-180, Math.min(180, Number(longitude.toFixed(4))))
  };
};

export const geocodeLocation = (location: string): Coordinates => {
  const key = normalizeLocation(location);
  return knownLocations[key] ?? hashedCoordinates(location);
};
