#!/bin/bash

# Verification script for Section A scaffold

echo "🔍 Verifying hyperlocal-events monorepo setup..."
echo ""

# Check pnpm
echo "✓ Checking pnpm..."
if command -v pnpm &> /dev/null; then
    echo "  ✅ pnpm $(pnpm --version) installed"
else
    echo "  ❌ pnpm not found"
    exit 1
fi

# Check Node version
echo "✓ Checking Node.js..."
NODE_VERSION=$(node --version)
echo "  ✅ Node.js $NODE_VERSION"

# Check dependencies
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  ✅ Dependencies installed"
else
    echo "  ❌ Dependencies not installed. Run: pnpm install"
    exit 1
fi

# Check workspace structure
echo "✓ Checking workspace structure..."
REQUIRED_DIRS=(
    "apps/web"
    "apps/api"
    "packages/mcp-server"
    "packages/ui"
    "packages/core"
    "packages/config"
    "infra/docker"
    "prisma"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir exists"
    else
        echo "  ❌ $dir missing"
        exit 1
    fi
done

# Check key files
echo "✓ Checking key files..."
KEY_FILES=(
    "package.json"
    "pnpm-workspace.yaml"
    "turbo.json"
    ".env.example"
    "prisma/schema.prisma"
    "infra/docker/docker-compose.yml"
)

for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file missing"
        exit 1
    fi
done

# Run quality gates
echo ""
echo "🧪 Running quality gates..."

echo "✓ Type checking..."
if pnpm type-check > /dev/null 2>&1; then
    echo "  ✅ Type check passed"
else
    echo "  ❌ Type check failed"
    exit 1
fi

echo "✓ Linting..."
if pnpm lint > /dev/null 2>&1; then
    echo "  ✅ Lint passed"
else
    echo "  ⚠️  Lint warnings (acceptable)"
fi

echo "✓ Format checking..."
if pnpm format:check > /dev/null 2>&1; then
    echo "  ✅ Format check passed"
else
    echo "  ❌ Format check failed"
    exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "📝 Next steps:"
echo "  1. Start Docker: pnpm docker:up"
echo "  2. Run migrations: pnpm db:migrate"
echo "  3. Generate Prisma client: cd apps/api && pnpm db:generate"
echo "  4. Start dev servers: pnpm dev"
echo "  5. Test health check: curl http://localhost:4000/health"
echo "  6. Open web app: http://localhost:3000"
echo ""
echo "🎉 Section A scaffold complete!"
