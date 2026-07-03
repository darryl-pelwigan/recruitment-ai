---
description: Screenshot standards for documentation generation
alwaysApply: false
---

# Screenshot Standards

## Purpose

Screenshots should clearly illustrate the application for end users.

---

# File Format

PNG

---

# Image Quality

Requirements:

- High resolution
- Sharp
- Readable text
- No compression artifacts

---

# Window

Capture only the application window.

Do not capture:

- Browser bookmarks
- Browser extensions
- Developer tools
- Operating system notifications

---

# Timing

Capture screenshots only after:

- Data has loaded
- Tables are populated
- Charts have rendered
- Loading indicators have disappeared

---

# Naming Convention

Use lowercase, matching the page name from `frontend/src/pages/`.

Examples:

login.png

register.png

dashboard.png

jobs.png

job-detail.png

post-job.png

edit-job.png

applicants.png

applicant-profile.png

pipeline.png

my-applications.png

saved-jobs.png

saved-applicants.png

resumes.png

profile.png

user-management.png

---

# Content

The screenshot should clearly show:

- Page title
- Navigation
- Primary actions
- Important tables or forms

---

# Avoid

Do not capture:

- Empty states
- Error dialogs
- Toast notifications
- Loading spinners

unless documenting those features.

---

# Storage

Store screenshots in:

docs/screenshots/

Group screenshots by feature when appropriate.