/**
 * Physics constants for the game.
 * These values are tuned for Geometry Dash-like gameplay.
 */

/** Physics configuration values */
export const PHYSICS = {
  /** Gravity acceleration in pixels/sec² (downward) */
  GRAVITY: 2600,

  /** Jump impulse velocity in pixels/sec (upward) */
  JUMP_FORCE: 800,

  /** Maximum fall speed in pixels/sec */
  TERMINAL_VELOCITY: 1200,

  /** Grace period after leaving platform edge (seconds) */
  COYOTE_TIME: 0.08,

  /** Pre-landing jump buffer window (seconds) */
  JUMP_BUFFER: 0.1,

  /** Ship mode gravity multiplier relative to cube */
  SHIP_GRAVITY_MULTIPLIER: 0.4,

  /** Ship upward thrust in pixels/sec² */
  SHIP_THRUST_FORCE: 600,

  /** Angular velocity for cube rotation during jump (degrees/sec) */
  CUBE_ROTATION_SPEED: 360,
} as const;

/** Movement speeds in pixels/second */
export const SPEEDS = {
  slow: 251.16,
  normal: 311.58,
  fast: 387.42,
  faster: 468.0,
  superFast: 576.0,
} as const;

/** Grid and display constants */
export const GRID = {
  /** Size of one grid unit in pixels */
  UNIT_SIZE: 40,

  /** Visible height in grid units */
  VISIBLE_HEIGHT: 15,

  /** Default ground level in grid units (from top) */
  DEFAULT_GROUND_Y: 12,

  /** Game viewport width */
  VIEWPORT_WIDTH: 800,

  /** Game viewport height */
  VIEWPORT_HEIGHT: 600,
} as const;

/** Hitbox scale multipliers (relative to visual size) */
export const HITBOXES = {
  /** Player cube hitbox scale (slightly forgiving) */
  PLAYER_CUBE: 0.9,

  /** Player ship hitbox scale */
  PLAYER_SHIP: 0.85,

  /** Spike hitbox scale (very forgiving) */
  SPIKE: 0.5,

  /** Orb trigger zone scale */
  ORB: 0.75,

  /** Block hitbox scale (exact) */
  BLOCK: 1.0,
} as const;

/** Visual sizes in pixels */
export const SIZES = {
  /** Player visual size */
  PLAYER: 40,

  /** Standard block size */
  BLOCK: 40,

  /** Spike visual size */
  SPIKE: 40,

  /** Orb visual size */
  ORB: 40,
} as const;

/** Collision layer flags for bitwise operations */
export const CollisionLayer = {
  NONE: 0,
  SOLID: 1 << 0,
  HAZARD: 1 << 1,
  INTERACTIVE: 1 << 2,
  PORTAL: 1 << 3,
  TRIGGER: 1 << 4,
} as const;

export type CollisionLayerType = (typeof CollisionLayer)[keyof typeof CollisionLayer];
