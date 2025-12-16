# Cross-Session Learning Profile - View

Display the learned preferences and patterns for this user/project.

## Usage

`/profile-view` - Show full profile
`/profile-view:coding` - Show coding style preferences
`/profile-view:patterns` - Show detected patterns
`/profile-view:mistakes` - Show common mistakes to avoid

## Instructions

### Step 1: Load Profiles

Load both global and project profiles:

**Global Profile** (`~/.claude/learning-profile.json`):
```json
{
  "version": "1.0",
  "created": "2025-12-15",
  "lastUpdated": "2025-12-15",
  "user": {
    "codingStyle": {
      "paradigm": "functional-preferred",
      "naming": "camelCase",
      "comments": "minimal-only-complex",
      "errorHandling": "explicit-try-catch",
      "typeAnnotations": "strict"
    },
    "preferences": {
      "frameworks": ["React", "Express", "Tailwind"],
      "testingStyle": "jest-with-rtl",
      "formatting": "prettier-default",
      "commitStyle": "conventional-commits"
    },
    "communication": {
      "verbosity": "concise",
      "codeExamples": "always",
      "explanationDepth": "moderate",
      "emoji": false
    },
    "commonMistakes": [
      {
        "pattern": "forgetting-null-check",
        "context": "API responses",
        "correction": "Always check if response.data exists",
        "occurrences": 3
      }
    ],
    "strengths": [
      "clean-architecture",
      "test-coverage",
      "security-awareness"
    ]
  },
  "learningEvents": 47,
  "confidence": {
    "codingStyle": 0.85,
    "preferences": 0.92,
    "communication": 0.78
  }
}
```

**Project Profile** (`docs/learning/profile.json`):
```json
{
  "version": "1.0",
  "project": "my-project",
  "patterns": {
    "architecture": "layered-mvc",
    "stateManagement": "redux-toolkit",
    "apiStyle": "rest-with-validation"
  },
  "conventions": {
    "fileNaming": "kebab-case",
    "componentStructure": "folder-per-component",
    "testLocation": "adjacent"
  },
  "vocabulary": {
    "User": "Customer in this project",
    "Order": "Purchase transaction"
  }
}
```

### Step 2: Generate Profile Report

```markdown
# Learning Profile

**Last Updated**: [timestamp]
**Learning Events**: [count]
**Confidence Level**: [percentage]

---

## Coding Style

| Aspect | Learned Preference | Confidence |
|--------|-------------------|------------|
| Paradigm | [functional/OOP/mixed] | [%] |
| Naming | [camelCase/snake_case/etc] | [%] |
| Comments | [minimal/moderate/verbose] | [%] |
| Error Handling | [style] | [%] |
| Types | [strict/loose/inferred] | [%] |

---

## Tool & Framework Preferences

### Preferred
- [Framework 1] - used in [X] projects
- [Framework 2] - explicitly chosen [Y] times

### Avoided
- [Framework] - declined when suggested

---

## Communication Preferences

| Aspect | Preference |
|--------|------------|
| Response Length | [concise/moderate/detailed] |
| Code Examples | [always/sometimes/on-request] |
| Explanations | [brief/moderate/thorough] |
| Emoji Usage | [yes/no] |

---

## Common Mistakes to Watch For

| Pattern | Context | Times Caught | Last Occurrence |
|---------|---------|--------------|-----------------|
| [mistake] | [where] | [count] | 2025-12-15 |

---

## Project-Specific Patterns

*For: [project-name]*

| Pattern | Value |
|---------|-------|
| Architecture | [pattern] |
| State Management | [approach] |
| Testing Style | [approach] |

---

## Vocabulary

| Term | Meaning in This Project |
|------|------------------------|
| [term] | [meaning] |

---

## How This Profile Was Built

- **Code Reviews**: [X] observations
- **Corrections Made**: [Y] patterns learned
- **Explicit Feedback**: [Z] preferences stated
- **Choices Tracked**: [N] decisions observed

---

*Profile updates automatically as we work together.*
*Use `/profile-learn` to explicitly teach preferences.*
*Use `/profile-reset` to clear and start fresh.*
```

### Step 3: Handle Missing Profile

If no profile exists:
```markdown
# Learning Profile

No learning profile found yet. I'll start building one as we work together.

## What I'll Learn

- Your coding style and preferences
- Common patterns you use
- Mistakes to help you avoid
- Communication preferences

## Quick Start

You can explicitly teach me preferences:
```
/profile-learn I prefer functional programming over OOP
/profile-learn Always use TypeScript strict mode
/profile-learn Keep explanations concise
```

Or I'll learn naturally by observing:
- Code you write and accept
- Changes you request
- Patterns in your codebase
```
