import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.database import init_db
from app.routers import uploads, results, classes, courses, practicums, exports

# Path to the built frontend
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    await init_db()
    yield
    # Cleanup on shutdown

app = FastAPI(
    title="ProcessAssessmentAI Assessment API",
    description="Backend for automated university practicum assessment",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root check
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "processassessmentai"}

# Include API routers
app.include_router(uploads.router, prefix="/api/uploads", tags=["Uploads"])
app.include_router(results.router, prefix="/api/results", tags=["Results"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
app.include_router(classes.router, prefix="/api/classes", tags=["Classes"])
app.include_router(practicums.router, prefix="/api/practicums", tags=["Practicums"])
app.include_router(exports.router, prefix="/api/exports", tags=["Exports"])

# --- Serve the built React frontend ---
if FRONTEND_DIR.exists():
    # Mount static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="static-assets")
    
    # Catch-all: serve index.html for any non-API route (React Router handles client-side routing)
    @app.get("/{full_path:path}")
    async def serve_frontend(request: Request, full_path: str):
        # If the path points to an actual file in dist, serve it
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        # Otherwise serve index.html (let React Router handle it)
        return FileResponse(str(FRONTEND_DIR / "index.html"))
