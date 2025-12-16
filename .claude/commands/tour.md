# Intelligent Onboarding Agent - Code Tour

Interactive guided tour through a specific area of the codebase.

## Usage

`/tour` - List available tours
`/tour [area]` - Start a specific tour
`/tour:create [area]` - Create a new tour for an area

## Common Tour Areas

| Tour | What It Covers |
|------|---------------|
| `/tour auth` | Authentication & authorization flow |
| `/tour api` | API routes and endpoints |
| `/tour data` | Database models, schemas, data layer |
| `/tour ui` | UI components and state management |
| `/tour config` | Configuration and environment setup |
| `/tour tests` | Testing patterns and how to write tests |
| `/tour deploy` | Build, deploy, CI/CD pipeline |

## Instructions

### For `/tour` (List Tours)

Check for existing tours in `docs/onboarding/tours/`:

```markdown
## Available Code Tours

| Tour | Description | Stops | Time |
|------|-------------|-------|------|
| [name] | [description] | [X stops] | ~[Y min] |

Run `/tour [name]` to start a tour.

No tours yet? Run `/onboard` to generate them, or `/tour:create [area]` to create one.
```

### For `/tour [area]` (Run Tour)

#### Step 1: Load or Generate Tour

Check if `docs/onboarding/tours/[area].md` exists:
- If yes: Load the tour
- If no: Generate tour on-the-fly

#### Step 2: Present Tour Introduction

```markdown
# Code Tour: [Area Name]

## What You'll Learn
[Brief description of what this tour covers]

## Prerequisites
[Any knowledge needed before this tour]

## Estimated Time
~[X] minutes ([Y] stops)

---

Ready? Let's begin!
```

#### Step 3: Guide Through Each Stop

For each stop in the tour:

```markdown
## Stop [N] of [Total]: [Stop Title]

**File**: `path/to/file.ext`

[Read and display the relevant code section]

### What's Happening Here

[Explain this code in context:]
- What it does
- Why it's important
- How it connects to previous/next stops
- Key patterns or concepts to notice

### Things to Note
- [Important detail 1]
- [Important detail 2]

---

Continue to next stop? (or ask questions about this code)
```

#### Step 4: Tour Completion

```markdown
## Tour Complete!

### What We Covered
1. [Summary of stop 1]
2. [Summary of stop 2]
...

### Key Takeaways
- [Main concept 1]
- [Main concept 2]

### Related Tours
- `/tour [related1]` - [description]
- `/tour [related2]` - [description]

### Go Deeper
- `/explain [specific file]` for detailed explanation
- `/kg-query "how does [concept] work?"` for architectural queries
```

### For `/tour:create [area]` (Create New Tour)

#### Step 1: Analyze the Area

Search for files related to `[area]`:
- Use naming patterns (auth*, login*, session*, etc.)
- Check common locations
- Use Knowledge Graph if available

#### Step 2: Identify Tour Stops

Select 5-10 key files that tell the story:

```markdown
## Creating Tour: [Area]

I found [X] relevant files. Here's my proposed tour:

| Stop | File | Why |
|------|------|-----|
| 1 | [file] | Entry point for [area] |
| 2 | [file] | Core logic |
| ... | | |

Does this look right? I can adjust before generating.
```

#### Step 3: Generate Tour File

Create `docs/onboarding/tours/[area].md`:

```markdown
# Code Tour: [Area Name]

> Generated: 2025-12-15
> Stops: [N]
> Estimated time: [X] minutes

## Overview

[What this tour covers and why it matters]

## Prerequisites

- Familiarity with [concept]
- Understanding of [pattern]

---

## Stop 1: [Title]

**File**: `path/to/file.ext`
**Lines**: [start]-[end]
**Concept**: [main concept this stop teaches]

### The Code

```[language]
[relevant code snippet]
```

### Explanation

[Detailed explanation of what this code does]

### Key Points
- [Point 1]
- [Point 2]

### Connection
[How this connects to the next stop]

---

## Stop 2: [Title]
...

[Continue for all stops]

---

## Summary

### Flow Diagram
```
[ASCII or description of how components connect]
```

### Files in This Tour
| File | Role |
|------|------|
| [file] | [role] |

### Next Steps
- Try modifying [simple thing] to test understanding
- Read related tour: `/tour [related]`
```

#### Step 4: Confirm Creation

```markdown
## Tour Created!

Saved to: `docs/onboarding/tours/[area].md`

Run `/tour [area]` to take the tour.
```

## Tour Best Practices

### Good Tour Structure
1. **Start at entry point** - Where does execution begin?
2. **Follow the flow** - Trace data/control flow naturally
3. **End with output** - Show the result/effect
4. **5-10 stops max** - Keep tours focused
5. **Progressive complexity** - Start simple, build up

### Stop Selection Criteria
- Is this file essential to understanding the area?
- Does it introduce a new concept?
- Does it show a key pattern?
- Would someone need to modify this?

## Integration

- **Knowledge Graph**: Uses relationships for better tour flow
- **Learning Profile**: Adjusts explanation depth
- **Onboarding**: Tours are part of onboarding output
