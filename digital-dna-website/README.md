# 🧬 Digital DNA – Human Authenticity Scoring Engine

> **Hack-O-Hire | Barclays Hackathon Project**  
> Detecting AI-assisted fraud through behavioral biometrics — not just content scanning.

---

## 💡 What Is This?

Digital DNA is a **real-time fraud detection system** that watches *how* a user fills out a form — not *what* they write.

When someone submits a KYC application, loan form, or fund transfer request, this system silently analyzes:
- How fast they type (and how *consistent* that speed is)
- Whether they make typos and correct them
- Whether they pasted text instead of typing it
- How their mouse moves across the screen
- How long they spent on the form

It then generates a **Human Authenticity Score** between 0–100% and flags the session as LOW, MEDIUM, or HIGH risk.

**Why does this matter for Barclays?**  
AI tools like ChatGPT can generate perfect KYC responses in seconds. Traditional fraud detection reads the *content* — but AI-generated content looks identical to human content. Digital DNA catches the fraud by analyzing the *behavior* instead.

---

## 🎯 The Core Idea (In Simple Terms)

```
A real human typing "John Michael Doe":
  J → (280ms gap) → o → (310ms gap) → h → (oops, backspace) → h → n ...
  Uneven. Messy. Natural.

A bot pasting "John Michael Doe":
  [PASTE EVENT] → entire field filled in 12ms
  Zero gaps. Zero mistakes. Unnatural.

Digital DNA catches the bot.
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│   ┌──────────────┐        ┌──────────────────────────────┐     │
│   │  KYC Form    │        │   BehaviorCapture SDK (JS)   │     │
│   │  (React)     │◄──────►│   - Keystroke IKI tracking   │     │
│   │              │        │   - Mouse path recording      │     │
│   │  Shows:      │        │   - Paste/copy detection      │     │
│   │  Auth Score  │        │   - Scroll & focus events     │     │
│   └──────────────┘        └──────────────┬───────────────┘     │
│                                          │ Events every 5s      │
└──────────────────────────────────────────┼─────────────────────┘
                                           │ HTTP POST
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                            │
│                                                                 │
│   /api/behavioral/events  ──► Feature Extractor                 │
│                                    │                            │
│                                    ▼                            │
│                              20 Features:                       │
│                              avg_iki, iki_variance,             │
│                              backspace_rate, paste_count...     │
│                                    │                            │
│                                    ▼                            │
│                           ML Scoring Service                    │
│                           (Isolation Forest / Heuristic)        │
│                                    │                            │
│                                    ▼                            │
│                        Authenticity Score 0–1                   │
│                        Risk: LOW / MEDIUM / HIGH                │
│                                    │                            │
│   /api/behavioral/score  ◄─────────┘                            │
│   /api/behavioral/sessions                                      │
│   /api/behavioral/stats                                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       POSTGRESQL DB                             │
│   behavioral_sessions table:                                    │
│   session_id | score | risk_level | avg_iki | paste_count ...   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYST DASHBOARD (React)                    │
│   - Live session table with risk badges                         │
│   - Hourly risk trend bar chart                                 │
│   - Score distribution histogram                                │
│   - Expandable session detail view                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
digital-dna/
│
├── 📂 frontend/                        # React Application
│   ├── 📂 src/
│   │   ├── 📂 utils/
│   │   │   └── behaviorCapture.js      # Invisible event capture SDK
│   │   ├── 📂 components/
│   │   │   ├── KYCForm.jsx             # KYC form + score display
│   │   │   └── Dashboard.jsx           # Fraud analyst dashboard
│   │   ├── App.jsx                     # App root with nav
│   │   └── index.js                    # React entry point (add this)
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── 📂 backend/                         # FastAPI Python Backend
│   ├── main.py                         # App entry point
│   ├── database.py                     # DB models + connection
│   ├── 📂 routes/
│   │   ├── behavioral.py               # All API endpoints
│   │   └── health.py                   # Health check
│   ├── 📂 services/
│   │   ├── feature_extractor.py        # Raw events → feature numbers
│   │   └── scoring.py                  # Feature numbers → risk score
│   ├── requirements.txt
│   └── Dockerfile
│
├── 📂 ml/                              # Machine Learning Pipeline
│   ├── 📂 training/
│   │   └── train.py                    # Train Isolation Forest + LSTM
│   ├── 📂 models/                      # Saved model files (after training)
│   └── requirements.txt
│
├── docker-compose.yml                  # Run everything with one command
├── .env.example                        # Environment variable template
└── README.md                           # This file
```

---

## ⚙️ Prerequisites

Before running anything, make sure you have these installed:

| Tool | Version | Download |
|------|---------|----------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://www.python.org |
| Git | Any | https://git-scm.com |

> **Tip:** If you only want the Docker route, you only need Docker. Everything else is optional.

---

## 🚀 How To Run (Step by Step)

### ✅ Option 1 — Docker (Easiest, Recommended)

This starts everything — database, backend, frontend — with a single command.

```bash
# Step 1: Go into the project folder
cd digital-dna

# Step 2: Copy the environment file
cp .env.example .env

# Step 3: Start everything
docker-compose up --build
```

Wait about 60–90 seconds for everything to build and start. Then open:

| What | URL |
|------|-----|
| 🖥️ KYC Form | http://localhost:3000 |
| 📊 Analyst Dashboard | http://localhost:3000 (click "Analyst Dashboard" tab) |
| 🔌 API | http://localhost:8000 |
| 📖 API Swagger Docs | http://localhost:8000/docs |

To stop everything:
```bash
docker-compose down
```

---

### ✅ Option 2 — Run Locally (Step by Step)

Use this if you want to develop and make changes.

#### Step 1 — Start the Database

```bash
docker run -d \
  --name digitaldna-db \
  -e POSTGRES_USER=digitaldna \
  -e POSTGRES_PASSWORD=digitaldna \
  -e POSTGRES_DB=digitaldna \
  -p 5432:5432 \
  postgres:16-alpine
```

#### Step 2 — Train the ML Model

```bash
# Go to the ML folder
cd ml

# Install Python packages
pip install -r requirements.txt

# Train the model (takes about 30–60 seconds)
python training/train.py --mode all
```

You will see output like:
```
INFO  Generating synthetic training data...
INFO  Fitting StandardScaler...
INFO  Training Isolation Forest...
              precision    recall  f1-score
   anomaly        0.81      0.76      0.78
    normal        0.93      0.95      0.94
INFO  Isolation Forest saved to models/isolation_forest.joblib
INFO  Training complete!
```

#### Step 3 — Start the Backend

```bash
# Go to the backend folder
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install packages
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql+asyncpg://digitaldna:digitaldna@localhost:5432/digitaldna"
export MODEL_PATH="../ml/models"

# Start the server
python main.py
```

You will see:
```
INFO  Starting Digital DNA API...
INFO  Database tables created.
INFO  Isolation Forest model loaded.
INFO  Uvicorn running on http://0.0.0.0:8000
```

#### Step 4 — Add the Missing React Entry Files

Before starting the frontend, create these two files:

**frontend/src/index.js**
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

**frontend/public/index.html**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Digital DNA – Human Authenticity Engine</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

#### Step 5 — Start the Frontend

```bash
# Go to the frontend folder
cd frontend

# Install packages
npm install

# Create local environment file
echo "REACT_APP_API_URL=http://localhost:8000/api/behavioral" > .env.local

# Start the app
npm start
```

Browser opens automatically at http://localhost:3000.

---

## 🧪 Testing the System

### Test 1 — Human Behavior (Should Score GREEN)

1. Open http://localhost:3000
2. Click the **KYC Form** tab
3. Type everything manually — take your time, make a typo or two
4. Click **Submit KYC Application**
5. Expected result: **Green panel, 65–90% authenticity, LOW risk**

### Test 2 — Bot Behavior (Should Score RED)

1. Open a new tab at http://localhost:3000
2. Copy this text: `John Michael Doe`
3. Paste it into the Full Name field
4. Copy-paste content into every other field too
5. Click **Submit** within 10 seconds of opening the page
6. Expected result: **Red panel, less than 30% authenticity, HIGH risk**

### Test 3 — API Directly via curl

```bash
# Submit a fake bot session
curl -X POST http://localhost:8000/api/behavioral/events \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-bot-001",
    "form_id": "kyc-form",
    "is_final": true,
    "session_duration": 8000,
    "events": [
      {"t": 100, "type": "paste", "length": 500, "wordCount": 90},
      {"t": 200, "type": "keydown", "key": "CHAR", "iki": 35},
      {"t": 235, "type": "keydown", "key": "CHAR", "iki": 32},
      {"t": 267, "type": "keydown", "key": "CHAR", "iki": 34},
      {"t": 300, "type": "paste", "length": 300, "wordCount": 50}
    ]
  }'

# Get the score
curl http://localhost:8000/api/behavioral/score/test-bot-001
```

Expected response:
```json
{
  "session_id": "test-bot-001",
  "authenticity_score": 0.18,
  "anomaly_probability": 0.82,
  "risk_level": "HIGH",
  "reason": "High probability of AI-assisted content. Signals: Content primarily pasted; Abnormally fast typing",
  "features": {
    "paste_count": 2,
    "backspace_rate": 0.0,
    "avg_iki": 33.7
  }
}
```

---

## 📊 What the Output Looks Like

### KYC Form — Human Session (GREEN)

```
┌─────────────────────────────────────────────┐
│  Human Authenticity Score          🟢 LOW   │
│                                             │
│              82.1%                          │
│                                             │
│  Anomaly Probability:      17.9%            │
│  Typing Naturalness:       78.4%            │
│  Mouse Naturalness:        65.0%            │
│  Paste Events:               0              │
│  Backspace Rate:           11.2%            │
│                                             │
│  "Session exhibits natural human            │
│   behavioral patterns."                     │
└─────────────────────────────────────────────┘
```

### KYC Form — Bot Session (RED)

```
┌─────────────────────────────────────────────┐
│  Human Authenticity Score         🔴 HIGH   │
│                                             │
│              18.4%                          │
│                                             │
│  Anomaly Probability:      81.6%            │
│  Typing Naturalness:        8.2%            │
│  Mouse Naturalness:        12.0%            │
│  Paste Events:               2              │
│  Backspace Rate:            0.0%            │
│                                             │
│  "High probability of AI-assisted content.  │
│   Content primarily pasted, not typed."     │
└─────────────────────────────────────────────┘
```

### Analyst Dashboard

```
┌──────────┬────────────┬────────────┬────────────────┐
│ Sessions │  High Risk │ AI Flagged │ Avg Auth Score │
│   142    │     23     │     19     │     71.4%      │
└──────────┴────────────┴────────────┴────────────────┘

[Hourly Risk Bar Chart — stacked red / yellow / green bars]

Session Log:
┌──────────┬──────────┬────────┬───────────┬────────┐
│ Session  │  Form    │  Time  │ Auth Score│  Risk  │
├──────────┼──────────┼────────┼───────────┼────────┤
│ a3f9c... │ kyc-form │ 14:32  │  18.4%    │  HIGH  │
│ b7d2e... │ kyc-form │ 14:28  │  82.1%    │  LOW   │
│ c1a5f... │ kyc-form │ 14:21  │  51.3%    │ MEDIUM │
└──────────┴──────────┴────────┴───────────┴────────┘
```

---

## 🔬 How Scoring Works

### Features Extracted From Every Session

| Feature | What It Measures | Human | Bot / AI |
|---------|-----------------|-------|----------|
| avg_iki | Average gap between keystrokes | 150–600ms | Less than 80ms |
| iki_variance | How much the gap varies | Very high | Near zero |
| backspace_rate | Typos corrected | 5–20% | ~0% |
| burst_typing_ratio | Keys pressed faster than 80ms | Less than 5% | Over 50% |
| paste_count | Number of paste events | 0–1 | 3 or more |
| paste_dominance | Percentage of content pasted vs typed | Less than 15% | Over 60% |
| edit_bursts | Delete-then-retype sequences | Many | None |
| mouse_speed_variance | How naturally the mouse moves | High | Very low |
| session_duration | Time to complete the form | 1–5 minutes | Under 30 seconds |

### Risk Thresholds

| Authenticity Score | Risk Level | Recommended Action |
|-------------------|-----------|-------------------|
| 60% – 100% | 🟢 LOW | Auto-approve |
| 30% – 60% | 🟡 MEDIUM | Flag for manual review |
| 0% – 30% | 🔴 HIGH | Block and investigate |

---

## 🤖 ML Models Used

### Isolation Forest (Primary Model)
- Unsupervised anomaly detection — no labeled fraud data needed
- Trained only on genuine human behavioral sessions
- Sessions that don't match the human pattern get flagged
- Fast inference, works in real time

### LSTM Sequence Model (Secondary Model)
- Supervised deep learning classifier
- Learns the temporal rhythm of human IKI sequences
- Requires PyTorch (`pip install torch`)
- More accurate with sufficient labeled data

### Heuristic Rules (Fallback)
- Works immediately with zero training required
- Rule-based scoring using known fraud signals
- Automatically replaced once ML training completes

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/behavioral/events` | Send event batch from frontend SDK |
| GET | `/api/behavioral/score/{session_id}` | Get authenticity score for a session |
| GET | `/api/behavioral/sessions` | List all sessions for the dashboard |
| GET | `/api/behavioral/stats` | Aggregate stats for charts |
| POST | `/api/behavioral/flag/{session_id}` | Manually flag a session |
| GET | `/api/health` | Health check |

Full interactive API docs available at: **http://localhost:8000/docs**

---

## ☁️ Cloud Deployment (AWS)

```bash
# 1. Build all images
docker-compose build

# 2. Push backend to Amazon ECR
aws ecr get-login-password --region eu-west-2 | \
  docker login --username AWS --password-stdin <YOUR_ECR_URL>

docker tag digitaldna-backend:latest <YOUR_ECR_URL>/digitaldna-backend:latest
docker push <YOUR_ECR_URL>/digitaldna-backend:latest

# 3. Deploy on ECS
# Use RDS PostgreSQL as your database
# Set DATABASE_URL env var in the ECS task definition to your RDS endpoint
```

---

## 🔒 Production Security Checklist

- [ ] Replace `allow_origins=["*"]` with your actual domain in backend/main.py
- [ ] Store DB credentials in AWS Secrets Manager, not in .env
- [ ] Enable HTTPS via Application Load Balancer or CloudFront
- [ ] Add rate limiting on `/api/behavioral/events` to prevent abuse
- [ ] Encrypt the `raw_events` column (contains user behavioral data)
- [ ] Enable Kafka streaming for high-volume real-time processing
- [ ] Retrain ML models monthly using real collected session data
- [ ] Connect HIGH risk alerts to your fraud case management system

---

## 🏆 Hackathon Demo Script

**Opening Line:**
> "Barclays processes thousands of KYC applications daily. AI tools can now generate perfect-looking responses in seconds. The problem? Traditional NLP detectors read the text — but AI-generated text looks identical to human text. We needed a different approach."

**The Pitch:**
> "Digital DNA doesn't read what you wrote. It watches how you wrote it. We capture the behavioral fingerprint embedded in every interaction — the pauses, the typos, the mouse wobble — and turn it into a real-time Human Authenticity Score."

**Live Demo — Do This On Stage:**
1. Open the KYC form, type naturally for 2 minutes → show the **GREEN 80%+ score**
2. Open a new tab, paste everything from clipboard, submit in 10 seconds → show the **RED sub-20% score**
3. Switch to the analyst dashboard → show both sessions side by side with contrasting risk badges

**Closing Line:**
> "You can't fake 3 minutes of natural human typing. You can generate perfect text with AI in 3 seconds — but your fingers will always give you away."

---

## 👥 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend UI | React 18 |
| Charts | Recharts |
| Behavioral Capture | Vanilla JavaScript Web APIs |
| Backend Framework | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy Async |
| Anomaly Detection | Scikit-learn Isolation Forest |
| Sequence Classifier | PyTorch LSTM |
| Containerization | Docker + Docker Compose |
| Cloud Target | AWS ECS + RDS |

---

*"Don't scan what they wrote. Watch how they wrote it."*
