# Technical Debt Radar - Fix Guidance

Get specific refactoring guidance for a technical debt item.

## Usage

`/debt-fix [issue-description]` - Get fix guidance for specific issue
`/debt-fix [file:line]` - Fix issue at specific location
`/debt-fix:complexity [file]` - Fix complexity issues in file
`/debt-fix:duplication [pattern]` - Fix duplication pattern

## Instructions

### Step 1: Identify the Debt Item

Parse the input to understand:
- What type of debt (complexity, smell, TODO, etc.)
- Where it is (file, line number)
- Context (surrounding code)

### Step 2: Analyze the Problem

Read the problematic code and understand:
- Why it's considered debt
- What risks it poses
- Dependencies and impact
- Test coverage (if any)

### Step 3: Generate Fix Strategy

Based on debt type, provide specific guidance:

---

## Fix Strategies by Debt Type

### Long Function (>50 lines)

**Problem**: Function does too many things, hard to test/maintain.

**Strategy**: Extract Method Refactoring

```markdown
## Refactoring Plan: [function_name]

**Current State**: [X] lines, [Y] responsibilities

### Step 1: Identify Responsibilities
The function currently:
1. [responsibility 1] (lines X-Y)
2. [responsibility 2] (lines A-B)
3. [responsibility 3] (lines C-D)

### Step 2: Extract Helper Functions

```typescript
// Before
function processOrder(order) {
  // 80 lines doing everything
}

// After
function processOrder(order) {
  const validated = validateOrder(order);
  const priced = calculatePricing(validated);
  const saved = saveToDatabase(priced);
  return notifyCustomer(saved);
}

function validateOrder(order) { /* extracted */ }
function calculatePricing(order) { /* extracted */ }
function saveToDatabase(order) { /* extracted */ }
function notifyCustomer(order) { /* extracted */ }
```

### Step 3: Verify
- [ ] Original tests still pass
- [ ] New functions have tests
- [ ] No behavior change
```

---

### Deep Nesting (>4 levels)

**Problem**: Hard to read, error-prone, indicates complex logic.

**Strategy**: Guard Clauses + Early Returns

```markdown
## Refactoring Plan: Reduce Nesting

**Current State**: [X] levels of nesting

### Approach: Guard Clauses

```typescript
// Before (deeply nested)
function process(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        if (user.subscription) {
          // actual logic buried here
        }
      }
    }
  }
}

// After (flat with guards)
function process(user) {
  if (!user) return null;
  if (!user.isActive) return { error: 'inactive' };
  if (!user.hasPermission) return { error: 'forbidden' };
  if (!user.subscription) return { error: 'no subscription' };

  // actual logic at top level
}
```

### Benefits
- Each condition is clear
- Easy to add new conditions
- Main logic is prominent
```

---

### Empty Catch Block

**Problem**: Silently swallowing errors hides bugs.

**Strategy**: Add Proper Error Handling

```markdown
## Fix: Empty Catch Block

**Location**: [file:line]

### Options

**Option 1: Log the error**
```typescript
try {
  riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Still swallows, but at least logged
}
```

**Option 2: Re-throw with context**
```typescript
try {
  riskyOperation();
} catch (error) {
  throw new Error(`Failed to process: ${error.message}`);
}
```

**Option 3: Handle gracefully**
```typescript
try {
  riskyOperation();
} catch (error) {
  return { success: false, error: error.message };
}
```

**Option 4: Intentional ignore (document it)**
```typescript
try {
  optionalCleanup();
} catch {
  // Intentionally ignored: cleanup failure is non-critical
}
```
```

---

### Code Duplication

**Problem**: Same logic in multiple places, update one and forget others.

**Strategy**: Extract to Shared Function/Module

```markdown
## Fix: Duplication

**Pattern Found In**: [file1], [file2], [file3]
**Duplicated Lines**: ~[X] lines each

### Step 1: Create Shared Module

```typescript
// src/utils/validation.ts
export function validateUser(user: User): ValidationResult {
  // Extracted common logic
}
```

### Step 2: Replace All Occurrences

```typescript
// In file1.ts, file2.ts, file3.ts
import { validateUser } from '../utils/validation';

// Replace duplicated code with:
const result = validateUser(user);
```

### Step 3: Verify
- All call sites work correctly
- Tests pass
- No subtle differences lost
```

---

### Ancient TODO/FIXME

**Problem**: Forgotten technical debt, unclear if still relevant.

**Strategy**: Triage and Act

```markdown
## Fix: Old TODO

**Location**: [file:line]
**Age**: [X] months
**Content**: "[TODO text]"

### Triage Questions
1. Is this still relevant? (Check if code changed since)
2. Is it still a problem?
3. What was the original intent?

### Options

**Option 1: Fix it now**
[Specific guidance based on TODO content]

**Option 2: Create proper issue**
Convert to tracked issue with context:
- What needs to be done
- Why it matters
- Estimated effort

**Option 3: Remove if obsolete**
If the concern is no longer valid:
```typescript
// Remove the TODO, the issue was resolved by [commit/change]
```

**Option 4: Add expiration**
If deferring:
```typescript
// TODO(2025-Q1): Refactor when we upgrade to v2
```
```

---

### Test Gap

**Problem**: Critical code without test coverage.

**Strategy**: Add Targeted Tests

```markdown
## Fix: Missing Tests for [file]

**Current Coverage**: [X]%
**Risk Level**: [High/Medium/Low]

### Priority Test Cases

1. **Happy Path**
   ```typescript
   test('should [expected behavior] when [condition]', () => {
     // Test the main success scenario
   });
   ```

2. **Edge Cases**
   ```typescript
   test('should handle [edge case]', () => {
     // Test boundary conditions
   });
   ```

3. **Error Cases**
   ```typescript
   test('should throw when [invalid input]', () => {
     // Test error handling
   });
   ```

### Suggested Test File
Create `[filename].test.ts` with skeleton tests.
```

---

## Step 4: Offer to Apply Fix

After showing the fix strategy:

```markdown
## Ready to Apply?

I can help you implement this fix:

1. **Apply automatically** - I'll make the changes (with backup)
2. **Step by step** - Guide you through each change
3. **Just the plan** - Save this plan for later

Which would you prefer?
```

## Step 5: Verify After Fix

After applying:

1. Run tests (if available)
2. Check for regressions
3. Update debt scan
4. Mark item as resolved
