# Technical Debt Tracking

This directory contains technical debt reports and tracking for GeoRhythm.

## Contents

- `debt-report.md` - Latest comprehensive debt scan report
- `debt-history.json` - Historical tracking of debt over time

## Commands

| Command | Description |
|---------|-------------|
| `/debt-scan` | Scan codebase for technical debt |
| `/debt-scan [path]` | Scan specific directory |
| `/debt-scan:quick` | Fast scan (complexity + TODOs only) |
| `/debt-report` | Generate comprehensive report |
| `/debt-report:trends` | Show debt trends over time |
| `/debt-fix [issue]` | Get refactoring guidance |

## What Gets Detected

### Complexity Issues
- Long functions (>50 lines)
- Deep nesting (>4 levels)
- High cyclomatic complexity
- Large files

### Code Smells
- Duplicated code
- Dead/unreachable code
- Magic numbers/strings
- God classes/files

### Maintenance Issues
- TODO/FIXME comments
- Outdated comments
- Missing documentation
- Inconsistent naming

### Test Gaps
- Low coverage areas
- Missing edge case tests
- Brittle tests

### Security Debt
- Hardcoded secrets
- Deprecated API usage
- Unsafe patterns

## Severity Levels

| Level | Criteria | Action |
|-------|----------|--------|
| CRITICAL | Security risk, blocking bugs | Fix immediately |
| HIGH | Major maintainability impact | Fix this sprint |
| MEDIUM | Code smell, minor issues | Plan to fix |
| LOW | Style, minor optimization | Nice to have |

## Debt Score

The debt score is calculated as:

```
score = (critical * 100) + (high * 25) + (medium * 5) + (low * 1)
```

Lower scores are better. Track this over time to see trends.

---

*Technical Debt Radar - Part of Living Documentation*
