# Pre-Delivery Verification Checklist

Claude uses this checklist before delivering code changes.

---

## Phase 1: Immediate (After Writing Code)

### Syntax & Structure
- [ ] Code parses without syntax errors
- [ ] All brackets/braces/quotes matched
- [ ] No unterminated strings
- [ ] Valid language constructs used

### Imports & Dependencies
- [ ] All imports resolve to existing modules
- [ ] No circular imports introduced
- [ ] Required dependencies are installed
- [ ] Import paths are correct

### Types (if applicable)
- [ ] Type annotations are valid syntax
- [ ] Generic types properly specified
- [ ] No `any` types without justification

---

## Phase 2: Pre-Delivery (Before Showing User)

### Code Quality
- [ ] Linting passes with no errors
- [ ] No unused variables or imports
- [ ] No unreachable code
- [ ] Consistent formatting with codebase
- [ ] No debug statements (console.log, print, debugger)
- [ ] No TODO/FIXME comments without context
- [ ] Function complexity reasonable (< 10 cyclomatic)

### Type Safety
- [ ] Type checker passes (TypeScript, MyPy, etc.)
- [ ] No implicit any types
- [ ] Null/undefined handled properly
- [ ] Return types match declarations

### Testing
- [ ] New functions have tests
- [ ] Edge cases covered (null, empty, boundary)
- [ ] Error cases tested
- [ ] All tests pass
- [ ] Coverage not decreased

### Security
- [ ] No hardcoded credentials or secrets
- [ ] No SQL injection vulnerabilities
- [ ] No command injection risks
- [ ] User input validated/sanitized
- [ ] No sensitive data logged
- [ ] Security linter passes

---

## Phase 3: Integration (For Significant Changes)

### Regression Prevention
- [ ] All existing tests still pass
- [ ] No breaking changes to public APIs
- [ ] Backward compatibility maintained
- [ ] Related functionality verified

### Coverage
- [ ] Overall coverage >= threshold (80%)
- [ ] Critical path coverage >= 90%
- [ ] New code coverage >= 80%
- [ ] No significant coverage drops

### Dependencies
- [ ] No new vulnerabilities introduced
- [ ] Dependency versions compatible
- [ ] Lock file updated if needed

---

## Phase 4: Smoke (For Running Apps)

### Build
- [ ] Build completes without errors
- [ ] No new warnings introduced
- [ ] Bundle size acceptable
- [ ] Assets generated correctly

### Runtime
- [ ] Application starts successfully
- [ ] Core functionality works
- [ ] No console errors on startup
- [ ] Health check endpoints respond

### Integration Points
- [ ] Database connections work
- [ ] API endpoints respond
- [ ] External services accessible
- [ ] Environment variables set

---

## Self-Correction Protocol

When a check fails:

1. **Identify** - Determine exact failure
2. **Analyze** - Understand root cause
3. **Fix** - Attempt automatic correction
4. **Verify** - Re-run failed check
5. **Report** - If unfixable, explain to user

### Auto-Fixable Issues
- Linting errors (with --fix)
- Formatting issues (with formatter)
- Missing imports (add them)
- Unused imports (remove them)
- Simple type errors (add annotations)

### Requires User Input
- Failing tests (may need requirements clarification)
- Security vulnerabilities (may be intentional)
- Breaking API changes (need approval)
- Coverage threshold failures (may need more tests)

---

## Verification Report Template

```markdown
## Verification Report

**Time**: [timestamp]
**Scope**: [files changed]

### Results

| Check | Status | Details |
|-------|--------|---------|
| Syntax | ✓/✗ | |
| Imports | ✓/✗ | |
| Types | ✓/✗ | |
| Lint | ✓/✗ | |
| Tests | ✓/✗ | X passed, Y failed |
| Coverage | ✓/✗ | XX% (threshold: YY%) |
| Security | ✓/✗ | |
| Build | ✓/✗ | |

### Issues Found
[List any issues]

### Auto-Corrections Applied
[List any auto-fixes]

### Requires Attention
[List any issues needing user input]

### Overall Status
**[PASS/FAIL]** - [Summary]
```

---

## Quick Reference: Framework Commands

### JavaScript/TypeScript
```bash
# Lint
npx eslint . --fix

# Type check
npx tsc --noEmit

# Test
npm test

# Coverage
npm test -- --coverage

# Build
npm run build

# Security
npm audit
```

### Python
```bash
# Lint
ruff check . --fix

# Type check
mypy .

# Test
pytest

# Coverage
pytest --cov=src

# Build
python -m build

# Security
bandit -r src/ && safety check
```

### Go
```bash
# Lint/Vet
go vet ./...

# Test
go test ./...

# Coverage
go test -cover ./...

# Build
go build ./...

# Security
govulncheck ./...
```
