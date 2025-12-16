/**
 * Game configuration derived from JSON schema defaults.
 * This provides runtime configuration with proper defaults.
 */

import { PHYSICS, SPEEDS, GRID, HITBOXES } from '@core/physics/constants';

/** Display configuration */
export interface DisplayConfig {
  width: number;
  height: number;
  targetFPS: number;
  pixelArt: boolean;
  antialias: boolean;
}

/** Physics configuration */
export interface PhysicsConfigValues {
  gravity: number;
  jumpForce: number;
  terminalVelocity: number;
  coyoteTime: number;
  jumpBuffer: number;
  shipGravityMultiplier: number;
  shipThrustForce: number;
}

/** Speed configuration */
export interface SpeedConfig {
  slow: number;
  normal: number;
  fast: number;
  faster: number;
  superFast: number;
}

/** Camera configuration */
export interface CameraConfig {
  lookAheadX: number;
  smoothingY: number;
  deadZoneY: number;
}

/** Audio configuration */
export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

/** Grid configuration */
export interface GridConfig {
  unitSize: number;
  visibleHeight: number;
  defaultGroundY: number;
}

/** Hitbox configuration */
export interface HitboxConfig {
  playerCube: number;
  playerShip: number;
  spike: number;
  orb: number;
}

/** Complete game configuration */
export interface GameConfig {
  display: DisplayConfig;
  physics: PhysicsConfigValues;
  speeds: SpeedConfig;
  camera: CameraConfig;
  audio: AudioConfig;
  grid: GridConfig;
  hitboxes: HitboxConfig;
}

/** Complete game configuration with all defaults applied */
export const gameConfig: GameConfig = {
  display: {
    width: GRID.VIEWPORT_WIDTH,
    height: GRID.VIEWPORT_HEIGHT,
    targetFPS: 60,
    pixelArt: false,
    antialias: true,
  },
  physics: {
    gravity: PHYSICS.GRAVITY,
    jumpForce: PHYSICS.JUMP_FORCE,
    terminalVelocity: PHYSICS.TERMINAL_VELOCITY,
    coyoteTime: PHYSICS.COYOTE_TIME,
    jumpBuffer: PHYSICS.JUMP_BUFFER,
    shipGravityMultiplier: PHYSICS.SHIP_GRAVITY_MULTIPLIER,
    shipThrustForce: PHYSICS.SHIP_THRUST_FORCE,
  },
  speeds: {
    slow: SPEEDS.slow,
    normal: SPEEDS.normal,
    fast: SPEEDS.fast,
    faster: SPEEDS.faster,
    superFast: SPEEDS.superFast,
  },
  camera: {
    lookAheadX: 200,
    smoothingY: 0.1,
    deadZoneY: 50,
  },
  audio: {
    masterVolume: 1,
    musicVolume: 0.8,
    sfxVolume: 1,
  },
  grid: {
    unitSize: GRID.UNIT_SIZE,
    visibleHeight: GRID.VISIBLE_HEIGHT,
    defaultGroundY: GRID.DEFAULT_GROUND_Y,
  },
  hitboxes: {
    playerCube: HITBOXES.PLAYER_CUBE,
    playerShip: HITBOXES.PLAYER_SHIP,
    spike: HITBOXES.SPIKE,
    orb: HITBOXES.ORB,
  },
};

/** Phaser game configuration */
export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: gameConfig.display.width,
  height: gameConfig.display.height,
  parent: 'game-container',
  backgroundColor: '#000000',
  pixelArt: gameConfig.display.pixelArt,
  antialias: gameConfig.display.antialias,
  fps: {
    target: gameConfig.display.targetFPS,
    forceSetTimeOut: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
  },
  render: {
    antialias: gameConfig.display.antialias,
    pixelArt: gameConfig.display.pixelArt,
  },
};
