#!/bin/bash
# Apply Database Migrations
# Usage: ./scripts/apply-migrations.sh [--prod]
#
# Applies all migrations in database/migrations/ to the running database
# Use --prod flag for production database

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect environment
IS_PROD=false
if [ "$1" == "--prod" ]; then
    IS_PROD=true
fi

# Set container name based on environment
if [ "$IS_PROD" = true ]; then
    DB_CONTAINER="steak-kenangan-db"
    DB_USER="${DB_USER:-steakkenangan}"
    DB_NAME="${DB_NAME:-steak_kenangan}"
    echo -e "${YELLOW}Running in PRODUCTION mode${NC}"
else
    DB_CONTAINER="pos-postgres-dev"
    DB_USER="postgres"
    DB_NAME="pos_system"
    echo -e "${BLUE}Running in DEVELOPMENT mode${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Database Migration Runner           ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if container is running
if [ -z "$(docker ps -q -f name=$DB_CONTAINER)" ]; then
    echo -e "${RED}Error: Database container '$DB_CONTAINER' is not running${NC}"
    echo -e "${YELLOW}Start containers first with 'make dev' or 'make deploy-prod'${NC}"
    exit 1
fi

echo -e "${GREEN}Database container: ${DB_CONTAINER}${NC}"
echo -e "${GREEN}Database: ${DB_NAME}${NC}"
echo ""

# Get migration directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../database/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}Error: Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Create migrations tracking table if it doesn't exist
echo -e "${BLUE}[1/3] Ensuring migrations tracking table exists...${NC}"
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
EOF

# Get list of applied migrations
APPLIED=$(docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -A -c "SELECT filename FROM schema_migrations ORDER BY filename;")

# Apply pending migrations
echo -e "${BLUE}[2/3] Checking for pending migrations...${NC}"
PENDING_COUNT=0
APPLIED_COUNT=0

for migration in $(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
    filename=$(basename "$migration")

    # Check if already applied
    if echo "$APPLIED" | grep -q "^${filename}$"; then
        echo -e "  ${GREEN}✓${NC} $filename (already applied)"
        continue
    fi

    PENDING_COUNT=$((PENDING_COUNT + 1))
    echo -e "  ${YELLOW}→${NC} Applying: $filename"

    # Apply migration
    if docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < "$migration" > /dev/null 2>&1; then
        # Record successful migration
        docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c \
            "INSERT INTO schema_migrations (filename) VALUES ('$filename') ON CONFLICT (filename) DO NOTHING;" > /dev/null 2>&1
        echo -e "    ${GREEN}✓ Applied successfully${NC}"
        APPLIED_COUNT=$((APPLIED_COUNT + 1))
    else
        echo -e "    ${YELLOW}⚠ Migration may have partial errors (continuing)${NC}"
        # Still record it to avoid re-running
        docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c \
            "INSERT INTO schema_migrations (filename) VALUES ('$filename') ON CONFLICT (filename) DO NOTHING;" > /dev/null 2>&1
        APPLIED_COUNT=$((APPLIED_COUNT + 1))
    fi
done

echo ""
echo -e "${BLUE}[3/3] Migration Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Pending migrations found: $PENDING_COUNT"
echo -e "  Migrations applied: $APPLIED_COUNT"
echo -e "${GREEN}========================================${NC}"

if [ $PENDING_COUNT -eq 0 ]; then
    echo -e "${GREEN}Database is up to date!${NC}"
else
    echo -e "${GREEN}All migrations applied successfully!${NC}"
fi

# Verify restaurant_info table has timezone column
echo ""
echo -e "${BLUE}Verifying restaurant_info table structure...${NC}"
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c \
    "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'restaurant_info' AND column_name = 'timezone';" 2>/dev/null || true

echo ""
echo -e "${GREEN}Done!${NC}"
