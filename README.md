# FRAUD COMMAND CENTER (Enterprise v4.0)

A high-performance, cloud-native fraud intelligence platform designed for realtime detection, deep forensic investigation, and autonomous risk response. This platform has been evolved into a high-fidelity "Cinematic Ultra-HUD" environment, balancing expert heuristics with advanced ML ensemble scoring.

> [!NOTE]
> Detailed technical evolution and version history are tracked in `PATCH_NOTES.md`.

---

## 🚀 1. Cinematic Visual Intelligence
The platform features a "WOW"-factor UI designed for maximum situational awareness and immersive investigator experience.

### 🌑 Atmospheric Layers
- **Dynamic Threat Atmosphere**: Living background gradients that shift and breathe based on `threatIndex`.
- **Global Hover Tracking**: Real-time cursor coordinates pipe into CSS variables, casting a smooth radial glow across the entire platform.
- **SOC Grid Overlay**: Holographic background texture with moving laser scan lines.
- **Defense Shield**: High-intensity lockdown overlay activating at critical threat levels (`threatIndex > 95`).
- **Threat Shockwave**: Full-screen radial energy waves triggered by sudden risk spikes.

### 🎯 Localized Intelligence
- **Transaction Auras**: Risk-reactive energy glows centered around individual high-risk transaction records.
- **Forensic Scanlines**: Cinematic grid overlays embedded within deep investigation modals.
- **Explosion Markers**: Particle bursts highlighting fraud events on geospatial maps.
- **Interactive Neural Flow**: Live data throughput visualization representing ML model activity.

### 🔊 Audio & Semantic Intelligence
- **Threat Audio Engine**: Browser-native Web Audio synthesis providing real-time sonification of risk levels, including escalation tones and critical pulses.
- **Dynamic Patch Notes**: Pulls update logs dynamically from external `.md` files directly into an interactive presentation UI via dedicated API gateways.

---

## 🧠 2. Deep Forensic Investigation
Transformed investigation workflows from standard tables into a multi-dimensional intelligence platform.

### 🕵️ Investigation Modules
- **Relationship Graph (D3)**: Zoomable, interactive link analysis for detecting collusion rings and complex entity relationship structures.
- **Entity Profiles**: Comprehensive 360° views of Users, Devices, and IP addresses with chronological forensics.
- **Forensic Detail Modal**: Multi-layer risk breakdown including Expert Rules, ML Ensemble explanations (XAI), and behavioral anomalies.
- **Autonomous AI Copilot**: Persistent assistant providing real-time triage, automated case creation, and risk explanation.

### 🛂 Role-Based Access Control (RBAC)
- **Analyst Command Center**: The full high-fidelity SOC experience for fraud investigators.
- **Personal Security Portal**: A dedicated user-facing dashboard for cardholders to monitor their identity safety score, risk breakdown, and activity maps.
- **Executive Mode**: A high-level view for C-suite stakeholders, focused on top-tier KPIs like KL Divergence and system stress.

### 🛡️ Risk-Based Containment
- **4-Tier Action Engine**: Automated responses scale from nominal `ALLOW`, up step-up authentication (`SUSPICIOUS`), localized `REQUIRE_MANUAL_REVIEW` account freezing (`HIGH RISK`), and `BLOCK_TRANSACTION` micro-device isolation (`CRITICAL`).
- **Fraud Protection Mode (Safe Mode)**: A threshold-activated system state that dynamically triggers when multiple high-severity threats occur in rapid succession, temporarily requiring manual human authorization on all high-value outbound pipelines.
- **Zero Trust Verification**: A cryptographic device-level 3-stage challenge modal (OTP + Biometric + Device Handshake) that intercepts high-risk transactions dynamically mid-flight.
- **Threat Lockdown + MFA Unlock**: When `threatIndex >= 90`, UI operations are locked until a valid TOTP code is verified.
- **MFA Admin Override**: Secure, role-gated mechanism to bypass system freezes on individual entities.

---

## ⚙️ 3. Technical Architecture

### 🛡️ ML Ensemble Scoring
The heart of the system is a 3-model weighted ensemble (XGBoost + Autoencoder + iForest) with weighted fusion across multiple intelligence layers:
1. **Rule Layer (25%)**: Velocity, Amount heuristics.
2. **ML Layer (35%)**: Ensemble anomaly scores with XAI explanations.
3. **Behavioral Layer (25%)**: Historical entropy and footprint deviation.
4. **Graph Layer (15%)**: Real-time relationship linkage.

### ⚡ Infrastructure Stack
- **Frontend**: React 18, TypeScript, Vite, Framer Motion, Recharts, Leaflet, D3.js.
- **API Gateway**: Node.js/Express, Zod, JWT (RS256/HS256), Pino.
- **Realtime Layer**: Redis Pub/Sub Event Bus + Socket.io high-frequency streams.
- **Persistence**: MongoDB (Forensics), Redis (In-memory aggregation).
- **ML Service**: FastAPI/Python, Pydantic, Scikit-learn, PyTorch.
- **Copilot Intelligence**: Gemini + optional Pinecone RAG retrieval with source citations.
- **Observability**: Pino structured logs with optional Loki push (`LOKI_PUSH_URL`).
- **Migrations**: Versioned MongoDB migration runner with applied-state tracking.

---

## 🛠 4. Development & Quick Start

### Infrastructure Setup
```bash
# Spin up the entire ecosystem
docker-compose up --build -d
```

### Default Local Credentials (Development)
These are auto-bootstrapped in non-production after Mongo connects:
- `admin@fraud.local` / `StrongPassword123!`
- `analyst@fraud.local` / `AnalystPassword123!`

### Run Database Migrations
```bash
cd api-gateway
npm run migrate
```

### Index Copilot Knowledge Base (Optional RAG)
```bash
cd api-gateway
npm run index:kb
```

### Run Tests
```bash
# Backend unit tests
cd api-gateway && npm run test

# Frontend E2E tests
cd frontend && npm run test:e2e
```

### Accessing the Platform
1. **Admin/Analyst**: Use role `admin` or `analyst` during registration to access the Command Center.
2. **Cardholder**: Use role `user` to land in the Personal Security Portal.

### Realtime Telemetry
The frontend binds to the following high-frequency channels:
- `transactions.live`: Real-time score streaming.
- `fraud.alerts`: High-priority event notifications.
- `system.threatIndex`: Global risk level synchronization.

---

## 🎖 Professional Standards
"We don't just detect fraud. We provide the visual and intelligence workspace to understand, investigate, and eliminate it in real-time."

*Built for Scale. Engineered for Trust. Cinematic Grade.*
