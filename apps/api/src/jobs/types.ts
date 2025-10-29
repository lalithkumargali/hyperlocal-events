/**
 * Job types for BullMQ workers
 */

export interface IngestRegionJob {
  lat: number;
  lon: number;
  radiusMeters: number;
  city?: string;
}

export interface IngestResult {
  eventsIngested: number;
  placesIngested: number;
  providers: string[];
  duration: number;
}
