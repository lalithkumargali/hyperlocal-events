#!/usr/bin/env tsx
/**
 * CLI test script for MCP server tools
 * Usage: tsx test-cli.ts
 */

import dotenv from 'dotenv';

import { logger } from './src/lib/logger';
import { pipelineSuggest } from './src/tools/pipeline';

dotenv.config({ path: '../../.env' });

async function main() {
  logger.info('🧪 Testing MCP Server Tools');

  try {
    // Test pipeline.suggest
    logger.info('Testing pipeline.suggest...');

    const input = {
      lat: 37.7749,
      lon: -122.4194,
      minutesAvailable: 120,
      interests: ['music', 'technology'],
      radiusMeters: 5000,
      limit: 10,
    };

    logger.info({ input }, 'Calling pipeline.suggest');

    const result = await pipelineSuggest(input);

    logger.info(
      {
        suggestionsCount: result.suggestions.length,
        metadata: result.metadata,
      },
      'pipeline.suggest completed'
    );

    console.log('\n📊 Results:');
    console.log('='.repeat(80));
    console.log(`Total suggestions: ${result.suggestions.length}`);
    console.log(`Total found: ${result.metadata.totalFound}`);
    console.log(`Providers: ${result.metadata.providers.join(', ')}`);
    console.log(`Cached: ${result.metadata.cached}`);
    console.log(`Processing time: ${result.metadata.processingTimeMs}ms`);
    console.log('='.repeat(80));

    console.log('\n🎯 Top Suggestions:');
    result.suggestions.slice(0, 5).forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.title} (${suggestion.type})`);
      console.log(`   Provider: ${suggestion.provider}`);
      console.log(`   Score: ${suggestion.score.toFixed(3)}`);
      console.log(
        `   Breakdown: relevance=${suggestion.scoreBreakdown.relevance.toFixed(2)}, proximity=${suggestion.scoreBreakdown.proximity.toFixed(2)}, timeFit=${suggestion.scoreBreakdown.timeFit.toFixed(2)}, popularity=${suggestion.scoreBreakdown.popularity.toFixed(2)}`
      );
      console.log(`   Distance: ${suggestion.distanceMeters}m`);
      console.log(`   Duration: ${suggestion.durationMinutes} minutes`);
      if (suggestion.venue) {
        console.log(`   Venue: ${suggestion.venue.name}`);
      }
    });

    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Test failed');
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
