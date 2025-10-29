import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

import { GooglePlacesConnector } from './google-places';
import googlePlacesFixture from './__fixtures__/google-places.json';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('GooglePlacesConnector', () => {
  let connector: GooglePlacesConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new GooglePlacesConnector();
  });

  it('should return empty array if not configured', async () => {
    const result = await connector.search({
      lat: 37.7749,
      lon: -122.4194,
      radiusMeters: 5000,
    });

    expect(result).toEqual([]);
  });

  it('should transform Google Places to unified format', async () => {
    process.env.GOOGLE_PLACES_KEY = 'test-key';
    connector = new GooglePlacesConnector();

    mockedAxios.get.mockResolvedValueOnce({
      data: googlePlacesFixture,
    });

    const result = await connector.search({
      lat: 37.7749,
      lon: -122.4194,
      radiusMeters: 5000,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      provider: 'google-places',
      providerId: 'ChIJabcdef123456',
      title: 'Modern Art Museum',
      description: 'Contemporary art museum featuring rotating exhibitions and installations',
      category: expect.arrayContaining(['museum', 'art gallery']),
      venue: {
        name: 'Modern Art Museum',
        lat: 37.7858,
        lon: -122.4006,
        address: '151 Third St, San Francisco',
      },
    });

    delete process.env.GOOGLE_PLACES_KEY;
  });

  it('should handle API errors gracefully', async () => {
    process.env.GOOGLE_PLACES_KEY = 'test-key';
    connector = new GooglePlacesConnector();

    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    await expect(
      connector.search({
        lat: 37.7749,
        lon: -122.4194,
        radiusMeters: 5000,
      })
    ).rejects.toThrow('API Error');

    delete process.env.GOOGLE_PLACES_KEY;
  });
});
