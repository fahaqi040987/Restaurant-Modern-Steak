# Deploy Menu Page Sticky Fix to Production

## Current Status

**Development Branch**: `fixing-error-linter-code`
- Commit 885d84a: Fix to remove sticky behavior from search bar ✅
- File changed: `frontend/src/routes/site/menu.tsx`
- Status: Committed and ready to deploy

**Production Deployment Required**: 
- The fix needs to be deployed to the production environment
- Currently only exists in the development branch

## Deployment Options

### Option A: Push Current Branch and Deploy (Recommended)

Push the `fixing-error-linter-code` branch to remote and deploy to production.

**Steps**:
1. Push `fixing-error-linter-code` branch to remote
2. SSH into production server
3. Pull latest changes from `fixing-error-linter-code` branch
4. Rebuild frontend container
5. Restart services
6. Verify deployment

**Pros**:
- Fastest path to production
- Keeps all recent fixes together
- Maintains branch structure
- Easy to rollback if needed

**Cons**:
- Production will run on feature branch (not main/master)
- Need to ensure branch is stable

### Option B: Merge to Main/Master Then Deploy

Merge the fix to main/master branch first, then deploy from main.

**Steps**:
1. Checkout main/master branch
2. Merge `fixing-error-linter-code` into main
3. Push main to remote
4. SSH into production server
5. Pull from main branch
6. Rebuild frontend container
7. Restart services
8. Verify deployment

**Pros**:
- Production runs from main branch (standard practice)
- All fixes merged properly
- Better git history
- More professional workflow

**Cons**:
- Slower (requires merge)
- Potential merge conflicts
- Need to ensure no other unstable changes in main

### Option C: Cherry-Pick Specific Commit

Cherry-pick only the menu page fix commit to main/master.

**Steps**:
1. Checkout main/master branch
2. Cherry-pick commit 885d84a
3. Push to remote
4. Deploy to production

**Pros**:
- Only deploys the specific fix
- Clean history
- Minimal changes

**Cons**:
- Loses context of other related fixes
- More complex git operation
- May have dependency issues with other commits

## Recommended Approach

**I recommend Option A with a production branch update**:

1. Push current branch to remote
2. Update production to pull from `fixing-error-linter-code` branch
3. Deploy and test
4. If successful, merge to main/master later

**Rationale**:
- Fastest deployment path
- User can test immediately
- All recent fixes (footer undefined, sticky search, etc.) go together
- Can always merge to main later after validation

## Deployment Script

### Automated Deployment Script

```bash
#!/bin/bash
# Deploy menu page sticky fix to production

set -e

BRANCH="fixing-error-linter-code"
COMPOSE_FILE="docker-compose.prod.yml"
FRONTEND_SERVICE="frontend"

echo "=========================================="
echo "Deploy Menu Page Sticky Fix to Production"
echo "=========================================="
echo ""

# 1. Push current branch to remote
echo "[1/5] Pushing branch to remote..."
git push origin $BRANCH
echo "✓ Branch pushed"
echo ""

# 2. SSH to production and pull changes
echo "[2/5] Pulling changes on production server..."
# Replace with your actual SSH command
ssh user@production-server '
    cd /path/to/Restaurant-Modern-Steak
    git checkout fixing-error-linter-code
    git pull origin fixing-error-linter-code
    echo "✓ Changes pulled"
'
echo ""

# 3. Rebuild frontend container
echo "[3/5] Rebuilding frontend container..."
ssh user@production-server '
    cd /path/to/Restaurant-Modern-Steak
    docker compose -f docker-compose.prod.yml build frontend
    echo "✓ Frontend rebuilt"
'
echo ""

# 4. Restart services
echo "[4/5] Restarting services..."
ssh user@production-server '
    cd /path/to/Restaurant-Modern-Steak
    docker compose -f docker-compose.prod.yml up -d frontend
    echo "✓ Services restarted"
'
echo ""

# 5. Verify deployment
echo "[5/5] Verifying deployment..."
echo "Open production URL and test:"
echo "  - Navigate to /site/menu"
echo "  - Scroll down the page"
echo "  - Verify search bar does NOT follow"
echo "  - Verify search bar stays under heading"
echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
```

### Manual Deployment Steps

If you prefer manual deployment:

1. **Push to remote**:
   ```bash
   git push origin fixing-error-linter-code
   ```

2. **SSH into production server**:
   ```bash
   ssh user@your-production-server
   ```

3. **Navigate to project directory**:
   ```bash
   cd /path/to/Restaurant-Modern-Steak
   ```

4. **Pull latest changes**:
   ```bash
   git checkout fixing-error-linter-code
   git pull origin fixing-error-linter-code
   ```

5. **Rebuild frontend**:
   ```bash
   docker compose -f docker-compose.prod.yml build frontend
   ```

6. **Restart frontend service**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d frontend
   ```

7. **Verify deployment**:
   - Open production URL
   - Navigate to /site/menu
   - Test scrolling behavior
   - Verify search bar is static

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Fix tested in development environment
- [ ] Changes committed to git
- [ ] Branch pushed to remote
- [ ] Production server backup created
- [ ] Production database backed up
- [ ] Deployment script reviewed
- [ ] Rollback plan prepared

## Post-Deployment Verification

After deploying, verify:

- [ ] Production site loads correctly
- [ ] Menu page accessible at /site/menu
- [ ] Search bar visible on page load
- [ ] Search bar stays static when scrolling
- [ ] Search functionality works
- [ ] Category filters work
- [ ] No console errors
- [ ] Mobile responsive design intact
- [ ] Performance is good

## Rollback Plan

If issues occur after deployment:

1. **Quick rollback** (revert to previous version):
   ```bash
   ssh user@production-server
   cd /path/to/Restaurant-Modern-Steak
   git checkout HEAD~1  # Go back one commit
   docker compose -f docker-compose.prod.yml build frontend
   docker compose -f docker-compose.prod.yml up -d frontend
   ```

2. **Full rollback** (return to stable branch):
   ```bash
   ssh user@production-server
   cd /path/to/Restaurant-Modern-Steak
   git checkout main  # or previous stable branch
   docker compose -f docker-compose.prod.yml build frontend
   docker compose -f docker-compose.prod.yml up -d frontend
   ```

## Configuration Files

**Production docker-compose**: `docker-compose.prod.yml`
**Environment**: `.env.production`
**Deploy script**: `deploy.sh` or `deploy-production-fix.sh`

## Deployment Commands Reference

- **Build frontend**: `docker compose -f docker-compose.prod.yml build frontend`
- **Restart frontend**: `docker compose -f docker-compose.prod.yml up -d frontend`
- **View logs**: `docker compose -f docker-compose.prod.yml logs -f frontend`
- **Check status**: `docker compose -f docker-compose.prod.yml ps`

## Estimated Timeline

- Push to remote: 1 minute
- Pull on production: 2 minutes
- Rebuild frontend: 5-10 minutes
- Restart services: 1 minute
- Verification: 5 minutes

**Total**: ~15-20 minutes

## Which Option Would You Like?

Please choose:
- **Option A**: Deploy from `fixing-error-linter-code` branch (fastest)
- **Option B**: Merge to main first, then deploy (safest)
- **Option C**: Cherry-pick specific commit (minimal)

Would you like me to proceed with Option A (deploy from current branch)?