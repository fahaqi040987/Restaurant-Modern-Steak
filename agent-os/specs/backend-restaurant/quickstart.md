# Steak Kenangan POS - Quickstart Guide

**Last Updated**: 2025-12-23  
**Version**: 1.0.0

## Overview

Steak Kenangan is a full-featured restaurant Point of Sale (POS) system with:
- **Public Website**: Menu display, contact form, restaurant information
- **Admin Dashboard**: Order management, inventory tracking, staff management
- **Kitchen Display**: Real-time order status for kitchen staff
- **Counter Station**: Payment processing and takeaway orders
- **Server Station**: Dine-in orders with table management

## Prerequisites

### Required Software

| Software | Minimum Version | Download |
|----------|----------------|----------|
| **Go** | 1.21+ | https://go.dev/dl/ |
| **Node.js** | 18+ | https://nodejs.org/ |
| **PostgreSQL** | 14+ | https://www.postgresql.org/download/ |
| **Git** | 2.x | https://git-scm.com/downloads |

### Optional (for Docker deployment)

| Software | Version |
|----------|---------|
| **Docker** | 20+ |
| **Docker Compose** | 2.x |

---

## Quick Start (5 Minutes)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/Restaurant-Modern-Steak.git
cd Restaurant-Modern-Steak
```

### 2. Start with Docker (Easiest)

```bash
# Start all services (backend, frontend, database)
docker-compose up -d

# Wait for services to start (30 seconds)
# Access application at http://localhost:3000
```

That's it! Skip to [First Login](#first-login) section.

---

## Manual Setup (Development)

### Step 1: Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL only
docker-compose up -d postgres

# Wait for database to be ready
sleep 5
```

#### Option B: Local PostgreSQL

```bash
# Create database
createdb pos_db

# Create user (if needed)
createuser pos_user -P
# Enter password when prompted

# Grant privileges
psql -c "GRANT ALL PRIVILEGES ON DATABASE pos_db TO pos_user;"
```

### Step 2: Initialize Database Schema

```bash
# Run schema migration
psql pos_db < database/init/01_schema.sql

# Load seed data
psql pos_db < database/init/02_seed_data.sql

# Load Indonesian menu
psql pos_db < database/init/03_indonesian_menu.sql

# Load system settings
psql pos_db < database/init/03_system_settings.sql

# Load ingredients (optional)
psql pos_db < database/init/03_ingredients.sql
```

**Verify database**:
```bash
psql pos_db -c "SELECT COUNT(*) FROM products;"
# Expected output: 15-20 products

psql pos_db -c "SELECT COUNT(*) FROM users;"
# Expected output: 5 users (admin, manager, server, counter, kitchen)
```

### Step 3: Backend Setup

```bash
cd backend

# Install Go dependencies
go mod download

# Create .env file
cat > .env <<EOF
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pos_db
DB_SSLMODE=disable

JWT_SECRET=your-secret-key-change-in-production
PORT=8080

# Optional: Enable debug logging
DEBUG=true
EOF

# Build backend
go build -o pos-backend main.go

# Run backend
./pos-backend
# Or for development with auto-reload:
# go run main.go
```

**Verify backend**:
```bash
# In another terminal
curl http://localhost:8080/api/v1/health
# Expected: {"database":{"status":"connected"},...}
```

### Step 4: Frontend Setup

```bash
cd frontend

# Install dependencies (takes 2-3 minutes)
npm install

# Create .env file
cat > .env <<EOF
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=Steak Kenangan POS
EOF

# Start development server
npm run dev
```

**Verify frontend**:
- Open browser: http://localhost:3000
- Should see public landing page

---

## First Login

### Default Credentials

| Role | Username | Password | Access |
|------|----------|----------|--------|
| **Admin** | `admin` | `admin123` | Full system access |
| **Manager** | `manager` | `manager123` | Reports, orders, inventory |
| **Server** | `server` | `server123` | Dine-in orders, tables |
| **Counter** | `counter` | `counter123` | All orders, payments |
| **Kitchen** | `kitchen` | `kitchen123` | Kitchen display only |

### Login Steps

1. Navigate to http://localhost:3000/login
2. Enter username: `admin`
3. Enter password: `admin123`
4. Click "Login"
5. You'll be redirected to `/admin/dashboard`

⚠️ **IMPORTANT**: Change default passwords before production deployment!

---

## Application Structure

```
/                        → Public landing page
/public/menu            → Public menu display
/public/about           → About page
/public/contact         → Contact form
/login                  → Staff login
/admin/dashboard        → Admin dashboard (requires login)
/admin/orders           → Order management
/admin/products         → Product/menu management
/admin/inventory        → Inventory tracking
/admin/staff            → Staff management (admin only)
/admin/settings         → System settings
/admin/reports          → Sales reports
/admin/server           → Server station (dine-in orders)
/admin/counter          → Counter station (payments)
/kitchen                → Kitchen display
```

---

## Testing the System

### 1. Create a Test Order (Server Station)

```bash
# Login as server
# Username: server
# Password: server123

# Navigate to /admin/server
# 1. Select table (e.g., Table 1)
# 2. Add products to cart
# 3. Click "Send to Kitchen"
# Order should appear in kitchen display
```

### 2. View Kitchen Display

```bash
# Login as kitchen
# Username: kitchen
# Password: kitchen123

# Navigate to /kitchen
# Should see order from previous step
# Click "Start Cooking" → "Mark as Ready"
```

### 3. Process Payment (Counter Station)

```bash
# Login as counter
# Username: counter
# Password: counter123

# Navigate to /admin/counter
# Find order from previous steps
# Click "Process Payment"
# Select payment method (Cash/Card/QRIS)
# Click "Complete Payment"
# Receipt should be generated
```

### 4. View Reports (Admin)

```bash
# Login as admin
# Navigate to /admin/reports
# View daily sales, popular products, etc.
```

---

## Running Tests

### Backend Tests (Go)

```bash
cd backend

# Run all tests
go test ./...

# Run specific handler tests
go test ./internal/handlers -v

# Run with coverage
go test ./... -cover
```

**Expected Output**:
```
ok      pos-public/internal/handlers    2.345s  coverage: 75.8%
```

### Frontend Tests (Vitest)

```bash
cd frontend

# Run unit tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

**Expected Output**:
```
✓ 15 tests passed (2.1s)
Coverage: 72.4% lines, 71.2% functions
```

### E2E Tests (Playwright)

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npx playwright test --ui
```

**Expected Output**:
```
✓ 12 smoke tests passed (6.4s)
```

---

## Common Issues & Solutions

### Issue: Database connection failed

**Error**: `connection refused` or `database does not exist`

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql

# Start PostgreSQL (Linux)
sudo service postgresql start

# Verify database exists
psql -l | grep pos_db
```

### Issue: Port 3000 already in use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Option 1: Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Option 2: Use different port
npm run dev -- --port 3001
```

### Issue: CORS errors in browser

**Error**: `Access-Control-Allow-Origin` errors in console

**Solution**:
```bash
# Check backend CORS middleware in backend/internal/api/routes.go
# Ensure frontend origin is allowed:
# router.Use(cors.New(cors.Config{
#     AllowOrigins: []string{"http://localhost:3000"},
# }))
```

### Issue: JWT token expired

**Error**: `401 Unauthorized` on API requests

**Solution**:
```bash
# Logout and login again to get new token
# Or increase token expiration in backend/internal/handlers/auth.go
```

### Issue: Indonesian menu not showing

**Error**: Menu shows English items or default data

**Solution**:
```bash
# Re-run Indonesian menu seed
psql pos_db < database/init/03_indonesian_menu.sql

# Verify products
psql pos_db -c "SELECT name FROM products LIMIT 5;"
# Should show: Rendang Wagyu Steak, Sate Wagyu, etc.
```

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL host | `localhost` | ✅ |
| `DB_PORT` | PostgreSQL port | `5432` | ✅ |
| `DB_USER` | Database user | `postgres` | ✅ |
| `DB_PASSWORD` | Database password | | ✅ |
| `DB_NAME` | Database name | `pos_db` | ✅ |
| `DB_SSLMODE` | SSL mode | `disable` | ❌ |
| `JWT_SECRET` | JWT signing key | | ✅ |
| `PORT` | Backend port | `8080` | ❌ |
| `DEBUG` | Enable debug logs | `false` | ❌ |

### Frontend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8080/api` | ✅ |
| `VITE_APP_NAME` | Application name | `Steak Kenangan POS` | ❌ |

---

## Production Deployment

### Docker Compose (Recommended)

```bash
# Create production env file
cp .env.example .env.production
# Edit .env.production with production values

# Build and start services
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

```bash
# Build backend
cd backend
GOOS=linux GOARCH=amd64 go build -o pos-backend main.go

# Build frontend
cd frontend
npm run build:prod
# Output in frontend/dist/

# Deploy files to server
scp pos-backend user@server:/var/www/pos/backend/
scp -r frontend/dist/* user@server:/var/www/pos/frontend/
```

**Production Checklist**:
- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS (use nginx/caddy reverse proxy)
- [ ] Enable SSL for PostgreSQL connection
- [ ] Set DB_SSLMODE=require
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Configure monitoring (health checks)
- [ ] Enable rate limiting on public endpoints
- [ ] Review and test all user roles/permissions

---

## API Documentation

Full API documentation available in OpenAPI format:
- **File**: `agent-os/specs/backend-restaurant/contracts/openapi.yaml`
- **Viewer**: https://editor.swagger.io/ (paste YAML content)

**Quick API Examples**:

```bash
# Get public menu
curl http://localhost:8080/api/v1/public/menu

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Create order (requires token)
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "dine-in",
    "table_id": "<uuid>",
    "items": [{"product_id": "<uuid>", "quantity": 2}]
  }'
```

---

## Database Maintenance

### Backup Database

```bash
# Full backup
pg_dump pos_db > backups/pos_db_$(date +%Y%m%d_%H%M%S).sql

# Schema only
pg_dump --schema-only pos_db > backups/schema.sql

# Data only
pg_dump --data-only pos_db > backups/data.sql
```

### Restore Database

```bash
# Restore from backup
psql pos_db < backups/pos_db_20241223_120000.sql
```

### Reset Database (Development)

```bash
# WARNING: This deletes all data!
make db-reset

# Or manually:
dropdb pos_db
createdb pos_db
psql pos_db < database/init/01_schema.sql
psql pos_db < database/init/02_seed_data.sql
psql pos_db < database/init/03_indonesian_menu.sql
```

---

## Support & Resources

- **Documentation**: `README.md`
- **API Spec**: `agent-os/specs/backend-restaurant/contracts/openapi.yaml`
- **Architecture**: `agent-os/specs/backend-restaurant/plan.md`
- **Specification**: `agent-os/specs/backend-restaurant/spec.md`
- **Tasks**: `agent-os/specs/backend-restaurant/tasks.md`

---

## Next Steps

1. ✅ Complete quickstart setup
2. ✅ Test all user roles
3. ✅ Customize restaurant information in `/admin/settings`
4. ✅ Add your menu items in `/admin/products`
5. ✅ Create tables in `/admin/tables`
6. ✅ Train staff on their respective interfaces
7. ⏳ Deploy to production
8. ⏳ Set up monitoring and backups

---

**Happy Coding! 🥩**
