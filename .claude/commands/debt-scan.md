# Technical Debt Radar - Scan

Scan the codebase for technical debt, code smells, and quality issues.

## Usage

`/debt-scan` - Full codebase scan
`/debt-scan [path]` - Scan specific directory
`/debt-scan:quick` - Fast scan (critical issues only)

## Instructions

### Step 1: Identify Project Type

Detect language/framework from:
- `package.json` → JavaScript/TypeScript
- `requirements.txt` / `pyproject.toml` → Python
- `Cargo.toml` → Rust
- `go.mod` → Go
- `*.csproj` → C#

### Step 2: Run Debt Detection

#### A. Complexity Analysis

**For each source file, check:**

| Metric | Threshold | Severity |
|--------|-----------|----------|
| Lines per function | >50 | High |
| Lines per file | >500 | Medium |
| Nesting depth | >4 levels | High |
| Parameters per function | >5 | Medium |
| Cyclomatic complexity | >10 | High |

**Detection approach:**
```bash
# Count long functions (>50 lines between function declarations)
# Count deeply nested code (4+ levels of indentation)
# Count files over 500 lines
```

#### B. TODO/FIXME Detection

```bash
# Search for debt markers
grep -rn "TODO\|FIXME\|HACK\|XXX\|TEMP\|DEPRECATED" --include="*.ts" --include="*.js" --include="*.py"
```

Categorize by age (if git available):
- Recent (< 1 month): Low priority
- Old (1-6 months): Medium priority
- Ancient (> 6 months): High priority - likely forgotten

#### C. Duplication Detection

Look for:
- Identical or near-identical code blocks (>10 lines)
- Similar function signatures with different implementations
- Copy-paste patterns

**Heuristic approach:**
1. Hash code blocks
2. Find matching hashes
3. Report duplicates

#### D. Code Smell Detection

| Smell | Detection | Severity |
|-------|-----------|----------|
| God Class | Class >500 lines or >20 methods | High |
| Long Parameter List | Function with >5 params | Medium |
| Dead Code | Unused exports, unreachable code | Medium |
| Magic Numbers | Hardcoded values without constants | Low |
| Empty Catch | `catch {}` or `catch { }` | High |
| Console/Debug | `console.log`, `print()`, `debugger` | Medium |
| Commented Code | Large blocks of commented code | Low |

#### E. Test Coverage Gaps

Check for:
- Source files without corresponding test files
- Functions/classes not covered by tests
- Critical paths without tests

**Detection:**
```bash
# Find source files
# Find test files
# Compare - which sources lack tests?
```

#### F. Architecture Issues (uses Knowledge Graph if available)

- Circular dependencies
- Layer violations (UI importing from DB directly)
- Orphan modules (not imported anywhere)
- God modules (imported by everything)

### Step 3: Calculate Debt Score

**Scoring Formula:**
```
debt_score = (critical * 10) + (high * 5) + (medium * 2) + (low * 1)
```

**Health Rating:**
| Score | Rating | Meaning |
|-------|--------|---------|
| 0-20 | Excellent | Minimal debt |
| 21-50 | Good | Manageable debt |
| 51-100 | Fair | Needs attention |
| 101-200 | Poor | Significant debt |
| 200+ | Critical | Urgent refactoring needed |

### Step 4: Generate Scan Results

```markdown
# Technical Debt Scan Results

**Project**: [name]
**Scanned**: [timestamp]
**Files Analyzed**: [count]
**Debt Score**: [score] ([rating])

---

## Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Complexity | X | X | X | X |
| TODOs/FIXMEs | - | X | X | X |
| Duplication | - | X | X | - |
| Code Smells | X | X | X | X |
| Test Gaps | - | X | X | - |
| Architecture | X | X | - | - |

**Total Issues**: [count]
**Estimated Fix Time**: [hours] (rough estimate)

---

## Critical Issues (Fix Now)

| File | Line | Issue | Category |
|------|------|-------|----------|
| [path] | [line] | [description] | [category] |

---

## High Priority Issues

| File | Line | Issue | Category |
|------|------|-------|----------|
| [path] | [line] | [description] | [category] |

---

## Hotspots (Files with Most Debt)

| File | Issues | Score | Top Problems |
|------|--------|-------|--------------|
| [path] | [count] | [score] | [list] |

---

## Quick Wins (Easy Fixes)

These can be fixed quickly with low risk:
1. [description] in [file]
2. [description] in [file]

---

## Next Steps

1. Run `/debt-report` for detailed breakdown
2. Run `/debt-fix [issue-id]` for refactoring guidance
3. Address critical issues before next release
```

### Step 5: Save Results

Save to `docs/debt/scan-2025-12-15.json` for tracking over time.

## Continuous Monitoring

When `/debt-scan` finds issues during normal work:
- Alert on critical issues in files being edited
- Suggest fixes when touching debt-heavy files
- Track debt trends over time
