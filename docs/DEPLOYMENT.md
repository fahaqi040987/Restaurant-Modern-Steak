# VPS Production Deployment Guide

This guide covers deploying Steak Kenangan POS to a VPS with Docker and Cloudflare Tunnel.

## Prerequisites

Before deploying, ensure your VPS has:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Ubuntu/Debian | 22.04+ | `lsb_release -a` |
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| Git | 2.x+ | `git --version` |
| RAM | 2GB+ | `free -h` |
| Disk Space | 20GB+ | `df -h` |

### Install Docker (if not installed)

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker --version
docker compose version
```

## Cloudflare Tunnel Setup

Before deployment, create a Cloudflare tunnel:

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Networks > Tunnels**
3. Click **Create a tunnel**
4. Name it (e.g., "steak-kenangan")
5. Copy the tunnel token (starts with `eyJ...`)
6. Configure routes (ORDER MATTERS - most specific first):
   - `steakkenangan.com/api/*` → `http://backend:8080` (MUST be first)
   - `steakkenangan.com/*` → `http://frontend:80` (catch-all, MUST be last)

## Deployment Steps

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-username/Restaurant-Modern-Steak.git
cd Restaurant-Modern-Steak

# Checkout the main branch
git checkout main
```

**Expected size**: ~50MB (git-tracked files only)

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required configuration**:

```env
# Database (use your own secure password)
DB_USER=steakkenangan
DB_PASSWORD=Steakkenangan2025
DB_NAME=steak_kenangan
DB_HOST=db
DB_PORT=5432

# JWT Secret (generate a new one!)
JWT_SECRET=your-generated-secret-here

# CORS (your domain)
CORS_ALLOWED_ORIGINS=https://steakkenangan.com,https://www.steakkenangan.com

# Cloudflare (from step above)
CLOUDFLARE_TUNNEL_TOKEN=eyJ...your-token-here
```

Generate JWT secret:
```bash
openssl rand -base64 32
```

### Step 3: Build Frontend

```bash
# Install dependencies and build
cd frontend
npm ci
npm run build:prod
cd ..
```

### Step 4: Start Services

```bash
# Start all services in background (--env-file is REQUIRED)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Watch logs (Ctrl+C to exit)
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f
```

### Step 5: Verify Deployment

```bash
# Check container status
docker compose -f docker-compose.prod.yml --env-file .env.production ps

# Expected output:
# NAME                      STATUS
# steak-kenangan-backend    Up (healthy)
# steak-kenangan-db         Up (healthy)
# steak-kenangan-frontend   Up (healthy)
# steak-kenangan-tunnel     Up

# Check backend health via docker
docker compose -f docker-compose.prod.yml --env-file .env.production exec backend wget -q -O- http://localhost:8080/health

# Test external API endpoint
curl https://steakkenangan.com/api/v1/health
```

### Step 6: Access Application

- **Main site**: https://steakkenangan.com
- **Admin dashboard**: https://steakkenangan.com/admin
- **API**: https://steakkenangan.com/api/v1/

## Using the Deploy Script

After initial setup, use `deploy.sh` for updates:

```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Deploy updates
./deploy.sh

# Check status
./deploy.sh --status

# View logs
./deploy.sh --logs

# Rollback if needed
./deploy.sh --rollback
```

## Demo Accounts

All use password: `admin123`

| Role | Username | Access |
|------|----------|--------|
| Admin | admin | Full system access |
| Manager | manager1 | Business operations |
| Server | server1 | Dine-in orders |
| Counter | counter1 | All orders + payments |
| Kitchen | kitchen1 | Order preparation |

## Common Operations

**Note**: All commands require `--env-file .env.production`. Use `./deploy.sh` for convenience.

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f

# Specific service
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f backend
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f frontend
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f db
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.prod.yml --env-file .env.production restart

# Restart specific service
docker compose -f docker-compose.prod.yml --env-file .env.production restart backend
```

### Database Backup

```bash
# Create backup
docker compose -f docker-compose.prod.yml --env-file .env.production exec db pg_dump -U steakkenangan steak_kenangan > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T db psql -U steakkenangan steak_kenangan < backup_20260104.sql
```

### Database Shell

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec db psql -U steakkenangan steak_kenangan
```

### Stop Services

```bash
# Stop but keep volumes (data preserved)
docker compose -f docker-compose.prod.yml --env-file .env.production down

# Stop and remove volumes (DATA LOSS!)
docker compose -f docker-compose.prod.yml --env-file .env.production down -v
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose -f docker-compose.prod.yml --env-file .env.production logs <service-name>

# Common issues:
# - Missing .env.production file
# - Invalid CLOUDFLARE_TUNNEL_TOKEN
# - Port already in use
# - Missing --env-file flag (causes "variable not set" warnings)
```

### Database connection failed

```bash
# Verify database is running
docker compose -f docker-compose.prod.yml --env-file .env.production ps db

# Check credentials in .env.production
# Verify DB_HOST=db (not localhost)
```

### Tunnel not working

1. Check token in Cloudflare dashboard
2. Verify routes are configured (api/* MUST be before /*)
3. Check cloudflared logs:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production logs cloudflared
   ```

### API returns HTML instead of JSON

This means Cloudflare tunnel routing is misconfigured:
1. Go to Cloudflare Zero Trust Dashboard → Networks → Tunnels
2. Check route order: `/api/*` route MUST be listed BEFORE `/*` route
3. Save and wait for propagation

### Out of disk space

```bash
# Check disk usage
df -h

# Clean unused Docker resources
docker system prune -a

# Clean old logs
docker compose -f docker-compose.prod.yml --env-file .env.production logs --no-log-prefix | tail -1000 > /dev/null
```

## Security Checklist

- [ ] Changed default database password
- [ ] Generated unique JWT_SECRET
- [ ] CORS_ALLOWED_ORIGINS set to your domain only
- [ ] Cloudflare tunnel configured (no ports exposed)
- [ ] .env.production not committed to git
- [ ] Demo accounts disabled or passwords changed
- [ ] Firewall configured (UFW recommended)

## Monitoring Setup (Uptime Kuma)

The deployment includes [Uptime Kuma](https://github.com/louislam/uptime-kuma) for service health monitoring.

### Access Monitoring Dashboard

```bash
# Uptime Kuma is only accessible from localhost (security)
# Option 1: SSH tunnel from your local machine
ssh -L 3001:127.0.0.1:3001 user@your-vps-ip

# Then open in browser: http://localhost:3001
```

### Initial Setup

1. Open http://localhost:3001 (via SSH tunnel)
2. Create admin account on first visit
3. Add monitors for each service:

| Monitor | Type | URL/Command |
|---------|------|-------------|
| Backend API | HTTP(s) | `http://backend:8080/health` |
| Frontend | HTTP(s) | `http://frontend:80` |
| Database | TCP Port | `db:5432` |

### Recommended Monitors

```
Backend Health:
- Type: HTTP(s)
- URL: http://backend:8080/health
- Interval: 60 seconds
- Retries: 3

Frontend:
- Type: HTTP(s)
- URL: http://frontend:80
- Interval: 60 seconds

Database:
- Type: TCP Port
- Host: db
- Port: 5432
- Interval: 60 seconds
```

### Alert Notifications (Optional)

Configure alerts in Uptime Kuma settings:
- Telegram Bot
- Discord Webhook
- Slack Webhook
- Email (SMTP)

## Architecture Overview

```
Internet
    │
    ↓
Cloudflare (SSL, CDN, DDoS protection)
    │
    ↓ (tunnel)
┌─────────────────────────────────────────┐
│  VPS                                    │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │ cloudflared │───│    frontend     │  │
│  │  (tunnel)   │   │   (nginx:80)    │  │
│  └─────────────┘   └─────────────────┘  │
│         │                               │
│         │          ┌─────────────────┐  │
│         └──────────│    backend      │  │
│                    │  (go:8080)      │  │
│                    └────────┬────────┘  │
│                             │           │
│                    ┌────────┴────────┐  │
│                    │   PostgreSQL    │  │
│                    │   (db:5432)     │  │
│                    └─────────────────┘  │
└─────────────────────────────────────────┘
```

## Support

- Repository issues: [GitHub Issues](https://github.com/your-username/Restaurant-Modern-Steak/issues)
- Cloudflare status: [cloudflarestatus.com](https://www.cloudflarestatus.com/)
