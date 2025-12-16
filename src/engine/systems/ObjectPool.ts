/**
 * Object Pool System
 * Recycles game objects to reduce garbage collection pressure.
 *
 * Instead of creating/destroying objects each level restart,
 * we acquire from pool and release back when done.
 */

import Phaser from 'phaser';

import type { Collidable } from '@core/collision';
import { GRID, SIZES, CollisionLayer } from '@core/physics';
import type { ObjectTypeType, PlayerModeType, SpeedModeType } from '@generated/index';

// =============================================================================
// Poolable Interface
// =============================================================================

/**
 * Interface for objects that can be pooled.
 * Poolable objects must be able to activate/deactivate and reset their state.
 */
export interface Poolable extends Collidable {
  /** Activate the object at a position (additional params allowed) */
  activate(gridX: number, gridY: number, ...args: unknown[]): void;

  /** Deactivate and return to pool */
  deactivate(): void;

  /** Check if object is currently active */
  isActive(): boolean;
}

// =============================================================================
// Pooled Block
// =============================================================================

export interface PooledBlockConfig {
  color?: number;
  lineColor?: number;
}

/**
 * Poolable block that can be reused.
 */
export class PooledBlock extends Phaser.GameObjects.Container implements Poolable {
  readonly type: ObjectTypeType = 'block';
  readonly collisionLayer = CollisionLayer.SOLID;

  private _active: boolean = false;
  private fill: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private gridLines: Phaser.GameObjects.Graphics;
  private highlight: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, config: PooledBlockConfig = {}) {
    super(scene, 0, 0);

    const color = config.color ?? 0x0066cc;
    const lineColor = config.lineColor ?? 0x0088ff;

    // Main fill
    this.fill = scene.add.rectangle(0, 0, SIZES.BLOCK, SIZES.BLOCK, color);
    this.add(this.fill);

    // Border
    this.border = scene.add.rectangle(0, 0, SIZES.BLOCK, SIZES.BLOCK);
    this.border.setStrokeStyle(2, lineColor);
    this.border.setFillStyle(0x000000, 0);
    this.add(this.border);

    // Inner grid pattern
    this.gridLines = scene.add.graphics();
    this.gridLines.lineStyle(1, lineColor, 0.3);
    this.gridLines.moveTo(0, -SIZES.BLOCK / 2);
    this.gridLines.lineTo(0, SIZES.BLOCK / 2);
    this.gridLines.moveTo(-SIZES.BLOCK / 2, 0);
    this.gridLines.lineTo(SIZES.BLOCK / 2, 0);
    this.gridLines.strokePath();
    this.add(this.gridLines);

    // Highlight (top edge)
    this.highlight = scene.add.rectangle(0, -SIZES.BLOCK / 2 + 2, SIZES.BLOCK - 4, 3, 0xffffff, 0.1);
    this.add(this.highlight);

    this.setDepth(100);
    this.setVisible(false);
    this.setActive(false);

    scene.add.existing(this);
  }

  activate(gridX: number, gridY: number): void {
    const pixelX = gridX * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;
    const pixelY = gridY * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;

    this.setPosition(pixelX, pixelY);
    this.setVisible(true);
    this.setActive(true);
    this._active = true;
  }

  deactivate(): void {
    this.setVisible(false);
    this.setActive(false);
    this._active = false;
  }

  isActive(): boolean {
    return this._active;
  }
}

// =============================================================================
// Pooled Spike
// =============================================================================

export interface PooledSpikeConfig {
  inverted?: boolean;
}

/**
 * Poolable spike that can be reused.
 */
export class PooledSpike extends Phaser.GameObjects.Container implements Poolable {
  readonly collisionLayer = CollisionLayer.HAZARD;

  // Override Phaser's type property with our ObjectTypeType
  type: ObjectTypeType = 'spike';

  private _active: boolean = false;
  private _inverted: boolean = false;

  private mainGraphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: PooledSpikeConfig = {}) {
    super(scene, 0, 0);

    this._inverted = config.inverted ?? false;
    this.type = this._inverted ? 'spikeInverted' : 'spike';

    // Create graphics objects
    this.mainGraphics = scene.add.graphics();
    this.glowGraphics = scene.add.graphics();

    this.add(this.glowGraphics);
    this.add(this.mainGraphics);

    // Draw the initial spike shape
    this.redrawSpike();

    this.setDepth(200);
    this.setVisible(false);
    this.setActive(false);

    scene.add.existing(this);
  }

  activate(gridX: number, gridY: number, inverted: boolean = false): void {
    const pixelX = gridX * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;
    const pixelY = gridY * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;

    // Update inverted state if different
    if (this._inverted !== inverted) {
      this._inverted = inverted;
      this.type = inverted ? 'spikeInverted' : 'spike';
      this.redrawSpike();
    }

    this.setPosition(pixelX, pixelY);
    this.setVisible(true);
    this.setActive(true);
    this._active = true;
  }

  deactivate(): void {
    this.setVisible(false);
    this.setActive(false);
    this._active = false;
  }

  isActive(): boolean {
    return this._active;
  }

  /**
   * Redraw the spike graphics (called when inverted state changes).
   */
  private redrawSpike(): void {
    this.mainGraphics.clear();
    this.glowGraphics.clear();

    const halfWidth = SIZES.SPIKE / 2;
    const halfHeight = SIZES.SPIKE / 2;
    const inverted = this._inverted;

    const tipY = inverted ? halfHeight : -halfHeight;
    const baseY = inverted ? -halfHeight + 4 : halfHeight - 4;

    // Shadow
    this.mainGraphics.fillStyle(0x000000, 0.3);
    this.mainGraphics.fillTriangle(-halfWidth + 2, baseY, halfWidth + 2, baseY, 2, tipY);

    // Main body
    this.mainGraphics.fillStyle(0x1a1a1a);
    this.mainGraphics.fillTriangle(-halfWidth, baseY, halfWidth, baseY, 0, tipY);

    // Inner gradient
    const innerOffset = 4;
    this.mainGraphics.fillStyle(0x2a2a2a);
    if (inverted) {
      this.mainGraphics.fillTriangle(
        -halfWidth + innerOffset,
        baseY - innerOffset / 2,
        halfWidth - innerOffset,
        baseY - innerOffset / 2,
        0,
        tipY - innerOffset
      );
    } else {
      this.mainGraphics.fillTriangle(
        -halfWidth + innerOffset,
        baseY - innerOffset / 2,
        halfWidth - innerOffset,
        baseY - innerOffset / 2,
        0,
        tipY + innerOffset
      );
    }

    // Highlight
    this.mainGraphics.fillStyle(0xffffff, 0.1);
    this.mainGraphics.fillTriangle(-halfWidth, baseY, 0, tipY, -halfWidth + 6, baseY);

    // Edge
    this.mainGraphics.lineStyle(1, 0x3a3a3a);
    this.mainGraphics.strokeTriangle(-halfWidth, baseY, halfWidth, baseY, 0, tipY);

    // Glow
    this.glowGraphics.fillStyle(0xff0000, 0.15);
    if (inverted) {
      this.glowGraphics.fillTriangle(-halfWidth - 2, baseY + 2, halfWidth + 2, baseY + 2, 0, tipY + 4);
    } else {
      this.glowGraphics.fillTriangle(-halfWidth - 2, baseY + 2, halfWidth + 2, baseY + 2, 0, tipY - 4);
    }
  }
}

// =============================================================================
// Pooled Portal
// =============================================================================

export type PooledPortalType = 'mode' | 'gravity' | 'speed';

export interface PooledPortalConfig {
  portalType?: PooledPortalType;
  targetMode?: PlayerModeType;
  targetSpeed?: SpeedModeType;
}

/** Portal colors by type */
const PORTAL_COLORS: Record<PooledPortalType, { primary: number; secondary: number; glow: number }> = {
  mode: { primary: 0x00ff00, secondary: 0x00aa00, glow: 0x00ff00 },
  gravity: { primary: 0x0088ff, secondary: 0x0044aa, glow: 0x0088ff },
  speed: { primary: 0xffff00, secondary: 0xaaaa00, glow: 0xffff00 },
};

/** Mode-specific colors */
const MODE_COLORS: Record<PlayerModeType, number> = {
  cube: 0x00ff00,
  ship: 0xff00ff,
  ball: 0xff8800,
};

/**
 * Poolable portal that can be reused.
 */
export class PooledPortal extends Phaser.GameObjects.Container implements Poolable {
  readonly collisionLayer = CollisionLayer.PORTAL;

  type: ObjectTypeType = 'portalMode';
  portalType: PooledPortalType = 'mode';
  targetMode: PlayerModeType | undefined = undefined;
  targetSpeed: SpeedModeType | undefined = undefined;

  private _active: boolean = false;
  private _triggered: boolean = false;

  private mainGraphics: Phaser.GameObjects.Graphics;
  private iconGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: PooledPortalConfig = {}) {
    super(scene, 0, 0);

    this.portalType = config.portalType ?? 'mode';
    this.targetMode = config.targetMode;
    this.targetSpeed = config.targetSpeed;

    this.mainGraphics = scene.add.graphics();
    this.iconGraphics = scene.add.graphics();

    this.add(this.mainGraphics);
    this.add(this.iconGraphics);

    this.setDepth(150);
    this.setVisible(false);
    this.setActive(false);

    scene.add.existing(this);
  }

  activate(
    gridX: number,
    gridY: number,
    portalType: PooledPortalType,
    targetMode?: PlayerModeType,
    targetSpeed?: SpeedModeType
  ): void {
    const pixelX = gridX * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;
    const pixelY = gridY * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;

    this.portalType = portalType;
    this.targetMode = targetMode;
    this.targetSpeed = targetSpeed;
    this._triggered = false;

    // Set object type
    if (portalType === 'mode') {
      this.type = 'portalMode';
    } else if (portalType === 'gravity') {
      this.type = 'portalGravity';
    } else {
      this.type = 'portalSpeed';
    }

    this.redrawPortal();

    this.setPosition(pixelX, pixelY);
    this.setVisible(true);
    this.setActive(true);
    this._active = true;
  }

  deactivate(): void {
    this.setVisible(false);
    this.setActive(false);
    this._active = false;
    this._triggered = false;
  }

  isActive(): boolean {
    return this._active;
  }

  shouldTrigger(): boolean {
    return !this._triggered;
  }

  trigger(): void {
    this._triggered = true;
  }

  resetTrigger(): void {
    this._triggered = false;
  }

  private redrawPortal(): void {
    this.mainGraphics.clear();
    this.iconGraphics.clear();

    let colors = PORTAL_COLORS[this.portalType];
    if (this.portalType === 'mode' && this.targetMode) {
      colors = {
        ...colors,
        primary: MODE_COLORS[this.targetMode],
        glow: MODE_COLORS[this.targetMode],
      };
    }

    const width = SIZES.PLAYER * 0.8;
    const height = SIZES.PLAYER * 2.5;

    // Outer glow
    this.mainGraphics.fillStyle(colors.glow, 0.2);
    this.mainGraphics.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 8);

    // Portal frame
    this.mainGraphics.fillStyle(colors.secondary, 1);
    this.mainGraphics.fillRoundedRect(-width / 2, -height / 2, width, height, 6);

    // Inner dark
    this.mainGraphics.fillStyle(0x000000, 0.8);
    this.mainGraphics.fillRoundedRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, 4);

    // Inner glow
    this.mainGraphics.fillStyle(colors.primary, 0.4);
    this.mainGraphics.fillRoundedRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, 3);

    // Center line
    this.mainGraphics.fillStyle(colors.primary, 0.8);
    this.mainGraphics.fillRect(-2, -height / 2 + 10, 4, height - 20);

    // Markers
    this.mainGraphics.fillStyle(colors.primary, 1);
    this.mainGraphics.fillTriangle(0, -height / 2 + 2, -6, -height / 2 + 10, 6, -height / 2 + 10);
    this.mainGraphics.fillTriangle(0, height / 2 - 2, -6, height / 2 - 10, 6, height / 2 - 10);

    // Mode icon
    if (this.portalType === 'mode' && this.targetMode) {
      this.iconGraphics.fillStyle(0xffffff, 0.9);
      switch (this.targetMode) {
        case 'cube':
          this.iconGraphics.fillRect(-6, -6, 12, 12);
          break;
        case 'ship':
          this.iconGraphics.fillTriangle(8, 0, -6, -8, -6, 8);
          break;
        case 'ball':
          this.iconGraphics.fillCircle(0, 0, 8);
          break;
      }
    }
  }
}

// =============================================================================
// Object Pool Manager
// =============================================================================

export interface ObjectPoolConfig {
  /** Initial pool size for blocks */
  initialBlocks?: number;
  /** Initial pool size for spikes */
  initialSpikes?: number;
  /** Initial pool size for portals */
  initialPortals?: number;
  /** Maximum pool size (prevents unbounded growth) */
  maxPoolSize?: number;
}

const DEFAULT_CONFIG: Required<ObjectPoolConfig> = {
  initialBlocks: 100,
  initialSpikes: 50,
  initialPortals: 20,
  maxPoolSize: 2000,
};

/**
 * Manages pools of reusable game objects.
 */
export class ObjectPool {
  private scene: Phaser.Scene;
  private config: Required<ObjectPoolConfig>;

  private blockPool: PooledBlock[] = [];
  private spikePool: PooledSpike[] = [];
  private portalPool: PooledPortal[] = [];

  private activeBlocks: PooledBlock[] = [];
  private activeSpikes: PooledSpike[] = [];
  private activePortals: PooledPortal[] = [];

  constructor(scene: Phaser.Scene, config: ObjectPoolConfig = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Pre-populate pools
    this.warmUp();
  }

  /**
   * Pre-create objects to avoid allocation during gameplay.
   */
  private warmUp(): void {
    // Create initial blocks
    for (let i = 0; i < this.config.initialBlocks; i++) {
      this.blockPool.push(new PooledBlock(this.scene));
    }

    // Create initial spikes (half normal, half inverted for variety)
    for (let i = 0; i < this.config.initialSpikes; i++) {
      this.spikePool.push(new PooledSpike(this.scene, { inverted: false }));
    }

    // Create initial portals
    for (let i = 0; i < this.config.initialPortals; i++) {
      this.portalPool.push(new PooledPortal(this.scene));
    }
  }

  // ===========================================================================
  // Block Pool
  // ===========================================================================

  /**
   * Get a block from the pool or create a new one.
   */
  acquireBlock(gridX: number, gridY: number): PooledBlock {
    let block = this.blockPool.pop();

    if (!block) {
      // Pool exhausted, create new (with warning if over limit)
      if (this.activeBlocks.length >= this.config.maxPoolSize) {
        console.warn('Block pool exceeded max size');
      }
      block = new PooledBlock(this.scene);
    }

    block.activate(gridX, gridY);
    this.activeBlocks.push(block);
    return block;
  }

  /**
   * Return a block to the pool.
   */
  releaseBlock(block: PooledBlock): void {
    const index = this.activeBlocks.indexOf(block);
    if (index !== -1) {
      this.activeBlocks.splice(index, 1);
    }
    block.deactivate();
    this.blockPool.push(block);
  }

  // ===========================================================================
  // Spike Pool
  // ===========================================================================

  /**
   * Get a spike from the pool or create a new one.
   */
  acquireSpike(gridX: number, gridY: number, inverted: boolean = false): PooledSpike {
    let spike = this.spikePool.pop();

    if (!spike) {
      if (this.activeSpikes.length >= this.config.maxPoolSize) {
        console.warn('Spike pool exceeded max size');
      }
      spike = new PooledSpike(this.scene, { inverted });
    }

    spike.activate(gridX, gridY, inverted);
    this.activeSpikes.push(spike);
    return spike;
  }

  /**
   * Return a spike to the pool.
   */
  releaseSpike(spike: PooledSpike): void {
    const index = this.activeSpikes.indexOf(spike);
    if (index !== -1) {
      this.activeSpikes.splice(index, 1);
    }
    spike.deactivate();
    this.spikePool.push(spike);
  }

  // ===========================================================================
  // Portal Pool
  // ===========================================================================

  /**
   * Get a portal from the pool or create a new one.
   */
  acquirePortal(
    gridX: number,
    gridY: number,
    portalType: PooledPortalType,
    targetMode?: PlayerModeType,
    targetSpeed?: SpeedModeType
  ): PooledPortal {
    let portal = this.portalPool.pop();

    if (!portal) {
      if (this.activePortals.length >= this.config.maxPoolSize) {
        console.warn('Portal pool exceeded max size');
      }
      portal = new PooledPortal(this.scene);
    }

    portal.activate(gridX, gridY, portalType, targetMode, targetSpeed);
    this.activePortals.push(portal);
    return portal;
  }

  /**
   * Return a portal to the pool.
   */
  releasePortal(portal: PooledPortal): void {
    const index = this.activePortals.indexOf(portal);
    if (index !== -1) {
      this.activePortals.splice(index, 1);
    }
    portal.deactivate();
    this.portalPool.push(portal);
  }

  /**
   * Get all active portals.
   */
  getActivePortals(): PooledPortal[] {
    return this.activePortals;
  }

  /**
   * Reset all portal triggers (for level restart).
   */
  resetPortalTriggers(): void {
    for (const portal of this.activePortals) {
      portal.resetTrigger();
    }
  }

  // ===========================================================================
  // Bulk Operations
  // ===========================================================================

  /**
   * Release all active objects back to pools.
   * Call this when restarting or changing levels.
   */
  releaseAll(): void {
    // Release all blocks
    for (const block of this.activeBlocks) {
      block.deactivate();
      this.blockPool.push(block);
    }
    this.activeBlocks = [];

    // Release all spikes
    for (const spike of this.activeSpikes) {
      spike.deactivate();
      this.spikePool.push(spike);
    }
    this.activeSpikes = [];

    // Release all portals
    for (const portal of this.activePortals) {
      portal.deactivate();
      this.portalPool.push(portal);
    }
    this.activePortals = [];
  }

  /**
   * Get all currently active objects (for collision detection).
   */
  getActiveObjects(): Poolable[] {
    return [...this.activeBlocks, ...this.activeSpikes, ...this.activePortals];
  }

  /**
   * Get pool statistics for debugging.
   */
  getStats(): {
    blocks: { active: number; pooled: number };
    spikes: { active: number; pooled: number };
    portals: { active: number; pooled: number };
  } {
    return {
      blocks: {
        active: this.activeBlocks.length,
        pooled: this.blockPool.length,
      },
      spikes: {
        active: this.activeSpikes.length,
        pooled: this.spikePool.length,
      },
      portals: {
        active: this.activePortals.length,
        pooled: this.portalPool.length,
      },
    };
  }

  /**
   * Destroy all pool objects.
   * Call this when the scene is destroyed.
   */
  destroy(): void {
    for (const block of this.blockPool) {
      block.destroy();
    }
    for (const block of this.activeBlocks) {
      block.destroy();
    }
    for (const spike of this.spikePool) {
      spike.destroy();
    }
    for (const spike of this.activeSpikes) {
      spike.destroy();
    }
    for (const portal of this.portalPool) {
      portal.destroy();
    }
    for (const portal of this.activePortals) {
      portal.destroy();
    }

    this.blockPool = [];
    this.activeBlocks = [];
    this.spikePool = [];
    this.activeSpikes = [];
    this.portalPool = [];
    this.activePortals = [];
  }
}
