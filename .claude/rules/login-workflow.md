---
description: Standard authentication workflow for browser automation
alwaysApply: false
---

# Login Workflow

## Purpose

This document defines the standard login workflow used by Claude when:

- Generating documentation
- Running Playwright automation
- Performing UI validation
- Executing browser-based tasks

Always authenticate before interacting with protected pages.

---

# Configuration

When available, use the following environment variables.

| Variable | Purpose |
|----------|---------|
| APP_URL | Frontend application URL |
| API_BASE_URL | Backend API URL |
| TEST_USERNAME | Test login username or email |
| TEST_PASSWORD | Test login password |

Always read these values from the environment before starting browser automation.

If any required value is missing, ask the user instead of guessing.

Do not hardcode URLs unless explicitly instructed.

---

# Login Process

1. Open the application.
2. Wait until the page is fully loaded.
3. Navigate to the login page if necessary.
4. Obtain credentials using the rules defined in `credentials.md`.
5. Enter the username or email.
6. Enter the password.
7. Click the **Login** button.
8. Wait until authentication completes.
9. Verify that the Dashboard or landing page has loaded.

Only continue after successful authentication.

---

# Verification

A successful login should satisfy all of the following:

- Dashboard is visible.
- Sidebar navigation is loaded.
- User profile or avatar is displayed.
- No authentication errors are shown.
- No loading indicators remain.

---

# Failed Login

If authentication fails:

1. Capture a screenshot.
2. Record the error message.
3. Stop browser automation.
4. Report the failure.

Do not guess credentials.

Do not retry indefinitely.

---

# Role-Based Access

Recruitment AI has three roles: `applicant`, `recruiter`, and `admin`.

- `TEST_USERNAME` / `TEST_PASSWORD` log in as a single test account with one fixed role.
- Admin-only pages (e.g. `/admin/users`) only load correctly if that account has the `admin` role.
- If documentation requires a screenshot from a different role (e.g. a Recruiter's Post Job flow, or an Applicant's My Applications view) and the configured test account doesn't have that role, ask the user for credentials with that role. Do not create new accounts or change an existing account's role without asking.

---

# Session Management

Keep the current browser session active during documentation generation.

Only log in again if:

- Session expired
- User explicitly logged out
- Browser restarted

---

# Documentation Mode

When generating documentation:

- Login once.
- Reuse the authenticated session.
- Never expose passwords.
- Never include credentials in screenshots.

---

# Security

Never:

- Hardcode passwords
- Save credentials into generated documents
- Commit credentials into Git
- Display passwords in screenshots