---
description: Check context window usage and get recommendations
---

# Context Guardian - Status Check

Check current context window usage and get recommendations.

## Usage

`/context-status` - Quick status check with recommendations

## Instructions

### Step 1: Assess Context Usage

Run the `/context` command (built-in) to get actual token usage, then interpret the results:

| Usage Level | Tokens (of 200k) | Status | Action |
|-------------|------------------|--------|--------|
| **Green** | 0-100k (0-50%) | Safe | Continue working |
| **Yellow** | 100k-140k (50-70%) | Caution | Consider compacting soon |
| **Orange** | 140k-160k (70-80%) | Warning | Run `/context-guardian` now |
| **Red** | 160k-180k (80-90%) | Critical | Emergency handoff required |
| **Black** | 180k+ (90%+) | Danger | Immediate handoff, session at risk |

### Step 2: Generate Status Report

```markdown
## Context Guardian Status

**Current Usage**: [X]k / 200k tokens ([Y]%)
**Status**: [Green/Yellow/Orange/Red/Black]
**Session Health**: [Healthy/At Risk/Critical]

### Breakdown (Estimated)
| Component | Tokens | Notes |
|-----------|--------|-------|
| System prompt | ~5k | Fixed |
| CLAUDE.md | ~Xk | Project context |
| Conversation | ~Xk | Messages so far |
| File reads | ~Xk | Files in context |
| Tool results | ~Xk | Command outputs |

### Recommendations

[Based on usage level:]

**Green (0-50%)**:
- Continue working normally
- Consider `/context-status` after major file reads

**Yellow (50-70%)**:
- Avoid reading large files unless necessary
- Consider using subagents for exploration
- Think about natural breakpoints for handoff

**Orange (70-80%)**:
- **ACTION REQUIRED**: Run `/context-guardian` to prepare handoff
- Complete current task if small, otherwise pause
- Do not start new major tasks

**Red (80-90%)**:
- **STOP NEW WORK**: Complete only critical in-progress items
- Run `/emergency-handoff` immediately
- Document current state before session fails

**Black (90%+)**:
- **EMERGENCY**: Session may fail at any moment
- Run `/emergency-handoff` NOW
- Accept that some context may be lost
```

### Step 3: Proactive Warnings

If context is at Orange or higher, output a prominent warning:

```markdown
**CONTEXT WARNING**

Your session is at [X]% context usage ([STATUS] zone).

**Recommended Action**: [Action based on level]

Run `/context-guardian` to prepare a safe handoff before the session fails.
```

## Integration Notes

This command should be run:
- After reading large files
- Every 30-40 messages in active sessions
- Before starting major new tasks
- When Claude's responses seem degraded or repetitive

## Why This Matters

When context hits 100%, Claude Code outputs "prompt is too long" and the session becomes unrecoverable. Work in progress may be lost. This command helps you stay ahead of that cliff.
