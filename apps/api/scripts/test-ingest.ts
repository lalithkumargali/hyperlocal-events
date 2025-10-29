#!/usr/bin/env tsx
/**
 * Test script to manually trigger ingestion for a city
 */

import dotenv from 'dotenv';

import { logger } from '../src/lib/logger';
import { prisma } from '../src/lib/prisma';
import { ingestRegion } from '../src/services/ingestion';

dotenv.config({ path: '../../../.env' });

async function main() {
  logger.info('🧪 Testing region ingestion');

  // Test with San Francisco
  const result = await ingestRegion({
    lat: 37.7749,
    lon: -122.4194,
    radiusMeters: 10000, // 10km
  });

  logger.info({ result }, 'Ingestion completed');

  // Query the database to verify
  const eventCount = await prisma.event.count();
  const placeCount = await prisma.place.count();

  logger.info({ eventCount, placeCount }, 'Database counts');

  // Show some sample events
  const sampleEvents = await prisma.event.findMany({
    take: 5,
    include: {
      venue: true,
    },
    orderBy: {
      popularityScore: 'desc',
    },
  });

  console.log('\n📊 Sample Events:');
  console.log('='.repeat(80));
  sampleEvents.forEach((event, index) => {
    console.log(`\n${index + 1}. ${event.title}`);
    console.log(`   Provider: ${event.provider}`);
    console.log(`   Categories: ${event.category.join(', ')}`);
    console.log(`   Start: ${event.startAt.toISOString()}`);
    console.log(`   Popularity: ${event.popularityScore}`);
    if (event.venue) {
      console.log(`   Venue: ${event.venue.name}`);
    }
  });

  console.log('\n✅ Test completed successfully!');

  await prisma.$disconnect();
}

main().catch((error) => {
  logger.error({ error }, 'Test failed');
  process.exit(1);
});
