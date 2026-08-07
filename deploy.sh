#!/usr/bin/env bash
set -e

echo "🚀 Vyomrix Production Deployment Script"
echo "---------------------------------------"

if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

echo "📦 Pulling latest images..."
docker compose -f docker-compose.prod.yml pull

echo "🏗️ Building services..."
docker compose -f docker-compose.prod.yml build

echo "⬆️ Starting infrastructure and database..."
docker compose -f docker-compose.prod.yml up -d postgres redis rabbitmq traefik

echo "⏳ Waiting for database to be healthy..."
# We wait for the postgres container to report healthy
RETRIES=30
until docker inspect --format="{{if .State.Health}}{{.State.Health.Status}}{{end}}" vyomrix-postgres | grep -q "healthy" || [ $RETRIES -eq 0 ]; do
  echo "Waiting for postgres... ($RETRIES attempts left)"
  sleep 2
  RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
    echo "❌ Timeout waiting for database."
    exit 1
fi

echo "🔄 Running migrations..."
docker compose -f docker-compose.prod.yml up migration
MIGRATION_CODE=$(docker inspect vyomrix-migration --format='{{.State.ExitCode}}')

if [ "$MIGRATION_CODE" -ne 0 ]; then
    echo "❌ Migrations failed. Check logs:"
    docker logs vyomrix-migration
    exit 1
fi

echo "✅ Migrations completed successfully."

echo "⬆️ Starting backend and worker services..."
docker compose -f docker-compose.prod.yml up -d backend worker

echo "⏳ Waiting for backend to be healthy..."
RETRIES=30
until docker inspect --format="{{if .State.Health}}{{.State.Health.Status}}{{end}}" vyomrix-backend | grep -q "healthy" || [ $RETRIES -eq 0 ]; do
  echo "Waiting for backend... ($RETRIES attempts left)"
  sleep 2
  RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
    echo "❌ Timeout waiting for backend."
    exit 1
fi

echo "⬆️ Starting frontend service..."
docker compose -f docker-compose.prod.yml up -d frontend

echo "🚀 Deployment complete!"
echo "If this is a fresh install, run the bootstrap script to create the initial admin user:"
echo "docker exec -it vyomrix-backend python /app/scripts/production_bootstrap.py"
