/**
 * Level Select Scene
 * Grid of available levels with difficulty indicators.
 */

import Phaser from 'phaser';

import { gameConfig } from '@config/game.config';
import { levelLoader, type LevelEntry } from '@services/index';

import { SCENE_KEYS } from './MainMenuScene';

/** Level card visual configuration */
interface LevelCardConfig {
  width: number;
  height: number;
  gap: number;
  cols: number;
}

const CARD_CONFIG: LevelCardConfig = {
  width: 200,
  height: 140,
  gap: 20,
  cols: 3,
};

/** Difficulty color mapping */
const DIFFICULTY_COLORS = {
  auto: 0x00ff00,
  easy: 0x44bb44,
  normal: 0xffcc00,
  hard: 0xff8800,
  harder: 0xff4444,
  insane: 0xff00ff,
  demon: 0xaa0000,
} as const;

type DifficultyKey = keyof typeof DIFFICULTY_COLORS;

function getDifficultyColor(difficulty: string): number {
  if (difficulty in DIFFICULTY_COLORS) {
    return DIFFICULTY_COLORS[difficulty as DifficultyKey];
  }
  return DIFFICULTY_COLORS.normal;
}

export class LevelSelectScene extends Phaser.Scene {
  /** Scene dimensions */
  private centerX!: number;
  private centerY!: number;

  /** Level data */
  private levels: LevelEntry[] = [];

  /** UI containers */
  private cardContainer!: Phaser.GameObjects.Container;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.LEVEL_SELECT });
  }

  async create(): Promise<void> {
    this.centerX = gameConfig.display.width / 2;
    this.centerY = gameConfig.display.height / 2;

    this.createBackground();
    this.createHeader();
    this.createLoadingIndicator();

    // Load levels
    await this.loadLevelList();

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createBackground(): void {
    const bg = this.add.graphics();

    // Dark purple/blue gradient
    bg.fillGradientStyle(0x110022, 0x110022, 0x220044, 0x220044, 1);
    bg.fillRect(0, 0, gameConfig.display.width, gameConfig.display.height);

    // Subtle grid
    bg.lineStyle(1, 0x330055, 0.2);
    const gridSize = 40;
    for (let x = 0; x < gameConfig.display.width; x += gridSize) {
      bg.lineBetween(x, 0, x, gameConfig.display.height);
    }
    for (let y = 0; y < gameConfig.display.height; y += gridSize) {
      bg.lineBetween(0, y, gameConfig.display.width, y);
    }
  }

  private createHeader(): void {
    // Title
    const title = this.add.text(this.centerX, 50, 'SELECT LEVEL', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '42px',
      color: '#ffffff',
      stroke: '#660099',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    // Back button
    const backButton = this.createBackButton();
    backButton.setPosition(60, 50);
  }

  private createBackButton(): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0x444444, 1);
    bg.fillRoundedRect(-40, -20, 80, 40, 8);

    const text = this.add.text(0, 0, '← BACK', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);

    container.add([bg, text]);

    const hitArea = new Phaser.Geom.Rectangle(-40, -20, 80, 40);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x666666, 1);
      bg.fillRoundedRect(-40, -20, 80, 40, 8);
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x444444, 1);
      bg.fillRoundedRect(-40, -20, 80, 40, 8);
      container.setScale(1);
    });

    container.on('pointerup', () => this.goBack());

    // Escape key also goes back
    this.input.keyboard?.on('keydown-ESC', () => this.goBack());

    return container;
  }

  private createLoadingIndicator(): void {
    this.loadingText = this.add.text(this.centerX, this.centerY, 'Loading levels...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#888888',
    });
    this.loadingText.setOrigin(0.5);
  }

  private async loadLevelList(): Promise<void> {
    try {
      const manifest = await levelLoader.getManifest();
      this.levels = manifest.levels;
      this.loadingText.destroy();
      this.createLevelGrid();
    } catch (error) {
      console.error('[LevelSelect] Failed to load manifest:', error);
      this.loadingText.setText('Failed to load levels');
      this.loadingText.setColor('#ff4444');
    }
  }

  private createLevelGrid(): void {
    this.cardContainer = this.add.container(0, 0);

    const startY = 140;
    const totalWidth = CARD_CONFIG.cols * CARD_CONFIG.width + (CARD_CONFIG.cols - 1) * CARD_CONFIG.gap;
    const startX = (gameConfig.display.width - totalWidth) / 2 + CARD_CONFIG.width / 2;

    this.levels.forEach((level, index) => {
      const col = index % CARD_CONFIG.cols;
      const row = Math.floor(index / CARD_CONFIG.cols);

      const x = startX + col * (CARD_CONFIG.width + CARD_CONFIG.gap);
      const y = startY + row * (CARD_CONFIG.height + CARD_CONFIG.gap);

      const card = this.createLevelCard(level, x, y, index);
      this.cardContainer.add(card);
    });

    // Add "Coming Soon" placeholder if less than 3 levels
    if (this.levels.length < 3) {
      for (let i = this.levels.length; i < 3; i++) {
        const col = i % CARD_CONFIG.cols;
        const row = Math.floor(i / CARD_CONFIG.cols);

        const x = startX + col * (CARD_CONFIG.width + CARD_CONFIG.gap);
        const y = startY + row * (CARD_CONFIG.height + CARD_CONFIG.gap);

        const placeholder = this.createPlaceholderCard(x, y);
        this.cardContainer.add(placeholder);
      }
    }
  }

  private createLevelCard(
    level: LevelEntry,
    x: number,
    y: number,
    index: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.graphics();
    const difficultyColor = getDifficultyColor(level.difficulty);

    bg.fillStyle(0x222244, 1);
    bg.fillRoundedRect(
      -CARD_CONFIG.width / 2,
      -CARD_CONFIG.height / 2,
      CARD_CONFIG.width,
      CARD_CONFIG.height,
      12
    );

    // Difficulty accent bar at top
    bg.fillStyle(difficultyColor, 1);
    bg.fillRect(
      -CARD_CONFIG.width / 2,
      -CARD_CONFIG.height / 2,
      CARD_CONFIG.width,
      6
    );

    // Border
    bg.lineStyle(2, difficultyColor, 0.5);
    bg.strokeRoundedRect(
      -CARD_CONFIG.width / 2,
      -CARD_CONFIG.height / 2,
      CARD_CONFIG.width,
      CARD_CONFIG.height,
      12
    );

    // Level number badge
    const badge = this.add.graphics();
    badge.fillStyle(difficultyColor, 1);
    badge.fillCircle(-CARD_CONFIG.width / 2 + 25, -CARD_CONFIG.height / 2 + 35, 18);

    const numberText = this.add.text(
      -CARD_CONFIG.width / 2 + 25,
      -CARD_CONFIG.height / 2 + 35,
      `${index + 1}`,
      {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      }
    );
    numberText.setOrigin(0.5);

    // Level name
    const nameText = this.add.text(10, -CARD_CONFIG.height / 2 + 35, level.name, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
    nameText.setOrigin(0, 0.5);

    // Author
    const authorText = this.add.text(0, 5, `by ${level.author}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#888888',
    });
    authorText.setOrigin(0.5);

    // Difficulty label
    const difficultyText = this.add.text(0, 35, level.difficulty.toUpperCase(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: Phaser.Display.Color.IntegerToColor(difficultyColor).rgba,
    });
    difficultyText.setOrigin(0.5);

    // Duration
    const durationText = this.add.text(0, 55, this.formatDuration(level.duration ?? 0), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#666666',
    });
    durationText.setOrigin(0.5);

    container.add([bg, badge, numberText, nameText, authorText, difficultyText, durationText]);

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(
      -CARD_CONFIG.width / 2,
      -CARD_CONFIG.height / 2,
      CARD_CONFIG.width,
      CARD_CONFIG.height
    );
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Hover effects
    container.on('pointerover', () => {
      container.setScale(1.05);
      bg.clear();
      bg.fillStyle(0x333366, 1);
      bg.fillRoundedRect(
        -CARD_CONFIG.width / 2,
        -CARD_CONFIG.height / 2,
        CARD_CONFIG.width,
        CARD_CONFIG.height,
        12
      );
      bg.fillStyle(difficultyColor, 1);
      bg.fillRect(-CARD_CONFIG.width / 2, -CARD_CONFIG.height / 2, CARD_CONFIG.width, 6);
      bg.lineStyle(3, difficultyColor, 0.8);
      bg.strokeRoundedRect(
        -CARD_CONFIG.width / 2,
        -CARD_CONFIG.height / 2,
        CARD_CONFIG.width,
        CARD_CONFIG.height,
        12
      );
    });

    container.on('pointerout', () => {
      container.setScale(1);
      bg.clear();
      bg.fillStyle(0x222244, 1);
      bg.fillRoundedRect(
        -CARD_CONFIG.width / 2,
        -CARD_CONFIG.height / 2,
        CARD_CONFIG.width,
        CARD_CONFIG.height,
        12
      );
      bg.fillStyle(difficultyColor, 1);
      bg.fillRect(-CARD_CONFIG.width / 2, -CARD_CONFIG.height / 2, CARD_CONFIG.width, 6);
      bg.lineStyle(2, difficultyColor, 0.5);
      bg.strokeRoundedRect(
        -CARD_CONFIG.width / 2,
        -CARD_CONFIG.height / 2,
        CARD_CONFIG.width,
        CARD_CONFIG.height,
        12
      );
    });

    container.on('pointerdown', () => container.setScale(0.98));
    container.on('pointerup', () => this.selectLevel(level.id));

    return container;
  }

  private createPlaceholderCard(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.5);
    bg.fillRoundedRect(
      -CARD_CONFIG.width / 2,
      -CARD_CONFIG.height / 2,
      CARD_CONFIG.width,
      CARD_CONFIG.height,
      12
    );

    bg.lineStyle(2, 0x333344, 0.5);
    bg.strokeRoundedRect(
      -CARD_CONFIG.width / 2,
      -CARD_CONFIG.height / 2,
      CARD_CONFIG.width,
      CARD_CONFIG.height,
      12
    );

    const text = this.add.text(0, 0, 'Coming Soon', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#444466',
    });
    text.setOrigin(0.5);

    container.add([bg, text]);

    return container;
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private selectLevel(levelId: string): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start(SCENE_KEYS.GAME, { levelId });
    });
  }

  private goBack(): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start(SCENE_KEYS.MAIN_MENU);
    });
  }
}
