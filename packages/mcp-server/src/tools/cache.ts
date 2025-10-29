import { logger } from '../lib/logger';
import { redis } from '../lib/redis';

import {
  CacheGetInput,
  CacheGetInputSchema,
  CacheGetOutput,
  CacheSetInput,
  CacheSetInputSchema,
  CacheSetOutput,
} from './schemas';

/**
 * cache.get - Get value from Redis cache
 */
export async function cacheGet(input: unknown): Promise<CacheGetOutput> {
  const validated = CacheGetInputSchema.parse(input);
  const { key } = validated;

  logger.info({ key }, 'cache.get called');

  try {
    const value = await redis.get(key);
    const ttl = value ? await redis.ttl(key) : undefined;

    if (value) {
      logger.info({ key, ttl }, 'cache.get hit');
      return {
        found: true,
        value: JSON.parse(value),
        ttl: ttl && ttl > 0 ? ttl : undefined,
      };
    }

    logger.info({ key }, 'cache.get miss');
    return {
      found: false,
    };
  } catch (error) {
    logger.error({ error, key }, 'cache.get failed');
    return {
      found: false,
    };
  }
}

/**
 * cache.set - Set value in Redis cache with TTL
 */
export async function cacheSet(input: unknown): Promise<CacheSetOutput> {
  const validated = CacheSetInputSchema.parse(input);
  const { key, value, ttlSeconds } = validated;

  logger.info({ key, ttlSeconds }, 'cache.set called');

  try {
    const serialized = JSON.stringify(value);
    await redis.setex(key, ttlSeconds, serialized);

    logger.info({ key, ttlSeconds }, 'cache.set completed');
    return {
      success: true,
    };
  } catch (error) {
    logger.error({ error, key }, 'cache.set failed');
    return {
      success: false,
    };
  }
}
