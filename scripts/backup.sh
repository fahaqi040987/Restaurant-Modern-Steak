#!/bin/bash
# Database Backup Script for Steak Kenangan Restaurant POS
# Usage: ./backup.sh [type]
# Types: daily (default), weekly, monthly, pre-deploy
#
# Features:
# - Compressed PostgreSQL backups using pg_dump
# - S3/Cloudflare R2 upload support
# - Retention policy (7 daily, 4 weekly, 3 monthly)
# - Backup integrity verification
# - Failure notifications via webhook

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-backups}"
DB_CONTAINER="${DB_CONTAINER:-pos-postgres-dev}"
DB_NAME="${DB_NAME:-pos_system}"
DB_USER="${DB_USER:-postgres}"

# Retention policies (days)
RETENTION_DAILY=7
RETENTION_WEEKLY=4  # weeks
RETENTION_MONTHLY=3  # months

# S3 Configuration (Cloudflare R2 compatible)
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
S3_ENDPOINT="${BACKUP_S3_ENDPOINT:-}"
S3_ACCESS_KEY="${BACKUP_S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${BACKUP_S3_SECRET_KEY:-}"

# Alert Configuration (optional)
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
    send_alert "🚨 Backup Failed: $1"
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

# Determine backup type
BACKUP_TYPE="${1:-daily}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="steak_kenangan_${BACKUP_TYPE}_${TIMESTAMP}.dump"

# Main script
echo -e "${GREEN}💾 Steak Kenangan - Database Backup${NC}"
echo "======================================"
echo ""
log "Starting $BACKUP_TYPE backup..."

# Check database container
check_database_container

# Create backup directory structure
mkdir -p "$BACKUP_DIR/${BACKUP_TYPE}"

# Get database statistics
log "Analyzing database contents..."
DB_STATS=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM orders) as orders,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM payments) as payments;
" 2>/dev/null || echo "0|0|0|0")

USER_COUNT=$(echo "$DB_STATS" | cut -d'|' -f1)
ORDER_COUNT=$(echo "$DB_STATS" | cut -d'|' -f2)
PRODUCT_COUNT=$(echo "$DB_STATS" | cut -d'|' -f3)
PAYMENT_COUNT=$(echo "$DB_STATS" | cut -d'|' -f4)

echo -e "${BLUE}Database Statistics:${NC}"
echo "  Users: $USER_COUNT"
echo "  Orders: $ORDER_COUNT"
echo "  Products: $PRODUCT_COUNT"
echo "  Payments: $PAYMENT_COUNT"
echo ""

# T076: Create compressed database dump using pg_dump
log "Creating database dump..."
docker exec "$DB_CONTAINER" pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -Fc \
    --no-owner \
    --no-privileges \
    > "$BACKUP_DIR/${BACKUP_TYPE}/$BACKUP_FILE" \
    || error "Failed to create database dump"

# Compress backup with gzip
log "Compressing backup..."
gzip "$BACKUP_DIR/${BACKUP_TYPE}/$BACKUP_FILE" \
    || error "Failed to compress backup"

BACKUP_FILE="${BACKUP_FILE}.gz"
BACKUP_PATH="$BACKUP_DIR/${BACKUP_TYPE}/$BACKUP_FILE"

# T077: Verify backup integrity
log "Verifying backup integrity..."
gzip -t "$BACKUP_PATH" || error "Backup integrity check failed"

BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
success "Backup created: $BACKUP_FILE (Size: $BACKUP_SIZE)"

# T078: Upload to S3/Cloudflare R2 (if configured)
if [ -n "$S3_BUCKET" ]; then
    log "Uploading to S3/Cloudflare R2..."

    # Configure AWS CLI for Cloudflare R2 or S3
    if [ -n "$S3_ACCESS_KEY" ] && [ -n "$S3_SECRET_KEY" ]; then
        export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY"
        export AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY"
    fi

    # Upload with endpoint URL (for Cloudflare R2)
    if [ -n "$S3_ENDPOINT" ]; then
        aws s3 cp "$BACKUP_PATH" "s3://$S3_BUCKET/${BACKUP_TYPE}/$BACKUP_FILE" \
            --endpoint-url "$S3_ENDPOINT" \
            || error "Failed to upload to S3"
    else
        aws s3 cp "$BACKUP_PATH" "s3://$S3_BUCKET/${BACKUP_TYPE}/$BACKUP_FILE" \
            || error "Failed to upload to S3"
    fi

    success "Uploaded to S3: s3://$S3_BUCKET/${BACKUP_TYPE}/$BACKUP_FILE"
else
    warning "S3 upload skipped - BACKUP_S3_BUCKET not configured"
fi

# T079: Implement backup rotation based on retention policy
cleanup_old_backups() {
    local type=$1
    local retention=$2
    local dir="$BACKUP_DIR/$type"

    log "Cleaning up $type backups older than $retention days..."

    # Local cleanup
    find "$dir" -name "*.dump.gz" -mtime +$retention -delete 2>/dev/null || true

    local removed_count=$(find "$dir" -name "*.dump.gz" -mtime +$retention 2>/dev/null | wc -l)
    if [ "$removed_count" -gt 0 ]; then
        success "Removed $removed_count old local backups"
    fi

    # S3 cleanup (if configured)
    if [ -n "$S3_BUCKET" ]; then
        local cutoff_date=$(date -d "-${retention} days" +%Y-%m-%d 2>/dev/null || date -v-${retention}d +%Y-%m-%d)

        if [ -n "$S3_ENDPOINT" ]; then
            aws s3 ls "s3://$S3_BUCKET/$type/" --endpoint-url "$S3_ENDPOINT" 2>/dev/null | \
                awk -v cutoff="$cutoff_date" '$1 < cutoff {print $4}' | \
                xargs -I {} aws s3 rm "s3://$S3_BUCKET/$type/{}" --endpoint-url "$S3_ENDPOINT" 2>/dev/null || true
        else
            aws s3 ls "s3://$S3_BUCKET/$type/" 2>/dev/null | \
                awk -v cutoff="$cutoff_date" '$1 < cutoff {print $4}' | \
                xargs -I {} aws s3 rm "s3://$S3_BUCKET/$type/{}" 2>/dev/null || true
        fi
    fi
}

# Apply retention policy based on backup type
case $BACKUP_TYPE in
    daily)
        cleanup_old_backups "daily" $RETENTION_DAILY
        ;;
    weekly)
        cleanup_old_backups "weekly" $((RETENTION_WEEKLY * 7))
        ;;
    monthly)
        cleanup_old_backups "monthly" $((RETENTION_MONTHLY * 30))
        ;;
    pre-deploy)
        # Keep last 5 pre-deploy backups
        log "Keeping last 5 pre-deploy backups..."
        ls -t "$BACKUP_DIR/pre-deploy/"*.dump.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
        ;;
esac

# List current backups
log "Current backups in $BACKUP_DIR/${BACKUP_TYPE}:"
ls -lh "$BACKUP_DIR/${BACKUP_TYPE}/"*.dump.gz 2>/dev/null || log "No backups found"

# Summary
echo ""
success "Backup completed successfully!"
echo ""
echo -e "${BLUE}Backup Summary:${NC}"
echo "  Type: $BACKUP_TYPE"
echo "  File: $BACKUP_FILE"
echo "  Size: $BACKUP_SIZE"
echo "  Location: $BACKUP_PATH"
echo "  Database Records:"
echo "    - Users: $USER_COUNT"
echo "    - Orders: $ORDER_COUNT"
echo "    - Products: $PRODUCT_COUNT"
echo "    - Payments: $PAYMENT_COUNT"
echo ""

# T080: Send success notification for scheduled backups
if [ "$BACKUP_TYPE" == "daily" ] && [ -n "$ALERT_WEBHOOK" ]; then
    send_alert "✅ Daily backup completed successfully ($BACKUP_SIZE)"
elif [ "$BACKUP_TYPE" == "weekly" ] && [ -n "$ALERT_WEBHOOK" ]; then
    send_alert "✅ Weekly backup completed successfully ($BACKUP_SIZE)"
elif [ "$BACKUP_TYPE" == "monthly" ] && [ -n "$ALERT_WEBHOOK" ]; then
    send_alert "✅ Monthly backup completed successfully ($BACKUP_SIZE)"
fi

log "To restore this backup, run: ./scripts/restore.sh $BACKUP_PATH"
echo ""

exit 0
