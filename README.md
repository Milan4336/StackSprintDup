# Cloud-Native Fraud Detection Command Center

Production-grade, real-time fraud detection platform for financial transactions using a hybrid rule + ML detection pipeline, live event streaming, and an operator dashboard.

## Current Status

Implemented and wired end-to-end:

- JWT auth with RBAC (`admin`, `analyst`)
- Transaction ingestion and scoring (`POST /api/v1/transactions`)
- Hybrid fraud scoring:
  - Rule engine (amount, velocity, geo change, new device)
  - ML anomaly scoring (Isolation Forest)
  - Weighted combination in API Gateway
- Risk classification (`Low`, `Medium`, `High`)
- Explainable AI payloads persisted and visualized
- Autonomous fraud response and alert generation
- Device fingerprint tracking and visualization
- Fraud simulation mode (`POST /api/v1/simulation/start`)
- Real-time updates over Socket.io + Redis pub/sub
- Live fraud radar map with geo markers
- Professional dashboard UI (dark/light theme, analytics, charts, alerts)
- Crash-proof frontend date handling for invalid/null timestamps
- Docker Compose local environment
- Kubernetes manifests under `k8s/`
- Azure deployment automation under `azure/`

## Architecture

```text
Frontend (React + TS + Tailwind + Recharts + Leaflet)
    |
    | HTTPS + JWT + Socket.io
    v
API Gateway (Node.js + Express + TypeScript)
    |-- MongoDB (transactions, users, fraud_alerts, user_devices, fraud_explanations)
    |-- Redis (pub/sub channels for live updates)
    v
ML Service (FastAPI + Isolation Forest)
```

## Services and Ports

| Service | Tech | Local URL | Internal Docker Name |
|---|---|---|---|
| Frontend | React/Vite + Nginx | `http://localhost:5173` | `frontend` |
| API Gateway | Express + TypeScript | `http://localhost:8080` | `api-gateway` |
| ML Service | FastAPI | `http://localhost:8000` | `ml-service` |
| MongoDB | Mongo 7 | `mongodb://localhost:27017` | `mongo` |
| Redis | Redis 7 | `redis://localhost:6379` | `redis` |

## Key Collections

- `users`
- `transactions`
- `fraud_alerts`
- `user_devices`
- `fraud_explanations`

## Fraud Scoring Logic

Implemented in API Gateway (`FraudScoringService`):

- `ruleScore` from rule engine (0–100)
- `mlScore` from ML service (0–1 probability)
- Final score:

```text
fraudScore = round((ruleScore * SCORE_RULE_WEIGHT) + (mlScore * 100 * SCORE_ML_WEIGHT))
```

Default env weights in `.env.example`:

- `SCORE_RULE_WEIGHT=0.6`
- `SCORE_ML_WEIGHT=0.4`

Risk bands:

- `0–30` => `Low`
- `31–70` => `Medium`
- `71–100` => `High`

## API Endpoints

Base path: `http://localhost:8080/api/v1`

### Auth

- `POST /auth/register` (public)
- `POST /auth/login` (public)

### Transactions

- `POST /transactions` (auth, roles: `admin`, `analyst`)
- `GET /transactions` (auth)
- `GET /transactions/stats` (auth)

### Simulation

- `POST /simulation/start` (auth, role: `admin`)

### Monitoring

- `GET /alerts` (auth)
- `GET /devices` (auth)
- `GET /explanations` (auth)

### Platform

- `GET /health`
- `GET /metrics`

## Real-Time Channels (Socket.io)

WebSocket endpoint: `ws://localhost:8080` (auth token required)

Channels emitted from Redis pub/sub:

- `transactions.live`
- `fraud.alerts`
- `simulation.events`
- `system.status` (on connect)

## Frontend Features

Routes:

- `/login`
- `/dashboard`
- `/transactions`
- `/analytics`
- `/settings`

Implemented UX behavior:

- Protected routing + JWT persistence
- Sidebar navigation + active route highlighting
- Theme toggle persisted in `localStorage`
- Shared transaction state via `TransactionContext`
- Immediate UI update after transaction creation
- Auto-refresh polling every 5s
- Live websocket transaction upserts
- Loading skeletons and empty states
- Footer with fraud score explanation
- Safe date utilities for invalid timestamps (`N/A` fallback)

## Security and Observability

### Security

- Helmet secure headers
- CORS allow-list from env (`ALLOWED_ORIGINS`)
- JWT auth middleware
- RBAC middleware
- Input validation with Zod
- API rate limiting (`120` req/min)

### Observability

- Structured logging (Pino + pino-http)
- Request ID middleware
- Prometheus metrics (`/metrics`)
- Health checks (`/health`)
- Docker healthchecks for all services

## Local Setup (Docker Compose)

### 1) Configure environment

```bash
cp .env.example .env
```

Required defaults are already provided for local Docker networking (`mongo`, `redis`, `ml-service`).

### 2) Build and run

```bash
docker compose down
docker compose up --build -d
```

### 3) Verify

```bash
curl http://localhost:8080/health
curl http://localhost:8000/health
curl -I http://localhost:5173
```

## Quick Functional Test

### 1) Register admin

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@fraud.local","password":"StrongPass123!","role":"admin"}'
```

### 2) Login and get token

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@fraud.local","password":"StrongPass123!"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
```

### 3) Create transaction

```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "transactionId":"tx-test-001",
    "userId":"user-001",
    "amount":95000,
    "currency":"USD",
    "location":"Delhi",
    "deviceId":"device-001",
    "ipAddress":"127.0.0.1",
    "timestamp":"2026-02-24T12:00:00Z"
  }'
```

## Seed Data

Options:

- API Gateway seed script (Mongo direct):
  - `npm run seed -w api-gateway`
- REST seeding helper script:
  - `scripts/seed-transactions.sh` (requires `TOKEN` env)

Example:

```bash
TOKEN=<jwt> API_URL=http://localhost:8080 bash scripts/seed-transactions.sh
```

## Local Development (Without Docker)

### Install dependencies

```bash
npm run install:all
pip install -r ml-service/requirements.txt
```

### Run services

```bash
npm run dev -w api-gateway
npm run dev -w frontend
uvicorn ml-service.main:app --host 0.0.0.0 --port 8000
```

### Build

```bash
npm run build
```

## Kubernetes Manifests

Available under `k8s/`:

- `api-deployment.yaml`
- `ml-deployment.yaml`
- `mongo.yaml`
- `redis.yaml`
- `frontend.yaml`
- `ingress.yaml`

These provide baseline deployments, services, probes, and ingress definitions for cluster deployment.

## Azure Deployment (Container Apps)

Assets:

- `azure/env.template`
- `azure/deploy.sh`
- `azure/containerapps.yaml` (reference)

### Deployment flow in `azure/deploy.sh`

- Ensures Azure login
- Creates resource group
- Creates ACR and pushes images
- Creates Cosmos DB (Mongo API)
- Creates Azure Redis
- Creates/updates Container Apps (`frontend`, `api-gateway`, `ml-service`)
- Injects runtime env vars (Cosmos `MONGO_URI`, Redis `REDIS_URI`, JWT, ML URL)
- Runs health and smoke checks
- Prints final URLs

Run:

```bash
cp azure/env.template azure/.env
# edit azure/.env
bash azure/deploy.sh
```

## Project Structure

```text
api-gateway/   # Express API, scoring, auth, websocket, repositories
ml-service/    # FastAPI model inference and feature engineering
frontend/      # React dashboard, charts, map, auth UI
k8s/           # Kubernetes manifests
azure/         # Azure Container Apps deployment automation
scripts/       # Utility scripts
```

## Notes

- Frontend map uses backend-provided coordinates first, with deterministic location mapping fallback.
- Real-time flow is backed by Redis pub/sub and Socket.io fanout.
- Date rendering is hardened against null/invalid timestamps via `safeDate`/`formatSafeDate`.
- If you expose this publicly, rotate secrets and avoid committing real credentials in `.env` files.
