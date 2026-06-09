from fastapi import FastAPI
from app.core.database import engine, Base

app = FastAPI(title="Recruitment AI System", version="1.0")


@app.get("/")
def root():
    return {"message": "Welcome to the Recruitment AI System!"}
