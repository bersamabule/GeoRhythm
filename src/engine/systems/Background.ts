/**
 * Background system with gradient and grid lines.
 * Creates the classic Geometry Dash look.
 */

import Phaser from 'phaser';

import { GRID } from '@core/physics';

export interface BackgroundConfig {
  /** Top color of the gradient (hex) */
  topColor: number;
  /** Bottom color of the gradient (hex) */
  bottomColor: number;
  /** Ground color */
  groundColor: number;
  /** Grid line color */
  lineColor: number;
  /** Whether to show grid lines */
  showGrid: boolean;
}

const DEFAULT_CONFIG: BackgroundConfig = {
  topColor: 0x0066ff,
  bottomColor: 0x003388,
  groundColor: 0x0044aa,
  lineColor: 0x0055cc,
  showGrid: true,
};

/**
 * Creates and manages the game background with gradient and grid.
 */
export class Background {
  private scene: Phaser.Scene;
  private config: BackgroundConfig;

  /** Background gradient texture */
  private gradientSprite!: Phaser.GameObjects.Image;

  /** Ground rectangle */
  private ground!: Phaser.GameObjects.Rectangle;

  /** Ground top line */
  private groundLine!: Phaser.GameObjects.Rectangle;

  /** Grid lines container */
  private gridLines: Phaser.GameObjects.Rectangle[] = [];

  /** Decorative elements */
  private decorations: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, config: Partial<BackgroundConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.createGradient();
    this.createGround();
    if (this.config.showGrid) {
      this.createGridLines();
    }
  }

  /**
   * Create gradient background.
   */
  private createGradient(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create a canvas texture for the gradient
    const textureKey = 'bg-gradient';

    if (!this.scene.textures.exists(textureKey)) {
      const canvas = this.scene.textures.createCanvas(textureKey, width, height);
      const ctx = canvas?.context;

      if (ctx) {
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);

        // Convert hex to CSS color
        const topColor = this.hexToRgb(this.config.topColor);
        const bottomColor = this.hexToRgb(this.config.bottomColor);

        gradient.addColorStop(0, `rgb(${topColor.r}, ${topColor.g}, ${topColor.b})`);
        gradient.addColorStop(1, `rgb(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        canvas.refresh();
      }
    }

    this.gradientSprite = this.scene.add.image(width / 2, height / 2, textureKey);
    this.gradientSprite.setScrollFactor(0);
    this.gradientSprite.setDepth(-100);
  }

  /**
   * Create the ground area.
   */
  private createGround(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const groundY = GRID.DEFAULT_GROUND_Y * GRID.UNIT_SIZE;
    const groundHeight = height - groundY;

    // Main ground fill
    this.ground = this.scene.add.rectangle(
      width * 5, // Extended width for scrolling
      groundY + groundHeight / 2,
      width * 10,
      groundHeight,
      this.config.groundColor
    );
    this.ground.setDepth(-50);

    // Top line of ground (brighter)
    this.groundLine = this.scene.add.rectangle(
      width * 5,
      groundY,
      width * 10,
      3,
      this.config.lineColor
    );
    this.groundLine.setDepth(-49);
  }

  /**
   * Create grid lines on the ground.
   */
  private createGridLines(): void {
    const groundY = GRID.DEFAULT_GROUND_Y * GRID.UNIT_SIZE;
    const height = this.scene.cameras.main.height;
    const groundHeight = height - groundY;

    // Vertical grid lines (extend far for scrolling)
    const numLines = 300; // Enough for a long level
    for (let i = 0; i < numLines; i++) {
      const x = i * GRID.UNIT_SIZE;
      const line = this.scene.add.rectangle(
        x,
        groundY + groundHeight / 2,
        1,
        groundHeight,
        this.config.lineColor,
        0.3
      );
      line.setDepth(-48);
      this.gridLines.push(line);
    }

    // Horizontal grid lines
    const horizontalLines = Math.floor(groundHeight / GRID.UNIT_SIZE);
    for (let i = 1; i <= horizontalLines; i++) {
      const y = groundY + i * GRID.UNIT_SIZE;
      const line = this.scene.add.rectangle(
        this.scene.cameras.main.width * 5,
        y,
        this.scene.cameras.main.width * 10,
        1,
        this.config.lineColor,
        0.3
      );
      line.setDepth(-48);
      this.gridLines.push(line);
    }
  }

  /**
   * Convert hex color to RGB object.
   */
  private hexToRgb(hex: number): { r: number; g: number; b: number } {
    return {
      r: (hex >> 16) & 255,
      g: (hex >> 8) & 255,
      b: hex & 255,
    };
  }

  /**
   * Update background colors (for color triggers).
   */
  setColors(config: Partial<BackgroundConfig>): void {
    if (config.groundColor !== undefined) {
      this.ground.setFillStyle(config.groundColor);
    }
    if (config.lineColor !== undefined) {
      this.groundLine.setFillStyle(config.lineColor);
      this.gridLines.forEach((line) => line.setFillStyle(config.lineColor, 0.3));
    }
  }

  /**
   * Destroy all background elements.
   */
  destroy(): void {
    this.gradientSprite.destroy();
    this.ground.destroy();
    this.groundLine.destroy();
    this.gridLines.forEach((line) => line.destroy());
    this.decorations.forEach((dec) => dec.destroy());
  }
}
