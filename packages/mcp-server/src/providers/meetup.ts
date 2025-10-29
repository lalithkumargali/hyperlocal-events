import axios from 'axios';

import { logger } from '../lib/logger';
import { RateLimiter } from '../lib/rate-limiter';

import { ProviderConnector, ProviderSearchParams, UnifiedEvent } from './types';

/**
 * Meetup API connector
 * Docs: https://www.meetup.com/api/guide/
 */
export class MeetupConnector implements ProviderConnector {
  name = 'meetup';
  private apiKey: string | undefined;
  private rateLimiter: RateLimiter;
  private baseUrl = 'https://api.meetup.com';

  constructor() {
    this.apiKey = process.env.MEETUP_KEY;
    // Meetup: 200 requests per hour = ~3.3 per minute = ~0.055 per second
    this.rateLimiter = new RateLimiter(10, 0.055);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async search(params: ProviderSearchParams): Promise<UnifiedEvent[]> {
    if (!this.isConfigured()) {
      logger.warn('Meetup API key not configured, skipping');
      return [];
    }

    await this.rateLimiter.acquire();

    try {
      logger.info({ params }, 'Searching Meetup');

      const response = await axios.get(`${this.baseUrl}/find/events`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        params: {
          lat: params.lat,
          lon: params.lon,
          radius: Math.ceil(params.radiusMeters / 1609.34), // Convert to miles
          start_date_range: params.startTime?.toISOString(),
          end_date_range: params.endTime?.toISOString(),
          page: 50,
        },
        timeout: 10000,
      });

      const events = response.data.events || [];
      return events.map((event: any) => this.transformEvent(event));
    } catch (error) {
      logger.error({ error }, 'Meetup search failed');
      throw error;
    }
  }

  private transformEvent(event: any): UnifiedEvent {
    const venue = event.venue || {};

    return {
      provider: 'meetup',
      providerId: event.id,
      title: event.name || 'Untitled Meetup',
      description: event.description,
      category: this.extractCategories(event),
      startAt: event.time ? new Date(event.time).toISOString() : undefined,
      endAt: event.duration ? new Date(event.time + event.duration).toISOString() : undefined,
      venue: {
        name: venue.name || event.group?.name,
        lat: venue.lat || event.group?.lat || 0,
        lon: venue.lon || event.group?.lon || 0,
        address: venue.address_1
          ? `${venue.address_1}, ${venue.city || ''}, ${venue.state || ''}`
          : undefined,
      },
      url: event.link,
      popularity: this.calculatePopularity(event),
    };
  }

  private extractCategories(event: any): string[] {
    const categories: string[] = [];

    if (event.group?.category?.shortname) {
      categories.push(event.group.category.shortname.toLowerCase());
    }

    if (event.group?.topics) {
      event.group.topics.slice(0, 3).forEach((topic: any) => {
        if (topic.name) {
          categories.push(topic.name.toLowerCase());
        }
      });
    }

    return categories.length > 0 ? categories : ['social'];
  }

  private calculatePopularity(event: any): number {
    let score = 0.5;

    // Higher score for events with more RSVPs
    if (event.yes_rsvp_count) {
      if (event.yes_rsvp_count > 50) score += 0.2;
      else if (event.yes_rsvp_count > 20) score += 0.1;
    }

    // Higher score for events with waitlist
    if (event.waitlist_count > 0) {
      score += 0.1;
    }

    // Higher score for featured events
    if (event.featured) {
      score += 0.1;
    }

    return Math.min(1, score);
  }
}
