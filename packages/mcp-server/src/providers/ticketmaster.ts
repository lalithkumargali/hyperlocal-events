import axios from 'axios';

import { logger } from '../lib/logger';
import { RateLimiter } from '../lib/rate-limiter';

import { ProviderConnector, ProviderSearchParams, UnifiedEvent } from './types';

/**
 * Ticketmaster API connector
 * Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */
export class TicketmasterConnector implements ProviderConnector {
  name = 'ticketmaster';
  private apiKey: string | undefined;
  private rateLimiter: RateLimiter;
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2';

  constructor() {
    this.apiKey = process.env.TICKETMASTER_KEY;
    // Ticketmaster: 5000 requests per day = ~3.5 per minute = ~0.06 per second
    this.rateLimiter = new RateLimiter(5, 0.06);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async search(params: ProviderSearchParams): Promise<UnifiedEvent[]> {
    if (!this.isConfigured()) {
      logger.warn('Ticketmaster API key not configured, skipping');
      return [];
    }

    await this.rateLimiter.acquire();

    try {
      logger.info({ params }, 'Searching Ticketmaster');

      const response = await axios.get(`${this.baseUrl}/events.json`, {
        params: {
          apikey: this.apiKey,
          latlong: `${params.lat},${params.lon}`,
          radius: Math.ceil(params.radiusMeters / 1609.34), // Convert to miles
          unit: 'miles',
          startDateTime: params.startTime?.toISOString(),
          endDateTime: params.endTime?.toISOString(),
          size: 50,
        },
        timeout: 10000,
      });

      const events = response.data._embedded?.events || [];
      return events.map((event: any) => this.transformEvent(event));
    } catch (error) {
      logger.error({ error }, 'Ticketmaster search failed');
      throw error;
    }
  }

  private transformEvent(event: any): UnifiedEvent {
    const venue = event._embedded?.venues?.[0] || {};
    const location = venue.location || {};

    return {
      provider: 'ticketmaster',
      providerId: event.id,
      title: event.name || 'Untitled Event',
      description: event.info || event.pleaseNote,
      category: this.extractCategories(event),
      startAt: event.dates?.start?.dateTime,
      endAt: event.dates?.end?.dateTime,
      venue: {
        name: venue.name,
        lat: parseFloat(location.latitude) || 0,
        lon: parseFloat(location.longitude) || 0,
        address: venue.address?.line1
          ? `${venue.address.line1}, ${venue.city?.name || ''}, ${venue.state?.stateCode || ''}`
          : undefined,
      },
      url: event.url,
      popularity: this.calculatePopularity(event),
    };
  }

  private extractCategories(event: any): string[] {
    const categories: string[] = [];

    if (event.classifications) {
      event.classifications.forEach((classification: any) => {
        if (classification.segment?.name) {
          categories.push(classification.segment.name.toLowerCase());
        }
        if (classification.genre?.name) {
          categories.push(classification.genre.name.toLowerCase());
        }
        if (classification.subGenre?.name) {
          categories.push(classification.subGenre.name.toLowerCase());
        }
      });
    }

    return categories.length > 0 ? categories : ['entertainment'];
  }

  private calculatePopularity(event: any): number {
    let score = 0.5;

    // Higher score for events with images
    if (event.images && event.images.length > 0) {
      score += 0.1;
    }

    // Higher score for events with price ranges
    if (event.priceRanges && event.priceRanges.length > 0) {
      score += 0.1;
    }

    // Higher score for promoted events
    if (event.promoter) {
      score += 0.2;
    }

    return Math.min(1, score);
  }
}
