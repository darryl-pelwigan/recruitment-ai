# Recruitment AI

An AI-powered recruitment tracking system that automates and streamlines the entire hiring lifecycle — from job posting to candidate matching — using NLP-driven scoring to reduce manual screening and improve hiring decisions.

---

## Features

- **Job Management** — Create, update, and publish job postings with required skills and descriptions
- **Candidate Applications** — Track applications across every stage of the hiring pipeline
- **AI/NLP Scoring** — Automatically rank and score candidates based on resume-to-job-description relevance
- **Keyword Extraction** — Surface the most relevant skills and qualifications from candidate profiles
- **Authentication & Authorization** — JWT-based auth with role-aware access control
- **Interactive API Docs** — Auto-generated Swagger UI at `/docs`

---

## Tech Stack

### Backend

| Package | Version | Purpose |
|---|---|---|
| FastAPI | 0.136.3 | Web framework |
| Uvicorn | 0.49.0 | ASGI server |
| SQLAlchemy | 2.0.50 | ORM |
| Alembic | 1.18.4 | Database migrations |
| Pydantic | 2.13.4 | Data validation / schemas |
| python-jose | 3.5.0 | JWT encoding / decoding |
| passlib + bcrypt | 1.7.4 / 5.0.0 | Password hashing |
| psycopg2-binary | 2.9.12 | PostgreSQL driver |
| python-dotenv | 1.2.2 | `.env` file loading |

### Frontend

| Technology | Purpose |
|---|---|
| React | UI library |
| Vite | Build tool / dev server |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP client |
| Zustand | Global state management |

### Database

- **PostgreSQL** — Primary relational database


## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL

---

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://user:pass@localhost/recruitment_db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Run database migrations:

```bash
alembic upgrade head
```

Start the API server:

```bash
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/jobs` | List all job postings |
| POST | `/jobs` | Create a new job posting |
| GET | `/jobs/{id}` | Get job details |
| POST | `/applications` | Submit an application |
| GET | `/applications/{job_id}` | List applicants for a job |
| GET | `/ai/score/{application_id}` | Get AI score for an applicant |
| GET | `/ai/rank/{job_id}` | Get ranked candidates for a job |

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | Secret key for JWT signing |
| `ALGORITHM` | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry duration in minutes |

---

## Architecture Decisions

- **Routes are thin** — all business logic lives in the matching service layer.
- **Schemas are separate from ORM models** — Pydantic schemas handle validation and serialization; SQLAlchemy models own persistence.
- **`ai_service.py` owns all NLP logic** — scoring, keyword extraction, and ranking are isolated from routes.
- **`security.py` is the single source of truth** for JWT encoding/decoding — token logic is never inlined elsewhere.
- **Frontend API calls go through `services/api.js`** — components never call Axios directly.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.
