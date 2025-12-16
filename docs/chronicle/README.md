# Development Chronicle

## What Is This?

The Chronicle is a **breadcrumb trail** of development sessions. Each entry captures what happened during a work session, providing context for future sessions.

Unlike commit logs (which track *what* changed), the Chronicle tracks:
- **Intent**: What were we trying to accomplish?
- **Process**: How did we approach it?
- **Outcome**: What actually happened?
- **Context**: What should future sessions know?

## When to Write a Chronicle Entry

Create an entry:
- At the **end of each work session** (most common)
- When **completing a significant milestone**
- When **encountering a major blocker** or decision point
- When **handing off work** to another person or future session

## File Naming Convention

```
YYYY-MM-DD-brief-description.md
```

Examples:
- `2025-01-15-initial-project-setup.md`
- `2025-01-16-auth-system-implementation.md`
- `2025-01-17-debugging-api-timeout.md`

For multiple entries on the same day:
- `2025-01-15-morning-api-design.md`
- `2025-01-15-afternoon-database-schema.md`

Or use sequence numbers:
- `2025-01-15-01-api-design.md`
- `2025-01-15-02-database-schema.md`

## Quick Entry Template

For fast session logs, use this minimal format:

```markdown
# YYYY-MM-DD: [Brief Title]

## Done
- [What was accomplished]

## Next
- [What should happen next]

## Notes
- [Anything important to remember]
```

## Index

| Date | Title | Focus Area |
|------|-------|------------|
| [YYYY-MM-DD](YYYY-MM-DD-title.md) | [Title] | [Area] |

---

*The Chronicle is your development memory. Write entries as if explaining to yourself 6 months from now.*
