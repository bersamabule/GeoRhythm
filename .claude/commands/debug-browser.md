# Start Browser Debug Mode

Launch the browser with remote debugging enabled so Claude can inspect the running app.

## Instructions

1. **Start the browser with debugging enabled**:

   **Windows (PowerShell):**
   ```powershell
   & "C:\Claude_Code_helper\living-docs\start-browser-debug.ps1"
   ```

   **With options:**
   ```powershell
   # Use Chrome instead of Brave
   & "C:\Claude_Code_helper\living-docs\start-browser-debug.ps1" -Browser chrome

   # Custom URL
   & "C:\Claude_Code_helper\living-docs\start-browser-debug.ps1" -Url "http://localhost:5173"

   # Custom port
   & "C:\Claude_Code_helper\living-docs\start-browser-debug.ps1" -Port 9223
   ```

   **Mac/Linux (Bash):**
   ```bash
   bash ~/path/to/living-docs/start-browser-debug.sh

   # With options: [browser] [port] [url]
   bash ~/path/to/living-docs/start-browser-debug.sh chrome 9222 http://localhost:5173
   ```

2. **Navigate to your app** in the launched browser

3. **Tell Claude** you're ready: "Browser is running, please inspect"

## What This Does

- Launches Brave (or Chrome) with `--remote-debugging-port=9222`
- Uses a separate profile to avoid affecting your main browser
- Enables Claude's MCP tools to connect and inspect

## Verification

The script will show:
```
Browser Debug Mode Active
Debug endpoint: http://localhost:9222
```

You can also verify manually:
```powershell
# Should return browser info JSON
Invoke-RestMethod -Uri "http://localhost:9222/json/version"
```

## Troubleshooting

### "Port already in use"
Another debug session is running. Either:
- Use that session (it's already ready)
- Close the other browser and retry
- Use a different port: `-Port 9223`

### "Browser not found"
The script auto-detects Brave and Chrome. If neither is found:
- Install Chrome or Brave
- Or manually specify the path

### "Cannot connect"
- Ensure the browser launched successfully
- Check that no firewall is blocking port 9222
- Try restarting the browser with the script

## Security Note

Remote debugging opens full browser control on port 9222.
- Only use on trusted networks
- Close the debug browser when done
- Don't browse sensitive sites while debugging
