# Codebase Knowledge Graph - Build/Rebuild

Build or rebuild the semantic knowledge graph of the entire codebase.

## What This Does

Scans the codebase and creates a queryable knowledge graph containing:
- File purposes and relationships
- Functions, classes, and their connections
- Import/export dependencies
- Data flow patterns
- Architectural layers and boundaries

## Instructions

### Step 1: Identify Codebase Structure

1. **Detect project type** from package.json, Cargo.toml, go.mod, etc.
2. **Find source directories** (src/, lib/, app/, etc.)
3. **Identify entry points** (main files, index files, app entry)
4. **Note configuration files** that define structure

### Step 2: Scan and Analyze

For each source file, extract:

#### File-Level Metadata
```json
{
  "path": "src/services/auth.ts",
  "type": "service",
  "purpose": "Handles user authentication and session management",
  "layer": "business-logic",
  "imports": ["../models/user", "../utils/crypto", "jsonwebtoken"],
  "exports": ["login", "logout", "validateToken", "AuthService"]
}
```

#### Function/Class Analysis
```json
{
  "name": "validateToken",
  "type": "function",
  "file": "src/services/auth.ts",
  "visibility": "exported",
  "params": ["token: string"],
  "returns": "Promise<User | null>",
  "calls": ["jwt.verify", "UserModel.findById"],
  "calledBy": ["authMiddleware", "refreshToken"],
  "sideEffects": ["database-read"],
  "tags": ["auth", "security", "validation"]
}
```

#### Dependency Mapping
```json
{
  "module": "src/services/auth",
  "dependsOn": [
    {"module": "src/models/user", "type": "internal"},
    {"module": "jsonwebtoken", "type": "external"},
    {"module": "src/config", "type": "internal"}
  ],
  "dependedOnBy": [
    {"module": "src/routes/auth", "type": "internal"},
    {"module": "src/middleware/auth", "type": "internal"}
  ]
}
```

### Step 3: Detect Patterns

Identify architectural patterns:

| Pattern | Detection Method |
|---------|------------------|
| MVC | controllers/, models/, views/ directories |
| Service Layer | services/ directory with business logic |
| Repository | repositories/ or data access layer |
| API Routes | routes/, api/, endpoints/ directories |
| Middleware | middleware/ directory or *Middleware naming |
| Utils/Helpers | utils/, helpers/, lib/ directories |
| Config | config/, .env files, settings |
| Tests | tests/, __tests__, *.test.*, *.spec.* |

### Step 4: Build Relationship Graph

Create edges between nodes:

```
[File] --imports--> [File]
[File] --exports--> [Function/Class]
[Function] --calls--> [Function]
[Function] --uses--> [External Package]
[Class] --extends--> [Class]
[Class] --implements--> [Interface]
[Route] --handles--> [Controller]
[Controller] --uses--> [Service]
[Service] --queries--> [Model/Repository]
```

### Step 5: Save Knowledge Graph

Save to `docs/knowledge-graph/graph.json`:

```json
{
  "version": "1.0",
  "generated": "2025-12-15T10:00:00Z",
  "project": {
    "name": "my-project",
    "type": "node-typescript",
    "entryPoints": ["src/index.ts"],
    "layers": ["routes", "controllers", "services", "models"]
  },
  "nodes": {
    "files": [...],
    "functions": [...],
    "classes": [...],
    "interfaces": [...],
    "types": [...]
  },
  "edges": {
    "imports": [...],
    "calls": [...],
    "extends": [...],
    "implements": [...]
  },
  "patterns": {
    "architecture": "layered-mvc",
    "detected": ["service-layer", "repository-pattern", "middleware-chain"]
  },
  "domains": {
    "auth": ["src/services/auth.ts", "src/routes/auth.ts", "src/middleware/auth.ts"],
    "users": ["src/services/users.ts", "src/routes/users.ts", "src/models/user.ts"],
    "payments": ["src/services/payments.ts", "src/routes/payments.ts"]
  }
}
```

### Step 6: Generate Summary

Create `docs/knowledge-graph/README.md`:

```markdown
# Codebase Knowledge Graph

**Generated**: [timestamp]
**Files Indexed**: [count]
**Functions/Methods**: [count]
**Classes/Interfaces**: [count]

## Architecture Overview

[Detected architectural pattern and layer diagram]

## Domain Modules

| Domain | Files | Purpose |
|--------|-------|---------|
| auth | 5 | User authentication and sessions |
| users | 4 | User management CRUD |
| payments | 6 | Payment processing |

## Key Entry Points

- `src/index.ts` - Application bootstrap
- `src/routes/index.ts` - API route registration

## Dependency Hotspots

Files with most dependents (changes here affect many):
1. `src/models/user.ts` (12 dependents)
2. `src/utils/logger.ts` (8 dependents)
3. `src/config/index.ts` (7 dependents)

## Query This Graph

Use `/kg-query [question]` to ask questions like:
- "What touches the payment system?"
- "What would break if I change UserModel?"
- "Show me all API endpoints"
```

## Output

After building, report:
- Total files indexed
- Functions/classes discovered
- Patterns detected
- Domains identified
- Time taken

## Rebuild Triggers

Consider rebuilding when:
- Major refactoring completed
- New modules added
- Significant time since last build
- Graph queries returning stale results
