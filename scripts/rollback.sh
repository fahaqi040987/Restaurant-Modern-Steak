#!/bin/bash
# Production Rollback Script
# Rolls back to a previous version using Docker image tags
# Usage: ./scripts/rollback.sh <build-tag>

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Steak Kenangan - Production Rollback${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if build tag is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Build tag not specified${NC}"
    echo ""
    echo -e "${YELLOW}Usage: ./scripts/rollback.sh <build-tag>${NC}"
    echo ""
    echo -e "${BLUE}Available tags:${NC}"
    docker images steak-kenangan-backend --format "table {{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | head -10
    echo ""
    echo -e "${YELLOW}Example: ./scripts/rollback.sh abc1234${NC}"
    exit 1
fi

BUILD_TAG=$1

# Step 1: Verify the tag exists
echo -e "${GREEN}[1/4] Verifying build tag...${NC}"

if ! docker image inspect steak-kenangan-backend:${BUILD_TAG} &> /dev/null; then
    echo -e "${RED}Error: Image steak-kenangan-backend:${BUILD_TAG} not found${NC}"
    echo ""
    echo -e "${BLUE}Available tags:${NC}"
    docker images steak-kenangan-backend --format "table {{.Tag}}\t{{.CreatedAt}}"
    exit 1
fi

echo -e "${GREEN}✓ Found image: steak-kenangan-backend:${BUILD_TAG}${NC}"
echo ""

# Step 2: Confirm rollback
echo -e "${YELLOW}⚠️  WARNING: This will rollback the production backend to version ${BUILD_TAG}${NC}"
echo ""
echo -e "${YELLOW}Current running version:${NC}"
docker ps -f name=steak-kenangan-backend --format "{{.Image}}" 2>/dev/null || echo "Not running"
echo ""
echo -e "${YELLOW}Rolling back to:${NC}"
echo "  steak-kenangan-backend:${BUILD_TAG}"
echo ""

read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${BLUE}Rollback cancelled${NC}"
    exit 0
fi

echo ""

# Step 3: Tag the rollback version as latest
echo -e "${GREEN}[2/4] Tagging rollback version...${NC}"
docker tag steak-kenangan-backend:${BUILD_TAG} steak-kenangan-backend:latest
echo -e "${GREEN}✓ Tagged ${BUILD_TAG} as latest${NC}"
echo ""

# Step 4: Load environment and restart services
echo -e "${GREEN}[3/4] Restarting services...${NC}"

if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

docker compose -f docker-compose.prod.yml up -d backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend restarted with ${BUILD_TAG}${NC}"
else
    echo -e "${RED}✗ Failed to restart backend${NC}"
    exit 1
fi
echo ""

# Step 5: Verify rollback
echo -e "${GREEN}[4/4] Verifying rollback...${NC}"

# Wait for service to be healthy
echo -e "${YELLOW}  Waiting for backend to be healthy...${NC}"
sleep 5

for i in {1..6}; do
    if docker exec steak-kenangan-backend wget -q --spider http://localhost:8080/api/v1/health 2>/dev/null; then
        echo -e "${GREEN}✓ Backend health check passed${NC}"
        break
    fi
    if [ $i -eq 6 ]; then
        echo -e "${YELLOW}⚠ Backend may still be starting...${NC}"
    else
        echo -e "${YELLOW}  Retrying in 5s...${NC}"
        sleep 5
    fi
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}        Rollback Complete!             ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Show container status
echo -e "${BLUE}Container Status:${NC}"
docker compose -f docker-compose.prod.yml ps backend
echo ""

# Save rollback info
echo "ROLLBACK_FROM=$(docker ps -f name=steak-kenangan-backend --format '{{.Image}}' | head -1 || echo 'unknown')" > .rollback-info
echo "ROLLBACK_TO=steak-kenangan-backend:${BUILD_TAG}" >> .rollback-info
echo "ROLLBACK_DATE=$(date -Iseconds)" >> .rollback-info

echo -e "${BLUE}Rollback Info:${NC}"
cat .rollback-info
echo ""

echo -e "${GREEN}✅ Rollback to ${BUILD_TAG} completed successfully!${NC}"
