#!/bin/sh
# =============================================================================
# avaai Backend — Docker Entrypoint
# Runs Prisma migrations on startup, then starts the server.
# =============================================================================

set -e

echo "⏳ Waiting for database connection..."
until pg_isready -h "$(echo $DATABASE_URL | sed 's/.*@//;s/:.*//')" -U "$(echo $DATABASE_URL | sed 's/.*:\/\///;s/:.*//')" 2>/dev/null; do
  sleep 1
done
echo "✅ Database is ready"

# Apply migrations automatically
echo "⏳ Applying database migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push 2>/dev/null
echo "✅ Schema applied"

# Start the application
echo "🚀 Starting avaai Backend..."
exec node dist/app.js
