# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A modern, enterprise-grade Point of Sale (POS) system for Indonesian steakhouse restaurant management. Built with Golang backend, React frontend (TanStack Router), and PostgreSQL database.

**Features**:
- ✅ Public B2C website (menu, contact, restaurant info)
- ✅ Admin dashboard (orders, products, inventory, staff, reports)
- ✅ Kitchen display system (real-time order management)
- ✅ Server station (dine-in orders with table management)
- ✅ Counter station (payment processing, takeaway orders)
- ✅ Indonesian localization (IDR currency, Bahasa Indonesia, Indonesian menu)
- ✅ Dark/Light theme system
- ✅ i18n support (Indonesian and English)
- ✅ Comprehensive testing (E2E, unit tests, integration tests)

## Technology Stack

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin v1.9.1 (HTTP router)
- **Database**: PostgreSQL 14+ (lib/pq v1.10.9)
- **Authentication**: JWT (golang-jwt/jwt/v5 v5.2.0)
- **Password**: bcrypt (golang.org/x/crypto)
- **Testing**: testify/mock v1.11.1
- **CORS**: gin-contrib/cors v1.5.0
- **Environment**: godotenv v1.5.1

### Frontend
- **Language**: TypeScript 5+ (strict mode)
- **Framework**: React 18.3.1
- **Router**: TanStack Router v1.57.15
- **State**: TanStack Query v5.56.2 (React Query)
- **Forms**: React Hook Form v7.62.0 + Zod validation
- **UI**: Radix UI (@radix-ui/react-*) + shadcn/ui
- **Styling**: Tailwind CSS + class-variance-authority v0.7.1
- **i18n**: react-i18next v16.5.0 + i18next v25.7.2
- **Icons**: lucide-react v0.441.0
- **Charts**: recharts v2.12.7
- **Testing**: Vitest + React Testing Library + Playwright
- **Build**: Vite

### Database
- **RDBMS**: PostgreSQL 14+ with uuid-ossp extension
- **Migrations**: Plain SQL in `database/migrations/`
- **Seed Data**: SQL files in `database/init/`

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx (production)
- **Testing**: Playwright (E2E), Vitest (unit), Go test (backend)

## Recent Changes (December 2025)

**✅ Completed Features**:
- IDR currency formatting across all components (id-ID locale)
- Indonesian menu seed data (Rendang Wagyu, Sate Wagyu, etc.)
- Contact form admin interface with status management
- Inventory management system (backend + frontend)
- System settings UI with real-time health monitoring
- Dark/Light theme system with localStorage persistence
- Indonesian language support (300+ translation keys)
- Empty states for better UX across all components
- E2E testing suite (12/12 Playwright smoke tests passing)
- Backend unit tests (3 files: orders, products, auth - 875+ lines)
- Frontend unit tests (15 tests with 70% coverage threshold)
- Notification generation system
- Order status history viewer
- Badge counters for unread notifications
- CSV export for inventory and contacts

**📋 Current Status**:
- Phase A (Critical Fixes): COMPLETE ✅
- Phase B (High Priority): COMPLETE ✅
- Phase C (Medium Priority): COMPLETE ✅
- Phase D (Testing & Polish): IN PROGRESS ⚠️

## Documentation

- **API Specification**: `agent-os/specs/backend-restaurant/contracts/openapi.yaml`
- **Architecture Plan**: `agent-os/specs/backend-restaurant/plan.md`
- **Full Specification**: `agent-os/specs/backend-restaurant/spec.md`
- **Tasks**: `agent-os/specs/backend-restaurant/tasks.md`
- **Quickstart Guide**: `agent-os/specs/backend-restaurant/quickstart.md`
- **Constitution**: `.specify/memory/constitution.md`

## Development Commands

All development is done via Docker containers. Use the Makefile:

```bash
# Start development (primary command)
make dev            # Start everything with hot reloading

# Container management
make up             # Start containers in background
make down           # Stop containers
make restart        # Restart all services
make status         # Check service health

# Database
make db-shell       # Access PostgreSQL shell
make db-reset       # Reset database with fresh schema and seed data
make create-demo-users  # Create all demo users for testing
make backup         # Backup database and files
make restore        # Restore from backup

# Logs
make logs           # All service logs
make logs-backend   # Backend only
make logs-frontend  # Frontend only

# Testing & Quality
make test           # Run all tests
make lint           # Run linting
make format         # Format code
```

**Access URLs (after `make dev`):**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api/v1
- Database: localhost:5432

**Demo Accounts:** All use password `admin123`
- admin, manager1, server1, server2, counter1, counter2, kitchen1

## Architecture

### Backend (Golang + Gin)

Located in `backend/`. Standard Go project layout:

```
backend/
├── main.go                     # Entry point, CORS, middleware setup
├── internal/
│   ├── api/routes.go           # RESTful route definitions with role-based grouping
│   ├── models/models.go        # Data models, DTOs, APIResponse struct
│   ├── database/connection.go  # PostgreSQL connection pooling
│   ├── middleware/auth.go      # JWT authentication + RBAC middleware
│   └── handlers/               # Domain-specific HTTP handlers
│       ├── auth.go             # Login, logout, user management
│       ├── orders.go           # Order lifecycle management
│       ├── products.go         # Menu and category management
│       ├── tables.go           # Table and seating management
│       └── payments.go         # Payment processing
```

**Key patterns:**
- Handler structs with `*sql.DB` dependency injection
- Raw SQL with parameterized queries (no ORM)
- Standard APIResponse format: `{success, message, data, error}`
- RESTful API versioning: `/api/v1/`

### Frontend (React + TanStack Start)

Located in `frontend/`. Uses file-based routing:

```
frontend/src/
├── main.tsx                    # React entry point
├── routes/                     # TanStack Start file-based routing
│   ├── login.tsx
│   ├── kitchen.tsx
│   └── admin/                  # Admin routes with nested layouts
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── admin/                  # Admin dashboard components
│   ├── pos/                    # POS interface (cart, product grid)
│   ├── kitchen/                # Kitchen display system
│   ├── server/                 # Server-specific interface
│   ├── counter/                # Counter/checkout interface
│   └── forms/                  # Form components with Zod validation
├── api/client.ts               # Axios-based API client
├── types/index.ts              # TypeScript definitions
├── hooks/                      # Custom React hooks
└── lib/
    ├── utils.ts                # cn() utility, formatters
    └── form-schemas.ts         # Zod validation schemas
```

**Key patterns:**
- TanStack Query for data fetching and caching
- shadcn/ui + Radix UI for components
- Zod + React Hook Form for validation
- `cn()` utility for conditional Tailwind classes

### Database (PostgreSQL)

Schema in `database/init/01_schema.sql`. Main tables:
- `users` - Role-based users (admin, manager, server, counter, kitchen)
- `products` / `categories` - Menu items with inventory
- `orders` / `order_items` - Order lifecycle with status tracking
- `dining_tables` - Table occupancy management
- `payments` - Multi-method payment processing
- `order_status_history` - Audit trail

### Role-Based Access

Five user roles with different interface access:
- **Admin**: Full system access, can switch to any interface
- **Manager**: Business operations and reporting
- **Server**: Dine-in orders only
- **Counter**: All order types + payment processing
- **Kitchen**: Order preparation workflow (as-ready service)

Backend enforces roles via `RequireRoles()` middleware. Frontend uses `RoleBasedLayout` component.

## Key Files Reference

- `Makefile` - All development commands
- `docker-compose.dev.yml` - Development environment
- `backend/internal/api/routes.go` - All API endpoints
- `backend/internal/models/models.go` - All data structures
- `frontend/src/types/index.ts` - TypeScript types
- `frontend/src/api/client.ts` - API client methods
- `database/init/01_schema.sql` - Database schema
- `.cursor/rules/` - AI-enhanced development patterns (17 rule files)

## Cursor Rules

The project includes 17 Cursor AI rule files in `.cursor/rules/` covering:
- Project architecture and patterns
- Backend Golang conventions
- Frontend React patterns
- Database operations
- Role-based access patterns
- Performance optimization
- Testing patterns

## Active Technologies
- Go 1.21+ (backend), TypeScript 5+ strict mode (frontend) (001-restaurant-management)
- Go 1.21+ (backend), TypeScript 5+ (frontend) + Gin 1.9.1, React 18.3.1, TanStack Router, PostgreSQL 15 (002-restaurant-management)
- PostgreSQL 15 with UUID primary keys, Docker volumes for persistence (002-restaurant-management)
- Go 1.21+ (backend), TypeScript 5+ strict mode (frontend) + Gin v1.9.1, React 18, TanStack Router/Query, PostgreSQL 15 (002-restaurant-management)
- PostgreSQL 15 with Docker volume persistence (002-restaurant-management)
- PostgreSQL 15 (data), MinIO/Cloudflare R2 (images) (002-restaurant-management)
- PostgreSQL 14+ (mocked via go-sqlmock for unit tests) (002-restaurant-management)
- TypeScript 5+ (strict mode), Go 1.23+ + React 18.3.1, TanStack Router v1.57.15, TanStack Query v5.56.2, Embla Carousel (new), Tailwind CSS, Gin v1.9.1 (004-restaurant-management)
- PostgreSQL 14+ (existing database schema) (004-restaurant-management)
- TypeScript 5+ (strict mode), React 18.3.1 + i18next v25.7.2, react-i18next v16.5.0 (005-admin-language-settings)
- Browser localStorage (key: `i18nextLng`) (005-admin-language-settings)
- Go 1.23+ (backend), TypeScript 5+ strict mode (frontend) + Gin v1.9.1, React 18.3.1, TanStack Router v1.57.15, TanStack Query v5.56.2 (001-fix-opening-hours)
- PostgreSQL 14+ with UUID primary keys (001-fix-opening-hours)
- Go 1.23+ (backend), TypeScript 5+ strict mode (frontend) + Gin v1.9.1, React 18.3.1, TanStack Router v1.57+, TanStack Query v5+ (007-fix-order-inventory-system)
