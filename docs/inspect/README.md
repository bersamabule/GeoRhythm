# App Inspection Reports

This folder stores inspection reports from Claude's "Autonomous Lookup and Inform" capability.

## What's Stored Here

| File Type | Purpose |
|-----------|---------|
| `YYYY-MM-DD-HHMMSS-inspection.md` | Full inspection reports |
| `screenshots/` | Captured screenshots |
| `*.json` | Raw captured data (console, network, state) |

## Report Structure

Each inspection report typically includes:

```markdown
## Inspection Report - [TIMESTAMP]

### Context
- URL inspected
- Trigger (what prompted inspection)

### Visual State
- Screenshot reference
- Visual anomalies noted

### Console Output
- Errors (with stack traces)
- Warnings
- Relevant info/debug messages

### Network Activity
- Failed requests
- Slow requests
- API errors

### Performance Metrics
- Core Web Vitals (LCP, FID, CLS)
- Load times

### Storage State
- Relevant localStorage items
- Session data

### Diagnosis
- Root cause analysis
- Correlation with code

### Resolution
- Fix applied or recommended
- Verification status
```

## When Reports Are Created

- Manually via `/inspect` command
- When debugging issues
- On request: "Can you check what's happening?"

## Retention

Consider periodically cleaning up old inspection reports.
Screenshots can be large - delete when no longer needed.

## Linking to Chronicles

Reference inspection reports in your chronicle entries:

```markdown
### Issues Encountered
See [inspection report](../inspect/2025-01-15-143022-inspection.md) for details.
```
