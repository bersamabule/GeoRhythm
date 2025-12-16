/**
 * Settings Scene
 * Audio and control settings with sliders and toggles.
 */

import Phaser from 'phaser';

import { gameConfig } from '@config/game.config';
import { audioManager } from '@services/index';

import { SCENE_KEYS } from './MainMenuScene';

/** Setting slider configuration */
interface SliderConfig {
  x: number;
  y: number;
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export class SettingsScene extends Phaser.Scene {
  /** Scene dimensions */
  private centerX!: number;

  /** Current settings values */
  private musicVolume: number = 0.8;
  private sfxVolume: number = 1.0;

  constructor() {
    super({ key: SCENE_KEYS.SETTINGS });
  }

  create(): void {
    this.centerX = gameConfig.display.width / 2;

    // Load current volumes from audio manager
    this.musicVolume = audioManager.getMusicVolume();
    this.sfxVolume = audioManager.getSfxVolume();

    this.createBackground();
    this.createHeader();
    this.createSettings();
    this.createFooter();

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createBackground(): void {
    const bg = this.add.graphics();

    // Dark gray gradient
    bg.fillGradientStyle(0x111111, 0x111111, 0x222222, 0x222222, 1);
    bg.fillRect(0, 0, gameConfig.display.width, gameConfig.display.height);

    // Subtle pattern
    bg.lineStyle(1, 0x333333, 0.1);
    const gridSize = 30;
    for (let x = 0; x < gameConfig.display.width; x += gridSize) {
      bg.lineBetween(x, 0, x, gameConfig.display.height);
    }
    for (let y = 0; y < gameConfig.display.height; y += gridSize) {
      bg.lineBetween(0, y, gameConfig.display.width, y);
    }
  }

  private createHeader(): void {
    // Title
    const title = this.add.text(this.centerX, 50, 'SETTINGS', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '42px',
      color: '#ffffff',
      stroke: '#444444',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    // Back button
    this.createBackButton();
  }

  private createBackButton(): void {
    const container = this.add.container(60, 50);

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

    this.input.keyboard?.on('keydown-ESC', () => this.goBack());
  }

  private createSettings(): void {
    const startY = 150;
    const spacing = 100;

    // Audio section header
    const audioHeader = this.add.text(this.centerX, startY, '🔊 AUDIO', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '24px',
      color: '#4488ff',
    });
    audioHeader.setOrigin(0.5);

    // Music volume slider
    this.createSlider({
      x: this.centerX,
      y: startY + 60,
      label: 'Music Volume',
      min: 0,
      max: 1,
      value: this.musicVolume,
      onChange: (value) => {
        this.musicVolume = value;
        audioManager.setMusicVolume(value);
      },
    });

    // SFX volume slider
    this.createSlider({
      x: this.centerX,
      y: startY + 60 + spacing,
      label: 'SFX Volume',
      min: 0,
      max: 1,
      value: this.sfxVolume,
      onChange: (value) => {
        this.sfxVolume = value;
        audioManager.setSfxVolume(value);
      },
    });

    // Controls section header
    const controlsHeader = this.add.text(this.centerX, startY + 60 + spacing * 2 + 20, '🎮 CONTROLS', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '24px',
      color: '#44ff88',
    });
    controlsHeader.setOrigin(0.5);

    // Control hints
    const controls = [
      { key: 'SPACE / CLICK', action: 'Jump / Activate Orb' },
      { key: 'P', action: 'Toggle Practice Mode' },
      { key: 'ESC', action: 'Pause Game' },
      { key: 'R', action: 'Restart Level' },
    ];

    controls.forEach((control, index) => {
      const y = startY + 60 + spacing * 2 + 70 + index * 35;

      // Key
      const keyText = this.add.text(this.centerX - 120, y, control.key, {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 8, y: 4 },
      });
      keyText.setOrigin(1, 0.5);

      // Arrow
      const arrow = this.add.text(this.centerX - 100, y, '→', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#666666',
      });
      arrow.setOrigin(0.5);

      // Action
      const actionText = this.add.text(this.centerX - 80, y, control.action, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#888888',
      });
      actionText.setOrigin(0, 0.5);
    });
  }

  private createSlider(config: SliderConfig): Phaser.GameObjects.Container {
    const container = this.add.container(config.x, config.y);

    const sliderWidth = 300;
    const sliderHeight = 10;
    const handleRadius = 15;

    // Label
    const label = this.add.text(-sliderWidth / 2, -30, config.label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
    label.setOrigin(0, 0.5);

    // Value text
    const valueText = this.add.text(sliderWidth / 2, -30, `${Math.round(config.value * 100)}%`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#4488ff',
    });
    valueText.setOrigin(1, 0.5);

    // Track background
    const track = this.add.graphics();
    track.fillStyle(0x333333, 1);
    track.fillRoundedRect(-sliderWidth / 2, -sliderHeight / 2, sliderWidth, sliderHeight, 5);

    // Active track
    const activeTrack = this.add.graphics();
    const activeWidth = sliderWidth * config.value;
    activeTrack.fillStyle(0x4488ff, 1);
    activeTrack.fillRoundedRect(-sliderWidth / 2, -sliderHeight / 2, activeWidth, sliderHeight, 5);

    // Handle
    const handle = this.add.graphics();
    const handleX = -sliderWidth / 2 + sliderWidth * config.value;
    handle.fillStyle(0xffffff, 1);
    handle.fillCircle(handleX, 0, handleRadius);
    handle.lineStyle(3, 0x4488ff, 1);
    handle.strokeCircle(handleX, 0, handleRadius);

    container.add([label, valueText, track, activeTrack, handle]);

    // Make the whole slider area interactive
    const hitArea = new Phaser.Geom.Rectangle(
      -sliderWidth / 2 - handleRadius,
      -handleRadius,
      sliderWidth + handleRadius * 2,
      handleRadius * 2
    );
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Drag handling
    let isDragging = false;

    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      this.updateSlider(pointer, container, sliderWidth, config, valueText, activeTrack, handle);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        this.updateSlider(pointer, container, sliderWidth, config, valueText, activeTrack, handle);
      }
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    return container;
  }

  private updateSlider(
    pointer: Phaser.Input.Pointer,
    container: Phaser.GameObjects.Container,
    sliderWidth: number,
    config: SliderConfig,
    valueText: Phaser.GameObjects.Text,
    activeTrack: Phaser.GameObjects.Graphics,
    handle: Phaser.GameObjects.Graphics
  ): void {
    // Calculate relative position
    const localX = pointer.x - container.x;
    let normalized = (localX + sliderWidth / 2) / sliderWidth;
    normalized = Phaser.Math.Clamp(normalized, config.min, config.max);

    // Update value text
    valueText.setText(`${Math.round(normalized * 100)}%`);

    // Update active track
    activeTrack.clear();
    activeTrack.fillStyle(0x4488ff, 1);
    activeTrack.fillRoundedRect(-sliderWidth / 2, -5, sliderWidth * normalized, 10, 5);

    // Update handle
    handle.clear();
    const handleX = -sliderWidth / 2 + sliderWidth * normalized;
    handle.fillStyle(0xffffff, 1);
    handle.fillCircle(handleX, 0, 15);
    handle.lineStyle(3, 0x4488ff, 1);
    handle.strokeCircle(handleX, 0, 15);

    // Call onChange
    config.onChange(normalized);
  }

  private createFooter(): void {
    const footerY = gameConfig.display.height - 40;

    // Reset button
    const resetButton = this.add.container(this.centerX, footerY);

    const bg = this.add.graphics();
    bg.fillStyle(0x664444, 1);
    bg.fillRoundedRect(-80, -18, 160, 36, 8);

    const text = this.add.text(0, 0, 'Reset to Defaults', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);

    resetButton.add([bg, text]);

    const hitArea = new Phaser.Geom.Rectangle(-80, -18, 160, 36);
    resetButton.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    resetButton.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x886666, 1);
      bg.fillRoundedRect(-80, -18, 160, 36, 8);
    });

    resetButton.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x664444, 1);
      bg.fillRoundedRect(-80, -18, 160, 36, 8);
    });

    resetButton.on('pointerup', () => this.resetToDefaults());
  }

  private resetToDefaults(): void {
    this.musicVolume = gameConfig.audio.musicVolume;
    this.sfxVolume = gameConfig.audio.sfxVolume;

    audioManager.setMusicVolume(this.musicVolume);
    audioManager.setSfxVolume(this.sfxVolume);

    // Recreate the scene to refresh sliders
    this.scene.restart();
  }

  private goBack(): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start(SCENE_KEYS.MAIN_MENU);
    });
  }
}
