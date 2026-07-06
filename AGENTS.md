# Agents Instruction Guide

## Tech Stack
- **Backend**: Fastify 5, TypeScript 5, Prisma 6, PostgreSQL 16
- **Frontend**: React 18, Vite 6, Tailwind CSS
- **Infrastructure**: Docker Compose (Postgres, Redis), Exoscale SOS (S3)

## Core Commands
### Development
- Start Frontend: `npm run dev`
- Start Backend: `cd backend && npm run dev`
- Build Frontend: `npm run build`

### Database (run from `/backend`)
- Migrate: `npm run db:migrate` (or `npx --prefix backend prisma migrate dev`)
- Push Schema: `npm run db:push`
- Seed Data: `npm run db:seed`
- Studio (UI): `npm run db:studio`

### Verification
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`

## Architecture Notes
- **Multi-Tenant**: Designed for a multi-tenant architecture with DSGVO/FINMA compliance.
- **Backend Structure**: 
    - `modules/`: CRUD feature modules.
    - `services/`: Core business logic (orchestrates modules).
    - `middleware/`: Handles Auth, Audit, and Service roles.
- **Frontend structure**:
    - `api/`: Contains `avaSysClient` for optimized API communication.
    - `pages/` & `components/`: Standard React separation.

## Key Constraints & Quirks
- **Execution Flow**: For new features, follow the pattern: `backend/modules` $\rightarrow$ `backend/services` $\rightarrow$ `src/pages`.
- **Environment**: Backend requires `.env` in `/backend` (copy from `.env.example`).
- **Command Order**: Recommended verification sequence: `lint` $\rightarrow$ `typecheck` $\rightarrow$ `test` (if applicable).
