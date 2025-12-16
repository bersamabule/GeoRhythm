# Codebase Knowledge Graph - Incremental Update

Update the knowledge graph incrementally after code changes, without full rebuild.

## Usage

`/kg-update` - Update based on recent git changes
`/kg-update [file-or-directory]` - Update specific path

## When to Use

- After adding new files/modules
- After refactoring that changes dependencies
- After significant code changes
- When `/kg-query` seems to return stale results

## Instructions

### Step 1: Detect Changes

**If no argument provided**, detect from git:

```bash
# Get files changed since last graph update
git diff --name-only [last-graph-timestamp]..HEAD

# Or get recently modified files
git diff --name-only HEAD~10
```

**If path argument provided**:
- Use that specific file or directory

### Step 2: Load Existing Graph

1. Read `docs/knowledge-graph/graph.json`
2. Note the `generated` timestamp
3. Identify nodes/edges related to changed files

### Step 3: Re-analyze Changed Files

For each changed file:

1. **Remove old data**
   - Delete old node for this file
   - Delete edges where this file is source or target

2. **Re-scan file**
   - Extract imports/exports
   - Identify functions/classes
   - Detect patterns

3. **Rebuild edges**
   - Create new import edges
   - Create new call edges
   - Update dependency counts

### Step 4: Update Related Nodes

Files that depend on changed files may need updates:

```
Changed: src/models/user.ts
Related: src/services/users.ts (imports user.ts)
         src/routes/users.ts (imports users.ts)

Update: Verify edges still valid, update if imports changed
```

### Step 5: Recalculate Metrics

Update aggregate data:
- Dependency counts
- Hotspot rankings
- Domain groupings (if files moved)

### Step 6: Save Updated Graph

1. Update `generated` timestamp
2. Add `lastUpdated` field
3. Track update history

```json
{
  "version": "1.0",
  "generated": "2025-12-14T10:00:00Z",
  "lastUpdated": "2025-12-15T14:30:00Z",
  "updateHistory": [
    {
      "timestamp": "2025-12-15T14:30:00Z",
      "filesUpdated": ["src/models/user.ts"],
      "trigger": "manual"
    }
  ],
  ...
}
```

### Step 7: Report Changes

```markdown
## Knowledge Graph Updated

**Timestamp**: [now]
**Files Processed**: 3
**Changes Detected**:

| File | Change Type | Impact |
|------|-------------|--------|
| src/models/user.ts | Modified | 2 new exports |
| src/services/auth.ts | Modified | 1 import added |
| src/utils/new-helper.ts | Added | New file indexed |

**Graph Stats**:
- Nodes: 156 (+1)
- Edges: 342 (+3)
- Domains: 5 (unchanged)

**Stale Warnings**: None
```

## Validation

After update, verify graph integrity:
- All edges point to existing nodes
- No orphaned nodes
- Import edges match actual imports
- Domain groupings still accurate

## Full Rebuild Triggers

Recommend full `/kg-build` when:
- More than 30% of files changed
- Major directory restructuring
- Graph version is outdated
- Validation fails
