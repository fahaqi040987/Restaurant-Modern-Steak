# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A modern, enterprise-grade Point of Sale (POS) system for restaurant management. Built with Golang backend, React frontend (TanStack Start), and PostgreSQL database.

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
