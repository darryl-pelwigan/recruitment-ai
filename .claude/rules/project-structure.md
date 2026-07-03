---
description: Directory layout and the responsibility of each file in the recruitment-ai project
alwaysApply: true
---

# Project Structure

```
recruitment-ai/
├── backend/
│   └── app/
│       ├── main.py             # FastAPI app entry point, router registration, CORS
│       ├── config.py           # Environment/settings via Pydantic BaseSettings
│       ├── models/             # SQLAlchemy ORM models (never import Pydantic here)
│       │   ├── user.py
│       │   ├── job.py
│       │   └── application.py
│       ├── schemas/            # Pydantic request/response schemas (no ORM logic)
│       │   ├── user_schema.py
│       │   └── job_schema.py
│       ├── routes/             # FastAPI routers — thin, delegate to services
│       │   ├── auth.py
│       │   ├── jobs.py
│       │   ├── applications.py
│       │   └── ai.py
│       ├── services/           # Business logic, one file per domain
│       │   ├── auth_service.py
│       │   └── ai_service.py   # All NLP/scoring logic lives here
│       └── core/
│           ├── security.py     # JWT creation and verification — single source of truth
│           └── database.py     # SQLAlchemy engine, session, and get_db dependency
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── pages/              # Route-level page components
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── Dashboard.tsx
        │   ├── Jobs.tsx
        │   ├── JobDetails.tsx
        │   └── Applicants.tsx
        ├── components/         # Reusable UI components
        │   ├── Navbar.tsx
        │   ├── Sidebar.tsx
        │   ├── JobCard.tsx
        │   ├── ApplicantTable.tsx
        │   ├── BrandLogo.tsx
        │   └── ThemeToggle.tsx
        ├── api/
        │   └── api.ts          # Axios instance with auth interceptor
        └── store/              # Zustand global state
            ├── authStore.ts    # Auth token, user, login/logout/register
            └── themeStore.ts   # Light/dark theme, persisted to localStorage
```

## Documentation

```
docs/
├── generated/         # Generated Word manuals
├── screenshots/       # Playwright screenshots
└── templates/         # Optional document templates
```

---

## Automation

```
automation/
├── playwright/        # Browser automation
├── prompts/           # Reusable prompts
└── scripts/           # Documentation helpers
```

---

## Claude Configuration

```
.claude/
├── CLAUDE.md
├── rules/
├── prompts/
├── agents/
└── skills/
```

Claude configuration files must remain separate from application source code.
