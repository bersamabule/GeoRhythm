# Autonomous Test and Check - Full Verification

Run comprehensive verification on recent changes or specified files.

## What This Does

Performs a complete verification suite:

1. **Syntax Validation** - Code parses without errors
2. **Type Checking** - TypeScript/MyPy/etc. passes
3. **Linting** - Code style and quality checks
4. **Unit Tests** - All tests pass
5. **Coverage Check** - Coverage threshold maintained
6. **Security Scan** - No obvious vulnerabilities
7. **Build Verification** - Project builds successfully

## Instructions

### Step 1: Detect Project Setup

Check for testing configuration:
- Look for `docs/testing/test-config.json` (explicit config)
- Or auto-detect from project files:
  - `package.json` → npm/yarn commands, Jest/Vitest
  - `pyproject.toml` / `requirements.txt` → pytest
  - `go.mod` → go test
  - `Cargo.toml` → cargo test

### Step 2: Run Verification Phases

**Phase 1 - Quick Checks (always run):**
```bash
# Lint
npm run lint || npx eslint . || ruff check .

# Type check
npm run type-check || npx tsc --noEmit || mypy .

# Format check
npm run format:check || npx prettier --check . || ruff format --check .
```

**Phase 2 - Tests (always run):**
```bash
# Run tests
npm test || pytest || go test ./...

# Check coverage
npm test -- --coverage || pytest --cov
```

**Phase 3 - Build (for significant changes):**
```bash
npm run build || python setup.py check || go build ./...
```

**Phase 4 - Security (for new code):**
```bash
npm audit || safety check || bandit -r src/
```

### Step 3: Report Results

Provide a verification summary:

```markdown
## Verification Results

| Check | Status | Details |
|-------|--------|---------|
| Syntax | ✓ PASS | No errors |
| Types | ✓ PASS | No type errors |
| Lint | ✓ PASS | No warnings |
| Tests | ✓ PASS | 42 tests passed |
| Coverage | ✓ PASS | 85% (threshold: 80%) |
| Security | ✓ PASS | No vulnerabilities |
| Build | ✓ PASS | Built successfully |

**Overall: PASS** - All checks passed
```

### Step 4: Handle Failures

If any check fails:
1. Report the specific failure
2. Attempt auto-fix if possible (lint --fix, format)
3. Re-run verification
4. If still failing, report what needs manual attention

## Framework-Specific Commands

### JavaScript/TypeScript (npm)
```bash
npm run lint          # or: npx eslint .
npm run type-check    # or: npx tsc --noEmit
npm test              # or: npx jest
npm test -- --coverage
npm run build
npm audit
```

### Python (pytest)
```bash
ruff check .          # or: flake8 .
mypy .
pytest
pytest --cov=src --cov-report=term-missing
python -m build       # or: pip install -e .
bandit -r src/ && safety check
```

### Go
```bash
go vet ./...
go test ./...
go test -cover ./...
go build ./...
govulncheck ./...
```

## Verification Checklist

Before declaring code complete:

- [ ] Code parses without syntax errors
- [ ] No unresolved imports
- [ ] Type checking passes
- [ ] Linting passes (no errors)
- [ ] All existing tests pass
- [ ] New tests written for new code
- [ ] Coverage threshold maintained
- [ ] No hardcoded secrets
- [ ] No console.log/print debug statements
- [ ] Build succeeds
- [ ] No security warnings

## When to Run

- **Always**: Before delivering any code changes
- **Manually**: User requests `/verify`
- **Triggered**: After significant refactoring
