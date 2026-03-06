"""
Digital DNA – FastAPI Backend v2
Behavioral scoring + real-time pipeline + drift monitoring +
adversarial simulation + baseline comparison.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn, logging

from routes.behavioral import router as behavioral_router
from routes.health     import router as health_router
from routes.advanced   import router as advanced_router
from database import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Digital DNA API v2...")
    await init_db()
    yield
    logger.info("Shutdown complete.")

app = FastAPI(
    title="Digital DNA – Human Authenticity Scoring API",
    description="Behavioral biometrics + real-time scoring + drift monitoring + adversarial robustness",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(behavioral_router, prefix="/api/behavioral", tags=["Behavioral Scoring"])
app.include_router(advanced_router,   prefix="/api/advanced",   tags=["Advanced — Drift, Adversarial, Baseline"])
app.include_router(health_router,     prefix="/api",            tags=["Health"])

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
