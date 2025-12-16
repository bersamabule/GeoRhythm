/**
 * Main Menu Scene
 * Entry point for the game with title, play button, and level select.
 */

import Phaser from 'phaser';

import { gameConfig } from '@config/game.config';

/** Scene keys for navigation */
export const SCENE_KEYS = {
  MAIN_MENU: 'MainMenuScene',
  LEVEL_SELECT: 'LevelSelectScene',
  GAME: 'GameScene',
  SETTINGS: 'SettingsScene',
} as const;

/** Button style configuration */
interface ButtonStyle {
  backgroundColor: number;
  hoverColor: number;
  textColor: string;
  width: number;
  height: number;
  fontSize: number;
  cornerRadius: number;
}

const DEFAULT_BUTTON_STYLE: ButtonStyle = {
  backgroundColor: 0x4a90d9,
  hoverColor: 0x6ba8f0,
  textColor: '#ffffff',
  width: 200,
  height: 60,
  fontSize: 24,
  cornerRadius: 10,
};

export class MainMenuScene extends Phaser.Scene {
  /** Scene dimensions */
  private centerX!: number;
  private centerY!: number;

  /** UI elements */
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.MAIN_MENU });
  }

  create(): void {
    this.centerX = gameConfig.display.width / 2;
    this.centerY = gameConfig.display.height / 2;

    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.createVersionText();
    this.setupKeyboardInput();

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createBackground(): void {
    // Gradient-like background using graphics
    const bg = this.add.graphics();

    // Dark blue gradient effect
    bg.fillGradientStyle(0x001133, 0x001133, 0x0066cc, 0x0066cc, 1);
    bg.fillRect(0, 0, gameConfig.display.width, gameConfig.display.height);

    // Add subtle grid lines for GD aesthetic
    bg.lineStyle(1, 0x003366, 0.3);
    const gridSize = 50;
    for (let x = 0; x < gameConfig.display.width; x += gridSize) {
      bg.lineBetween(x, 0, x, gameConfig.display.height);
    }
    for (let y = 0; y < gameConfig.display.height; y += gridSize) {
      bg.lineBetween(0, y, gameConfig.display.width, y);
    }

    // Ground line at bottom
    bg.fillStyle(0x004488, 1);
    bg.fillRect(0, gameConfig.display.height - 80, gameConfig.display.width, 80);

    bg.lineStyle(2, 0x0088ff, 0.8);
    bg.lineBetween(0, gameConfig.display.height - 80, gameConfig.display.width, gameConfig.display.height - 80);
  }

  private createTitle(): void {
    // Main title
    this.titleText = this.add.text(this.centerX, 100, 'GEORHYTHM', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '64px',
      color: '#ffffff',
      stroke: '#0066cc',
      strokeThickness: 8,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 8,
        fill: true,
      },
    });
    this.titleText.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(this.centerX, 160, 'A Geometry Dash Clone', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#88ccff',
    });
    subtitle.setOrigin(0.5);

    // Title animation
    this.tweens.add({
      targets: this.titleText,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createButtons(): void {
    const buttonY = this.centerY + 30;
    const buttonSpacing = 80;

    // Play button (starts first available level)
    this.createButton(
      this.centerX,
      buttonY,
      'PLAY',
      {
        ...DEFAULT_BUTTON_STYLE,
        backgroundColor: 0x44bb44,
        hoverColor: 0x66dd66,
        width: 220,
        height: 70,
        fontSize: 32,
      },
      () => this.startGame()
    );

    // Level Select button
    this.createButton(
      this.centerX,
      buttonY + buttonSpacing,
      'LEVELS',
      DEFAULT_BUTTON_STYLE,
      () => this.goToLevelSelect()
    );

    // Settings button
    this.createButton(
      this.centerX,
      buttonY + buttonSpacing * 2,
      'SETTINGS',
      {
        ...DEFAULT_BUTTON_STYLE,
        backgroundColor: 0x666666,
        hoverColor: 0x888888,
      },
      () => this.goToSettings()
    );
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    style: ButtonStyle,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(style.backgroundColor, 1);
    bg.fillRoundedRect(
      -style.width / 2,
      -style.height / 2,
      style.width,
      style.height,
      style.cornerRadius
    );

    // Button border
    bg.lineStyle(3, 0xffffff, 0.3);
    bg.strokeRoundedRect(
      -style.width / 2,
      -style.height / 2,
      style.width,
      style.height,
      style.cornerRadius
    );

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${style.fontSize}px`,
      color: style.textColor,
    });
    buttonText.setOrigin(0.5);

    container.add([bg, buttonText]);

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(
      -style.width / 2,
      -style.height / 2,
      style.width,
      style.height
    );
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Hover effects
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(style.hoverColor, 1);
      bg.fillRoundedRect(
        -style.width / 2,
        -style.height / 2,
        style.width,
        style.height,
        style.cornerRadius
      );
      bg.lineStyle(3, 0xffffff, 0.5);
      bg.strokeRoundedRect(
        -style.width / 2,
        -style.height / 2,
        style.width,
        style.height,
        style.cornerRadius
      );
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(style.backgroundColor, 1);
      bg.fillRoundedRect(
        -style.width / 2,
        -style.height / 2,
        style.width,
        style.height,
        style.cornerRadius
      );
      bg.lineStyle(3, 0xffffff, 0.3);
      bg.strokeRoundedRect(
        -style.width / 2,
        -style.height / 2,
        style.width,
        style.height,
        style.cornerRadius
      );
      container.setScale(1);
    });

    container.on('pointerdown', () => {
      container.setScale(0.95);
    });

    container.on('pointerup', () => {
      container.setScale(1.05);
      onClick();
    });

    return container;
  }

  private createVersionText(): void {
    const version = this.add.text(
      gameConfig.display.width - 10,
      gameConfig.display.height - 10,
      'v0.1.0',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#4488aa',
      }
    );
    version.setOrigin(1, 1);
  }

  private setupKeyboardInput(): void {
    // Space or Enter to start game
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());

    // L for levels
    this.input.keyboard?.on('keydown-L', () => this.goToLevelSelect());

    // S for settings
    this.input.keyboard?.on('keydown-S', () => this.goToSettings());
  }

  private startGame(): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start(SCENE_KEYS.GAME, { levelId: 'test-level' });
    });
  }

  private goToLevelSelect(): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start(SCENE_KEYS.LEVEL_SELECT);
    });
  }

  private goToSettings(): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start(SCENE_KEYS.SETTINGS);
    });
  }
}
