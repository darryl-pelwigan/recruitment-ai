---
description: Rules for obtaining authentication credentials
alwaysApply: false
---

# Credentials

## Purpose

This file defines where Claude should obtain login credentials.

Claude should never guess credentials.

---

# Preferred Sources

Use credentials in the following priority order.

## 1. Environment Variables

Preferred source.

Examples:

- backend/.env
- frontend/.env
- .env.local
- .env.development

---

## 2. User Instructions

If the user provides credentials during the conversation, use them for the current task only.

Do not persist them.

---

## 3. Project Documentation

If the project contains:

- README.md
- setup.md
- developer documentation

Use any documented demo accounts.

---

## 4. Ask the User

If credentials cannot be found, ask the user.

Do not guess.

---

# Never

Never:

- Hardcode credentials
- Invent passwords
- Store credentials inside prompts
- Save credentials into generated documentation

---

# Documentation

Credentials must never appear in:

- User Manual
- Administrator Guide
- Release Notes
- Screenshots
- Example documents

---

# Security

Always prefer:

- Development accounts
- Demo accounts
- Test accounts

Never use production credentials.

---

# Browser Automation

During Playwright automation:

Retrieve credentials using these rules before attempting authentication.