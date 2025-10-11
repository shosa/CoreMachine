#!/bin/bash

# Script per rebuild e redeploy di CoreMachine su Ubuntu
# Uso: ./rebuild.sh

set -e  # Exit on error

echo "============================================"
echo "CoreMachine - Rebuild & Redeploy"
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
echo "Step 1: Stopping containers..."
echo "============================================"
$DOCKER_COMPOSE -p coremachine down

echo ""
echo "============================================"
echo "Step 2: Building images (no cache)..."
echo "============================================"
$DOCKER_COMPOSE -p coremachine build --no-cache

echo ""
echo "============================================"
echo "Step 3: Starting containers..."
echo "============================================"
$DOCKER_COMPOSE -p coremachine up -d

echo ""
echo "============================================"
echo "Step 4: Waiting for services to be ready..."
echo "============================================"
sleep 5

echo ""
echo "============================================"
echo "Container Status:"
echo "============================================"
$DOCKER_COMPOSE -p coremachine ps

echo ""
echo "============================================"
echo "✓ Rebuild completed successfully!"
echo "============================================"
echo ""
echo "View logs with:"
echo "  $DOCKER_COMPOSE -p coremachine logs -f"
echo ""
echo "Check backend logs:"
echo "  docker logs -f coremachine-backend"
echo ""
