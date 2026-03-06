# 🧬 Digital DNA — Human Authenticity Engine

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

> **Detect AI-generated fraud by watching HOW forms are filled — not just what is written.**

A full-stack behavioural biometrics website that generates a real-time **Human Authenticity Score** for every KYC/form session — catching synthetic identity fraud that content-only scanners miss.

---

## 🌐 Website Pages

| Page | Route | Description |
|------|-------|-------------|
| 🏠 Landing Page | `/` | Hero, features, stats, how-it-works preview |
| 📖 How It Works | `/how-it-works` | Technical pipeline + signal reference table |
| ▶️ Live Demo | `/demo` | Human vs Bot simulation with live scoring |
| 📝 KYC Form | `/kyc` | Real form with behavioural monitoring active |
| 📊 Dashboard | `/dashboard` | Analyst view — sessions, trends, risk charts |

---

## 💡 The Core Idea

```
Human typing "John Doe":
  J → (310ms) → o → (280ms) → h → ← backspace → h → n ...
  Natural. Uneven. Makes mistakes. Thinks.

Bot filling the same field:
  [PASTE] → entire field filled in 8ms
  Zero gaps. Zero errors. Completely unnatural.

Digital DNA catches the bot. Every time.
```

---

## 🏗️ Architecture

```
Browser (React Website)
│
├── BehaviorCapture SDK (JS)
│   ├── Keystroke inter-key intervals
│   ├── Mouse movement paths
│   ├── Paste / copy events
│   └── Scroll, focus, blur
│
│   HTTP POST every 5s + on submit
│
▼
FastAPI Backend (Python)
│
├── Feature Extractor → 20+ behavioural features
├── Isolation Forest  → anomaly probability
├── Heuristic Rules   → fallback scoring
│
├── POST /api/behavioral/events
├── GET  /api/behavioral/score/{session_id}
├── GET  /api/behavioral/sessions
└── GET  /api/behavioral/stats
│
▼
PostgreSQL Database
└── behavioral_sessions table

▼
Analyst Dashboard (React)
└── Live sessions, risk charts, score distribution
```

---

## 📁 Project Structure

```
digital-dna-website/
│
├── 📂 frontend/                        # React Website (5 pages)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx            # Landing page
│   │   │   ├── HowItWorksPage.jsx      # Technical explainer
│   │   │   ├── DemoPage.jsx            # Live demo
│   │   │   ├── KYCPage.jsx             # KYC form page
│   │   │   └── DashboardPage.jsx       # Analyst dashboard
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Site navigation
│   │   │   ├── Footer.jsx              # Site footer
│   │   │   ├── Dashboard.jsx           # Dashboard charts + table
│   │   │   ├── DemoMode.jsx            # Human vs Bot simulator
│   │   │   └── KYCForm.jsx             # Monitored KYC form
│   │   └── utils/
│   │       └── behaviorCapture.js      # JS behavioural SDK
│   ├── public/index.html
│   └── package.json
│
├── 📂 backend/                         # FastAPI Python API
│   ├── main.py                         # App entry point
│   ├── database.py                     # DB models (SQLAlchemy)
│   ├── routes/
│   │   ├── behavioral.py               # Core API endpoints
│   │   ├── advanced.py                 # Benchmark, drift, adversarial
│   │   └── health.py                   # Health check
│   └── services/
│       ├── feature_extractor.py        # Events → feature vector
│       ├── scoring.py                  # ML + heuristic scoring
│       ├── baseline_comparison.py      # Model benchmarking
│       ├── adversarial_simulator.py    # Evasion attack testing
│       ├── drift_monitor.py            # KS-test drift detection
│       └── realtime_pipeline.py        # Kafka / polling pipeline
│
├── 📂 ml/                              # ML Training Pipeline
│   ├── training/
│   │   ├── train.py                    # Isolation Forest + LSTM
│   │   ├── baseline.py                 # Logistic Regression baseline
│   │   └── adversarial.py             # Robustness evaluation
│   └── models/                         # Saved model artifacts
│
├── 📂 infrastructure/                  # Production deployment
│   ├── docker-compose.prod.yml
│   ├── nginx.prod.conf
│   └── deploy.sh
│
├── docker-compose.yml                  # Local dev: one command startup
├── render.yaml                         # Render.com auto-deploy
├── vercel.json                         # Vercel frontend config
└── .env.example                        # Environment variable template
```

---

## 🚀 Running Locally

### Option A — Frontend Only (Quickest, no backend needed)

```bash
# 1. Install Node.js from https://nodejs.org (LTS version)

# 2. Go to frontend folder
cd frontend

# 3. Install packages
npm install

# 4. Start the website
npm start
```

Opens at **http://localhost:3000** — all 5 pages work instantly.

> Note: KYC scoring and dashboard data require the backend running too.

---

### Option B — Full Stack with Docker (Recommended)

```bash
# 1. Install Docker Desktop from https://docker.com

# 2. Copy environment file
cp .env.example .env

# 3. Start everything (database + backend + frontend)
docker-compose up --build
```

| Service | URL |
|---------|-----|
| 🌐 Website | http://localhost:3000 |
| 🔌 API | http://localhost:8000 |
| 📖 API Docs | http://localhost:8000/docs |

---

### Option C — Full Stack Manual

```bash
# Terminal 1 — Database
docker run -d --name digitaldna-db \
  -e POSTGRES_USER=digitaldna \
  -e POSTGRES_PASSWORD=digitaldna \
  -e POSTGRES_DB=digitaldna \
  -p 5432:5432 postgres:16-alpine

# Terminal 2 — Train ML model
cd ml
pip install -r requirements.txt
python training/train.py --mode all

# Terminal 3 — Backend
cd backend
pip install -r requirements.txt
python main.py

# Terminal 4 — Frontend
cd frontend
npm install
npm start
```

---

## 🔬 Behavioural Signals

| Signal | Human | Bot / AI | Weight |
|--------|-------|----------|--------|
| Inter-Key Interval (IKI) | 150–600ms, variable | <80ms, robotic | HIGH |
| IKI Variance | σ² > 5,000 | σ² < 500 | HIGH |
| Backspace Rate | 5–20% | ~0% | HIGH |
| Paste Events | 0–1 | 3–6+ | HIGH |
| Edit Bursts | Many | Near zero | MEDIUM |
| Mouse Speed Variance | High, organic | Uniform, linear | MEDIUM |
| Session Duration | 1–5 minutes | <30 seconds | MEDIUM |

### Risk Levels

| Score | Risk | Action |
|-------|------|--------|
| ≥ 60% | 🟢 LOW | Auto-approve |
| 30–60% | 🟡 MEDIUM | Manual review |
| < 30% | 🔴 HIGH | Block / investigate |

---

## 🤖 ML Models

| Model | Type | Use |
|-------|------|-----|
| **Isolation Forest** | Unsupervised anomaly detection | Primary scorer — no labels needed |
| **LSTM** | Supervised deep learning | IKI sequence classifier (PyTorch) |
| **Heuristic Rules** | Rule-based | Instant fallback, zero training required |
| **Logistic Regression** | Baseline classifier | Benchmark comparison only |

---

## 🌐 API Reference

```
POST /api/behavioral/events          → Ingest event batch from SDK
GET  /api/behavioral/score/:id       → Get session risk score
GET  /api/behavioral/sessions        → List sessions (dashboard)
GET  /api/behavioral/stats           → Aggregate stats + charts
GET  /api/advanced/benchmark         → Model comparison report
GET  /api/advanced/drift             → Distribution drift detection
POST /api/advanced/adversarial       → Run evasion attack simulation
GET  /api/health                     → Health check
```

Full interactive docs: **http://localhost:8000/docs**

---

## ☁️ Deployment

### Render + Vercel (Free)
```bash
# Backend → Render.com (uses render.yaml)
# Frontend → Vercel (uses vercel.json)
# Database → Render PostgreSQL (free tier)
```

### VPS (DigitalOcean / AWS)
```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh
```

See **DEPLOYMENT.md** for full step-by-step guides.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Website Framework | React 18 + React Router v6 |
| Charts | Recharts |
| Behavioural Capture | Vanilla JS Web APIs |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL + SQLAlchemy Async |
| Anomaly Detection | Scikit-learn Isolation Forest |
| Sequence Classifier | PyTorch LSTM |
| Containerisation | Docker + Docker Compose |
| Fonts | Syne + JetBrains Mono (Google Fonts) |

---

## 📸 Pages Preview

```
/ ..................... Dark landing page — hero, stats bar, features grid, CTA
/how-it-works ......... 4-stage pipeline + behavioural signals reference table
/demo ................. Human vs Bot live simulation with animated score meter
/kyc .................. Real monitored form — fill it, get your authenticity score
/dashboard ............ Analyst view — live sessions, hourly risk chart, drill-down
```

---

*"You can generate perfect text with AI in 3 seconds. But your fingers will always give you away."*
