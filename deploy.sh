#!/bin/bash

# CoreSuite - Deploy Script for Ubuntu Server
# This script deploys CoreServices and CoreMachine on Ubuntu with Docker

set -e

echo "============================================"
echo "CoreSuite - Ubuntu Server Deploy"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed${NC}"
    echo "Install Docker with: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}ERROR: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo -e "${YELLOW}Server IP detected: ${SERVER_IP}${NC}"
echo ""

# Step 1: Start CoreServices
echo "============================================"
echo "[1/3] Starting CoreServices..."
echo "============================================"
cd CoreServices

if [ ! -f .env ]; then
    echo -e "${RED}ERROR: CoreServices/.env not found${NC}"
    echo "Please create .env file first"
    exit 1
fi

docker compose -p coreservices up -d
echo -e "${GREEN}✓ CoreServices started${NC}"
echo ""

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
sleep 10

# Step 2: Create CoreMachine database
echo "============================================"
echo "[2/3] Setting up CoreMachine database..."
echo "============================================"

# Read MySQL root password from .env
MYSQL_ROOT_PASSWORD=$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2)

docker exec core-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "
CREATE DATABASE IF NOT EXISTS coremachine;
CREATE USER IF NOT EXISTS 'coremachine'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON coremachine.* TO 'coremachine'@'%';
FLUSH PRIVILEGES;
" 2>/dev/null || echo -e "${YELLOW}Database already exists or credentials already set${NC}"

echo -e "${GREEN}✓ Database configured${NC}"
echo ""

# Step 3: Start CoreMachine
echo "============================================"
echo "[3/3] Starting CoreMachine..."
echo "============================================"
cd ../CoreMachine

if [ ! -f .env ]; then
    echo -e "${RED}ERROR: CoreMachine/.env not found${NC}"
    echo "Please create .env file first"
    exit 1
fi

# Update .env with server IP for production
if grep -q "localhost" .env; then
    echo -e "${YELLOW}Updating .env with server IP...${NC}"
    sed -i "s|http://localhost|http://${SERVER_IP}|g" .env
fi

docker compose -p coremachine up -d
echo -e "${GREEN}✓ CoreMachine started${NC}"
echo ""

# Show status
echo "============================================"
echo "Deployment Complete!"
echo "============================================"
echo ""
echo -e "${GREEN}CoreServices:${NC}"
docker compose -p coreservices ps
echo ""
echo -e "${GREEN}CoreMachine:${NC}"
docker compose -p coremachine ps
echo ""
echo "============================================"
echo "Access URLs:"
echo "============================================"
echo -e "Frontend:       ${GREEN}http://${SERVER_IP}${NC}"
echo -e "Backend API:    ${GREEN}http://${SERVER_IP}/api${NC}"
echo -e "PHPMyAdmin:     ${GREEN}http://${SERVER_IP}:8080${NC}"
echo -e "MinIO Console:  ${GREEN}http://${SERVER_IP}:9001${NC}"
echo -e "Meilisearch:    ${GREEN}http://${SERVER_IP}:7700${NC}"
echo "============================================"
