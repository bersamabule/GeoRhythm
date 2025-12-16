# Autonomous PR Reviewer - GitHub PR Review

Review an existing GitHub Pull Request with full codebase context.

## Usage

`/review-pr [PR-number-or-URL]`

Examples:
- `/review-pr 123`
- `/review-pr https://github.com/owner/repo/pull/123`

## Instructions

### Step 1: Get PR Information

Use MCP GitHub tools to fetch PR details:

1. **Parse the PR reference** from the argument
   - If URL: extract owner, repo, PR number
   - If number only: use current repo context

2. **Fetch PR details**:
   - Use `mcp__github__get_pull_request` to get PR metadata
   - Use `mcp__github__get_pull_request_files` to get changed files
   - Use `mcp__github__get_pull_request_comments` to see existing discussion
   - Use `mcp__github__get_pull_request_reviews` to see prior reviews

3. **Fetch file contents** for changed files to understand full context

### Step 2: Read Project Context

1. Check for CLAUDE.md in the repo for conventions
2. Look at existing patterns in similar files
3. Understand the PR description and linked issues

### Step 3: Analyze Changes

For each changed file, analyze:

#### Security
- Secrets, credentials, API keys
- Injection vulnerabilities (SQL, XSS, command)
- Auth/authz issues
- Data exposure risks

#### Logic
- Edge cases and error handling
- Race conditions in async code
- Null/undefined handling
- Type correctness

#### Quality
- Follows repo conventions
- Clean, readable code
- No debug statements
- Appropriate test coverage

#### Breaking Changes
- API contract changes
- Database schema changes
- Configuration changes
- Dependency updates

### Step 4: Generate Review

```markdown
# PR Review: #[number] - [title]

**Author**: [author]
**Branch**: [head] -> [base]
**Files Changed**: [count]
**Reviewer**: Claude (Autonomous PR Reviewer)

---

## Summary

[Brief description of what this PR does and its impact]

**Recommendation**: [APPROVE / REQUEST_CHANGES / COMMENT]

---

## Review by File

### [filename]
**Changes**: +X/-Y lines

**Observations**:
- [observation 1]
- [observation 2]

**Issues**:
| Line | Severity | Issue | Suggestion |
|------|----------|-------|------------|
| [L#] | [Critical/Major/Minor] | [issue] | [suggestion] |

---

## Overall Assessment

### What's Good
- [Positive observation 1]
- [Positive observation 2]

### Concerns
1. **[Category]**: [Concern and recommendation]

### Questions for Author
- [Any clarifying questions]

---

## Checklist

- [ ] Security review passed
- [ ] Logic review passed
- [ ] Code quality acceptable
- [ ] Tests adequate
- [ ] Documentation updated (if needed)

---

## Suggested Comments

[Specific inline comments to leave on the PR with line references]
```

### Step 5: Offer to Submit Review

Ask if the user wants to:

1. **Submit review to GitHub** using `mcp__github__create_pull_request_review`
   - Choose event: APPROVE, REQUEST_CHANGES, or COMMENT
   - Include inline comments on specific lines

2. **Just view the review** without submitting

3. **Ask clarifying questions** before finalizing

## Review Submission

When submitting, use the MCP tool:
```
mcp__github__create_pull_request_review
- owner: [repo owner]
- repo: [repo name]
- pull_number: [PR number]
- body: [review summary]
- event: APPROVE | REQUEST_CHANGES | COMMENT
- comments: [array of inline comments with path, line, body]
```

## Tips

- For large PRs, focus on the most critical files first
- Look at the PR description for context on intent
- Check if CI is passing before deep review
- Consider the author's experience level in feedback tone
