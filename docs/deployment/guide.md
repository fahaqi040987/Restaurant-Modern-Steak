# Production Deployment Guide
# Steak Kenangan Restaurant POS System

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Target Audience**: DevOps Engineers, System Administrators
**Deployment Time**: ~45 minutes

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Server Requirements (T102)](#server-requirements-t102)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [Cloudflare Setup (T103)](#cloudflare-setup-t103)
6. [Server Setup](#server-setup)
7. [Application Deployment](#application-deployment)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Security Hardening](#security-hardening)
10. [Troubleshooting (T104)](#troubleshooting-t104)
11. [Rollback Procedures](#rollback-procedures)
12. [Support & Escalation](#support--escalation)

---

## Overview

This guide covers deploying the **Steak Kenangan Restaurant POS System** to production using:

- **Docker Compose** for containerization
- **Cloudflare Tunnel** for zero-trust networking (no open ports)
- **PostgreSQL 15** for data persistence
- **Automated backups** with S3/Cloudflare R2 support

**Key Benefits**:
- ✅ No exposed ports (highest security)
- ✅ Automatic SSL/TLS via Cloudflare
- ✅ Built-in DDoS protection
- ✅ Global CDN for static assets
- ✅ Zero-downtime deployments
- ✅ Automated daily backups

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Edge Network                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SSL/TLS  │  CDN  │  WAF  │  DDoS Protection         │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ Cloudflare Tunnel (encrypted)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Your Server (Private)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Docker Compose Stack                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │   Frontend   │  │   Backend    │  │ PostgreSQL │ │  │
│  │  │   (Nginx)    │  │   (Go/Gin)   │  │    15      │ │  │
│  │  │   Port 80    │  │  Port 8080   │  │  Port 5432 │ │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │  │
│  │                                                        │  │
│  │  ┌──────────────┐                                     │  │
│  │  │  Cloudflared │  (Tunnel connector)                │  │
│  │  │   Sidecar    │                                     │  │
│  │  └──────────────┘                                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  /var/docker/restaurant-pos/  (application root)            │
│  /backups/                     (database backups)           │
└─────────────────────────────────────────────────────────────┘
```

**Traffic Flow**:
1. User requests → Cloudflare Edge (SSL termination)
2. Cloudflare Tunnel → Cloudflared container (encrypted tunnel)
3. Cloudflared → Backend (API) or Frontend (static assets)
4. Backend → PostgreSQL (internal network)

**No Open Ports**: All traffic goes through Cloudflare Tunnel. Server firewall blocks all inbound except SSH.

---

## Server Requirements (T102)

### Minimum Requirements

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| **CPU** | 2 vCPU | 4 vCPU | Additional CPU improves image processing |
| **RAM** | 4 GB | 8 GB | PostgreSQL + Backend + Frontend + Cloudflared |
| **Storage** | 40 GB SSD | 80 GB SSD | Includes database, backups, logs |
| **Network** | 100 Mbps | 1 Gbps | For QR code image uploads |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS | Other Linux distributions supported |

### Software Requirements

**Pre-installed**:
- Docker Engine 24.0+
- Docker Compose v2.20+
- Git 2.34+
- curl, jq (for health checks)

**Installation** (Ubuntu/Debian):
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose (v2)
sudo apt install docker-compose-plugin

# Install utilities
sudo apt install -y git curl jq htop net-tools

# Verify installations
docker --version         # Should show 24.0+
docker compose version   # Should show v2.20+
git --version
```

### Storage Planning

| Directory | Purpose | Size Estimate |
|-----------|---------|---------------|
| `/var/docker/restaurant-pos/` | Application root | 2 GB |
| `/var/docker/restaurant-pos/postgres-data/` | PostgreSQL data | 5-20 GB (grows over time) |
| `/var/docker/restaurant-pos/uploads/` | Product images, QR codes | 5-10 GB |
| `/backups/daily/` | Daily database backups (7 retained) | ~700 MB per backup × 7 |
| `/backups/weekly/` | Weekly backups (4 retained) | ~700 MB × 4 |
| `/backups/monthly/` | Monthly backups (3 retained) | ~700 MB × 3 |
| `/var/log/steak-kenangan/` | Application logs | 1-2 GB (rotated) |

**Total Storage**: ~40 GB (minimum), 80 GB (recommended for 6 months of growth)

### Network Requirements

**Outbound** (allow):
- Port 443 (HTTPS) - Cloudflare API, tunnel, package updates
- Port 80 (HTTP) - Package repositories
- Port 22 (SSH) - Git repository access (GitHub/GitLab)

**Inbound** (block all except):
- Port 22 (SSH) - Restrict to your IP addresses only

**No open ports for application** - All traffic routes through Cloudflare Tunnel

### Performance Benchmarks

Expected performance on recommended hardware (4 vCPU, 8 GB RAM):

| Metric | Expected Value | Test Command |
|--------|----------------|--------------|
| API Response Time | < 100ms (avg) | `curl -w "%{time_total}" https://your-domain.com/api/v1/health` |
| Database Query Time | < 50ms (avg) | Check `/api/v1/admin/dashboard/stats` |
| Frontend Load Time | < 2 seconds | Lighthouse test |
| Concurrent Users | 50-100 | Load test with k6 or Apache Bench |

---

## Pre-Deployment Checklist

Before starting deployment, ensure you have:

### Accounts & Access

- [ ] **Cloudflare Account** (free tier sufficient)
  - [ ] Email verified
  - [ ] Payment method added (for paid features, optional)
- [ ] **Domain Name** registered
  - [ ] Domain added to Cloudflare
  - [ ] Nameservers updated (allow 24-48 hours for propagation)
- [ ] **Server Access**
  - [ ] SSH key configured
  - [ ] sudo/root access available
  - [ ] Firewall rules reviewed
- [ ] **GitHub/GitLab Access**
  - [ ] Repository access granted
  - [ ] Deploy key configured (if private repo)

### Credentials Prepared

- [ ] **Database Credentials**
  - [ ] Strong password generated (20+ characters)
  - [ ] Saved in password manager
- [ ] **JWT Secret**
  - [ ] Random 64-character secret generated
  - [ ] Command: `openssl rand -hex 32`
- [ ] **Admin Account**
  - [ ] Initial admin username decided
  - [ ] Strong password prepared
- [ ] **Cloudflare Tunnel Token**
  - [ ] Token copied from Cloudflare dashboard
  - [ ] Stored securely

### Optional (Recommended)

- [ ] **S3/Cloudflare R2 Bucket** (for backup storage)
  - [ ] Bucket created
  - [ ] Access key and secret obtained
- [ ] **SMTP Credentials** (for email notifications)
  - [ ] SMTP server, username, password available
- [ ] **Sentry Account** (for error tracking)
  - [ ] DSN key obtained
  - [ ] Project created

---

## Cloudflare Setup (T103)

### Step 1: Create Cloudflare Account

1. Go to: https://dash.cloudflare.com/sign-up
2. Enter email and create password
3. Verify email address
4. (Optional) Add payment method for paid features

**Time**: 5 minutes

---

### Step 2: Add Domain to Cloudflare

1. **In Cloudflare Dashboard**:
   - Click "Add a Site"
   - Enter your domain (e.g., `steakkenangan.com`)
   - Select plan: **Free** (sufficient for most use cases)
   - Click "Add Site"

2. **Update Nameservers at Domain Registrar**:

   Cloudflare will show two nameservers like:
   ```
   elma.ns.cloudflare.com
   tim.ns.cloudflare.com
   ```

   Go to your domain registrar (GoDaddy, Namecheap, etc.) and:
   - Find DNS settings
   - Replace existing nameservers with Cloudflare's
   - Save changes

3. **Wait for Propagation**:
   - Takes 5 minutes to 24 hours (usually < 1 hour)
   - Cloudflare will email when active
   - Check status in dashboard

**Time**: 10 minutes (setup) + up to 24 hours (DNS propagation)

---

### Step 3: Create Cloudflare Tunnel

1. **Navigate to Zero Trust**:
   - In Cloudflare dashboard, go to: **Zero Trust** (left sidebar)
   - If first time: Click "Get Started" and complete onboarding

2. **Create Tunnel**:
   - Go to: **Networks > Tunnels**
   - Click "Create a tunnel"
   - Select connector type: **Cloudflared**
   - Enter tunnel name: `steak-kenangan-production`
   - Click "Save tunnel"

3. **Copy Tunnel Token**:

   Cloudflare will display a command like:
   ```bash
   sudo cloudflared service install eyJhIjoiOTBjY2QxZjc5ZmI4NDhlYmE4NWQ0YTE5MjI0NTk3ZmEiLCJ0IjoiM2JmMmU1ZjMtNmI3MC00MDY2LThjMDUtMzA3YjI4NTY1NDc2IiwicyI6Ik9UQTFZVGt6Wm1RdE5EazFNaTAwTldVMExUaGxZall0WVRZell6VTFNR1JsTW1NMiJ9
   ```

   **Copy only the token** (the long string starting with `eyJ`):
   ```
   eyJhIjoiOTBjY2QxZjc5ZmI4NDhlYmE4NWQ0YTE5MjI0NTk3ZmEiLCJ0IjoiM2JmMmU1ZjMtNmI3MC00MDY2LThjMDUtMzA3YjI4NTY1NDc2IiwicyI6Ik9UQTFZVGt6Wm1RdE5EazFNaTAwTldVMExUaGxZall0WVRZell6VTFNR1JsTW1NMiJ9
   ```

   Save this token securely. You'll need it in `.env.production`.

4. **Click "Next"** (we'll configure public hostnames after deployment)

**Time**: 5 minutes

---

### Step 4: Configure Public Hostnames

After deploying the application, return to Cloudflare to route traffic:

1. **In Cloudflare Dashboard**:
   - Go to: **Zero Trust > Networks > Tunnels**
   - Click on your tunnel: `steak-kenangan-production`
   - Go to tab: **Public Hostname**

2. **Add API Routes**:

   Click "Add a public hostname":
   - **Subdomain**: (leave empty)
   - **Domain**: steakkenangan.com
   - **Path**: `/api/*`
   - **Type**: HTTP
   - **URL**: `backend:8080`
   - Click "Save hostname"

3. **Add Frontend Routes**:

   Click "Add a public hostname" again:
   - **Subdomain**: (leave empty)
   - **Domain**: steakkenangan.com
   - **Path**: `/*`
   - **Type**: HTTP
   - **URL**: `frontend:80`
   - Click "Save hostname"

4. **Add WWW Redirect** (optional):

   Click "Add a public hostname":
   - **Subdomain**: `www`
   - **Domain**: steakkenangan.com
   - **Path**: `/*`
   - **Type**: HTTP
   - **URL**: `frontend:80`
   - Click "Save hostname"

**Final Configuration**:
| Hostname | Path | Service |
|----------|------|---------|
| steakkenangan.com | `/api/*` | http://backend:8080 |
| steakkenangan.com | `/*` | http://frontend:80 |
| www.steakkenangan.com | `/*` | http://frontend:80 |

**Time**: 5 minutes

---

### Step 5: Recommended Cloudflare Settings

#### SSL/TLS Settings

1. Go to: **SSL/TLS > Overview**
2. Set encryption mode: **Full (strict)** ✅ (most secure)
3. Enable: "Always Use HTTPS" ✅
4. Enable: "Automatic HTTPS Rewrites" ✅

#### Security Settings

1. Go to: **Security > Settings**
2. Set Security Level: **Medium** (blocks obvious threats)
3. Enable: "Bot Fight Mode" ✅ (free tier)
4. Enable: "Browser Integrity Check" ✅

#### Speed Settings

1. Go to: **Speed > Optimization**
2. Enable: "Auto Minify" ✅ (JavaScript, CSS, HTML)
3. Enable: "Brotli" ✅ (better compression)
4. Enable: "Early Hints" ✅ (faster page loads)

#### Caching Rules

1. Go to: **Caching > Configuration**
2. Set Browser Cache TTL: **4 hours**
3. Create Cache Rule:
   - **Name**: Static Assets
   - **If**: URI Path matches regex `\.(jpg|jpeg|png|gif|ico|svg|css|js|woff|woff2|ttf|eot)$`
   - **Then**: Cache level = Standard, Edge TTL = 1 month

#### Page Rules (Optional - Paid Feature)

If on paid plan, create these rules:

1. **API No Cache**:
   - URL: `steakkenangan.com/api/*`
   - Settings: Cache Level = Bypass

2. **Static Assets Cache**:
   - URL: `steakkenangan.com/assets/*`
   - Settings: Cache Level = Cache Everything, Edge TTL = 1 month

**Time**: 10 minutes

---

## Server Setup

### Step 1: Connect to Server

```bash
# SSH to your server
ssh user@your-server-ip

# Or if using SSH key
ssh -i ~/.ssh/your-key.pem user@your-server-ip
```

### Step 2: Create Application Directory

```bash
# Create application root
sudo mkdir -p /var/docker/restaurant-pos
sudo chown $USER:$USER /var/docker/restaurant-pos
cd /var/docker/restaurant-pos

# Create subdirectories
mkdir -p postgres-data uploads logs backups/{daily,weekly,monthly}
```

### Step 3: Clone Repository

**Option A: Public Repository**
```bash
git clone https://github.com/your-org/restaurant-pos.git .
```

**Option B: Private Repository** (with deploy key)
```bash
# Generate SSH key on server
ssh-keygen -t ed25519 -C "deploy@steakkenangan.com" -f ~/.ssh/deploy_key

# Copy public key
cat ~/.ssh/deploy_key.pub
# Add this public key to GitHub/GitLab (Deploy Keys)

# Clone repository
GIT_SSH_COMMAND='ssh -i ~/.ssh/deploy_key' git clone git@github.com:your-org/restaurant-pos.git .
```

### Step 4: Configure Environment Variables

```bash
# Copy production environment template
cp .env.example .env.production

# Edit with your credentials
nano .env.production
```

**Required Variables** (`.env.production`):
```bash
# Application
NODE_ENV=production
GO_ENV=production

# Database (PostgreSQL)
POSTGRES_USER=restaurant_admin
POSTGRES_PASSWORD=CHANGE_ME_TO_STRONG_PASSWORD_20_CHARS  # ⚠️ Change this!
POSTGRES_DB=restaurant_db
DATABASE_URL=postgres://restaurant_admin:CHANGE_ME_TO_STRONG_PASSWORD_20_CHARS@postgres:5432/restaurant_db?sslmode=disable

# Backend API
JWT_SECRET=CHANGE_ME_TO_RANDOM_64_CHAR_STRING  # ⚠️ Generate: openssl rand -hex 32
API_PORT=8080
ALLOWED_ORIGINS=https://steakkenangan.com,https://www.steakkenangan.com

# Frontend
VITE_API_URL=https://steakkenangan.com/api/v1

# Cloudflare Tunnel
TUNNEL_TOKEN=eyJhIjoiOTBjY2QxZjc5ZmI4NDhlYmE4NWQ0YTE5MjI0NTk3ZmEi...  # ⚠️ From Cloudflare dashboard

# Backup Configuration (Optional - for S3/R2)
S3_BUCKET=steak-kenangan-backups
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=your-r2-access-key
AWS_SECRET_ACCESS_KEY=your-r2-secret-key
AWS_DEFAULT_REGION=auto

# Sentry (Optional - Error Tracking)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# SMTP (Optional - Email Notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@steakkenangan.com
SMTP_PASSWORD=your-smtp-password
```

**Generate Strong Secrets**:
```bash
# JWT Secret (64 characters)
openssl rand -hex 32

# Database Password (32 characters)
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

**Save the file**: Ctrl+O, Enter, Ctrl+X

**Secure the file**:
```bash
chmod 600 .env.production
```

---

## Application Deployment

### Step 1: Build Production Images

```bash
cd /var/docker/restaurant-pos

# Pull latest code (if needed)
git pull origin main

# Build production Docker images
docker compose -f docker-compose.prod.yml build

# Expected output:
# [+] Building 120.3s (45/45) FINISHED
#  => [backend] ...
#  => [frontend] ...
```

**Time**: 3-5 minutes (first build), 1-2 minutes (subsequent builds)

### Step 2: Initialize Database

```bash
# Start PostgreSQL only (first time)
docker compose -f docker-compose.prod.yml up -d postgres

# Wait 10 seconds for PostgreSQL to initialize
sleep 10

# Verify PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres
# Should show: "Up" status

# Run database migrations
docker compose -f docker-compose.prod.yml exec postgres psql -U restaurant_admin -d restaurant_db -f /docker-entrypoint-initdb.d/01_schema.sql

# Load seed data (categories, demo products, tables)
docker compose -f docker-compose.prod.yml exec postgres psql -U restaurant_admin -d restaurant_db -f /docker-entrypoint-initdb.d/02_seed_data.sql
```

**Verify Database**:
```bash
# Check tables were created
docker compose -f docker-compose.prod.yml exec postgres psql -U restaurant_admin -d restaurant_db -c "\dt"

# Should show tables: users, products, categories, orders, etc.
```

### Step 3: Start All Services

```bash
# Start all services (backend, frontend, cloudflared)
docker compose -f docker-compose.prod.yml up -d

# Verify all containers are running
docker compose -f docker-compose.prod.yml ps

# Expected output:
# NAME                STATUS    PORTS
# backend             Up        8080/tcp
# frontend            Up        80/tcp
# postgres            Up        5432/tcp
# cloudflared         Up
```

**Check Logs**:
```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View backend logs only
docker compose -f docker-compose.prod.yml logs -f backend

# View Cloudflare tunnel logs
docker compose -f docker-compose.prod.yml logs -f cloudflared
```

**Look for**:
- Backend: `Server is running on port 8080`
- Frontend: `Nginx started successfully`
- Cloudflared: `Connection established` or `Registered tunnel connection`

### Step 4: Create Admin User

```bash
# Access backend container
docker compose -f docker-compose.prod.yml exec backend /bin/sh

# Inside container, use the admin creation endpoint (or run SQL)
# Option A: Via API (if you have curl in container)
curl -X POST http://localhost:8080/api/v1/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "ChangeMe123!",
    "full_name": "System Administrator",
    "role": "admin",
    "email": "admin@steakkenangan.com"
  }'

# Option B: Via PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U restaurant_admin -d restaurant_db

# In psql:
INSERT INTO users (username, password, full_name, role, email, is_active)
VALUES (
  'admin',
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36YPh6Bl9YBcwRnf9UxQk4O',  -- Password: admin123 (CHANGE IMMEDIATELY)
  'System Administrator',
  'admin',
  'admin@steakkenangan.com',
  true
);

# Exit psql
\q
```

**⚠️ IMPORTANT**: Change the admin password immediately after first login!

---

## Post-Deployment Verification

### Step 1: Check Service Health

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check container resource usage
docker stats --no-stream

# Check disk usage
df -h /var/docker/restaurant-pos
```

### Step 2: Test Local API

```bash
# Health check endpoint
curl http://localhost:8080/api/v1/health

# Expected response:
# {"success":true,"message":"Server is healthy","data":{"status":"healthy","database":"connected","timestamp":"2025-12-26T12:00:00Z"}}

# Test authentication
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Expected: JWT token in response
```

### Step 3: Test Public Domain

**Wait 2-5 minutes** for Cloudflare Tunnel to fully propagate, then:

```bash
# Test from your local machine (NOT the server)

# 1. Check DNS resolution
nslookup steakkenangan.com
# Should return Cloudflare IPs (104.x.x.x or 172.x.x.x)

# 2. Test HTTPS (should auto-redirect)
curl -I https://steakkenangan.com
# Expected: HTTP/2 200 OK

# 3. Test API through Cloudflare
curl https://steakkenangan.com/api/v1/health
# Expected: {"success":true,...}

# 4. Test frontend
curl https://steakkenangan.com
# Expected: HTML content with <!DOCTYPE html>
```

### Step 4: Browser Testing

1. **Open**: https://steakkenangan.com
2. **Verify**:
   - ✅ Page loads without SSL warnings
   - ✅ Logo and images display
   - ✅ Menu items load correctly
   - ✅ Login page accessible at `/login`
3. **Login**:
   - Username: `admin`
   - Password: `admin123` (or your custom password)
4. **Test Admin Dashboard**:
   - ✅ Dashboard statistics load
   - ✅ Orders page accessible
   - ✅ Products management works
   - ✅ No console errors (F12 Developer Tools)

### Step 5: Performance Testing

```bash
# Test API response time
curl -w "\nTime: %{time_total}s\n" https://steakkenangan.com/api/v1/health

# Expected: < 0.5 seconds

# Run Lighthouse audit (Chrome DevTools)
# Open DevTools (F12) > Lighthouse > Run Audit
# Expected scores:
# - Performance: > 80
# - Accessibility: > 90
# - Best Practices: > 90
# - SEO: > 85
```

---

## Security Hardening

### Firewall Configuration

```bash
# Allow SSH only from your IP
sudo ufw allow from YOUR_IP_ADDRESS to any port 22

# Block all other inbound (Cloudflare Tunnel handles everything)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Enable firewall
sudo ufw enable

# Verify
sudo ufw status
```

### Disable Password Authentication (SSH Keys Only)

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Change these lines:
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### Enable Fail2Ban (Brute Force Protection)

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Start service
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
```

### Set Up Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/restaurant-pos

# Add:
/var/docker/restaurant-pos/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}

# Test
sudo logrotate -d /etc/logrotate.d/restaurant-pos
```

### Enable Automated Security Updates

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades -y

# Enable
sudo dpkg-reconfigure --priority=low unattended-upgrades

# Verify
sudo systemctl status unattended-upgrades
```

---

## Troubleshooting (T104)

### Issue 1: Cloudflare Tunnel Not Connecting

**Symptoms**:
- `docker logs cloudflared` shows connection errors
- Domain returns 502 Bad Gateway
- Tunnel status in Cloudflare dashboard: "Down"

**Diagnosis**:
```bash
# Check Cloudflared logs
docker compose -f docker-compose.prod.yml logs cloudflared | tail -50

# Common error messages:
# - "Invalid token" → Tunnel token is wrong
# - "Connection refused" → Backend/frontend not running
# - "Unable to reach origin" → Wrong service name in Cloudflare config
```

**Solutions**:

**A. Invalid Token**:
```bash
# Verify token in .env.production
cat .env.production | grep TUNNEL_TOKEN

# If wrong, update token and restart
nano .env.production  # Update TUNNEL_TOKEN
docker compose -f docker-compose.prod.yml restart cloudflared
```

**B. Backend Not Reachable**:
```bash
# Check backend is running
docker compose -f docker-compose.prod.yml ps backend

# Test backend internally
docker compose -f docker-compose.prod.yml exec cloudflared curl http://backend:8080/api/v1/health

# If fails, restart backend
docker compose -f docker-compose.prod.yml restart backend
```

**C. DNS Issues**:
```bash
# Check if Docker internal DNS works
docker compose -f docker-compose.prod.yml exec cloudflared nslookup backend

# If fails, restart entire stack
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

**D. Cloudflare Public Hostname Misconfigured**:
- Go to Cloudflare dashboard: Zero Trust > Tunnels > [Your Tunnel] > Public Hostname
- Verify service names match: `backend:8080` and `frontend:80`
- Check Path settings: `/api/*` routes to backend, `/*` routes to frontend

**Time to Resolve**: 5-15 minutes

---

### Issue 2: 502 Bad Gateway

**Symptoms**:
- Browser shows "502 Bad Gateway" or "Cloudflare Error"
- API requests fail with 502

**Diagnosis**:
```bash
# Check which service is down
docker compose -f docker-compose.prod.yml ps

# Check backend health
curl http://localhost:8080/api/v1/health

# Check frontend
curl http://localhost:80
```

**Solutions**:

**A. Backend Crashed**:
```bash
# Check backend logs for errors
docker compose -f docker-compose.prod.yml logs backend | tail -100

# Common causes:
# - Database connection failed
# - Out of memory
# - Panic/crash in Go code

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

**B. Database Connection Lost**:
```bash
# Check PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# Test database connection
docker compose -f docker-compose.prod.yml exec postgres psql -U restaurant_admin -d restaurant_db -c "SELECT 1;"

# If fails, restart PostgreSQL
docker compose -f docker-compose.prod.yml restart postgres

# Wait 10 seconds, then restart backend
sleep 10
docker compose -f docker-compose.prod.yml restart backend
```

**C. Out of Memory**:
```bash
# Check memory usage
free -h
docker stats --no-stream

# If memory is full, identify memory hog
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"

# Restart services to free memory
docker compose -f docker-compose.prod.yml restart
```

**D. Frontend Serving Issues**:
```bash
# Check nginx config in frontend
docker compose -f docker-compose.prod.yml exec frontend cat /etc/nginx/conf.d/default.conf

# Test nginx syntax
docker compose -f docker-compose.prod.yml exec frontend nginx -t

# Restart frontend
docker compose -f docker-compose.prod.yml restart frontend
```

**Time to Resolve**: 5-20 minutes

---

### Issue 3: Database Connection Issues

**Symptoms**:
- Backend logs show "connection refused" or "database timeout"
- API returns 500 errors
- Login fails

**Diagnosis**:
```bash
# Check PostgreSQL container
docker compose -f docker-compose.prod.yml ps postgres

# Check PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres | tail -50

# Test connection from backend container
docker compose -f docker-compose.prod.yml exec backend /bin/sh
# Inside container:
nc -zv postgres 5432  # Should show "open"
exit
```

**Solutions**:

**A. PostgreSQL Not Running**:
```bash
# Start PostgreSQL
docker compose -f docker-compose.prod.yml up -d postgres

# Wait for it to be ready (10 seconds)
sleep 10

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

**B. Wrong Credentials**:
```bash
# Verify credentials match in .env.production and docker-compose.prod.yml
cat .env.production | grep POSTGRES

# Test credentials manually
docker compose -f docker-compose.prod.yml exec postgres psql -U restaurant_admin -d restaurant_db

# If access denied, reset password:
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres
# In psql:
ALTER USER restaurant_admin WITH PASSWORD 'your-new-password';
\q

# Update .env.production with new password
nano .env.production

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

**C. Connection Pool Exhausted**:
```bash
# Check active connections
docker compose -f docker-compose.prod.yml exec postgres psql -U restaurant_admin -d restaurant_db -c "SELECT count(*) FROM pg_stat_activity;"

# If high (>100), there might be connection leak
# Restart backend to reset connection pool
docker compose -f docker-compose.prod.yml restart backend
```

**D. Database Corrupted**:
```bash
# Check PostgreSQL logs for corruption errors
docker compose -f docker-compose.prod.yml logs postgres | grep -i error

# If corruption detected, restore from backup (see Rollback Procedures)
```

**Time to Resolve**: 5-30 minutes

---

### Issue 4: Frontend Not Loading

**Symptoms**:
- Blank page or "Cannot GET /"
- Static assets (CSS, JS) not loading
- Browser console shows 404 errors

**Diagnosis**:
```bash
# Check frontend container
docker compose -f docker-compose.prod.yml ps frontend

# Check frontend logs
docker compose -f docker-compose.prod.yml logs frontend

# Test frontend locally
curl http://localhost:80

# Check nginx config
docker compose -f docker-compose.prod.yml exec frontend cat /etc/nginx/conf.d/default.conf
```

**Solutions**:

**A. Frontend Container Not Running**:
```bash
# Start frontend
docker compose -f docker-compose.prod.yml up -d frontend

# Check logs for startup errors
docker compose -f docker-compose.prod.yml logs frontend
```

**B. Build Artifacts Missing**:
```bash
# Check if dist/ folder exists in frontend container
docker compose -f docker-compose.prod.yml exec frontend ls -la /usr/share/nginx/html

# If empty or missing, rebuild frontend
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

**C. Incorrect API URL**:
```bash
# Check VITE_API_URL in .env.production
cat .env.production | grep VITE_API_URL

# Should be: https://your-domain.com/api/v1
# If wrong, update and rebuild frontend:
nano .env.production  # Fix VITE_API_URL
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

**D. Cloudflare Caching Old Version**:
```bash
# Purge Cloudflare cache
# In Cloudflare dashboard:
# 1. Go to Caching > Configuration
# 2. Click "Purge Everything"
# 3. Wait 30 seconds
# 4. Reload browser with Ctrl+Shift+R (hard refresh)
```

**E. CORS Issues**:
```bash
# Check backend ALLOWED_ORIGINS includes your domain
cat .env.production | grep ALLOWED_ORIGINS

# Should include: https://steakkenangan.com,https://www.steakkenangan.com
# If missing, add and restart backend:
nano .env.production
docker compose -f docker-compose.prod.yml restart backend
```

**Time to Resolve**: 5-20 minutes

---

### Issue 5: Slow Performance

**Symptoms**:
- API responses > 2 seconds
- Pages take long to load
- Database queries are slow

**Diagnosis**:
```bash
# Check server load
uptime
top

# Check Docker stats
docker stats --no-stream

# Check disk I/O
iostat -x 1 5

# Test API response time
time curl https://your-domain.com/api/v1/health
```

**Solutions**:

**A. High CPU Usage**:
```bash
# Identify CPU hog
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}"

# If backend is high, check for slow queries
docker compose -f docker-compose.prod.yml logs backend | grep "query took"

# Restart service to clear stuck processes
docker compose -f docker-compose.prod.yml restart backend
```

**B. High Memory Usage**:
```bash
# Check memory per container
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"

# If PostgreSQL is high, restart it
docker compose -f docker-compose.prod.yml restart postgres
```

**C. Slow Database Queries**:
```bash
# Enable query logging temporarily
docker compose -f docker-compose.prod.yml exec postgres psql -U restaurant_admin -d restaurant_db

# In psql:
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1 second
SELECT pg_reload_conf();
\q

# Check logs after a few minutes
docker compose -f docker-compose.prod.yml logs postgres | grep "duration:"

# Identify slow queries and add indexes if needed
```

**D. Network Latency**:
```bash
# Test from your location to Cloudflare
ping your-domain.com

# Test backend-to-database latency
docker compose -f docker-compose.prod.yml exec backend time nc -zv postgres 5432

# If high (>50ms), database might be overloaded
```

**E. Cloudflare Cache Bypass**:
```bash
# Verify Cloudflare caching is working
curl -I https://your-domain.com/assets/index.js | grep cf-cache-status

# Should show: cf-cache-status: HIT
# If MISS or BYPASS, check Cloudflare cache rules
```

**Time to Resolve**: 10-60 minutes

---

### Issue 6: Authentication Failures

**Symptoms**:
- Login returns "Invalid credentials" for valid users
- JWT token validation fails
- Sessions expire immediately

**Diagnosis**:
```bash
# Check backend logs for auth errors
docker compose -f docker-compose.prod.yml logs backend | grep -i "auth\|jwt\|login"

# Test login API directly
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Solutions**:

**A. Wrong Password**:
```bash
# Reset user password in database
docker compose -f docker-compose.prod.yml exec postgres psql -U restaurant_admin -d restaurant_db

# Generate bcrypt hash for new password (use online tool or Go script)
# Example for password "NewPassword123!":
# $2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36YPh6Bl9YBcwRnf9UxQk4O

# Update user
UPDATE users SET password = '$2a$10$NEW_HASH_HERE' WHERE username = 'admin';
\q
```

**B. JWT Secret Mismatch**:
```bash
# Verify JWT_SECRET is set in .env.production
cat .env.production | grep JWT_SECRET

# If missing or changed, existing tokens will be invalid
# Users must re-login after changing JWT_SECRET

# Restart backend to load new secret
docker compose -f docker-compose.prod.yml restart backend
```

**C. Database User Not Found**:
```bash
# Check if user exists
docker compose -f docker-compose.prod.yml exec postgres psql -U restaurant_admin -d restaurant_db -c "SELECT username, role, is_active FROM users WHERE username = 'admin';"

# If no results, create admin user (see "Create Admin User" section)
```

**Time to Resolve**: 5-15 minutes

---

### Issue 7: Upload Failures (Images, Files)

**Symptoms**:
- Product image upload fails
- "413 Request Entity Too Large" error
- Files don't persist after container restart

**Diagnosis**:
```bash
# Check uploads directory
ls -lah /var/docker/restaurant-pos/uploads/

# Check volume mount in docker-compose.prod.yml
cat docker-compose.prod.yml | grep uploads

# Check nginx client_max_body_size (frontend container)
docker compose -f docker-compose.prod.yml exec frontend cat /etc/nginx/conf.d/default.conf | grep client_max_body_size
```

**Solutions**:

**A. Uploads Directory Not Writable**:
```bash
# Fix permissions
sudo chown -R $USER:$USER /var/docker/restaurant-pos/uploads
chmod -R 755 /var/docker/restaurant-pos/uploads

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

**B. File Size Limit**:
```bash
# Update nginx config in frontend container
docker compose -f docker-compose.prod.yml exec frontend /bin/sh

# Inside container:
sed -i 's/client_max_body_size.*/client_max_body_size 50M;/' /etc/nginx/conf.d/default.conf
nginx -t  # Test config
nginx -s reload  # Reload nginx
exit

# Or rebuild frontend with updated config
```

**C. Volume Not Mounted**:
```bash
# Verify volume is mounted
docker compose -f docker-compose.prod.yml exec backend ls -la /app/uploads

# If empty, check docker-compose.prod.yml volumes section
# Should have:
# volumes:
#   - ./uploads:/app/uploads

# Restart containers
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

**Time to Resolve**: 5-15 minutes

---

### Issue 8: Backup Failures

**Symptoms**:
- `backup.sh` exits with errors
- Backups not uploading to S3
- Backup files missing or corrupted

**Diagnosis**:
```bash
# Check backup logs
tail -100 /var/log/steak-kenangan/backup.log

# Test backup manually
cd /var/docker/restaurant-pos
bash scripts/backup.sh daily

# Check S3 credentials (if configured)
cat .env.production | grep -E "S3_|AWS_"
```

**Solutions**:

**A. PostgreSQL Not Accessible**:
```bash
# Check if PostgreSQL container is running
docker compose -f docker-compose.prod.yml ps postgres

# Test pg_dump from host
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U restaurant_admin restaurant_db > /tmp/test.sql

# If fails, check database credentials
```

**B. S3 Upload Fails**:
```bash
# Test S3 access manually
aws s3 ls s3://$S3_BUCKET --endpoint-url=$S3_ENDPOINT

# If access denied, check credentials:
cat .env.production | grep AWS_ACCESS_KEY_ID
cat .env.production | grep AWS_SECRET_ACCESS_KEY

# Verify bucket exists and credentials are correct
```

**C. Disk Full**:
```bash
# Check disk space
df -h /backups

# If full, manually delete old backups
find /backups -name "*.dump.gz" -mtime +30 -delete
```

**Time to Resolve**: 10-30 minutes

---

## Rollback Procedures

### Scenario 1: Bad Code Deployment

**Symptoms**: New deployment broke functionality

**Rollback Steps**:

```bash
cd /var/docker/restaurant-pos

# 1. Identify previous working version
git log --oneline -10

# 2. Checkout previous commit
git checkout <previous-commit-hash>

# 3. Rebuild containers
docker compose -f docker-compose.prod.yml build

# 4. Restart services
docker compose -f docker-compose.prod.yml up -d

# 5. Verify functionality
curl https://your-domain.com/api/v1/health

# 6. Monitor logs
docker compose -f docker-compose.prod.yml logs -f
```

**Time**: 5-10 minutes

---

### Scenario 2: Database Corruption or Data Loss

**Symptoms**: Database queries fail, data missing

**Restore Steps**:

```bash
cd /var/docker/restaurant-pos

# 1. Stop backend to prevent new writes
docker compose -f docker-compose.prod.yml stop backend

# 2. Identify latest good backup
ls -lth /backups/daily/*.dump.gz | head -5

# 3. Create emergency backup of current state (just in case)
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U restaurant_admin restaurant_db | gzip > /backups/emergency-$(date +%Y%m%d-%H%M%S).dump.gz

# 4. Run restore script
bash scripts/restore.sh /backups/daily/restaurant_backup_20251225_1400.dump.gz

# Script will:
# - Confirm restoration (type "RESTORE")
# - Drop existing database
# - Restore from backup
# - Verify data integrity

# 5. Restart backend
docker compose -f docker-compose.prod.yml start backend

# 6. Verify data
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Time**: 10-20 minutes

---

### Scenario 3: Full System Failure

**Symptoms**: Server crashed, data center outage

**Recovery Steps (New Server)**:

```bash
# On new server:

# 1. Install prerequisites (Docker, etc.)
curl -fsSL https://get.docker.com | sh

# 2. Clone repository
mkdir -p /var/docker/restaurant-pos
cd /var/docker/restaurant-pos
git clone https://github.com/your-org/restaurant-pos.git .

# 3. Restore environment variables (from backup or password manager)
nano .env.production
# Paste saved configuration

# 4. Download latest backup from S3
aws s3 cp s3://$S3_BUCKET/daily/latest.dump.gz /backups/daily/ --endpoint-url=$S3_ENDPOINT

# 5. Start PostgreSQL only
docker compose -f docker-compose.prod.yml up -d postgres
sleep 10

# 6. Restore database
bash scripts/restore.sh /backups/daily/latest.dump.gz --skip-confirm

# 7. Start all services
docker compose -f docker-compose.prod.yml up -d

# 8. Verify
curl https://your-domain.com/api/v1/health
```

**Time**: 30-60 minutes (depends on backup size and download speed)

---

## Support & Escalation

### Support Contacts

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| **Critical Outage** | devops@steakkenangan.com | 1 hour |
| **Bug Reports** | support@steakkenangan.com | 24 hours |
| **Feature Requests** | product@steakkenangan.com | 1 week |
| **Security Issues** | security@steakkenangan.com | 4 hours |

### Escalation Path

1. **Level 1**: Self-service using this guide (Troubleshooting section)
2. **Level 2**: Email support with logs and error details
3. **Level 3**: Emergency hotline (critical issues only): +62 821 1234 5678
4. **Level 4**: Emergency on-site support (server room access)

### Information to Include in Support Requests

When contacting support, include:

1. **System Information**:
   ```bash
   # Run this command and paste output:
   echo "Server: $(hostname)"
   echo "OS: $(lsb_release -d)"
   echo "Docker: $(docker --version)"
   echo "Disk: $(df -h /var/docker/restaurant-pos)"
   echo "Memory: $(free -h)"
   docker compose -f docker-compose.prod.yml ps
   ```

2. **Error Logs**:
   ```bash
   # Include relevant logs (last 100 lines):
   docker compose -f docker-compose.prod.yml logs --tail=100 backend > backend.log
   docker compose -f docker-compose.prod.yml logs --tail=100 postgres > postgres.log
   ```

3. **Steps to Reproduce**: Describe what you did before the issue occurred

4. **Impact**: Number of users affected, business impact

---

## Maintenance Schedule

### Daily

- Automated backup (runs at 2:00 AM server time via cron)
- Log rotation

### Weekly

- Review backup logs: `tail -100 /var/log/steak-kenangan/backup.log`
- Check disk space: `df -h`
- Review error logs: `docker compose logs | grep -i error`

### Monthly

- Test restore procedure (see Operations Runbook)
- Review Cloudflare analytics
- Update dependencies: `docker compose pull && docker compose up -d`
- Review user accounts and permissions

### Quarterly

- Disaster recovery drill (full system restore)
- Security audit
- Performance optimization review

---

## Additional Resources

- **API Documentation**: `/docs/api/openapi.yaml` (can be viewed with Swagger UI)
- **Operations Runbook**: `/docs/operations/runbook.md`
- **Architecture Spec**: `/specs/002-restaurant-management/spec.md`
- **Quickstart Guide**: `/specs/002-restaurant-management/quickstart.md`
- **GitHub Repository**: https://github.com/your-org/restaurant-pos

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-12-26 | DevOps Team | Initial production deployment guide |

---

**Status**: ✅ Production-Ready
**Reviewed By**: DevOps Team, Security Team
**Approved By**: CTO

---

## Quick Reference Card

### Essential Commands

```bash
# Deploy/Update
cd /var/docker/restaurant-pos && git pull && docker compose -f docker-compose.prod.yml up -d --build

# View Logs
docker compose -f docker-compose.prod.yml logs -f

# Restart Service
docker compose -f docker-compose.prod.yml restart <service-name>

# Backup
bash scripts/backup.sh daily

# Restore
bash scripts/restore.sh /backups/daily/latest.dump.gz

# Health Check
curl https://your-domain.com/api/v1/health
```

### Critical Files

- `.env.production` - Environment variables (NEVER commit)
- `docker-compose.prod.yml` - Service definitions
- `/backups/` - Database backups
- `/var/log/steak-kenangan/` - Application logs

### Emergency Contacts

- **Critical Issues**: devops@steakkenangan.com
- **Security**: security@steakkenangan.com
- **Hotline**: +62 821 1234 5678

---

**END OF DEPLOYMENT GUIDE**
