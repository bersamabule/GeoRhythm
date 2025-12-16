# Dependency Doctor

Claude's autonomous capability for monitoring, securing, and updating project dependencies.

## What Is This?

Dependency Doctor continuously monitors your project's dependencies for:

- **Security vulnerabilities** - Known CVEs, advisories, malicious packages
- **Outdated versions** - Major, minor, and patch updates available
- **Breaking changes** - Incompatibilities and migration requirements
- **License issues** - License compliance and compatibility

## How It Works

### Proactive Monitoring

When Claude starts a session in your project, Dependency Doctor automatically:
1. Detects your package manager (npm, pip, cargo, go, etc.)
2. Scans for known vulnerabilities
3. Identifies outdated packages
4. Reports findings with severity ratings

### On-Demand Scanning

Use these slash commands:
- `/deps` - Full dependency health report
- `/deps:security` - Security vulnerabilities only
- `/deps:outdated` - Outdated packages only
- `/deps:upgrade [package]` - Generate upgrade plan for specific package

## What Gets Checked

### JavaScript/TypeScript (npm/yarn)
```bash
npm audit                    # Security vulnerabilities
npm outdated                 # Version updates available
npx npm-check-updates       # Major updates analysis
```

### Python (pip/poetry)
```bash
pip-audit                    # Security vulnerabilities
pip list --outdated          # Version updates available
safety check                 # Additional vulnerability database
```

### Rust (cargo)
```bash
cargo audit                  # Security vulnerabilities
cargo outdated              # Version updates available
```

### Go
```bash
govulncheck ./...           # Security vulnerabilities
go list -m -u all           # Version updates available
```

## Reports

### Vulnerability Report
```markdown
## Security Vulnerabilities Found

| Package | Severity | CVE | Fixed In | Action |
|---------|----------|-----|----------|--------|
| lodash | HIGH | CVE-2021-23337 | 4.17.21 | Upgrade |
| axios | MODERATE | GHSA-xxx | 1.6.0 | Upgrade |

### Recommended Actions
1. Run `npm audit fix` for auto-fixable issues
2. Manual upgrade required for lodash (breaking changes)
```

### Outdated Report
```markdown
## Outdated Dependencies

| Package | Current | Latest | Type | Risk |
|---------|---------|--------|------|------|
| react | 17.0.2 | 18.2.0 | Major | Medium |
| typescript | 4.9.5 | 5.3.3 | Major | Low |
| eslint | 8.50.0 | 8.56.0 | Minor | Low |

### Upgrade Recommendations
- **react**: Major version - review migration guide
- **typescript**: Major version - check breaking changes
- **eslint**: Minor version - safe to upgrade
```

## Configuration

Edit `docs/dependencies/config.json`:

```json
{
  "scanning": {
    "onSessionStart": true,
    "frequency": "session",
    "ignoreDev": false
  },
  "thresholds": {
    "failOnSeverity": "high",
    "maxAge": {
      "major": 365,
      "minor": 180,
      "patch": 30
    }
  },
  "ignore": {
    "packages": [],
    "advisories": []
  }
}
```

## Automated Upgrade Plans

When you request an upgrade, Dependency Doctor generates:

1. **Pre-upgrade checklist**
   - Backup current lock file
   - Identify breaking changes
   - Check peer dependency compatibility

2. **Upgrade steps**
   - Exact commands to run
   - Order of operations
   - Rollback commands

3. **Post-upgrade verification**
   - Tests to run
   - Functionality to verify
   - Known issues to watch for

## Integration with Other Capabilities

- **Test and Check**: Verifies upgrades don't break tests
- **Living Documentation**: Records upgrade decisions in ADRs
- **Chronicle**: Logs dependency changes in session summaries

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Active exploits exist | Immediate upgrade |
| HIGH | Serious vulnerability | Upgrade within days |
| MODERATE | Exploitable with effort | Upgrade within weeks |
| LOW | Minor security impact | Upgrade when convenient |

## Sources

Dependency Doctor pulls vulnerability data from:
- [GitHub Advisory Database](https://github.com/advisories)
- [National Vulnerability Database (NVD)](https://nvd.nist.gov/)
- [PyPI Advisory Database](https://github.com/pypa/advisory-database)
- [RustSec Advisory Database](https://rustsec.org/)
- [Go Vulnerability Database](https://vuln.go.dev/)
