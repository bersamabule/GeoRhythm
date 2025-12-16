# Spec-to-Implementation Bridge - Spec Validator

Validate specification files for correctness and best practices.

## Usage

`/spec-validate [spec-file]` - Validate a specific spec
`/spec-validate` - Validate all specs in project
`/spec-validate:strict` - Strict validation (for CI)

## Instructions

### Step 1: Detect Spec Type

Identify spec type from file extension and content.

### Step 2: Validate by Spec Type

#### OpenAPI Validation

**Structural Checks**:

| Check | Description |
|-------|-------------|
| Valid YAML/JSON | File parses correctly |
| OpenAPI version | Valid `openapi` field (3.0.x, 3.1.x) |
| Info object | Required `title`, `version` |
| Paths | At least one path defined |
| Operations | Valid HTTP methods |
| Responses | At least one response per operation |
| $ref resolution | All references resolve |

**Best Practice Checks**:

| Check | Severity | Description |
|-------|----------|-------------|
| Operation IDs | Medium | Every operation should have `operationId` |
| Descriptions | Low | Endpoints should have descriptions |
| Examples | Low | Request/response examples recommended |
| Tags | Low | Operations should be tagged |
| Security | High | Security schemes defined for protected endpoints |
| Error responses | Medium | 4xx/5xx responses defined |
| Pagination | Medium | List endpoints should support pagination |

**Schema Checks**:

| Check | Description |
|-------|-------------|
| Type defined | Every schema has `type` |
| Required fields | Required array matches properties |
| Enum values | Enums have at least 2 values |
| Format valid | String formats are valid (email, uuid, etc.) |
| Nested refs | Circular references detected |

#### GraphQL Validation

**Structural Checks**:

| Check | Description |
|-------|-------------|
| Valid syntax | Schema parses correctly |
| Query type | Root `Query` type exists |
| Type definitions | All referenced types defined |
| Field types | All fields have valid types |
| Directives | Used directives are defined |

**Best Practice Checks**:

| Check | Severity | Description |
|-------|----------|-------------|
| Descriptions | Low | Types and fields should have descriptions |
| Naming | Low | PascalCase types, camelCase fields |
| Nullable | Medium | Consider null handling explicitly |
| Pagination | Medium | Use connections for lists |
| Input types | Medium | Mutations use input types |
| N+1 risk | High | Detect potential N+1 patterns |

#### Prisma Validation

**Structural Checks**:

| Check | Description |
|-------|-------------|
| Valid syntax | Schema parses |
| Datasource | Database connection defined |
| Generator | At least one generator |
| Models | At least one model |
| Relations | All relations have inverse |

**Best Practice Checks**:

| Check | Severity | Description |
|-------|----------|-------------|
| ID fields | High | Every model has `@id` |
| Timestamps | Medium | Consider `createdAt`/`updatedAt` |
| Indexes | Medium | Foreign keys should be indexed |
| Naming | Low | PascalCase models, camelCase fields |
| Soft delete | Low | Consider soft delete pattern |

#### JSON Schema Validation

| Check | Description |
|-------|-------------|
| Valid JSON | File parses |
| $schema | Schema version declared |
| Type | Root type defined |
| Required | Required matches properties |
| Refs | All $ref resolve |

### Step 3: Run External Validators (if available)

| Spec Type | Validator Tool |
|-----------|----------------|
| OpenAPI | `spectral`, `swagger-cli validate`, `openapi-generator validate` |
| GraphQL | `graphql-schema-linter`, `graphql validate` |
| Prisma | `prisma validate`, `prisma format` |
| JSON Schema | `ajv validate` |

### Step 4: Generate Report

```markdown
# Spec Validation Report

> Generated: 2025-12-15
> Spec: `api/openapi.yaml`
> Type: OpenAPI 3.0.3

## Summary

| Category | Pass | Warn | Fail |
|----------|------|------|------|
| Structure | 12 | 0 | 0 |
| Best Practices | 8 | 3 | 1 |
| Security | 4 | 1 | 0 |
| **Total** | 24 | 4 | 1 |

**Status**: WARN (1 error, 4 warnings)

---

## Errors

### 1. Missing security definition for `DELETE /users/{id}`

**Location**: `paths./users/{id}.delete`
**Rule**: security-defined
**Severity**: Error

Protected endpoints must define security requirements.

**Fix**:
```yaml
delete:
  security:
    - bearerAuth: []
```

---

## Warnings

### 2. Missing operation description

**Location**: `paths./users.get`
**Rule**: operation-description
**Severity**: Warning

Operations should have descriptions for documentation.

**Fix**:
```yaml
get:
  description: List all users with optional pagination
```

### 3. Missing example for `User` schema

**Location**: `components.schemas.User`
**Rule**: schema-example
**Severity**: Warning

Schemas should include examples.

### 4. No error response defined for `POST /users`

**Location**: `paths./users.post.responses`
**Rule**: error-responses
**Severity**: Warning

Define 4xx responses for validation errors.

---

## Passed Checks

- Valid OpenAPI 3.0.3 syntax
- All $ref references resolve
- All operations have operationId
- All schemas have types defined
- Security schemes properly defined
- Request bodies have content types
- [... 18 more]

---

## Recommendations

1. Add descriptions to all endpoints
2. Include request/response examples
3. Define error responses (400, 401, 403, 404, 500)
4. Add security to all protected endpoints
```

### Step 5: Output Results

```markdown
## Spec Validation Results

**Spec**: `api/openapi.yaml`
**Type**: OpenAPI 3.0.3
**Status**: WARN

### Issues Found

| Severity | Count |
|----------|-------|
| Errors | 1 |
| Warnings | 4 |
| Info | 2 |

### Errors (Must Fix)

1. **Missing security**: `DELETE /users/{id}` has no security defined
   - Location: `paths./users/{id}.delete`
   - Fix: Add `security: [bearerAuth: []]`

### Warnings (Should Fix)

1. Missing description: `GET /users`
2. Missing example: `User` schema
3. No error responses: `POST /users`
4. Pagination not defined: `GET /users`

### Full Report

Saved to: `docs/specs/validation-report.md`

### Auto-Fix Available

Run `/spec-validate --fix` to automatically fix:
- Add missing descriptions (templates)
- Add common error responses
- Format spec file
```

## CI Mode (`/spec-validate:strict`)

```markdown
## Spec Validation (CI)

Exit code: 1 (FAILED)

### Blocking Issues

1. ERROR: Missing security on DELETE /users/{id}

### Configuration

Strict mode fails on:
- Any errors
- Security warnings
- Missing operationId

To configure, add to `docs/specs/validation-config.json`:
```json
{
  "failOn": ["error", "security-warning"],
  "ignore": ["missing-description"]
}
```
```

## Integration

- **PR Reviewer**: Validates specs in PRs
- **Test & Check**: Includes spec validation
- **Technical Debt Radar**: Validation warnings as debt
- **Chronicle**: Records validation results
