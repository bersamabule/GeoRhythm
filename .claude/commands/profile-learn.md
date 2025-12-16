# Cross-Session Learning Profile - Learn/Teach

Explicitly teach preferences or record observations about user patterns.

## Usage

### Explicit Teaching (User-Initiated)
```
/profile-learn I prefer functional programming
/profile-learn Always use TypeScript strict mode
/profile-learn Keep responses concise, no emoji
/profile-learn In this project, "User" means "Customer"
```

### Automatic Learning (Claude-Initiated)
When observing patterns, Claude updates the profile automatically.

## Instructions

### Step 1: Parse the Learning Input

Categorize the input:

| Category | Keywords/Patterns | Profile Field |
|----------|------------------|---------------|
| Coding Style | "prefer", "always use", "style" | user.codingStyle |
| Framework | "use X", "prefer X library" | user.preferences.frameworks |
| Communication | "concise", "detailed", "emoji" | user.communication |
| Mistake | "I always forget", "watch out for" | user.commonMistakes |
| Project Term | "X means Y", "we call X" | project.vocabulary |
| Convention | "we use X pattern" | project.conventions |

### Step 2: Load Existing Profile

Load the appropriate profile:
- Global: `~/.claude/learning-profile.json`
- Project: `docs/learning/profile.json`

If file doesn't exist, create with defaults.

### Step 3: Update Profile

**For explicit preferences:**
```json
{
  "source": "explicit",
  "timestamp": "2025-12-15T10:00:00Z",
  "input": "I prefer functional programming",
  "category": "codingStyle",
  "field": "paradigm",
  "value": "functional-preferred",
  "confidence": 1.0
}
```

**For observed patterns:**
```json
{
  "source": "observation",
  "timestamp": "2025-12-15T10:00:00Z",
  "observation": "User refactored class to functions",
  "category": "codingStyle",
  "field": "paradigm",
  "value": "functional-preferred",
  "confidence": 0.3,
  "incrementConfidence": true
}
```

### Step 4: Confidence Scoring

| Source | Base Confidence | Notes |
|--------|-----------------|-------|
| Explicit statement | 1.0 | User directly stated preference |
| Repeated observation (3+) | 0.8 | Pattern seen multiple times |
| Single observation | 0.3 | Might be situational |
| Contradicts previous | -0.2 | Reduce previous confidence |

Update formula:
```
newConfidence = min(1.0, oldConfidence + (observation.confidence * 0.2))
```

### Step 5: Save and Confirm

Save updated profile and confirm:

```markdown
## Preference Learned

**Category**: Coding Style
**Preference**: Functional programming preferred
**Confidence**: 100% (explicitly stated)
**Scope**: Global (applies to all projects)

This will influence:
- Code suggestions I provide
- Refactoring recommendations
- Pattern choices in new code

---

*View your full profile with `/profile-view`*
```

## Learning Categories

### Coding Style
- `paradigm`: functional / OOP / mixed
- `naming`: camelCase / snake_case / PascalCase
- `comments`: minimal / moderate / verbose
- `errorHandling`: try-catch / result-types / assertions
- `typeAnnotations`: strict / loose / inferred
- `immutability`: prefer-const / allow-mutation

### Preferences
- `frameworks`: List of preferred frameworks
- `libraries`: Preferred utility libraries
- `testingStyle`: jest / vitest / pytest / etc
- `formatting`: prettier / eslint / standard
- `commitStyle`: conventional / freeform

### Communication
- `verbosity`: concise / moderate / detailed
- `codeExamples`: always / sometimes / on-request
- `explanationDepth`: brief / moderate / thorough
- `emoji`: true / false
- `tone`: casual / professional

### Mistakes to Avoid
- Pattern name
- Context where it occurs
- How to prevent it
- Occurrence count

### Project-Specific
- Architecture patterns
- Naming conventions
- Domain vocabulary
- Team standards

## Automatic Learning Triggers

Claude should automatically learn from:

1. **Code Corrections**
   - User modifies suggested code → learn the pattern

2. **Review Feedback**
   - User accepts/rejects review comments → learn preferences

3. **Repeated Patterns**
   - Same style used 3+ times → increase confidence

4. **Explicit Rejection**
   - "Don't use X" → add to avoided list

5. **Communication Feedback**
   - "Too verbose" / "More detail please" → adjust

## Example Learning Events

```json
{
  "events": [
    {
      "timestamp": "2025-12-15T10:00:00Z",
      "type": "explicit",
      "input": "I prefer TypeScript strict mode",
      "learned": {"codingStyle.typeAnnotations": "strict"}
    },
    {
      "timestamp": "2025-12-15T10:30:00Z",
      "type": "observation",
      "trigger": "User changed var to const 3 times",
      "learned": {"codingStyle.immutability": "prefer-const"}
    },
    {
      "timestamp": "2025-12-15T11:00:00Z",
      "type": "correction",
      "trigger": "User added null check to my suggestion",
      "learned": {"commonMistakes": "missing-null-check"}
    }
  ]
}
```
