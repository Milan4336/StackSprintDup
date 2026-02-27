# FRAUD COMMAND CENTER (Ultra-HUD Editon v3.9)

A high-performance, cloud-native fraud intelligence platform designed for realtime detection, deep forensic investigation, and autonomous risk response. This platform has been evolved into a high-fidelity "Cinematic Ultra-HUD" environment, balancing expert heuristics with advanced ML ensemble scoring.

> [!NOTE]
> Detailed technical evolution and version history can be found in the [PATCH_NOTES.md](file:///\\wsl.localhost\kali-linux\home\milan\Stack_Sprint\PATCH_NOTES.md) file.

---

## 🚀 1. Cinematic Visual Intelligence
The platform features a "WOW"-factor UI designed for maximum situational awareness and immersive investigator experience.

### 🌑 Atmospheric Layers
- **Dynamic Threat Atmosphere**: Living background gradients that shift and breathe based on `threatIndex`.
- **SOC Grid Overlay**: Holographic background texture with moving laser scan lines.
- **Defense Shield**: High-intensity lockdown overlay activating at critical threat levels (`threatIndex > 95`).
- **Threat Shockwave**: Full-screen radial energy waves triggered by sudden risk spikes.

### 🎯 Localized Intelligence
- **Transaction Auras**: Risk-reactive energy glows centered around individual high-risk transaction records.
- **Forensic Scanlines**: Cinematic grid overlays embedded within deep investigation modals.
- **Explosion Markers**: Particle bursts highlighting fraud events on geospatial maps.
- **Interactive Neural Flow**: Live data throughput visualization representing ML model activity.

### 🔊 Audio Intelligence
- **Threat Audio Engine**: Browser-native Web Audio synthesis providing real-time sonification of risk levels, including escalation tones and critical pulses.

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

---

## 🛠 4. Development & Quick Start

### Infrastructure Setup
```bash
# Spin up the entire ecosystem
docker-compose up --build -d
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
