/**
 * Core physics types used throughout the game.
 * These types are framework-agnostic (no Phaser dependency).
 */

import type { PlayerModeType, SpeedModeType } from '@generated/index';

/** 2D Vector representation */
export interface Vector2 {
  x: number;
  y: number;
}

/** Input state for a single frame */
export interface InputState {
  /** Whether jump button is currently pressed this frame */
  jumpPressed: boolean;

  /** Whether jump button is being held down */
  jumpHeld: boolean;

  /** Whether pause was requested */
  pausePressed: boolean;
}

/** Complete physics state for the player */
export interface PhysicsState {
  /** Current position in pixels */
  position: Vector2;

  /** Current velocity in pixels/second */
  velocity: Vector2;

  /** Whether the player is on the ground */
  isGrounded: boolean;

  /** Whether gravity is inverted */
  gravityInverted: boolean;

  /** Visual rotation in degrees */
  rotation: number;

  /** Angular velocity for rotation (degrees/second) */
  angularVelocity: number;

  /** Time remaining for coyote time (seconds) */
  coyoteTimeRemaining: number;

  /** Whether a jump is buffered */
  jumpBuffered: boolean;

  /** Time remaining for jump buffer (seconds) */
  jumpBufferTimeRemaining: number;

  /** Whether the player is currently dead */
  isDead: boolean;

  /** Current player mode */
  mode: PlayerModeType;

  /** Current speed setting */
  speed: SpeedModeType;
}

/** Configuration passed to physics updates */
export interface PhysicsConfig {
  gravity: number;
  jumpForce: number;
  terminalVelocity: number;
  coyoteTime: number;
  jumpBuffer: number;
}

/** Strategy interface for different player modes (Cube, Ship, Ball) */
export interface IPlayerMode {
  /** Unique name of this mode */
  readonly name: PlayerModeType;

  /**
   * Update physics for this mode.
   * @param state - Current physics state (mutated in place)
   * @param input - Current input state
   * @param deltaTime - Time since last frame in seconds
   * @param config - Physics configuration
   */
  update(state: PhysicsState, input: InputState, deltaTime: number, config: PhysicsConfig): void;

  /**
   * Called when entering this mode (e.g., through a portal).
   * @param state - Current physics state
   */
  onEnter(state: PhysicsState): void;

  /**
   * Called when exiting this mode.
   * @param state - Current physics state
   */
  onExit(state: PhysicsState): void;
}

/** Factory function to create a default physics state */
export function createDefaultPhysicsState(overrides?: Partial<PhysicsState>): PhysicsState {
  return {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    isGrounded: false,
    gravityInverted: false,
    rotation: 0,
    angularVelocity: 0,
    coyoteTimeRemaining: 0,
    jumpBuffered: false,
    jumpBufferTimeRemaining: 0,
    isDead: false,
    mode: 'cube',
    speed: 'normal',
    ...overrides,
  };
}

/** Factory function to create default physics config */
export function createDefaultPhysicsConfig(overrides?: Partial<PhysicsConfig>): PhysicsConfig {
  return {
    gravity: 2600,
    jumpForce: 800,
    terminalVelocity: 1200,
    coyoteTime: 0.08,
    jumpBuffer: 0.1,
    ...overrides,
  };
}

/** Factory function to create default input state */
export function createDefaultInputState(overrides?: Partial<InputState>): InputState {
  return {
    jumpPressed: false,
    jumpHeld: false,
    pausePressed: false,
    ...overrides,
  };
}
