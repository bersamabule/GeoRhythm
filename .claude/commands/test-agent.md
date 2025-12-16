# Test Agent (Token-Efficient)

Run tests using a sub-agent to preserve main session context.

## Instructions

**IMPORTANT**: This command uses a sub-agent to run tests, keeping the test output OUT of the main conversation context. This dramatically reduces token usage.

### Execution

Use the Task tool with the following configuration:

```
subagent_type: "general-purpose"
model: "haiku"
prompt: |
  You are a testing agent for the GeoRhythm project (Geometry Dash clone).

  ## Your Task
  Run the test suite and report results concisely.

  ## Commands
  - Full suite: `npm test -- --run`
  - With coverage: `npm run test:coverage`
  - Single file: `npm test -- --run [path]`
  - Watch mode: `npm test` (avoid in sub-agent)

  ## What to Report Back
  Return ONLY this information:

  1. **Status**: PASS or FAIL
  2. **Summary**: X passed, Y failed, Z skipped
  3. **Duration**: How long tests took
  4. **Failed Tests** (if any): List test names and brief error
  5. **Coverage** (if requested): Line/branch percentages

  ## Do NOT Include
  - Full test output
  - Passing test names
  - Stack traces (unless critical)
  - Verbose logs

  ## Example Response Format
  ```
  ✅ PASS | 138 passed | 0.6s
  Coverage: 78% lines, 72% branches
  ```

  Or if failing:
  ```
  ❌ FAIL | 136 passed, 2 failed | 0.8s

  Failed:
  - CubeMode.test.ts > should apply gravity > expected 9.8, got 0
  - AABB.test.ts > overlap detection > assertion failed
  ```
```

### Usage Examples

**Run all tests:**
```
/test-agent
```

**Run with coverage:**
```
/test-agent coverage
```

**Run specific file:**
```
/test-agent tests/unit/physics/CubeMode.test.ts
```

### Why This Saves Tokens

1. Sub-agent runs in isolated context
2. Only summary returned to main session
3. Full test output stays in sub-agent
4. Uses Haiku model (faster, cheaper)
5. Main conversation stays focused

### When to Use

- After making code changes
- Before committing
- When verifying fixes
- Routine test checks

### When NOT to Use

- Debugging test failures (need full output)
- Writing new tests (need to see patterns)
- First-time setup verification
