# Dependency Doctor - Full Health Check

Perform a comprehensive dependency health check on the current project.

## Instructions

### Step 1: Detect Package Manager

Check for these files in priority order:

| File | Ecosystem | Package Manager |
|------|-----------|-----------------|
| `package.json` | JavaScript | npm/yarn/pnpm |
| `package-lock.json` | JavaScript | npm |
| `yarn.lock` | JavaScript | yarn |
| `pnpm-lock.yaml` | JavaScript | pnpm |
| `requirements.txt` | Python | pip |
| `pyproject.toml` | Python | pip/poetry |
| `Pipfile` | Python | pipenv |
| `poetry.lock` | Python | poetry |
| `Cargo.toml` | Rust | cargo |
| `go.mod` | Go | go |
| `Gemfile` | Ruby | bundler |

### Step 2: Run Security Audit

**JavaScript (npm):**
```bash
npm audit --json 2>/dev/null || npm audit
```

**Python (pip-audit preferred, fallback to safety):**
```bash
pip-audit --format=json 2>/dev/null || pip-audit || safety check
```

**Rust:**
```bash
cargo audit --json 2>/dev/null || cargo audit
```

**Go:**
```bash
govulncheck ./... 2>/dev/null || go list -m -versions all
```

### Step 3: Check for Outdated Packages

**JavaScript:**
```bash
npm outdated --json 2>/dev/null || npm outdated
```

**Python:**
```bash
pip list --outdated --format=json 2>/dev/null || pip list --outdated
```

**Rust:**
```bash
cargo outdated --format json 2>/dev/null || cargo outdated
```

**Go:**
```bash
go list -m -u -json all 2>/dev/null || go list -m -u all
```

### Step 4: Generate Report

Create a comprehensive report in this format:

```markdown
# Dependency Health Report

**Project**: [name]
**Date**: [timestamp]
**Package Manager**: [detected]

---

## Security Summary

| Severity | Count | Action Required |
|----------|-------|-----------------|
| Critical | X | Immediate |
| High | X | This week |
| Moderate | X | This month |
| Low | X | When convenient |

---

## Vulnerabilities

### Critical & High Severity

| Package | Version | Severity | CVE/Advisory | Fixed In | Description |
|---------|---------|----------|--------------|----------|-------------|
| [name] | [ver] | CRITICAL | [CVE-XXX] | [ver] | [brief] |

### Moderate & Low Severity

| Package | Version | Severity | CVE/Advisory | Fixed In |
|---------|---------|----------|--------------|----------|
| [name] | [ver] | MODERATE | [GHSA-XXX] | [ver] |

---

## Outdated Dependencies

### Major Updates Available (Review Required)

| Package | Current | Latest | Age | Breaking Changes |
|---------|---------|--------|-----|------------------|
| [name] | [cur] | [new] | [days] | [yes/no/unknown] |

### Minor/Patch Updates (Usually Safe)

| Package | Current | Latest | Type |
|---------|---------|--------|------|
| [name] | [cur] | [new] | minor/patch |

---

## Recommended Actions

### Immediate (Critical/High)
1. `[command to fix critical issue]`
2. `[command to fix high issue]`

### This Week (Moderate)
1. `[command]`

### When Convenient
1. `[command]`

---

## Auto-Fix Available

Run this command to fix auto-fixable issues:
```bash
[npm audit fix / pip-audit --fix / etc.]
```

**Note**: This will NOT fix issues requiring major version changes.
```

### Step 5: Provide Recommendations

Based on findings:

1. **If critical vulnerabilities found:**
   - Highlight them prominently
   - Provide exact upgrade commands
   - Warn about potential breaking changes

2. **If outdated major versions:**
   - Link to migration guides if available
   - Suggest creating ADR for major upgrades

3. **If everything is healthy:**
   - Confirm all clear
   - Note when last checked

## Output Modes

- Default: Full report
- `/deps:security` - Only vulnerabilities
- `/deps:outdated` - Only version updates
- `/deps:summary` - Brief counts only
