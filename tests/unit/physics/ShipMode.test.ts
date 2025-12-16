/**
 * ShipMode physics tests.
 * Tests for thrust-based flight mechanics.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { ShipMode } from '../../../src/core/physics/modes/ShipMode';
import { PHYSICS } from '../../../src/core/physics/constants';
import {
  createDefaultPhysicsState,
  createDefaultPhysicsConfig,
  createDefaultInputState,
} from '../../../src/core/physics/types';

import type { PhysicsState, PhysicsConfig, InputState } from '../../../src/core/physics/types';

describe('ShipMode', () => {
  let shipMode: ShipMode;
  let state: PhysicsState;
  let config: PhysicsConfig;
  let input: InputState;

  const DELTA_TIME = 1 / 60; // 60 FPS

  beforeEach(() => {
    shipMode = new ShipMode();
    state = createDefaultPhysicsState({
      position: { x: 100, y: 300 },
      mode: 'ship',
    });
    config = createDefaultPhysicsConfig();
    input = createDefaultInputState();
  });

  describe('name', () => {
    it('has correct mode name', () => {
      expect(shipMode.name).toBe('ship');
    });
  });

  describe('gravity', () => {
    it('applies reduced gravity when not thrusting', () => {
      state.velocity.y = 0;
      input.jumpHeld = false;

      shipMode.update(state, input, DELTA_TIME, config);

      // Ship gravity is 40% of normal
      const expectedVelocity = config.gravity * PHYSICS.SHIP_GRAVITY_MULTIPLIER * DELTA_TIME;
      expect(state.velocity.y).toBeCloseTo(expectedVelocity, 5);
    });

    it('applies inverted reduced gravity when gravityInverted is true', () => {
      state.gravityInverted = true;
      state.velocity.y = 0;
      input.jumpHeld = false;

      shipMode.update(state, input, DELTA_TIME, config);

      // Should go negative (upward)
      expect(state.velocity.y).toBeLessThan(0);
    });

    it('respects terminal velocity', () => {
      const shipTerminalVelocity = config.terminalVelocity * 0.8;
      state.velocity.y = shipTerminalVelocity + 100;

      shipMode.update(state, input, DELTA_TIME, config);

      expect(state.velocity.y).toBeLessThanOrEqual(shipTerminalVelocity);
    });
  });

  describe('thrust', () => {
    it('applies upward thrust when holding jump', () => {
      state.velocity.y = 0;
      input.jumpHeld = true;

      shipMode.update(state, input, DELTA_TIME, config);

      // Thrust should make velocity negative (upward)
      expect(state.velocity.y).toBeLessThan(0);
    });

    it('applies thrust correctly with inverted gravity', () => {
      state.gravityInverted = true;
      state.velocity.y = 0;
      input.jumpHeld = true;

      shipMode.update(state, input, DELTA_TIME, config);

      // Thrust should push opposite to gravity direction
      // With inverted gravity, thrust should be positive (downward)
      expect(state.velocity.y).toBeGreaterThan(0);
    });

    it('continuous thrust counteracts gravity', () => {
      input.jumpHeld = true;

      // Simulate several frames of thrusting
      for (let i = 0; i < 10; i++) {
        shipMode.update(state, input, DELTA_TIME, config);
      }

      // Velocity should be negative (rising)
      expect(state.velocity.y).toBeLessThan(0);
    });

    it('releasing thrust causes falling', () => {
      // First thrust up
      input.jumpHeld = true;
      for (let i = 0; i < 20; i++) {
        shipMode.update(state, input, DELTA_TIME, config);
      }

      const velocityAfterThrust = state.velocity.y;
      expect(velocityAfterThrust).toBeLessThan(0);

      // Now release and fall
      input.jumpHeld = false;
      for (let i = 0; i < 30; i++) {
        shipMode.update(state, input, DELTA_TIME, config);
      }

      // Should now be falling (velocity increased/positive)
      expect(state.velocity.y).toBeGreaterThan(velocityAfterThrust);
    });
  });

  describe('position update', () => {
    it('updates position based on velocity', () => {
      state.velocity.y = -100; // Moving up
      const startY = state.position.y;

      shipMode.update(state, input, DELTA_TIME, config);

      // Position should decrease (moving up)
      expect(state.position.y).toBeLessThan(startY);
    });
  });

  describe('rotation (tilt)', () => {
    it('tilts upward when rising', () => {
      state.velocity.y = -300; // Rising fast
      state.rotation = 0;

      shipMode.update(state, input, DELTA_TIME, config);

      // Should tilt negative (nose up)
      expect(state.rotation).toBeLessThan(0);
    });

    it('tilts downward when falling', () => {
      state.velocity.y = 300; // Falling fast
      state.rotation = 0;

      shipMode.update(state, input, DELTA_TIME, config);

      // Should tilt positive (nose down)
      expect(state.rotation).toBeGreaterThan(0);
    });

    it('limits tilt to max angle', () => {
      state.velocity.y = 1000; // Very fast fall
      state.rotation = 0;

      // Multiple updates to reach max tilt
      for (let i = 0; i < 60; i++) {
        shipMode.update(state, input, DELTA_TIME, config);
      }

      // Should not exceed ~30 degrees
      expect(Math.abs(state.rotation)).toBeLessThanOrEqual(35);
    });

    it('inverts tilt when gravity is inverted', () => {
      state.gravityInverted = true;
      state.velocity.y = 300; // Falling in inverted gravity
      state.rotation = 0;

      shipMode.update(state, input, DELTA_TIME, config);

      // Tilt direction should be inverted
      expect(state.rotation).toBeLessThan(0);
    });
  });

  describe('death state', () => {
    it('does not update when dead', () => {
      state.isDead = true;
      const positionBefore = { ...state.position };
      const velocityBefore = { ...state.velocity };

      shipMode.update(state, input, DELTA_TIME, config);

      expect(state.position.x).toBe(positionBefore.x);
      expect(state.position.y).toBe(positionBefore.y);
      expect(state.velocity.x).toBe(velocityBefore.x);
      expect(state.velocity.y).toBe(velocityBefore.y);
    });
  });

  describe('determinism', () => {
    it('produces same result for same inputs', () => {
      const state1 = createDefaultPhysicsState({
        position: { x: 100, y: 300 },
        velocity: { x: 0, y: 0 },
        mode: 'ship',
      });
      const state2 = createDefaultPhysicsState({
        position: { x: 100, y: 300 },
        velocity: { x: 0, y: 0 },
        mode: 'ship',
      });

      const input1 = createDefaultInputState({ jumpHeld: true });
      const input2 = createDefaultInputState({ jumpHeld: true });

      // Run multiple updates
      for (let i = 0; i < 10; i++) {
        shipMode.update(state1, input1, DELTA_TIME, config);
        shipMode.update(state2, input2, DELTA_TIME, config);
      }

      expect(state1.position.x).toBe(state2.position.x);
      expect(state1.position.y).toBe(state2.position.y);
      expect(state1.velocity.x).toBe(state2.velocity.x);
      expect(state1.velocity.y).toBe(state2.velocity.y);
      expect(state1.rotation).toBe(state2.rotation);
    });
  });

  describe('mode lifecycle', () => {
    it('sets mode on enter', () => {
      state.mode = 'cube';

      shipMode.onEnter(state);

      expect(state.mode).toBe('ship');
    });

    it('resets rotation on enter', () => {
      state.rotation = 45;
      state.angularVelocity = 360;

      shipMode.onEnter(state);

      expect(state.rotation).toBe(0);
      expect(state.angularVelocity).toBe(0);
    });

    it('clears jump buffer state on enter', () => {
      state.jumpBuffered = true;
      state.jumpBufferTimeRemaining = 0.1;
      state.coyoteTimeRemaining = 0.08;

      shipMode.onEnter(state);

      expect(state.jumpBuffered).toBe(false);
      expect(state.jumpBufferTimeRemaining).toBe(0);
      expect(state.coyoteTimeRemaining).toBe(0);
    });
  });

  describe('flight behavior', () => {
    it('can maintain altitude with intermittent thrust', () => {
      const startY = state.position.y;

      // Simulate intermittent thrust (like rapid tapping)
      for (let i = 0; i < 60; i++) {
        input.jumpHeld = i % 4 < 2; // Hold 2 frames, release 2 frames
        shipMode.update(state, input, DELTA_TIME, config);
      }

      // Should be roughly at similar altitude (within reasonable range)
      const deltaY = Math.abs(state.position.y - startY);
      expect(deltaY).toBeLessThan(200); // Should not have flown too far
    });

    it('does not use discrete jumps like cube mode', () => {
      state.velocity.y = 0;
      input.jumpPressed = true; // Single press (not hold)
      input.jumpHeld = false;

      shipMode.update(state, input, DELTA_TIME, config);

      // Ship should not respond to single press like cube does
      // Only gravity should apply
      const expectedGravityEffect = config.gravity * PHYSICS.SHIP_GRAVITY_MULTIPLIER * DELTA_TIME;
      expect(state.velocity.y).toBeCloseTo(expectedGravityEffect, 5);
    });
  });
});
