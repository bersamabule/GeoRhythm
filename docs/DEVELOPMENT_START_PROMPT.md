# GeoRhythm Development Start Prompt

Copy and paste this prompt into a new Claude Code session opened in `C:\GeoRhythm`:

---

## Prompt

I'm starting development on **GeoRhythm**, a Geometry Dash clone. The project has been initialized with Living Documentation and a comprehensive game specification.

### What's Already Done

1. **Living Documentation** is initialized in this project
2. **Game Specification** is at `docs/specs/GAME_SPECIFICATION.md` (read this first)
3. **JSON Schemas** are in `specs/` directory:
   - `level-format.schema.json` - Level file structure
   - `player-state.schema.json` - Checkpoints & replays
   - `game-config.schema.json` - Runtime configuration
   - `save-data.schema.json` - Persistent storage
4. **CLAUDE.md** has project context and constraints

### Your Task: Phase 1 - "Grey Box" Engine

Set up the project and implement the core engine. Here's what needs to be done:

#### 1. Project Setup
- Initialize npm project with TypeScript
- Install dependencies:
  - `phaser` (game engine)
  - `howler` (audio)
  - `xstate` (state management)
  - `vite` (build tool)
  - `vitest` (testing)
  - `eslint` + `prettier` (code quality)
  - `json-schema-to-typescript` (type generation)
- Configure TypeScript with strict mode
- Configure Vite for Phaser
- Set up ESLint and Prettier

#### 2. Generate Types from Schemas
- Use the JSON schemas in `specs/` to generate TypeScript interfaces
- Output to `src/generated/types.ts`
- Add npm script: `generate:types`

#### 3. Create Basic Project Structure
Follow the structure in the spec (§5.2):
```
src/
├── core/physics/       # Pure physics logic
├── core/collision/     # AABB collision
├── core/state/         # XState machines
├── engine/scenes/      # Phaser scenes
├── engine/objects/     # Game objects
├── services/           # LevelLoader, AudioManager, etc.
├── generated/          # Auto-generated types
└── main.ts             # Entry point
```

#### 4. Implement Core Components

**GameScene** (`src/engine/scenes/GameScene.ts`):
- Basic Phaser scene that loads
- Placeholder for game loop

**Player** (`src/engine/objects/Player.ts`):
- Cube sprite (use a colored rectangle for now)
- Position and velocity

**CubeMode Physics** (`src/core/physics/modes/CubeMode.ts`):
- Implement `IPlayerMode` interface
- Gravity: 2600 pixels/sec²
- Jump force: 800 pixels/sec
- Terminal velocity: 1200 pixels/sec

**AABB Collision** (`src/core/collision/AABB.ts`):
- `checkOverlap(a, b)` function
- Simple rectangle intersection

#### 5. Create a Test Level
- Hardcode a simple level with:
  - Ground (row of blocks)
  - 3-5 spikes
  - 3-5 platforms at different heights
- Player should be able to jump over obstacles

#### 6. Write Unit Tests
- Test `CubeMode` physics (gravity, jump, terminal velocity)
- Test `AABB` collision detection
- Ensure physics are deterministic

### Key Constraints (from CLAUDE.md)

- **DO NOT** use Matter.js or Box2D - we need custom deterministic physics
- **DO NOT** derive position from frame deltas - use audio time (for now, use elapsed time as placeholder)
- **DO** keep physics code in `core/` without Phaser dependencies
- **DO** generate types from schemas, don't write them manually

### Verification

Before completing, ensure:
- [ ] `npm run dev` starts the game
- [ ] Player cube appears and responds to spacebar/click
- [ ] Player can jump over obstacles
- [ ] Collision with spikes triggers death (console.log for now)
- [ ] `npm test` passes with physics tests
- [ ] Types are generated from schemas

### After Setup

1. Create ADR-0001 for "Use Phaser 3 as game engine"
2. Create ADR-0002 for "Music-first game loop" (even though we're using elapsed time as placeholder)
3. Create ADR-0003 for "Custom kinematic physics"
4. Update the Chronicle with this session's work

### Reference Documents

- Full specification: `docs/specs/GAME_SPECIFICATION.md`
- Project context: `CLAUDE.md`
- Gameplay reference: https://youtu.be/jPqVXbKNoLk (Stereo Madness)

Let's begin! Start by reading the CLAUDE.md and the game specification, then proceed with the project setup.
