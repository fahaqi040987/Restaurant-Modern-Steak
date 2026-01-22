## Deploy Restaurant Open/Closed Status Fix to Production (master Branch)

### Current Situation
- **Development Environment (001-static-header)**: ✅ Fix is working (commit `781d3f6`)
- **Production Environment (master branch)**: ❌ Still showing "Jam Tidak Tersedia" on https://steakkenangan.com
- **Production Branch**: `master` (NOT `main`)

### Branch Status Comparison

**Production Branch (master)**:
- Latest commit: `efc1e5d` - "Merge pull request #18 from fahaqi040987/001-fix-public-ux"
- Status: ❌ Missing the open/closed status indicator fix
- Does NOT have timezone support
- Does NOT have time format parsing fix

**Development Branch (001-static-header)**:
- Latest commit: `781d3f6` - "Update for indicator open close restaurant by adding and update database schema"
- Status: ✅ All fixes working
- Has timezone support
- Has time format parsing fix
- Has debug logging (optional)

### Deployment Steps

#### 1. Merge Feature Branch to master
```bash
# Switch to master branch
git checkout master

# Pull latest changes from remote
git pull origin master

# Merge the 001-static-header branch
git merge 001-static-header

# Push to remote master
git push origin master
```

#### 2. Deploy to Production Server
**Option A: Using deploy script** (if configured):
```bash
./deploy.sh deploy
```

**Option B: Manual deployment to VPS**:
```bash
# SSH into production server
ssh user@steakkenangan.com

# Navigate to project directory
cd /path/to/Restaurant-Modern-Steak

# Pull latest changes from master
git pull origin master

# Rebuild and restart containers
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build --force-recreate

# Wait for services to start
sleep 30

# Check logs
docker compose -f docker-compose.prod.yml logs -f backend
```

#### 3. Run Database Migrations (if needed)
The fix includes database schema changes:
```bash
# Check if migrations are needed
docker compose -f docker-compose.prod.yml exec -T backend ls /app/migrations/

# Apply migrations if not already applied
# Note: The timezone field migration (005) should be applied
```

#### 4. Verify Deployment
- Visit https://steakkenangan.com
- Check "JAM BUKA" section
- Verify it shows "Buka Sekarang" or "Tutup Sekarang" correctly
- Test with different operating hours in admin panel

### Changes That Will Be Deployed

From commit `781d3f6` (21 files changed, 699 insertions, 87 deletions):

**Backend Changes**:
- ✅ Added `timezone` column to `GetRestaurantInfo()` query
- ✅ Implemented timezone-aware time calculation using `time.LoadLocation()`
- ✅ Fixed time format parsing (extracts "03:00:00" from "0000-01-01T03:00:00Z")
- ✅ Added comprehensive debug logging (can be kept for troubleshooting)
- ✅ Enhanced error handling for invalid timezones

**Database Changes**:
- ✅ Added `timezone` column to `restaurant_info` table
- ✅ Migration 005: Add timezone field
- ✅ Migration 006: Fix invalid operating hours (00:00-00:00 entries)

**Frontend Changes**:
- ✅ Updated Footer component with bilingual support (Indonesian/English)
- ✅ Enhanced operating hours display with timezone abbreviation
- ✅ Added open/closed status badge (green for open, red for closed)
- ✅ Updated ContactInfo component

**Tests**:
- ✅ Added timezone-aware tests in `public_test.go`
- ✅ Added Footer component tests
- ✅ Added utility function tests

### Why Production Shows "Jam Tidak Tersedia"

The issue occurs because:
1. Production (`master`) doesn't have the timezone fix
2. Operating hours are returned in ISO format: `"0000-01-01T03:00:00Z"`
3. The old code tries to parse this with `"15:04:05"` format
4. Parsing fails → returns `false` → shows as "Tutup Sekarang" (closed)
5. Frontend displays "Jam Tidak Tersedia" (Time Not Available) as fallback

### Expected Outcome After Deployment

- ✅ Correct open/closed status based on restaurant's local timezone
- ✅ Proper time parsing from database
- ✅ "Buka Sekarang" (Open Now) when restaurant is open
- ✅ "Tutup Sekarang" (Closed Now) when restaurant is closed
- ✅ Timezone abbreviation displayed (WIB/WITA/WIT)
- ✅ Bilingual support (Indonesian & English)

### Rollback Plan (if needed)
```bash
# If something goes wrong, rollback to previous commit
git checkout master
git reset --hard efc1e5d  # Previous commit before merge
git push origin master --force

# Redeploy
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```