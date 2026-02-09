# Production Opening Hours Indicator Bug Fix

## Problem Analysis

The restaurant open/closed indicator in the footer shows incorrect status in production. Based on the information provided:

- **Production server time**: Wednesday 22:31:06 WIB (UTC+7)
- **Expected status**: CLOSED (closes at 22:00 WIB on Wednesday)
- **Actual status**: Shows as OPEN (green indicator)

## Root Cause Investigation

The code logic appears correct:
1. Backend fetches `timezone` from `restaurant_info` table
2. Converts `time.Now()` to restaurant's timezone
3. Compares against `operating_hours` for the current day

**Potential issues to verify:**

1. **Database timezone value mismatch**: The production `restaurant_info.timezone` field might not be set to `Asia/Jakarta`
2. **Database operating_hours mismatch**: The stored hours might not match expected values
3. **Day-of-week index mismatch**: Weekday() returns 0-6 (Sunday-Saturday), but database might use different indexing
4. **Time format parsing issue**: The TIME type from PostgreSQL might include date portion that isn't being parsed correctly

## Implementation Plan

### Step 1: Add Enhanced Debug Logging
Add comprehensive logging to trace the full flow:
- Log the raw timezone value from database
- Log the converted time in restaurant timezone
- Log each operating_hours entry being compared
- Log the final boolean result

### Step 2: Add Health Check Endpoint
Create `/api/v1/public/health/open-status` debug endpoint that returns:
- Current UTC time
- Current restaurant timezone time
- Database timezone value
- All operating_hours entries
- Final is_open_now calculation
- Detailed comparison showing why it returned true/false

### Step 3: Verify Database State
Add SQL query/check to verify:
- `SELECT timezone FROM restaurant_info`
- `SELECT day_of_week, open_time, close_time, is_closed FROM operating_hours ORDER BY day_of_week`

### Step 4: Fix Any Discrepancies
Based on findings, fix:
- Update incorrect timezone values
- Fix any day-of-week indexing issues
- Correct time format parsing if needed

### Step 5: Add Integration Tests
Add test that specifically validates:
- Wednesday 22:31 WIB = CLOSED (after 22:00 close)
- Wednesday 11:00 WIB = OPEN (at open time)
- Wednesday 21:59 WIB = OPEN (before close)
- Edge cases around midnight

## Deliverables

1. Enhanced debug logging in `backend/internal/handlers/public.go`
2. New debug endpoint `/api/v1/public/health/open-status`
3. Verification script to check production database state
4. Integration tests for opening hours calculation
5. Production deployment instructions

Would you like me to proceed with this implementation?