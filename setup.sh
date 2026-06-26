#!/bin/bash
# =============================================================================
# avaSysAIByNik Premium Broker — Quickstart Setup
# One-command setup for local development.
# =============================================================================

set -e

echo "================================================"
echo "  avaSysAIByNik Premium Broker — Quickstart Setup"
echo "================================================"
echo ""

# ── 1. Start Docker services ────────────────────────────────────────────────
echo "📦 Starting Docker services (PostgreSQL, MinIO, MailHog)..."
docker compose up -d postgres minio mailhog
echo "   ✅ Docker services running"
echo ""

# ── 2. Wait for PostgreSQL ──────────────────────────────────────────────────
echo "⏳ Waiting for PostgreSQL..."
until docker exec avasys-postgres pg_isready -U avasys 2>/dev/null; do
  sleep 1
done
echo "   ✅ PostgreSQL is ready"
echo ""

# ── 3. Install backend dependencies ─────────────────────────────────────────
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "   ✅ Backend dependencies installed"
echo ""

# ── 4. Apply database schema ────────────────────────────────────────────────
echo "🗄️  Applying database schema..."
npx prisma db push
echo "   ✅ Schema applied"
echo ""

# ── 5. Seed database ────────────────────────────────────────────────────────
echo "🌱 Seeding database..."
npx tsx prisma/seed.ts
echo "   ✅ Database seeded"
echo ""

# ── 6. Build backend ────────────────────────────────────────────────────────
echo "🔨 Building backend..."
npm run build
echo "   ✅ Backend built"
echo ""

# ── 7. Install frontend dependencies ────────────────────────────────────────
cd ..
echo "📦 Installing frontend dependencies..."
npm install --include=dev
echo "   ✅ Frontend dependencies installed"
echo ""

# ── 8. Build + start everything ─────────────────────────────────────────────
echo "🐳 Building Docker images..."
docker compose build
echo "   ✅ Docker images built"
echo ""

echo "================================================"
echo "  ✅ Setup complete!"
echo "================================================"
echo ""
echo "  Start the full stack:"
echo "    docker compose up -d"
echo ""
echo "  Or for development:"
echo "    cd backend && node --env-file .env --import tsx src/app.ts"
echo "    cd .. && npx vite --port 4000"
echo ""
echo "  Access:"
echo "    Frontend (Docker):  http://localhost:3004"
echo "    Frontend (Dev):     http://localhost:4000"
echo "    Backend API:        http://localhost:3003/api/health"
echo "    MinIO Console:      http://localhost:9001"
echo "    MailHog:            http://localhost:8025"
echo ""
echo "  Login: admin@avasys.ch / Test1234!"
echo "================================================"
