import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import auth, jobs, applications, users, saved_applicants, saved_jobs, admin

app = FastAPI(title="Recruitment AI System", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directories exist
_base = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(os.path.join(_base, "avatars"), exist_ok=True)
os.makedirs(os.path.join(_base, "logos"), exist_ok=True)
os.makedirs(os.path.join(_base, "resumes"), exist_ok=True)

app.mount("/uploads", StaticFiles(directory=os.path.join(_base)), name="uploads")

app.include_router(auth.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(saved_applicants.router, prefix="/api")
app.include_router(saved_jobs.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/api/")
def root():
    return {"message": "Recruitment AI Running"}
