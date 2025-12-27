#!/bin/bash
# Production Build Script
# Builds production artifacts from current source code
# Usage: ./scripts/build-prod.sh [--no-cache]

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
NO_CACHE=""
if [ "$1" == "--no-cache" ]; then
    NO_CACHE="--no-cache"
fi

# Get git information
GIT_HASH=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
BUILD_DATE=$(date -Iseconds)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Steak Kenangan - Production Build   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Build Tag:${NC} ${GIT_HASH}"
echo -e "${YELLOW}Branch:${NC} ${GIT_BRANCH}"
echo -e "${YELLOW}Date:${NC} ${BUILD_DATE}"
echo ""

# Step 1: Check prerequisites
echo -e "${GREEN}[1/5] Checking prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Step 2: Build backend Docker image
echo -e "${GREEN}[2/5] Building backend Docker image...${NC}"
docker build $NO_CACHE -t steak-kenangan-backend:local ./backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend image built successfully${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi
echo ""

# Step 3: Build frontend static assets
echo -e "${GREEN}[3/5] Building frontend static assets...${NC}"
cd frontend

# Install dependencies
echo -e "${YELLOW}  Installing dependencies...${NC}"
npm ci --prefer-offline --silent

# Build production assets
echo -e "${YELLOW}  Building production bundle...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

cd ..
echo ""

# Step 4: Tag Docker images
echo -e "${GREEN}[4/5] Tagging Docker images...${NC}"
docker tag steak-kenangan-backend:local steak-kenangan-backend:${GIT_HASH}
docker tag steak-kenangan-backend:local steak-kenangan-backend:latest

echo -e "${GREEN}✓ Images tagged:${NC}"
echo "  - steak-kenangan-backend:${GIT_HASH}"
echo "  - steak-kenangan-backend:latest"
echo ""

# Step 5: Save build info
echo -e "${GREEN}[5/5] Saving build info...${NC}"
cat > .build-info << EOF
BUILD_TAG=${GIT_HASH}
BUILD_DATE=${BUILD_DATE}
GIT_BRANCH=${GIT_BRANCH}
FRONTEND_BUILT=yes
EOF

echo -e "${GREEN}✓ Build info saved to .build-info${NC}"
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}           Build Complete!             ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Artifacts created:${NC}"
echo "  - Docker: steak-kenangan-backend:${GIT_HASH}"
echo "  - Docker: steak-kenangan-backend:latest"
echo "  - Static: frontend/dist/"
echo "  - Info:   .build-info"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Preview locally:  make preview-prod"
echo "  2. Deploy to prod:   make deploy-prod"
echo "  3. Or do both:       make sync-prod"
echo ""

# Show build info
echo -e "${BLUE}Build Info:${NC}"
cat .build-info
