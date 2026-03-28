#!/bin/bash
# Generates PWA icons from a source SVG using Docker (no local tools needed)
# Usage: bash scripts/generate-icons.sh [source.svg]
#
# Requires Docker. Creates public/icons/{icon-192.png,icon-512.png,icon-512-maskable.png}

set -e

SOURCE="${1:-}"
OUTDIR="$(dirname "$0")/../public/icons"
mkdir -p "$OUTDIR"

if [ -z "$SOURCE" ]; then
  echo "Generating placeholder icons (blue calendar)..."
  # Create a simple colored PNG using ImageMagick via Docker
  docker run --rm -v "$OUTDIR:/out" dpokidov/imagemagick \
    -size 512x512 xc:"#4f46e5" \
    -fill white -font DejaVu-Sans-Bold -pointsize 200 -gravity Center \
    -annotate 0 "📅" \
    /out/icon-512.png 2>/dev/null || \
  docker run --rm -v "$OUTDIR:/out" dpokidov/imagemagick \
    -size 512x512 xc:"#4f46e5" /out/icon-512.png

  docker run --rm -v "$OUTDIR:/out" dpokidov/imagemagick \
    /out/icon-512.png -resize 192x192 /out/icon-192.png

  cp "$OUTDIR/icon-512.png" "$OUTDIR/icon-512-maskable.png"
  echo "Icons created in public/icons/"
else
  docker run --rm -v "$(realpath "$SOURCE"):/src.svg:ro" -v "$OUTDIR:/out" \
    dpokidov/imagemagick /src.svg -resize 512x512 /out/icon-512.png
  docker run --rm -v "$OUTDIR:/out" dpokidov/imagemagick \
    /out/icon-512.png -resize 192x192 /out/icon-192.png
  cp "$OUTDIR/icon-512.png" "$OUTDIR/icon-512-maskable.png"
  echo "Icons created from $SOURCE"
fi
