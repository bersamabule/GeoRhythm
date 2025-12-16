/**
 * Main gameplay scene with GD-style visuals.
 */

import Phaser from 'phaser';

import type { InputState } from '@core/physics';
import { createDefaultInputState, GRID } from '@core/physics';

import { gameConfig } from '@config/game.config';
import {
  levelLoader,
  audioManager,
  checkpointManager,
  type ParsedLevel,
  type ParsedLevelObject,
} from '@services/index';

import type { PlayerModeType, SpeedModeType } from '@generated/index';

import { Player } from '../objects';
import { SCENE_KEYS } from './MainMenuScene';
import {
  Background,
  ParticleManager,
  ObjectPool,
  type Poolable,
  type PooledPortal,
  type PooledCheckpoint,
  type PooledPad,
  type PooledOrb,
} from '../systems';

/** Game scene state */
interface GameState {
  attempt: number;
  isPaused: boolean;
  isComplete: boolean;
  startTime: number;
  gameTime: number;
  /** Whether audio is loaded and sync is enabled */
  audioSyncEnabled: boolean;
}

/** Scene data passed when starting the scene */
export interface GameSceneData {
  /** Level ID to load from manifest (optional - uses test level if not provided) */
  levelId?: string;
}

/**
 * Main gameplay scene with proper Geometry Dash visuals.
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private levelObjects: Poolable[] = [];
  private objectPool!: ObjectPool;
  private inputState: InputState = createDefaultInputState();
  private jumpWasPressed: boolean = false;

  private state: GameState = {
    attempt: 1,
    isPaused: false,
    isComplete: false,
    startTime: 0,
    gameTime: 0,
    audioSyncEnabled: false,
  };

  private keys!: {
    space: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    escape: Phaser.Input.Keyboard.Key;
    r: Phaser.Input.Keyboard.Key;
    p: Phaser.Input.Keyboard.Key;
  };

  /** Visual systems */
  private background!: Background;
  private particles!: ParticleManager;

  /** Screen flash overlay */
  private flashOverlay!: Phaser.GameObjects.Rectangle;

  /** UI Elements */
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressBg!: Phaser.GameObjects.Rectangle;
  private progressGlow!: Phaser.GameObjects.Rectangle;
  private attemptText!: Phaser.GameObjects.Text;

  private levelLength: number = 0;

  /** Trail spawn timer */
  private trailTimer: number = 0;

  /** Practice mode UI elements */
  private practiceModeText!: Phaser.GameObjects.Text;
  private checkpointIndicator!: Phaser.GameObjects.Text;

  /** Current loaded level data */
  private currentLevel: ParsedLevel | null = null;

  /** Level ID requested (from scene data) */
  private requestedLevelId: string | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: GameSceneData): void {
    this.requestedLevelId = data?.levelId ?? null;
  }

  create(): void {
    console.log('[GameScene] create() called');
    // Load level first (async, then continue setup)
    this.loadLevelAndStart();
  }

  /**
   * Load level data and initialize the scene.
   */
  private async loadLevelAndStart(): Promise<void> {
    console.log('[GameScene] loadLevelAndStart() called');
    // Load level data
    try {
      if (this.requestedLevelId) {
        // Load from manifest by ID
        console.log('[GameScene] Loading level from manifest:', this.requestedLevelId);
        this.currentLevel = await levelLoader.loadLevel(this.requestedLevelId);
      } else {
        // Use programmatic test level as fallback
        console.log('[GameScene] Creating test level');
        this.currentLevel = levelLoader.createTestLevel();
      }
      console.log('[GameScene] Level loaded:', this.currentLevel?.metadata?.name);
    } catch (error) {
      console.error('[GameScene] Failed to load level:', error);
      // Fallback to programmatic test level
      this.currentLevel = levelLoader.createTestLevel();
    }

    // Try to load audio for the level
    console.log('[GameScene] Loading audio...');
    await this.loadLevelAudio();

    // Now initialize the scene with level data
    console.log('[GameScene] Initializing scene...');
    this.initializeScene();
    console.log('[GameScene] Scene initialized successfully');
  }

  /**
   * Load audio for the current level.
   */
  private async loadLevelAudio(): Promise<void> {
    if (!this.currentLevel) return;

    // Get song path from level metadata
    // For now, use a test audio file or skip if not available
    const songPath = `/assets/audio/${this.currentLevel.metadata.songId ?? 'test'}.mp3`;

    try {
      await audioManager.loadSong({
        src: songPath,
        bpm: 120, // Default BPM, would come from level metadata
        offset: 0,
      });
      this.state.audioSyncEnabled = true;
      console.log('Audio loaded successfully');
    } catch (error) {
      console.warn('Failed to load level audio, using time-based sync:', error);
      this.state.audioSyncEnabled = false;
    }

    // Preload sound effects (non-blocking)
    audioManager.preloadSfx().catch((err) => {
      console.warn('Failed to preload SFX:', err);
    });
  }

  /**
   * Initialize scene after level is loaded.
   */
  private initializeScene(): void {
    if (!this.currentLevel) {
      throw new Error('No level loaded');
    }

    // Create object pool for efficient object recycling
    this.objectPool = new ObjectPool(this, {
      initialBlocks: 150, // Enough for most levels
      initialSpikes: 75,
      maxPoolSize: 3000,
    });

    // Create background system with level colors
    this.background = new Background(this, {
      topColor: this.currentLevel.settings.backgroundColor,
      bottomColor: 0x001144,
      groundColor: this.currentLevel.settings.groundColor,
      lineColor: this.currentLevel.settings.lineColor,
      showGrid: true,
    });

    // Create particle manager
    this.particles = new ParticleManager(this);

    // Create level objects from loaded data
    this.createLevelFromData(this.currentLevel);

    // Create player
    this.player = new Player(this, {
      startX: GRID.UNIT_SIZE * 3,
      startY: GRID.DEFAULT_GROUND_Y * GRID.UNIT_SIZE - 20,
      primaryColor: 0x7dff00,
      secondaryColor: 0x00ffff,
    });

    // Set level objects for collision
    this.player.setLevelObjects(this.levelObjects);

    // Listen for player events
    this.player.on('death', this.onPlayerDeath, this);
    this.player.on('jump', this.onPlayerJump, this);
    this.player.on('land', this.onPlayerLand, this);

    // Create flash overlay (for death effect)
    this.flashOverlay = this.add.rectangle(
      gameConfig.display.width / 2,
      gameConfig.display.height / 2,
      gameConfig.display.width,
      gameConfig.display.height,
      0xffffff,
      0
    );
    this.flashOverlay.setScrollFactor(0);
    this.flashOverlay.setDepth(900);

    // Setup camera
    this.setupCamera();

    // Setup input
    this.setupInput();

    // Create UI
    this.createUI();

    // Start the game
    this.state.startTime = this.time.now;
    this.state.gameTime = 0;

    // Start audio playback if available (requires user interaction first)
    // Audio will start on first input (click/key) due to browser autoplay policies
    this.startAudioOnFirstInput();
  }

  /**
   * Start audio playback on first user input (browser autoplay policy).
   */
  private startAudioOnFirstInput(): void {
    if (!this.state.audioSyncEnabled) return;

    const startAudio = () => {
      if (audioManager.isReady() && !audioManager.isPlaying()) {
        audioManager.play();
      }
      // Remove listeners after first input
      this.input.off('pointerdown', startAudio);
      this.input.keyboard?.off('keydown', startAudio);
    };

    this.input.on('pointerdown', startAudio);
    this.input.keyboard?.on('keydown', startAudio);
  }

  /**
   * Create level objects from parsed level data using object pool.
   */
  private createLevelFromData(level: ParsedLevel): void {
    // Release any existing objects back to pool
    if (this.objectPool) {
      this.objectPool.releaseAll();
    }
    this.levelObjects = [];

    // Acquire objects from pool for each level object
    for (const obj of level.objects) {
      const gameObject = this.acquirePooledObject(obj);
      if (gameObject) {
        this.levelObjects.push(gameObject);
      }
    }

    // Set level length from parsed data
    this.levelLength = level.lengthPixels;
  }

  /**
   * Acquire a pooled object for the given level object data.
   */
  private acquirePooledObject(obj: ParsedLevelObject): Poolable | null {
    switch (obj.type) {
      case 'block':
        return this.objectPool.acquireBlock(obj.gridX, obj.gridY);

      case 'spike':
        return this.objectPool.acquireSpike(obj.gridX, obj.gridY, false);

      case 'spikeInverted':
        return this.objectPool.acquireSpike(obj.gridX, obj.gridY, true);

      case 'portalMode':
        return this.objectPool.acquirePortal(
          obj.gridX,
          obj.gridY,
          'mode',
          obj.properties?.targetMode as PlayerModeType | undefined
        );

      case 'portalGravity':
        return this.objectPool.acquirePortal(obj.gridX, obj.gridY, 'gravity');

      case 'portalSpeed':
        return this.objectPool.acquirePortal(
          obj.gridX,
          obj.gridY,
          'speed',
          undefined,
          obj.properties?.targetSpeed as SpeedModeType | undefined
        );

      case 'checkpoint':
        return this.objectPool.acquireCheckpoint(
          obj.gridX,
          obj.gridY,
          obj.id,
          (obj.properties?.name as string) ?? ''
        );

      case 'padYellow':
        return this.objectPool.acquirePad(obj.gridX, obj.gridY, 'yellow');

      case 'padPink':
        return this.objectPool.acquirePad(obj.gridX, obj.gridY, 'pink');

      case 'orbYellow':
        return this.objectPool.acquireOrb(obj.gridX, obj.gridY, 'yellow');

      case 'orbBlue':
        return this.objectPool.acquireOrb(obj.gridX, obj.gridY, 'blue');

      default:
        // Skip unimplemented object types
        console.warn(`Unimplemented object type: ${obj.type}`);
        return null;
    }
  }

  /**
   * Setup camera to follow player.
   */
  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 1, 0.1);
    this.cameras.main.setFollowOffset(-gameConfig.camera.lookAheadX, 0);
    this.cameras.main.setBounds(0, 0, this.levelLength + gameConfig.display.width, gameConfig.display.height);
  }

  /**
   * Setup keyboard input.
   */
  private setupInput(): void {
    const keyboard = this.input.keyboard;
    if (keyboard === null) {
      throw new Error('Keyboard input not available');
    }

    this.keys = {
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      escape: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      r: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      p: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
    };

    // Mouse/touch input
    this.input.on('pointerdown', () => {
      this.inputState.jumpPressed = true;
      this.inputState.jumpHeld = true;
    });

    this.input.on('pointerup', () => {
      this.inputState.jumpHeld = false;
    });
  }

  /**
   * Create UI elements with GD-style visuals.
   */
  private createUI(): void {
    const width = gameConfig.display.width;

    // Progress bar background (darker)
    this.progressBg = this.add.rectangle(width / 2, 12, width - 40, 8, 0x1a1a1a);
    this.progressBg.setScrollFactor(0);
    this.progressBg.setDepth(1000);
    this.progressBg.setStrokeStyle(1, 0x333333);

    // Progress bar glow (behind the bar)
    this.progressGlow = this.add.rectangle(20, 12, 0, 12, 0x7dff00, 0.3);
    this.progressGlow.setScrollFactor(0);
    this.progressGlow.setOrigin(0, 0.5);
    this.progressGlow.setDepth(1000);

    // Progress bar fill (player color)
    this.progressBar = this.add.rectangle(20, 12, 0, 6, 0x7dff00);
    this.progressBar.setScrollFactor(0);
    this.progressBar.setOrigin(0, 0.5);
    this.progressBar.setDepth(1001);

    // Attempt counter with shadow
    const shadowText = this.add.text(width - 19, 33, `Attempt ${this.state.attempt}`, {
      fontSize: '18px',
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
    });
    shadowText.setScrollFactor(0);
    shadowText.setOrigin(1, 0.5);
    shadowText.setDepth(999);
    shadowText.setAlpha(0.5);
    shadowText.setName('attemptShadow');

    this.attemptText = this.add.text(width - 20, 32, `Attempt ${this.state.attempt}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    this.attemptText.setScrollFactor(0);
    this.attemptText.setOrigin(1, 0.5);
    this.attemptText.setDepth(1000);

    // Practice mode indicator (bottom left)
    this.practiceModeText = this.add.text(20, gameConfig.display.height - 20, '', {
      fontSize: '16px',
      color: '#00ff00',
      fontFamily: 'Arial, sans-serif',
    });
    this.practiceModeText.setScrollFactor(0);
    this.practiceModeText.setOrigin(0, 1);
    this.practiceModeText.setDepth(1000);
    this.updatePracticeModeUI();

    // Checkpoint indicator (below practice mode text)
    this.checkpointIndicator = this.add.text(20, gameConfig.display.height - 40, '', {
      fontSize: '14px',
      color: '#88ff88',
      fontFamily: 'Arial, sans-serif',
    });
    this.checkpointIndicator.setScrollFactor(0);
    this.checkpointIndicator.setOrigin(0, 1);
    this.checkpointIndicator.setDepth(1000);
  }

  /**
   * Update UI elements.
   */
  private updateUI(): void {
    // Update progress bar
    const progress = this.player.getProgress(this.levelLength);
    const maxWidth = gameConfig.display.width - 40;
    this.progressBar.width = maxWidth * progress;
    this.progressGlow.width = maxWidth * progress;

    // Check for level completion
    if (progress >= 1 && !this.state.isComplete) {
      this.onLevelComplete();
    }
  }

  /**
   * Update practice mode UI elements.
   */
  private updatePracticeModeUI(): void {
    if (checkpointManager.isPracticeMode) {
      this.practiceModeText.setText('PRACTICE MODE (P to toggle)');
      this.practiceModeText.setColor('#00ff00');

      const checkpointCount = checkpointManager.getReachedCheckpointCount();
      if (checkpointManager.hasCheckpoint()) {
        this.checkpointIndicator.setText(`Checkpoints: ${checkpointCount}`);
      } else {
        this.checkpointIndicator.setText('No checkpoint set');
      }
    } else {
      this.practiceModeText.setText('Press P for Practice Mode');
      this.practiceModeText.setColor('#888888');
      this.checkpointIndicator.setText('');
    }
  }

  /**
   * Toggle practice mode on/off.
   */
  private togglePracticeMode(): void {
    checkpointManager.togglePracticeMode();
    this.updatePracticeModeUI();

    // Show feedback
    const feedbackText = this.add.text(
      gameConfig.display.width / 2,
      gameConfig.display.height / 2,
      checkpointManager.isPracticeMode ? 'Practice Mode ON' : 'Practice Mode OFF',
      {
        fontSize: '32px',
        color: checkpointManager.isPracticeMode ? '#00ff00' : '#ff8800',
        fontStyle: 'bold',
      }
    );
    feedbackText.setScrollFactor(0);
    feedbackText.setOrigin(0.5);
    feedbackText.setDepth(2000);

    this.tweens.add({
      targets: feedbackText,
      alpha: 0,
      y: feedbackText.y - 50,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => feedbackText.destroy(),
    });
  }

  /**
   * Called when the player dies.
   */
  private onPlayerDeath(x: number, y: number): void {
    // Play death sound effect
    audioManager.playDeath();

    // Stop music on death
    if (this.state.audioSyncEnabled) {
      audioManager.stop();
    }

    // Create death explosion particles
    const playerConfig = this.player.getConfig();
    this.particles.createDeathExplosion(x, y, playerConfig.primaryColor);

    // Flash the screen white briefly
    this.flashOverlay.setAlpha(0.6);
    this.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
    });

    // Camera shake
    this.cameras.main.shake(150, 0.01);

    // Check if we should respawn at checkpoint (practice mode)
    const checkpointState = checkpointManager.getRespawnState();
    if (checkpointState) {
      // Brief pause before checkpoint respawn
      this.time.delayedCall(400, () => {
        this.respawnAtCheckpoint(checkpointState);
      });
    } else {
      // Brief pause before full restart
      this.time.delayedCall(600, () => {
        this.restart();
      });
    }
  }

  /**
   * Respawn at a checkpoint (practice mode).
   */
  private respawnAtCheckpoint(checkpoint: import('@services/CheckpointManager').CheckpointState): void {
    // Don't increment attempt counter for checkpoint respawn
    this.state.isComplete = false;
    this.state.gameTime = checkpoint.audioTime;
    this.trailTimer = 0;

    // Reset player to checkpoint state
    this.player.respawnAtCheckpoint(
      checkpoint.playerX,
      checkpoint.playerY,
      checkpoint.mode,
      checkpoint.speed,
      checkpoint.gravityInverted
    );

    // Clear particles
    this.particles.clear();

    // Don't reset checkpoint triggers - we want to keep them triggered
    // Reset portal triggers
    this.objectPool.resetPortalTriggers();

    // Seek audio to checkpoint time
    if (this.state.audioSyncEnabled) {
      audioManager.seek(checkpoint.audioTime);
      audioManager.play();
    }

    // Notify checkpoint manager
    checkpointManager.notifyRespawn(checkpoint);

    // Update UI
    this.updatePracticeModeUI();

    // Update progress bar
    this.progressBar.width = 0;
    this.progressGlow.width = 0;
  }

  /**
   * Called when the player jumps.
   */
  private onPlayerJump(x: number, y: number): void {
    // Play jump sound effect
    audioManager.playJump();

    this.particles.createJumpDust(x, y);
  }

  /**
   * Called when the player lands.
   */
  private onPlayerLand(x: number, y: number): void {
    this.particles.createLandingDust(x, y);
  }

  /**
   * Called when level is completed.
   */
  private onLevelComplete(): void {
    this.state.isComplete = true;

    // Play completion sound
    audioManager.playComplete();

    // Stop music
    if (this.state.audioSyncEnabled) {
      audioManager.stop();
    }

    // Show completion message
    const completeText = this.add.text(
      gameConfig.display.width / 2,
      gameConfig.display.height / 2,
      'Level Complete!',
      {
        fontSize: '48px',
        color: '#00ff00',
        fontStyle: 'bold',
      }
    );
    completeText.setScrollFactor(0);
    completeText.setOrigin(0.5);
    completeText.setDepth(2000);

    // Return to Level Select after a delay
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start(SCENE_KEYS.LEVEL_SELECT);
      });
    });
  }

  /**
   * Restart the level.
   */
  private restart(): void {
    this.state.attempt++;
    this.state.isComplete = false;
    this.state.gameTime = 0;
    this.state.startTime = this.time.now;
    this.trailTimer = 0;

    this.player.reset();
    this.cameras.main.scrollX = 0;

    // Clear particles
    this.particles.clear();

    // Reset portal triggers so they can be activated again
    this.objectPool.resetPortalTriggers();

    // Reset checkpoint triggers
    this.objectPool.resetCheckpointTriggers();

    // Reset pad and orb triggers
    this.objectPool.resetPadTriggers();
    this.objectPool.resetOrbTriggers();

    // Clear checkpoint states for new attempt
    checkpointManager.resetTriggeredCheckpoints();

    // Restart audio from beginning
    if (this.state.audioSyncEnabled) {
      audioManager.restart();
    }

    // Update attempt counter
    this.attemptText.setText(`Attempt ${this.state.attempt}`);
    const shadowText = this.children.getByName('attemptShadow') as Phaser.GameObjects.Text | null;
    if (shadowText) {
      shadowText.setText(`Attempt ${this.state.attempt}`);
    }
    this.progressBar.width = 0;
    this.progressGlow.width = 0;
  }

  update(_time: number, delta: number): void {
    // Skip update if scene isn't fully initialized yet (async loading)
    if (!this.keys || !this.player) {
      return;
    }

    if (this.state.isPaused || this.state.isComplete) {
      return;
    }

    // Update game time - use audio time if available (music-first approach)
    const deltaSeconds = delta / 1000;
    if (this.state.audioSyncEnabled && audioManager.isPlaying()) {
      // Music-first: derive game time from audio position
      this.state.gameTime = audioManager.getCurrentTime();
    } else {
      // Fallback: use frame delta
      this.state.gameTime += deltaSeconds;
    }

    // Process keyboard input
    const jumpPressed = this.keys.space.isDown || this.keys.up.isDown;
    this.inputState.jumpPressed = jumpPressed && !this.jumpWasPressed;
    this.inputState.jumpHeld = jumpPressed;
    this.jumpWasPressed = jumpPressed;

    // Check for restart
    if (this.keys.r.isDown) {
      this.restart();
      return;
    }

    // Check for pause
    if (Phaser.Input.Keyboard.JustDown(this.keys.escape)) {
      this.togglePause();
      return;
    }

    // Check for practice mode toggle
    if (Phaser.Input.Keyboard.JustDown(this.keys.p)) {
      this.togglePracticeMode();
    }

    // Update player with game time (music-first approach)
    this.player.update(this.inputState, deltaSeconds, this.state.gameTime);

    // Check portal collisions
    this.checkPortalCollisions();

    // Check checkpoint collisions
    this.checkCheckpointCollisions();

    // Check pad collisions (automatic jump on contact)
    this.checkPadCollisions();

    // Check orb collisions (jump on click while touching)
    this.checkOrbCollisions();

    // Spawn trail particles periodically
    this.trailTimer += deltaSeconds;
    if (this.trailTimer >= 0.03 && !this.player.isDead()) {
      this.trailTimer = 0;
      const playerConfig = this.player.getConfig();
      this.particles.addTrailParticle(
        this.player.getX() - 10,
        this.player.getY(),
        playerConfig.secondaryColor
      );
    }

    // Update particles
    this.particles.update(deltaSeconds);

    // Reset frame-specific input states
    this.inputState.jumpPressed = false;

    // Update UI
    this.updateUI();
  }

  /**
   * Get the background system.
   */
  getBackground(): Background {
    return this.background;
  }

  /**
   * Check for portal collisions and trigger mode/gravity/speed changes.
   */
  private checkPortalCollisions(): void {
    const playerHitbox = this.player.getHitbox();
    const portals = this.objectPool.getActivePortals();

    for (const portal of portals) {
      if (!portal.shouldTrigger()) {
        continue;
      }

      // Simple AABB overlap check for portal
      const portalX = (portal as Phaser.GameObjects.Container).x;
      const portalY = (portal as Phaser.GameObjects.Container).y;
      const portalWidth = 32; // Portal width
      const portalHeight = 100; // Portal height (tall)

      const portalLeft = portalX - portalWidth / 2;
      const portalRight = portalX + portalWidth / 2;
      const portalTop = portalY - portalHeight / 2;
      const portalBottom = portalY + portalHeight / 2;

      // Check overlap
      if (
        playerHitbox.x < portalRight &&
        playerHitbox.x + playerHitbox.width > portalLeft &&
        playerHitbox.y < portalBottom &&
        playerHitbox.y + playerHitbox.height > portalTop
      ) {
        // Trigger the portal
        portal.trigger();
        this.handlePortalTrigger(portal);
      }
    }
  }

  /**
   * Handle portal trigger effects.
   */
  private handlePortalTrigger(portal: PooledPortal): void {
    switch (portal.portalType) {
      case 'mode':
        if (portal.targetMode) {
          this.player.setMode(portal.targetMode);
          // Play portal sound
          audioManager.playClick();
        }
        break;

      case 'gravity':
        this.player.flipGravity();
        audioManager.playClick();
        break;

      case 'speed':
        if (portal.targetSpeed) {
          this.player.setSpeed(portal.targetSpeed);
          audioManager.playClick();
        }
        break;
    }
  }

  /**
   * Check for checkpoint collisions.
   */
  private checkCheckpointCollisions(): void {
    const playerHitbox = this.player.getHitbox();
    const checkpoints = this.objectPool.getActiveCheckpoints();

    for (const checkpoint of checkpoints) {
      if (!checkpoint.shouldTrigger()) {
        continue;
      }

      // Simple AABB overlap check for checkpoint
      const checkpointX = (checkpoint as Phaser.GameObjects.Container).x;
      const checkpointY = (checkpoint as Phaser.GameObjects.Container).y;
      const checkpointSize = 32; // Checkpoint collision size

      const checkpointLeft = checkpointX - checkpointSize / 2;
      const checkpointRight = checkpointX + checkpointSize / 2;
      const checkpointTop = checkpointY - checkpointSize / 2;
      const checkpointBottom = checkpointY + checkpointSize / 2;

      // Check overlap
      if (
        playerHitbox.x < checkpointRight &&
        playerHitbox.x + playerHitbox.width > checkpointLeft &&
        playerHitbox.y < checkpointBottom &&
        playerHitbox.y + playerHitbox.height > checkpointTop
      ) {
        // Trigger the checkpoint
        checkpoint.trigger();
        this.handleCheckpointTrigger(checkpoint);
      }
    }
  }

  /**
   * Handle checkpoint trigger effects.
   */
  private handleCheckpointTrigger(checkpoint: PooledCheckpoint): void {
    // Get current audio time
    const audioTime = this.state.audioSyncEnabled
      ? audioManager.getCurrentTime()
      : this.state.gameTime;

    // Record checkpoint with current player state
    const checkpointState = checkpointManager.recordCheckpoint(
      checkpoint.checkpointId,
      this.player.getPhysicsState(),
      audioTime,
      Math.floor((checkpoint as Phaser.GameObjects.Container).x / GRID.UNIT_SIZE),
      Math.floor((checkpoint as Phaser.GameObjects.Container).y / GRID.UNIT_SIZE)
    );

    // Show feedback if checkpoint was saved (practice mode)
    if (checkpointState) {
      this.showCheckpointFeedback();
    }

    // Update UI
    this.updatePracticeModeUI();
  }

  /**
   * Show visual feedback when reaching a checkpoint.
   */
  private showCheckpointFeedback(): void {
    const feedbackText = this.add.text(
      gameConfig.display.width / 2,
      gameConfig.display.height / 3,
      'Checkpoint!',
      {
        fontSize: '24px',
        color: '#00ff00',
        fontStyle: 'bold',
      }
    );
    feedbackText.setScrollFactor(0);
    feedbackText.setOrigin(0.5);
    feedbackText.setDepth(2000);

    this.tweens.add({
      targets: feedbackText,
      alpha: 0,
      y: feedbackText.y - 30,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => feedbackText.destroy(),
    });
  }

  // ===========================================================================
  // Jump Pad Collision
  // ===========================================================================

  /**
   * Check for pad collisions - automatic jump when touching pad surface.
   */
  private checkPadCollisions(): void {
    const playerHitbox = this.player.getHitbox();
    const pads = this.objectPool.getActivePads();

    for (const pad of pads) {
      if (!pad.shouldTrigger()) {
        continue;
      }

      // Pad collision area (top surface)
      const padX = (pad as Phaser.GameObjects.Container).x;
      const padY = (pad as Phaser.GameObjects.Container).y;
      const padWidth = 40; // Match visual width
      const padHeight = 16; // Only top portion triggers

      const padLeft = padX - padWidth / 2;
      const padRight = padX + padWidth / 2;
      const padTop = padY - padHeight;
      const padBottom = padY;

      // Check if player is landing on pad (from above)
      const playerBottom = playerHitbox.y + playerHitbox.height;
      const playerCenterX = playerHitbox.x + playerHitbox.width / 2;

      if (
        playerCenterX > padLeft &&
        playerCenterX < padRight &&
        playerBottom > padTop &&
        playerBottom < padBottom + 10 && // Small tolerance
        playerHitbox.y < padTop // Player is above pad
      ) {
        // Trigger the pad
        pad.trigger();
        this.handlePadTrigger(pad);
      }
    }
  }

  /**
   * Handle pad trigger - apply jump impulse.
   */
  private handlePadTrigger(pad: PooledPad): void {
    // Apply jump impulse to player
    this.player.applyJumpImpulse(pad.jumpForce);

    // Play jump sound
    audioManager.playClick();

    // Create particles at pad position
    const padX = (pad as Phaser.GameObjects.Container).x;
    const padY = (pad as Phaser.GameObjects.Container).y;
    this.particles.createJumpDust(padX, padY - 10);
  }

  // ===========================================================================
  // Jump Orb Collision
  // ===========================================================================

  /**
   * Check for orb collisions - jump only when player clicks while touching orb.
   */
  private checkOrbCollisions(): void {
    const playerHitbox = this.player.getHitbox();
    const orbs = this.objectPool.getActiveOrbs();

    for (const orb of orbs) {
      // Orb collision area (circular trigger zone)
      const orbX = (orb as Phaser.GameObjects.Container).x;
      const orbY = (orb as Phaser.GameObjects.Container).y;
      const orbRadius = 20; // Match visual size

      const orbLeft = orbX - orbRadius;
      const orbRight = orbX + orbRadius;
      const orbTop = orbY - orbRadius;
      const orbBottom = orbY + orbRadius;

      // Check if player overlaps orb trigger zone
      const isOverlapping =
        playerHitbox.x < orbRight &&
        playerHitbox.x + playerHitbox.width > orbLeft &&
        playerHitbox.y < orbBottom &&
        playerHitbox.y + playerHitbox.height > orbTop;

      // Update orb hover state (for visual feedback)
      orb.setPlayerInside(isOverlapping);

      // Check if player clicks while overlapping an untriggered orb
      if (isOverlapping && orb.shouldTrigger() && this.inputState.jumpPressed) {
        orb.trigger();
        this.handleOrbTrigger(orb);
      }
    }
  }

  /**
   * Handle orb trigger - apply boost impulse.
   */
  private handleOrbTrigger(orb: PooledOrb): void {
    // Apply boost impulse to player (maintains momentum better than full jump)
    this.player.applyBoostImpulse(orb.jumpForce);

    // Play orb activation sound
    audioManager.playClick();

    // Create particles at orb position
    const orbX = (orb as Phaser.GameObjects.Container).x;
    const orbY = (orb as Phaser.GameObjects.Container).y;
    this.particles.createJumpDust(orbX, orbY);
  }

  /**
   * Toggle pause state.
   */
  private togglePause(): void {
    this.state.isPaused = !this.state.isPaused;

    if (this.state.isPaused) {
      // Pause audio
      if (this.state.audioSyncEnabled) {
        audioManager.pause();
      }

      // Show pause overlay
      const pauseText = this.add.text(
        gameConfig.display.width / 2,
        gameConfig.display.height / 2,
        'PAUSED\n\nPress ESC to resume\nPress R to restart',
        {
          fontSize: '32px',
          color: '#ffffff',
          align: 'center',
        }
      );
      pauseText.setScrollFactor(0);
      pauseText.setOrigin(0.5);
      pauseText.setDepth(2000);
      pauseText.setName('pauseText');
    } else {
      // Resume audio
      if (this.state.audioSyncEnabled) {
        audioManager.play();
      }
      // Remove pause overlay
      const pauseText = this.children.getByName('pauseText');
      if (pauseText !== null) {
        pauseText.destroy();
      }
    }
  }
}
