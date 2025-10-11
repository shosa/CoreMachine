#!/bin/bash

# Script per rebuild solo del frontend CoreMachine
# Uso: ./rebuild-frontend.sh

set -e  # Exit on error

echo "============================================"
echo "CoreMachine Frontend - Rebuild Only"
echo "============================================"
echo ""

# Detect docker compose command
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
    echo "✓ Detected: Docker Compose v2 (plugin)"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
    echo "✓ Detected: Docker Compose v1 (standalone)"
else
    echo "✗ Error: Docker Compose not found!"
    exit 1
fi

echo ""
echo "============================================"
echo "Step 1: Stopping frontend container..."
echo "============================================"
$DOCKER_COMPOSE -p coremachine stop frontend

echo ""
echo "============================================"
echo "Step 2: Removing old frontend container..."
echo "============================================"
$DOCKER_COMPOSE -p coremachine rm -f frontend

echo ""
echo "============================================"
echo "Step 3: Building frontend image (no cache)..."
echo "============================================"
$DOCKER_COMPOSE -p coremachine build --no-cache frontend

echo ""
echo "============================================"
echo "Step 4: Starting frontend container..."
echo "============================================"
$DOCKER_COMPOSE -p coremachine up -d frontend

echo ""
echo "============================================"
echo "Step 5: Waiting for frontend to be ready..."
echo "============================================"
sleep 5

echo ""
echo "============================================"
echo "Frontend Status:"
echo "============================================"
docker ps | grep coremachine-frontend

echo ""
echo "============================================"
echo "✓ Frontend rebuild completed successfully!"
echo "============================================"
echo ""
echo "View frontend logs with:"
echo "  docker logs -f coremachine-frontend"
echo ""
