/**
 * Systems exports.
 */

export { Background } from './Background';
export type { BackgroundConfig } from './Background';

export { ParticleManager } from './ParticleManager';
export type { ParticleConfig } from './ParticleManager';

export {
  ObjectPool,
  PooledBlock,
  PooledSpike,
  PooledPortal,
  PooledCheckpoint,
  PooledPad,
  PooledOrb,
} from './ObjectPool';
export type {
  Poolable,
  PooledBlockConfig,
  PooledSpikeConfig,
  PooledPortalConfig,
  PooledPortalType,
  PooledCheckpointConfig,
  PooledPadConfig,
  PadType,
  PooledOrbConfig,
  OrbType,
  ObjectPoolConfig,
} from './ObjectPool';
