from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import create_tables
from api.routers import hcps, interactions, chat, actions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    create_tables()
    print("[OK] Database tables created/verified")
    yield
    # Shutdown
    print("[BYE] Server shutting down")


app = FastAPI(
    title="AI-First CRM — HCP Module",
    description="Pharmaceutical field rep CRM with AI-powered interaction logging",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(hcps.router)
app.include_router(interactions.router)
app.include_router(chat.router)
app.include_router(actions.router)


@app.get("/")
def root():
    return {
        "app": "AI-First CRM HCP Module",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
