# Architecture Decision Records (ADRs)

## What Are ADRs?

Architecture Decision Records capture important architectural decisions along with their context and consequences. They provide a historical record of **why** decisions were made, not just what was decided.

## When to Write an ADR

Create an ADR when you make a decision that:
- Affects the structure of the codebase
- Introduces a new technology, library, or framework
- Changes how components communicate
- Establishes a pattern that should be followed
- Has long-term implications that future developers should understand
- Was debated and had multiple viable alternatives

## ADR Lifecycle

| Status | Meaning |
|--------|---------|
| **Proposed** | Under discussion, not yet accepted |
| **Accepted** | Decision made and active |
| **Deprecated** | No longer applies but kept for history |
| **Superseded** | Replaced by a newer ADR (link to it) |

## File Naming Convention

```
NNNN-short-title.md
```

- `NNNN` - Sequential 4-digit number (0001, 0002, etc.)
- `short-title` - Lowercase, hyphenated description

Examples:
- `0001-use-typescript.md`
- `0002-adopt-monorepo-structure.md`
- `0003-api-authentication-strategy.md`

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0000](0000-template.md) | ADR Template | Template | - |

---

*ADRs are never deleted. When a decision changes, create a new ADR and mark the old one as superseded.*
