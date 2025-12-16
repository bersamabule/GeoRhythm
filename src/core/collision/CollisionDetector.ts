/**
 * Collision detection system for game objects.
 * Framework-agnostic implementation.
 */

import type { ObjectTypeType } from '@generated/index';

import type { CollisionLayerType } from '../physics/constants';
import { CollisionLayer, HITBOXES, GRID } from '../physics/constants';

import type { AABB, CollisionResult } from './AABB';
import { checkAABBOverlap, getAABBCollision, scaleAABB, createAABBFromCenter } from './AABB';

/** Collidable object interface */
export interface Collidable {
  /** Position in pixels (center of object) */
  x: number;
  y: number;

  /** Visual width in pixels */
  width: number;

  /** Visual height in pixels */
  height: number;

  /** Object type for collision behavior */
  type: ObjectTypeType;

  /** Collision layer for filtering */
  collisionLayer: CollisionLayerType;

  /** Whether this object is active */
  active: boolean;
}

/** Collision event data */
export interface CollisionEvent {
  /** The object that was hit */
  object: Collidable;

  /** Type of the object hit */
  type: ObjectTypeType;

  /** Collision details */
  collision: CollisionResult;

  /** Whether this should trigger death */
  isHazard: boolean;

  /** Whether this is a solid collision (blocks movement) */
  isSolid: boolean;

  /** Whether this is an interactive object (orbs, pads) */
  isInteractive: boolean;
}

/** Get hitbox scale for an object type */
function getHitboxScale(type: ObjectTypeType): number {
  switch (type) {
    case 'spike':
    case 'spikeInverted':
      return HITBOXES.SPIKE;
    case 'orbYellow':
    case 'orbBlue':
      return HITBOXES.ORB;
    case 'block':
      return HITBOXES.BLOCK;
    default:
      return 1.0;
  }
}

/** Get collision layer for an object type */
export function getCollisionLayer(type: ObjectTypeType): CollisionLayerType {
  switch (type) {
    case 'block':
      return CollisionLayer.SOLID;
    case 'spike':
    case 'spikeInverted':
      return CollisionLayer.HAZARD;
    case 'padYellow':
    case 'padPink':
    case 'orbYellow':
    case 'orbBlue':
      return CollisionLayer.INTERACTIVE;
    case 'portalGravity':
    case 'portalMode':
    case 'portalSpeed':
      return CollisionLayer.PORTAL;
    case 'checkpoint':
      return CollisionLayer.TRIGGER;
    case 'decoration':
    default:
      return CollisionLayer.NONE;
  }
}

/**
 * Get the AABB hitbox for an object.
 * @param obj The object to get the hitbox for
 * @returns Scaled AABB hitbox
 */
export function getObjectHitbox(obj: Collidable): AABB {
  const scale = getHitboxScale(obj.type);
  const baseBox = createAABBFromCenter(obj.x, obj.y, obj.width, obj.height);
  return scaleAABB(baseBox, scale);
}

/**
 * Get the AABB hitbox for the player.
 * @param x Player center X
 * @param y Player center Y
 * @param width Player visual width
 * @param height Player visual height
 * @param isCube Whether player is in cube mode
 * @returns Scaled AABB hitbox
 */
export function getPlayerHitbox(
  x: number,
  y: number,
  width: number,
  height: number,
  isCube: boolean
): AABB {
  const scale = isCube ? HITBOXES.PLAYER_CUBE : HITBOXES.PLAYER_SHIP;
  const baseBox = createAABBFromCenter(x, y, width, height);
  return scaleAABB(baseBox, scale);
}

/**
 * Check collision between player and a single object.
 * @param playerHitbox Player's AABB hitbox
 * @param obj Object to check against
 * @returns Collision event if collision occurred, null otherwise
 */
export function checkPlayerObjectCollision(
  playerHitbox: AABB,
  obj: Collidable
): CollisionEvent | null {
  if (!obj.active || obj.collisionLayer === CollisionLayer.NONE) {
    return null;
  }

  const objectHitbox = getObjectHitbox(obj);

  if (!checkAABBOverlap(playerHitbox, objectHitbox)) {
    return null;
  }

  const collision = getAABBCollision(playerHitbox, objectHitbox);

  return {
    object: obj,
    type: obj.type,
    collision,
    isHazard: (obj.collisionLayer & CollisionLayer.HAZARD) !== 0,
    isSolid: (obj.collisionLayer & CollisionLayer.SOLID) !== 0,
    isInteractive: (obj.collisionLayer & CollisionLayer.INTERACTIVE) !== 0,
  };
}

/**
 * Check collision between player and multiple objects.
 * @param playerHitbox Player's AABB hitbox
 * @param objects Array of objects to check
 * @returns Array of collision events
 */
export function checkPlayerCollisions(playerHitbox: AABB, objects: Collidable[]): CollisionEvent[] {
  const collisions: CollisionEvent[] = [];

  for (const obj of objects) {
    const event = checkPlayerObjectCollision(playerHitbox, obj);
    if (event !== null) {
      collisions.push(event);
    }
  }

  return collisions;
}

/**
 * Check if player is on ground (touching a solid from above).
 * @param playerHitbox Player's AABB hitbox
 * @param objects Array of solid objects
 * @param tolerance Vertical distance tolerance in pixels
 * @returns True if player is grounded
 */
export function checkGrounded(
  playerHitbox: AABB,
  objects: Collidable[],
  tolerance: number = 2
): boolean {
  // Create a thin box below the player to check for ground
  const groundCheckBox: AABB = {
    x: playerHitbox.x + 2, // Slightly inset to avoid edge cases
    y: playerHitbox.y + playerHitbox.height,
    width: playerHitbox.width - 4,
    height: tolerance,
  };

  for (const obj of objects) {
    if (!obj.active || (obj.collisionLayer & CollisionLayer.SOLID) === 0) {
      continue;
    }

    const objectHitbox = getObjectHitbox(obj);
    if (checkAABBOverlap(groundCheckBox, objectHitbox)) {
      return true;
    }
  }

  // Also check for default ground level
  const groundY = GRID.DEFAULT_GROUND_Y * GRID.UNIT_SIZE;
  const playerBottom = playerHitbox.y + playerHitbox.height;
  if (playerBottom >= groundY - tolerance && playerBottom <= groundY + tolerance) {
    return true;
  }

  return false;
}

/**
 * Get all visible objects in the viewport.
 * @param objects All level objects
 * @param viewportLeft Left edge of viewport in pixels
 * @param viewportRight Right edge of viewport in pixels
 * @param margin Extra margin to include objects just outside view
 * @returns Array of visible objects
 */
export function getVisibleObjects(
  objects: Collidable[],
  viewportLeft: number,
  viewportRight: number,
  margin: number = 100
): Collidable[] {
  const left = viewportLeft - margin;
  const right = viewportRight + margin;

  return objects.filter((obj) => {
    const objLeft = obj.x - obj.width / 2;
    const objRight = obj.x + obj.width / 2;
    return objRight >= left && objLeft <= right && obj.active;
  });
}
