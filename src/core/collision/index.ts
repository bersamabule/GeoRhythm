/**
 * Collision system exports.
 */

export type { AABB, CollisionResult } from './AABB';
export {
  checkAABBOverlap,
  getAABBCollision,
  pointInAABB,
  createAABBFromCenter,
  createAABB,
  expandAABB,
  scaleAABB,
} from './AABB';

export type { Collidable, CollisionEvent } from './CollisionDetector';
export {
  getCollisionLayer,
  getObjectHitbox,
  getPlayerHitbox,
  checkPlayerObjectCollision,
  checkPlayerCollisions,
  checkGrounded,
  getVisibleObjects,
} from './CollisionDetector';
