# avaai Premium Broker

Versicherungs-Vergleichsplattform mit Multi-Tenant-Architektur, DSGVO/FINMA-Compliance und skalierbarem Dokumenten-Management auf Exoscale SOS.

---

## Tech Stack

| Layer | Technologie |
|---|---|
| **Backend** | Fastify 5, TypeScript 5, Prisma 6, PostgreSQL 16 |
| **Frontend** | React 18, Vite 6, Tailwind CSS |
| **Auth** | JWT (Access + Refresh Token), bcrypt |
| **Queue** | BullMQ (Redis) |
| **Storage** | Exoscale SOS (S3-kompatibel) |
| **Infra** | Docker Compose, Nginx |

## Quickstart

```bash
# 1. Dependencies installieren
npm install

# 2. .env erstellen (siehe .env.example)
cp backend/.env.example backend/.env

# 3. DB starten + migrieren
docker compose up -d postgres
npx --prefix backend prisma migrate dev

# 4. Development Server starten
npm run dev
```

## Umgebungsvariablen

| Variable | Beschreibung | Default |
|---|---|---|
| `S3_ENDPOINT` | Exoscale SOS Endpoint | — |
| `S3_REGION` | S3 Region (z.B. `ch-dk-2`) | — |
| `S3_BUCKET` | S3 Bucket Name | — |
| `S3_ACCESS_KEY_ID` | Exoscale API Key | — |
| `S3_SECRET_ACCESS_KEY` | Exoscale Secret | — |
| `CORS_ORIGIN` | Erlaubte Frontend-Domain (Prod: `https://app.avaai.ch`) | `http://localhost:3004` |
| `JWT_SECRET` | JWT Signing Secret | — |
| `DATABASE_URL` | PostgreSQL Connection String | — |

## Projektstruktur

```
├── backend/           # Fastify API Server
│   ├── prisma/        # Schema + Migrationen
│   ├── src/
│   │   ├── config/    # env, cors, etc.
│   │   ├── lib/       # Shared Utilities
│   │   ├── middleware/ # Auth, Audit, Service-Role, etc.
│   │   ├── modules/   # Feature-Module (CRUD)
│   │   └── services/  # Business Logic
│   └── scripts/       # Dev/Test Scripts
├── src/               # React Frontend
│   ├── api/           # API Client (avaSysClient)
│   ├── components/    # Shared Components
│   └── pages/         # Route Pages
└── docker-compose.yml # Postgres, Redis, etc.
```

## Lizenz

Proprietär — avaai AG
