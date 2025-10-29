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
