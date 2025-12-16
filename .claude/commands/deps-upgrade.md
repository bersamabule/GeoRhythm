# Dependency Doctor - Upgrade Plan Generator

Generate a safe upgrade plan for a specific dependency or all dependencies.

## Usage

- `/deps-upgrade` - Upgrade plan for all outdated packages
- `/deps-upgrade [package]` - Upgrade plan for specific package
- `/deps-upgrade --security` - Upgrade only packages with vulnerabilities

## Instructions

### Step 1: Identify Target Package(s)

If specific package requested:
- Check current version
- Check latest version
- Check for security advisories
- Identify breaking changes between versions

If all packages:
- Prioritize by: Critical security > High security > Outdated major > Outdated minor

### Step 2: Analyze Breaking Changes

For major version updates:
1. Search for CHANGELOG or release notes
2. Identify breaking changes
3. Search codebase for affected usage patterns
4. Estimate migration effort

### Step 3: Generate Upgrade Plan

```markdown
# Upgrade Plan: [package-name]

**Current Version**: X.Y.Z
**Target Version**: A.B.C
**Change Type**: [Major/Minor/Patch]
**Security Fix**: [Yes/No]
**Estimated Effort**: [Low/Medium/High]

---

## Pre-Upgrade Checklist

- [ ] Backup lock file: `cp package-lock.json package-lock.json.backup`
- [ ] Ensure tests pass: `npm test`
- [ ] Review breaking changes below
- [ ] Check peer dependency compatibility

---

## Breaking Changes

### From X.Y to A.B

1. **[Change 1]**
   - Old behavior: [description]
   - New behavior: [description]
   - Migration: [how to update code]

2. **[Change 2]**
   - [details]

### Files Likely Affected in Your Codebase

Based on usage analysis:
- `src/components/Example.tsx` - Uses deprecated API
- `src/utils/helper.ts` - Uses removed function

---

## Upgrade Steps

### Step 1: Update Package

```bash
# For npm
npm install [package]@[version]

# For yarn
yarn upgrade [package]@[version]

# For pip
pip install [package]==[version]
```

### Step 2: Apply Code Migrations

[Specific code changes needed, with before/after examples]

### Step 3: Verify

```bash
# Run tests
npm test

# Run type check (if TypeScript)
npm run type-check

# Run linter
npm run lint
```

---

## Rollback Plan

If issues arise:

```bash
# Restore lock file
cp package-lock.json.backup package-lock.json

# Reinstall
npm ci
```

---

## Post-Upgrade Tasks

- [ ] Run full test suite
- [ ] Test affected features manually
- [ ] Update documentation if API changed
- [ ] Create ADR if significant architectural impact
- [ ] Update CLAUDE.md with new version info

---

## Related Dependencies

These packages may also need updates for compatibility:

| Package | Current | Required | Action |
|---------|---------|----------|--------|
| [peer-dep] | [ver] | [ver] | Update together |
```

### Step 4: Offer to Execute

Ask user if they want to:
1. Execute the upgrade now (with verification)
2. Save the plan for later
3. Modify the plan

### Step 5: If Executing

1. Run pre-upgrade tests
2. Apply upgrade
3. Run post-upgrade verification (Test & Check)
4. Report results
5. Offer rollback if tests fail

## Safety Rules

- **Never auto-upgrade** without user confirmation for major versions
- **Always backup** lock file before changes
- **Run tests** before and after
- **Warn loudly** about known breaking changes
- **Suggest incremental upgrades** if jumping multiple major versions
