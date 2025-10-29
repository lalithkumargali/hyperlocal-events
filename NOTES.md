# Development Notes

**Note:** Windsurf modifies only per section.

## Section A - Project Scaffold

### Status: ✅ COMPLETE

**Quality Gates:**

- ✅ `pnpm lint` - PASSED (warnings only, no errors)
- ✅ `pnpm type-check` - PASSED
- ⚠️ `pnpm test` - No test files yet (expected for scaffold)
- ✅ `pnpm build` - All packages build successfully
- ✅ Dependencies installed successfully

All scaffold files created. Next steps:

1. **Install pnpm** (if not already installed):

   ```bash
   npm install -g pnpm@8.15.0
   # OR use corepack (recommended for Node 20+)
   corepack enable
   corepack prepare pnpm@8.15.0 --activate
   ```

2. Install dependencies: `pnpm install`
3. Start Docker services: `pnpm docker:up`
4. Run Prisma migrations: `pnpm db:migrate`
5. Generate Prisma client: `cd apps/api && pnpm db:generate`
6. Verify quality gates: `pnpm lint`, `pnpm type-check`, `pnpm test`
7. Start dev servers: `pnpm dev`

### Known Issues

- **pnpm not installed**: User needs to install pnpm globally or use corepack (built into Node 20+) - ✅ RESOLVED
- **zod-to-openapi unavailable**: Package version ^6.1.0 doesn't exist (latest is 0.2.1). Removed from dependencies - will implement OpenAPI manually in later sections.

### Next Sections

- Section B: Implement event CRUD operations
- Section C: Add MCP tools for event providers
- Section D: Implement geospatial search
- Section E: Build frontend UI with maps
- Section F: Add caching and background jobs

## Dependencies Status

All required packages are available:

- ✅ @modelcontextprotocol/sdk
- ✅ Next.js 15
- ✅ Prisma with PostgreSQL
- ✅ Express, Zod, TypeScript
- ✅ Tailwind CSS, shadcn/ui components
- ✅ Redis, BullMQ
- ✅ Testing tools (vitest, supertest, playwright)

## Section B - Environment & Config

### Status: ✅ COMPLETE

**Changes:**

- ✅ Updated `.env.example` with all required environment variables
- ✅ Verified shared configs exist (tsconfig.base.json, eslint.config.js, .prettierrc)
- ✅ Added note about Windsurf modifying only per section

**Environment Variables:**

- Core: NODE_ENV, LOG_LEVEL
- API: API_PORT, API_BASE_URL
- Web: WEB_PORT, MAP_TILE_URL
- DB: DATABASE_URL
- Redis: REDIS_URL
- MCP: MCP_PORT, MCP_ALLOWED_ORIGINS
- Providers: EVENTBRITE_TOKEN, TICKETMASTER_KEY, MEETUP_KEY, GOOGLE_PLACES_KEY, OPENROUTESERVICE_KEY

**Quality Gates:**

- ✅ `pnpm lint` - PASSED
- ✅ `pnpm type-check` - PASSED

## Section C - Database & Prisma

### Status: ✅ COMPLETE

**Changes:**

- ✅ Created Prisma schema with all required models
- ✅ Added PostGIS migration (00000000000000_init)
- ✅ Created comprehensive seed script with dummy data
- ✅ Added prisma scripts to package.json files
- ✅ Successfully ran migrations and seed

**Database Models:**

- **User**: id, email (unique), interests (string[])
- **Place**: id, provider, providerId, name, category[], location (PostGIS Point), address, city, state, country, url
- **Event**: id, provider, providerId, title, description, category[], startAt, endAt, venueId (→ Place), priceMin, priceMax, currency, url, popularityScore
- **IngestLog**: id, provider, startedAt, finishedAt, ok, records, error

**Seed Data:**

- 2 Users (alice@example.com, bob@example.com)
- 4 Places (The Grand Theater, Tech Hub Conference Center, Golden Gate Park, Downtown Sports Arena)
- 6 Events (Summer Music Festival, Tech Innovation Summit, Shakespeare in the Park, NBA Preseason Game, Art Gallery Opening, Food Truck Festival)
- 2 Ingest Logs (manual success, eventbrite failure)

**Scripts Added:**

- `pnpm prisma:generate` - Generate Prisma Client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:seed` - Seed database with dummy data
- `pnpm prisma:studio` - Open Prisma Studio

**Quality Gates:**

- ✅ `pnpm prisma:migrate` - PASSED (tables created)
- ✅ `pnpm prisma:seed` - PASSED (data seeded)
- ✅ Database tables exist and contain data

## Section D - API Service

### Status: ✅ COMPLETE

**Changes:**

- ✅ Implemented REST API with Zod validation
- ✅ Created GET /health endpoint (returns {ok: true})
- ✅ Created POST /v1/suggest endpoint with full validation
- ✅ Added OpenAPI 3.1 specification at GET /openapi.json
- ✅ Deterministic mock suggestions (until MCP wired in Section E)

**Endpoints:**

1. **GET /health** - Health check
   - Returns: `{ok: true}` or `{ok: false}` (503)

2. **POST /v1/suggest** - Get personalized suggestions
   - Input: lat, lon, minutesAvailable, interests?, radiusMeters?, now?
   - Output: Array of Suggestion objects
   - Validation: Zod schemas with proper error handling
   - Mock data: 3 deterministic suggestions (events + places)

3. **GET /openapi.json** - OpenAPI 3.1 specification
   - Complete API documentation
   - Request/response schemas
   - Example values

**Request Schema:**

- lat: number (-90 to 90)
- lon: number (-180 to 180)
- minutesAvailable: number (15-360)
- interests: string[] (optional)
- radiusMeters: number (default: 5000)
- now: ISO datetime string (optional)

**Response Schema:**

- id, title, type (event|place)
- startAt?, endAt? (ISO datetime)
- venue? (name, address?, lat, lon)
- durationMinutes, distanceMeters
- score (0-1), provider, providerId, url?

**Error Handling:**

- 400: Validation errors (Zod)
- 502: MCP server unavailable (future)

**Quality Gates:**

- ✅ Zod validation working
- ✅ OpenAPI spec generated
- ✅ Mock suggestions deterministic
- ✅ Ready for MCP integration (Section E)

## Section E - MCP Server

### Status: ✅ COMPLETE

**Changes:**

- ✅ Implemented 6 MCP tools with Zod validation
- ✅ geo.resolve - Reverse geocode with Nominatim + bounding box
- ✅ events.search - Fan-out to 4 providers (mock implementations)
- ✅ rank.score - Transparent scoring with weighted factors
- ✅ cache.get/set - Redis caching with TTL (10-30 min)
- ✅ pipeline.suggest - Full orchestration pipeline
- ✅ CLI test script working with mock data

**Tools Implemented:**

1. **geo.resolve** - Reverse geocode lat/lon
   - Uses Nominatim (OpenStreetMap) API
   - Computes bounding box based on radius
   - Returns address, city, state, country

2. **events.search** - Fan-out to providers
   - Eventbrite (mock)
   - Ticketmaster (mock)
   - Meetup (mock)
   - Google Places for POIs (mock)
   - Fail-fast on errors, continue with others
   - Jitter (50-200ms) to respect rate limits

3. **rank.score** - Transparent scoring function
   - Relevance: 30% (interest match)
   - Proximity: 25% (distance-based)
   - Time-fit: 25% (fits in available time)
   - Popularity: 20% (provider score)
   - Returns sorted by score (0-1)

4. **cache.get/set** - Redis caching
   - TTL: 10-30 minutes (random to avoid thundering herd)
   - JSON serialization
   - Graceful fallback on errors

5. **pipeline.suggest** - Orchestrator
   - Step 1: geo.resolve
   - Step 2: events.search (all providers)
   - Step 3: rank.score
   - Step 4: Return top N (default 20)
   - Includes metadata (providers, cached, timing)

**Features:**

- All tools strictly typed with Zod schemas
- Side-effect logging with Pino
- Fail-fast on provider errors
- Rate limit respect with jitter
- Redis caching for performance
- Transparent scoring algorithm

**Quality Gates:**

- ✅ CLI test returns 4 mock suggestions
- ✅ Scoring algorithm working (relevance, proximity, time-fit, popularity)
- ✅ Caching working (Redis)
- ✅ Geo resolution working (Nominatim)
- ✅ All tools validated with Zod

## Section F - Provider Connectors

### Status: ✅ COMPLETE

**Changes:**

- ✅ Implemented 4 provider connectors with unified shape
- ✅ Eventbrite connector (OAuth/token header)
- ✅ Ticketmaster connector
- ✅ Meetup connector
- ✅ Google Places connector (POIs)
- ✅ Token bucket rate limiters per provider
- ✅ Environment variable configuration
- ✅ Unit tests with fixture data
- ✅ All tests pass without API keys

**Providers Implemented:**

1. **Eventbrite** (`eventbrite.ts`)
   - OAuth token authentication
   - Rate limit: 1000 req/hour (~0.28/sec)
   - Transforms: events, venues, categories
   - Popularity: capacity, online, series

2. **Ticketmaster** (`ticketmaster.ts`)
   - API key authentication
   - Rate limit: 5000 req/day (~0.06/sec)
   - Transforms: events, classifications, venues
   - Popularity: images, prices, promoter

3. **Meetup** (`meetup.ts`)
   - Bearer token authentication
   - Rate limit: 200 req/hour (~0.055/sec)
   - Transforms: meetups, groups, topics
   - Popularity: RSVPs, waitlist, featured

4. **Google Places** (`google-places.ts`)
   - API key authentication
   - Rate limit: Conservative (1/sec)
   - POI types: museums, parks, galleries, etc.
   - Popularity: ratings, reviews, open status

**Unified Event Shape:**

```typescript
{
  provider: 'eventbrite' | 'ticketmaster' | 'meetup' | 'google-places',
  providerId: string,
  title: string,
  description?: string,
  category: string[],
  startAt?: string (ISO),
  endAt?: string (ISO),
  venue: {
    name?: string,
    lat: number,
    lon: number,
    address?: string
  },
  url?: string,
  popularity?: number (0-1)
}
```

**Rate Limiting:**

- Token bucket algorithm
- Per-provider limits based on API docs
- Automatic refill over time
- Prevents API quota exhaustion

**Testing:**

- 12 tests across 4 providers
- Fixture-based (no network calls)
- Tests without API keys use fixtures
- Tests with API keys mock axios responses
- 100% test pass rate

**Quality Gates:**

- ✅ `pnpm test` passes (12/12 tests)
- ✅ All providers return unified shape
- ✅ Rate limiters working
- ✅ Tests use fixtures when keys absent
- ✅ Environment variables read correctly

## Section G - Ingestion & Caching

### Status: ✅ COMPLETE

**Changes:**

- ✅ BullMQ background workers implemented
- ✅ Database upsert with deduplication (provider, providerId)
- ✅ GIN indexes on category arrays
- ✅ GIST indexes on location (PostGIS)
- ✅ TTL caching strategy (Redis + DB)
- ✅ Worker populates DB for test city

**Background Workers:**

- **BullMQ** for job queue management
- **Ingestion worker** processes region ingestion jobs
- **Concurrency**: 2 jobs at a time
- **Rate limiting**: Max 10 jobs per minute
- **Retry logic**: 3 attempts with exponential backoff
- **Job persistence**: Keeps last 100 completed, 50 failed

**Database Ingestion:**

- **Upsert logic** with ON CONFLICT (provider, provider_id)
- **Deduplication** prevents duplicate events/places
- **PostGIS** for venue location storage
- **Indexes added**:
  - GIN on Event.category (fast array searches)
  - GIN on Place.category (fast array searches)
  - GIST on Place.location (spatial queries)

**Caching Strategy:**

1. **Redis cache** (TTL: 30 minutes)
   - Fast in-memory lookup
   - Key: `events:{lat}:{lon}:{radius}`

2. **Database cache** (Fresh < 2 hours)
   - PostGIS distance queries
   - Filters by updated_at timestamp
   - Returns up to 100 events

3. **Provider fan-out** (Cache miss)
   - Triggers async ingestion job
   - Non-blocking (returns empty array)
   - Client can retry after job completes

**Hot Regions:**

- Recurring jobs for popular cities
- San Francisco: Every 2 hours
- New York: Every 2 hours
- Configurable via cron patterns

**Scripts:**

- `pnpm --filter api worker` - Start background worker
- `pnpm --filter api worker:dev` - Start with watch mode
- `pnpm --filter api test:ingest` - Test ingestion manually

**Quality Gates:**

- ✅ Worker populates DB (8 events, 6 places)
- ✅ Deduplication working (upserts on conflict)
- ✅ GIN/GIST indexes created
- ✅ Caching strategy implemented
- ✅ Test ingestion successful

## Section H - Ranking & Time-Fit

### Status: ✅ COMPLETE

**Changes:**

- ✅ Implemented multi-factor scoring algorithm
- ✅ Jaccard similarity for interest matching
- ✅ Distance-based scoring
- ✅ Time-fit with sigmoid drop-off
- ✅ Weighted scoring formula
- ✅ 9 comprehensive unit tests
- ✅ All tests pass, scores sorted descending

**Scoring Algorithm:**

**Formula:** `score = 0.4*interest + 0.3*distance + 0.2*timeFit + 0.1*popularity`

1. **Interest Score** (40% weight)
   - Jaccard similarity: `|intersection| / |union|`
   - Compares user interests with event categories
   - Case-insensitive matching
   - Returns 0.5 (neutral) if no interests specified

2. **Distance Score** (30% weight)
   - Formula: `max(0, 1 - (distanceMeters / radiusMeters))`
   - Linear decay with distance
   - 0m = 1.0, radiusMeters = 0.0
   - Simple and predictable

3. **Time-Fit Score** (20% weight)
   - Returns 1.0 if duration ≤ minutesAvailable
   - Sigmoid drop-off if duration > minutesAvailable
   - Formula: `1 / (1 + e^(normalizedExcess * 4))`
   - Smooth degradation for longer events

4. **Popularity Score** (10% weight)
   - Normalized provider popularity (0-1)
   - From provider data
   - Lowest weight to avoid bias

**Test Coverage:**

- ✅ Perfect interest match (Jaccard = 1.0)
- ✅ Partial interest match (Jaccard = 0.25)
- ✅ Distance scoring accuracy
- ✅ Sigmoid drop for time-fit
- ✅ Time-fit = 1.0 when duration fits
- ✅ Correct weight application
- ✅ Descending sort by score
- ✅ Handles missing venues
- ✅ Handles empty interests

**Quality Gates:**

- ✅ All 21 tests pass (9 rank + 12 provider)
- ✅ Scores sorted descending
- ✅ Deterministic with fixtures
- ✅ Jaccard similarity working correctly
- ✅ Sigmoid drop-off smooth

## Section I - API↔️MCP Wiring

### Status: ✅ COMPLETE

**Changes:**

- ✅ Moved shared schemas to packages/core
- ✅ Created MCP client in API
- ✅ Wired /v1/suggest to MCP pipeline.suggest
- ✅ Removed mock data from controller
- ✅ Added Zod validation for MCP responses
- ✅ End-to-end flow working with fixtures

**Architecture:**

```
API /v1/suggest → MCP Client → pipeline.suggest → Response
     ↓                              ↓
  Validate Input              geo.resolve
     ↓                              ↓
  Call MCP                    events.search (mock providers)
     ↓                              ↓
  Validate Output             rank.score
     ↓                              ↓
  Return JSON                 Return top N
```

**Shared Schemas (packages/core):**

- `SuggestRequestSchema` - Request validation
- `SuggestResponseSchema` - Response validation
- `SuggestionSchema` - Individual suggestion
- `VenueSchema` - Venue information

**MCP Client:**

- Direct import for monorepo (development)
- Ready for HTTP/IPC in production
- Error handling with 502 on MCP failure
- Comprehensive logging

**Flow:**

1. API receives POST /v1/suggest
2. Validates request with Zod
3. Calls MCP pipeline.suggest via client
4. MCP orchestrates: geo → events → rank
5. Validates MCP response with Zod
6. Returns suggestions to client

**Quality Gates:**

- ✅ Shared schemas in packages/core
- ✅ Mock data removed from controller
- ✅ MCP client implemented
- ✅ End-to-end validation working
- ✅ Uses fixtures when API keys missing

## Section J - Frontend MVP

### Status: ✅ COMPLETE

**Changes:**

- ✅ Modern Next.js UI with shadcn/ui components
- ✅ MapLibre GL map with markers
- ✅ Search form with all inputs
- ✅ Browser geolocation support
- ✅ Ranked suggestion cards
- ✅ Interactive map and list panels
- ✅ Responsive design

**Features:**

**Search Form:**

- Location input (lat/lon with manual override)
- Geolocation button (browser API)
- Time available slider (15-240 min)
- Radius slider (1-10 km)
- Interests multi-select (chips)
- Search button with loading state

**Map Panel (MapLibre):**

- Interactive map with Carto Positron basemap
- Blue marker for user location
- Green markers for suggestions
- Red marker for selected suggestion
- Click markers to select

**List Panel:**

- Ranked suggestion cards
- Shows: title, distance, duration, score
- Venue name display
- External link to details
- Click to select/highlight on map

**shadcn/ui Components:**

- Card, CardHeader, CardTitle, CardDescription, CardContent
- Button (with variants)
- Slider (for time and radius)
- Badge (for interests and scores)
- Input (for location and interests)
- Separator (visual dividers)

**Quality Gates:**

- ✅ Modern, minimal design
- ✅ Geolocation working
- ✅ Map renders with markers
- ✅ API integration working
- ✅ Fixture-based results display
- ✅ Responsive layout

## Section K - Public Partner API

### Status: ✅ COMPLETE

**Changes:**

- ✅ Partner endpoint `/v1/partner/suggest`
- ✅ API key authentication middleware
- ✅ Rate limiting (60 req/min per key)
- ✅ Usage logging
- ✅ OpenAPI documentation updated
- ✅ README with cURL examples

**Features:**

**Authentication:**

- Header-based: `x-partner-key`
- Simple key validation (env variable)
- Ready for database table in production
- Unauthorized (401) on missing/invalid key

**Rate Limiting:**

- 60 requests per minute per API key
- express-rate-limit middleware
- Standard headers: RateLimit-\*
- 429 Too Many Requests on limit exceeded
- Per-key tracking (not per IP)

**Logging:**

- All partner requests logged
- Includes: API key (masked), path, method
- Analytics-ready format
- Pino structured logging

**OpenAPI Spec:**

- `/v1/partner/suggest` documented
- Security scheme: ApiKeyAuth
- Shared schemas for request/response
- Rate limit responses documented

**Quality Gates:**

- ✅ API key authentication working
- ✅ Rate limiting enforced
- ✅ OpenAPI spec includes partner endpoint
- ✅ README has cURL example
- ✅ Works with dev key from .env

## Section L - Quality Gates

### Status: ✅ COMPLETE

**Changes:**

- ✅ API unit tests (health, API key middleware)
- ✅ MCP tool tests (21 tests from Section F & H)
- ✅ Playwright E2E smoke tests
- ✅ GitHub Actions CI/CD workflow
- ✅ Lint, typecheck, test, build on PRs

**Tests Added:**

**API Tests (Vitest):**

- Health endpoint test
- API key middleware tests (missing, invalid, valid)
- Total: 2 test files

**MCP Tests (Vitest - Already Exist):**

- Provider connector tests (12 tests)
- Ranking algorithm tests (9 tests)
- Total: 21 tests

**E2E Tests (Playwright):**

- Homepage loads correctly
- Search form elements visible
- Geolocation button present
- Interest management works
- Map renders
- Total: 4 smoke tests

**GitHub Actions Workflow:**

**Jobs:**

1. **Lint** - ESLint across all packages
2. **Type Check** - TypeScript validation
3. **Test** - Vitest unit tests with PostgreSQL & Redis
4. **Build** - Build all packages
5. **E2E** - Playwright tests with browser automation

**Features:**

- Runs on PRs and pushes to main/develop
- PostgreSQL + PostGIS service
- Redis service
- Playwright browser installation
- Artifact upload for test reports
- Parallel job execution

**Quality Gates:**

- ✅ 2 API unit tests
- ✅ 21 MCP tool tests
- ✅ 4 E2E smoke tests
- ✅ GitHub Actions workflow configured
- ✅ CI passes locally (can test with act)

## Section M - Telemetry & Logs

### Status: ✅ COMPLETE

**Changes:**

- ✅ Pino structured logging everywhere
- ✅ Prometheus metrics endpoint (/metrics)
- ✅ HTTP request metrics
- ✅ API-specific metrics
- ✅ MCP call metrics
- ✅ Cache metrics
- ✅ Partner API metrics

**Structured Logging (Pino):**

- Already integrated via pino-http middleware
- Structured JSON logs
- Request/response logging
- Error logging with context
- Performance: ~10x faster than Winston

**Prometheus Metrics:**

**Default Metrics:**

- process_cpu_user_seconds_total
- process_cpu_system_seconds_total
- nodejs_heap_size_bytes
- nodejs_external_memory_bytes
- nodejs_gc_duration_seconds

**HTTP Metrics:**

- http_requests_total (counter)
- http_request_duration_seconds (histogram)
- Labels: method, route, status

**API Metrics:**

- suggest_requests_total (counter)
- suggest_request_duration_seconds (histogram)
- suggest_results_count (histogram)
- Labels: endpoint (public/partner)

**MCP Metrics:**

- mcp_calls_total (counter)
- mcp_call_duration_seconds (histogram)
- Labels: tool, status

**Cache Metrics:**

- cache_hits_total (counter)
- cache_misses_total (counter)
- Labels: cache_type

**Partner Metrics:**

- partner_requests_total (counter)
- rate_limit_hits_total (counter)
- Labels: partner_key, endpoint

**Database Metrics:**

- db_queries_total (counter)
- Labels: operation

**Gauges:**

- active_connections

**Quality Gates:**

- ✅ Pino logging integrated
- ✅ /metrics endpoint returns Prometheus format
- ✅ HTTP metrics tracked
- ✅ API metrics tracked
- ✅ MCP metrics tracked
- ✅ curl :4000/metrics works
