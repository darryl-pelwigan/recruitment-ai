# Generate User Manual

## Goal

Generate a complete end-user manual for the application.

Follow all project rules inside `.claude/rules`.

---

## Workflow

1. Read the project rules.
2. Launch the application.
3. Authenticate using the configured test account.
4. Visit every user-facing page.
5. Capture screenshots according to the screenshot rules.
6. Explain each feature in language suitable for non-technical users.
7. Organize the manual according to `user-manual.md`.
8. Save screenshots to:

docs/screenshots/

9. Save the completed Microsoft Word document to:

docs/generated/UserManual.docx

---

## Requirements

- Use professional English.
- Use numbered procedures.
- Never invent features.
- Skip pages that require administrator approval unless instructed otherwise.
- Report any errors encountered during navigation.