# Run Tests

Run tests for recent changes or the entire test suite.

## Instructions

### Step 1: Detect Test Framework

Look for test configuration:
- `package.json` → Jest, Vitest, Mocha
- `pytest.ini` / `pyproject.toml` → Pytest
- `go.mod` → Go test
- `Cargo.toml` → Cargo test

### Step 2: Determine Scope

**For specific files changed:**
```bash
# Jest/Vitest - run related tests
npm test -- --findRelatedTests path/to/changed/file.ts

# Pytest - run tests in same directory
pytest tests/test_module.py

# Go - run package tests
go test ./pkg/...
```

**For full suite:**
```bash
npm test
pytest
go test ./...
cargo test
```

### Step 3: Run with Coverage (if requested)

```bash
# JavaScript
npm test -- --coverage

# Python
pytest --cov=src --cov-report=term-missing

# Go
go test -cover ./...
```

### Step 4: Report Results

```markdown
## Test Results

**Suite**: [framework name]
**Passed**: X tests
**Failed**: Y tests
**Skipped**: Z tests
**Duration**: X.Xs

### Failed Tests (if any)
- `test_name` - Error message

### Coverage
- Lines: XX%
- Branches: XX%
- Functions: XX%
```

## Common Test Commands

| Framework | Run All | Run One File | With Coverage |
|-----------|---------|--------------|---------------|
| Jest | `npm test` | `npm test -- path/to/test.ts` | `npm test -- --coverage` |
| Vitest | `npm test` | `npm test -- path/to/test.ts` | `npm test -- --coverage` |
| Pytest | `pytest` | `pytest tests/test_file.py` | `pytest --cov` |
| Go | `go test ./...` | `go test ./pkg/name` | `go test -cover ./...` |
| Cargo | `cargo test` | `cargo test test_name` | `cargo tarpaulin` |

## Test Patterns

When generating tests, follow:

1. **Arrange-Act-Assert** pattern
2. **One behavior per test**
3. **Descriptive test names**
4. **Edge cases covered**:
   - Empty/null inputs
   - Boundary values
   - Error conditions
