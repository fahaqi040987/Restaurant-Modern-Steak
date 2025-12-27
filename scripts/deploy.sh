#!/bin/bash
# Production Deployment Script
# Deploys the application to production using docker-compose
# Usage: ./scripts/deploy.sh [--force]

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
FORCE=""
if [ "$1" == "--force" ]; then
    FORCE="--force"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Steak Kenangan - Production Deploy  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${GREEN}[1/5] Checking prerequisites...${NC}"

# Check if docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Check if docker-compose.prod.yml exists
if [ ! -f docker-compose.prod.yml ]; then
    echo -e "${RED}Error: docker-compose.prod.yml not found${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production not found${NC}"
    echo -e "${YELLOW}Please create .env.production from .env.production.example${NC}"
    exit 1
fi

# Check if frontend is built
if [ ! -f frontend/dist/index.html ]; then
    echo -e "${YELLOW}Warning: Frontend not built. Run 'make build-prod' first.${NC}"
    if [ -z "$FORCE" ]; then
        echo -e "${RED}Aborting. Use --force to continue anyway.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Step 2: Load environment variables
echo -e "${GREEN}[2/5] Loading environment variables...${NC}"
export $(cat .env.production | grep -v '^#' | xargs)

# Verify critical variables are set
if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}Error: Critical environment variables not set${NC}"
    echo -e "${YELLOW}Please check .env.production for DB_USER, DB_PASSWORD, JWT_SECRET${NC}"
    exit 1
fi

if [ -z "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    echo -e "${YELLOW}Warning: CLOUDFLARE_TUNNEL_TOKEN not set. Tunnel will not start.${NC}"
fi

echo -e "${GREEN}✓ Environment loaded${NC}"
echo ""

# Step 3: Pull latest images (if using registry)
echo -e "${GREEN}[3/5] Checking for image updates...${NC}"
if [ -n "$GITHUB_OWNER" ]; then
    echo -e "${YELLOW}  Pulling from GitHub Container Registry...${NC}"
    docker compose -f docker-compose.prod.yml pull backend || true
fi
echo -e "${GREEN}✓ Images ready${NC}"
echo ""

# Step 4: Deploy with docker-compose
echo -e "${GREEN}[4/5] Starting production containers...${NC}"
docker compose -f docker-compose.prod.yml up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Containers started successfully${NC}"
else
    echo -e "${RED}✗ Failed to start containers${NC}"
    exit 1
fi
echo ""

# Step 5: Verify deployment
echo -e "${GREEN}[5/5] Verifying deployment...${NC}"

# Wait for services to be healthy
echo -e "${YELLOW}  Waiting for services to be healthy (30s timeout)...${NC}"
sleep 5

# Check backend health
BACKEND_HEALTHY=false
for i in {1..6}; do
    if docker exec steak-kenangan-backend wget -q --spider http://localhost:8080/api/v1/health 2>/dev/null; then
        BACKEND_HEALTHY=true
        break
    fi
    echo -e "${YELLOW}  Backend not ready, retrying in 5s...${NC}"
    sleep 5
done

if [ "$BACKEND_HEALTHY" = true ]; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
else
    echo -e "${YELLOW}⚠ Backend health check failed (may still be starting)${NC}"
fi

# Check container status
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}        Deployment Complete!           ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Show container status
echo -e "${BLUE}Container Status:${NC}"
docker compose -f docker-compose.prod.yml ps
echo ""

# Show build info if available
if [ -f .build-info ]; then
    echo -e "${BLUE}Build Info:${NC}"
    cat .build-info
    echo ""
fi

# Show access URLs
echo -e "${YELLOW}Access URLs:${NC}"
if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    echo "  - Production: https://steakkenangan.com (via Cloudflare)"
else
    echo "  - Local: http://localhost (frontend)"
    echo "  - Local: http://localhost:8080/api/v1/health (API)"
fi
echo ""

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
