/**
 * Axis-Aligned Bounding Box (AABB) for collision detection.
 * Framework-agnostic implementation.
 */

import type { Vector2 } from '../physics/types';

/** Axis-Aligned Bounding Box */
export interface AABB {
  /** X position (left edge) */
  x: number;

  /** Y position (top edge) */
  y: number;

  /** Width of the box */
  width: number;

  /** Height of the box */
  height: number;
}

/** Collision result with penetration depth */
export interface CollisionResult {
  /** Whether the boxes are colliding */
  colliding: boolean;

  /** Overlap on X axis (positive = overlapping from left, negative = from right) */
  overlapX: number;

  /** Overlap on Y axis (positive = overlapping from top, negative = from bottom) */
  overlapY: number;

  /** Normal vector pointing from B to A (direction to push A) */
  normal: Vector2;
}

/**
 * Check if two AABBs are overlapping.
 * @param a First bounding box
 * @param b Second bounding box
 * @returns True if the boxes overlap
 */
export function checkAABBOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  );
}

/**
 * Get detailed collision information between two AABBs.
 * @param a First bounding box (typically the moving object)
 * @param b Second bounding box (typically the static object)
 * @returns Collision result with penetration depth and normal
 */
export function getAABBCollision(a: AABB, b: AABB): CollisionResult {
  // Calculate centers
  const aCenterX = a.x + a.width / 2;
  const aCenterY = a.y + a.height / 2;
  const bCenterX = b.x + b.width / 2;
  const bCenterY = b.y + b.height / 2;

  // Calculate half extents
  const aHalfWidth = a.width / 2;
  const aHalfHeight = a.height / 2;
  const bHalfWidth = b.width / 2;
  const bHalfHeight = b.height / 2;

  // Calculate difference between centers
  const dx = aCenterX - bCenterX;
  const dy = aCenterY - bCenterY;

  // Calculate overlap on each axis
  const overlapX = aHalfWidth + bHalfWidth - Math.abs(dx);
  const overlapY = aHalfHeight + bHalfHeight - Math.abs(dy);

  // No collision if no overlap on either axis
  if (overlapX <= 0 || overlapY <= 0) {
    return {
      colliding: false,
      overlapX: 0,
      overlapY: 0,
      normal: { x: 0, y: 0 },
    };
  }

  // Determine collision normal based on smallest overlap
  let normalX = 0;
  let normalY = 0;
  let finalOverlapX = overlapX;
  let finalOverlapY = overlapY;

  if (overlapX < overlapY) {
    // Horizontal collision
    normalX = dx > 0 ? 1 : -1;
    finalOverlapX = overlapX * normalX;
    finalOverlapY = 0;
  } else {
    // Vertical collision
    normalY = dy > 0 ? 1 : -1;
    finalOverlapX = 0;
    finalOverlapY = overlapY * normalY;
  }

  return {
    colliding: true,
    overlapX: finalOverlapX,
    overlapY: finalOverlapY,
    normal: { x: normalX, y: normalY },
  };
}

/**
 * Check if point is inside an AABB.
 * @param point The point to test
 * @param box The bounding box
 * @returns True if point is inside the box
 */
export function pointInAABB(point: Vector2, box: AABB): boolean {
  return (
    point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height
  );
}

/**
 * Create an AABB centered on a position.
 * @param centerX Center X position
 * @param centerY Center Y position
 * @param width Box width
 * @param height Box height
 * @returns AABB with the specified dimensions
 */
export function createAABBFromCenter(
  centerX: number,
  centerY: number,
  width: number,
  height: number
): AABB {
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

/**
 * Create an AABB from top-left corner.
 * @param x Left edge X position
 * @param y Top edge Y position
 * @param width Box width
 * @param height Box height
 * @returns AABB with the specified dimensions
 */
export function createAABB(x: number, y: number, width: number, height: number): AABB {
  return { x, y, width, height };
}

/**
 * Expand an AABB by a margin on all sides.
 * @param box Original bounding box
 * @param margin Amount to expand by
 * @returns New expanded AABB
 */
export function expandAABB(box: AABB, margin: number): AABB {
  return {
    x: box.x - margin,
    y: box.y - margin,
    width: box.width + margin * 2,
    height: box.height + margin * 2,
  };
}

/**
 * Scale an AABB around its center.
 * @param box Original bounding box
 * @param scale Scale factor (1.0 = no change)
 * @returns New scaled AABB
 */
export function scaleAABB(box: AABB, scale: number): AABB {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const newWidth = box.width * scale;
  const newHeight = box.height * scale;

  return {
    x: centerX - newWidth / 2,
    y: centerY - newHeight / 2,
    width: newWidth,
    height: newHeight,
  };
}
