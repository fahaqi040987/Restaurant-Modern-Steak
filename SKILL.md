---
name: restaurant-modern-steak
description: Full-stack architecture and development mastery for the Indonesian Steakhouse POS.
---

# Restaurant-Modern-Steak Development Guide

This skill encapsulates the exact architecture and procedural knowledge required to develop, maintain, and test the Restaurant-Modern-Steak application.

## 1. Core Architecture Stack
This project uses a modern JavaScript/TypeScript stack, **not** Golang.
- **Backend (`/backend`)**: Node.js, Hono framework, Drizzle ORM, PostgreSQL.
- **Frontend (`/frontend`)**: React 18, Vite, TanStack Router (file-based routing), TanStack Query (state management).
- **Styling**: Tailwind CSS, Radix UI primitives, shadcn/ui patterns.
- **Validation**: Zod (schema validation) and React Hook Form.

## 2. Development Workflow (Docker-Native)
All development happens through Docker to ensure parity across environments.
- **Start Development**: `make dev` (Starts containers with hot-reloading for both Vite and Hono).
- **Database Migrations**: `cd backend && npm run db:generate` then `npm run db:migrate`.
- **Database Studio**: `cd backend && npm run db:studio` to view local data.

## 3. Testing Paradigm
- **E2E Testing (Playwright)**: Located in `/e2e`. Used for critical user journeys (Smoke, Auth, Kitchen, Orders, Admin).
- **Unit Testing (Vitest)**: Used in both backend and frontend.
- **Commands**: `cd frontend && npm run test:e2e` for UI flows.

## 4. Localization Standards
- **Currency**: Price must be strictly formatted to `id-ID` (IDR).
- **UI Strings**: Managed through `i18next` targeting Bahasa Indonesia as the primary language.

## 5. Deployment
- Handled via `docker-compose.prod.yml` and Nginx reverse proxy.
- Ensure production environment variables (`.env.production`) are correctly mapped before executing `deploy.sh`.

## 6. Technical Debt & Code Cleanup
To ensure clean architecture and remove unused code/technical debt:
- **Clean Code Practices**: Always use the installed `clean-code` skill (`@.agents/skills/clean-code`) algorithms to enforce readability and avoid dead code.
- **Workflow & Blueprint analysis**: Use the installed `project-workflow-analysis-blueprint-generator` skill to constantly generate or verify system architecture blueprints and find orphaned endpoints.
- **Code Sweeping**: When you identify dead code (unused variables, orphaned frontend components, or backend routes not consumed), safely remove them to minimize vector attack surfaces and bundle size.
