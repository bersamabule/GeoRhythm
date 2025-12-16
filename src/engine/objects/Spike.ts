/**
 * Spike game object - a hazard with GD-style visuals.
 */

import Phaser from 'phaser';

import type { Collidable } from '@core/collision';
import { CollisionLayer, GRID, SIZES } from '@core/physics';

import type { ObjectTypeType } from '@generated/index';

export interface SpikeConfig {
  gridX: number;
  gridY: number;
  inverted?: boolean;
  color?: number;
}

/**
 * Spike - A hazard with proper Geometry Dash styling.
 * Features a main triangle with highlight and shadow effects.
 */
export class Spike extends Phaser.GameObjects.Container implements Collidable {
  readonly type: ObjectTypeType;
  readonly collisionLayer = CollisionLayer.HAZARD;

  constructor(scene: Phaser.Scene, config: SpikeConfig) {
    const pixelX = config.gridX * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;
    const pixelY = config.gridY * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;
    const inverted = config.inverted ?? false;

    super(scene, pixelX, pixelY);

    this.type = inverted ? 'spikeInverted' : 'spike';

    // Draw the spike using graphics for better control
    const graphics = scene.add.graphics();

    const halfWidth = SIZES.SPIKE / 2;
    const halfHeight = SIZES.SPIKE / 2;

    // Triangle vertices
    const tipY = inverted ? halfHeight : -halfHeight;
    const baseY = inverted ? -halfHeight + 4 : halfHeight - 4;

    // Shadow/darker layer (slightly offset)
    graphics.fillStyle(0x000000, 0.3);
    if (inverted) {
      graphics.fillTriangle(-halfWidth + 2, baseY, halfWidth + 2, baseY, 2, tipY);
    } else {
      graphics.fillTriangle(-halfWidth + 2, baseY, halfWidth + 2, baseY, 2, tipY);
    }

    // Main spike body - black with colored tint
    graphics.fillStyle(0x1a1a1a);
    graphics.fillTriangle(-halfWidth, baseY, halfWidth, baseY, 0, tipY);

    // Inner gradient effect - create layered triangles
    const innerOffset = 4;
    graphics.fillStyle(0x2a2a2a);
    if (inverted) {
      graphics.fillTriangle(
        -halfWidth + innerOffset,
        baseY - innerOffset / 2,
        halfWidth - innerOffset,
        baseY - innerOffset / 2,
        0,
        tipY - innerOffset
      );
    } else {
      graphics.fillTriangle(
        -halfWidth + innerOffset,
        baseY - innerOffset / 2,
        halfWidth - innerOffset,
        baseY - innerOffset / 2,
        0,
        tipY + innerOffset
      );
    }

    // Highlight on one side
    graphics.fillStyle(0xffffff, 0.1);
    if (inverted) {
      graphics.fillTriangle(-halfWidth, baseY, 0, tipY, -halfWidth + 6, baseY);
    } else {
      graphics.fillTriangle(-halfWidth, baseY, 0, tipY, -halfWidth + 6, baseY);
    }

    // Bright edge
    graphics.lineStyle(1, 0x3a3a3a);
    graphics.strokeTriangle(-halfWidth, baseY, halfWidth, baseY, 0, tipY);

    this.add(graphics);

    // Add a subtle glow/danger indicator
    const glowGraphics = scene.add.graphics();
    glowGraphics.fillStyle(0xff0000, 0.15);
    if (inverted) {
      graphics.fillTriangle(
        -halfWidth - 2,
        baseY + 2,
        halfWidth + 2,
        baseY + 2,
        0,
        tipY + 4
      );
    } else {
      glowGraphics.fillTriangle(
        -halfWidth - 2,
        baseY + 2,
        halfWidth + 2,
        baseY + 2,
        0,
        tipY - 4
      );
    }
    this.add(glowGraphics);
    this.sendToBack(glowGraphics);

    this.setDepth(200);
    scene.add.existing(this);
  }
}
