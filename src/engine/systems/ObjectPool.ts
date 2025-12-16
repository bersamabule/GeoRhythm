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
// Pooled Checkpoint
// =============================================================================

export interface PooledCheckpointConfig {
  checkpointId?: number;
  name?: string;
}

/**
 * Poolable checkpoint for practice mode.
 * Displays as a green diamond shape.
 */
export class PooledCheckpoint extends Phaser.GameObjects.Container implements Poolable {
  readonly collisionLayer = CollisionLayer.PORTAL; // Non-solid, just triggers

  type: ObjectTypeType = 'checkpoint';
  checkpointId: number = 0;
  checkpointName: string = '';

  private _active: boolean = false;
  private _triggered: boolean = false;

  private mainGraphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: PooledCheckpointConfig = {}) {
    super(scene, 0, 0);

    this.checkpointId = config.checkpointId ?? 0;
    this.checkpointName = config.name ?? '';

    this.mainGraphics = scene.add.graphics();
    this.glowGraphics = scene.add.graphics();

    this.add(this.glowGraphics);
    this.add(this.mainGraphics);

    this.redrawCheckpoint(false);

    this.setDepth(175);
    this.setVisible(false);
    this.setActive(false);

    scene.add.existing(this);
  }

  activate(gridX: number, gridY: number, checkpointId: number, name: string = ''): void {
    const pixelX = gridX * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;
    const pixelY = gridY * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;

    this.checkpointId = checkpointId;
    this.checkpointName = name;
    this._triggered = false;

    this.redrawCheckpoint(false);

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
    // Redraw with triggered state (bright green)
    this.redrawCheckpoint(true);
  }

  resetTrigger(): void {
    this._triggered = false;
    this.redrawCheckpoint(false);
  }

  isTriggered(): boolean {
    return this._triggered;
  }

  private redrawCheckpoint(triggered: boolean): void {
    this.mainGraphics.clear();
    this.glowGraphics.clear();

    const size = SIZES.PLAYER * 0.6;
    const halfSize = size / 2;

    // Colors change based on triggered state
    const primaryColor = triggered ? 0x00ff00 : 0x00aa00;
    const secondaryColor = triggered ? 0x88ff88 : 0x006600;
    const glowColor = 0x00ff00;
    const glowAlpha = triggered ? 0.5 : 0.2;

    // Outer glow (pulsing effect handled by scene if needed)
    this.glowGraphics.fillStyle(glowColor, glowAlpha);
    this.glowGraphics.fillCircle(0, 0, size * 0.8);

    // Diamond shape (rotated square)
    this.mainGraphics.fillStyle(secondaryColor, 1);
    this.mainGraphics.fillTriangle(0, -halfSize, halfSize, 0, 0, halfSize);
    this.mainGraphics.fillTriangle(0, -halfSize, -halfSize, 0, 0, halfSize);

    // Inner diamond (smaller, brighter)
    const innerSize = halfSize * 0.6;
    this.mainGraphics.fillStyle(primaryColor, 1);
    this.mainGraphics.fillTriangle(0, -innerSize, innerSize, 0, 0, innerSize);
    this.mainGraphics.fillTriangle(0, -innerSize, -innerSize, 0, 0, innerSize);

    // Highlight
    this.mainGraphics.fillStyle(0xffffff, 0.3);
    this.mainGraphics.fillTriangle(0, -halfSize, -halfSize * 0.3, -halfSize * 0.3, halfSize * 0.3, -halfSize * 0.3);

    // Border
    this.mainGraphics.lineStyle(2, triggered ? 0xffffff : 0x00cc00, 1);
    this.mainGraphics.beginPath();
    this.mainGraphics.moveTo(0, -halfSize);
    this.mainGraphics.lineTo(halfSize, 0);
    this.mainGraphics.lineTo(0, halfSize);
    this.mainGraphics.lineTo(-halfSize, 0);
    this.mainGraphics.closePath();
    this.mainGraphics.strokePath();

    // Checkmark if triggered
    if (triggered) {
      this.mainGraphics.lineStyle(3, 0xffffff, 1);
      this.mainGraphics.beginPath();
      this.mainGraphics.moveTo(-innerSize * 0.5, 0);
      this.mainGraphics.lineTo(-innerSize * 0.1, innerSize * 0.4);
      this.mainGraphics.lineTo(innerSize * 0.5, -innerSize * 0.3);
      this.mainGraphics.strokePath();
    }
  }
}

// =============================================================================
// Pooled Jump Pad
// =============================================================================

export type PadType = 'yellow' | 'pink';

export interface PooledPadConfig {
  padType?: PadType;
}

/** Pad colors and jump forces */
const PAD_CONFIG: Record<PadType, { primary: number; secondary: number; glow: number; jumpForce: number }> = {
  yellow: { primary: 0xffff00, secondary: 0xccaa00, glow: 0xffff00, jumpForce: 900 },
  pink: { primary: 0xff66ff, secondary: 0xcc44cc, glow: 0xff66ff, jumpForce: 1100 }, // Higher jump
};

/**
 * Poolable jump pad that launches the player when touched.
 * Yellow pads = normal jump, Pink pads = higher jump.
 */
export class PooledPad extends Phaser.GameObjects.Container implements Poolable {
  readonly collisionLayer = CollisionLayer.SOLID; // Pads are solid platforms

  type: ObjectTypeType = 'padYellow';
  padType: PadType = 'yellow';
  jumpForce: number = 900;

  private _active: boolean = false;
  private _triggered: boolean = false;

  private mainGraphics: Phaser.GameObjects.Graphics;
  private arrowGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: PooledPadConfig = {}) {
    super(scene, 0, 0);

    this.padType = config.padType ?? 'yellow';
    this.type = this.padType === 'yellow' ? 'padYellow' : 'padPink';
    this.jumpForce = PAD_CONFIG[this.padType].jumpForce;

    this.mainGraphics = scene.add.graphics();
    this.arrowGraphics = scene.add.graphics();

    this.add(this.mainGraphics);
    this.add(this.arrowGraphics);

    this.redrawPad();

    this.setDepth(150);
    this.setVisible(false);
    this.setActive(false);

    scene.add.existing(this);
  }

  activate(gridX: number, gridY: number, padType: PadType = 'yellow'): void {
    const pixelX = gridX * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;
    const pixelY = gridY * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;

    if (this.padType !== padType) {
      this.padType = padType;
      this.type = padType === 'yellow' ? 'padYellow' : 'padPink';
      this.jumpForce = PAD_CONFIG[padType].jumpForce;
      this.redrawPad();
    }

    this._triggered = false;

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

  private redrawPad(): void {
    this.mainGraphics.clear();
    this.arrowGraphics.clear();

    const colors = PAD_CONFIG[this.padType];
    const width = SIZES.BLOCK;
    const height = SIZES.BLOCK * 0.4;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Outer glow
    this.mainGraphics.fillStyle(colors.glow, 0.3);
    this.mainGraphics.fillRoundedRect(-halfWidth - 4, -halfHeight - 4, width + 8, height + 8, 6);

    // Main body (trapezoid-like shape)
    this.mainGraphics.fillStyle(colors.secondary, 1);
    this.mainGraphics.fillRoundedRect(-halfWidth, -halfHeight, width, height, 4);

    // Top surface (brighter)
    this.mainGraphics.fillStyle(colors.primary, 1);
    this.mainGraphics.fillRoundedRect(-halfWidth + 2, -halfHeight, width - 4, height * 0.5, 3);

    // Spring coils visual
    this.mainGraphics.lineStyle(2, colors.secondary, 0.8);
    const coilSpacing = width / 5;
    for (let i = 1; i < 5; i++) {
      const x = -halfWidth + i * coilSpacing;
      this.mainGraphics.beginPath();
      this.mainGraphics.moveTo(x, -halfHeight + height * 0.5);
      this.mainGraphics.lineTo(x, halfHeight - 2);
      this.mainGraphics.strokePath();
    }

    // Highlight
    this.mainGraphics.fillStyle(0xffffff, 0.4);
    this.mainGraphics.fillRect(-halfWidth + 4, -halfHeight + 2, width - 8, 3);

    // Border
    this.mainGraphics.lineStyle(2, colors.secondary, 1);
    this.mainGraphics.strokeRoundedRect(-halfWidth, -halfHeight, width, height, 4);

    // Up arrow indicator
    this.arrowGraphics.fillStyle(0xffffff, 0.9);
    this.arrowGraphics.fillTriangle(0, -halfHeight - 8, -6, -halfHeight + 2, 6, -halfHeight + 2);
  }
}

// =============================================================================
// Pooled Jump Orb
// =============================================================================

export type OrbType = 'yellow' | 'blue';

export interface PooledOrbConfig {
  orbType?: OrbType;
}

/** Orb colors and jump forces */
const ORB_CONFIG: Record<OrbType, { primary: number; secondary: number; glow: number; jumpForce: number }> = {
  yellow: { primary: 0xffff00, secondary: 0xffaa00, glow: 0xffff00, jumpForce: 850 },
  blue: { primary: 0x00aaff, secondary: 0x0066cc, glow: 0x00aaff, jumpForce: 750 }, // Gravity-flip style
};

/**
 * Poolable jump orb that launches the player when clicked while touching.
 * Yellow orbs = standard jump, Blue orbs = lower jump (for precision).
 */
export class PooledOrb extends Phaser.GameObjects.Container implements Poolable {
  readonly collisionLayer = CollisionLayer.PORTAL; // Orbs are non-solid triggers

  type: ObjectTypeType = 'orbYellow';
  orbType: OrbType = 'yellow';
  jumpForce: number = 850;

  private _active: boolean = false;
  private _triggered: boolean = false;
  private _playerInside: boolean = false;

  private mainGraphics: Phaser.GameObjects.Graphics;
  private coreGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: PooledOrbConfig = {}) {
    super(scene, 0, 0);

    this.orbType = config.orbType ?? 'yellow';
    this.type = this.orbType === 'yellow' ? 'orbYellow' : 'orbBlue';
    this.jumpForce = ORB_CONFIG[this.orbType].jumpForce;

    this.mainGraphics = scene.add.graphics();
    this.coreGraphics = scene.add.graphics();

    this.add(this.mainGraphics);
    this.add(this.coreGraphics);

    this.redrawOrb(false);

    this.setDepth(160);
    this.setVisible(false);
    this.setActive(false);

    scene.add.existing(this);
  }

  activate(gridX: number, gridY: number, orbType: OrbType = 'yellow'): void {
    const pixelX = gridX * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;
    const pixelY = gridY * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;

    if (this.orbType !== orbType) {
      this.orbType = orbType;
      this.type = orbType === 'yellow' ? 'orbYellow' : 'orbBlue';
      this.jumpForce = ORB_CONFIG[orbType].jumpForce;
    }

    this._triggered = false;
    this._playerInside = false;
    this.redrawOrb(false);

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
    this._playerInside = false;
  }

  isActive(): boolean {
    return this._active;
  }

  /** Check if orb can be triggered (not yet triggered this pass) */
  shouldTrigger(): boolean {
    return !this._triggered;
  }

  /** Mark as triggered (player clicked while inside) */
  trigger(): void {
    this._triggered = true;
    this.redrawOrb(true); // Show triggered state briefly
  }

  resetTrigger(): void {
    this._triggered = false;
    this._playerInside = false;
    this.redrawOrb(false);
  }

  /** Mark player as inside the orb's trigger zone */
  setPlayerInside(inside: boolean): void {
    if (this._playerInside !== inside) {
      this._playerInside = inside;
      if (!this._triggered) {
        this.redrawOrb(false); // Update glow based on hover
      }
    }
  }

  /** Check if player is inside trigger zone */
  isPlayerInside(): boolean {
    return this._playerInside;
  }

  private redrawOrb(triggered: boolean): void {
    this.mainGraphics.clear();
    this.coreGraphics.clear();

    const colors = ORB_CONFIG[this.orbType];
    const radius = SIZES.PLAYER * 0.4;

    // Outer glow - brighter when player is hovering or triggered
    const glowAlpha = triggered ? 0.8 : this._playerInside ? 0.5 : 0.25;
    const glowRadius = triggered ? radius * 1.8 : this._playerInside ? radius * 1.5 : radius * 1.3;
    this.mainGraphics.fillStyle(colors.glow, glowAlpha);
    this.mainGraphics.fillCircle(0, 0, glowRadius);

    // Main orb body
    this.mainGraphics.fillStyle(colors.secondary, 1);
    this.mainGraphics.fillCircle(0, 0, radius);

    // Inner ring
    this.mainGraphics.lineStyle(3, colors.primary, 0.8);
    this.mainGraphics.strokeCircle(0, 0, radius * 0.7);

    // Core (brightest part)
    const coreColor = triggered ? 0xffffff : colors.primary;
    this.coreGraphics.fillStyle(coreColor, triggered ? 1 : 0.9);
    this.coreGraphics.fillCircle(0, 0, radius * 0.4);

    // Highlight
    this.coreGraphics.fillStyle(0xffffff, 0.6);
    this.coreGraphics.fillCircle(-radius * 0.2, -radius * 0.2, radius * 0.15);

    // Outer border
    this.mainGraphics.lineStyle(2, triggered ? 0xffffff : colors.primary, 1);
    this.mainGraphics.strokeCircle(0, 0, radius);
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
  /** Initial pool size for checkpoints */
  initialCheckpoints?: number;
  /** Initial pool size for jump pads */
  initialPads?: number;
  /** Initial pool size for jump orbs */
  initialOrbs?: number;
  /** Maximum pool size (prevents unbounded growth) */
  maxPoolSize?: number;
}

const DEFAULT_CONFIG: Required<ObjectPoolConfig> = {
  initialBlocks: 100,
  initialSpikes: 50,
  initialPortals: 20,
  initialCheckpoints: 20,
  initialPads: 30,
  initialOrbs: 30,
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
  private checkpointPool: PooledCheckpoint[] = [];
  private padPool: PooledPad[] = [];
  private orbPool: PooledOrb[] = [];

  private activeBlocks: PooledBlock[] = [];
  private activeSpikes: PooledSpike[] = [];
  private activePortals: PooledPortal[] = [];
  private activeCheckpoints: PooledCheckpoint[] = [];
  private activePads: PooledPad[] = [];
  private activeOrbs: PooledOrb[] = [];

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

    // Create initial checkpoints
    for (let i = 0; i < this.config.initialCheckpoints; i++) {
      this.checkpointPool.push(new PooledCheckpoint(this.scene));
    }

    // Create initial pads
    for (let i = 0; i < this.config.initialPads; i++) {
      this.padPool.push(new PooledPad(this.scene));
    }

    // Create initial orbs
    for (let i = 0; i < this.config.initialOrbs; i++) {
      this.orbPool.push(new PooledOrb(this.scene));
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
  // Checkpoint Pool
  // ===========================================================================

  /**
   * Get a checkpoint from the pool or create a new one.
   */
  acquireCheckpoint(gridX: number, gridY: number, checkpointId: number, name: string = ''): PooledCheckpoint {
    let checkpoint = this.checkpointPool.pop();

    if (!checkpoint) {
      if (this.activeCheckpoints.length >= this.config.maxPoolSize) {
        console.warn('Checkpoint pool exceeded max size');
      }
      checkpoint = new PooledCheckpoint(this.scene);
    }

    checkpoint.activate(gridX, gridY, checkpointId, name);
    this.activeCheckpoints.push(checkpoint);
    return checkpoint;
  }

  /**
   * Return a checkpoint to the pool.
   */
  releaseCheckpoint(checkpoint: PooledCheckpoint): void {
    const index = this.activeCheckpoints.indexOf(checkpoint);
    if (index !== -1) {
      this.activeCheckpoints.splice(index, 1);
    }
    checkpoint.deactivate();
    this.checkpointPool.push(checkpoint);
  }

  /**
   * Get all active checkpoints.
   */
  getActiveCheckpoints(): PooledCheckpoint[] {
    return this.activeCheckpoints;
  }

  /**
   * Reset all checkpoint triggers (for level restart).
   */
  resetCheckpointTriggers(): void {
    for (const checkpoint of this.activeCheckpoints) {
      checkpoint.resetTrigger();
    }
  }

  // ===========================================================================
  // Pad Pool
  // ===========================================================================

  /**
   * Get a pad from the pool or create a new one.
   */
  acquirePad(gridX: number, gridY: number, padType: PadType = 'yellow'): PooledPad {
    let pad = this.padPool.pop();

    if (!pad) {
      if (this.activePads.length >= this.config.maxPoolSize) {
        console.warn('Pad pool exceeded max size');
      }
      pad = new PooledPad(this.scene);
    }

    pad.activate(gridX, gridY, padType);
    this.activePads.push(pad);
    return pad;
  }

  /**
   * Return a pad to the pool.
   */
  releasePad(pad: PooledPad): void {
    const index = this.activePads.indexOf(pad);
    if (index !== -1) {
      this.activePads.splice(index, 1);
    }
    pad.deactivate();
    this.padPool.push(pad);
  }

  /**
   * Get all active pads.
   */
  getActivePads(): PooledPad[] {
    return this.activePads;
  }

  /**
   * Reset all pad triggers (for level restart).
   */
  resetPadTriggers(): void {
    for (const pad of this.activePads) {
      pad.resetTrigger();
    }
  }

  // ===========================================================================
  // Orb Pool
  // ===========================================================================

  /**
   * Get an orb from the pool or create a new one.
   */
  acquireOrb(gridX: number, gridY: number, orbType: OrbType = 'yellow'): PooledOrb {
    let orb = this.orbPool.pop();

    if (!orb) {
      if (this.activeOrbs.length >= this.config.maxPoolSize) {
        console.warn('Orb pool exceeded max size');
      }
      orb = new PooledOrb(this.scene);
    }

    orb.activate(gridX, gridY, orbType);
    this.activeOrbs.push(orb);
    return orb;
  }

  /**
   * Return an orb to the pool.
   */
  releaseOrb(orb: PooledOrb): void {
    const index = this.activeOrbs.indexOf(orb);
    if (index !== -1) {
      this.activeOrbs.splice(index, 1);
    }
    orb.deactivate();
    this.orbPool.push(orb);
  }

  /**
   * Get all active orbs.
   */
  getActiveOrbs(): PooledOrb[] {
    return this.activeOrbs;
  }

  /**
   * Reset all orb triggers (for level restart).
   */
  resetOrbTriggers(): void {
    for (const orb of this.activeOrbs) {
      orb.resetTrigger();
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

    // Release all checkpoints
    for (const checkpoint of this.activeCheckpoints) {
      checkpoint.deactivate();
      this.checkpointPool.push(checkpoint);
    }
    this.activeCheckpoints = [];

    // Release all pads
    for (const pad of this.activePads) {
      pad.deactivate();
      this.padPool.push(pad);
    }
    this.activePads = [];

    // Release all orbs
    for (const orb of this.activeOrbs) {
      orb.deactivate();
      this.orbPool.push(orb);
    }
    this.activeOrbs = [];
  }

  /**
   * Get all currently active objects (for collision detection).
   */
  getActiveObjects(): Poolable[] {
    return [
      ...this.activeBlocks,
      ...this.activeSpikes,
      ...this.activePortals,
      ...this.activeCheckpoints,
      ...this.activePads,
      ...this.activeOrbs,
    ];
  }

  /**
   * Get pool statistics for debugging.
   */
  getStats(): {
    blocks: { active: number; pooled: number };
    spikes: { active: number; pooled: number };
    portals: { active: number; pooled: number };
    checkpoints: { active: number; pooled: number };
    pads: { active: number; pooled: number };
    orbs: { active: number; pooled: number };
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
      checkpoints: {
        active: this.activeCheckpoints.length,
        pooled: this.checkpointPool.length,
      },
      pads: {
        active: this.activePads.length,
        pooled: this.padPool.length,
      },
      orbs: {
        active: this.activeOrbs.length,
        pooled: this.orbPool.length,
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
    for (const checkpoint of this.checkpointPool) {
      checkpoint.destroy();
    }
    for (const checkpoint of this.activeCheckpoints) {
      checkpoint.destroy();
    }
    for (const pad of this.padPool) {
      pad.destroy();
    }
    for (const pad of this.activePads) {
      pad.destroy();
    }
    for (const orb of this.orbPool) {
      orb.destroy();
    }
    for (const orb of this.activeOrbs) {
      orb.destroy();
    }

    this.blockPool = [];
    this.activeBlocks = [];
    this.spikePool = [];
    this.activeSpikes = [];
    this.portalPool = [];
    this.activePortals = [];
    this.checkpointPool = [];
    this.activeCheckpoints = [];
    this.padPool = [];
    this.activePads = [];
    this.orbPool = [];
    this.activeOrbs = [];
  }
}
