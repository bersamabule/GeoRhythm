# Autonomous Lookup and Inform - App Inspection

Perform a comprehensive inspection of the running web application to capture full debugging context.

## What This Captures

| Data | Description |
|------|-------------|
| **Screenshot** | Current visual state of the app |
| **Console Logs** | All console output (errors, warnings, info, debug) |
| **Network** | Failed requests, API errors, slow responses |
| **DOM** | Current page structure and element states |
| **Storage** | localStorage, sessionStorage, cookies |
| **Performance** | Core Web Vitals, load times, render metrics |
| **App State** | React/Redux state if detected |

## Prerequisites

The browser must be running with remote debugging enabled:

```powershell
# Windows (run once before inspection)
& "C:\Claude_Code_helper\living-docs\start-browser-debug.ps1"
```

```bash
# Mac/Linux
bash /path/to/living-docs/start-browser-debug.sh
```

## Instructions

1. **Connect to the browser** using Chrome DevTools MCP (already configured)

2. **Capture comprehensive context**:
   - Take a screenshot of the current viewport
   - Get all console messages (especially errors)
   - Check network requests for failures (4xx, 5xx status codes)
   - Get DOM snapshot if needed for element inspection
   - Capture localStorage/sessionStorage if relevant
   - Get performance metrics if investigating slowness

3. **Analyze the captured data**:
   - Identify any JavaScript errors in console
   - Note failed network requests and their responses
   - Check for visual anomalies in screenshot
   - Correlate errors with recent code changes

4. **Report findings** to user with:
   - Summary of issues found
   - Specific error messages and locations
   - Recommended fixes
   - Links to relevant code if identifiable

5. **Optionally save report** to `docs/inspect/[timestamp]-inspection.md`

## MCP Tools to Use

Use the Chrome DevTools MCP or Playwright MCP tools:

- `mcp__playwright__browser_snapshot` - Get accessibility tree (semantic page structure)
- `mcp__playwright__browser_take_screenshot` - Capture visual state
- `mcp__playwright__browser_console_messages` - Get console logs
- `mcp__playwright__browser_network_requests` - Get network activity
- `mcp__playwright__browser_evaluate` - Execute JS to get app state

## Quick Inspection Template

```markdown
## Inspection Report - [TIMESTAMP]

### Visual State
[Screenshot or description]

### Console Errors
[List of errors with stack traces]

### Network Issues
[Failed requests, status codes, endpoints]

### Performance
[Core Web Vitals if relevant]

### Diagnosis
[Root cause analysis]

### Recommended Fix
[Action items]
```

## Common Scenarios

### "Something looks wrong"
1. Take screenshot
2. Get console errors
3. Compare visual state to expected

### "API not working"
1. Get network requests
2. Filter for failed requests
3. Check request/response details

### "Page is slow"
1. Get performance metrics
2. Check for large network requests
3. Look for console warnings

### "State seems corrupted"
1. Evaluate localStorage/sessionStorage
2. Check React DevTools state (if available)
3. Look for state-related console errors
