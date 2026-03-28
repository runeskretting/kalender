#!/bin/sh
set -e

echo "[kalender] Running database migrations..."
node_modules/.bin/drizzle-kit migrate --config=drizzle.config.ts

echo "[kalender] Starting application..."
exec node server.js
