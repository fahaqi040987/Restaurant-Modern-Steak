#!/bin/bash
# deploy.sh - Production deployment script for Steak Kenangan POS
# Usage: ./deploy.sh [command]
# Commands: deploy (default), --rollback, --status, --logs

set -e

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_TAG=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        log_error "$ENV_FILE not found. Copy from .env.production.example and configure."
        exit 1
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "$COMPOSE_FILE not found"
        exit 1
    fi

    log_info "Prerequisites check passed"
}

# Docker compose command with env file
dc() {
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

# Health check
check_health() {
    log_info "Running health checks..."

    # Check if containers are running
    if dc ps --status running | grep -q "backend"; then
        log_info "Backend: Running"
    else
        log_warn "Backend: Not running"
        return 1
    fi

    if dc ps --status running | grep -q "frontend"; then
        log_info "Frontend: Running"
    else
        log_warn "Frontend: Not running"
        return 1
    fi

    if dc ps --status running | grep -q "db"; then
        log_info "Database: Running"
    else
        log_warn "Database: Not running"
        return 1
    fi

    if dc ps --status running | grep -q "cloudflared"; then
        log_info "Cloudflare Tunnel: Running"
    else
        log_warn "Cloudflare Tunnel: Not running"
        return 1
    fi

    # Check backend health endpoint
    if dc exec -T backend wget -q --spider http://localhost:8080/health 2>/dev/null; then
        log_info "Backend health endpoint: OK"
    else
        log_warn "Backend health endpoint: Not responding"
    fi

    log_info "Health check complete"
    return 0
}

# Deploy function
deploy() {
    log_info "Starting deployment..."

    # Save current commit for rollback
    BACKUP_TAG=$(git rev-parse HEAD)
    echo "$BACKUP_TAG" > .deploy_backup
    log_info "Saved rollback point: $BACKUP_TAG"

    # Pull latest changes
    log_info "Pulling latest changes..."
    git fetch origin
    git pull origin "$(git rev-parse --abbrev-ref HEAD)"

    # Build frontend (if not using pre-built images)
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        log_info "Building frontend..."
        cd frontend
        npm ci --production=false
        npm run build:prod
        cd ..
    fi

    # Pull latest Docker images (continue on error for rate limits)
    log_info "Pulling Docker images..."
    dc pull || log_warn "Some images failed to pull (may be rate limited). Continuing with cached images..."

    # Build and restart services
    log_info "Building and restarting services..."
    dc up -d --build --remove-orphans

    # Wait for services to start
    log_info "Waiting for services to start (30s)..."
    sleep 30

    # Health check
    if check_health; then
        log_info "Deployment successful!"
    else
        log_warn "Health check failed. Services may still be starting."
        log_info "Run './deploy.sh --status' to check again or './deploy.sh --rollback' to revert."
    fi
}

# Rollback function
rollback() {
    if [ ! -f ".deploy_backup" ]; then
        log_error "No rollback point found. Cannot rollback."
        exit 1
    fi

    BACKUP_TAG=$(cat .deploy_backup)
    log_info "Rolling back to: $BACKUP_TAG"

    # Reset to backup commit
    git reset --hard "$BACKUP_TAG"

    # Rebuild frontend
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        log_info "Rebuilding frontend..."
        cd frontend
        npm ci --production=false
        npm run build:prod
        cd ..
    fi

    # Restart services
    log_info "Restarting services..."
    dc up -d --build --remove-orphans

    # Wait and check health
    log_info "Waiting for services to start (30s)..."
    sleep 30
    check_health

    log_info "Rollback complete"
}

# Show status
show_status() {
    log_info "Current deployment status:"
    echo ""
    echo "Git commit: $(git rev-parse HEAD)"
    echo "Git branch: $(git rev-parse --abbrev-ref HEAD)"
    echo ""

    log_info "Container status:"
    dc ps
    echo ""

    check_health
}

# Show logs
show_logs() {
    local service=${1:-""}

    if [ -n "$service" ]; then
        dc logs -f "$service"
    else
        dc logs -f
    fi
}

# Main entry point
main() {
    check_prerequisites

    case "${1:-deploy}" in
        deploy|"")
            deploy
            ;;
        --rollback|-r)
            rollback
            ;;
        --status|-s)
            show_status
            ;;
        --logs|-l)
            show_logs "$2"
            ;;
        --help|-h)
            echo "Usage: ./deploy.sh [command]"
            echo ""
            echo "Commands:"
            echo "  deploy (default)  Pull latest changes and restart services"
            echo "  --rollback, -r    Rollback to previous deployment"
            echo "  --status, -s      Show current deployment status"
            echo "  --logs, -l [svc]  Show service logs (all or specific service)"
            echo "  --help, -h        Show this help message"
            ;;
        *)
            log_error "Unknown command: $1"
            echo "Run './deploy.sh --help' for usage"
            exit 1
            ;;
    esac
}

main "$@"
