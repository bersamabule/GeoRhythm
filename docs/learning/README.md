# Cross-Session Learning Profile

This directory contains the learning profile for this project.

## Files

| File | Purpose |
|------|---------|
| `profile.json` | Project-specific learned patterns |
| `history.json` | Learning event history |

## How Learning Works

Claude learns your preferences in two ways:

### 1. Explicit Teaching
Tell Claude your preferences directly:
```
/profile-learn I prefer functional programming
/profile-learn Always use TypeScript strict mode
/profile-learn In this project, User means Customer
```

### 2. Automatic Observation
Claude observes patterns as you work:
- Code you write and accept
- Changes you request to suggestions
- Patterns in your codebase
- Review feedback you give

## What Gets Learned

### Global (Applies to All Projects)
Stored in `~/.claude/learning-profile.json`:
- Coding style preferences
- Framework preferences
- Communication style
- Common mistakes to avoid

### Project-Specific
Stored in `docs/learning/profile.json`:
- Architecture patterns
- Naming conventions
- Domain vocabulary
- Team standards

## Commands

| Command | Description |
|---------|-------------|
| `/profile-view` | See your current profile |
| `/profile-learn [preference]` | Teach a preference |
| `/profile-reset` | Reset profile (with options) |

## Profile Schema

### Global Profile
```json
{
  "version": "1.0",
  "user": {
    "codingStyle": {
      "paradigm": "functional-preferred | oop-preferred | mixed",
      "naming": "camelCase | snake_case | PascalCase",
      "comments": "minimal | moderate | verbose",
      "errorHandling": "try-catch | result-types | exceptions",
      "typeAnnotations": "strict | loose | inferred"
    },
    "preferences": {
      "frameworks": ["React", "Express"],
      "testingStyle": "jest | vitest | pytest",
      "formatting": "prettier | eslint"
    },
    "communication": {
      "verbosity": "concise | moderate | detailed",
      "codeExamples": "always | sometimes | on-request",
      "emoji": false
    },
    "commonMistakes": [
      {
        "pattern": "description",
        "context": "when it happens",
        "correction": "how to fix",
        "occurrences": 3
      }
    ]
  },
  "confidence": {
    "codingStyle": 0.85,
    "preferences": 0.92
  }
}
```

### Project Profile
```json
{
  "version": "1.0",
  "project": "project-name",
  "patterns": {
    "architecture": "mvc | layered | microservices",
    "stateManagement": "redux | zustand | context"
  },
  "conventions": {
    "fileNaming": "kebab-case | camelCase",
    "testLocation": "adjacent | __tests__"
  },
  "vocabulary": {
    "User": "Customer in this codebase",
    "Order": "Purchase transaction"
  }
}
```

## Privacy

Learning profiles are stored locally:
- Global profile: `~/.claude/learning-profile.json`
- Project profile: `docs/learning/profile.json`

No learning data is sent anywhere. It stays on your machine.

---

*Cross-Session Learning Profile capability*
