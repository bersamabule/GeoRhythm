/**
 * Physics system exports.
 */

export { PHYSICS, SPEEDS, GRID, HITBOXES, SIZES, CollisionLayer } from './constants';
export type { CollisionLayerType } from './constants';

export type {
  Vector2,
  InputState,
  PhysicsState,
  PhysicsConfig,
  IPlayerMode,
} from './types';

export {
  createDefaultPhysicsState,
  createDefaultPhysicsConfig,
  createDefaultInputState,
} from './types';

export { CubeMode, cubeMode } from './modes/CubeMode';
export { ShipMode, shipMode } from './modes/ShipMode';
export { BallMode, ballMode } from './modes/BallMode';
