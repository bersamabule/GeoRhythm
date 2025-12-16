# Spec-to-Implementation Bridge - Drift Detection

Detect when implementation has drifted from specifications.

## Usage

`/spec-drift` - Check all specs for drift
`/spec-drift [spec-file]` - Check specific spec
`/spec-drift:strict` - Fail on any drift (for CI)
`/spec-drift:report` - Generate detailed drift report

## Instructions

### Step 1: Load Spec Registry

Check for existing registry at `docs/specs/registry.json`.
If not found, run `/spec-scan` first.

### Step 2: Analyze Each Spec Type

#### OpenAPI Drift Detection

Compare OpenAPI spec to implementation:

**Endpoint Drift**:
```markdown
| Check | How |
|-------|-----|
| Missing endpoints | Spec has route, code doesn't |
| Extra endpoints | Code has route not in spec |
| Method mismatch | Spec says GET, code uses POST |
| Path parameters | Spec has `{id}`, code expects different |
| Query parameters | Required params missing in implementation |
| Request body | Schema mismatch |
| Response schema | Response doesn't match spec |
| Status codes | Implementation returns codes not in spec |
```

**Schema Drift**:
```markdown
| Check | How |
|-------|-----|
| Missing properties | Spec has field, type doesn't |
| Extra properties | Type has field not in spec |
| Type mismatch | Spec says `string`, code uses `number` |
| Required fields | Spec requires, implementation optional |
| Enum values | Values don't match |
| Nested objects | Recursive check |
```

#### GraphQL Drift Detection

Compare GraphQL schema to resolvers:

```markdown
| Check | How |
|-------|-----|
| Missing resolvers | Schema has field, no resolver |
| Extra resolvers | Resolver for non-existent field |
| Argument mismatch | Schema args vs resolver params |
| Return type | Resolver returns wrong shape |
| Nullable mismatch | Schema says non-null, resolver can return null |
| Input types | Input type fields don't match |
```

#### Database Schema Drift Detection

Compare Prisma/TypeORM to actual database or migrations:

```markdown
| Check | How |
|-------|-----|
| Missing models | Schema has model, no table |
| Missing fields | Schema has field, column missing |
| Type mismatch | Schema says String, column is INT |
| Relations | Foreign keys don't match |
| Indexes | Schema index not in database |
| Migrations pending | Schema changed, no migration |
```

### Step 3: Categorize Drift Severity

| Severity | Criteria | Examples |
|----------|----------|----------|
| **CRITICAL** | Breaking changes, security issues | Missing auth, wrong types causing errors |
| **HIGH** | Functionality gaps | Missing endpoints, wrong response codes |
| **MEDIUM** | Partial implementation | Optional fields missing, extra fields |
| **LOW** | Minor inconsistencies | Documentation drift, naming differences |

### Step 4: Generate Drift Report

```markdown
# Spec Drift Report

> Generated: 2025-12-15
> Specs checked: [X]
> Total drift items: [Y]

## Summary

| Severity | Count |
|----------|-------|
| Critical | [X] |
| High | [Y] |
| Medium | [Z] |
| Low | [W] |

**Overall Status**: [PASS / WARN / FAIL]

---

## Critical Issues

### 1. Missing endpoint: `DELETE /users/{id}`

**Spec**: `api/openapi.yaml:145`
**Expected**: DELETE endpoint at `/users/{id}`
**Found**: No matching route

**Impact**: API consumers expect this endpoint to exist

**Fix**: Add delete handler in `src/routes/users.ts`

```typescript
// Suggested implementation
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  await userService.delete(id);
  res.status(204).send();
});
```

---

### 2. Schema mismatch: `User.email` type

**Spec**: `api/openapi.yaml:89`
**Expected**: `email: string (format: email)`
**Found**: `email: string | null` in `src/types/User.ts:12`

**Impact**: Null emails may cause validation failures

**Fix**: Update type or spec to match

---

## High Issues

### 3. Response code mismatch: `POST /users`

**Spec**: Returns `201 Created`
**Implementation**: Returns `200 OK`

**File**: `src/routes/users.ts:34`

**Fix**:
```typescript
// Change from
res.status(200).json(user);
// To
res.status(201).json(user);
```

---

## Medium Issues

### 4. Extra field in response: `User.internalId`

**Spec**: `User` schema has no `internalId` field
**Implementation**: Includes `internalId` in responses

**File**: `src/routes/users.ts:28`

**Impact**: Exposing internal data, potential security concern

**Fix**: Remove `internalId` from response or add to spec

---

## Low Issues

### 5. Parameter name difference

**Spec**: `userId` (camelCase)
**Implementation**: `user_id` (snake_case)

**Impact**: Minor, but inconsistent

---

## Drift Over Time

| Date | Critical | High | Medium | Low |
|------|----------|------|--------|-----|
| 2025-12-15 | 2 | 3 | 5 | 8 |
| 2025-12-08 | 1 | 2 | 4 | 6 |
| 2025-12-01 | 0 | 1 | 3 | 5 |

**Trend**: Drift increasing - consider implementing automated spec checks in CI

---

## Recommendations

1. **Set up CI check**: Add `/spec-drift:strict` to CI pipeline
2. **Generate types**: Use codegen to auto-generate types from spec
3. **Add validation**: Use spec-based request/response validation middleware
4. **Review process**: Require spec updates with implementation changes
```

### Step 5: Update Registry

Update `docs/specs/registry.json` with drift data:

```json
{
  "lastDriftCheck": "2025-12-15T10:30:00Z",
  "driftSummary": {
    "critical": 2,
    "high": 3,
    "medium": 5,
    "low": 8
  },
  "driftItems": [
    {
      "id": "drift-001",
      "severity": "critical",
      "type": "missing-endpoint",
      "spec": "api/openapi.yaml:145",
      "description": "Missing endpoint: DELETE /users/{id}",
      "suggestedFix": "Add delete handler in src/routes/users.ts"
    }
  ]
}
```

### Step 6: Output Results

```markdown
## Spec Drift Check

Checked [X] specs against implementation.

### Results

| Status | Spec | Drift Items |
|--------|------|-------------|
| FAIL | `api/openapi.yaml` | 2 critical, 3 high |
| PASS | `schema.graphql` | 0 issues |
| WARN | `prisma/schema.prisma` | 2 medium |

### Critical Issues (Fix Immediately)

1. **Missing endpoint**: `DELETE /users/{id}`
   - Spec: `api/openapi.yaml:145`
   - Fix: Add route in `src/routes/users.ts`

2. **Schema mismatch**: `User.email` allows null but spec requires string
   - Spec: `api/openapi.yaml:89`
   - Fix: Update `src/types/User.ts:12`

### Full Report

Saved to: `docs/specs/drift-report.md`

### Quick Fixes

Run `/spec-generate api/openapi.yaml` to regenerate types from spec.
```

## CI Integration

For `/spec-drift:strict`:

```markdown
## Spec Drift CI Check

Exit code: [0 = pass, 1 = fail]

### Results

- Critical issues: [X] (threshold: 0)
- High issues: [Y] (threshold: 0)

**Status**: FAILED

The following must be fixed before merge:

1. Missing endpoint: DELETE /users/{id}
2. Schema mismatch: User.email type

Run `/spec-drift` locally for full details.
```

## Integration

- **PR Reviewer**: Automatically runs drift check on PRs touching spec or implementation
- **Technical Debt Radar**: Drift items appear as debt
- **Knowledge Graph**: Uses spec-impl mappings
- **Chronicle**: Records drift check results
