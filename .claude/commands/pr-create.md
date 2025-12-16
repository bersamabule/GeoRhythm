# Autonomous PR Reviewer - Create Pull Request

Create a well-documented pull request with auto-generated description based on commits and changes.

## Usage

`/pr-create [base-branch]`

- If base-branch not specified, uses the default branch (main/master)

## Instructions

### Step 1: Pre-Flight Checks

1. **Verify clean working directory**:
   ```bash
   git status --porcelain
   ```
   - If uncommitted changes exist, warn user

2. **Get current branch**:
   ```bash
   git branch --show-current
   ```
   - Ensure not on main/master

3. **Check remote tracking**:
   ```bash
   git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null
   ```
   - If no upstream, will need to push with -u

4. **Verify branch is ahead of remote**:
   ```bash
   git status -sb
   ```

### Step 2: Gather PR Content

1. **Get all commits in this branch**:
   ```bash
   git log [base]..HEAD --pretty=format:"%h %s"
   ```

2. **Get full diff**:
   ```bash
   git diff [base]...HEAD --stat
   ```

3. **Get detailed changes** for summary:
   ```bash
   git diff [base]...HEAD
   ```

4. **Read CLAUDE.md** for PR conventions if exists

### Step 3: Analyze Changes for PR Description

Categorize the changes:
- **Features**: New functionality added
- **Fixes**: Bug fixes
- **Refactoring**: Code improvements without behavior change
- **Docs**: Documentation updates
- **Tests**: Test additions/changes
- **Chores**: Build, deps, config changes

### Step 4: Generate PR Title and Description

**Title Format**: `[type]: Brief description`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

**Description Template**:
```markdown
## Summary

[2-3 sentences describing what this PR does and why]

## Changes

### [Category 1]
- [Change description]
- [Change description]

### [Category 2]
- [Change description]

## Testing

- [ ] Unit tests added/updated
- [ ] Manual testing performed
- [ ] [Specific test instructions if needed]

## Screenshots (if applicable)

[Include if UI changes]

## Checklist

- [ ] Code follows project conventions
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)

## Related Issues

[Closes #X / Relates to #Y]
```

### Step 5: Push and Create PR

1. **Push to remote** (if needed):
   ```bash
   git push -u origin [branch-name]
   ```

2. **Create PR** using MCP or gh CLI:

   Using MCP:
   ```
   mcp__github__create_pull_request
   - owner: [owner]
   - repo: [repo]
   - title: [generated title]
   - head: [current branch]
   - base: [base branch]
   - body: [generated description]
   ```

   Or using gh CLI:
   ```bash
   gh pr create --title "[title]" --body "[body]" --base [base]
   ```

3. **Return the PR URL** to user

### Step 6: Offer Follow-up Actions

After PR is created, offer to:

1. **Run /review** on the new PR
2. **Add reviewers** to the PR
3. **Add labels** to the PR
4. **Link issues** to the PR

## Smart Features

### Auto-detect Related Issues
- Scan commit messages for issue references (#123)
- Check branch name for issue numbers (feature/123-description)
- Offer to link discovered issues

### Convention Detection
- If commits follow conventional commits, mirror in PR title
- Match existing PR patterns in the repo

### Draft Mode
Add `--draft` to create as draft PR:
`/pr-create --draft`

## Safety Checks

Before creating:
- [ ] Not creating PR from main/master
- [ ] Branch has commits ahead of base
- [ ] No merge conflicts with base
- [ ] CI configuration exists (warn if not)
