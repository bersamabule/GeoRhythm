# Codebase Knowledge Graph - Query

Query the codebase knowledge graph to understand relationships and architecture.

## Usage

`/kg-query [natural language question]`

## Example Queries

### Dependency Questions
- "What depends on UserModel?"
- "What would break if I change the auth service?"
- "Show all files that import from utils/"
- "What external packages does the payment module use?"

### Architecture Questions
- "What is the overall architecture?"
- "Show me the layers of this application"
- "What patterns are used in this codebase?"
- "How does data flow from API to database?"

### Discovery Questions
- "What touches user authentication?"
- "Show me all API endpoints"
- "Where is payment logic handled?"
- "What files handle error handling?"

### Impact Analysis
- "If I change src/models/user.ts, what else needs updating?"
- "What's the blast radius of modifying the config?"
- "Show dependency chain from routes to database"

## Instructions

### Step 1: Load Knowledge Graph

Read the graph from `docs/knowledge-graph/graph.json`

If graph doesn't exist:
- Inform user: "Knowledge graph not built yet. Run /kg-build first."
- Offer to build it now

If graph is stale (>7 days old):
- Warn: "Knowledge graph is [X] days old. Consider running /kg-build to refresh."

### Step 2: Parse Query Intent

Identify query type:

| Intent | Keywords | Action |
|--------|----------|--------|
| Dependencies | "depends on", "imports", "uses" | Query edges.imports |
| Dependents | "what uses", "would break", "affected" | Query reverse edges |
| Architecture | "architecture", "layers", "patterns" | Return patterns summary |
| Discovery | "where is", "show me", "find" | Search nodes by tags/purpose |
| Impact | "blast radius", "if I change", "impact" | Traverse dependency tree |
| Endpoints | "API", "endpoints", "routes" | Filter files by type=route |

### Step 3: Execute Query

#### For Dependency Queries
```
Input: "What depends on UserModel?"

1. Find node: UserModel in nodes.classes
2. Find edges where: edge.to === "UserModel"
3. Return list of dependents with context
```

#### For Impact Analysis
```
Input: "If I change src/models/user.ts, what needs updating?"

1. Find node: src/models/user.ts
2. Get all direct dependents (files that import this)
3. Recursively get their dependents (transitive)
4. Score by distance (direct = high impact, transitive = lower)
5. Return sorted impact report
```

#### For Architecture Queries
```
Input: "What is the architecture?"

1. Return patterns.architecture
2. List patterns.detected
3. Show layer diagram from project.layers
4. Summarize domain modules
```

### Step 4: Format Response

#### Dependency Response
```markdown
## Dependencies of UserModel

### Direct Dependents (5 files)
| File | Relationship | Usage |
|------|--------------|-------|
| src/services/users.ts | imports | CRUD operations |
| src/services/auth.ts | imports | Token validation |
| src/routes/users.ts | imports | Route handlers |

### Transitive Dependents (8 more files)
[Files that depend on the direct dependents]

### External Usage
- Used by 3 API endpoints
- Part of auth domain
```

#### Impact Analysis Response
```markdown
## Impact Analysis: src/models/user.ts

### Blast Radius: MEDIUM (13 files affected)

### Direct Impact (5 files) - Must Review
| File | Risk | Notes |
|------|------|-------|
| src/services/users.ts | HIGH | Core user operations |
| src/services/auth.ts | HIGH | Auth depends on User type |

### Indirect Impact (8 files) - May Need Review
| File | Distance | Path |
|------|----------|------|
| src/routes/users.ts | 2 | via users.service |

### Recommended Review Order
1. src/services/users.ts
2. src/services/auth.ts
3. [remaining files...]
```

#### Architecture Response
```markdown
## Codebase Architecture

### Pattern: Layered MVC with Service Layer

```
┌─────────────────────────────────────┐
│           Routes (API Layer)         │
├─────────────────────────────────────┤
│         Controllers (optional)       │
├─────────────────────────────────────┤
│        Services (Business Logic)     │
├─────────────────────────────────────┤
│     Models / Repositories (Data)     │
└─────────────────────────────────────┘
```

### Detected Patterns
- Service Layer: Business logic isolated in services/
- Repository Pattern: Data access abstracted
- Middleware Chain: Auth, logging, error handling

### Domain Modules
| Domain | Files | Description |
|--------|-------|-------------|
| auth | 5 | Authentication & authorization |
| users | 4 | User management |
| payments | 6 | Payment processing |
```

### Step 5: Offer Follow-up

After answering, offer relevant follow-ups:
- "Would you like to see the full dependency tree?"
- "Should I analyze the impact of a specific change?"
- "Want me to explain any of these relationships?"

## No Graph Fallback

If no knowledge graph exists, offer to:
1. Build one with `/kg-build`
2. Do a quick ad-hoc search using Grep/Glob
3. Explain what the knowledge graph would provide
