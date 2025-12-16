# CLAUDE.md - Living Documentation Context

> **Purpose**: This file provides persistent context for Claude across sessions.
> Claude reads this automatically at the start of each conversation.
> Keep this file updated to maintain continuity.

---

## Project Overview

**Project Name**: GeoRhythm
**Repository**: https://github.com/bersamabule/GeoRhythm
**Primary Language**: TypeScript
**Last Updated**: 2025-12-16

### Description
A high-fidelity, web-based clone of Geometry Dash - a rhythm-based platformer where players control a cube (and other shapes) that automatically moves forward while the player's only input is jumping. Obstacles are synchronized to music, and one hit means death and restart.

**Reference**: [Stereo Madness Gameplay](https://youtu.be/jPqVXbKNoLk)

### Current Status
- **Phase**: Development (Phase 1 - Grey Box Engine Complete)
- **Version**: 0.1.0
- **Health**: Active Development

---

## Quick Reference

### Build & Run
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Generate types from schemas
npm run generate:types

# Validate schemas
npm run validate:specs
```

### Key Entry Points
| Purpose | File |
|---------|------|
| Main entry | `src/main.ts` |
| Game config | `src/config/game.config.ts` |
| Game scene | `src/engine/scenes/GameScene.ts` |
| Cube physics | `src/core/physics/modes/CubeMode.ts` |
| AABB collision | `src/core/collision/AABB.ts` |
| Player object | `src/engine/objects/Player.ts` |

### JSON Schemas (Spec-to-Implementation Bridge)
| Schema | Purpose |
|--------|---------|
| `specs/level-format.schema.json` | Level file structure |
| `specs/player-state.schema.json` | Checkpoints & replays |
| `specs/game-config.schema.json` | Runtime configuration |
| `specs/save-data.schema.json` | Persistent storage |

---

## Testing Configuration

### Test Framework
- **Framework**: Vitest
- **Location**: `tests/` directory
- **Coverage Tool**: Vitest built-in (v8)

### Test Commands
```bash
# Run all tests
npm test

# Run single file
npm test -- tests/unit/physics/CubeMode.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### Coverage Thresholds
- **Minimum**: 70%
- **Target**: 80%
- **Critical Paths** (physics, collision): 90%

### Testing Conventions
- Test file naming: `*.test.ts`
- Test organization: Mirror `src/` structure in `tests/`
- Physics tests must be deterministic

---

## Architecture Summary

### Tech Stack
| Layer | Technology |
|-------|------------|
| Language | TypeScript (Strict) |
| Engine | Phaser 3.70+ |
| Build | Vite |
| State | XState v5 |
| Audio | Howler.js |
| Testing | Vitest |

### Core Design Principles
1. **Music-First Loop**: Player position derived from audio time, not frame deltas
2. **Custom Physics**: Deterministic kinematic physics (not physics engine)
3. **Schema-First**: JSON schemas define data structures; types are generated
4. **Strategy Pattern**: Game modes (Cube/Ship/Ball) are swappable strategies

### Directory Structure
```
GeoRhythm/
├── CLAUDE.md              # This file
├── specs/                 # JSON Schemas (source of truth)
│   ├── level-format.schema.json
│   ├── player-state.schema.json
│   ├── game-config.schema.json
│   └── save-data.schema.json
├── src/
│   ├── core/              # Pure logic (no Phaser deps)
│   │   ├── physics/       # Physics engines per mode
│   │   ├── collision/     # AABB collision
│   │   └── state/         # XState machines
│   ├── engine/            # Phaser-specific code
│   │   ├── scenes/        # Game scenes
│   │   ├── objects/       # Game objects
│   │   └── systems/       # Object pool, camera
│   ├── services/          # Application services
│   ├── ui/                # UI components
│   ├── generated/         # Auto-generated from schemas
│   └── main.ts            # Entry point
├── public/
│   ├── assets/            # Sprites, audio, fonts
│   └── levels/            # Level JSON files
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
└── docs/
    ├── specs/             # Game specification
    ├── adr/               # Architecture decisions
    ├── chronicle/         # Session history
    └── onboarding/tours/  # Code tours
```

### Key Patterns
- **Strategy Pattern**: `IPlayerMode` interface for Cube/Ship/Ball physics
- **Object Pooling**: Recycle sprites for performance
- **Event Bus**: Decouple systems via events
- **State Machine**: XState for game states (menu, playing, dead, etc.)

---

## Code Conventions

### Style Guide
- **Formatting**: Prettier + ESLint
- **Naming**:
  - Files: `PascalCase.ts` for classes, `camelCase.ts` for utils
  - Classes/Interfaces: `PascalCase`
  - Functions/Variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
- **Comments**: JSDoc for public APIs, inline for complex logic

### Commit Messages
Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(physics): implement ship mode thrust`
- `fix(collision): correct spike hitbox size`
- `test(physics): add cube jump tests`

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes

---

## Current State

### Active Work
- [x] Phase 1: Project setup (Phaser + TypeScript + Vite)
- [x] Phase 1: Generate types from JSON schemas
- [x] Phase 1: Basic game loop (music-first)
- [x] Phase 1: Cube physics (gravity, jump)
- [x] Phase 1: AABB collision detection
- [x] Phase 1: Test level with obstacles
- [x] Phase 1: Unit tests (59 passing)
- [x] Phase 2: Level loader from JSON files (89 tests passing)
- [x] Phase 2: Object pooling system (96 tests passing)
- [x] Phase 3: Audio sync with Howler.js (96 tests passing)
- [x] Phase 3: Death effects and screen shake
- [x] Phase 4: ShipMode physics (thrust-based flight) - 138 tests passing
- [x] Phase 4: BallMode physics (gravity flip)
- [x] Phase 4: Mode portals (mode, gravity, speed)
- [x] Phase 4: Portal pooling and collision detection
- [ ] Phase 4: Practice mode with checkpoints

### Recent Changes
| Date | Change | Chronicle Entry |
|------|--------|-----------------|
| 2025-12-15 | Project initialized with Living Docs | docs/chronicle/2025-12-15-project-initialization.md |
| 2025-12-15 | Game specification created | docs/specs/GAME_SPECIFICATION.md |
| 2025-12-15 | Phase 1 Grey Box Engine complete | - |
| 2025-12-16 | LevelLoader service with manifest support | ADR-0001 (static deployment) |
| 2025-12-16 | ObjectPool system for sprite recycling | - |
| 2025-12-16 | AudioManager with Howler.js integration | - |
| 2025-12-16 | ShipMode & BallMode physics implemented | - |
| 2025-12-16 | Portal system (mode/gravity/speed) | - |

### Known Issues
| Issue | Severity | Notes |
|-------|----------|-------|
| No audio files yet | Low | Audio loads gracefully fails; needs actual audio files |
| Visual placeholder | Low | Using rectangles instead of sprites |

---

## Important Decisions

### Key ADRs
| ADR | Title | Status |
|-----|-------|--------|
| ADR-0001 | Static deployment architecture | **Accepted** |
| ADR-0002 | Use Phaser 3 as game engine | Proposed |
| ADR-0003 | Music-first game loop | Proposed |
| ADR-0004 | Custom kinematic physics | Proposed |
| ADR-0005 | Object pooling strategy | Proposed |

### Constraints
- Must run at 60 FPS on mid-range devices
- Must work on desktop and mobile browsers
- Physics must be deterministic (same input = same result)
- Audio sync must be within 10ms tolerance

---

## Development Phases

| Phase | Goal | Status |
|-------|------|--------|
| 1 | Grey Box Engine (cube + collisions) | **Complete** |
| 2 | Level Loader (JSON parsing, pooling) | **Complete** |
| 3 | Polish (audio, death, practice mode) | **In Progress** |
| 4 | Game Modes (ship, ball, portals) | **Complete** |
| 5 | UI & Menus | Not Started |
| 6 | Persistence (saves, progress) | Not Started |
| 7 | Level Editor (optional) | Not Started |

---

## Session Continuity

### For Next Session
> **Where I left off**: Phase 4 Game Modes is complete! All three physics modes (cube, ship, ball) implemented with mode portal transitions. 138 tests passing.
>
> **What's working**:
> - Phaser + TypeScript + Vite project setup
> - TypeScript types generated from JSON schemas
> - **Three physics modes** (Strategy Pattern):
>   - **CubeMode**: gravity, jump, coyote time, jump buffering
>   - **ShipMode**: thrust-based flight (hold to rise, release to fall)
>   - **BallMode**: gravity flip on tap (rolls on floor/ceiling)
> - AABB collision detection with proper resolution
> - **LevelLoader service** with manifest support (`getManifest()`, `loadLevel(id)`)
> - **ObjectPool system** for efficient sprite recycling (`acquireBlock`, `acquireSpike`, `acquirePortal`, `releaseAll`)
> - **Portal system**: mode portals, gravity portals, speed portals
> - **AudioManager** with Howler.js for music-first game loop
> - Test level JSON file with mode portal demo at `public/levels/test-level.json`
> - Player visual updates when changing modes (cube/ship/ball icons)
> - Progress bar and attempt counter
> - Pause menu with Escape (pauses audio)
> - Death effects: screen flash, camera shake, particles
>
> **Next steps** (Phase 3 remaining / Phase 5):
> 1. Practice mode with checkpoints
> 2. Jump pads and jump orbs (interactive objects)
> 3. UI & Menus
>
> **Watch out for**:
> - Physics code is in `src/core/physics/modes/` - keep it framework-agnostic
> - Player mode switching via `player.setMode('ship')` triggers visual updates
> - Portal triggers are reset on level restart via `objectPool.resetPortalTriggers()`
> - Use `npm run generate:types` if schemas change
> - Run `npm test` to verify changes don't break physics (138 tests)
> - ObjectPool pre-creates 150 blocks, 75 spikes, and 20 portals by default

### Chronicle Index
See `docs/chronicle/` for session history.

---

## Claude-Specific Instructions

### Preferred Behaviors
- Always run tests after code changes
- Generate types from schemas, don't write them manually
- Follow existing patterns in codebase
- Keep physics code in `core/` without Phaser dependencies
- Use Knowledge Graph for impact analysis

### Verification Requirements
- Run tests after changes (`npm test`)
- Check coverage maintained (`npm run test:coverage`)
- Lint before committing (`npm run lint`)
- Validate schemas (`npm run validate:specs`)
- No debug statements in delivered code

### Boundaries (DO NOT)
- Never use a physics engine (Matter.js, Box2D) - we need custom deterministic physics
- Never derive position from frame deltas - use audio time
- Never modify schemas without regenerating types
- Never commit code that fails tests

### Slash Commands
- `/status` - Project status
- `/chronicle` - Create session entry
- `/adr` - Create architecture decision
- `/handoff` - Prepare handoff
- `/inspect` - Capture app context
- `/verify` - Run verification suite
- `/test` - Run tests
- `/test-agent` - **Run tests via sub-agent (saves tokens!)**
- `/deps` - Dependency health
- `/review` - Code review
- `/spec-scan` - Find specs
- `/spec-drift` - Check spec compliance
- `/spec-generate` - Generate types from schemas
- `/tour` - Code tours
- `/explain` - Explain code
- `/context-status` - Check context window usage
- `/context-guardian` - Create comprehensive session handoff
- `/emergency-handoff` - Emergency minimal handoff

---

## Token Management Best Practices

### Use Sub-Agents for Heavy Tasks
To prevent "prompt is too long" errors, offload these to sub-agents:
- **Testing**: Use `/test-agent` instead of running tests in main session
- **Exploration**: Use Task tool with `subagent_type: "Explore"` for codebase searches
- **Code review**: Offload to sub-agent for large diffs

### Keep Context Lean
- Use `/context-status` to monitor usage (aim for <70%)
- Run `/context-guardian` at 70-80% to create handoff
- Use `/emergency-handoff` at 90%+ (critical)
- Commit frequently to GitHub so progress is saved

### Session Discipline
1. **Start**: Read CLAUDE.md, check last chronicle entry
2. **During**: Use sub-agents for tests, commit after milestones
3. **At 70%**: Create handoff document
4. **End**: Update CLAUDE.md, commit, push to GitHub

### GitHub Integration
- **Repository**: https://github.com/bersamabule/GeoRhythm
- **Commit often**: Save progress in case of context exhaustion
- **Branch strategy**: `main` for stable, `feature/*` for work-in-progress

---

## Specification Reference

The complete game specification is at: `docs/specs/GAME_SPECIFICATION.md`

Key sections:
- §2 Core Gameplay Mechanics
- §3 Level System & Synchronization
- §4 Data Structures & Schemas
- §5 Architecture Design
- §12 Development Phases
- §13 Testing Strategy

---

*Living Documentation system - Update frequently for context continuity.*
