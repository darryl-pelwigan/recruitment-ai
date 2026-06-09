from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth

app = FastAPI(title="Recruitment AI System", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")


@app.get("/api/")
def root():
    return {"message": "Recruitment AI Running"}
