#!/bin/bash
# Production Deployment Script for Restaurant Open/Closed Status Fix
# Date: 2026-01-19
# This script deploys the timezone-aware open/closed status fix to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}  Steak Kenangan - Production Deployment${NC}"
echo -e "${BLUE}  Restaurant Open/Closed Status Fix${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Configuration
PRODUCTION_SERVER="${PRODUCTION_SERVER:-user@steakkenangan.com}"
PROJECT_DIR="${PROJECT_DIR:-/path/to/Restaurant-Modern-Steak}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Step 1: Verify local master branch is up to date
echo -e "${YELLOW}[Step 1/5]${NC} Verifying local master branch..."
git checkout master
git pull origin master
echo -e "${GREEN}✓${NC} Local master branch is up to date"
echo ""

# Step 2: Verify the fix is in the code
echo -e "${YELLOW}[Step 2/5]${NC} Verifying the fix is present..."
if grep -q "timezone" backend/internal/handlers/public.go; then
    echo -e "${GREEN}✓${NC} Timezone fix found in code"
else
    echo -e "${RED}✗${NC} Timezone fix NOT found in code!"
    exit 1
fi
echo ""

# Step 3: Deploy to production server
echo -e "${YELLOW}[Step 3/5]${NC} Deploying to production server..."
echo -e "${BLUE}Server:${NC} $PRODUCTION_SERVER"
echo -e "${BLUE}Project:${NC} $PROJECT_DIR"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with deployment? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi

# SSH into production server and deploy
ssh "$PRODUCTION_SERVER" << 'ENDSSH'
    set -e
    echo "🚀 Starting deployment on production server..."
    
    # Navigate to project directory
    cd "$PROJECT_DIR"
    
    # Pull latest changes from master
    echo "📥 Pulling latest changes from master..."
    git pull origin master
    
    # Rebuild and restart containers
    echo "🔨 Rebuilding Docker containers..."
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build --force-recreate
    
    # Wait for services to start
    echo "⏳ Waiting for services to start (30 seconds)..."
    sleep 30
    
    # Check service status
    echo "📊 Checking service status..."
    docker compose -f docker-compose.prod.yml ps
    
    # Check backend health
    echo "🏥 Checking backend health..."
    if docker compose -f docker-compose.prod.yml exec -T backend wget -q -O /dev/null http://localhost:8080/health; then
        echo "✓ Backend is healthy"
    else
        echo "⚠ Backend health check failed"
    fi
    
    # Show recent logs
    echo "📋 Recent backend logs:"
    docker compose -f docker-compose.prod.yml logs --tail 20 backend
    
    echo "✅ Deployment completed!"
ENDSSH

echo ""
echo -e "${GREEN}✓${NC} Deployment completed successfully!"
echo ""

# Step 4: Verify deployment
echo -e "${YELLOW}[Step 4/5]${NC} Verifying deployment..."
sleep 5
echo "Checking https://steakkenangan.com..."
if curl -s https://steakkenangan.com | grep -q "Jam tidak tersedia"; then
    echo -e "${YELLOW}⚠${NC} Site still shows 'Jam tidak tersedia'"
    echo "This might be due to:"
    echo "  1. CDN/caching - Clear browser cache and CDN cache"
    echo "  2. Frontend not rebuilt - Check frontend container logs"
    echo "  3. Database not updated - Check if migrations ran"
else
    echo -e "${GREEN}✓${NC} Site appears to be updated"
fi
echo ""

# Step 5: Final instructions
echo -e "${YELLOW}[Step 5/5]${NC} Post-deployment checklist:"
echo ""
echo "Please verify the following:"
echo "  1. Visit https://steakkenangan.com"
echo "  2. Check the 'JAM BUKA' section"
echo "  3. Verify it shows 'Buka Sekarang' or 'Tutup Sekarang' correctly"
echo "  4. Test with different operating hours in admin panel"
echo "  5. Clear browser cache (Ctrl+Shift+R) if needed"
echo ""
echo -e "${BLUE}Production deployment script completed!${NC}"
echo ""
echo "To rollback if needed:"
echo "  git checkout master"
echo "  git reset --hard e9e78b7^  # Previous commit"
echo "  git push origin master --force"
echo "  ./deploy-production-fix.sh"
