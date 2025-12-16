/**
 * GeoRhythm - Main Entry Point
 *
 * A high-fidelity, web-based clone of Geometry Dash.
 */

import Phaser from 'phaser';

import { phaserConfig } from '@config/game.config';

import {
  MainMenuScene,
  LevelSelectScene,
  SettingsScene,
  GameScene,
} from '@engine/scenes';

// Configure scenes - MainMenuScene is the entry point
const config: Phaser.Types.Core.GameConfig = {
  ...phaserConfig,
  scene: [MainMenuScene, LevelSelectScene, SettingsScene, GameScene],
};

// Create and start the game
console.log('[Main] Creating Phaser game with config:', config);
const game = new Phaser.Game(config);
console.log('[Main] Phaser game created:', game);

// Export for debugging
declare global {
  interface Window {
    game: Phaser.Game;
  }
}

window.game = game;
