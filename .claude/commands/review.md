# Autonomous PR Reviewer - Code Review

Perform a comprehensive code review of changes in the current branch compared to the base branch.

## Instructions

### Step 1: Gather Context

1. **Read project context** from CLAUDE.md if it exists
2. **Identify the base branch**:
   ```bash
   git remote show origin | grep "HEAD branch" | cut -d: -f2 | xargs
   ```
3. **Get current branch**:
   ```bash
   git branch --show-current
   ```
4. **Get the diff**:
   ```bash
   git diff [base-branch]...HEAD
   ```
5. **Get commit history for this branch**:
   ```bash
   git log [base-branch]..HEAD --oneline
   ```

### Step 2: Analyze Changes

Review the diff through multiple lenses:

#### Security Analysis
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities (unsanitized user input in HTML)
- [ ] No command injection (user input in shell commands)
- [ ] No path traversal vulnerabilities
- [ ] Authentication/authorization properly implemented
- [ ] Sensitive data properly encrypted/hashed

#### Logic & Correctness
- [ ] Edge cases handled (null, empty, boundary values)
- [ ] Error handling is appropriate (not swallowing errors)
- [ ] No race conditions in async code
- [ ] No infinite loops or recursion without base case
- [ ] State mutations are intentional and safe
- [ ] Return values are correct types

#### Performance
- [ ] No N+1 query patterns
- [ ] No unnecessary re-renders (React) or recomputation
- [ ] Large data sets are paginated or streamed
- [ ] No memory leaks (event listeners cleaned up, subscriptions unsubscribed)
- [ ] No blocking operations on main thread

#### Code Quality
- [ ] Follows project conventions (from CLAUDE.md)
- [ ] Functions are focused (single responsibility)
- [ ] Names are clear and descriptive
- [ ] No dead code or commented-out code
- [ ] No debug statements (console.log, print, debugger)
- [ ] DRY - no unnecessary duplication

#### Testing
- [ ] New functionality has tests
- [ ] Edge cases are tested
- [ ] Tests are meaningful (not just coverage padding)
- [ ] Existing tests still pass

#### Documentation
- [ ] Public APIs are documented
- [ ] Complex logic has explanatory comments
- [ ] Breaking changes are noted
- [ ] README updated if needed

### Step 3: Generate Review Report

```markdown
# Code Review: [branch-name]

**Reviewer**: Claude (Autonomous PR Reviewer)
**Date**: [timestamp]
**Base**: [base-branch]
**Commits**: [count]

---

## Summary

[1-2 sentence summary of what these changes do]

**Verdict**: [APPROVE / REQUEST_CHANGES / COMMENT]

---

## Findings

### Critical (Must Fix)
| File | Line | Issue | Suggestion |
|------|------|-------|------------|
| [path] | [line] | [issue] | [fix] |

### Important (Should Fix)
| File | Line | Issue | Suggestion |
|------|------|-------|------------|

### Minor (Consider)
| File | Line | Issue | Suggestion |
|------|------|-------|------------|

### Positive Observations
- [What was done well]

---

## Security Checklist
- [x] No hardcoded secrets
- [x] Input validation present
- [ ] **ISSUE**: [description if any]

## Test Coverage
- [Assessment of test coverage for changes]

## Performance Notes
- [Any performance observations]

---

## Suggested Improvements

1. **[Category]**: [Specific suggestion with code example if helpful]

---

## Files Reviewed

| File | Changes | Status |
|------|---------|--------|
| [path] | +X/-Y | [OK/Issues Found] |
```

### Step 4: Offer Actions

After presenting the review, offer:

1. **Apply auto-fixes** - If there are simple fixes (remove console.logs, fix typos)
2. **Create GitHub PR** - If not already a PR, offer to create one
3. **Request specific clarification** - If logic is unclear

## Review Modes

- `/review` - Full comprehensive review (default)
- `/review:quick` - Security + Critical issues only
- `/review:security` - Security-focused deep dive
- `/review:perf` - Performance-focused review
