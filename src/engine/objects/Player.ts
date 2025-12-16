/**
 * Player game object.
 * Combines Phaser sprite with custom physics.
 */

import Phaser from 'phaser';

import type { AABB, Collidable, CollisionEvent } from '@core/collision';
import { checkPlayerCollisions, getPlayerHitbox, checkGrounded } from '@core/collision';
import type { PhysicsState, InputState, PhysicsConfig, IPlayerMode } from '@core/physics';
import type { PlayerModeType } from '@generated/index';
import {
  createDefaultPhysicsState,
  createDefaultPhysicsConfig,
  GRID,
  SIZES,
  SPEEDS,
  cubeMode,
  shipMode,
  ballMode,
} from '@core/physics';

/** Player configuration options */
export interface PlayerConfig {
  /** Starting X position in pixels */
  startX: number;

  /** Starting Y position in pixels */
  startY: number;

  /** Primary color (hex number) */
  primaryColor: number;

  /** Secondary color for effects */
  secondaryColor: number;
}

const DEFAULT_CONFIG: PlayerConfig = {
  startX: GRID.UNIT_SIZE * 3,
  startY: GRID.DEFAULT_GROUND_Y * GRID.UNIT_SIZE - SIZES.PLAYER / 2,
  primaryColor: 0x7dff00, // Bright lime green (GD default)
  secondaryColor: 0x00ffff,
};

/**
 * Player class that combines Phaser rendering with custom physics.
 * Creates a proper cube with icon styling like Geometry Dash.
 */
export class Player extends Phaser.GameObjects.Container {
  /** Internal physics state */
  private physicsState: PhysicsState;

  /** Physics configuration */
  private physicsConfig: PhysicsConfig;

  /** Current player mode (strategy pattern) */
  private currentMode: IPlayerMode;

  /** The main cube body */
  private cubeBody: Phaser.GameObjects.Rectangle;

  /** Inner icon design */
  private cubeIcon: Phaser.GameObjects.Graphics;

  /** Glow effect */
  private glowEffect: Phaser.GameObjects.Rectangle;

  /** Player configuration */
  private config: PlayerConfig;

  /** Reference to level objects for collision */
  private levelObjects: Collidable[] = [];

  /** Current horizontal speed in pixels/second */
  private currentSpeed: number;

  /** Audio time reference for position calculation */
  private _audioTime: number = 0;

  /** Starting X position */
  private startX: number;

  /** Was grounded last frame (for landing detection) */
  private wasGroundedLastFrame: boolean = true;

  /** Was in air last frame (for jump detection) */
  private wasInAir: boolean = false;

  constructor(scene: Phaser.Scene, config: Partial<PlayerConfig> = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    super(scene, mergedConfig.startX, mergedConfig.startY);

    this.config = mergedConfig;
    this.startX = mergedConfig.startX;

    // Initialize physics state
    this.physicsState = createDefaultPhysicsState({
      position: { x: mergedConfig.startX, y: mergedConfig.startY },
      isGrounded: true,
    });

    this.physicsConfig = createDefaultPhysicsConfig();
    this.currentMode = cubeMode;
    this.currentSpeed = SPEEDS.normal;

    // Create glow effect (behind cube)
    this.glowEffect = scene.add.rectangle(0, 0, SIZES.PLAYER + 8, SIZES.PLAYER + 8, 0xffffff, 0.15);
    this.add(this.glowEffect);

    // Create main cube body with slight rounding effect (use rectangle for now)
    this.cubeBody = scene.add.rectangle(0, 0, SIZES.PLAYER - 2, SIZES.PLAYER - 2, this.config.primaryColor);
    this.cubeBody.setStrokeStyle(2, this.darkenColor(this.config.primaryColor, 0.3));
    this.add(this.cubeBody);

    // Create inner icon design
    this.cubeIcon = scene.add.graphics();
    this.drawCubeIcon();
    this.add(this.cubeIcon);

    // Set depth
    this.setDepth(400);

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Draw the inner cube icon design.
   */
  private drawCubeIcon(): void {
    this.cubeIcon.clear();

    // Draw a simple geometric pattern inside the cube
    const size = SIZES.PLAYER * 0.3;
    const darkColor = this.darkenColor(this.config.primaryColor, 0.4);

    // Inner square/diamond pattern
    this.cubeIcon.fillStyle(darkColor, 0.8);
    this.cubeIcon.fillRect(-size / 2, -size / 2, size, size);

    // Highlight
    this.cubeIcon.fillStyle(0xffffff, 0.3);
    this.cubeIcon.fillRect(-size / 2, -size / 2, size, size / 3);
  }

  /**
   * Darken a color by a factor.
   */
  private darkenColor(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 255) * (1 - factor));
    const g = Math.floor(((color >> 8) & 255) * (1 - factor));
    const b = Math.floor((color & 255) * (1 - factor));
    return (r << 16) | (g << 8) | b;
  }

  /**
   * Set the level objects for collision detection.
   */
  setLevelObjects(objects: Collidable[]): void {
    this.levelObjects = objects;
  }

  /**
   * Update player physics and position.
   */
  update(input: InputState, deltaTime: number, audioTime?: number): void {
    if (this.physicsState.isDead) {
      return;
    }

    // Store previous state
    this.wasInAir = !this.physicsState.isGrounded;

    // Update X position based on audio time if provided (music-first loop)
    if (audioTime !== undefined) {
      this._audioTime = audioTime;
      this.physicsState.position.x = this.startX + audioTime * this.currentSpeed;
    }

    // Update physics through current mode
    this.currentMode.update(this.physicsState, input, deltaTime, this.physicsConfig);

    // Get player hitbox for collision checks
    const hitbox = this.getHitbox();

    // Check collisions
    const collisions = checkPlayerCollisions(hitbox, this.levelObjects);

    // Process collisions
    this.processCollisions(collisions);

    // Check if grounded
    this.wasGroundedLastFrame = this.physicsState.isGrounded;
    this.physicsState.isGrounded = checkGrounded(hitbox, this.levelObjects);

    // Handle landing (was in air, now grounded)
    if (this.wasInAir && this.physicsState.isGrounded) {
      this.onLanding();
    }

    // Handle jump (was grounded, now in air)
    if (this.wasGroundedLastFrame && !this.physicsState.isGrounded && this.physicsState.velocity.y < 0) {
      this.onJump();
    }

    // Handle leaving ground
    if (this.wasGroundedLastFrame && !this.physicsState.isGrounded) {
      this.physicsState.coyoteTimeRemaining = this.physicsConfig.coyoteTime;
    }

    // Apply ground constraint
    this.applyGroundConstraint();

    // Sync visual position with physics state
    this.syncVisuals();
  }

  /**
   * Process collision events.
   */
  private processCollisions(collisions: CollisionEvent[]): void {
    for (const collision of collisions) {
      if (collision.isHazard) {
        this.die();
        return;
      }

      if (collision.isSolid && collision.collision.normal.y !== 0) {
        if (collision.collision.normal.y > 0) {
          this.physicsState.position.y -= collision.collision.overlapY * collision.collision.normal.y;
          if (this.physicsState.velocity.y > 0) {
            this.physicsState.velocity.y = 0;
          }
        } else {
          this.physicsState.position.y -= collision.collision.overlapY * collision.collision.normal.y;
          if (this.physicsState.velocity.y < 0) {
            this.physicsState.velocity.y = 0;
          }
        }
      }
    }
  }

  /**
   * Apply ground constraint.
   */
  private applyGroundConstraint(): void {
    const groundY = GRID.DEFAULT_GROUND_Y * GRID.UNIT_SIZE - SIZES.PLAYER / 2;

    if (this.physicsState.position.y > groundY) {
      this.physicsState.position.y = groundY;
      this.physicsState.velocity.y = 0;
      this.physicsState.isGrounded = true;
    }
  }

  /**
   * Called when player lands on ground.
   */
  private onLanding(): void {
    this.physicsState.rotation = Math.round(this.physicsState.rotation / 90) * 90;
    this.physicsState.angularVelocity = 0;

    // Emit landing event for particles
    this.emit('land', this.physicsState.position.x, this.physicsState.position.y + SIZES.PLAYER / 2);
  }

  /**
   * Called when player jumps.
   */
  private onJump(): void {
    // Emit jump event for particles
    this.emit('jump', this.physicsState.position.x, this.physicsState.position.y + SIZES.PLAYER / 2);
  }

  /**
   * Sync visual position and rotation with physics state.
   */
  private syncVisuals(): void {
    this.x = this.physicsState.position.x;
    this.y = this.physicsState.position.y;

    const rotation = Phaser.Math.DegToRad(this.physicsState.rotation);
    this.cubeBody.setRotation(rotation);
    this.cubeIcon.setRotation(rotation);
    this.glowEffect.setRotation(rotation);

    // Pulse glow effect slightly
    const glowScale = 1 + Math.sin(this._audioTime * 10) * 0.05;
    this.glowEffect.setScale(glowScale);
  }

  /**
   * Get the player's collision hitbox.
   */
  getHitbox(): AABB {
    return getPlayerHitbox(
      this.physicsState.position.x,
      this.physicsState.position.y,
      SIZES.PLAYER,
      SIZES.PLAYER,
      this.physicsState.mode === 'cube'
    );
  }

  /**
   * Kill the player.
   */
  die(): void {
    if (this.physicsState.isDead) {
      return;
    }

    this.physicsState.isDead = true;

    // Hide the cube
    this.cubeBody.setVisible(false);
    this.cubeIcon.setVisible(false);
    this.glowEffect.setVisible(false);

    // Emit death event with position
    this.emit('death', this.physicsState.position.x, this.physicsState.position.y);
  }

  /**
   * Reset the player to starting position.
   */
  reset(): void {
    this.physicsState = createDefaultPhysicsState({
      position: { x: this.startX, y: this.config.startY },
      isGrounded: true,
    });

    this._audioTime = 0;
    this.wasGroundedLastFrame = true;
    this.wasInAir = false;

    // Show cube again
    this.cubeBody.setVisible(true);
    this.cubeIcon.setVisible(true);
    this.glowEffect.setVisible(true);

    // Reset color
    this.cubeBody.setFillStyle(this.config.primaryColor);
    this.cubeBody.setStrokeStyle(2, this.darkenColor(this.config.primaryColor, 0.3));
    this.drawCubeIcon();

    this.syncVisuals();
  }

  /**
   * Respawn at a checkpoint position with saved state.
   */
  respawnAtCheckpoint(
    x: number,
    y: number,
    mode: import('@generated/index').PlayerModeType,
    speed: import('@generated/index').SpeedModeType,
    gravityInverted: boolean
  ): void {
    this.physicsState = createDefaultPhysicsState({
      position: { x, y },
      isGrounded: true,
      mode,
      speed,
      gravityInverted,
    });

    this._audioTime = 0;
    this.wasGroundedLastFrame = true;
    this.wasInAir = false;

    // Set the mode properly
    this.setMode(mode);
    this.setSpeed(speed);

    if (gravityInverted !== this.physicsState.gravityInverted) {
      this.flipGravity();
    }

    // Show player again
    this.cubeBody.setVisible(true);
    this.cubeIcon.setVisible(true);
    this.glowEffect.setVisible(true);

    // Reset color
    this.cubeBody.setFillStyle(this.config.primaryColor);
    this.cubeBody.setStrokeStyle(2, this.darkenColor(this.config.primaryColor, 0.3));
    this.drawCubeIcon();

    this.syncVisuals();
  }

  /**
   * Set player colors.
   */
  setColors(primary: number, secondary: number): void {
    this.config.primaryColor = primary;
    this.config.secondaryColor = secondary;
    this.cubeBody.setFillStyle(primary);
    this.cubeBody.setStrokeStyle(2, this.darkenColor(primary, 0.3));
    this.drawCubeIcon();
  }

  /**
   * Get the current physics state.
   */
  getPhysicsState(): Readonly<PhysicsState> {
    return this.physicsState;
  }

  getX(): number {
    return this.physicsState.position.x;
  }

  getY(): number {
    return this.physicsState.position.y;
  }

  isDead(): boolean {
    return this.physicsState.isDead;
  }

  isGrounded(): boolean {
    return this.physicsState.isGrounded;
  }

  isGravityInverted(): boolean {
    return this.physicsState.gravityInverted;
  }

  /**
   * Apply a jump impulse to the player (used by jump pads/orbs).
   * The impulse is automatically adjusted for gravity direction.
   * @param force The base force to apply (positive = up in normal gravity)
   * @param _overrideGrounded Reserved for future use - allows jump even if not grounded
   */
  applyJumpImpulse(force: number, _overrideGrounded: boolean = true): void {
    if (this.physicsState.isDead) return;

    // Adjust force direction based on gravity
    const direction = this.physicsState.gravityInverted ? 1 : -1;
    this.physicsState.velocity.y = force * direction;

    // Mark as not grounded since we're now airborne
    this.physicsState.isGrounded = false;

    // Emit jump event for particles/sound
    this.emit('jump', this.physicsState.position.x, this.physicsState.position.y);
  }

  /**
   * Apply a boost impulse without affecting grounded state.
   * Used by orbs that don't fully reset jump mechanics.
   * @param force The force to add to current velocity
   */
  applyBoostImpulse(force: number): void {
    if (this.physicsState.isDead) return;

    // Adjust force direction based on gravity
    const direction = this.physicsState.gravityInverted ? 1 : -1;
    this.physicsState.velocity.y = force * direction;

    // Emit jump event for particles/sound
    this.emit('jump', this.physicsState.position.x, this.physicsState.position.y);
  }

  setSpeed(speedMode: keyof typeof SPEEDS): void {
    this.currentSpeed = SPEEDS[speedMode];
    this.physicsState.speed = speedMode;
  }

  getAudioTime(): number {
    return this._audioTime;
  }

  getProgress(levelLength: number): number {
    if (levelLength <= 0) return 0;
    const progress = (this.physicsState.position.x - this.startX) / levelLength;
    return Math.max(0, Math.min(1, progress));
  }

  getConfig(): PlayerConfig {
    return this.config;
  }

  /**
   * Get the current player mode type.
   */
  getMode(): PlayerModeType {
    return this.physicsState.mode;
  }

  /**
   * Set the player mode (cube, ship, ball).
   * Handles mode transition with proper callbacks.
   */
  setMode(mode: PlayerModeType): void {
    if (this.physicsState.mode === mode) {
      return;
    }

    // Exit current mode
    this.currentMode.onExit(this.physicsState);

    // Switch to new mode
    switch (mode) {
      case 'ship':
        this.currentMode = shipMode;
        break;
      case 'ball':
        this.currentMode = ballMode;
        break;
      case 'cube':
      default:
        this.currentMode = cubeMode;
        break;
    }

    // Enter new mode
    this.currentMode.onEnter(this.physicsState);

    // Update visuals
    this.updateModeVisuals();

    // Emit mode change event
    this.emit('modeChange', mode);
  }

  /**
   * Update visuals based on current mode.
   */
  private updateModeVisuals(): void {
    const mode = this.physicsState.mode;

    // Clear existing icon
    this.cubeIcon.clear();

    if (mode === 'cube') {
      // Standard cube icon
      this.drawCubeIcon();
      this.cubeBody.setSize(SIZES.PLAYER - 2, SIZES.PLAYER - 2);
    } else if (mode === 'ship') {
      // Ship mode - more horizontal, pointed look
      this.drawShipIcon();
      // Slightly wider hitbox representation
      this.cubeBody.setSize(SIZES.PLAYER, SIZES.PLAYER - 8);
    } else if (mode === 'ball') {
      // Ball mode - circular
      this.drawBallIcon();
      this.cubeBody.setSize(SIZES.PLAYER - 4, SIZES.PLAYER - 4);
    }
  }

  /**
   * Draw ship mode icon.
   */
  private drawShipIcon(): void {
    const color = this.config.primaryColor;
    const darkColor = this.darkenColor(color, 0.4);

    // Triangle-like ship shape
    this.cubeIcon.fillStyle(darkColor, 0.9);
    this.cubeIcon.beginPath();
    this.cubeIcon.moveTo(12, 0); // Nose
    this.cubeIcon.lineTo(-8, -8); // Top wing
    this.cubeIcon.lineTo(-4, 0); // Back center
    this.cubeIcon.lineTo(-8, 8); // Bottom wing
    this.cubeIcon.closePath();
    this.cubeIcon.fillPath();

    // Cockpit highlight
    this.cubeIcon.fillStyle(0xffffff, 0.4);
    this.cubeIcon.fillCircle(2, 0, 4);
  }

  /**
   * Draw ball mode icon.
   */
  private drawBallIcon(): void {
    const darkColor = this.darkenColor(this.config.primaryColor, 0.4);

    // Inner circle pattern
    this.cubeIcon.fillStyle(darkColor, 0.8);
    this.cubeIcon.fillCircle(0, 0, 8);

    // Highlight
    this.cubeIcon.fillStyle(0xffffff, 0.3);
    this.cubeIcon.fillCircle(-3, -3, 4);
  }

  /**
   * Flip gravity direction (for gravity portals).
   */
  flipGravity(): void {
    this.physicsState.gravityInverted = !this.physicsState.gravityInverted;
    this.emit('gravityFlip', this.physicsState.gravityInverted);
  }

}
