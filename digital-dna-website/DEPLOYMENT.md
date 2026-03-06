# 🚀 Deployment Guide — Digital DNA v2

Deploy your frontend and backend FREE to the internet in under 30 minutes.
No credit card needed for any of the free options below.

---

## Option A — Render (Backend) + Vercel (Frontend) ✅ Recommended

### STEP 1 — Push code to GitHub
```bash
cd digital-dna-complete
git init
git add .
git commit -m "Digital DNA v2 — initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/digital-dna.git
git push -u origin main
```

### STEP 2 — Create PostgreSQL database on Render
1. Go to https://render.com → Sign up with GitHub
2. Click **New** → **PostgreSQL**
3. Name: `digitaldna-db`, Plan: **Free**
4. Click **Create Database**
5. Copy the **Internal Database URL** — needed in Step 4

### STEP 3 — Deploy Backend on Render
1. Click **New** → **Web Service**
2. Connect your GitHub repo
3. Fill in:
   - Root Directory: `backend`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Plan: **Free**

### STEP 4 — Set Environment Variables on Render
In Web Service → Environment → Add:
```
DATABASE_URL = [paste Internal DB URL, change postgresql:// to postgresql+asyncpg://]
MODEL_PATH   = ./models
```
Click **Save Changes** → **Deploy**

Backend live at: `https://digitaldna-backend.onrender.com`

Test: `https://digitaldna-backend.onrender.com/api/health`

### STEP 5 — Train ML models and push to GitHub
```bash
cd ml
pip install -r requirements.txt
python training/train.py --mode all
cd ..
git add ml/models/
git commit -m "Add trained ML models"
git push
```
Render redeploys automatically.

### STEP 6 — Deploy Frontend on Vercel
```bash
npm install -g vercel
cd frontend

# Create env file with your backend URL
echo "REACT_APP_API_URL=https://digitaldna-backend.onrender.com/api/behavioral" > .env.local

vercel
# Answer prompts: Y, your account, N (new project), digital-dna, ./, N
```

Frontend live at: `https://digital-dna.vercel.app`

Set production env on Vercel dashboard:
```
REACT_APP_API_URL = https://digitaldna-backend.onrender.com/api/behavioral
```
Then: `vercel --prod`

---

## Option B — Railway (Easiest all-in-one)

```bash
npm install -g @railway/cli
railway login
railway init
railway add --plugin postgresql
cd backend
railway up
railway domain
```

Set env vars in Railway dashboard:
```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
MODEL_PATH   = ./models
```

---

## Option C — VPS (DigitalOcean / AWS EC2) Full Control

```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repo
git clone https://github.com/YOUR_USERNAME/digital-dna.git
cd digital-dna

# Run deployment script
bash infrastructure/deploy.sh
```

Add HTTPS:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

---

## Verify Deployment Works

```bash
# Health check
curl https://YOUR_BACKEND/api/health

# Test scoring
curl -X POST https://YOUR_BACKEND/api/behavioral/events \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test-001","form_id":"kyc","is_final":true,"session_duration":45000,"events":[{"t":200,"type":"keydown","key":"CHAR","iki":null},{"t":480,"type":"keydown","key":"CHAR","iki":280},{"t":750,"type":"keydown","key":"Backspace","iki":270}]}'

curl https://YOUR_BACKEND/api/behavioral/score/test-001

# New v2 endpoints
curl https://YOUR_BACKEND/api/advanced/benchmark
curl https://YOUR_BACKEND/api/advanced/drift
```

---

## Cost Summary

| Component | Platform | Cost |
|-----------|---------|------|
| Frontend | Vercel | Free |
| Backend | Render | Free |
| Database | Render PostgreSQL | Free |
| VPS option | DigitalOcean | $4/month |

> **Note:** Render free tier sleeps after 15 min inactivity.
> First request takes ~30s. Use $7/month plan for always-on demo.
