# Intelligent Onboarding Agent - Code Explanation

Deep-dive explanation of specific files, functions, or concepts.

## Usage

`/explain [file]` - Explain a specific file
`/explain [file:function]` - Explain a specific function
`/explain [concept]` - Explain a project concept
`/explain:simple [target]` - ELI5 explanation
`/explain:deep [target]` - Expert-level deep dive

## Instructions

### Step 1: Identify What to Explain

Parse the input to determine:

| Input Type | Example | Action |
|------------|---------|--------|
| File path | `src/auth/login.ts` | Read and explain entire file |
| File:function | `src/auth/login.ts:validateUser` | Find and explain specific function |
| Concept | `authentication` | Search codebase for related files |
| Question | `"how does caching work"` | Research and explain |

### Step 2: Gather Context

For **file explanations**:
1. Read the file
2. Find imports/dependencies
3. Find files that import this file
4. Check for related tests
5. Check Knowledge Graph for relationships

For **concept explanations**:
1. Search for related files (grep, glob)
2. Check Knowledge Graph if available
3. Read CLAUDE.md for project context
4. Identify all relevant code

### Step 3: Structure the Explanation

#### For File Explanations

```markdown
# Explanation: [filename]

## Quick Summary
[1-2 sentence overview of what this file does]

## Purpose
[Why this file exists, what problem it solves]

## Location in Architecture
```
[Where this file sits in the project structure]
[What layer it belongs to]
[What it depends on / what depends on it]
```

---

## Code Walkthrough

### Imports & Dependencies
```[language]
[import statements]
```
[Explain what each import provides and why it's needed]

### Main Components

#### [Function/Class/Component 1]
```[language]
[code]
```

**What it does**: [explanation]

**Parameters**:
- `param1`: [purpose]
- `param2`: [purpose]

**Returns**: [what and why]

**Used by**: [list callers]

**Example usage**:
```[language]
[example]
```

#### [Function/Class/Component 2]
[Continue for each major piece]

---

## Data Flow

```
[Input] → [Processing] → [Output]
```

[Explain how data moves through this file]

---

## Key Patterns Used

| Pattern | Where | Why |
|---------|-------|-----|
| [pattern] | [location] | [reason] |

---

## Common Modifications

| Task | What to Change |
|------|---------------|
| Add new [X] | [instructions] |
| Modify [Y] | [instructions] |

---

## Related Files

| File | Relationship |
|------|-------------|
| [file] | [imports from / exports to / etc.] |

---

## Tests

Test file: `[test file path]`

Key test cases:
- [test 1]
- [test 2]

---

## Questions?

Ask follow-up questions like:
- "What happens if [scenario]?"
- "How does [function] handle [edge case]?"
- "Why is [pattern] used instead of [alternative]?"
```

#### For Function Explanations

```markdown
# Explanation: [function name]

**File**: `[path]`
**Lines**: [start]-[end]

## Signature
```[language]
[function signature]
```

## Purpose
[What this function does and why]

## Parameters

| Name | Type | Description | Required |
|------|------|-------------|----------|
| [param] | [type] | [description] | [yes/no] |

## Return Value
- **Type**: [type]
- **Description**: [what it returns]
- **Possible values**: [if enumerable]

## Logic Breakdown

```[language]
[code with inline comments explaining each section]
```

### Step-by-step:
1. [First thing it does]
2. [Second thing]
3. [etc.]

## Edge Cases Handled
- [edge case 1]: [how handled]
- [edge case 2]: [how handled]

## Error Handling
- [error condition]: [what happens]

## Example Usage
```[language]
// Basic usage
[example]

// With options
[example]

// Error case
[example]
```

## Called By
| File | Function | Context |
|------|----------|---------|
| [file] | [function] | [why it calls this] |

## Calls
| Function | Purpose |
|----------|---------|
| [function] | [why it's called] |

## Performance Notes
[Any performance considerations, complexity, etc.]

## Related Functions
- `[function]` - [relationship]
```

#### For Concept Explanations

```markdown
# Explanation: [Concept]

## What is [Concept]?
[Clear definition in context of this project]

## Why It Matters
[Why this concept is important here]

## How It Works in This Codebase

### Overview
[High-level explanation]

### Key Files
| File | Role in [Concept] |
|------|------------------|
| [file] | [role] |

### Implementation Details

#### [Aspect 1]
[Explanation with code examples]

#### [Aspect 2]
[Explanation with code examples]

## Flow Diagram
```
[ASCII diagram showing how concept flows through system]
```

## Common Operations

### How to [do thing 1]
```[language]
[code example]
```

### How to [do thing 2]
```[language]
[code example]
```

## Configuration
[If concept has configuration options]

## Gotchas / Common Mistakes
- [mistake 1]: [how to avoid]
- [mistake 2]: [how to avoid]

## Related Concepts
- [related 1]: [how related]
- [related 2]: [how related]

## Learn More
- `/tour [related-tour]`
- `/explain [related-file]`
```

### Step 4: Adapt to User Level

Check Learning Profile for user experience level:

| Level | Adaptation |
|-------|------------|
| Beginner | More context, simpler terms, more examples |
| Intermediate | Standard explanations, some assumptions |
| Expert | Dense, technical, focus on non-obvious aspects |

For `/explain:simple`:
- Use analogies
- Avoid jargon
- Step-by-step with small pieces
- More visual diagrams

For `/explain:deep`:
- Implementation details
- Performance characteristics
- Edge cases and gotchas
- Design decisions and trade-offs

## Integration

- **Knowledge Graph**: Uses relationships for context
- **Learning Profile**: Adapts explanation depth
- **Living Documentation**: Links to CLAUDE.md context
- **Code Tours**: Suggests relevant tours
