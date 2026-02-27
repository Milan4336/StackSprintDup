# FRAUD COMMAND CENTER (Enterprise Engineering Edition)

A high-performance, cloud-native fraud intelligence platform designed for realtime detection, deep forensic investigation, and autonomous risk response. This repository contains the full source for a production-grade fraud operations system.

---

## 1. System Architecture

The platform follows a modular **Microservices Architecture** designed for high availability and elastic scaling.

### Core Components
- **API Gateway (Node.js/Express)**: The central nervous system. Handles authentication, orchestration, rule execution, and realtime event fan-out via Redis/Socket.io.
- **ML Service (FastAPI/Python)**: High-throughput inference engine. Hosts a multi-model ensemble and model registry with prometheus-backed telemetry.
- **Frontend Command Center (React/Vite)**: A 10-module modular intelligence console with Executive Mode, D3-powered relationship graphs, geospatial heatmaps, and lazy-loaded React routes.

### Data Ecosystem
- **Primary Persistence**: MongoDB (Transactions, Alerts, Cases, Audit).
- **In-Memory Cache & Pub/Sub**: Redis (Session flags, GeoIP cache, Realtime event bus).
- **Service Communication**: REST + JWT for synchronous flows; Redis Pub/Sub for asynchronous telemetry.

---

## 2. Technical Stack

### Frontend Engineering
- **Core**: React 18, TypeScript, Vite.
- **State & Data**: Zustand (Store), React Query (Server state).
- **Visualization**: D3.js (Force graphs), Recharts (KPIs), Leaflet (Geospatial).
- **Animation**: Framer Motion (Transitions), Canvas (SystemBootIntro).
- **Styling**: TailwindCSS (Utility-first), PostCSS.

### Backend & API
- **Runtime**: Node.js 20+, TypeScript.
- **Framework**: Express.js.
- **Validation**: Zod (Contract-first validation).
- **Security**: JWT (HS256), BCrypt, Helmet, Rate-limiting.
- **Logging**: Pino (Structured JSON logging).

### Machine Learning (MLOps)
- **Engine**: FastAPI, Pydantic v2.
- **Ensemble (v2.5)**: XGBoost Classifier, PyTorch Autoencoder, Isolation Forest.
- **Fusion Logic**: Weighted voting with per-model confidence scoring.
- **Registry**: Versioning and background retraining capabilities.

---

## 3. Forensic Intelligence Engine

### Hybrid Scoring Pipeline (Phase 2)
The system executes a precision-weighted scoring pipeline for every transaction:
1.  **Rule Engine (0.25)**: Expert heuristics (Velocity, Amount, Geo-velocity, Device Churn).
2.  **ML Ensemble (0.35)**: Multi-model anomaly detection (XGBoost + Autoencoder + Isolation Forest).
3.  **Behavioral Bias (0.25)**: Context-aware footprint profiling & historical entropy analysis.
4.  **Graph Forensics (0.15)**: Entity relationship linkage & collusion ring detection bias.

**Weighted Fusion Formula**: `Risk Score = Σ ( Layer_i * Weight_i )`

### Explainable AI (XAI)
Every ML prediction returns a forensic payload detailing the top features contributing to the score, including impact percentages and human-readable reasons, persisted for investigator review.

---

## 4. Development Guide

### Prerequisites
- Node.js `^20.0.0`
- Python `^3.10`
- Docker + Docker Compose
- MongoDB & Redis (if running outside Docker)

### Quick Start (All-in-One)
```bash
# Clone and spin up infrastructure
docker-compose up --build -d

# Initial Auth Setup
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fraud.local","password":"StrongPass123!","role":"admin"}'

# Seed Demo Data
npm run seed -w api-gateway
```

### Direct Development Workflow
**Terminal 1: ML Service**
```bash
pip install -r ml-service/requirements.txt
uvicorn ml-service.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2: API Gateway**
```bash
cd api-gateway
npm install
npm run dev
```

**Terminal 3: Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 5. API Reference & Event Contract

### Key Endpoints
| Verb | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/transactions` | Score & process a new transaction |
| `GET` | `/api/v1/graph` | Fetch forensic relationship data for D3 |
| `GET` | `/api/v1/alerts` | Paginated alert queue |
| `POST` | `/api/v1/simulation/start` | Trigger synthetic attack patterns |
| `GET` | `/health` | Poly-service health status |

### Realtime Channels (Socket.io)
- `transactions.live`: Broadcasts all scores in realtime.
- `fraud.alerts`: Immediate notification for high-risk flags.
- `system.status`: ML reliability and circuit breaker telemetry.

---

## 6. Observability & Reliability

### Circuit Breakers
The API Gateway includes a circuit breaker for the ML Service. If latency spikes or error rates exceed thresholds, the system falls back to **Rule-Only scoring** to maintain availability.

### Telemetry
- **Logs**: Structured JSON output via Pino for ELK/Standard logging.
- **Metrics**: Prometheus `/metrics` endpoints across all microservices (Node.js & Python).
- **Audit**: Immutable trail of analyst actions (Logins, Case updates, Settings changes).

---

## 7. Infrastructure & Deployment

### Kubernetes
Standard manifests are provided in `k8s/` for:
- Horizontal Pod Autoscaling (HPA) for API/ML layers.
- Ingress-nginx configuration.
- StatefulSets for dev-grade Mongo/Redis.

### Cloud Native (Azure)
Automated `deploy.sh` script for Azure Container Apps, Cosmos DB (Mongo API), and Azure Redis.

---

## 8. Extensibility Guide

### Adding a New Rule
1.  Navigate to `api-gateway/src/services/RuleEngineService.ts`.
2.  Implement the rule logic in a private method.
3.  Add it to the `evaluateAll` execution array.

### Adding a New ML Model
1.  Update `ml-service/ensemble.py` to include the new model class.
2.  Register the model in `ml-service/registry.py`.
3.  Adjust the ensemble weights in `main.py`.

---

## Conclusion

"We are not just predicting fraud. We built a complete fraud operations system where detection, explanation, autonomous response, investigation, and reliability monitoring work together in realtime."

---
*Built for Scale. Engineered for Trust. Professional Grade.*
