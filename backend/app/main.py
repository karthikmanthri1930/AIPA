from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.projects import router as projects_router

app = FastAPI(
    title="ProjectVision AI API",
    description="AI-powered infrastructure project monitoring and early-warning platform",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)


@app.get("/")
def root():
    return {
        "message": "ProjectVision AI API is running",
        "status": "online",
        "version": "1.1.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ProjectVision AI Backend",
    }
