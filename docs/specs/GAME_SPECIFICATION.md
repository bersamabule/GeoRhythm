# GeoRhythm - Complete Game Specification

> **Version**: 1.0.0
> **Last Updated**: 2025-12-15
> **Status**: Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Gameplay Mechanics](#2-core-gameplay-mechanics)
3. [Level System & Synchronization](#3-level-system--synchronization)
4. [Data Structures & Schemas](#4-data-structures--schemas)
5. [Architecture Design](#5-architecture-design)
6. [Rendering System](#6-rendering-system)
7. [Input System](#7-input-system)
8. [Audio System](#8-audio-system)
9. [User Interface](#9-user-interface)
10. [Progression System](#10-progression-system)
11. [Development Environment](#11-development-environment)
12. [Development Phases](#12-development-phases)
13. [Testing Strategy](#13-testing-strategy)
14. [Quality Gates](#14-quality-gates)
15. [Architecture Decision Records](#15-architecture-decision-records)
16. [Code Tours](#16-code-tours)

---

## 1. Executive Summary

### 1.1 Project Overview

| Field | Value |
|-------|-------|
| **Project Name** | GeoRhythm |
| **Genre** | Rhythm-based Platformer |
| **Reference** | Geometry Dash (see [Stereo Madness gameplay](https://youtu.be/jPqVXbKNoLk)) |
| **Target Platform** | Web (Desktop & Mobile) via HTML5/WebGL |
| **Target FPS** | 60 FPS (locked) |

### 1.2 Project Goals

1. Develop a high-fidelity, web-based clone of Geometry Dash
2. Implement precise rhythm-based platforming with deterministic physics
3. Create a robust level format supporting user-generated content
4. Build a maintainable, well-documented codebase leveraging Claude Code's enhanced capabilities

### 1.3 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Language** | TypeScript (Strict Mode) | Type safety, Spec-to-Implementation Bridge compatibility |
| **Engine** | Phaser 3.70+ | Robust 2D rendering, excellent audio management, large community |
| **Build Tool** | Vite | Fast HMR for rapid iteration, excellent TypeScript support |
| **State Management** | XState v5 | Finite state machines for game states, visual debugging |
| **Audio** | Howler.js | Cross-browser audio with precise timing, Web Audio API fallback |
| **Test Runner** | Vitest | Fast execution, native TypeScript, compatible with Autonomous Test & Check |
| **Linting** | ESLint + Prettier | Consistent code style, strict TypeScript rules |

### 1.4 Development Philosophy

This project utilizes the **Claude Code Enhanced Environment** with Living Documentation. Key principles:

1. **Schema-First Development**: Define JSON schemas before implementation; generate types automatically
2. **Deterministic Physics**: Custom kinematic physics (not physics engine) for frame-perfect gameplay
3. **Music-Driven Loop**: Game position derived from audio time, not frame deltas
4. **Session-Based Development**: Work in coherent chunks documented via Chronicle
5. **Continuous Verification**: Autonomous testing validates changes before delivery

---

## 2. Core Gameplay Mechanics

### 2.1 Player Physics (Kinematic System)

Unlike standard physics engines (e.g., Matter.js, Box2D), movement must be **deterministic and precise**. The same inputs on the same level must always produce the same result.

#### 2.1.1 X-Axis Movement

The player moves at a constant horizontal velocity determined by the current speed mode:

```
x(t) = x₀ + (t × speed)
```

| Speed Mode | Units/Second | Multiplier |
|------------|--------------|------------|
| `slow` | 251.16 | 0.7x |
| `normal` | 311.58 | 1.0x |
| `fast` | 387.42 | 1.1x |
| `faster` | 468.0 | 1.3x |
| `superFast` | 576.0 | 1.6x |

#### 2.1.2 Y-Axis Movement (Cube Mode)

Custom kinematic physics with discrete integration:

```typescript
interface PhysicsConstants {
  gravity: 2600;           // pixels/sec² (downward)
  jumpForce: -800;         // pixels/sec (instant impulse)
  terminalVelocity: 1200;  // pixels/sec (max fall speed)
  groundY: 480;            // default ground level
}
```

**Update Loop (per frame):**
```
velocity.y += gravity × deltaTime
velocity.y = clamp(velocity.y, -terminalVelocity, terminalVelocity)
position.y += velocity.y × deltaTime
```

#### 2.1.3 Jump Mechanics

| Mechanic | Behavior |
|----------|----------|
| **Single Jump** | Tap input applies instant upward impulse |
| **Hold Jump** | Holding input auto-jumps on each landing (cube mode) |
| **Buffered Jump** | Input within 100ms before landing queues a jump |
| **Coyote Time** | 80ms grace period after leaving platform edge |

#### 2.1.4 Visual Rotation

The cube sprite rotates during jumps for visual flair:

- **In Air**: Rotate at constant angular velocity (360°/sec)
- **On Landing**: Snap to nearest 90° alignment
- **Rotation is cosmetic only** — hitbox remains axis-aligned

### 2.2 Collision Detection (AABB)

All collision uses **Axis-Aligned Bounding Boxes** for simplicity and performance.

#### 2.2.1 Hitbox Sizes

| Entity | Visual Size | Hitbox Size | Notes |
|--------|-------------|-------------|-------|
| Player (Cube) | 40×40 px | 36×36 px | Slightly forgiving |
| Block | 40×40 px | 40×40 px | Exact |
| Spike | 40×40 px | 20×20 px (center) | Very forgiving |
| Orb | 40×40 px | 30×30 px | Generous trigger zone |

#### 2.2.2 Collision Resolution

| Object Type | Resolution Strategy |
|-------------|---------------------|
| **Solid (Block)** | Snap player Y to block top; zero Y-velocity; enable grounded state |
| **Hazard (Spike)** | Immediate transition to `DEAD` state |
| **Jump Pad** | Apply upward impulse automatically on contact |
| **Jump Orb** | Apply impulse only if input is active during overlap |
| **Portal** | Change game mode/speed/gravity; no position change |
| **Trigger** | Fire event (checkpoint, animation); no collision response |

#### 2.2.3 Collision Layers

```typescript
enum CollisionLayer {
  NONE = 0,
  SOLID = 1 << 0,      // Blocks, platforms
  HAZARD = 1 << 1,     // Spikes, saws
  INTERACTIVE = 1 << 2, // Orbs, pads
  PORTAL = 1 << 3,     // Mode/speed changers
  TRIGGER = 1 << 4,    // Checkpoints, events
}
```

### 2.3 Game Modes

Each mode implements a **Strategy Pattern** interface for swappable physics:

```typescript
interface IPlayerMode {
  name: string;
  update(player: Player, input: InputState, dt: number): void;
  onEnter(player: Player): void;
  onExit(player: Player): void;
}
```

#### 2.3.1 Cube Mode (Default)

| Property | Value |
|----------|-------|
| Gravity | Standard (down) |
| Input | Tap = Jump, Hold = Auto-jump on land |
| Air Control | None |
| Rotation | Visual only, snaps on landing |

#### 2.3.2 Ship Mode

| Property | Value |
|----------|-------|
| Gravity | Reduced (40% of cube) |
| Input | Hold = Upward thrust, Release = Fall |
| Movement | Smooth vertical control |
| Rotation | Tilts based on Y-velocity |
| Trail | Particle trail while moving |

#### 2.3.3 Ball Mode

| Property | Value |
|----------|-------|
| Gravity | Standard, can be inverted |
| Input | Tap = Flip gravity direction |
| Rolling | Constant rotation based on X-velocity |
| Ceiling | Ball can roll on ceiling when gravity inverted |

#### 2.3.4 Mode Transition

When entering a portal:
1. Play transition particle effect
2. Call `currentMode.onExit(player)`
3. Set `currentMode = newMode`
4. Call `currentMode.onEnter(player)`
5. Update player sprite/hitbox

---

## 3. Level System & Synchronization

### 3.1 Music-First Game Loop

**Critical Design Decision**: The game loop is driven by audio track time, not frame deltas.

This ensures perfect synchronization between obstacles and music beats, regardless of frame rate fluctuations.

```typescript
class GameLoop {
  private audioStartTime: number;

  update() {
    const audioTime = this.audioContext.currentTime - this.audioStartTime;
    const playerX = audioTime * this.currentSpeed;

    // All game logic uses audioTime, not Date.now() or frame count
    this.player.setX(playerX);
    this.updateVisibleObjects(playerX);
    this.checkCollisions();
  }
}
```

**Benefits**:
- Frame drops don't cause desync
- Replays are perfectly reproducible
- Music and gameplay are inherently synchronized

### 3.2 Grid System

Levels are designed on a grid for easy authoring:

| Property | Value |
|----------|-------|
| Grid Unit | 40 pixels |
| Ground Level | Y = 12 (480 pixels from top) |
| Visible Height | 15 units (600 pixels) |
| Level Width | Unlimited (streaming) |

**Coordinate System**:
- Origin (0, 0) is top-left
- X increases rightward (direction of travel)
- Y increases downward (0 = top, 14 = bottom)
- Ground is at Y = 12 by default

### 3.3 Object Types

| ID | Type | Category | Behavior |
|----|------|----------|----------|
| `1` | Block | Solid | Standard collision, stops player fall |
| `2` | Spike | Hazard | Instant death on contact |
| `3` | Spike (inverted) | Hazard | Ceiling spike, instant death |
| `4` | Jump Pad (Yellow) | Interactive | High auto-jump (1.5x normal) |
| `5` | Jump Pad (Pink) | Interactive | Low auto-jump (0.8x normal) |
| `6` | Jump Orb (Yellow) | Interactive | Mid-air jump on tap |
| `7` | Jump Orb (Blue) | Interactive | Gravity flip + jump |
| `8` | Gravity Portal | Portal | Flip gravity direction |
| `9` | Mode Portal | Portal | Change player mode (cube/ship/ball) |
| `10` | Speed Portal | Portal | Change movement speed |
| `11` | Checkpoint | Trigger | Practice mode respawn point |
| `12` | Decoration | None | Visual only, no collision |

### 3.4 Object Properties

Objects can have additional properties beyond position:

```typescript
interface LevelObject {
  type: ObjectType;
  x: number;           // Grid X
  y: number;           // Grid Y
  rotation?: number;   // 0, 90, 180, 270
  scale?: number;      // Visual scale (default 1)
  flipX?: boolean;     // Horizontal mirror
  flipY?: boolean;     // Vertical mirror
  properties?: {
    // Type-specific properties
    targetMode?: 'cube' | 'ship' | 'ball';
    targetSpeed?: 'slow' | 'normal' | 'fast' | 'faster' | 'superFast';
    groupId?: number;  // For synchronized animations
  };
}
```

---

## 4. Data Structures & Schemas

This section defines the JSON schemas for the **Spec-to-Implementation Bridge**. These schemas are the source of truth; TypeScript interfaces are generated from them.

### 4.1 Level Format Schema

**File**: `specs/level-format.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://georhythm.game/schemas/level-format.json",
  "title": "GeoRhythm Level Format",
  "description": "Complete level definition including metadata, settings, and objects",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "description": "Schema version for forward compatibility",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "default": "1.0.0"
    },
    "metadata": {
      "type": "object",
      "description": "Level information for display and indexing",
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique level identifier (UUID)",
          "format": "uuid"
        },
        "name": {
          "type": "string",
          "description": "Display name",
          "minLength": 1,
          "maxLength": 50
        },
        "author": {
          "type": "string",
          "description": "Creator's display name",
          "minLength": 1,
          "maxLength": 30
        },
        "description": {
          "type": "string",
          "description": "Optional level description",
          "maxLength": 200
        },
        "difficulty": {
          "type": "string",
          "description": "Difficulty rating",
          "enum": ["auto", "easy", "normal", "hard", "harder", "insane", "demon"]
        },
        "songId": {
          "type": "integer",
          "description": "Reference to audio track",
          "minimum": 1
        },
        "songName": {
          "type": "string",
          "description": "Display name of the song"
        },
        "songArtist": {
          "type": "string",
          "description": "Song artist name"
        },
        "duration": {
          "type": "number",
          "description": "Level duration in seconds"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": ["name", "author", "songId"]
    },
    "settings": {
      "type": "object",
      "description": "Level configuration and appearance",
      "properties": {
        "backgroundColor": {
          "type": "string",
          "description": "Background color (hex)",
          "pattern": "^#[0-9A-Fa-f]{6}$",
          "default": "#0066FF"
        },
        "groundColor": {
          "type": "string",
          "description": "Ground/platform tint color",
          "pattern": "^#[0-9A-Fa-f]{6}$",
          "default": "#0044AA"
        },
        "lineColor": {
          "type": "string",
          "description": "Grid line color",
          "pattern": "^#[0-9A-Fa-f]{6}$",
          "default": "#0055CC"
        },
        "startMode": {
          "type": "string",
          "description": "Initial player mode",
          "enum": ["cube", "ship", "ball"],
          "default": "cube"
        },
        "startSpeed": {
          "type": "string",
          "description": "Initial movement speed",
          "enum": ["slow", "normal", "fast", "faster", "superFast"],
          "default": "normal"
        },
        "startGravity": {
          "type": "string",
          "description": "Initial gravity direction",
          "enum": ["normal", "inverted"],
          "default": "normal"
        },
        "groundY": {
          "type": "integer",
          "description": "Ground level in grid units",
          "minimum": 0,
          "maximum": 14,
          "default": 12
        }
      }
    },
    "objects": {
      "type": "array",
      "description": "All level objects (obstacles, decorations, triggers)",
      "items": {
        "$ref": "#/definitions/levelObject"
      }
    },
    "colors": {
      "type": "array",
      "description": "Color triggers for background transitions",
      "items": {
        "$ref": "#/definitions/colorTrigger"
      }
    }
  },
  "required": ["version", "metadata", "objects"],
  "definitions": {
    "levelObject": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "description": "Object instance ID (unique within level)"
        },
        "type": {
          "type": "string",
          "description": "Object type identifier",
          "enum": [
            "block",
            "spike",
            "spikeInverted",
            "padYellow",
            "padPink",
            "orbYellow",
            "orbBlue",
            "portalGravity",
            "portalMode",
            "portalSpeed",
            "checkpoint",
            "decoration"
          ]
        },
        "x": {
          "type": "number",
          "description": "Grid X position"
        },
        "y": {
          "type": "number",
          "description": "Grid Y position"
        },
        "rotation": {
          "type": "number",
          "description": "Rotation in degrees",
          "enum": [0, 90, 180, 270],
          "default": 0
        },
        "scale": {
          "type": "number",
          "description": "Visual scale multiplier",
          "minimum": 0.1,
          "maximum": 2.0,
          "default": 1.0
        },
        "flipX": {
          "type": "boolean",
          "default": false
        },
        "flipY": {
          "type": "boolean",
          "default": false
        },
        "zIndex": {
          "type": "integer",
          "description": "Render order (higher = front)",
          "default": 0
        },
        "properties": {
          "type": "object",
          "description": "Type-specific properties",
          "properties": {
            "targetMode": {
              "type": "string",
              "enum": ["cube", "ship", "ball"]
            },
            "targetSpeed": {
              "type": "string",
              "enum": ["slow", "normal", "fast", "faster", "superFast"]
            },
            "groupId": {
              "type": "integer",
              "description": "Animation/trigger group"
            },
            "invisible": {
              "type": "boolean",
              "description": "Hidden until triggered"
            }
          }
        }
      },
      "required": ["type", "x", "y"]
    },
    "colorTrigger": {
      "type": "object",
      "properties": {
        "x": {
          "type": "number",
          "description": "Trigger position (grid X)"
        },
        "target": {
          "type": "string",
          "enum": ["background", "ground", "line"]
        },
        "color": {
          "type": "string",
          "pattern": "^#[0-9A-Fa-f]{6}$"
        },
        "duration": {
          "type": "number",
          "description": "Transition duration in seconds",
          "default": 0.5
        }
      },
      "required": ["x", "target", "color"]
    }
  }
}
```

### 4.2 Player State Schema

**File**: `specs/player-state.schema.json`

Used for checkpoints, save states, and replay systems.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://georhythm.game/schemas/player-state.json",
  "title": "Player State",
  "description": "Complete player state for checkpointing and replays",
  "type": "object",
  "properties": {
    "position": {
      "type": "object",
      "properties": {
        "x": { "type": "number" },
        "y": { "type": "number" }
      },
      "required": ["x", "y"]
    },
    "velocity": {
      "type": "object",
      "properties": {
        "x": { "type": "number" },
        "y": { "type": "number" }
      },
      "required": ["x", "y"]
    },
    "mode": {
      "type": "string",
      "enum": ["cube", "ship", "ball"]
    },
    "speed": {
      "type": "string",
      "enum": ["slow", "normal", "fast", "faster", "superFast"]
    },
    "gravityInverted": {
      "type": "boolean"
    },
    "rotation": {
      "type": "number",
      "description": "Visual rotation in degrees"
    },
    "isGrounded": {
      "type": "boolean"
    },
    "isDead": {
      "type": "boolean"
    },
    "audioTime": {
      "type": "number",
      "description": "Audio position in seconds at this state"
    }
  },
  "required": ["position", "velocity", "mode", "speed", "gravityInverted"]
}
```

### 4.3 Game Configuration Schema

**File**: `specs/game-config.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://georhythm.game/schemas/game-config.json",
  "title": "Game Configuration",
  "description": "Runtime game settings and physics constants",
  "type": "object",
  "properties": {
    "display": {
      "type": "object",
      "properties": {
        "width": { "type": "integer", "default": 800 },
        "height": { "type": "integer", "default": 600 },
        "targetFPS": { "type": "integer", "default": 60 },
        "pixelArt": { "type": "boolean", "default": false }
      }
    },
    "physics": {
      "type": "object",
      "properties": {
        "gravity": { "type": "number", "default": 2600 },
        "jumpForce": { "type": "number", "default": 800 },
        "terminalVelocity": { "type": "number", "default": 1200 },
        "coyoteTime": { "type": "number", "default": 0.08 },
        "jumpBuffer": { "type": "number", "default": 0.1 }
      }
    },
    "speeds": {
      "type": "object",
      "properties": {
        "slow": { "type": "number", "default": 251.16 },
        "normal": { "type": "number", "default": 311.58 },
        "fast": { "type": "number", "default": 387.42 },
        "faster": { "type": "number", "default": 468.0 },
        "superFast": { "type": "number", "default": 576.0 }
      }
    },
    "camera": {
      "type": "object",
      "properties": {
        "lookAheadX": { "type": "number", "default": 200 },
        "smoothingY": { "type": "number", "default": 0.1 },
        "deadZoneY": { "type": "number", "default": 50 }
      }
    },
    "audio": {
      "type": "object",
      "properties": {
        "masterVolume": { "type": "number", "minimum": 0, "maximum": 1, "default": 1 },
        "musicVolume": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.8 },
        "sfxVolume": { "type": "number", "minimum": 0, "maximum": 1, "default": 1 }
      }
    }
  }
}
```

### 4.4 Save Data Schema

**File**: `specs/save-data.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://georhythm.game/schemas/save-data.json",
  "title": "Save Data",
  "description": "Persistent player progress and settings",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "player": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "iconId": { "type": "integer" },
        "primaryColor": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
        "secondaryColor": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" }
      }
    },
    "progress": {
      "type": "object",
      "properties": {
        "levels": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "completed": { "type": "boolean" },
              "bestProgress": { "type": "number", "minimum": 0, "maximum": 100 },
              "attempts": { "type": "integer" },
              "practiceCheckpoints": {
                "type": "array",
                "items": { "type": "number" }
              },
              "stars": { "type": "integer", "minimum": 0, "maximum": 3 }
            }
          }
        },
        "totalStars": { "type": "integer" },
        "totalAttempts": { "type": "integer" },
        "totalDeaths": { "type": "integer" },
        "playTime": { "type": "number", "description": "Total play time in seconds" }
      }
    },
    "unlocks": {
      "type": "object",
      "properties": {
        "icons": {
          "type": "array",
          "items": { "type": "integer" }
        },
        "colors": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "settings": {
      "type": "object",
      "properties": {
        "musicVolume": { "type": "number" },
        "sfxVolume": { "type": "number" },
        "showFPS": { "type": "boolean" },
        "showProgress": { "type": "boolean" },
        "autoRetry": { "type": "boolean" }
      }
    }
  },
  "required": ["version", "progress"]
}
```

---

## 5. Architecture Design

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Application                          │
├─────────────────────────────────────────────────────────────┤
│  Scenes        │  UI           │  Services                  │
│  ├─ Boot       │  ├─ MainMenu  │  ├─ AudioManager           │
│  ├─ Preload    │  ├─ HUD       │  ├─ LevelLoader            │
│  ├─ Game       │  ├─ Pause     │  ├─ SaveManager            │
│  └─ Editor     │  └─ Results   │  └─ InputManager           │
├─────────────────────────────────────────────────────────────┤
│                         Engine                              │
│  ├─ GameLoop (Music-First)                                  │
│  ├─ CollisionSystem (AABB)                                  │
│  ├─ ObjectPool                                              │
│  └─ Camera                                                  │
├─────────────────────────────────────────────────────────────┤
│                          Core                               │
│  ├─ Physics (Cube/Ship/Ball)                                │
│  ├─ StateManager (XState)                                   │
│  └─ EventBus                                                │
├─────────────────────────────────────────────────────────────┤
│                          Data                               │
│  ├─ Schemas (JSON Schema)                                   │
│  ├─ Generated Types                                         │
│  └─ Validators                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Directory Structure (Knowledge Graph Optimized)

Structured to support Claude's Knowledge Graph queries like:
- "What depends on the physics system?"
- "What happens when the player collides?"
- "How does level loading work?"

```
src/
├── core/                    # Pure logic, no framework dependencies
│   ├── physics/
│   │   ├── PhysicsEngine.ts      # Main physics coordinator
│   │   ├── modes/
│   │   │   ├── IPlayerMode.ts    # Strategy interface
│   │   │   ├── CubeMode.ts
│   │   │   ├── ShipMode.ts
│   │   │   └── BallMode.ts
│   │   └── constants.ts          # Physics constants
│   ├── collision/
│   │   ├── AABB.ts               # Bounding box math
│   │   ├── CollisionDetector.ts  # Overlap detection
│   │   └── CollisionResolver.ts  # Response handling
│   └── state/
│       ├── GameStateMachine.ts   # XState definition
│       └── states/               # State implementations
│
├── engine/                  # Phaser-specific implementations
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── GameScene.ts
│   │   └── EditorScene.ts
│   ├── objects/
│   │   ├── Player.ts             # Player sprite + physics
│   │   ├── Block.ts
│   │   ├── Spike.ts
│   │   ├── JumpPad.ts
│   │   ├── JumpOrb.ts
│   │   └── Portal.ts
│   ├── systems/
│   │   ├── ObjectPool.ts         # Object recycling
│   │   ├── CameraController.ts   # Look-ahead camera
│   │   └── ParticleManager.ts    # Death/trail effects
│   └── GameLoop.ts               # Music-first update loop
│
├── services/                # Application services
│   ├── AudioManager.ts           # Howler.js wrapper
│   ├── LevelLoader.ts            # JSON parsing + validation
│   ├── SaveManager.ts            # LocalStorage persistence
│   └── InputManager.ts           # Input normalization
│
├── ui/                      # UI components
│   ├── MainMenu.ts
│   ├── LevelSelect.ts
│   ├── HUD.ts
│   ├── PauseMenu.ts
│   └── ResultsScreen.ts
│
├── data/                    # Data layer
│   ├── schemas/                  # JSON Schema source files
│   │   ├── level-format.schema.json
│   │   ├── player-state.schema.json
│   │   ├── game-config.schema.json
│   │   └── save-data.schema.json
│   └── levels/                   # Built-in level JSON files
│       ├── stereo-madness.json
│       └── test-level.json
│
├── generated/               # Auto-generated from schemas
│   ├── types.ts                  # TypeScript interfaces
│   └── validators.ts             # Runtime validators
│
├── assets/                  # Asset references (actual files in public/)
│   └── manifest.ts               # Asset keys and paths
│
├── utils/                   # Utility functions
│   ├── math.ts                   # Clamp, lerp, etc.
│   ├── easing.ts                 # Easing functions
│   └── debug.ts                  # Debug utilities
│
├── config/
│   └── game.config.ts            # Runtime configuration
│
└── main.ts                  # Entry point
```

### 5.3 Game State Machine

Using XState for clear state management:

```typescript
import { createMachine } from 'xstate';

const gameStateMachine = createMachine({
  id: 'game',
  initial: 'boot',
  states: {
    boot: {
      on: { LOADED: 'menu' }
    },
    menu: {
      on: {
        START_LEVEL: 'playing',
        OPEN_SETTINGS: 'settings',
        OPEN_LEVEL_SELECT: 'levelSelect'
      }
    },
    levelSelect: {
      on: {
        SELECT_LEVEL: 'playing',
        BACK: 'menu'
      }
    },
    settings: {
      on: { BACK: 'menu' }
    },
    playing: {
      initial: 'running',
      states: {
        running: {
          on: {
            PAUSE: 'paused',
            DEATH: 'dead',
            COMPLETE: 'complete'
          }
        },
        paused: {
          on: {
            RESUME: 'running',
            RESTART: 'running',
            EXIT: '#game.menu'
          }
        },
        dead: {
          on: {
            RETRY: 'running',
            EXIT: '#game.menu'
          }
        },
        complete: {
          on: {
            NEXT_LEVEL: 'running',
            EXIT: '#game.menu'
          }
        }
      }
    }
  }
});
```

### 5.4 Game Loop (Music-First)

```typescript
class GameLoop {
  private audioContext: AudioContext;
  private audioStartTime: number = 0;
  private currentSpeed: number;
  private isPaused: boolean = false;

  start(audioElement: HTMLAudioElement) {
    this.audioStartTime = this.audioContext.currentTime;
    audioElement.play();
  }

  update() {
    if (this.isPaused) return;

    // 1. Calculate game time from audio
    const audioTime = this.audioContext.currentTime - this.audioStartTime;
    const targetX = audioTime * this.currentSpeed;

    // 2. Process buffered inputs
    const inputs = this.inputManager.consumeBuffer();

    // 3. Update player physics
    this.player.setTargetX(targetX);
    this.currentMode.update(this.player, inputs, this.deltaTime);

    // 4. Check collisions
    this.collisionSystem.check(this.player, this.activeObjects);

    // 5. Update camera
    this.camera.follow(this.player);

    // 6. Cull and spawn objects
    this.objectPool.update(targetX, this.viewportWidth);

    // 7. Render (Phaser handles this)
  }
}
```

---

## 6. Rendering System

### 6.1 Layer System

| Layer | Z-Index | Contents |
|-------|---------|----------|
| Background | 0 | Gradient, distant decorations |
| Ground | 100 | Ground blocks, grid lines |
| Objects (Back) | 200 | Decorations behind player |
| Objects (Main) | 300 | Blocks, spikes, interactives |
| Player | 400 | Player sprite |
| Objects (Front) | 500 | Decorations in front |
| Particles | 600 | Death effects, trails |
| UI | 1000 | HUD, progress bar |

### 6.2 Camera System

**Look-Ahead Camera**: The camera leads the player to show upcoming obstacles.

```typescript
class CameraController {
  private readonly LOOK_AHEAD_X = 200;  // Pixels ahead
  private readonly SMOOTHING_Y = 0.1;   // Y-axis damping
  private readonly DEAD_ZONE_Y = 50;    // Y movement threshold

  update(player: Player) {
    // X: Always look ahead
    this.targetX = player.x + this.LOOK_AHEAD_X;
    this.camera.scrollX = this.targetX - this.viewportWidth / 2;

    // Y: Smooth follow with dead zone
    const deltaY = player.y - this.camera.scrollY - this.viewportHeight / 2;
    if (Math.abs(deltaY) > this.DEAD_ZONE_Y) {
      this.camera.scrollY += deltaY * this.SMOOTHING_Y;
    }
  }
}
```

### 6.3 Object Pooling

Critical for performance with large levels:

```typescript
class ObjectPool<T extends Phaser.GameObjects.Sprite> {
  private pool: T[] = [];
  private active: Map<number, T> = new Map();

  spawn(x: number, y: number, type: string): T {
    let obj = this.pool.pop();
    if (!obj) {
      obj = this.createNew(type);
    }
    obj.setPosition(x, y);
    obj.setActive(true).setVisible(true);
    this.active.set(obj.getData('id'), obj);
    return obj;
  }

  despawn(obj: T) {
    obj.setActive(false).setVisible(false);
    this.active.delete(obj.getData('id'));
    this.pool.push(obj);
  }

  cullOffscreen(viewportLeft: number) {
    for (const [id, obj] of this.active) {
      if (obj.x < viewportLeft - 100) {
        this.despawn(obj);
      }
    }
  }
}
```

### 6.4 Visual Effects

**Death Effect**:
- Explode player into 8-12 particles
- Particles fly outward with random velocity
- Fade out over 500ms
- Screen flash (white, 100ms)

**Trail Effect (Ship/Wave)**:
- Spawn particle every 30ms while moving
- Color matches player secondary color
- Fade out over 300ms
- Max 50 trail particles

**Jump Effect**:
- Spawn 4 particles at player feet
- Small upward burst
- Fade quickly (150ms)

---

## 7. Input System

### 7.1 Input Sources

| Platform | Primary | Secondary |
|----------|---------|-----------|
| Desktop | Spacebar | Mouse click, Up arrow |
| Mobile | Touch anywhere | - |
| Gamepad | A button | Right trigger |

### 7.2 Input Buffer

Buffer inputs to ensure responsive controls despite frame timing:

```typescript
class InputManager {
  private buffer: InputEvent[] = [];
  private readonly BUFFER_DURATION = 100; // ms

  onInput(type: 'press' | 'release') {
    this.buffer.push({
      type,
      timestamp: performance.now()
    });
  }

  consumeBuffer(): InputEvent[] {
    const now = performance.now();
    const valid = this.buffer.filter(e => now - e.timestamp < this.BUFFER_DURATION);
    this.buffer = [];
    return valid;
  }

  isHeld(): boolean {
    return this.currentlyHeld;
  }
}
```

### 7.3 Coyote Time & Jump Buffering

```typescript
// In physics update
if (input.jumpPressed) {
  if (this.isGrounded || this.coyoteTimeRemaining > 0) {
    this.jump();
  } else {
    this.jumpBuffered = true;
    this.jumpBufferTime = JUMP_BUFFER_DURATION;
  }
}

// On landing
if (wasInAir && this.isGrounded) {
  if (this.jumpBuffered && this.jumpBufferTime > 0) {
    this.jump();
    this.jumpBuffered = false;
  }
}
```

---

## 8. Audio System

### 8.1 Architecture

Using Howler.js for cross-browser audio with precise timing:

```typescript
class AudioManager {
  private music: Howl | null = null;
  private sfx: Map<string, Howl> = new Map();
  private audioContext: AudioContext;

  async loadMusic(url: string): Promise<void> {
    this.music = new Howl({
      src: [url],
      html5: true, // Streaming for large files
      onload: () => this.emit('musicLoaded'),
      onplay: () => this.syncStartTime()
    });
  }

  loadSFX(key: string, url: string) {
    this.sfx.set(key, new Howl({
      src: [url],
      preload: true,
      volume: this.sfxVolume
    }));
  }

  playSFX(key: string) {
    this.sfx.get(key)?.play();
  }

  getMusicTime(): number {
    return this.music?.seek() ?? 0;
  }
}
```

### 8.2 Sound Effects

| Key | Trigger | File |
|-----|---------|------|
| `jump` | Player jumps | jump.wav |
| `death` | Player dies | death.wav |
| `checkpoint` | Reach checkpoint | checkpoint.wav |
| `complete` | Level complete | complete.wav |
| `orb` | Activate orb | orb.wav |
| `pad` | Hit jump pad | pad.wav |
| `portal` | Enter portal | portal.wav |
| `coin` | Collect coin | coin.wav |

### 8.3 Music Synchronization

The game position is derived from music time:

```typescript
class GameSync {
  private startTime: number = 0;

  start() {
    this.audioManager.playMusic();
    this.startTime = this.audioManager.getMusicTime();
  }

  getGameTime(): number {
    return this.audioManager.getMusicTime() - this.startTime;
  }

  getPlayerX(): number {
    return this.getGameTime() * this.currentSpeed;
  }
}
```

---

## 9. User Interface

### 9.1 Screen Flow

```
┌─────────────┐
│    Boot     │
└──────┬──────┘
       ▼
┌─────────────┐
│   Preload   │
└──────┬──────┘
       ▼
┌─────────────┐     ┌─────────────┐
│  Main Menu  │────▶│  Settings   │
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│Level Select │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│   Playing   │────▶│   Paused    │
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│  Results    │
└─────────────┘
```

### 9.2 HUD Elements

| Element | Position | Description |
|---------|----------|-------------|
| Progress Bar | Top | Shows level completion % |
| Attempt Counter | Top-right | Current attempt number |
| Practice Mode | Top-left | "PRACTICE" indicator |
| FPS Counter | Bottom-left | Optional debug display |

### 9.3 Main Menu

```
┌────────────────────────────────────┐
│                                    │
│           GEORHYTHM                │
│                                    │
│         [ PLAY ]                   │
│                                    │
│       [ LEVEL SELECT ]             │
│                                    │
│        [ SETTINGS ]                │
│                                    │
│          [ QUIT ]                  │
│                                    │
└────────────────────────────────────┘
```

### 9.4 Pause Menu

```
┌────────────────────────────────────┐
│                                    │
│            PAUSED                  │
│                                    │
│          [ RESUME ]                │
│                                    │
│         [ PRACTICE ]               │
│                                    │
│          [ RESTART ]               │
│                                    │
│           [ EXIT ]                 │
│                                    │
└────────────────────────────────────┘
```

---

## 10. Progression System

### 10.1 Level Completion

| Progress % | Result |
|------------|--------|
| 0-99% | Attempt failed, record best % |
| 100% | Level complete, award stars |

### 10.2 Star System

| Requirement | Stars |
|-------------|-------|
| Complete level | 1 ⭐ |
| Complete with <100 attempts | 2 ⭐⭐ |
| Complete with 3 coins | 3 ⭐⭐⭐ |

### 10.3 Statistics Tracked

- Total attempts (all levels)
- Total deaths
- Total play time
- Per-level: attempts, best progress, completion status
- Lifetime jumps

---

## 11. Development Environment

### 11.1 Complete Project Structure

```
C:\GeoRhythm\
├── CLAUDE.md                     # Living Documentation
├── AGENTS.md                     # Multi-agent coordination
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── .eslintrc.js
├── .prettierrc
│
├── docs/
│   ├── adr/                      # Architecture Decision Records
│   │   ├── 0001-use-phaser.md
│   │   ├── 0002-music-first-loop.md
│   │   └── 0003-custom-physics.md
│   ├── chronicle/                # Session history
│   ├── specs/                    # This specification
│   │   └── GAME_SPECIFICATION.md
│   ├── onboarding/
│   │   └── tours/
│   │       ├── game-loop.md
│   │       ├── collision-system.md
│   │       └── level-loading.md
│   ├── knowledge-graph/
│   ├── debt/
│   └── testing/
│
├── specs/                        # JSON Schemas (source of truth)
│   ├── level-format.schema.json
│   ├── player-state.schema.json
│   ├── game-config.schema.json
│   └── save-data.schema.json
│
├── src/                          # Source code (see §5.2)
│   └── ...
│
├── public/
│   ├── assets/
│   │   ├── sprites/
│   │   ├── audio/
│   │   │   ├── music/
│   │   │   └── sfx/
│   │   └── fonts/
│   └── levels/
│
└── tests/
    ├── unit/
    │   ├── physics/
    │   │   ├── CubeMode.test.ts
    │   │   ├── ShipMode.test.ts
    │   │   └── collision.test.ts
    │   └── services/
    │       └── LevelLoader.test.ts
    └── integration/
        └── gameplay.test.ts
```

### 11.2 Development Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write src/**/*.ts",
    "generate:types": "json2ts specs/*.schema.json -o src/generated/",
    "validate:specs": "ajv validate -s specs/*.schema.json",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 12. Development Phases

### Phase 1: The "Grey Box" Engine

**Goal**: A cube moving to the beat with hardcoded geometry.

**Duration**: ~3 sessions

**Deliverables**:
- [ ] Project setup (Phaser + TypeScript + Vite)
- [ ] JSON schemas defined and types generated
- [ ] Basic game loop (music-first)
- [ ] Cube physics (gravity, jump)
- [ ] AABB collision detection
- [ ] Hardcoded test level (10 blocks, 5 spikes)
- [ ] Death and restart

**Validation**:
- Unit tests for physics pass
- Cube jumps at correct height
- Collision with spike triggers death

**Chronicle Entry**: `2025-xx-xx-phase1-grey-box.md`

---

### Phase 2: The Level Loader

**Goal**: Parse JSON levels and render them dynamically.

**Duration**: ~2 sessions

**Deliverables**:
- [ ] `LevelLoader` service with validation
- [ ] Object pooling system
- [ ] Camera follow logic (look-ahead)
- [ ] Multiple object types (blocks, spikes, pads, orbs)
- [ ] First real level: "Stereo Madness" recreation

**Validation**:
- Level JSON validates against schema
- Invalid JSON throws meaningful errors
- 1000+ objects render at 60fps

**ADR**: `0004-object-pooling-strategy.md`

---

### Phase 3: Polish & Synchronization

**Goal**: A full playable level with music, death, and restarting.

**Duration**: ~2 sessions

**Deliverables**:
- [ ] Audio integration (Howler.js)
- [ ] Music-to-gameplay synchronization
- [ ] Death/respawn state machine
- [ ] Practice mode (checkpoints)
- [ ] Progress bar HUD
- [ ] Attempt counter

**Validation**:
- Audio time matches player position ±10ms
- Practice checkpoints save/load correctly

**Code Tour**: `game-loop.md` - Explains audio sync

---

### Phase 4: Game Modes & Effects

**Goal**: Ship mode, visual polish.

**Duration**: ~2 sessions

**Deliverables**:
- [ ] `ShipMode` physics
- [ ] Mode portal switching
- [ ] Particle effects (death, trail)
- [ ] Screen shake on death
- [ ] Speed portals
- [ ] Gravity portals

**Validation**:
- Mode transitions are seamless
- Particles don't impact performance

---

### Phase 5: UI & Menus

**Goal**: Complete menu flow.

**Duration**: ~2 sessions

**Deliverables**:
- [ ] Main menu
- [ ] Level select screen
- [ ] Pause menu
- [ ] Results screen
- [ ] Settings (volume, controls)

**Validation**:
- All navigation paths work
- Settings persist across sessions

---

### Phase 6: Persistence & Progress

**Goal**: Save system, unlockables.

**Duration**: ~1 session

**Deliverables**:
- [ ] `SaveManager` with LocalStorage
- [ ] Progress tracking
- [ ] Statistics display
- [ ] Icon/color unlocks

**Validation**:
- Save data validates against schema
- Progress persists across browser sessions

---

### Phase 7: Level Editor (Optional)

**Goal**: In-browser level creation.

**Duration**: ~4 sessions

**Deliverables**:
- [ ] Editor scene
- [ ] Object palette
- [ ] Grid snapping
- [ ] Playtest mode
- [ ] Export/import JSON
- [ ] Music selection

---

## 13. Testing Strategy

### 13.1 Unit Tests (Physics)

Since physics are custom (not Box2D), we write deterministic tests:

```typescript
describe('CubeMode', () => {
  const physics = new CubeMode();
  const config = defaultPhysicsConfig();

  it('applies gravity when airborne', () => {
    const state = createPlayerState({ y: 100, velocityY: 0, grounded: false });
    physics.update(state, { jump: false }, 1/60, config);

    expect(state.velocity.y).toBeCloseTo(config.gravity / 60);
  });

  it('applies jump impulse when grounded and jump pressed', () => {
    const state = createPlayerState({ grounded: true });
    physics.update(state, { jump: true }, 1/60, config);

    expect(state.velocity.y).toBe(-config.jumpForce);
    expect(state.grounded).toBe(false);
  });

  it('respects terminal velocity', () => {
    const state = createPlayerState({ velocityY: 10000, grounded: false });
    physics.update(state, { jump: false }, 1/60, config);

    expect(state.velocity.y).toBeLessThanOrEqual(config.terminalVelocity);
  });
});
```

### 13.2 Unit Tests (Collision)

```typescript
describe('AABB Collision', () => {
  it('detects overlap between two boxes', () => {
    const a = { x: 0, y: 0, width: 40, height: 40 };
    const b = { x: 30, y: 30, width: 40, height: 40 };

    expect(checkAABBOverlap(a, b)).toBe(true);
  });

  it('returns false for non-overlapping boxes', () => {
    const a = { x: 0, y: 0, width: 40, height: 40 };
    const b = { x: 100, y: 100, width: 40, height: 40 };

    expect(checkAABBOverlap(a, b)).toBe(false);
  });
});
```

### 13.3 Integration Tests (Level Loading)

```typescript
describe('LevelLoader', () => {
  it('parses valid level JSON', async () => {
    const loader = new LevelLoader();
    const level = await loader.load('test-level.json');

    expect(level.metadata.name).toBeDefined();
    expect(level.objects.length).toBeGreaterThan(0);
  });

  it('throws on invalid level JSON', async () => {
    const loader = new LevelLoader();
    const invalidJson = { objects: 'not an array' };

    await expect(loader.parse(invalidJson)).rejects.toThrow();
  });
});
```

### 13.4 Visual Regression (Optional)

Using Autonomous App Inspection:

```typescript
describe('Visual Regression', () => {
  it('renders first frame of Stereo Madness correctly', async () => {
    // This leverages Claude's /inspect capability
    const screenshot = await captureGameFrame('stereo-madness', 0);
    expect(screenshot).toMatchSnapshot();
  });
});
```

---

## 14. Quality Gates

### 14.1 Pre-Commit Checks

| Check | Tool | Threshold |
|-------|------|-----------|
| TypeScript | `tsc --noEmit` | 0 errors |
| Linting | ESLint | 0 errors, 0 warnings |
| Formatting | Prettier | All files formatted |
| Unit Tests | Vitest | 100% pass |
| Coverage | Vitest | >80% for `core/` |

### 14.2 Complexity Thresholds

Using Technical Debt Radar:

| Metric | Threshold | Applies To |
|--------|-----------|------------|
| Function length | <50 lines | All functions |
| Function length | <20 lines | `update()` methods |
| Cyclomatic complexity | <10 | All functions |
| Nesting depth | <4 levels | All code |
| File length | <400 lines | All files |

### 14.3 Performance Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame rate | 60 FPS stable | Average over 60 seconds |
| Frame time | <16.67ms | 99th percentile |
| Memory | <100MB | Heap snapshot |
| Load time | <3s | First playable frame |
| Level parse | <100ms | 1000 objects |

### 14.4 Spec Compliance

Run on every build:

```bash
# Validate schemas
npm run validate:specs

# Check for drift
/spec-drift:strict

# Regenerate types if schemas changed
npm run generate:types
```

---

## 15. Architecture Decision Records

The following ADRs should be created during development:

### ADR-0001: Use Phaser 3 as Game Engine

**Status**: Accepted

**Context**: Need a 2D game engine for web with good audio support.

**Decision**: Use Phaser 3.70+

**Rationale**:
- Mature, well-documented
- Excellent TypeScript support
- Built-in audio management
- Large community and plugin ecosystem
- Active development

**Alternatives Considered**:
- PixiJS (lower-level, more work)
- Vanilla Canvas (too much work)
- Godot Web Export (too heavy)

---

### ADR-0002: Music-First Game Loop

**Status**: Accepted

**Context**: Gameplay must be synchronized to music beats.

**Decision**: Derive game position from audio time, not frame deltas.

**Rationale**:
- Frame rate variations don't cause desync
- Replays are deterministic
- Music and gameplay inherently aligned

**Consequences**:
- Cannot pause music and continue game
- Audio latency affects perceived timing

---

### ADR-0003: Custom Kinematic Physics

**Status**: Accepted

**Context**: Need precise, deterministic physics for rhythm game.

**Decision**: Implement custom physics instead of using physics engine.

**Rationale**:
- Full control over behavior
- Deterministic (no floating point drift from physics engine)
- Simpler than fighting physics engine assumptions
- Better performance for this use case

**Consequences**:
- More code to write and maintain
- Must handle all edge cases manually

---

### ADR-0004: Object Pooling Strategy

**Status**: Proposed

**Context**: Levels can have 1000+ objects; need efficient rendering.

**Decision**: Pool and recycle game objects as they scroll off-screen.

---

## 16. Code Tours

The following code tours should be created for onboarding:

### Tour: Game Loop

**File**: `docs/onboarding/tours/game-loop.md`

**Stops**:
1. `src/main.ts` - Entry point
2. `src/engine/scenes/GameScene.ts` - Scene lifecycle
3. `src/engine/GameLoop.ts` - Music-first update
4. `src/services/AudioManager.ts` - Audio timing
5. `src/core/physics/PhysicsEngine.ts` - Physics update

---

### Tour: Collision System

**File**: `docs/onboarding/tours/collision-system.md`

**Stops**:
1. `src/core/collision/AABB.ts` - Bounding box math
2. `src/core/collision/CollisionDetector.ts` - Overlap detection
3. `src/core/collision/CollisionResolver.ts` - Response handling
4. `src/engine/objects/Player.ts` - Player hitbox
5. `src/engine/objects/Spike.ts` - Hazard hitbox

---

### Tour: Level Loading

**File**: `docs/onboarding/tours/level-loading.md`

**Stops**:
1. `specs/level-format.schema.json` - Schema definition
2. `src/generated/types.ts` - Generated types
3. `src/services/LevelLoader.ts` - Loading and validation
4. `src/engine/systems/ObjectPool.ts` - Object spawning
5. `src/engine/scenes/GameScene.ts` - Level initialization

---

## Appendix A: Asset Requirements

### Sprites

| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| Player (Cube) | 40×40 | PNG | With animation frames |
| Player (Ship) | 60×40 | PNG | With tilt frames |
| Block | 40×40 | PNG | Tileable |
| Spike | 40×40 | PNG | Transparent background |
| Jump Pad | 40×20 | PNG | Yellow and pink variants |
| Jump Orb | 40×40 | PNG | With glow effect |
| Portal | 40×80 | PNG | Multiple types |
| Particle | 8×8 | PNG | White, tinted at runtime |

### Audio

| Asset | Format | Duration | Notes |
|-------|--------|----------|-------|
| Music tracks | MP3/OGG | Varies | 128kbps minimum |
| SFX | WAV | <1s | 44.1kHz, mono |

---

## Appendix B: Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| Space | Jump | Gameplay |
| Up Arrow | Jump | Gameplay |
| P | Pause | Gameplay |
| Escape | Pause / Back | All |
| R | Restart | Gameplay |
| Enter | Select | Menus |

---

## Appendix C: References

- [Geometry Dash Wiki](https://geometry-dash.fandom.com/)
- [Stereo Madness Gameplay](https://youtu.be/jPqVXbKNoLk)
- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Howler.js Documentation](https://howlerjs.com/)
- [XState Documentation](https://xstate.js.org/)

---

*This specification is a living document. Update as development progresses.*

*Generated for use with Claude Code Enhanced Environment v0.10.0*
