---
description: How to start the backend and frontend development servers locally
globs: ["backend/**", "frontend/**", "*.config.*"]
---

# Development Setup

## Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API base URL: `http://localhost:8000/api`
- Interactive docs: `http://localhost:8000/docs`
- All routes are mounted under `/api` prefix (set in `main.py`)

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

- App URL: `http://localhost:5173`
- API calls go through `src/api/api.ts` which targets `http://127.0.0.1:8000/api`
- CORS is configured in `backend/app/main.py` to allow `http://localhost:5173`

## Documentation Generation

Before generating documentation:

1. Start the backend.
2. Start the frontend.
3. Verify the application loads successfully.
4. Ensure demo accounts are available.
5. Ensure sample data exists for screenshots.

Claude should never generate documentation against a broken or partially loaded application.
