# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ AI AGENT EXECUTION RULES (CRITICAL)

To prevent system hangs, excessive token usage, and hook timeouts, **YOU MUST ADHERE TO THESE RULES STRICTLY**:

1. **NO ROOT SEARCHING (CRITICAL):** NEVER run broad `find`, `ls -R`, or `Search` commands from the root directory (`/`). You are strictly forbidden from doing full-project scans.
2. **MANDATORY IGNORE LIST:** ALWAYS completely ignore the following directories in any search or tool use: `node_modules/`, `.git/`, `dist/`, `build/`, `vendor/`, and `.claude/`.
3. **ANTI-EXPLORATION (No Pre-mapping):** DO NOT proactively map out the project structure, backend routes, frontend components, or look for spec files before answering a prompt. **SKIP the "Explore" phase entirely.** Only open files that are directly related to the user's immediate request.
4. **ASK, DON'T GUESS:** If the user asks to fix a bug or add a feature but doesn't provide the exact file path, DO NOT search the repository to find it. Instead, **STOP and ask the user for the exact file path.**
5. **ANTI-HISTORY (Current State Only):** Focus ONLY on the current state of the codebase. DO NOT use `git log`, `git diff`, or check commit history unless explicitly requested by the user.
6. **DIRECT FILE ACCESS:** Prioritize reading specific files directly (using `Read`) over searching (`Search`).

---

## Project Overview

A modern, enterprise-grade Point of Sale (POS) system for Indonesian steakhouse restaurant management. Built with Node.js/TypeScript backend (Hono), React frontend (TanStack Router), and PostgreSQL database.

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
- **Language**: TypeScript 5+ (strict mode)
- **Runtime**: Node.js 20+
- **Framework**: Hono
- **Database**: PostgreSQL 14+
- **ORM**: Drizzle ORM
- **Authentication**: JWT

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
make restore