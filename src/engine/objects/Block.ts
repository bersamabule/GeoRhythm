/**
 * Block game object - a solid platform with GD-style visuals.
 */

import Phaser from 'phaser';

import type { Collidable } from '@core/collision';
import { CollisionLayer, GRID, SIZES } from '@core/physics';

import type { ObjectTypeType } from '@generated/index';

export interface BlockConfig {
  gridX: number;
  gridY: number;
  color?: number;
  lineColor?: number;
}

/**
 * Block - A solid platform with grid-style visuals like Geometry Dash.
 */
export class Block extends Phaser.GameObjects.Container implements Collidable {
  readonly type: ObjectTypeType = 'block';
  readonly collisionLayer = CollisionLayer.SOLID;

  private fill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, config: BlockConfig) {
    const pixelX = config.gridX * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;
    const pixelY = config.gridY * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2;
    const color = config.color ?? 0x0066cc;
    const lineColor = config.lineColor ?? 0x0088ff;

    super(scene, pixelX, pixelY);

    // Main fill
    this.fill = scene.add.rectangle(0, 0, SIZES.BLOCK, SIZES.BLOCK, color);
    this.add(this.fill);

    // Border
    const border = scene.add.rectangle(0, 0, SIZES.BLOCK, SIZES.BLOCK);
    border.setStrokeStyle(2, lineColor);
    border.setFillStyle(0x000000, 0);
    this.add(border);

    // Inner grid pattern
    const gridLines = scene.add.graphics();
    gridLines.lineStyle(1, lineColor, 0.3);

    // Vertical line
    gridLines.moveTo(0, -SIZES.BLOCK / 2);
    gridLines.lineTo(0, SIZES.BLOCK / 2);

    // Horizontal line
    gridLines.moveTo(-SIZES.BLOCK / 2, 0);
    gridLines.lineTo(SIZES.BLOCK / 2, 0);

    gridLines.strokePath();
    this.add(gridLines);

    // Add highlight (top edge)
    const highlight = scene.add.rectangle(
      0,
      -SIZES.BLOCK / 2 + 2,
      SIZES.BLOCK - 4,
      3,
      0xffffff,
      0.1
    );
    this.add(highlight);

    this.setDepth(100);
    scene.add.existing(this);
  }
}
