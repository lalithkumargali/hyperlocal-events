import axios from 'axios';

import { logger } from '../lib/logger';
import { RateLimiter } from '../lib/rate-limiter';

import { ProviderConnector, ProviderSearchParams, UnifiedEvent } from './types';

/**
 * Google Places API connector (for POIs like parks, museums, etc.)
 * Docs: https://developers.google.com/maps/documentation/places/web-service/search-nearby
 */
export class GooglePlacesConnector implements ProviderConnector {
  name = 'google-places';
  private apiKey: string | undefined;
  private rateLimiter: RateLimiter;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  // POI types to search for
  private poiTypes = [
    'museum',
    'art_gallery',
    'park',
    'amusement_park',
    'aquarium',
    'zoo',
    'tourist_attraction',
    'stadium',
    'library',
  ];

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_KEY;
    // Google Places: Generous limits, but we'll be conservative
    this.rateLimiter = new RateLimiter(10, 1);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async search(params: ProviderSearchParams): Promise<UnifiedEvent[]> {
    if (!this.isConfigured()) {
      logger.warn('Google Places API key not configured, skipping');
      return [];
    }

    await this.rateLimiter.acquire();

    try {
      logger.info({ params }, 'Searching Google Places');

      const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, {
        params: {
          key: this.apiKey,
          location: `${params.lat},${params.lon}`,
          radius: params.radiusMeters,
          type: this.poiTypes.join('|'),
        },
        timeout: 10000,
      });

      const places = response.data.results || [];
      return places.map((place: any) => this.transformPlace(place));
    } catch (error) {
      logger.error({ error }, 'Google Places search failed');
      throw error;
    }
  }

  private transformPlace(place: any): UnifiedEvent {
    const location = place.geometry?.location || {};

    return {
      provider: 'google-places',
      providerId: place.place_id,
      title: place.name || 'Unnamed Place',
      description: place.editorial_summary?.overview,
      category: this.extractCategories(place),
      // Places don't have start/end times
      venue: {
        name: place.name,
        lat: location.lat || 0,
        lon: location.lng || 0,
        address: place.vicinity,
      },
      url: place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      popularity: this.calculatePopularity(place),
    };
  }

  private extractCategories(place: any): string[] {
    const categories: string[] = [];

    if (place.types) {
      place.types.forEach((type: string) => {
        // Convert snake_case to readable format
        const readable = type.replace(/_/g, ' ');
        categories.push(readable);
      });
    }

    return categories.length > 0 ? categories : ['point-of-interest'];
  }

  private calculatePopularity(place: any): number {
    let score = 0.5;

    // Higher score for places with ratings
    if (place.rating) {
      score += (place.rating / 5) * 0.3;
    }

    // Higher score for places with many reviews
    if (place.user_ratings_total) {
      if (place.user_ratings_total > 1000) score += 0.2;
      else if (place.user_ratings_total > 100) score += 0.1;
    }

    // Higher score for currently open places
    if (place.opening_hours?.open_now) {
      score += 0.1;
    }

    return Math.min(1, score);
  }
}
