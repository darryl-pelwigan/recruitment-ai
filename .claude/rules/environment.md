---
description: Required environment variables and configuration for running the backend
globs: ["backend/**", ".env*"]
---

# Environment Variables

Create `backend/.env` — **never commit this file**.

```env
DATABASE_URL=postgresql://user:pass@localhost/recruitment_ai
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

| Variable                  | Description                                      |
|---------------------------|--------------------------------------------------|
| `DATABASE_URL`            | PostgreSQL connection string                     |
| `SECRET_KEY`              | Secret used to sign JWT tokens — keep this long and random |
| `ALGORITHM`               | JWT signing algorithm (`HS256` recommended)      |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime in minutes (default: `30`)    |

These are loaded via `python-dotenv` and read through `app/config.py` (Pydantic `BaseSettings`).

## Documentation Environment

Optional variables for documentation automation:

```env
DOCUMENTATION_OUTPUT=docs/generated
SCREENSHOT_OUTPUT=docs/screenshots
PLAYWRIGHT_BROWSER=chromium
```

These values may be overridden when running documentation generation.
