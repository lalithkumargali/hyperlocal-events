import axios from 'axios';

import { logger } from '../lib/logger';

import {
  GeoResolveInput,
  GeoResolveInputSchema,
  GeoResolveOutput,
  GeoResolveOutputSchema,
} from './schemas';

/**
 * geo.resolve - Reverse geocode lat/lon using Nominatim and compute bounding box
 */
export async function geoResolve(input: unknown): Promise<GeoResolveOutput> {
  const validated = GeoResolveInputSchema.parse(input);
  const { lat, lon, radiusMeters } = validated;

  logger.info({ lat, lon, radiusMeters }, 'geo.resolve called');

  try {
    // Reverse geocode using Nominatim (OpenStreetMap)
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon,
        format: 'json',
      },
      headers: {
        'User-Agent': 'HyperlocalEventsApp/1.0',
      },
      timeout: 5000,
    });

    const data = response.data;
    const address = data.address || {};

    // Calculate bounding box based on radius
    // Approximate: 1 degree latitude ≈ 111km
    // 1 degree longitude varies by latitude
    const latDelta = (radiusMeters / 111000) * 1.5; // Add buffer
    const lonDelta = (radiusMeters / (111000 * Math.cos((lat * Math.PI) / 180))) * 1.5;

    const result: GeoResolveOutput = {
      address: data.display_name,
      city: address.city || address.town || address.village,
      state: address.state,
      country: address.country,
      boundingBox: {
        minLat: lat - latDelta,
        maxLat: lat + latDelta,
        minLon: lon - lonDelta,
        maxLon: lon + lonDelta,
      },
      center: {
        lat,
        lon,
      },
    };

    logger.info({ result }, 'geo.resolve completed');
    return GeoResolveOutputSchema.parse(result);
  } catch (error) {
    logger.error({ error, lat, lon }, 'geo.resolve failed');

    // Return fallback with bounding box only
    const latDelta = (radiusMeters / 111000) * 1.5;
    const lonDelta = (radiusMeters / (111000 * Math.cos((lat * Math.PI) / 180))) * 1.5;

    return {
      boundingBox: {
        minLat: lat - latDelta,
        maxLat: lat + latDelta,
        minLon: lon - lonDelta,
        maxLon: lon + lonDelta,
      },
      center: {
        lat,
        lon,
      },
    };
  }
}
