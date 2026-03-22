import axios from 'axios';
import { env } from '../config/env';
import { redisClient } from '../config/redis';
import { geocodeLocation, GeoLocationEntry } from '../utils/geolocation';

export interface ResolvedGeo {
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
}

interface IpWhoIsResponse {
  success?: boolean;
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
}

const isPrivateIp = (ip: string): boolean => {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;

  if (ip.startsWith('172.')) {
    const second = Number(ip.split('.')[1]);
    if (Number.isFinite(second) && second >= 16 && second <= 31) {
      return true;
    }
  }

  return false;
};

const asNumber = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const normalizeGeo = (value: Partial<ResolvedGeo>): ResolvedGeo => {
  const latitude = asNumber(value.latitude);
  const longitude = asNumber(value.longitude);
  const city = typeof value.city === 'string' && value.city.trim().length > 0 ? value.city.trim() : undefined;
  const country =
    typeof value.country === 'string' && value.country.trim().length > 0 ? value.country.trim() : undefined;

  return { latitude, longitude, city, country };
};

export class GeoService {
  private readonly cacheTtl = env.GEO_CACHE_TTL_SECONDS;

  private async getCache(key: string): Promise<ResolvedGeo | null> {
    const raw = await redisClient.get(key);
    if (!raw) return null;

    try {
      return normalizeGeo(JSON.parse(raw) as Partial<ResolvedGeo>);
    } catch {
      return null;
    }
  }

  private async setCache(key: string, value: ResolvedGeo): Promise<void> {
    await redisClient.set(key, JSON.stringify(value), 'EX', this.cacheTtl);
  }

  private locationFallback(location: string): ResolvedGeo {
    const mapped: GeoLocationEntry | null = geocodeLocation(location);
    if (!mapped) return {};

    return {
      latitude: mapped.latitude,
      longitude: mapped.longitude,
      city: mapped.city,
      country: mapped.country
    };
  }

  private async resolveByIp(ipAddress: string): Promise<ResolvedGeo | null> {
    if (isPrivateIp(ipAddress)) {
      return null;
    }

    const cacheKey = `geo:ip:${ipAddress}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get<IpWhoIsResponse>(`${env.GEOIP_API_URL}/${ipAddress}`, {
        timeout: 1500
      });

      if (response.data?.success === false) {
        return null;
      }

      const resolved = normalizeGeo({
        latitude: response.data?.latitude,
        longitude: response.data?.longitude,
        country: response.data?.country,
        city: response.data?.city
      });

      if (typeof resolved.latitude === 'number' && typeof resolved.longitude === 'number') {
        await this.setCache(cacheKey, resolved);
        return resolved;
      }

      return null;
    } catch {
      return null;
    }
  }

  async resolveCoordinates(ipAddress: string, location: string): Promise<ResolvedGeo> {
    const ipResolved = await this.resolveByIp(ipAddress);
    if (ipResolved) {
      return ipResolved;
    }

    const locationKey = `geo:location:${location.trim().toLowerCase()}`;
    const locationCached = await this.getCache(locationKey);
    if (locationCached) {
      return locationCached;
    }

    const fallback = this.locationFallback(location);
    if (typeof fallback.latitude === 'number' && typeof fallback.longitude === 'number') {
      await this.setCache(locationKey, fallback);
    }

    return fallback;
  }
}
