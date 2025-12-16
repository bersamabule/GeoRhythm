/**
 * Ship mode physics implementation.
 * A flight mode where holding input applies upward thrust.
 */

import type { IPlayerMode, PhysicsState, InputState, PhysicsConfig } from '../types';

import { PHYSICS } from '../constants';

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Ship mode: Thrust-based flight mechanics.
 *
 * - Hold input to apply upward thrust
 * - Release to fall (reduced gravity)
 * - Ship tilts based on vertical velocity
 * - No discrete jumps - continuous flight control
 */
export class ShipMode implements IPlayerMode {
  readonly name = 'ship' as const;

  /**
   * Update ship physics.
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

    // Ship has reduced gravity (40% of cube)
    const shipGravity = config.gravity * PHYSICS.SHIP_GRAVITY_MULTIPLIER;

    // Apply thrust or gravity
    if (input.jumpHeld) {
      // Holding input applies upward thrust (opposite to gravity direction)
      const thrustDirection = -gravityDirection;
      state.velocity.y += PHYSICS.SHIP_THRUST_FORCE * thrustDirection * deltaTime;
    } else {
      // Not holding - apply reduced gravity
      state.velocity.y += shipGravity * gravityDirection * deltaTime;
    }

    // Ship has a lower terminal velocity than cube
    const shipTerminalVelocity = config.terminalVelocity * 0.8;
    state.velocity.y = clamp(state.velocity.y, -shipTerminalVelocity, shipTerminalVelocity);

    // Update position
    state.position.y += state.velocity.y * deltaTime;

    // Update visual rotation (tilt based on Y velocity)
    this.updateRotation(state);
  }

  /**
   * Update visual rotation based on velocity.
   * Ship tilts up when rising, down when falling.
   */
  private updateRotation(state: PhysicsState): void {
    // Calculate tilt angle based on Y velocity
    // Max tilt of ~30 degrees at high velocities
    const maxTilt = 30;
    const velocityFactor = state.velocity.y / 400; // Normalize velocity

    let targetRotation = clamp(velocityFactor * maxTilt, -maxTilt, maxTilt);

    // Invert tilt when gravity is inverted
    if (state.gravityInverted) {
      targetRotation = -targetRotation;
    }

    // Smooth rotation towards target
    const rotationSpeed = 10; // How fast to rotate towards target
    const diff = targetRotation - state.rotation;
    state.rotation += diff * Math.min(rotationSpeed * 0.016, 1); // Assume ~60fps for smoothing
  }

  /**
   * Called when entering ship mode.
   */
  onEnter(state: PhysicsState): void {
    state.mode = 'ship';
    // Reset rotation to neutral
    state.rotation = 0;
    state.angularVelocity = 0;
    // Clear jump-related state since ship doesn't use discrete jumps
    state.jumpBuffered = false;
    state.jumpBufferTimeRemaining = 0;
    state.coyoteTimeRemaining = 0;
  }

  /**
   * Called when exiting ship mode.
   */
  onExit(_state: PhysicsState): void {
    // No cleanup needed
  }
}

/** Singleton instance for performance */
export const shipMode = new ShipMode();
