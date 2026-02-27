# Steak Kenangan

> Restaurant Management System for Indonesian Steakhouse

[![Go](https://img.shields.io/badge/Go-1.21-00ADD8?logo=go&logoColor=white)](https://golang.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker&logoColor=white)](https://docker.com)

## About

Steak Kenangan is a full-featured restaurant management system built for Indonesian steakhouses. The system handles daily operations from order taking to kitchen management, with full support for Indonesian language and IDR currency.

**Instagram**: [@steakkenangan](https://instagram.com/steakkenangan)

## Features

### Operations
- **Orders** - Create and track dine-in, takeaway, and delivery orders
- **Kitchen Display** - Real-time order queue with item-by-item tracking
- **Payments** - Multi-payment support with receipt generation
- **Tables** - Manage seating and table availability

### Administration
- **Staff Management** - User accounts with role-based permissions
- **Menu Management** - Products, categories, and pricing
- **Inventory** - Ingredient tracking with stock history
- **Reports** - Sales analytics and financial summaries
- **Settings** - System configuration and health monitoring

### Localization
- **Languages** - Indonesian (default) and English
- **Currency** - IDR formatting with id-ID locale
- **Menu** - Indonesian dishes (Rendang Wagyu, Sate Wagyu, etc.)

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Go 1.21, Gin 1.9, PostgreSQL 15, JWT |
| **Frontend** | React 18, TanStack Router, TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui, Radix UI |
| **i18n** | i18next, react-i18next |
| **Testing** | Playwright (E2E), Vitest, Go test |
| **Infrastructure** | Docker, Docker Compose |

## Quick Start

```bash
# Clone and start
git clone <repository-url>
cd restaurant-modern-steak
make dev

# Access
# Frontend: http://localhost:8000
# API: http://localhost:8080/api/v1
```

### Default Account

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |

**Note:** Create additional staff accounts through the admin dashboard (Users section).

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full system access, all interfaces |
| **Manager** | Reports, oversight, staff management |
| **Server** | Dine-in order creation, table management |
| **Counter** | All order types, payment processing |
| **Kitchen** | Order preparation, status updates |

## Project Structure

```
├── backend/
│   ├── internal/
│   │   ├── api/          # Route definitions
│   │   ├── handlers/     # Request handlers
│   │   ├── middleware/   # Auth, CORS
│   │   ├── models/       # Data structures
│   │   └── database/     # DB connection
│   └── main.go
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── routes/       # Page routes
│   │   ├── api/          # API client
│   │   ├── hooks/        # React hooks
│   │   ├── locales/      # Translations
│   │   └── types/        # TypeScript types
│   └── package.json
├── database/
│   └── init/             # SQL scripts
├── e2e/                  # Playwright tests
└── docker-compose.dev.yml
```

## Commands

```bash
# Development
make dev              # Start all services
make up               # Start containers
make down             # Stop containers
make restart          # Restart services
make status           # Check health

# Database
make db-shell         # PostgreSQL shell
make db-reset         # Reset with fresh data
make create-admin     # Create a custom admin user

# Testing
make test             # Run all tests
make lint             # Lint code

# Logs
make logs             # All logs
make logs-backend     # Backend only
make logs-frontend    # Frontend only
```

## Database Schema

Main tables:
- `users` - Staff accounts and roles
- `products` / `categories` - Menu items
- `orders` / `order_items` - Order data
- `dining_tables` - Table management
- `payments` - Transaction records
- `ingredients` / `inventory_history` - Stock tracking
- `notifications` - System alerts
- `contacts` - Customer inquiries

## API Endpoints

Base URL: `http://localhost:8080/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| GET | `/orders` | List orders |
| POST | `/orders` | Create order |
| GET | `/products` | List products |
| GET | `/tables` | List tables |
| GET | `/inventory` | Stock levels |
| GET | `/health` | System health |

See `backend/internal/api/routes.go` for full API reference.

## Development Status

- [x] Core POS functionality
- [x] Kitchen display system
- [x] Payment processing
- [x] Indonesian localization
- [x] Dark/Light theme
- [x] Inventory management
- [x] E2E test suite
- [ ] Mobile apps (planned)

## Configuration

Environment variables in `docker-compose.dev.yml`:

```yaml
# Backend
DB_HOST: postgres
DB_PORT: 5432
DB_USER: postgres
DB_PASSWORD: postgres
DB_NAME: restaurant
JWT_SECRET: your-secret-key

# Frontend
VITE_API_URL: http://localhost:8080
```

## Testing

```bash
# Run E2E tests
npx playwright test

# Run frontend unit tests
cd frontend && npm run test

# Run backend tests
cd backend && go test ./...
```

## Production Deployment

For detailed VPS deployment with Docker and Cloudflare Tunnel, see **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

### Quick Start (VPS)

```bash
# 1. Clone and configure
git clone https://github.com/your-username/Restaurant-Modern-Steak.git
cd Restaurant-Modern-Steak
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# 2. Build frontend
cd frontend && npm ci && npm run build:prod && cd ..

# 3. Start services
docker compose -f docker-compose.prod.yml up -d

# 4. Verify
docker compose -f docker-compose.prod.yml ps
curl http://localhost:8080/health
```

### Deploy Script

After initial setup, use `deploy.sh` for updates:

```bash
chmod +x deploy.sh     # First time only
./deploy.sh            # Deploy latest
./deploy.sh --status   # Check health
./deploy.sh --rollback # Revert if needed
```

### Architecture

```
Internet → Cloudflare (SSL/CDN) → Tunnel → VPS
                                            ├── frontend (nginx:80)
                                            ├── backend (go:8080)
                                            ├── db (postgres:5432)
                                            └── uptime-kuma (monitoring)
```

## Database Backup & Restore

### Manual Backup

```bash
# Backup
pg_dump -h localhost -U postgres -d restaurant -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Restore
pg_restore -h localhost -U postgres -d restaurant -c backup_YYYYMMDD_HHMMSS.dump
```

### Automated Backup (cron)

```bash
# Add to crontab -e
# Daily backup at 2 AM
0 2 * * * pg_dump -h localhost -U postgres -d restaurant -F c -f /backups/restaurant_$(date +\%Y\%m\%d).dump
```

### Docker Backup

```bash
# Backup from Docker container
docker exec -t postgres pg_dump -U postgres restaurant > backup.sql

# Restore to Docker container
docker exec -i postgres psql -U postgres restaurant < backup.sql
```

## Troubleshooting

### Common Issues

**Docker issues**
```bash
make clean
docker system prune -f
make dev
```

**Database reset**
```bash
make db-reset
```

**Module issues**
```bash
cd backend && go mod tidy
cd frontend && npm install
```

### Backend Errors

**"JWT secret too short"**
- Set `JWT_SECRET` environment variable with at least 32 characters

**"CORS blocked"**
- Set `CORS_ALLOWED_ORIGINS` environment variable with your frontend URL

**"Database connection failed"**
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check connection settings in `.env` or `docker-compose.yml`

### Frontend Errors

**"API request failed"**
- Verify backend is running: `curl http://localhost:8080/api/v1/health`
- Check `VITE_API_URL` environment variable

**"Build failed"**
- Clear cache: `rm -rf node_modules dist && npm install`
- Verify TypeScript: `npm run type-check`

### Performance Issues

**Slow API responses**
- Check database indexes
- Review PostgreSQL connection pool settings
- Enable request logging for debugging

**Large bundle size**
- Run `npm run build` and check chunk sizes
- Lazy load routes using dynamic imports

## License

MIT License - See [LICENSE](LICENSE) file.

---

**Steak Kenangan** - Indonesian Steakhouse Management System
