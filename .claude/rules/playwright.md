---
description: Rules for browser automation using Playwright
alwaysApply: false
---

# Playwright Automation Rules

## Purpose

Use Playwright to interact with the application like a real user.

Playwright is responsible for:

- Navigation
- Authentication
- Form interaction
- Screenshot capture
- Workflow validation

---

# Browser

Preferred browser:

Chromium

Preferred viewport:

Desktop (1920×1080)

---

# Before Every Action

Always wait until:

- Page has loaded
- Network requests are complete
- Animations have finished
- Tables are rendered
- Modals are fully visible

Never interact with partially loaded pages.

---

# Navigation

Follow the application's intended user workflow.

Do not:

- Skip required pages
- Use hidden URLs
- Modify local storage unless required
- Inject JavaScript unless necessary

---

# Public Pages

These pages are accessible without logging in and can be captured as a guest:

- Jobs (`/jobs`)
- Job Detail (`/jobs/:id`)

All other pages require authentication.

---

# Authentication

Use the provided demo or test account.

Never hardcode production credentials.

If login fails:

- Capture a screenshot
- Report the failure
- Stop further navigation unless instructed otherwise

---

# Error Handling

If a page cannot be loaded:

1. Capture a screenshot
2. Record the URL
3. Record the error message
4. Continue with remaining pages when possible

---

# Documentation Mode

When generating documentation:

- Visit every major page.
- Pause before each screenshot.
- Ensure the UI is fully visible.
- Do not capture browser menus or developer tools.

---

# Outputs

Screenshots:

docs/screenshots/

Generated documentation:

docs/generated/