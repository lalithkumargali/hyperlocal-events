import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

import { MeetupConnector } from './meetup';
import meetupFixture from './__fixtures__/meetup.json';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('MeetupConnector', () => {
  let connector: MeetupConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new MeetupConnector();
  });

  it('should return empty array if not configured', async () => {
    const result = await connector.search({
      lat: 37.7749,
      lon: -122.4194,
      radiusMeters: 5000,
    });

    expect(result).toEqual([]);
  });

  it('should transform Meetup events to unified format', async () => {
    process.env.MEETUP_KEY = 'test-key';
    connector = new MeetupConnector();

    mockedAxios.get.mockResolvedValueOnce({
      data: meetupFixture,
    });

    const result = await connector.search({
      lat: 37.7749,
      lon: -122.4194,
      radiusMeters: 5000,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      provider: 'meetup',
      providerId: 'abc123xyz',
      title: 'Weekend Hiking Adventure',
      description: 'Join us for a scenic hike through local trails',
      category: expect.arrayContaining(['outdoors', 'hiking']),
      venue: {
        name: 'Trailhead Parking',
        lat: 37.7694,
        lon: -122.4862,
        address: 'Golden Gate Park, San Francisco, CA',
      },
      url: 'https://www.meetup.com/sf-hiking/events/abc123xyz',
    });

    delete process.env.MEETUP_KEY;
  });

  it('should handle API errors gracefully', async () => {
    process.env.MEETUP_KEY = 'test-key';
    connector = new MeetupConnector();

    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    await expect(
      connector.search({
        lat: 37.7749,
        lon: -122.4194,
        radiusMeters: 5000,
      })
    ).rejects.toThrow('API Error');

    delete process.env.MEETUP_KEY;
  });
});
