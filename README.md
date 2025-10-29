# Hyperlocal Events

MCP-powered hyperlocal events discovery platform built with a modern full-stack monorepo architecture.

## Tech Stack

- **Package Manager**: pnpm
- **Monorepo**: Turbo
- **Backend**: Node.js 20, Express, TypeScript
- **MCP Server**: @modelcontextprotocol/sdk with custom tools
- **Database**: PostgreSQL 15 + PostGIS
- **Cache/Queue**: Redis + BullMQ
- **ORM**: Prisma
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Testing**: Vitest, Supertest, Playwright
- **Dev Tools**: tsx, pino, dotenv
- **Container**: Docker + docker-compose

## Project Structure

```
.
├── apps/
│   ├── web/          # Next.js UI
│   └── api/          # Express REST API + OpenAPI docs
├── packages/
│   ├── mcp-server/   # MCP server with tools
│   ├── ui/           # Shared UI components
│   ├── core/         # Shared types, schemas, utilities
│   └── config/       # ESLint, TypeScript, Tailwind presets
├── infra/
│   ├── docker/       # Dockerfiles and compose
│   └── migrations/   # SQL for PostGIS
├── prisma/           # Prisma schema
└── scripts/          # Dev/seed scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Installation

1. **Clone and install dependencies**:

   ```bash
   pnpm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start infrastructure (PostgreSQL + Redis)**:

   ```bash
   pnpm docker:up
   ```

4. **Run database migrations**:

   ```bash
   pnpm db:migrate
   ```

5. **Generate Prisma client**:

   ```bash
   cd apps/api && pnpm db:generate
   ```

6. **Start development servers**:

   ```bash
   pnpm dev
   ```

   This will start:
   - Web app: http://localhost:3000
   - API server: http://localhost:4000
   - Health check: http://localhost:4000/health
   - OpenAPI docs: http://localhost:4000/api-docs

## Development Commands

```bash
# Install dependencies
pnpm install

# Start all services in dev mode
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Run tests
pnpm test

# Format code
pnpm format

# Database commands
pnpm db:migrate      # Run Prisma migrations
pnpm db:seed         # Seed database
pnpm --filter api db:studio  # Open Prisma Studio

# Docker commands
pnpm docker:up       # Start PostgreSQL + Redis
pnpm docker:down     # Stop containers

# Clean build artifacts
pnpm clean
```

## Package-Specific Commands

```bash
# Run commands in specific packages
pnpm --filter @hyperlocal/api dev
pnpm --filter @hyperlocal/web dev
pnpm --filter @hyperlocal/core build
```

## Architecture

### API Service (`apps/api`)

- Express REST API with OpenAPI documentation
- Prisma ORM for database access
- Redis for caching and job queues (BullMQ)
- Pino for structured logging
- Zod for validation

### MCP Server (`packages/mcp-server`)

- Model Context Protocol server
- Custom tools for event providers, ranking, etc.
- Integrates with API service

### Web App (`apps/web`)

- Next.js 15 with App Router
- Tailwind CSS + shadcn/ui components
- MapLibre GL for maps
- Server and client components

### Shared Packages

- **core**: Types, schemas, utilities
- **ui**: Reusable UI components
- **config**: Shared configuration

## Database

PostgreSQL 15 with PostGIS extension for geospatial queries.

### Schema

- Events table with location data (geography type)
- Spatial indexes for efficient proximity searches

## Partner API

The platform provides a Partner API for third-party integrations.

### Authentication

Partner API requires an API key passed via the `x-partner-key` header.

### Rate Limiting

- **Rate limit**: 60 requests per minute per API key
- **Headers**: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

### Example Usage

```bash
# Get personalized suggestions
curl -X POST http://localhost:4000/v1/partner/suggest \
  -H "Content-Type: application/json" \
  -H "x-partner-key: your-dev-key-here" \
  -d '{
    "lat": 37.7749,
    "lon": -122.4194,
    "minutesAvailable": 120,
    "interests": ["music", "food"],
    "radiusMeters": 5000
  }'
```

### Development Setup

Add your dev API key to `.env`:

```env
PARTNER_API_KEYS=dev-key-12345,another-key-67890
```

### OpenAPI Documentation

Full API documentation available at:

- Development: http://localhost:4000/
- Includes partner endpoint specifications

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm --filter @hyperlocal/api test:watch

# Run Playwright e2e tests (to be implemented)
pnpm --filter @hyperlocal/web test:e2e
```

## Deployment

Docker images are provided for production deployment:

```bash
# Build API image
docker build -f infra/docker/Dockerfile.api -t hyperlocal-api .

# Build Web image
docker build -f infra/docker/Dockerfile.web -t hyperlocal-web .
```

## License

Private - All rights reserved
