---
description: Emergency minimal handoff when context is critical (90%+)
---

# Context Guardian - Emergency Handoff

**CRITICAL**: Use when context is at 90%+ or session is failing.

## Usage

`/emergency-handoff` - Immediate minimal handoff to preserve work

## When to Use

- Context at 90%+ (imminent failure)
- Claude responses becoming erratic or repetitive
- "Prompt is too long" error appearing
- Session feels unstable

## Instructions

**TIME IS CRITICAL** - Skip all non-essential steps.

### Step 1: Capture Essentials (30 seconds)

Answer these questions in the shortest possible form:

1. **What were you doing?** (One sentence)
2. **What files changed?** (Run `git status`)
3. **What's the next step?** (One action)

### Step 2: Create Minimal Handoff

Create `docs/context/EMERGENCY.md`:

```markdown
# EMERGENCY HANDOFF

**Time**: [NOW]
**Reason**: Context exhaustion

## State

**Task**: [ONE SENTENCE - what you were working on]

**Modified Files**:
```
[git status output - just the file list]
```

**Current Action**: [What you were in the middle of]

**Next Step**: [THE single most important action to take]

## Resume

```
EMERGENCY RESUME: Previous session hit context limit while working on
[TASK]. Check git status for uncommitted changes. Files modified:
[LIST]. Continue with: [NEXT STEP].
```
```

### Step 3: Git Safety

```bash
git add -A && git stash push -m "EMERGENCY: Context exhaustion [DATE]"
```

### Step 4: Output

```markdown
## EMERGENCY HANDOFF COMPLETE

**State saved**: `docs/context/EMERGENCY.md`
**Git stash**: Created
**Action required**: END SESSION NOW

### Resume Prompt (Copy This)

---
EMERGENCY RESUME: Previous session hit context limit while working on
[TASK]. Read docs/context/EMERGENCY.md. Check `git stash list` for
saved changes. Continue with: [NEXT STEP].
---

**END THIS SESSION IMMEDIATELY**
```

## What Gets Sacrificed

In emergency mode, we skip:
- Detailed progress tracking
- Decision documentation
- Full file change descriptions
- Test status verification
- Chronicle updates
- Pretty formatting

**Priority is**: Don't lose the work. Everything else can be reconstructed.

## Post-Emergency Recovery

In the new session:

1. Run `git stash list` to find saved changes
2. Run `git stash pop` to restore if needed
3. Read `docs/context/EMERGENCY.md`
4. Run `/context-status` to verify new session is healthy
5. Consider running `/context-guardian` early in the new session

## Prevention

To avoid emergency handoffs:
- Run `/context-status` every 30-40 messages
- Run `/context-guardian` at 70-80% usage
- Use subagents for exploration tasks
- Clear context between unrelated tasks
- Keep CLAUDE.md under 5k tokens
