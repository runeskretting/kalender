#!/bin/bash
# Oppgradering med nullnedetid
# Kjør på VPS: bash scripts/deploy.sh
set -e

cd "$(dirname "$0")/.."

echo "==> Henter siste kode..."
git pull

echo "==> Bygger ny Docker-image..."
docker compose build app

echo "==> Starter ny container (migrasjoner kjøres automatisk)..."
docker compose up -d app

echo "==> Venter på at appen blir sunn..."
for i in $(seq 1 30); do
  if docker inspect --format='{{.State.Health.Status}}' kalender_app 2>/dev/null | grep -q healthy; then
    echo "==> App er sunn!"
    break
  fi
  echo "   Venter... ($i/30)"
  sleep 2
done

echo "==> Status:"
docker compose ps
