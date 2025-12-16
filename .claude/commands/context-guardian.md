---
description: Create comprehensive session handoff before context exhaustion
---

# Context Guardian - Proactive Handoff Preparation

Prepare a comprehensive handoff before context window exhaustion forces session termination.

## Usage

`/context-guardian` - Full handoff preparation (run at 70-80% context)
`/context-guardian:quick` - Minimal handoff (run at 80-90% context)

## When to Run This

| Trigger | Action |
|---------|--------|
| Context at 70-80% | Run full `/context-guardian` |
| Context at 80-90% | Run `/context-guardian:quick` |
| Before breaks | Run to preserve state |
| Switching machines | Run for continuity |
| Team handoff | Run for collaboration |

## Instructions

### Step 1: Capture Current State

Gather all relevant context about the current session:

1. **What was the original task/goal?**
2. **What has been accomplished so far?**
3. **What is currently in progress?**
4. **What files were modified?**
5. **What decisions were made and why?**
6. **What problems were encountered?**
7. **What remains to be done?**

### Step 2: Generate WORKING.md

Create or update `docs/context/WORKING.md`:

```markdown
# Working Session State

> **Generated**: [TIMESTAMP]
> **Context Usage**: [X]% at time of handoff
> **Session ID**: [If known from /context]

---

## Original Objective

[Clear description of what this session was trying to accomplish]

---

## Progress Summary

### Completed
- [x] [Task 1 - brief description]
- [x] [Task 2 - brief description]

### In Progress
- [ ] [Current task - detailed state]
  - What's done: [specifics]
  - What remains: [specifics]
  - Current blockers: [if any]

### Not Started
- [ ] [Planned task 1]
- [ ] [Planned task 2]

---

## Files Modified This Session

| File | Changes | Status |
|------|---------|--------|
| `path/to/file.ts` | [Brief description] | [Complete/Partial/Needs review] |
| `path/to/file2.ts` | [Brief description] | [Complete/Partial/Needs review] |

### Uncommitted Changes

Run `git status` and `git diff --stat` to list:

```
[Output of git status showing modified/new files]
```

---

## Key Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| [Decision 1] | [Why this choice] | [What it affects] |
| [Decision 2] | [Why this choice] | [What it affects] |

---

## Problems Encountered

### Resolved
- **[Problem 1]**: [How it was solved]

### Unresolved
- **[Problem 2]**: [Current state, attempted solutions]

---

## Technical Context

### Architecture Notes
[Any architectural decisions or patterns established]

### Dependencies Added
[New packages, versions, why needed]

### Configuration Changes
[Any config files modified]

---

## Next Steps (Priority Order)

1. **[HIGH]** [Most important next task]
   - Start with: [specific file or action]
   - Watch out for: [gotchas]

2. **[MEDIUM]** [Second priority task]
   - Details: [specifics]

3. **[LOW]** [Lower priority items]

---

## Resume Instructions

To continue this work in a new session:

1. Read this file: `docs/context/WORKING.md`
2. Read project context: `CLAUDE.md`
3. Check git status for uncommitted changes
4. Start with the highest priority next step

### Suggested Resume Prompt

```
Continue the work documented in docs/context/WORKING.md.
The previous session was working on [BRIEF_DESCRIPTION].
Start by [SPECIFIC_FIRST_ACTION].
```

---

## Session Metrics

- **Messages exchanged**: ~[estimate]
- **Files read**: [count]
- **Files modified**: [count]
- **Tests status**: [passing/failing/not run]
- **Build status**: [success/failing/not run]
```

### Step 3: Update CLAUDE.md Session Continuity

Update the "Session Continuity" section in CLAUDE.md with:

```markdown
### For Next Session
> **Where I left off**: [Detailed description from WORKING.md]
>
> **What's working**: [List of completed items]
>
> **Next steps**: [Priority ordered list]
>
> **Watch out for**: [Gotchas, blockers, important context]
>
> **Resume file**: `docs/context/WORKING.md`
```

### Step 4: Commit Safety Checkpoint (If Appropriate)

If there are meaningful changes worth preserving:

```bash
git add -A
git stash push -m "Context Guardian checkpoint - [DATE] - [BRIEF_DESCRIPTION]"
```

Or if changes are complete enough to commit:

```bash
git add -A
git commit -m "WIP: [description]

Context Guardian checkpoint before session handoff.
See docs/context/WORKING.md for continuation details.

Generated with Claude Code"
```

### Step 5: Output Handoff Summary

```markdown
## Context Guardian Handoff Complete

**Status**: Ready for session transition
**Working state saved to**: `docs/context/WORKING.md`
**CLAUDE.md updated**: Yes
**Git checkpoint**: [Stashed/Committed/Skipped]

### Quick Resume

In your next session, use this prompt:

---

Continue the work from the previous session. Read docs/context/WORKING.md
for the full state. Brief summary:

**Goal**: [One line]
**Progress**: [X]% complete
**Next action**: [Specific first step]

---

### Context Saved

| Item | Status |
|------|--------|
| Working state | Saved to WORKING.md |
| CLAUDE.md | Updated |
| Git changes | [Stashed/Committed] |
| Test status | [Status] |

You can safely end this session. Your work is preserved.
```

## Quick Mode (`/context-guardian:quick`)

For emergency situations (80-90% context), create a minimal handoff:

1. **Skip**: Detailed file lists, decision rationale, metrics
2. **Focus on**:
   - What was being done RIGHT NOW
   - What files are modified (git status)
   - The single most important next step
3. **Output**: Condensed WORKING.md (~500 tokens max)

```markdown
# Emergency Handoff

**Task**: [What you were doing]
**Modified**: [git status summary]
**Next**: [Single most important action]
**Resume prompt**: "Continue [TASK]. Check git status. Start with [ACTION]."
```

## Integration with Other Capabilities

- **Chronicle**: Handoff triggers a chronicle entry
- **Living Documentation**: Updates CLAUDE.md automatically
- **Technical Debt Radar**: Notes any debt introduced this session
- **Knowledge Graph**: Flags if graph needs updating

## Why This Matters

Context exhaustion is the #1 cause of lost work in Claude Code sessions. The "prompt is too long" error is unrecoverable. This capability ensures:

1. **No lost work**: Everything is documented before failure
2. **Quick resume**: New sessions start informed, not from scratch
3. **Continuous flow**: Handoffs feel like pauses, not restarts
