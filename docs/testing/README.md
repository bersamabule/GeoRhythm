# Autonomous Test and Check

This folder contains configuration and reports for Claude's autonomous testing capability.

## What Is This?

Claude automatically verifies code quality before delivering changes. This capability:

- **Detects** your project's testing framework and tools
- **Runs** appropriate checks based on what changed
- **Generates** tests for new code when appropriate
- **Self-corrects** issues when possible before showing you code

## How It Works

### Verification Phases

| Phase | Timing | Checks |
|-------|--------|--------|
| **Immediate** | After writing code | Syntax, imports, types |
| **Pre-Delivery** | Before showing you | Linting, tests, security |
| **Integration** | For significant changes | Existing tests, regressions |
| **Smoke** | For running apps | App still works |

### What Gets Checked

```
✓ Syntax validation (code parses)
✓ Type checking (TypeScript, MyPy, etc.)
✓ Linting (ESLint, Ruff, etc.)
✓ Unit tests pass
✓ Coverage maintained
✓ No security issues
✓ No debug statements left
✓ Build succeeds
```

## Configuration

The `test-config.json` file tells Claude about your project's testing setup:

```json
{
  "framework": "jest",
  "testCommand": "npm test",
  "coverageCommand": "npm test -- --coverage",
  "lintCommand": "npm run lint",
  "typeCheckCommand": "npm run type-check",
  "buildCommand": "npm run build",
  "coverageThreshold": 80,
  "testPatterns": ["**/*.test.ts", "**/*.spec.ts"]
}
```

## Slash Commands

- `/verify` - Run full verification suite manually
- `/test` - Run tests for recent changes
- `/coverage` - Check test coverage

## Reports

Verification reports are stored here when issues are found:
- `verification-[timestamp].md` - Full verification report
- `coverage-[timestamp].json` - Coverage data

## Framework Detection

Claude automatically detects your testing setup by examining:

| File | Framework Detected |
|------|-------------------|
| `jest.config.js` | Jest |
| `vitest.config.ts` | Vitest |
| `pytest.ini` / `pyproject.toml` | Pytest |
| `phpunit.xml` | PHPUnit |
| `go.mod` | Go testing |
| `Cargo.toml` | Rust/Cargo test |

## Trust Through Verification

The goal is for you to trust that when Claude delivers code:
- It compiles/parses correctly
- Tests pass
- No obvious security issues
- Follows your project's conventions
- Doesn't break existing functionality
