#!/bin/bash
# Script to verify restaurant opening hours configuration in production database
# This helps diagnose issues with the open/closed indicator

set -e

echo "=========================================="
echo "Restaurant Opening Hours Configuration Check"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DB_CONTAINER is set
if [ -z "$DB_CONTAINER" ]; then
    DB_CONTAINER="postgres"
fi

# Check if DATABASE_URL is set, otherwise use default
if [ -z "$DATABASE_URL" ]; then
    echo "Using default database connection..."
    DB_CMD="docker exec $DB_CONTAINER psql -U postgres -d restaurant_pos -c"
else
    echo "Using custom database connection..."
    DB_CMD="psql \"$DATABASE_URL\" -c"
fi

echo "1. Checking restaurant_info table..."
echo "--------------------------------------"
$DB_CMD "SELECT id, name, timezone, created_at, updated_at FROM restaurant_info;" 2>/dev/null || echo "Failed to query restaurant_info"
echo ""

echo "2. Checking operating_hours configuration..."
echo "----------------------------------------------"
$DB_CMD "SELECT day_of_week, open_time, close_time, is_closed FROM operating_hours ORDER BY day_of_week;" 2>/dev/null || echo "Failed to query operating_hours"
echo ""

echo "3. Verifying day-of-week indexing..."
echo "-------------------------------------"
echo "Expected: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday"
$DB_CMD "SELECT day_of_week, open_time, close_time, is_closed,
         CASE day_of_week
           WHEN 0 THEN 'Sunday'
           WHEN 1 THEN 'Monday'
           WHEN 2 THEN 'Tuesday'
           WHEN 3 THEN 'Wednesday'
           WHEN 4 THEN 'Thursday'
           WHEN 5 THEN 'Friday'
           WHEN 6 THEN 'Saturday'
           ELSE 'Unknown'
         END as day_name
         FROM operating_hours ORDER BY day_of_week;" 2>/dev/null || echo "Failed to query day names"
echo ""

echo "4. Checking for common issues..."
echo "--------------------------------"
echo ""

# Check timezone
TIMEZONE=$($DB_CMD "SELECT timezone FROM restaurant_info;" 2>/dev/null | tail -n 1 | xargs)
if [ "$TIMEZONE" = "Asia/Jakarta" ] || [ "$TIMEZONE" = "Asia/Makassar" ] || [ "$TIMEZONE" = "Asia/Jayapura" ]; then
    echo -e "${GREEN}✓ Timezone is set correctly: $TIMEZONE${NC}"
else
    echo -e "${YELLOW}⚠ Timezone might be incorrect: '$TIMEZONE' (expected: Asia/Jakarta)${NC}"
fi
echo ""

# Check for 00:00 times on non-closed days
INVALID_TIMES=$($DB_CMD "SELECT COUNT(*) FROM operating_hours WHERE is_closed = false AND (open_time = '00:00:00' OR close_time = '00:00:00');" 2>/dev/null | tail -n 1 | xargs)
if [ "$INVALID_TIMES" = "0" ]; then
    echo -e "${GREEN}✓ No invalid 00:00 times found on open days${NC}"
else
    echo -e "${RED}✗ Found $INVALID_TIMES operating hours with 00:00 time on open days${NC}"
fi
echo ""

# Check for close time before open time
INVALID_RANGE=$($DB_CMD "SELECT COUNT(*) FROM operating_hours WHERE is_closed = false AND open_time >= close_time;" 2>/dev/null | tail -n 1 | xargs)
if [ "$INVALID_RANGE" = "0" ]; then
    echo -e "${GREEN}✓ All open times are before close times${NC}"
else
    echo -e "${RED}✗ Found $INVALID_RANGE operating hours with close time before or equal to open time${NC}"
fi
echo ""

# Check that all 7 days are configured
DAY_COUNT=$($DB_CMD "SELECT COUNT(*) FROM operating_hours;" 2>/dev/null | tail -n 1 | xargs)
if [ "$DAY_COUNT" = "7" ]; then
    echo -e "${GREEN}✓ All 7 days of the week are configured${NC}"
else
    echo -e "${YELLOW}⚠ Found $DAY_COUNT days configured (expected 7)${NC}"
fi
echo ""

echo "5. Test specific scenario (Wednesday 22:31:06 WIB)..."
echo "-----------------------------------------------------"
echo "This tests the production issue: Wednesday 22:31 WIB should be CLOSED"
echo ""

# Get Wednesday hours
WED_HOURS=$($DB_CMD "SELECT open_time, close_time, is_closed FROM operating_hours WHERE day_of_week = 3;" 2>/dev/null | tail -n +2 | head -n 1)
if [ -n "$WED_HOURS" ]; then
    WED_OPEN=$(echo $WED_HOURS | awk '{print $1}')
    WED_CLOSE=$(echo $WED_HOURS | awk '{print $2}')
    WED_CLOSED=$(echo $WED_HOURS | awk '{print $3}')

    if [ "$WED_CLOSED" = "t" ]; then
        echo -e "${GREEN}Wednesday is marked as closed - correct${NC}"
    else
        # Parse times
        WED_CLOSE_HOUR=$(echo $WED_CLOSE | cut -d: -f1)
        TEST_HOUR=22

        if [ $TEST_HOUR -ge $WED_CLOSE_HOUR ]; then
            echo -e "${GREEN}✓ Wednesday 22:31 is AFTER close time ($WED_CLOSE) - should be CLOSED${NC}"
        else
            echo -e "${RED}✗ Wednesday 22:31 is BEFORE close time ($WED_CLOSE) - should be OPEN${NC}"
        fi

        echo "  Wednesday hours: $WED_OPEN - $WED_CLOSE"
        echo "  Test time: 22:31:06"
    fi
else
    echo -e "${RED}✗ Could not find Wednesday operating hours${NC}"
fi
echo ""

echo "=========================================="
echo "Check complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. If timezone is incorrect, update: UPDATE restaurant_info SET timezone = 'Asia/Jakarta';"
echo "2. If operating_hours are incorrect, update via admin panel or direct SQL"
echo "3. Restart the backend service to pick up any database changes"
echo "4. Test the debug endpoint: curl http://localhost:8080/api/v1/public/health/open-status"
echo ""
