import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for partner API
 * 60 requests per minute per API key
 */
export const partnerRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per window
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Maximum 60 requests per minute.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Use API key as identifier
  keyGenerator: (req) => {
    return (req.headers['x-partner-key'] as string) || req.ip || 'unknown';
  },
});
