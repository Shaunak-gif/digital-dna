#!/bin/bash
# ============================================================
# Digital DNA — One-Click VPS Deployment Script
# Usage: bash infrastructure/deploy.sh
# ============================================================

set -e

echo "🧬 Digital DNA — Deployment Script"
echo "===================================="

# 1. Check Docker
if ! command -v docker &>/dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

# 2. Check Docker Compose
if ! command -v docker-compose &>/dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 3. Environment setup
if [ ! -f .env ]; then
    echo "⚙️  Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your values, then re-run this script."
    exit 1
fi

# 4. Train ML models if not present
if [ ! -f ml/models/isolation_forest.joblib ]; then
    echo "🤖 Training ML models..."
    cd ml
    pip install -r requirements.txt --quiet
    python training/train.py --mode unsupervised
    cd ..
    echo "✅ ML models trained."
fi

# 5. Build and start
echo "🐳 Building Docker containers..."
docker-compose up -d --build

# 6. Wait for backend health
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health | grep -q "ok"; then
        echo "✅ Backend is healthy!"
        break
    fi
    sleep 2
done

# 7. Done
echo ""
echo "🚀 Digital DNA is live!"
echo "   Frontend : http://localhost:3000"
echo "   Backend  : http://localhost:8000"
echo "   API Docs : http://localhost:8000/docs"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:      docker-compose down"
