/**
 * Cube mode physics implementation.
 * The default player mode with jumping mechanics.
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
 * Cube mode: Standard jumping mechanics.
 *
 * - Single tap to jump when grounded
 * - Hold to auto-jump on each landing
 * - Gravity pulls the player down
 * - Visual rotation during jumps
 */
export class CubeMode implements IPlayerMode {
  readonly name = 'cube' as const;

  /**
   * Update cube physics.
   * @param state Current physics state (mutated)
   * @param input Current input state
   * @param deltaTime Time since last frame in seconds
   * @param config Physics configuration
   */
  update(state: PhysicsState, input: InputState, deltaTime: number, config: PhysicsConfig): void {
    if (state.isDead) {
      return;
    }

    // Apply gravity
    const gravityDirection = state.gravityInverted ? -1 : 1;
    state.velocity.y += config.gravity * gravityDirection * deltaTime;

    // Clamp to terminal velocity
    if (state.gravityInverted) {
      state.velocity.y = clamp(state.velocity.y, -config.terminalVelocity, config.terminalVelocity);
    } else {
      state.velocity.y = clamp(state.velocity.y, -config.terminalVelocity, config.terminalVelocity);
    }

    // Update coyote time
    if (!state.isGrounded && state.coyoteTimeRemaining > 0) {
      state.coyoteTimeRemaining -= deltaTime;
    }

    // Update jump buffer
    if (state.jumpBuffered && state.jumpBufferTimeRemaining > 0) {
      state.jumpBufferTimeRemaining -= deltaTime;
      if (state.jumpBufferTimeRemaining <= 0) {
        state.jumpBuffered = false;
      }
    }

    // Handle jump input
    const canJump = state.isGrounded || state.coyoteTimeRemaining > 0;

    if (input.jumpPressed) {
      if (canJump) {
        this.executeJump(state, config);
      } else {
        // Buffer the jump for when we land
        state.jumpBuffered = true;
        state.jumpBufferTimeRemaining = config.jumpBuffer;
      }
    }

    // Auto-jump when holding and landing (Geometry Dash style)
    if (input.jumpHeld && state.isGrounded && state.velocity.y >= 0) {
      this.executeJump(state, config);
    }

    // Execute buffered jump on landing
    if (state.isGrounded && state.jumpBuffered && state.jumpBufferTimeRemaining > 0) {
      this.executeJump(state, config);
      state.jumpBuffered = false;
    }

    // Update position
    state.position.y += state.velocity.y * deltaTime;

    // Update visual rotation
    this.updateRotation(state, deltaTime);
  }

  /**
   * Execute a jump.
   */
  private executeJump(state: PhysicsState, config: PhysicsConfig): void {
    const direction = state.gravityInverted ? 1 : -1;
    state.velocity.y = config.jumpForce * direction;
    state.isGrounded = false;
    state.coyoteTimeRemaining = 0;

    // Start rotation
    state.angularVelocity = state.gravityInverted
      ? -PHYSICS.CUBE_ROTATION_SPEED
      : PHYSICS.CUBE_ROTATION_SPEED;
  }

  /**
   * Update visual rotation.
   * Rotates during jumps, snaps to 90° on landing.
   */
  private updateRotation(state: PhysicsState, deltaTime: number): void {
    if (state.isGrounded) {
      // Snap to nearest 90 degrees when grounded
      state.rotation = Math.round(state.rotation / 90) * 90;
      state.angularVelocity = 0;
    } else {
      // Rotate while in air
      state.rotation += state.angularVelocity * deltaTime;

      // Normalize rotation to 0-360
      state.rotation = ((state.rotation % 360) + 360) % 360;
    }
  }

  /**
   * Called when entering cube mode.
   */
  onEnter(state: PhysicsState): void {
    state.mode = 'cube';
    // Reset angular velocity - will be set on next jump
    if (state.isGrounded) {
      state.angularVelocity = 0;
    }
  }

  /**
   * Called when exiting cube mode.
   */
  onExit(_state: PhysicsState): void {
    // No cleanup needed
  }
}

/** Singleton instance for performance */
export const cubeMode = new CubeMode();
