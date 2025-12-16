/**
 * Physics constants tests.
 */

import { describe, it, expect } from 'vitest';

import {
  PHYSICS,
  SPEEDS,
  GRID,
  HITBOXES,
  SIZES,
  CollisionLayer,
} from '../../../src/core/physics/constants';

describe('Physics Constants', () => {
  describe('PHYSICS', () => {
    it('has positive gravity', () => {
      expect(PHYSICS.GRAVITY).toBeGreaterThan(0);
    });

    it('has positive jump force', () => {
      expect(PHYSICS.JUMP_FORCE).toBeGreaterThan(0);
    });

    it('has terminal velocity greater than jump force', () => {
      expect(PHYSICS.TERMINAL_VELOCITY).toBeGreaterThan(PHYSICS.JUMP_FORCE);
    });

    it('has reasonable coyote time (under 0.2 seconds)', () => {
      expect(PHYSICS.COYOTE_TIME).toBeGreaterThan(0);
      expect(PHYSICS.COYOTE_TIME).toBeLessThan(0.2);
    });

    it('has reasonable jump buffer (under 0.2 seconds)', () => {
      expect(PHYSICS.JUMP_BUFFER).toBeGreaterThan(0);
      expect(PHYSICS.JUMP_BUFFER).toBeLessThan(0.2);
    });
  });

  describe('SPEEDS', () => {
    it('has increasing speed values', () => {
      expect(SPEEDS.slow).toBeLessThan(SPEEDS.normal);
      expect(SPEEDS.normal).toBeLessThan(SPEEDS.fast);
      expect(SPEEDS.fast).toBeLessThan(SPEEDS.faster);
      expect(SPEEDS.faster).toBeLessThan(SPEEDS.superFast);
    });

    it('has all positive speeds', () => {
      Object.values(SPEEDS).forEach((speed) => {
        expect(speed).toBeGreaterThan(0);
      });
    });
  });

  describe('GRID', () => {
    it('has standard unit size of 40', () => {
      expect(GRID.UNIT_SIZE).toBe(40);
    });

    it('has visible height less than or equal to 15 units', () => {
      expect(GRID.VISIBLE_HEIGHT).toBeLessThanOrEqual(15);
    });

    it('has ground level within visible area', () => {
      expect(GRID.DEFAULT_GROUND_Y).toBeLessThan(GRID.VISIBLE_HEIGHT);
    });

    it('has standard viewport dimensions', () => {
      expect(GRID.VIEWPORT_WIDTH).toBe(800);
      expect(GRID.VIEWPORT_HEIGHT).toBe(600);
    });
  });

  describe('HITBOXES', () => {
    it('has all hitbox scales between 0 and 1', () => {
      expect(HITBOXES.PLAYER_CUBE).toBeGreaterThan(0);
      expect(HITBOXES.PLAYER_CUBE).toBeLessThanOrEqual(1);

      expect(HITBOXES.PLAYER_SHIP).toBeGreaterThan(0);
      expect(HITBOXES.PLAYER_SHIP).toBeLessThanOrEqual(1);

      expect(HITBOXES.SPIKE).toBeGreaterThan(0);
      expect(HITBOXES.SPIKE).toBeLessThanOrEqual(1);

      expect(HITBOXES.ORB).toBeGreaterThan(0);
      expect(HITBOXES.ORB).toBeLessThanOrEqual(1);
    });

    it('spike hitbox is smaller than player for forgiveness', () => {
      expect(HITBOXES.SPIKE).toBeLessThan(HITBOXES.PLAYER_CUBE);
    });
  });

  describe('SIZES', () => {
    it('has all sizes as positive integers', () => {
      expect(SIZES.PLAYER).toBeGreaterThan(0);
      expect(SIZES.BLOCK).toBeGreaterThan(0);
      expect(SIZES.SPIKE).toBeGreaterThan(0);
      expect(SIZES.ORB).toBeGreaterThan(0);
    });

    it('player and block are same size', () => {
      expect(SIZES.PLAYER).toBe(SIZES.BLOCK);
    });
  });

  describe('CollisionLayer', () => {
    it('has unique layer values', () => {
      const values = [
        CollisionLayer.NONE,
        CollisionLayer.SOLID,
        CollisionLayer.HAZARD,
        CollisionLayer.INTERACTIVE,
        CollisionLayer.PORTAL,
        CollisionLayer.TRIGGER,
      ];

      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('has NONE equal to 0', () => {
      expect(CollisionLayer.NONE).toBe(0);
    });

    it('layers are powers of 2 for bitwise operations', () => {
      expect(CollisionLayer.SOLID).toBe(1);
      expect(CollisionLayer.HAZARD).toBe(2);
      expect(CollisionLayer.INTERACTIVE).toBe(4);
      expect(CollisionLayer.PORTAL).toBe(8);
      expect(CollisionLayer.TRIGGER).toBe(16);
    });

    it('allows combining layers with bitwise OR', () => {
      const combined = CollisionLayer.SOLID | CollisionLayer.HAZARD;
      expect(combined & CollisionLayer.SOLID).toBeTruthy();
      expect(combined & CollisionLayer.HAZARD).toBeTruthy();
      expect(combined & CollisionLayer.INTERACTIVE).toBeFalsy();
    });
  });
});
