#!/bin/sh
set -e

echo "[kalender] Running database migrations..."
node migrate.js

echo "[kalender] Starting application..."
exec node server.js
