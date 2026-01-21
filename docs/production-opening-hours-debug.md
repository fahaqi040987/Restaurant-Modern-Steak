# Production Opening Hours Indicator - Debug and Fix

## Issue Summary
The restaurant open/closed indicator in the footer was showing incorrect status in production. At Wednesday 22:31 WIB (after the 22:00 close time), the indicator showed green (OPEN) instead of red (CLOSED).

## Root Cause Analysis
After implementing comprehensive debugging tools, we identified that the **backend algorithm is working correctly**. The test `Wednesday 22:31 WIB - after close` correctly returns `false` (CLOSED).

**The most likely cause is one of the following:**

1. **Database timezone mismatch**: The `restaurant_info.timezone` field might not be set to `Asia/Jakarta`
2. **Database operating_hours mismatch**: The stored hours might be incorrect
3. **Caching**: The frontend might be caching the old API response
4. **Time synchronization**: The production server's system time might be incorrect

## Changes Made

### 1. Enhanced Debug Logging (`backend/internal/handlers/public.go`)
Added comprehensive logging to `GetRestaurantInfo`:
- Logs the raw timezone value from database
- Logs current UTC time and restaurant timezone time
- Logs weekday, hour, minute, second details
- Logs all operating_hours entries
- Logs the final `is_open_now` result

### 2. New Debug Endpoint
Created `/api/v1/public/health/open-status` that returns:
- Restaurant timezone from database
- Current UTC time
- Current time in restaurant timezone
- Current weekday and day name
- Final `is_open_now` calculation
- All operating_hours entries
- Today's schedule with detailed reasoning
- Server timezone information

### 3. Integration Tests (`backend/internal/models/public_test.go`)
Added `TestCalculateIsOpenNowEdgeCases` with 11 test cases:
- Wednesday 22:31 WIB - after close ✅
- Wednesday 22:00:00 WIB - exactly close time ✅
- Wednesday 21:59:59 WIB - one second before close ✅
- Wednesday 11:00:00 WIB - exactly open time ✅
- Wednesday 10:59:59 WIB - one second before open ✅
- Wednesday 15:00:00 WIB - midday ✅
- Sunday 14:00:00 WIB - closed day ✅
- Friday 22:30:00 WIB - before extended close ✅
- Friday 23:00:00 WIB - Friday extended close ✅
- Saturday 09:59:59 WIB - before early opening ✅
- Saturday 10:00:00 WIB - early opening ✅

All tests pass correctly.

### 4. Verification Script (`scripts/check-opening-hours-config.sh`)
Created a shell script to verify database configuration:
- Checks `restaurant_info.timezone` value
- Lists all `operating_hours` entries
- Validates day-of-week indexing
- Checks for common configuration errors
- Tests the specific Wednesday 22:31 scenario

## Deployment Instructions

### Step 1: Deploy Backend Changes
```bash
# From the project root
docker-compose -f docker-compose.prod.yml restart backend

# Or rebuild and redeploy
make dev
```

### Step 2: Verify Database Configuration
Run the verification script on production:
```bash
# Set your production database container name
export DB_CONTAINER=<your-postgres-container>

# Run the verification script
./scripts/check-opening-hours-config.sh
```

### Step 3: Check Debug Endpoint
After deployment, check the debug endpoint:
```bash
curl http://your-production-domain/api/v1/public/health/open-status | jq
```

Look for:
- `"restaurant_timezone": "Asia/Jakarta"` (or your expected timezone)
- `"is_open_now": false` (if it's currently after hours)
- Check the `"today_schedule"` section for detailed reasoning

### Step 4: Fix Database Issues (if found)
If the timezone is incorrect:
```sql
UPDATE restaurant_info SET timezone = 'Asia/Jakarta';
```

If operating hours are incorrect:
```sql
-- Update via admin panel (recommended) or direct SQL
UPDATE operating_hours
SET open_time = '11:00:00', close_time = '22:00:00'
WHERE day_of_week = 3;  -- Wednesday
```

### Step 5: Check Backend Logs
Look for the debug logging in the backend logs:
```bash
make logs-backend | grep OPEN_STATUS_DEBUG
```

You should see output like:
```
OPEN_STATUS_DEBUG: Restaurant timezone from DB: 'Asia/Jakarta'
OPEN_STATUS_DEBUG: Current UTC time: 2026-01-21 15:31:06 UTC
OPEN_STATUS_DEBUG: Current time in restaurant timezone (Asia/Jakarta): 2026-01-21 22:31:06 WIB
OPEN_STATUS_DEBUG: Weekday: 3 (Wednesday), Hour: 22, Minute: 31, Second: 6
OPEN_STATUS_DEBUG: Operating hour[3]: day=3 (Wednesday), open=11:00:00, close=22:00:00, is_closed=false
OPEN_STATUS_DEBUG: FINAL RESULT: is_open_now = false
```

### Step 6: Clear Frontend Cache (if needed)
If the issue persists after fixing the backend:
1. Clear browser cache
2. Or hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Or restart frontend container: `docker-compose restart frontend`

## Verification Checklist
- [ ] Backend changes deployed successfully
- [ ] Debug endpoint returns correct timezone
- [ ] Database timezone is `Asia/Jakarta`
- [ ] Operating hours match expected values
- [ ] Backend logs show correct calculation
- [ ] Frontend displays correct indicator
- [ ] Test at different times of day

## Testing Scenarios
Test the indicator at these times (all WIB):
- ✅ Wednesday 22:31 → CLOSED (after 22:00 close)
- ✅ Wednesday 21:59 → OPEN (before close)
- ✅ Wednesday 11:00 → OPEN (at open time)
- ✅ Sunday 14:00 → CLOSED (closed day)
- ✅ Friday 22:30 → OPEN (extended hours)
- ✅ Saturday 10:00 → OPEN (early opening)

## Next Steps if Issue Persists
1. Check production server system time: `date` and `timedatectl`
2. Verify timezone database is installed: `docker exec <postgres-container> tzdata`
3. Check for timezone environment variables in docker-compose
4. Review logs for any timezone conversion errors
5. Test with hardcoded timezone value temporarily

## Files Modified
- `backend/internal/handlers/public.go` - Enhanced logging + new debug endpoint
- `backend/internal/api/routes.go` - Added debug endpoint route
- `backend/internal/models/public_test.go` - Added edge case tests
- `scripts/check-opening-hours-config.sh` - New verification script
- `docs/production-opening-hours-debug.md` - This document

## Support
If the issue continues after following these steps:
1. Collect the debug endpoint output
2. Collect backend logs with `OPEN_STATUS_DEBUG` entries
3. Run the verification script and save output
4. Check production server time settings
5. Open a ticket with all collected information
