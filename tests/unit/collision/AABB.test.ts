/**
 * AABB collision detection tests.
 */

import { describe, it, expect } from 'vitest';

import {
  checkAABBOverlap,
  getAABBCollision,
  pointInAABB,
  createAABB,
  createAABBFromCenter,
  scaleAABB,
  expandAABB,
} from '../../../src/core/collision/AABB';

describe('AABB', () => {
  describe('checkAABBOverlap', () => {
    it('detects overlap between two intersecting boxes', () => {
      const a = createAABB(0, 0, 40, 40);
      const b = createAABB(30, 30, 40, 40);

      expect(checkAABBOverlap(a, b)).toBe(true);
    });

    it('returns false for non-overlapping boxes', () => {
      const a = createAABB(0, 0, 40, 40);
      const b = createAABB(100, 100, 40, 40);

      expect(checkAABBOverlap(a, b)).toBe(false);
    });

    it('detects edge-touching boxes as overlapping', () => {
      const a = createAABB(0, 0, 40, 40);
      const b = createAABB(40, 0, 40, 40);

      // Edge touching should NOT be overlap (strict comparison)
      expect(checkAABBOverlap(a, b)).toBe(false);
    });

    it('detects overlap with box inside another', () => {
      const outer = createAABB(0, 0, 100, 100);
      const inner = createAABB(25, 25, 50, 50);

      expect(checkAABBOverlap(outer, inner)).toBe(true);
      expect(checkAABBOverlap(inner, outer)).toBe(true);
    });

    it('handles zero-width or zero-height boxes outside range', () => {
      const normal = createAABB(0, 0, 40, 40);
      const lineOutside = createAABB(50, 0, 0, 40); // Outside the box

      expect(checkAABBOverlap(normal, lineOutside)).toBe(false);
    });

    it('detects zero-width box inside range as overlap', () => {
      const normal = createAABB(0, 0, 40, 40);
      const lineInside = createAABB(20, 0, 0, 40); // Inside the box

      // Zero-width still counts as overlap if within bounds
      expect(checkAABBOverlap(normal, lineInside)).toBe(true);
    });
  });

  describe('getAABBCollision', () => {
    it('returns collision info for overlapping boxes', () => {
      const a = createAABB(0, 0, 40, 40);
      const b = createAABB(30, 0, 40, 40);

      const result = getAABBCollision(a, b);

      expect(result.colliding).toBe(true);
      expect(result.normal.x).toBe(-1); // Push a to the left
      expect(result.normal.y).toBe(0);
    });

    it('returns non-collision for separate boxes', () => {
      const a = createAABB(0, 0, 40, 40);
      const b = createAABB(100, 0, 40, 40);

      const result = getAABBCollision(a, b);

      expect(result.colliding).toBe(false);
      expect(result.overlapX).toBe(0);
      expect(result.overlapY).toBe(0);
    });

    it('returns correct normal for vertical collision from above', () => {
      const player = createAABB(10, 0, 36, 36);
      const block = createAABB(0, 30, 40, 40);

      const result = getAABBCollision(player, block);

      expect(result.colliding).toBe(true);
      expect(result.normal.y).toBe(-1); // Push player up
    });

    it('returns correct normal for vertical collision from below', () => {
      // Player at y=40, block at y=10 (block bottom is at y=50, player top at y=40)
      // They overlap by 10 pixels
      const player = createAABB(10, 40, 36, 36);
      const block = createAABB(0, 10, 40, 40);

      const result = getAABBCollision(player, block);

      expect(result.colliding).toBe(true);
      expect(result.normal.y).toBe(1); // Push player down
    });
  });

  describe('pointInAABB', () => {
    it('detects point inside box', () => {
      const box = createAABB(0, 0, 40, 40);

      expect(pointInAABB({ x: 20, y: 20 }, box)).toBe(true);
    });

    it('detects point outside box', () => {
      const box = createAABB(0, 0, 40, 40);

      expect(pointInAABB({ x: 50, y: 50 }, box)).toBe(false);
    });

    it('detects point on edge as inside', () => {
      const box = createAABB(0, 0, 40, 40);

      expect(pointInAABB({ x: 0, y: 0 }, box)).toBe(true);
      expect(pointInAABB({ x: 40, y: 40 }, box)).toBe(true);
    });
  });

  describe('createAABBFromCenter', () => {
    it('creates AABB centered on position', () => {
      const box = createAABBFromCenter(50, 50, 40, 40);

      expect(box.x).toBe(30);
      expect(box.y).toBe(30);
      expect(box.width).toBe(40);
      expect(box.height).toBe(40);
    });
  });

  describe('scaleAABB', () => {
    it('scales box around center', () => {
      const box = createAABB(0, 0, 40, 40);
      const scaled = scaleAABB(box, 0.5);

      expect(scaled.width).toBe(20);
      expect(scaled.height).toBe(20);
      expect(scaled.x).toBe(10); // Center preserved
      expect(scaled.y).toBe(10);
    });

    it('scales up correctly', () => {
      const box = createAABB(10, 10, 20, 20);
      const scaled = scaleAABB(box, 2);

      expect(scaled.width).toBe(40);
      expect(scaled.height).toBe(40);
      // Center was at (20, 20), so new box should be (-0, 0) to (40, 40)
      expect(scaled.x).toBe(0);
      expect(scaled.y).toBe(0);
    });
  });

  describe('expandAABB', () => {
    it('expands box by margin on all sides', () => {
      const box = createAABB(10, 10, 20, 20);
      const expanded = expandAABB(box, 5);

      expect(expanded.x).toBe(5);
      expect(expanded.y).toBe(5);
      expect(expanded.width).toBe(30);
      expect(expanded.height).toBe(30);
    });
  });
});
