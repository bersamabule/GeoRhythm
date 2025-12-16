/**
 * GeoRhythm - Main Entry Point
 *
 * A high-fidelity, web-based clone of Geometry Dash.
 */

import Phaser from 'phaser';

import { phaserConfig } from '@config/game.config';

import { GameScene } from '@engine/scenes';

// Configure scenes
const config: Phaser.Types.Core.GameConfig = {
  ...phaserConfig,
  scene: [GameScene],
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
