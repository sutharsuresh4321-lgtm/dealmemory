import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import init_db, SessionLocal
from app.db.seed import load_seed_data
from app.api import accounts, interactions, agent, memory, outcomes, seed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("dealmemory")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and load seed data if empty
    logger.info("Initializing DealMemory database...")
    init_db()
    with SessionLocal() as db:
        load_seed_data(db, force=False)
    logger.info("DealMemory startup completed.")
    yield
    # Shutdown
    logger.info("DealMemory shutting down.")


app = FastAPI(
    title="DealMemory API",
    description="Deal Intelligence Agent with Persistent Memory powered by Hindsight",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(accounts.router, prefix="/api")
app.include_router(interactions.router, prefix="/api")
app.include_router(agent.router, prefix="/api")
app.include_router(memory.router, prefix="/api")
app.include_router(outcomes.router, prefix="/api")
app.include_router(seed.router, prefix="/api")


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "DealMemory",
        "version": "1.0.0",
        "hindsight_bank": settings.HINDSIGHT_BANK_ID,
        "llm_provider": settings.LLM_PROVIDER,
    }
