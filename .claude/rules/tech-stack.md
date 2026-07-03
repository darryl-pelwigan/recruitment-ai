---
description: Package versions and technology choices for the backend and frontend
alwaysApply: true
---

# Tech Stack

## Backend (`backend/requirements.txt`)

| Package          | Version       | Purpose                     |
|------------------|---------------|-----------------------------|
| fastapi          | 0.136.3       | Web framework               |
| uvicorn          | 0.49.0        | ASGI server                 |
| sqlalchemy       | 2.0.50        | ORM                         |
| alembic          | 1.18.4        | Database migrations         |
| pydantic         | 2.13.4        | Data validation / schemas   |
| python-jose      | 3.5.0         | JWT encoding/decoding       |
| passlib + bcrypt | 1.7.4 / 5.0.0 | Password hashing            |
| psycopg2-binary  | 2.9.12        | PostgreSQL driver           |
| python-dotenv    | 1.2.2         | `.env` file loading         |
| starlette        | 1.2.1         | ASGI toolkit (FastAPI base) |

## Frontend

| Technology   | Version  | Purpose                          |
|--------------|----------|----------------------------------|
| React        | 19.x     | UI library                       |
| TypeScript   | 6.x      | Static typing                    |
| Vite         | 8.x      | Build tool / dev server          |
| Tailwind CSS | 4.x      | Utility-first styling            |
| Axios        | 1.x      | HTTP client (`src/api/api.ts`)   |
| Zustand      | 5.x      | Global state management          |
| react-router-dom    | 7.x  | Client-side routing                          |
| react-hook-form     | 7.x  | Form state management and submission         |
| zod                 | 3.x  | Schema-based field validation                |
| @hookform/resolvers | 5.x  | Bridges react-hook-form with Zod             |

### Form Validation Pattern
- Schemas live in `src/lib/schemas.ts` — one `z.object(...)` per form, exported with its inferred type.
- Pages import `useForm<T>({ resolver: zodResolver(schema) })` — no manual `useState` for field values.
- `isSubmitting` from `formState` drives the loading state on the submit button (no separate `useState`).
- Field errors render as `<p className="mt-1 text-xs text-red-500 ...">` directly below the input.
- Server-side API errors (e.g. "Email already registered") are kept in a separate `serverError` `useState`, shown above the submit button.
- Name clash: in `Register.tsx`, destructure authStore's `register` as `signUp` to avoid collision with react-hook-form's `register`.

### Tailwind CSS v4 Notes
- Dark mode uses `@variant dark (&:where(.dark, .dark *))` in `src/index.css` — class-based, not media-based.
- No separate `tailwind.config.js` — configured via `@tailwindcss/vite` plugin in `vite.config.ts`.

## AI Development

| Technology | Purpose |
|------------|---------|
| Claude Code | AI-assisted development |
| Playwright | Browser automation |
| Playwright MCP | Browser control through Claude |
| python-docx | Microsoft Word document generation |

---

## Documentation Stack

Documentation is generated using:

- Claude Code
- Playwright
- Microsoft Word (.docx)
- Markdown

Preferred screenshot format:

PNG
