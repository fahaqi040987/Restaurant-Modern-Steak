#!/bin/bash
# Deploy Menu Page Sticky Fix to Production
# Date: 2026-01-22
# This script deploys the non-sticky search bar fix to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}  Steak Kenangan - Menu Page Fix Deployment${NC}"
echo -e "${BLUE}  Non-Sticky Search Bar${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Configuration - UPDATE THESE VALUES
PRODUCTION_SERVER="${PRODUCTION_SERVER:-fahaqi@localhost}"
PROJECT_DIR="${PROJECT_DIR:-/Users/fajarardhihaqi/Documents/Repository/project/Restaurant-Modern-Steak}"
BRANCH="fixing-error-linter-code"
COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Server: $PRODUCTION_SERVER"
echo "  Project: $PROJECT_DIR"
echo "  Branch: $BRANCH"
echo "  Compose: $COMPOSE_FILE"
echo ""

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo -e "${RED}✗ Wrong branch! Currently on '$CURRENT_BRANCH', need '$BRANCH'${NC}"
    echo "Please run: git checkout $BRANCH"
    exit 1
fi

echo -e "${GREEN}✓${NC} On correct branch: $BRANCH"
echo ""

# Step 1: Verify the fix is in the code
echo -e "${YELLOW}[Step 1/6]${NC} Verifying the fix is present..."
if grep -q "Filters Section - Static (non-sticky)" frontend/src/routes/site/menu.tsx; then
    echo -e "${GREEN}✓${NC} Non-sticky fix found in code"
else
    echo -e "${RED}✗${NC} Fix NOT found in code!"
    exit 1
fi

if grep -q "sticky top-16" frontend/src/routes/site/menu.tsx; then
    echo -e "${RED}✗${NC} Sticky classes still present! Fix not applied correctly."
    exit 1
fi

echo -e "${GREEN}✓${NC} Fix verified in code"
echo ""

# Step 2: Push to remote (if not already pushed)
echo -e "${YELLOW}[Step 2/6]${NC} Ensuring branch is pushed to remote..."
git push origin $BRANCH
echo -e "${GREEN}✓${NC} Branch pushed to remote"
echo ""

# Step 3: Confirm deployment
echo -e "${YELLOW}[Step 3/6]${NC} Deployment confirmation..."
echo -e "${RED}WARNING: This will deploy to production!${NC}"
read -p "Do you want to proceed with deployment? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi
echo ""

# Step 4: Deploy to production server
echo -e "${YELLOW}[Step 4/6]${NC} Deploying to production server..."
echo -e "${BLUE}Connecting to:${NC} $PRODUCTION_SERVER"

# Check if we can SSH to the server
if ! ssh -o ConnectTimeout=5 "$PRODUCTION_SERVER" "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${RED}✗ Cannot connect to production server${NC}"
    echo "Please check:"
    echo "  1. Server is accessible"
    echo "  2. SSH keys are configured"
    echo "  3. Server address is correct: $PRODUCTION_SERVER"
    echo ""
    echo "For local testing, set:"
    echo "  export PRODUCTION_SERVER=fahaqi@localhost"
    echo "  export PROJECT_DIR=/Users/fajarardhihaqi/Documents/Repository/project/Restaurant-Modern-Steak"
    exit 1
fi

# Execute deployment on production server
ssh "$PRODUCTION_SERVER" << ENDSSH
    set -e
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Production Server Deployment${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    # Navigate to project directory
    cd "$PROJECT_DIR"
    echo "📁 Working directory: \$(pwd)"
    echo ""

    # Check current branch
    CURRENT_BRANCH=\$(git branch --show-current)
    echo "📍 Current branch: \$CURRENT_BRANCH"

    # If not on the right branch, switch
    if [ "\$CURRENT_BRANCH" != "$BRANCH" ]; then
        echo "🔄 Switching to branch: $BRANCH"
        git checkout $BRANCH
    fi
    echo ""

    # Pull latest changes
    echo "📥 Pulling latest changes from origin/$BRANCH..."
    git pull origin $BRANCH
    echo -e "${GREEN}✓${NC} Changes pulled"
    echo ""

    # Verify the fix is present
    echo "🔍 Verifying fix in production code..."
    if grep -q "Filters Section - Static (non-sticky)" frontend/src/routes/site/menu.tsx; then
        echo -e "${GREEN}✓${NC} Fix verified in production code"
    else
        echo -e "${RED}✗${NC} Fix NOT found in production code!"
        exit 1
    fi
    echo ""

    # Rebuild frontend container
    echo "🔨 Rebuilding frontend container..."
    docker compose -f $COMPOSE_FILE build frontend
    echo -e "${GREEN}✓${NC} Frontend rebuilt"
    echo ""

    # Restart frontend service
    echo "🔄 Restarting frontend service..."
    docker compose -f $COMPOSE_FILE up -d frontend
    echo -e "${GREEN}✓${NC} Frontend restarted"
    echo ""

    # Wait for service to be ready
    echo "⏳ Waiting for frontend service to be ready (10 seconds)..."
    sleep 10
    echo ""

    # Check service status
    echo "📊 Service status:"
    docker compose -f $COMPOSE_FILE ps frontend
    echo ""

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Production deployment completed!${NC}"
    echo -e "${GREEN}========================================${NC}"
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Deployment to production server completed successfully!"
else
    echo -e "${RED}✗${NC} Deployment failed!"
    exit 1
fi
echo ""

# Step 5: Verify deployment
echo -e "${YELLOW}[Step 5/6]${NC} Verifying deployment..."
sleep 3

echo "Please open your browser and test:"
echo ""
echo "  🌐 URL: http://localhost:3000/site/menu (or your production URL)"
echo ""
echo "  ✅ Test Checklist:"
echo "     1. Navigate to the Menu page"
echo "     2. Scroll down through the menu items"
echo "     3. Verify search bar does NOT follow when scrolling"
echo "     4. Verify search bar stays under the heading text"
echo "     5. Test search functionality works"
echo "     6. Test category filters work"
echo ""

# Step 6: Post-deployment instructions
echo -e "${YELLOW}[Step 6/6]${NC} Post-deployment actions:"
echo ""
echo "1. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)"
echo "2. Test on mobile viewport"
echo "3. Test on different browsers"
echo "4. Monitor for any errors in browser console"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo "📋 Commit being deployed:"
git log -1 --oneline
echo ""

echo "🔄 Rollback plan (if needed):"
echo "  If issues occur, run:"
echo "  git checkout HEAD~1"
echo "  docker compose -f $COMPOSE_FILE build frontend"
echo "  docker compose -f $COMPOSE_FILE up -d frontend"
echo ""
