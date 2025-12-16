/**
 * Portal game object - mode/gravity/speed changers.
 */

import Phaser from 'phaser';

import type { Collidable } from '@core/collision';
import { CollisionLayer, GRID, SIZES } from '@core/physics';

import type { ObjectTypeType, PlayerModeType, SpeedModeType } from '@generated/index';

/** Portal type determines behavior */
export type PortalType = 'mode' | 'gravity' | 'speed';

export interface PortalConfig {
  gridX: number;
  gridY: number;
  portalType: PortalType;
  /** Target mode for mode portals */
  targetMode?: PlayerModeType;
  /** Target speed for speed portals */
  targetSpeed?: SpeedModeType;
}

/** Portal colors by type */
const PORTAL_COLORS: Record<PortalType, { primary: number; secondary: number; glow: number }> = {
  mode: { primary: 0x00ff00, secondary: 0x00aa00, glow: 0x00ff00 }, // Green for mode
  gravity: { primary: 0x0088ff, secondary: 0x0044aa, glow: 0x0088ff }, // Blue for gravity
  speed: { primary: 0xffff00, secondary: 0xaaaa00, glow: 0xffff00 }, // Yellow for speed
};

/** Mode-specific colors */
const MODE_COLORS: Record<PlayerModeType, number> = {
  cube: 0x00ff00, // Green
  ship: 0xff00ff, // Magenta
  ball: 0xff8800, // Orange
};

/**
 * Portal - Triggers mode/gravity/speed changes on contact.
 * Features a tall, glowing frame like Geometry Dash portals.
 */
export class Portal extends Phaser.GameObjects.Container implements Collidable {
  readonly type: ObjectTypeType;
  readonly collisionLayer = CollisionLayer.PORTAL;

  /** What type of portal this is */
  readonly portalType: PortalType;

  /** Target mode (for mode portals) */
  readonly targetMode: PlayerModeType | undefined;

  /** Target speed (for speed portals) */
  readonly targetSpeed: SpeedModeType | undefined;

  /** Track if portal was already triggered (to prevent double triggers) */
  private triggered: boolean = false;

  constructor(scene: Phaser.Scene, config: PortalConfig) {
    const pixelX = config.gridX * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;
    const pixelY = config.gridY * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;

    super(scene, pixelX, pixelY);

    this.portalType = config.portalType;
    this.targetMode = config.targetMode;
    this.targetSpeed = config.targetSpeed;

    // Determine object type for collision system
    if (config.portalType === 'mode') {
      this.type = 'portalMode';
    } else if (config.portalType === 'gravity') {
      this.type = 'portalGravity';
    } else {
      this.type = 'portalSpeed';
    }

    // Get colors based on portal type
    let colors = PORTAL_COLORS[config.portalType];
    if (config.portalType === 'mode' && config.targetMode) {
      colors = {
        ...colors,
        primary: MODE_COLORS[config.targetMode],
        glow: MODE_COLORS[config.targetMode],
      };
    }

    // Create the portal visual
    this.createPortalVisual(scene, colors);

    this.setDepth(150);
    scene.add.existing(this);
  }

  /**
   * Create portal visual elements.
   */
  private createPortalVisual(
    scene: Phaser.Scene,
    colors: { primary: number; secondary: number; glow: number }
  ): void {
    const graphics = scene.add.graphics();

    // Portal dimensions (tall rectangular frame)
    const width = SIZES.PLAYER * 0.8;
    const height = SIZES.PLAYER * 2.5;

    // Outer glow
    graphics.fillStyle(colors.glow, 0.2);
    graphics.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 8);

    // Portal frame (outer)
    graphics.fillStyle(colors.secondary, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 6);

    // Portal inner (darker center)
    graphics.fillStyle(0x000000, 0.8);
    graphics.fillRoundedRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, 4);

    // Inner glow effect
    graphics.fillStyle(colors.primary, 0.4);
    graphics.fillRoundedRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, 3);

    // Pulsing center line
    graphics.fillStyle(colors.primary, 0.8);
    graphics.fillRect(-2, -height / 2 + 10, 4, height - 20);

    // Top and bottom markers
    graphics.fillStyle(colors.primary, 1);
    graphics.fillTriangle(0, -height / 2 + 2, -6, -height / 2 + 10, 6, -height / 2 + 10);
    graphics.fillTriangle(0, height / 2 - 2, -6, height / 2 - 10, 6, height / 2 - 10);

    this.add(graphics);

    // Add a mode indicator icon for mode portals
    if (this.portalType === 'mode' && this.targetMode) {
      const iconGraphics = scene.add.graphics();
      this.drawModeIcon(iconGraphics, this.targetMode);
      this.add(iconGraphics);
    }
  }

  /**
   * Draw a small icon representing the target mode.
   */
  private drawModeIcon(graphics: Phaser.GameObjects.Graphics, mode: PlayerModeType): void {
    graphics.fillStyle(0xffffff, 0.9);

    switch (mode) {
      case 'cube':
        // Square
        graphics.fillRect(-6, -6, 12, 12);
        break;
      case 'ship':
        // Triangle/arrow pointing right
        graphics.fillTriangle(8, 0, -6, -8, -6, 8);
        break;
      case 'ball':
        // Circle
        graphics.fillCircle(0, 0, 8);
        break;
    }
  }

  /**
   * Check if player should trigger this portal.
   * Call this during collision detection.
   */
  shouldTrigger(): boolean {
    return !this.triggered;
  }

  /**
   * Mark portal as triggered (to prevent double activation).
   */
  trigger(): void {
    this.triggered = true;
  }

  /**
   * Reset portal trigger state (e.g., on level restart).
   */
  resetTrigger(): void {
    this.triggered = false;
  }
}
