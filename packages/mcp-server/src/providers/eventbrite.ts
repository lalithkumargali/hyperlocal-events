import axios from 'axios';

import { logger } from '../lib/logger';
import { RateLimiter } from '../lib/rate-limiter';

import { ProviderConnector, ProviderSearchParams, UnifiedEvent } from './types';

/**
 * Eventbrite API connector
 * Docs: https://www.eventbrite.com/platform/api
 */
export class EventbriteConnector implements ProviderConnector {
  name = 'eventbrite';
  private apiToken: string | undefined;
  private rateLimiter: RateLimiter;
  private baseUrl = 'https://www.eventbriteapi.com/v3';

  constructor() {
    this.apiToken = process.env.EVENTBRITE_TOKEN;
    // Eventbrite: 1000 requests per hour = ~16.7 per minute = ~0.28 per second
    this.rateLimiter = new RateLimiter(10, 0.28);
  }

  isConfigured(): boolean {
    return !!this.apiToken;
  }

  async search(params: ProviderSearchParams): Promise<UnifiedEvent[]> {
    if (!this.isConfigured()) {
      logger.warn('Eventbrite API token not configured, skipping');
      return [];
    }

    await this.rateLimiter.acquire();

    try {
      logger.info({ params }, 'Searching Eventbrite');

      const response = await axios.get(`${this.baseUrl}/events/search/`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
        params: {
          'location.latitude': params.lat,
          'location.longitude': params.lon,
          'location.within': `${Math.ceil(params.radiusMeters / 1000)}km`,
          'start_date.range_start': params.startTime?.toISOString(),
          'start_date.range_end': params.endTime?.toISOString(),
          expand: 'venue',
        },
        timeout: 10000,
      });

      const events = response.data.events || [];
      return events.map((event: any) => this.transformEvent(event));
    } catch (error) {
      logger.error({ error }, 'Eventbrite search failed');
      throw error;
    }
  }

  private transformEvent(event: any): UnifiedEvent {
    const venue = event.venue || {};

    return {
      provider: 'eventbrite',
      providerId: event.id,
      title: event.name?.text || 'Untitled Event',
      description: event.description?.text,
      category: this.extractCategories(event),
      startAt: event.start?.utc,
      endAt: event.end?.utc,
      venue: {
        name: venue.name,
        lat: parseFloat(venue.latitude) || 0,
        lon: parseFloat(venue.longitude) || 0,
        address: venue.address?.localized_address_display,
      },
      url: event.url,
      popularity: this.calculatePopularity(event),
    };
  }

  private extractCategories(event: any): string[] {
    const categories: string[] = [];

    if (event.category?.name) {
      categories.push(event.category.name.toLowerCase());
    }

    if (event.subcategory?.name) {
      categories.push(event.subcategory.name.toLowerCase());
    }

    if (event.format?.name) {
      categories.push(event.format.name.toLowerCase());
    }

    return categories.length > 0 ? categories : ['general'];
  }

  private calculatePopularity(event: any): number {
    // Simple popularity based on capacity and online status
    let score = 0.5;

    if (event.is_online_event) {
      score += 0.1;
    }

    if (event.capacity && event.capacity > 100) {
      score += 0.2;
    }

    if (event.is_series) {
      score += 0.1;
    }

    return Math.min(1, score);
  }
}
