# Operations Runbook

**Restaurant POS System - Steak Kenangan**  
**Version**: 1.0.0  
**Last Updated**: 2025-12-26

## Table of Contents

1. [Overview](#overview)
2. [Monitoring Setup](#monitoring-setup)
3. [Health Endpoints](#health-endpoints)
4. [Alert Configuration](#alert-configuration)
5. [Logging and Debugging](#logging-and-debugging)
6. [Error Tracking](#error-tracking)
7. [Common Operations](#common-operations)
8. [Backup and Restore](#backup-and-restore)
9. [Incident Response](#incident-response)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This runbook provides operational procedures for monitoring, maintaining, and troubleshooting the Restaurant POS system in production.

**Architecture Components**:
- **Backend**: Go API server (port 8080)
- **Frontend**: React SPA served via Nginx
- **Database**: PostgreSQL 14+
- **Monitoring**: Uptime Kuma
- **Error Tracking**: Sentry (optional)
- **Tunnel**: Cloudflare Tunnel (cloudflared)

---

## Monitoring Setup

### Uptime Kuma Installation

Uptime Kuma is a self-hosted monitoring tool that checks service availability and sends alerts.

#### 1. Uptime Kuma Configuration in Docker Compose

The production docker-compose already includes Uptime Kuma:

```yaml
uptime-kuma:
  image: louislam/uptime-kuma:1
  container_name: uptime-kuma
  volumes:
    - uptime-kuma-data:/app/data
  ports:
    - "3001:3001"
  restart: unless-stopped
  networks:
    - pos-network
```

#### 2. Initial Setup

1. **Start Uptime Kuma**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d uptime-kuma
   ```

2. **Access the UI**:
   - Navigate to `http://your-server-ip:3001`
   - Create admin account on first visit
   - **Important**: Change default password immediately

3. **Configure Dashboard**:
   - Set timezone to `Asia/Jakarta`
   - Enable authentication
   - Configure notification methods (see Alert Configuration section)

#### 3. Add Monitoring Checks

Configure the following monitors in Uptime Kuma:

| Monitor Name | Type | URL/Target | Interval | Retries |
|--------------|------|------------|----------|---------|
| Backend Health | HTTP(s) | `https://your-domain.com/health` | 60s | 3 |
| Backend API | HTTP(s) | `https://your-domain.com/api/v1/public/menu` | 120s | 2 |
| Frontend | HTTP(s) | `https://your-domain.com/` | 60s | 3 |
| Database (via backend) | HTTP(s) | `https://your-domain.com/health` | 300s | 2 |
| SSL Certificate | SSL Certificate | `your-domain.com` | 86400s (daily) | 1 |

#### 4. Advanced Monitoring

**Response Time Monitoring**:
- Set acceptable response time: < 500ms for health endpoint
- Set acceptable response time: < 2s for API endpoints
- Enable push notifications for degraded performance

**Uptime Percentage**:
- Target: 99.9% uptime (allows ~43 minutes downtime/month)
- Configure SLA notifications

**Status Page** (Optional):
- Enable public status page in Uptime Kuma settings
- Share with staff: `http://your-server-ip:3001/status/your-slug`

---

## Health Endpoints

The backend provides comprehensive health check endpoints for monitoring.

### Primary Health Endpoint

**Endpoint**: `GET /health`

**Response** (Healthy):
```json
{
  "status": "healthy",
  "timestamp": "2025-12-26T10:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "response_time": "5ms",
      "connection_pool": {
        "open": 5,
        "in_use": 2,
        "idle": 3
      }
    },
    "api": {
      "status": "healthy",
      "uptime": "72h15m30s"
    }
  }
}
```

**Response** (Unhealthy):
```json
{
  "status": "unhealthy",
  "timestamp": "2025-12-26T10:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "unhealthy",
      "error": "connection refused",
      "response_time": "timeout"
    }
  }
}
```

**HTTP Status Codes**:
- `200 OK`: All checks passed (healthy)
- `503 Service Unavailable`: One or more checks failed (unhealthy)

### API Version Endpoint

**Endpoint**: `GET /api/v1/health`

Returns same health data with API version prefix. Use this for API-specific health monitoring.

### Monitoring Endpoints

| Endpoint | Purpose | Cache | Authentication |
|----------|---------|-------|----------------|
| `/health` | Overall system health | None | No |
| `/api/v1/health` | API health check | None | No |
| `/api/v1/public/menu` | Frontend API test | Yes | No |
| `/api/v1/admin/users` | Backend auth test | No | Yes (JWT) |

**Best Practices**:
- Use `/health` for basic uptime monitoring
- Monitor `/api/v1/public/menu` to verify API + database connectivity
- Test authenticated endpoints separately for RBAC verification

---

## Alert Configuration

Configure alerts to notify staff when issues are detected.

### Telegram Alerts (Recommended)

**Why Telegram**: Fast delivery, mobile push notifications, works in Indonesia, group chat support.

#### 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow prompts
3. Save the **Bot Token** (e.g., `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
4. Create a group for alerts or note your personal **Chat ID**

#### 2. Get Chat ID

**For Personal Chat**:
1. Message your bot with `/start`
2. Visit: `https://api.telegram.org/bot<YourBotToken>/getUpdates`
3. Find `"chat":{"id":123456789}` in response

**For Group Chat**:
1. Add bot to group
2. Send a message in the group
3. Visit: `https://api.telegram.org/bot<YourBotToken>/getUpdates`
4. Find `"chat":{"id":-987654321}` (negative ID for groups)

#### 3. Configure in Uptime Kuma

1. Go to **Settings → Notifications**
2. Click **Add New Notification**
3. Select **Telegram**
4. Enter:
   - **Bot Token**: Your bot token from BotFather
   - **Chat ID**: Your personal or group chat ID
   - **Friendly Name**: `POS Alerts - Telegram`
5. Click **Test** to verify
6. Click **Save**

#### 4. Assign to Monitors

- Edit each monitor
- In **Notifications** section, enable `POS Alerts - Telegram`
- Save monitor

**Alert Example**:
```
🔴 Backend Health is DOWN
URL: https://your-domain.com/health
Error: Connection timeout
Time: 2025-12-26 10:30:45 WIB
```

### Email Alerts

#### Gmail SMTP Configuration

1. In Uptime Kuma: **Settings → Notifications → Add New Notification**
2. Select **Email (SMTP)**
3. Enter:
   - **SMTP Host**: `smtp.gmail.com`
   - **SMTP Port**: `587`
   - **Security**: `TLS`
   - **Username**: `your-email@gmail.com`
   - **Password**: Use [App Password](https://myaccount.google.com/apppasswords), not your Gmail password
   - **From Email**: `your-email@gmail.com`
   - **To Email**: `admin@restaurant.com` (or your operations email)
   - **Friendly Name**: `POS Alerts - Email`
4. Click **Test** and **Save**

#### Other Email Providers

| Provider | SMTP Host | Port | Security |
|----------|-----------|------|----------|
| Gmail | smtp.gmail.com | 587 | TLS |
| Outlook | smtp.office365.com | 587 | STARTTLS |
| Yahoo | smtp.mail.yahoo.com | 587 | TLS |
| SendGrid | smtp.sendgrid.net | 587 | TLS |

### WhatsApp Alerts (Advanced)

Requires third-party service like:
- **Fonnte** (Indonesian service): https://fonnte.com
- **Twilio**: https://www.twilio.com/whatsapp

**Setup with Fonnte**:
1. Register at https://fonnte.com
2. Get API token
3. In Uptime Kuma, add **Webhook** notification
4. Configure POST to Fonnte API:
   ```json
   {
     "target": "628123456789",
     "message": "[msg]",
     "token": "your-fonnte-token"
   }
   ```

### Discord Alerts

1. Create Discord server or use existing
2. Create webhook: **Server Settings → Integrations → Webhooks → New Webhook**
3. Copy webhook URL
4. In Uptime Kuma: **Add New Notification → Discord**
5. Paste webhook URL
6. Test and save

### Alert Priority Levels

Configure different alerts for different severities:

| Severity | Monitors | Channels | Response Time |
|----------|----------|----------|---------------|
| **Critical** | Backend Health, Database | Telegram + Email + Call | Immediate |
| **High** | Frontend, API endpoints | Telegram + Email | < 15 min |
| **Medium** | SSL Certificate (30 days) | Email | < 24 hours |
| **Low** | Performance degradation | Email | < 48 hours |

### Alert Message Templates

Customize alert messages in Uptime Kuma:

**Down Alert**:
```
🔴 {NAME} is DOWN
URL: {URL}
Error: {ERROR}
Time: {TIME}
Duration: {DOWN_DURATION}
Action: Check logs immediately
```

**Up Alert**:
```
✅ {NAME} is back UP
URL: {URL}
Downtime: {DOWN_DURATION}
Recovered: {TIME}
```

**SSL Expiry Alert**:
```
⚠️ SSL Certificate Expiring Soon
Domain: {URL}
Days Left: {DAYS}
Renewal Required By: {EXPIRY_DATE}
```

---

## Logging and Debugging

### Log Levels

The backend supports configurable log levels via `LOG_LEVEL` environment variable:

| Level | Purpose | Environment | Output |
|-------|---------|-------------|--------|
| `DEBUG` | Detailed debugging | Development | All logs including SQL queries |
| `INFO` | Normal operations | Staging/Production | Request logs, state changes |
| `WARN` | Warnings | Production | 4xx errors, retries |
| `ERROR` | Errors only | Production (strict) | 5xx errors, panics |

**Configuration**:

```env
# .env.production
LOG_LEVEL=INFO  # Change to DEBUG for troubleshooting
```

### Structured Logging Format

All logs are output as JSON for easy parsing:

```json
{
  "timestamp": "2025-12-26T10:30:45Z",
  "level": "INFO",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/v1/orders",
  "status_code": 201,
  "latency": "45.3ms",
  "client_ip": "192.168.1.100",
  "user_agent": "Mozilla/5.0..."
}
```

### Sensitive Data Masking

Passwords, tokens, and API keys are automatically masked in logs:

**Original**:
```
POST /api/v1/auth/login?password=Secret123&token=abc-def-ghi
```

**Logged**:
```json
{
  "path": "/api/v1/auth/login?password=***MASKED***&token=***MASKED***"
}
```

### Viewing Logs

#### Docker Compose Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs

# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f

# View specific service
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend

# Last 100 lines with timestamps
docker compose -f docker-compose.prod.yml logs --tail=100 -t backend

# Filter by time
docker compose -f docker-compose.prod.yml logs --since 1h backend
docker compose -f docker-compose.prod.yml logs --since "2025-12-26T10:00:00"
```

#### Request ID Tracing

Every request gets a unique ID (`X-Request-ID` header) for tracing:

1. **Find Request ID** from error message or frontend
2. **Search logs**:
   ```bash
   docker compose logs backend | grep "550e8400-e29b-41d4-a716-446655440000"
   ```

3. **View full request lifecycle**:
   ```json
   {"request_id": "550e8400...", "level": "INFO", "message": "Request started"}
   {"request_id": "550e8400...", "level": "DEBUG", "message": "Database query"}
   {"request_id": "550e8400...", "level": "ERROR", "message": "Constraint violation"}
   ```

#### Advanced Log Filtering

Using `jq` for JSON log analysis:

```bash
# Show only errors
docker compose logs backend | jq 'select(.level == "ERROR")'

# Show slow requests (> 1s latency)
docker compose logs backend | jq 'select(.latency | tonumber > 1000)'

# Count requests by status code
docker compose logs backend | jq -s 'group_by(.status_code) | map({status: .[0].status_code, count: length})'

# Find all requests from specific IP
docker compose logs backend | jq 'select(.client_ip == "192.168.1.100")'
```

### Log Retention

**Docker Default**: Logs stored until container is removed

**Production Configuration** (add to docker-compose.prod.yml):

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

This keeps last 30MB of logs (3 files × 10MB).

**Long-term Storage**: Consider log aggregation tools:
- **Loki** (Grafana): Self-hosted, lightweight
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Papertrail**: Cloud-based (paid)

---

## Error Tracking

### Sentry Configuration (Optional)

Sentry provides error tracking, performance monitoring, and crash reporting.

#### 1. Create Sentry Project

1. Sign up at https://sentry.io (free tier available)
2. Create new project:
   - Platform: **Go** (for backend) and **React** (for frontend)
   - Name: `restaurant-pos-backend` and `restaurant-pos-frontend`
3. Copy DSN (Data Source Name):
   - Example: `https://abc123@o123456.ingest.sentry.io/456789`

#### 2. Configure Backend

Add to `.env.production`:

```env
# Sentry Error Tracking (optional)
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
ENVIRONMENT=production
```

#### 3. Configure Frontend

Add to `.env.production` (frontend):

```env
# Sentry Error Tracking (optional)
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
VITE_ENVIRONMENT=production
```

#### 4. Restart Services

```bash
docker compose -f docker-compose.prod.yml up -d backend frontend
```

#### 5. Verify Integration

1. Trigger a test error:
   ```bash
   curl https://your-domain.com/api/v1/error-test
   ```

2. Check Sentry dashboard for error report

### Sentry Features

**Error Grouping**:
- Errors automatically grouped by type and location
- See frequency, affected users, last occurrence

**Breadcrumbs**:
- View events leading to error (API calls, user actions, state changes)

**Release Tracking**:
- Tag errors with git commit or version
- Track errors by deployment

**Performance Monitoring**:
- Transaction tracing (API request flow)
- Database query performance
- External API call timing

**Alerts**:
- Configure Sentry alerts → Telegram/Email
- Alert on new error types
- Alert on error spike (e.g., 10+ errors in 1 minute)

### Privacy & Data Masking

Sentry automatically masks:
- `Authorization` headers
- `password` fields
- `token` parameters

Custom masking is configured in backend and frontend initialization code.

---

## Common Operations

### Checking System Status

```bash
# All services status
docker compose -f docker-compose.prod.yml ps

# Detailed health check
curl https://your-domain.com/health | jq

# Database connection test
docker compose -f docker-compose.prod.yml exec backend go run -tags health ./cmd/health-check
```

### Restarting Services

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Restart with fresh logs
docker compose -f docker-compose.prod.yml up -d --force-recreate backend
```

### Scaling Services

```bash
# Scale backend (multiple instances behind load balancer)
docker compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Updating Application

```bash
# Run deployment script
./scripts/deploy.sh

# Or manual steps:
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## Backup and Restore

See dedicated scripts:
- **Backup**: `./scripts/backup.sh`
- **Restore**: `./scripts/restore.sh`

**Quick Reference**:

```bash
# Create backup
./scripts/backup.sh

# Restore from latest backup
./scripts/restore.sh latest

# List available backups
./scripts/restore.sh list
```

Backups are stored in `/backups/` with automatic rotation (7 daily, 4 weekly, 3 monthly).

---

## Incident Response

### Response Procedures

#### 1. Service Down

**Symptoms**: Uptime Kuma reports service down, 503 errors

**Response**:
1. Check service status: `docker compose -f docker-compose.prod.yml ps`
2. Check logs: `docker compose -f docker-compose.prod.yml logs --tail=50 backend`
3. Restart service: `docker compose -f docker-compose.prod.yml restart backend`
4. If persists, check database: `docker compose -f docker-compose.prod.yml logs postgres`
5. If database issue, restore from backup (see Backup section)

**Escalation**: If not resolved in 15 minutes, contact system administrator.

#### 2. Slow Performance

**Symptoms**: Response time > 2s, timeout errors

**Response**:
1. Check database connections:
   ```bash
   curl https://your-domain.com/health | jq '.checks.database.connection_pool'
   ```
2. Check for blocking queries:
   ```sql
   SELECT pid, query, state, wait_event_type 
   FROM pg_stat_activity 
   WHERE state != 'idle';
   ```
3. Restart backend to clear connection pool
4. Check CPU/Memory: `docker stats`

#### 3. Database Connection Errors

**Symptoms**: `connection refused`, `too many clients`

**Response**:
1. Check PostgreSQL status:
   ```bash
   docker compose -f docker-compose.prod.yml ps postgres
   ```
2. Check connection limit:
   ```sql
   SHOW max_connections;
   SELECT count(*) FROM pg_stat_activity;
   ```
3. Increase connection limit or reduce backend connection pool
4. Restart database (careful - downtime):
   ```bash
   docker compose -f docker-compose.prod.yml restart postgres
   ```

#### 4. SSL Certificate Expiry

**Symptoms**: Browser SSL warning, Uptime Kuma SSL alert

**Response**:
1. Check Cloudflare dashboard for certificate status
2. Cloudflare Auto SSL should renew automatically
3. If expired, manual renewal in Cloudflare dashboard: **SSL/TLS → Edge Certificates**
4. Verify: `openssl s_client -connect your-domain.com:443 -servername your-domain.com`

---

## Troubleshooting

### Common Issues

#### Issue: "Health endpoint returns 503"

**Cause**: Database connection failure

**Solution**:
```bash
# Check PostgreSQL
docker compose -f docker-compose.prod.yml logs postgres

# Verify database is accepting connections
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d pos_system -c "SELECT 1;"

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

---

#### Issue: "No logs appearing"

**Cause**: Log level set too high

**Solution**:
```env
# .env.production
LOG_LEVEL=DEBUG  # Temporarily for troubleshooting
```

Restart backend to apply change.

---

#### Issue: "Frontend shows blank page"

**Cause**: Build artifacts missing or CORS error

**Solution**:
1. Check browser console for errors
2. Verify frontend is serving files:
   ```bash
   curl https://your-domain.com/
   ```
3. Check CORS configuration in backend `main.go`:
   ```go
   CORS_ALLOWED_ORIGINS=https://your-domain.com
   ```
4. Rebuild frontend:
   ```bash
   docker compose -f docker-compose.prod.yml build frontend
   docker compose -f docker-compose.prod.yml up -d frontend
   ```

---

#### Issue: "JWT token expired errors"

**Cause**: Server time drift or token expiration misconfigured

**Solution**:
1. Verify server time:
   ```bash
   date
   timedatectl  # Should show Asia/Jakarta
   ```
2. Sync time if needed:
   ```bash
   sudo timedatectl set-timezone Asia/Jakarta
   sudo systemctl restart systemd-timesyncd
   ```
3. Check token expiration in backend:
   ```bash
   grep "JWT_EXPIRATION" .env.production
   ```

---

#### Issue: "Sentry not receiving errors"

**Cause**: Invalid DSN or network block

**Solution**:
1. Verify DSN is correct in `.env.production`
2. Test Sentry connectivity:
   ```bash
   curl -X POST https://sentry.io/api/.../store/ \
     -H "Content-Type: application/json" \
     -d '{"message": "Test"}'
   ```
3. Check logs for Sentry initialization message:
   ```bash
   docker compose logs backend | grep -i sentry
   ```

---

### Performance Optimization

#### Database Query Optimization

1. **Find slow queries**:
   ```sql
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

2. **Add indexes** for frequently queried columns:
   ```sql
   CREATE INDEX idx_orders_status ON orders(status);
   CREATE INDEX idx_orders_created_at ON orders(created_at);
   ```

3. **Analyze query plans**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';
   ```

#### Connection Pool Tuning

Backend configuration in `.env.production`:

```env
# Database connection pool
DB_MAX_OPEN_CONNS=25        # Maximum open connections
DB_MAX_IDLE_CONNS=10        # Idle connections to keep
DB_CONN_MAX_LIFETIME=1h     # Connection lifetime
```

**Guidelines**:
- `max_open_conns` = (available_db_connections / number_of_backend_instances) - 5
- Example: PostgreSQL max 100 connections, 2 backend instances → 100/2 - 5 = 45 per instance

---

### Emergency Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| System Admin | [Name] | +62-xxx-xxxx-xxxx | 24/7 |
| Database Admin | [Name] | [email] | Business hours |
| Backend Developer | [Name] | [Telegram @handle] | On-call |
| Restaurant Manager | [Name] | +62-xxx-xxxx-xxxx | Business hours |

---

### Useful Commands Reference

```bash
# Health check
curl https://your-domain.com/health | jq

# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f backend

# Database shell
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d pos_system

# Restart backend
docker compose -f docker-compose.prod.yml restart backend

# View resource usage
docker stats

# Backup database
./scripts/backup.sh

# Restore database
./scripts/restore.sh latest

# Deploy new version
./scripts/deploy.sh

# Rollback to previous version
./scripts/rollback.sh
```

---

## Appendix

### Environment Variables Reference

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `LOG_LEVEL` | Logging verbosity | `INFO` | No |
| `SENTRY_DSN` | Sentry error tracking | None | No |
| `ENVIRONMENT` | Deployment environment | `development` | Yes |
| `DB_HOST` | PostgreSQL host | `postgres` | Yes |
| `JWT_SECRET` | Token signing key | None | Yes |
| `CORS_ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000` | Yes |

### Monitoring Checklist

Daily:
- [ ] Check Uptime Kuma dashboard for downtime
- [ ] Review error logs for critical issues
- [ ] Verify backup completed successfully

Weekly:
- [ ] Review performance metrics (response times)
- [ ] Check disk space usage
- [ ] Review Sentry error trends
- [ ] Test alert notifications

Monthly:
- [ ] Review and update alert thresholds
- [ ] Test backup restore procedure
- [ ] Update documentation with new procedures
- [ ] Review access logs for suspicious activity

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-12-26  
**Next Review**: 2026-01-26
