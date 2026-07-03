---
description: Coding conventions that must be followed when writing or editing any file in this project
alwaysApply: true
---

# Coding Conventions

## Backend

- **Routes are thin.** All business logic belongs in the matching service file. Routes only validate, call a service, and return.
- **Schemas and models are separate.** Pydantic schemas live in `schemas/`; ORM models live in `models/`. Never mix them.
- **`ai_service.py` owns all NLP logic.** Scoring, keyword extraction, and ranking stay in `services/ai_service.py`. Do not import ML/NLP libraries in routes.
- **`security.py` is the single source of truth for JWT.** Never inline `create_access_token` or `verify_token` logic elsewhere.
- **Always inject the database via `Depends(get_db)`.** Do not create sessions manually in routes or services.
- **`config.py` is the single source of truth for settings.** Read all env vars through the Pydantic `Settings` object, not `os.environ` directly.

## Frontend

- **All HTTP requests go through `src/api/api.ts`.** Never call `axios` directly in a component or store.
- **Auth state lives in `src/store/authStore.ts`.** Token is stored in `localStorage` and attached via the Axios request interceptor.
- **Theme state lives in `src/store/themeStore.ts`.** Dark mode is toggled by adding/removing the `dark` class on `<html>`. Call `init()` in `App.tsx` `useEffect` on mount.
- **Page components go in `src/pages/`.** Shared UI elements go in `src/components/`.
- **TypeScript — avoid deprecated React types.** Use `{ preventDefault(): void }` instead of `React.FormEvent` for event handler parameters; use named imports over namespace (`React.`) access.

## AI Documentation

When generating documentation:

- Write for non-technical end users.
- Use clear and concise English.
- Explain the purpose of each feature before describing the steps.
- Use numbered procedures.
- Avoid implementation details, APIs, database schemas, or internal code references unless explicitly requested.
- Use consistent terminology throughout the document.
- Keep screenshots synchronized with the written instructions.
- Prefer accuracy over verbosity.