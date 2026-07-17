# Environment Reference

> ⚠️ **KRITISCH**: Diese Datei enthält KEINE Secrets/Werte.
> Die tatsächlichen Credentials sind in `.env`-Dateien (nie commiten!),
> Docker-Compose-Environment-Block, und Azure DevOps Pipeline Secrets.

---

## Pflicht-Variablen (Backend)

| Variable | Beschreibung | Quelle |
|---|---|---|
| `DATABASE_URL` | PostgreSQL-Verbindung | `backend/.env` + Docker `services.backend.environment` |
| `JWT_SECRET` | JWT-Signierung (min 32 Chars) | `backend/.env` |
| `MINIO_ACCESS_KEY` | MinIO/S3 Access Key | `.env` (Docker Compose Root) |
| `MINIO_SECRET_KEY` | MinIO/S3 Secret Key | `.env` (Docker Compose Root) |
| `AI_API_KEY` | OpenAI-kompatible API | `backend/.env` (aipi.coredy.ai) |
| `AI_BASE_URL` | AI API Endpoint | `backend/.env` |
| `AI_MODEL` | AI Model Name | `backend/.env` (aktuell: `ava:ocr`) |

## Optionale Variablen (mit Defaults)

| Variable | Default | Beschreibung |
|---|---|---|
| `PORT` | `3003` | Backend Port |
| `HOST` | `0.0.0.0` | Backend Bind |
| `NODE_ENV` | `development` | Umgebung |
| `LOG_LEVEL` | `info` | Log-Level |
| `REDIS_URL` | `redis://localhost:6379` | Redis (BullMQ) |
| `JWT_ACCESS_EXPIRY` | `15m` | Access Token Laufzeit |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh Token Laufzeit |
| `CORS_ORIGIN` | `*` | CORS-Allowed-Origin |
| `SMTP_HOST` | `localhost` | MailHog/Exim |
| `SMTP_PORT` | `1025` | SMTP Port |
| `SMTP_FROM` | `noreply@vsvv.ch` | Absender-Adresse |

## S3 (Exoscale SOS) — Optional / Legacy

| Variable | Beschreibung |
|---|---|
| `S3_ENDPOINT` | Exoscale SOS Endpoint |
| `S3_REGION` | Exoscale Region |
| `S3_BUCKET` | S3 Bucket Name |
| `S3_ACCESS_KEY_ID` | S3 Access Key |
| `S3_SECRET_ACCESS_KEY` | S3 Secret Key |

## Wichtige Dateien

| Datei | Zweck | In Git? |
|---|---|---|
| `backend/.env` | Backend-Environment (dev) | ❌ `.gitignore` |
| `.env` (root) | Docker-Compose Environment | ❌ `.gitignore` |
| `backend/.env.example` | Vorlage für neue Devs | ✅ |
| `docker-compose.yml` | Service-Definitionen + Env | ✅ |
| `backend/src/config/env.ts` | Zod-Schema + Defaults | ✅ |

## Services & Ports

| Service | Container | URL / Port |
|---|---|---|
| Frontend | avaai-frontend | `http://localhost:3004` |
| Backend API | avaai-backend | `http://localhost:3003` |
| PostgreSQL | vsvv-db | `localhost:5432` |
| Redis | avaai-redis | `localhost:6379` |
| MinIO API | avaai-minio | `localhost:9000` |
| MinIO Console | avaai-minio | `localhost:9001` |
| MailHog SMTP | avaai-mailhog | `localhost:1025` |
| MailHog Web | avaai-mailhog | `http://localhost:8025` |
| Health Check | Backend | `GET http://localhost:3003/api/health` |

## AI Model

| Modell | Typ | Host |
|---|---|---|
| **ava:ocr** (aktiv) | uOCR q4 (Vision/OCR) | `aipi.coredy.ai/ollama/v1` — SBAI GPU Exoscale |
| ava-nucl3us (alt) | General Vision | Gleicher Host |
