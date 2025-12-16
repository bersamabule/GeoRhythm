/**
 * Ball mode physics implementation.
 * A rolling mode where tapping flips gravity direction.
 */

import type { IPlayerMode, PhysicsState, InputState, PhysicsConfig } from '../types';

import { SPEEDS } from '../constants';

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Ball mode: Gravity-flipping mechanics.
 *
 * - Tap input to flip gravity direction
 * - Ball rolls on ground or ceiling
 * - Constant rotation based on horizontal velocity
 * - Can only flip gravity when grounded
 */
export class BallMode implements IPlayerMode {
  readonly name = 'ball' as const;

  /**
   * Update ball physics.
   * @param state Current physics state (mutated)
   * @param input Current input state
   * @param deltaTime Time since last frame in seconds
   * @param config Physics configuration
   */
  update(state: PhysicsState, input: InputState, deltaTime: number, config: PhysicsConfig): void {
    if (state.isDead) {
      return;
    }

    const gravityDirection = state.gravityInverted ? -1 : 1;

    // Apply gravity
    state.velocity.y += config.gravity * gravityDirection * deltaTime;

    // Clamp to terminal velocity
    state.velocity.y = clamp(state.velocity.y, -config.terminalVelocity, config.terminalVelocity);

    // Handle gravity flip input
    if (input.jumpPressed && state.isGrounded) {
      this.flipGravity(state, config);
    }

    // Update position
    state.position.y += state.velocity.y * deltaTime;

    // Update visual rotation (constant rolling based on X velocity)
    this.updateRotation(state, deltaTime);
  }

  /**
   * Flip gravity direction.
   */
  private flipGravity(state: PhysicsState, config: PhysicsConfig): void {
    // Toggle gravity direction
    state.gravityInverted = !state.gravityInverted;

    // Apply an impulse in the new gravity direction to leave the surface
    const direction = state.gravityInverted ? -1 : 1;
    state.velocity.y = config.jumpForce * 0.5 * direction; // Reduced impulse compared to cube jump

    state.isGrounded = false;
  }

  /**
   * Update visual rotation.
   * Ball rolls continuously based on horizontal movement.
   */
  private updateRotation(state: PhysicsState, deltaTime: number): void {
    // Get current speed for rolling calculation
    const horizontalSpeed = SPEEDS[state.speed] || SPEEDS.normal;

    // Roll in direction of movement
    // Rotation speed based on circumference: full rotation = 1 * UNIT_SIZE of movement
    const rotationPerPixel = 360 / (40 * Math.PI); // 40px = visual diameter
    const rotationAmount = horizontalSpeed * rotationPerPixel * deltaTime;

    // Roll direction depends on gravity (roll forward regardless of surface)
    const rollDirection = state.gravityInverted ? -1 : 1;
    state.rotation += rotationAmount * rollDirection;

    // Normalize rotation to 0-360
    state.rotation = ((state.rotation % 360) + 360) % 360;
  }

  /**
   * Called when entering ball mode.
   */
  onEnter(state: PhysicsState): void {
    state.mode = 'ball';
    // Ball doesn't need angular velocity - it calculates rotation from horizontal speed
    state.angularVelocity = 0;
    // Clear jump-related state since ball uses gravity flip instead
    state.jumpBuffered = false;
    state.jumpBufferTimeRemaining = 0;
    state.coyoteTimeRemaining = 0;
  }

  /**
   * Called when exiting ball mode.
   */
  onExit(_state: PhysicsState): void {
    // No cleanup needed
  }
}

/** Singleton instance for performance */
export const ballMode = new BallMode();
