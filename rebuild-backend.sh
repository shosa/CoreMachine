#!/bin/bash

# Script per rebuild solo del backend CoreMachine
# Uso: ./rebuild-backend.sh

set -e  # Exit on error

echo "============================================"
echo "CoreMachine Backend - Rebuild Only"
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
echo "Step 1: Stopping backend container..."
echo "============================================"
$DOCKER_COMPOSE -p coremachine stop backend

echo ""
echo "============================================"
echo "Step 2: Removing old backend container..."
echo "============================================"
$DOCKER_COMPOSE -p coremachine rm -f backend

echo ""
echo "============================================"
echo "Step 3: Building backend image (no cache)..."
echo "============================================"
$DOCKER_COMPOSE -p coremachine build --no-cache backend

echo ""
echo "============================================"
echo "Step 4: Starting backend container..."
echo "============================================"
$DOCKER_COMPOSE -p coremachine up -d backend

echo ""
echo "============================================"
echo "Step 5: Waiting for backend to be ready..."
echo "============================================"
sleep 5

echo ""
echo "============================================"
echo "Backend Status:"
echo "============================================"
docker ps | grep coremachine-backend

echo ""
echo "============================================"
echo "✓ Backend rebuild completed successfully!"
echo "============================================"
echo ""
echo "View backend logs with:"
echo "  docker logs -f coremachine-backend"
echo ""
