---
description: General writing rules for generated documentation
alwaysApply: false
---

# Documentation Writing Rules

## Purpose

General writing and style rules for all documentation Claude generates for Recruitment AI.

For specifics, see:

- `user-manual.md` — manual structure and formatting
- `screenshots.md` — screenshot standards
- `playwright.md` — browser automation rules
- `credentials.md` — where to obtain login credentials
- `login-workflow.md` — standard authentication workflow

---

# Terminology

Use the application's own terms consistently.

| Use this            | Not this                |
|----------------------|--------------------------|
| Applicant            | Candidate, User          |
| Recruiter            | Employer, Hirer          |
| Job Posting / Job    | Listing, Vacancy         |
| Application          | Submission               |
| Pipeline             | Workflow, Stage tracker  |
| Resume               | CV                       |

Role names come from the `role` field: `applicant`, `recruiter`, and `admin` (admin is assigned manually, not selectable at registration).

---

# Tone

- Write in plain, professional English.
- Address the reader directly ("You can post a job from the Jobs page.").
- Avoid developer jargon (API, endpoint, schema, route) in user-facing docs.
- Explain *why* an action matters, not just the steps.

---

# Structure

- One page or feature per section.
- Numbered procedures for anything the user must do in order.
- Bullet lists for options or unordered information.
- Tables for role/permission comparisons.

---

# Accuracy

- Never document a feature that does not exist in the current codebase.
- Never document a route or page that is not registered in `frontend/src/App.tsx`.
- If unsure whether a feature exists, check the code before writing about it.

---

# Output Locations

| Content         | Location             |
|-------------------|------------------------|
| Screenshots       | `docs/screenshots/`  |
| Generated docs    | `docs/generated/`    |
