import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a Registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// Custom metrics

// HTTP request metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// API-specific metrics
export const suggestRequestsTotal = new Counter({
  name: 'suggest_requests_total',
  help: 'Total number of suggest API requests',
  labelNames: ['endpoint'],
  registers: [register],
});

export const suggestRequestDuration = new Histogram({
  name: 'suggest_request_duration_seconds',
  help: 'Duration of suggest requests in seconds',
  labelNames: ['endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const suggestResultsCount = new Histogram({
  name: 'suggest_results_count',
  help: 'Number of suggestions returned',
  buckets: [0, 1, 5, 10, 20, 50, 100],
  registers: [register],
});

// MCP metrics
export const mcpCallsTotal = new Counter({
  name: 'mcp_calls_total',
  help: 'Total number of MCP tool calls',
  labelNames: ['tool', 'status'],
  registers: [register],
});

export const mcpCallDuration = new Histogram({
  name: 'mcp_call_duration_seconds',
  help: 'Duration of MCP tool calls in seconds',
  labelNames: ['tool'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

// Database metrics
export const dbQueriesTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation'],
  registers: [register],
});

// Cache metrics
export const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMissesTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

// Active connections gauge
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

// Partner API metrics
export const partnerRequestsTotal = new Counter({
  name: 'partner_requests_total',
  help: 'Total number of partner API requests',
  labelNames: ['partner_key', 'status'],
  registers: [register],
});

export const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint'],
  registers: [register],
});
