# AGENTS.md

> **Standard**: This file follows the [AGENTS.md](https://agents.md) open standard.
> It provides guidance for AI coding agents working on this project.

---

## Project Identity

**Name**: GeoRhythm
**Type**: [Web App / CLI Tool / Library / API / etc.]
**Stack**: [Primary technologies]

---

## Setup

### Prerequisites
```bash
# Required tools and versions
[tool] >= [version]
[runtime] >= [version]
```

### Installation
```bash
# Clone and install
git clone [REPO_URL]
cd GeoRhythm
[INSTALL_COMMAND]
```

### Environment
```bash
# Required environment variables
cp .env.example .env
# Edit .env with:
# - [VAR_1]: [description]
# - [VAR_2]: [description]
```

---

## Build & Run

### Development
```bash
[DEV_COMMAND]
# Runs on: http://localhost:[PORT]
```

### Production Build
```bash
[BUILD_COMMAND]
```

### Start Production
```bash
[START_COMMAND]
```

---

## Testing

### Run All Tests
```bash
[TEST_COMMAND]
```

### Run Specific Tests
```bash
# Single file
[TEST_SINGLE_COMMAND] path/to/test.ts

# By pattern
[TEST_PATTERN_COMMAND] "pattern"

# Watch mode
[TEST_WATCH_COMMAND]
```

### Test Coverage
```bash
[COVERAGE_COMMAND]
# Coverage report: [output location]
```

### Testing Conventions
- Test files: `*.test.ts` or `*.spec.ts`
- Location: Adjacent to source files OR in `__tests__/` directories
- Naming: `describe('[ComponentName]', () => { ... })`

---

## Code Style

### Formatting
```bash
# Format code
[FORMAT_COMMAND]

# Check formatting
[FORMAT_CHECK_COMMAND]
```

### Linting
```bash
# Lint code
[LINT_COMMAND]

# Auto-fix
[LINT_FIX_COMMAND]
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files (components) | PascalCase | `UserProfile.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |
| Variables | camelCase | `userName` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `UserProfile` |
| Functions | camelCase | `getUserById` |
| React Components | PascalCase | `UserProfile` |
| CSS Classes | kebab-case | `user-profile` |

### Code Patterns

**Prefer:**
- [Pattern 1 - e.g., "Functional components over class components"]
- [Pattern 2 - e.g., "Async/await over .then() chains"]
- [Pattern 3 - e.g., "Named exports over default exports"]

**Avoid:**
- [Anti-pattern 1 - e.g., "Nested ternaries"]
- [Anti-pattern 2 - e.g., "Magic numbers without constants"]
- [Anti-pattern 3 - e.g., "Any type in TypeScript"]

---

## Project Structure

```
[PROJECT_ROOT]/
├── src/
│   ├── components/    # [Description]
│   ├── hooks/         # [Description]
│   ├── utils/         # [Description]
│   ├── types/         # [Description]
│   ├── services/      # [Description]
│   └── index.ts       # [Description]
├── tests/             # [Description]
├── docs/
│   ├── adr/           # Architecture Decision Records
│   └── chronicle/     # Development session logs
├── scripts/           # [Description]
└── config/            # [Description]
```

### Key Files
| File | Purpose |
|------|---------|
| `[path]` | [Main entry point] |
| `[path]` | [Configuration] |
| `[path]` | [Database schema] |
| `[path]` | [API routes] |

---

## Git Workflow

### Commit Messages
Format: `type(scope): description`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Code restructuring
- `test` - Adding/updating tests
- `chore` - Maintenance tasks

**Examples:**
```
feat(auth): add OAuth2 login flow
fix(api): handle null response from user endpoint
docs(readme): update installation instructions
```

### Branches
- `main` - Production-ready code
- `develop` - Integration branch (if used)
- `feature/[name]` - New features
- `fix/[name]` - Bug fixes
- `refactor/[name]` - Code improvements

### Pull Requests
- Title: Same format as commit messages
- Description: Include what, why, and how to test
- Reviews: Required before merge
- Tests: Must pass before merge

---

## Boundaries

### NEVER Do These
- [ ] Commit secrets, API keys, or credentials
- [ ] Modify files in `[protected_directory]/`
- [ ] Push directly to `main` branch
- [ ] Delete or modify migration files
- [ ] Change database schema without migration
- [ ] Disable tests to make them pass
- [ ] Use `any` type without explicit approval
- [ ] [Add project-specific prohibitions]

### Always Ask Before
- [ ] Adding new dependencies
- [ ] Changing authentication/authorization logic
- [ ] Modifying database schema
- [ ] Changing API contracts
- [ ] Removing features or endpoints
- [ ] Major refactoring across multiple files

### Security Notes
- [Security consideration 1]
- [Security consideration 2]
- [Security consideration 3]

---

## Common Tasks

### Add a New Feature
1. Create feature branch from `main`
2. Implement feature in `src/[location]`
3. Add tests in `[test_location]`
4. Update documentation if needed
5. Create PR with description

### Fix a Bug
1. Create fix branch from `main`
2. Write failing test that reproduces bug
3. Fix the bug
4. Verify test passes
5. Create PR with bug description

### Add a New Dependency
```bash
# Production dependency
[ADD_DEP_COMMAND] [package-name]

# Development dependency
[ADD_DEV_DEP_COMMAND] [package-name]
```
**Note**: Justify new dependencies in PR description.

### Database Changes
```bash
# Create migration
[MIGRATION_CREATE_COMMAND] [name]

# Run migrations
[MIGRATION_RUN_COMMAND]

# Rollback
[MIGRATION_ROLLBACK_COMMAND]
```

---

## Troubleshooting

### Common Issues

**Issue**: [Common problem 1]
**Solution**: [How to fix it]

**Issue**: [Common problem 2]
**Solution**: [How to fix it]

### Debug Mode
```bash
# Enable debug logging
[DEBUG_COMMAND]
```

### Reset Environment
```bash
# Full reset
[RESET_COMMANDS]
```

---

## Resources

### Documentation
- [Internal docs link]
- [API documentation link]

### External References
- [Framework docs]
- [Library docs]

### Team Contacts
- [Role]: [Contact method]

---

*This file follows the AGENTS.md standard. For more information: https://agents.md*
