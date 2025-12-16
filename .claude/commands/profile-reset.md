# Cross-Session Learning Profile - Reset

Reset or clear parts of the learning profile.

## Usage

`/profile-reset` - Interactive reset (asks what to reset)
`/profile-reset:all` - Reset entire profile (requires confirmation)
`/profile-reset:project` - Reset project-specific learning only
`/profile-reset:mistakes` - Clear mistake history
`/profile-reset:category [name]` - Reset specific category

## Instructions

### Step 1: Determine Reset Scope

| Command | Scope | Affects |
|---------|-------|---------|
| `/profile-reset` | Interactive | User chooses |
| `/profile-reset:all` | Everything | Global + all project profiles |
| `/profile-reset:global` | Global only | ~/.claude/learning-profile.json |
| `/profile-reset:project` | Current project | docs/learning/profile.json |
| `/profile-reset:mistakes` | Mistakes only | commonMistakes array |
| `/profile-reset:category coding` | One category | codingStyle preferences |

### Step 2: Confirm Before Reset

```markdown
## Reset Learning Profile

You're about to reset: **[scope]**

This will clear:
- [X] learning events
- [Y] preferences
- [Z] observations

**This cannot be undone.**

Are you sure? Reply with:
- "yes" to proceed
- "no" to cancel
- "backup" to save current profile first
```

### Step 3: Backup Option

If user requests backup:

```bash
# Create timestamped backup
cp ~/.claude/learning-profile.json ~/.claude/learning-profile.backup.2025-12-15.json
```

### Step 4: Perform Reset

**Full Reset:**
```json
{
  "version": "1.0",
  "created": "[now]",
  "lastUpdated": "[now]",
  "user": {
    "codingStyle": {},
    "preferences": {},
    "communication": {},
    "commonMistakes": [],
    "strengths": []
  },
  "learningEvents": 0,
  "confidence": {}
}
```

**Category Reset:**
```javascript
profile.user[category] = {};
profile.confidence[category] = 0;
// Keep other categories intact
```

**Mistakes Reset:**
```javascript
profile.user.commonMistakes = [];
// Keep preferences intact
```

### Step 5: Confirm Completion

```markdown
## Profile Reset Complete

**Scope**: [what was reset]
**Backup**: [saved to X / not created]
**Preserved**: [what was kept]

Your profile is now fresh. I'll start learning your preferences again as we work together.

### Quick Start

Teach me your preferences explicitly:
```
/profile-learn I prefer [your preference]
```

Or I'll learn naturally by observing your coding patterns.
```

## Interactive Mode

When `/profile-reset` is called without arguments:

```markdown
## Reset Learning Profile

What would you like to reset?

1. **Everything** - Start completely fresh
2. **Global preferences** - Keep project-specific, reset personal
3. **Project patterns** - Keep personal, reset this project
4. **Mistake history** - Keep preferences, clear mistakes
5. **Specific category** - Choose what to reset

Reply with a number (1-5) or "cancel" to abort.
```

## Safety Features

1. **Always confirm** before any reset
2. **Offer backup** before destructive operations
3. **Show what will be lost** before proceeding
4. **Cannot reset mid-session observations** - only persisted data

## Recovery

If user regrets reset:

```markdown
## Recover Previous Profile

I found a backup from 2025-12-15. Would you like to restore it?

**Backup location**: ~/.claude/learning-profile.backup.2025-12-15.json

Reply "restore" to recover or "keep" to continue with fresh profile.
```
