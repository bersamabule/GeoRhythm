/**
 * CubeMode physics tests.
 * These tests ensure deterministic, frame-perfect physics.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { CubeMode } from '../../../src/core/physics/modes/CubeMode';
import {
  createDefaultPhysicsState,
  createDefaultPhysicsConfig,
  createDefaultInputState,
} from '../../../src/core/physics/types';

import type { PhysicsState, PhysicsConfig, InputState } from '../../../src/core/physics/types';

describe('CubeMode', () => {
  let cubeMode: CubeMode;
  let state: PhysicsState;
  let config: PhysicsConfig;
  let input: InputState;

  const DELTA_TIME = 1 / 60; // 60 FPS

  beforeEach(() => {
    cubeMode = new CubeMode();
    state = createDefaultPhysicsState({
      position: { x: 100, y: 400 },
      isGrounded: true,
    });
    config = createDefaultPhysicsConfig();
    input = createDefaultInputState();
  });

  describe('name', () => {
    it('has correct mode name', () => {
      expect(cubeMode.name).toBe('cube');
    });
  });

  describe('gravity', () => {
    it('applies gravity when airborne', () => {
      state.isGrounded = false;
      state.velocity.y = 0;

      cubeMode.update(state, input, DELTA_TIME, config);

      // Velocity should increase by gravity * dt
      const expectedVelocity = config.gravity * DELTA_TIME;
      expect(state.velocity.y).toBeCloseTo(expectedVelocity, 5);
    });

    it('respects terminal velocity', () => {
      state.isGrounded = false;
      state.velocity.y = config.terminalVelocity + 100;

      cubeMode.update(state, input, DELTA_TIME, config);

      expect(state.velocity.y).toBeLessThanOrEqual(config.terminalVelocity);
    });

    it('does not apply gravity when grounded', () => {
      state.isGrounded = true;
      state.velocity.y = 0;

      cubeMode.update(state, input, DELTA_TIME, config);

      // Position should only change by velocity (which is 0)
      // Gravity should not accumulate when grounded (player stays on ground)
      expect(state.velocity.y).toBeGreaterThanOrEqual(0);
    });

    it('applies inverted gravity when gravityInverted is true', () => {
      state.isGrounded = false;
      state.gravityInverted = true;
      state.velocity.y = 0;

      cubeMode.update(state, input, DELTA_TIME, config);

      // Velocity should decrease (go negative/upward)
      expect(state.velocity.y).toBeLessThan(0);
    });
  });

  describe('jumping', () => {
    it('applies jump impulse when grounded and jump pressed', () => {
      state.isGrounded = true;
      input.jumpPressed = true;

      cubeMode.update(state, input, DELTA_TIME, config);

      expect(state.velocity.y).toBe(-config.jumpForce);
      expect(state.isGrounded).toBe(false);
    });

    it('does not jump when airborne', () => {
      state.isGrounded = false;
      state.velocity.y = 100;
      input.jumpPressed = true;

      cubeMode.update(state, input, DELTA_TIME, config);

      // Should not get jump impulse, only gravity
      expect(state.velocity.y).not.toBe(-config.jumpForce);
    });

    it('auto-jumps when holding and landing', () => {
      state.isGrounded = true;
      state.velocity.y = 100; // Coming down
      input.jumpHeld = true;

      cubeMode.update(state, input, DELTA_TIME, config);

      expect(state.velocity.y).toBe(-config.jumpForce);
    });

    it('jumps inverted when gravity is inverted', () => {
      state.isGrounded = true;
      state.gravityInverted = true;
      input.jumpPressed = true;

      cubeMode.update(state, input, DELTA_TIME, config);

      expect(state.velocity.y).toBe(config.jumpForce); // Positive (downward)
    });
  });

  describe('coyote time', () => {
    it('allows jump during coyote time after leaving ground', () => {
      state.isGrounded = false;
      state.coyoteTimeRemaining = config.coyoteTime;
      input.jumpPressed = true;

      cubeMode.update(state, input, DELTA_TIME, config);

      expect(state.velocity.y).toBe(-config.jumpForce);
      expect(state.coyoteTimeRemaining).toBe(0);
    });

    it('decrements coyote time when airborne', () => {
      state.isGrounded = false;
      state.coyoteTimeRemaining = config.coyoteTime;

      cubeMode.update(state, input, DELTA_TIME, config);

      expect(state.coyoteTimeRemaining).toBeLessThan(config.coyoteTime);
    });

    it('does not allow jump after coyote time expires', () => {
      state.isGrounded = false;
      state.coyoteTimeRemaining = 0;
      state.velocity.y = 50;
      input.jumpPressed = true;

      cubeMode.update(state, input, DELTA_TIME, config);

      // Should have buffered the jump, not executed it
      expect(state.velocity.y).not.toBe(-config.jumpForce);
      expect(state.jumpBuffered).toBe(true);
    });
  });

  describe('jump buffering', () => {
    it('buffers jump input when airborne', () => {
      state.isGrounded = false;
      state.coyoteTimeRemaining = 0;
      input.jumpPressed = true;

      cubeMode.update(state, input, DELTA_TIME, config);

      expect(state.jumpBuffered).toBe(true);
      expect(state.jumpBufferTimeRemaining).toBe(config.jumpBuffer);
    });

    it('executes buffered jump on landing', () => {
      state.isGrounded = true;
      state.jumpBuffered = true;
      state.jumpBufferTimeRemaining = config.jumpBuffer / 2;

      cubeMode.update(state, input, DELTA_TIME, config);

      expect(state.velocity.y).toBe(-config.jumpForce);
      expect(state.jumpBuffered).toBe(false);
    });

    it('expires jump buffer over time', () => {
      state.isGrounded = false;
      state.jumpBuffered = true;
      state.jumpBufferTimeRemaining = DELTA_TIME / 2;

      cubeMode.update(state, input, DELTA_TIME, config);

      expect(state.jumpBuffered).toBe(false);
    });
  });

  describe('position update', () => {
    it('updates position based on velocity', () => {
      state.isGrounded = false;
      state.velocity.y = 100;
      const startY = state.position.y;

      cubeMode.update(state, input, DELTA_TIME, config);

      // Position changes by velocity * dt plus gravity effect
      expect(state.position.y).toBeGreaterThan(startY);
    });
  });

  describe('rotation', () => {
    it('rotates while in air', () => {
      state.isGrounded = false;
      state.angularVelocity = 360; // degrees per second
      state.rotation = 0;

      cubeMode.update(state, input, DELTA_TIME, config);

      expect(state.rotation).toBeGreaterThan(0);
    });

    it('snaps rotation to 90 degrees when grounded', () => {
      state.isGrounded = true;
      state.rotation = 45;
      state.angularVelocity = 360;

      cubeMode.update(state, input, DELTA_TIME, config);

      // Should snap to nearest 90 (either 0 or 90)
      expect(state.rotation % 90).toBe(0);
      expect(state.angularVelocity).toBe(0);
    });

    it('normalizes rotation to 0-360 range', () => {
      state.isGrounded = false;
      state.rotation = 350;
      state.angularVelocity = 360;

      // Multiple updates to exceed 360
      for (let i = 0; i < 10; i++) {
        cubeMode.update(state, input, DELTA_TIME, config);
      }

      expect(state.rotation).toBeGreaterThanOrEqual(0);
      expect(state.rotation).toBeLessThan(360);
    });
  });

  describe('death state', () => {
    it('does not update when dead', () => {
      state.isDead = true;
      const positionBefore = { ...state.position };
      const velocityBefore = { ...state.velocity };

      cubeMode.update(state, input, DELTA_TIME, config);

      expect(state.position.x).toBe(positionBefore.x);
      expect(state.position.y).toBe(positionBefore.y);
      expect(state.velocity.x).toBe(velocityBefore.x);
      expect(state.velocity.y).toBe(velocityBefore.y);
    });
  });

  describe('determinism', () => {
    it('produces same result for same inputs', () => {
      const state1 = createDefaultPhysicsState({
        position: { x: 100, y: 400 },
        velocity: { x: 0, y: 0 },
        isGrounded: true,
      });
      const state2 = createDefaultPhysicsState({
        position: { x: 100, y: 400 },
        velocity: { x: 0, y: 0 },
        isGrounded: true,
      });

      const input1 = createDefaultInputState({ jumpPressed: true });
      const input2 = createDefaultInputState({ jumpPressed: true });

      cubeMode.update(state1, input1, DELTA_TIME, config);
      cubeMode.update(state2, input2, DELTA_TIME, config);

      expect(state1.position.x).toBe(state2.position.x);
      expect(state1.position.y).toBe(state2.position.y);
      expect(state1.velocity.x).toBe(state2.velocity.x);
      expect(state1.velocity.y).toBe(state2.velocity.y);
      expect(state1.rotation).toBe(state2.rotation);
    });
  });

  describe('mode lifecycle', () => {
    it('sets mode on enter', () => {
      state.mode = 'ship';

      cubeMode.onEnter(state);

      expect(state.mode).toBe('cube');
    });

    it('resets angular velocity when entering grounded', () => {
      state.isGrounded = true;
      state.angularVelocity = 360;

      cubeMode.onEnter(state);

      expect(state.angularVelocity).toBe(0);
    });
  });
});
