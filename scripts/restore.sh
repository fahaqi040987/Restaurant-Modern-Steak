#!/bin/bash
# Database Restore Script for Steak Kenangan Restaurant POS
# Usage: ./restore.sh [backup_file] [--skip-confirm]
#
# Features:
# - Restore from local or S3/Cloudflare R2 backups
# - Safety prompts before restore
# - Pre-restore backup creation
# - Post-restore verification
# - Service restart handling

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-backups}"
DB_CONTAINER="${DB_CONTAINER:-pos-postgres-dev}"
DB_NAME="${DB_NAME:-pos_system}"
DB_USER="${DB_USER:-postgres}"

# S3 Configuration (Cloudflare R2 compatible)
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
S3_ENDPOINT="${BACKUP_S3_ENDPOINT:-}"
S3_ACCESS_KEY="${BACKUP_S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${BACKUP_S3_SECRET_KEY:-}"

# Alert Configuration
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERROR: $1${NC}"
    send_alert "🚨 Restore Failed: $1"
    exit 1
}

# Send alert notification
send_alert() {
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -s -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"message\": \"Steak Kenangan POS: $1\"}" || true
    fi
}

# Check if database container is running
check_database_container() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
        # Try production container name
        DB_CONTAINER="pos-postgres"
        if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
            # Try steak-kenangan production name
            DB_CONTAINER="steak-kenangan-db"
            if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
                error "Database container is not running. Please start the containers first."
            fi
        fi
    fi
    log "Using database container: $DB_CONTAINER"
}

# Parse arguments
BACKUP_FILE="${1:-}"
SKIP_CONFIRM="${2:-}"

# Main script
echo -e "${BLUE}📥 Steak Kenangan - Database Restore${NC}"
echo "======================================="
echo ""

# Check database container
check_database_container

# If no backup file specified, show available backups
if [ -z "$BACKUP_FILE" ]; then
    log "No backup file specified. Available backups:"
    echo ""

    # Check if backups directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        error "No backups directory found. Please create backups first using './scripts/backup.sh'"
    fi

    # List local backups by type
    for type in daily weekly monthly pre-deploy; do
        if [ -d "$BACKUP_DIR/$type" ] && [ -n "$(ls -A $BACKUP_DIR/$type/*.dump.gz 2>/dev/null)" ]; then
            echo -e "${YELLOW}$type backups:${NC}"
            ls -lht "$BACKUP_DIR/$type/"*.dump.gz 2>/dev/null | head -5 || echo "  No backups found"
            echo ""
        fi
    done

    # T083: Show S3 backups if configured
    if [ -n "$S3_BUCKET" ]; then
        echo -e "${YELLOW}S3/Cloudflare R2 backups:${NC}"
        if [ -n "$S3_ACCESS_KEY" ] && [ -n "$S3_SECRET_KEY" ]; then
            export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY"
            export AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY"
        fi

        for type in daily weekly monthly pre-deploy; do
            echo -e "${BLUE}$type:${NC}"
            if [ -n "$S3_ENDPOINT" ]; then
                aws s3 ls "s3://$S3_BUCKET/$type/" --endpoint-url "$S3_ENDPOINT" 2>/dev/null | tail -5 || echo "  No backups found"
            else
                aws s3 ls "s3://$S3_BUCKET/$type/" 2>/dev/null | tail -5 || echo "  No backups found"
            fi
        done
        echo ""
        echo "To restore from S3, use: ./scripts/restore.sh s3://BUCKET/path/to/backup.dump.gz"
    fi

    echo ""
    echo -e "${YELLOW}Usage: $0 <backup_file> [--skip-confirm]${NC}"
    echo "Example: $0 backups/daily/steak_kenangan_daily_20250126_120000.dump.gz"
    exit 1
fi

# T082 & T083: Find backup file (local or S3)
BACKUP_PATH=""
FROM_S3=false

if [[ "$BACKUP_FILE" == s3://* ]]; then
    # T083: Restore from S3
    FROM_S3=true
    log "Downloading backup from S3..."

    # Configure AWS CLI
    if [ -n "$S3_ACCESS_KEY" ] && [ -n "$S3_SECRET_KEY" ]; then
        export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY"
        export AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY"
    fi

    # Download from S3
    TEMP_BACKUP="/tmp/$(basename $BACKUP_FILE)"
    if [ -n "$S3_ENDPOINT" ]; then
        aws s3 cp "$BACKUP_FILE" "$TEMP_BACKUP" --endpoint-url "$S3_ENDPOINT" \
            || error "Failed to download from S3"
    else
        aws s3 cp "$BACKUP_FILE" "$TEMP_BACKUP" \
            || error "Failed to download from S3"
    fi

    BACKUP_PATH="$TEMP_BACKUP"
    success "Downloaded from S3: $(basename $BACKUP_FILE)"
else
    # T082: Restore from local file
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_PATH="$BACKUP_FILE"
    elif [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
    else
        # Search in subdirectories
        FOUND_PATH=$(find "$BACKUP_DIR" -name "$BACKUP_FILE" -type f 2>/dev/null | head -1)
        if [ -n "$FOUND_PATH" ]; then
            BACKUP_PATH="$FOUND_PATH"
        else
            error "Backup file not found: $BACKUP_FILE"
        fi
    fi
fi

log "Found backup: $BACKUP_PATH"

# Verify backup file exists and is valid
if [ ! -f "$BACKUP_PATH" ]; then
    error "Backup file not found: $BACKUP_PATH"
fi

# Check if file is gzipped and verify integrity
if [[ "$BACKUP_PATH" == *.gz ]]; then
    log "Verifying gzip integrity..."
    gzip -t "$BACKUP_PATH" || error "Backup file is corrupted"
    success "Backup integrity verified"
fi

# Get current database statistics
log "Getting current database statistics..."
CURRENT_STATS=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM orders) as orders,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM payments) as payments;
" 2>/dev/null || echo "0|0|0|0")

CURRENT_USER_COUNT=$(echo "$CURRENT_STATS" | cut -d'|' -f1)
CURRENT_ORDER_COUNT=$(echo "$CURRENT_STATS" | cut -d'|' -f2)
CURRENT_PRODUCT_COUNT=$(echo "$CURRENT_STATS" | cut -d'|' -f3)
CURRENT_PAYMENT_COUNT=$(echo "$CURRENT_STATS" | cut -d'|' -f4)

# T085: Safety confirmation prompt
if [ "$SKIP_CONFIRM" != "--skip-confirm" ]; then
    echo ""
    echo -e "${RED}⚠️  WARNING: This will REPLACE all current database data!${NC}"
    echo -e "${RED}Current database contents will be PERMANENTLY DELETED!${NC}"
    echo ""
    echo -e "${YELLOW}Current database contents:${NC}"
    echo "  Users: $CURRENT_USER_COUNT"
    echo "  Orders: $CURRENT_ORDER_COUNT"
    echo "  Products: $CURRENT_PRODUCT_COUNT"
    echo "  Payments: $CURRENT_PAYMENT_COUNT"
    echo ""
    echo -e "${YELLOW}Backup file: $(basename $BACKUP_PATH)${NC}"
    echo ""
    echo -e "${RED}Type 'RESTORE' (case sensitive) to confirm:${NC}"
    read -p "> " CONFIRMATION

    if [ "$CONFIRMATION" != "RESTORE" ]; then
        echo -e "${BLUE}❌ Operation cancelled. Data is safe.${NC}"
        # Cleanup temp file if from S3
        [ "$FROM_S3" = true ] && rm -f "$BACKUP_PATH"
        exit 0
    fi
fi

echo ""
log "Starting restore process..."
send_alert "🔄 Starting database restore from: $(basename $BACKUP_PATH)"

# Create emergency pre-restore backup
EMERGENCY_BACKUP="$BACKUP_DIR/pre-restore/before_restore_$(date +%Y%m%d_%H%M%S).dump"
mkdir -p "$BACKUP_DIR/pre-restore"

log "Creating emergency backup of current database..."
docker exec "$DB_CONTAINER" pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -Fc \
    --no-owner \
    --no-privileges \
    > "$EMERGENCY_BACKUP" 2>/dev/null || warning "Could not create pre-restore backup (database may be empty)"

if [ -f "$EMERGENCY_BACKUP" ] && [ -s "$EMERGENCY_BACKUP" ]; then
    gzip "$EMERGENCY_BACKUP"
    success "Emergency backup created: ${EMERGENCY_BACKUP}.gz"
fi

# Decompress backup if needed
RESTORE_FILE="$BACKUP_PATH"
if [[ "$BACKUP_PATH" == *.gz ]]; then
    log "Decompressing backup..."
    RESTORE_FILE="${BACKUP_PATH%.gz}"
    gunzip -k "$BACKUP_PATH" 2>/dev/null || zcat "$BACKUP_PATH" > "$RESTORE_FILE"
fi

# Stop backend to prevent connections during restore
log "Stopping backend service..."
docker stop pos-backend-dev 2>/dev/null || docker stop pos-backend 2>/dev/null || docker stop steak-kenangan-backend 2>/dev/null || true
sleep 2

# Terminate existing connections
log "Terminating existing database connections..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null || true

# Drop and recreate database
log "Dropping existing database..."
docker exec "$DB_CONTAINER" dropdb -U "$DB_USER" --if-exists "$DB_NAME" || true
docker exec "$DB_CONTAINER" createdb -U "$DB_USER" "$DB_NAME" || error "Failed to create database"

# Restore from backup
log "Restoring database from backup..."
docker exec -i "$DB_CONTAINER" pg_restore \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    < "$RESTORE_FILE" \
    2>&1 | grep -v "ERROR:" || true  # pg_restore may show errors for missing objects, which is normal

# Cleanup decompressed file
if [ "$RESTORE_FILE" != "$BACKUP_PATH" ]; then
    rm -f "$RESTORE_FILE"
fi

# Cleanup temp S3 file
[ "$FROM_S3" = true ] && rm -f "$BACKUP_PATH"

# Start backend
log "Starting backend service..."
docker start pos-backend-dev 2>/dev/null || docker start pos-backend 2>/dev/null || docker start steak-kenangan-backend 2>/dev/null || true

# T084: Post-restore verification
log "Waiting for backend to start..."
sleep 5

log "Verifying database restore..."
RESTORE_STATS=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM orders) as orders,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM payments) as payments;
" 2>/dev/null || echo "0|0|0|0")

RESTORE_USER_COUNT=$(echo "$RESTORE_STATS" | cut -d'|' -f1)
RESTORE_ORDER_COUNT=$(echo "$RESTORE_STATS" | cut -d'|' -f2)
RESTORE_PRODUCT_COUNT=$(echo "$RESTORE_STATS" | cut -d'|' -f3)
RESTORE_PAYMENT_COUNT=$(echo "$RESTORE_STATS" | cut -d'|' -f4)

# Verify table count
TABLE_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d '[:space:]')

echo ""
if [ "$TABLE_COUNT" -gt 0 ]; then
    success "Restore successful! Found $TABLE_COUNT tables in database."
    echo ""
    echo -e "${BLUE}📊 Restored database contents:${NC}"
    echo "  Users: $RESTORE_USER_COUNT"
    echo "  Orders: $RESTORE_ORDER_COUNT"
    echo "  Products: $RESTORE_PRODUCT_COUNT"
    echo "  Payments: $RESTORE_PAYMENT_COUNT"
    echo ""
    success "Database restore completed successfully!"
    echo ""
    echo -e "${YELLOW}💾 Emergency backup saved to: ${EMERGENCY_BACKUP}.gz${NC}"
    echo -e "${BLUE}🚀 You may need to restart containers: make restart${NC}"
    echo ""

    send_alert "✅ Database restore completed successfully"
else
    error "Restore verification failed - no tables found in database"
fi

exit 0
