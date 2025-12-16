/**
 * BallMode physics tests.
 * Tests for gravity-flipping ball mechanics.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { BallMode } from '../../../src/core/physics/modes/BallMode';
import {
  createDefaultPhysicsState,
  createDefaultPhysicsConfig,
  createDefaultInputState,
} from '../../../src/core/physics/types';

import type { PhysicsState, PhysicsConfig, InputState } from '../../../src/core/physics/types';

describe('BallMode', () => {
  let ballMode: BallMode;
  let state: PhysicsState;
  let config: PhysicsConfig;
  let input: InputState;

  const DELTA_TIME = 1 / 60; // 60 FPS

  beforeEach(() => {
    ballMode = new BallMode();
    state = createDefaultPhysicsState({
      position: { x: 100, y: 400 },
      mode: 'ball',
      isGrounded: true,
    });
    config = createDefaultPhysicsConfig();
    input = createDefaultInputState();
  });

  describe('name', () => {
    it('has correct mode name', () => {
      expect(ballMode.name).toBe('ball');
    });
  });

  describe('gravity', () => {
    it('applies gravity when airborne', () => {
      state.isGrounded = false;
      state.velocity.y = 0;

      ballMode.update(state, input, DELTA_TIME, config);

      const expectedVelocity = config.gravity * DELTA_TIME;
      expect(state.velocity.y).toBeCloseTo(expectedVelocity, 5);
    });

    it('applies inverted gravity when gravityInverted is true', () => {
      state.isGrounded = false;
      state.gravityInverted = true;
      state.velocity.y = 0;

      ballMode.update(state, input, DELTA_TIME, config);

      expect(state.velocity.y).toBeLessThan(0);
    });

    it('respects terminal velocity', () => {
      state.isGrounded = false;
      state.velocity.y = config.terminalVelocity + 100;

      ballMode.update(state, input, DELTA_TIME, config);

      expect(state.velocity.y).toBeLessThanOrEqual(config.terminalVelocity);
    });
  });

  describe('gravity flip', () => {
    it('flips gravity when grounded and jump pressed', () => {
      state.isGrounded = true;
      state.gravityInverted = false;
      input.jumpPressed = true;

      ballMode.update(state, input, DELTA_TIME, config);

      expect(state.gravityInverted).toBe(true);
      expect(state.isGrounded).toBe(false);
    });

    it('flips gravity back to normal on second tap', () => {
      state.isGrounded = true;
      state.gravityInverted = true;
      input.jumpPressed = true;

      ballMode.update(state, input, DELTA_TIME, config);

      expect(state.gravityInverted).toBe(false);
    });

    it('does not flip gravity when airborne', () => {
      state.isGrounded = false;
      state.gravityInverted = false;
      input.jumpPressed = true;

      ballMode.update(state, input, DELTA_TIME, config);

      expect(state.gravityInverted).toBe(false);
    });

    it('applies impulse when flipping gravity', () => {
      state.isGrounded = true;
      state.gravityInverted = false;
      state.velocity.y = 0;
      input.jumpPressed = true;

      ballMode.update(state, input, DELTA_TIME, config);

      // Should have negative velocity (moving up towards ceiling)
      expect(state.velocity.y).toBeLessThan(0);
    });

    it('applies correct impulse direction when flipping back', () => {
      state.isGrounded = true;
      state.gravityInverted = true;
      state.velocity.y = 0;
      input.jumpPressed = true;

      ballMode.update(state, input, DELTA_TIME, config);

      // Should have positive velocity (moving down towards floor)
      expect(state.velocity.y).toBeGreaterThan(0);
    });

    it('uses reduced impulse compared to cube jump', () => {
      state.isGrounded = true;
      state.gravityInverted = false;
      state.velocity.y = 0;
      input.jumpPressed = true;

      ballMode.update(state, input, DELTA_TIME, config);

      // Ball flip impulse should be less than full jump force
      const expectedMaxImpulse = config.jumpForce;
      expect(Math.abs(state.velocity.y)).toBeLessThan(expectedMaxImpulse);
    });
  });

  describe('position update', () => {
    it('updates position based on velocity', () => {
      state.isGrounded = false;
      state.velocity.y = 100;
      const startY = state.position.y;

      ballMode.update(state, input, DELTA_TIME, config);

      expect(state.position.y).toBeGreaterThan(startY);
    });
  });

  describe('rotation (rolling)', () => {
    it('rotates continuously while moving', () => {
      state.rotation = 0;

      ballMode.update(state, input, DELTA_TIME, config);

      expect(state.rotation).toBeGreaterThan(0);
    });

    it('rotates based on horizontal speed', () => {
      state.rotation = 0;
      state.speed = 'normal';

      ballMode.update(state, input, DELTA_TIME, config);
      const normalRotation = state.rotation;

      // Reset and test with fast speed
      state.rotation = 0;
      state.speed = 'fast';

      ballMode.update(state, input, DELTA_TIME, config);
      const fastRotation = state.rotation;

      // Faster speed = more rotation
      expect(fastRotation).toBeGreaterThan(normalRotation);
    });

    it('rotates in opposite direction when gravity is inverted', () => {
      state.rotation = 180;
      state.gravityInverted = false;

      ballMode.update(state, input, DELTA_TIME, config);
      const normalDirection = state.rotation - 180;

      state.rotation = 180;
      state.gravityInverted = true;

      ballMode.update(state, input, DELTA_TIME, config);
      const invertedDirection = state.rotation - 180;

      // Directions should be opposite
      expect(normalDirection * invertedDirection).toBeLessThan(0);
    });

    it('normalizes rotation to 0-360 range', () => {
      state.rotation = 350;

      // Multiple updates to exceed 360
      for (let i = 0; i < 60; i++) {
        ballMode.update(state, input, DELTA_TIME, config);
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
      const gravityBefore = state.gravityInverted;

      input.jumpPressed = true; // Would normally flip gravity
      ballMode.update(state, input, DELTA_TIME, config);

      expect(state.position.x).toBe(positionBefore.x);
      expect(state.position.y).toBe(positionBefore.y);
      expect(state.velocity.x).toBe(velocityBefore.x);
      expect(state.velocity.y).toBe(velocityBefore.y);
      expect(state.gravityInverted).toBe(gravityBefore);
    });
  });

  describe('determinism', () => {
    it('produces same result for same inputs', () => {
      const state1 = createDefaultPhysicsState({
        position: { x: 100, y: 400 },
        velocity: { x: 0, y: 0 },
        mode: 'ball',
        isGrounded: true,
      });
      const state2 = createDefaultPhysicsState({
        position: { x: 100, y: 400 },
        velocity: { x: 0, y: 0 },
        mode: 'ball',
        isGrounded: true,
      });

      const input1 = createDefaultInputState({ jumpPressed: true });
      const input2 = createDefaultInputState({ jumpPressed: true });

      ballMode.update(state1, input1, DELTA_TIME, config);
      ballMode.update(state2, input2, DELTA_TIME, config);

      expect(state1.position.x).toBe(state2.position.x);
      expect(state1.position.y).toBe(state2.position.y);
      expect(state1.velocity.x).toBe(state2.velocity.x);
      expect(state1.velocity.y).toBe(state2.velocity.y);
      expect(state1.gravityInverted).toBe(state2.gravityInverted);
      expect(state1.rotation).toBe(state2.rotation);
    });
  });

  describe('mode lifecycle', () => {
    it('sets mode on enter', () => {
      state.mode = 'cube';

      ballMode.onEnter(state);

      expect(state.mode).toBe('ball');
    });

    it('resets angular velocity on enter', () => {
      state.angularVelocity = 360;

      ballMode.onEnter(state);

      expect(state.angularVelocity).toBe(0);
    });

    it('clears jump buffer state on enter', () => {
      state.jumpBuffered = true;
      state.jumpBufferTimeRemaining = 0.1;
      state.coyoteTimeRemaining = 0.08;

      ballMode.onEnter(state);

      expect(state.jumpBuffered).toBe(false);
      expect(state.jumpBufferTimeRemaining).toBe(0);
      expect(state.coyoteTimeRemaining).toBe(0);
    });
  });

  describe('ceiling rolling', () => {
    it('can roll on ceiling with inverted gravity', () => {
      state.gravityInverted = true;
      state.isGrounded = true;
      state.velocity.y = 0;
      state.rotation = 0;

      // Simulate rolling on ceiling
      for (let i = 0; i < 30; i++) {
        ballMode.update(state, input, DELTA_TIME, config);
      }

      // Ball should still be rotating (rolling)
      expect(state.rotation).not.toBe(0);
    });

    it('gravity flip from ceiling sends ball toward floor', () => {
      state.gravityInverted = true;
      state.isGrounded = true;
      state.velocity.y = 0;
      input.jumpPressed = true;

      ballMode.update(state, input, DELTA_TIME, config);

      // After flip, gravity is normal and ball should be moving down
      expect(state.gravityInverted).toBe(false);
      expect(state.velocity.y).toBeGreaterThan(0);
    });
  });
});
