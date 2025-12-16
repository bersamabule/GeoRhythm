/**
 * Particle effects manager.
 * Handles death explosions, jump particles, and trail effects.
 */

import Phaser from 'phaser';

export interface ParticleConfig {
  /** Primary color for particles */
  primaryColor: number;
  /** Secondary color for effects */
  secondaryColor: number;
}

const DEFAULT_CONFIG: ParticleConfig = {
  primaryColor: 0x00ff00,
  secondaryColor: 0x00ffff,
};

interface Particle {
  sprite: Phaser.GameObjects.Rectangle;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  rotationSpeed: number;
  fadeOut: boolean;
  gravity: number;
}

/**
 * Manages particle effects for the game.
 */
export class ParticleManager {
  private scene: Phaser.Scene;
  private config: ParticleConfig;
  private particles: Particle[] = [];
  private trailParticles: Particle[] = [];

  constructor(scene: Phaser.Scene, config: Partial<ParticleConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update all particles.
   */
  update(deltaTime: number): void {
    this.updateParticleList(this.particles, deltaTime);
    this.updateParticleList(this.trailParticles, deltaTime);
  }

  private updateParticleList(particles: Particle[], deltaTime: number): void {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      if (!particle) continue;

      particle.life -= deltaTime;

      if (particle.life <= 0) {
        particle.sprite.destroy();
        particles.splice(i, 1);
        continue;
      }

      // Apply velocity
      particle.sprite.x += particle.velocityX * deltaTime;
      particle.sprite.y += particle.velocityY * deltaTime;

      // Apply gravity
      particle.velocityY += particle.gravity * deltaTime;

      // Apply rotation
      particle.sprite.rotation += particle.rotationSpeed * deltaTime;

      // Fade out
      if (particle.fadeOut) {
        const alpha = particle.life / particle.maxLife;
        particle.sprite.setAlpha(alpha);
      }

      // Scale down
      const scale = 0.5 + (particle.life / particle.maxLife) * 0.5;
      particle.sprite.setScale(scale);
    }
  }

  /**
   * Create death explosion effect.
   */
  createDeathExplosion(x: number, y: number, color: number = this.config.primaryColor): void {
    const numParticles = 12;

    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2;
      const speed = 200 + Math.random() * 200;

      const size = 6 + Math.random() * 8;
      const sprite = this.scene.add.rectangle(x, y, size, size, color);
      sprite.setDepth(500);

      this.particles.push({
        sprite,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3,
        rotationSpeed: (Math.random() - 0.5) * 20,
        fadeOut: true,
        gravity: 800,
      });
    }

    // Inner burst (smaller, faster)
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 300 + Math.random() * 150;

      const size = 4 + Math.random() * 4;
      const sprite = this.scene.add.rectangle(x, y, size, size, 0xffffff);
      sprite.setDepth(501);

      this.particles.push({
        sprite,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.3 + Math.random() * 0.2,
        rotationSpeed: (Math.random() - 0.5) * 30,
        fadeOut: true,
        gravity: 600,
      });
    }
  }

  /**
   * Create jump dust effect.
   */
  createJumpDust(x: number, y: number): void {
    const numParticles = 6;

    for (let i = 0; i < numParticles; i++) {
      const offsetX = (Math.random() - 0.5) * 30;
      const sprite = this.scene.add.rectangle(x + offsetX, y, 4, 4, 0xffffff, 0.6);
      sprite.setDepth(350);

      this.particles.push({
        sprite,
        velocityX: (Math.random() - 0.5) * 100,
        velocityY: -50 - Math.random() * 50,
        life: 0.2 + Math.random() * 0.1,
        maxLife: 0.3,
        rotationSpeed: 0,
        fadeOut: true,
        gravity: 200,
      });
    }
  }

  /**
   * Create landing dust effect.
   */
  createLandingDust(x: number, y: number): void {
    const numParticles = 4;

    for (let i = 0; i < numParticles; i++) {
      const side = i < numParticles / 2 ? -1 : 1;
      const sprite = this.scene.add.rectangle(x, y, 3, 3, 0xffffff, 0.5);
      sprite.setDepth(350);

      this.particles.push({
        sprite,
        velocityX: side * (30 + Math.random() * 40),
        velocityY: -20 - Math.random() * 20,
        life: 0.15 + Math.random() * 0.1,
        maxLife: 0.25,
        rotationSpeed: 0,
        fadeOut: true,
        gravity: 300,
      });
    }
  }

  /**
   * Add trail particle behind the player.
   */
  addTrailParticle(x: number, y: number, color: number = this.config.secondaryColor): void {
    // Limit trail particles
    if (this.trailParticles.length > 30) {
      const oldest = this.trailParticles.shift();
      oldest?.sprite.destroy();
    }

    const sprite = this.scene.add.rectangle(x, y, 6, 6, color, 0.7);
    sprite.setDepth(350);

    this.trailParticles.push({
      sprite,
      velocityX: -20,
      velocityY: 0,
      life: 0.3,
      maxLife: 0.3,
      rotationSpeed: 0,
      fadeOut: true,
      gravity: 0,
    });
  }

  /**
   * Set particle colors.
   */
  setColors(primary: number, secondary: number): void {
    this.config.primaryColor = primary;
    this.config.secondaryColor = secondary;
  }

  /**
   * Clear all particles.
   */
  clear(): void {
    this.particles.forEach((p) => p.sprite.destroy());
    this.trailParticles.forEach((p) => p.sprite.destroy());
    this.particles = [];
    this.trailParticles = [];
  }

  /**
   * Destroy the particle manager.
   */
  destroy(): void {
    this.clear();
  }
}
