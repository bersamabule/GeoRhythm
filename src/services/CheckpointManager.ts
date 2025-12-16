/**
 * Checkpoint Manager Service
 * Manages practice mode checkpoints - saving and restoring player state.
 *
 * In practice mode, players can set checkpoints and respawn at them
 * instead of restarting the entire level on death.
 */

import type { PhysicsState } from '@core/physics/types';
import type { PlayerModeType, SpeedModeType } from '@generated/index';

// =============================================================================
// Types
// =============================================================================

/** State saved at a checkpoint */
export interface CheckpointState {
  /** Unique checkpoint ID */
  id: number;

  /** Grid X position where checkpoint was triggered */
  gridX: number;

  /** Grid Y position of the checkpoint */
  gridY: number;

  /** Audio time when checkpoint was reached (seconds) */
  audioTime: number;

  /** Player mode at checkpoint */
  mode: PlayerModeType;

  /** Speed setting at checkpoint */
  speed: SpeedModeType;

  /** Whether gravity was inverted */
  gravityInverted: boolean;

  /** Player X position in pixels */
  playerX: number;

  /** Player Y position in pixels */
  playerY: number;

  /** Timestamp when checkpoint was saved */
  savedAt: number;
}

/** Checkpoint definition from level data */
export interface CheckpointDefinition {
  /** Unique checkpoint ID */
  id: number;

  /** Grid X position */
  x: number;

  /** Grid Y position */
  y: number;

  /** Optional display name */
  name?: string;
}

/** Events emitted by CheckpointManager */
export interface CheckpointEvents {
  /** Emitted when a checkpoint is reached for the first time */
  checkpointReached: (checkpoint: CheckpointState) => void;

  /** Emitted when player respawns at a checkpoint */
  checkpointRespawn: (checkpoint: CheckpointState) => void;

  /** Emitted when practice mode is toggled */
  practiceModeChanged: (enabled: boolean) => void;
}

// =============================================================================
// Checkpoint Manager
// =============================================================================

/**
 * Manages checkpoint state for practice mode.
 * Stores player states at checkpoints and handles respawn logic.
 */
export class CheckpointManager {
  /** Whether practice mode is active */
  private _isPracticeMode: boolean = false;

  /** Saved checkpoint states */
  private checkpointStates: Map<number, CheckpointState> = new Map();

  /** Last checkpoint the player passed (for respawn) */
  private lastCheckpointId: number | null = null;

  /** Checkpoint definitions from level data */
  private checkpointDefinitions: Map<number, CheckpointDefinition> = new Map();

  /** Set of checkpoint IDs that have been triggered this attempt */
  private triggeredCheckpoints: Set<number> = new Set();

  /** Event listeners */
  private listeners: Map<keyof CheckpointEvents, Set<Function>> = new Map();

  constructor() {
    // Initialize listener maps
    this.listeners.set('checkpointReached', new Set());
    this.listeners.set('checkpointRespawn', new Set());
    this.listeners.set('practiceModeChanged', new Set());
  }

  // ===========================================================================
  // Practice Mode Control
  // ===========================================================================

  /**
   * Check if practice mode is enabled.
   */
  get isPracticeMode(): boolean {
    return this._isPracticeMode;
  }

  /**
   * Enable or disable practice mode.
   */
  setPracticeMode(enabled: boolean): void {
    if (this._isPracticeMode !== enabled) {
      this._isPracticeMode = enabled;

      if (!enabled) {
        // Clear all saved checkpoints when exiting practice mode
        this.clearAllCheckpoints();
      }

      this.emit('practiceModeChanged', enabled);
    }
  }

  /**
   * Toggle practice mode on/off.
   */
  togglePracticeMode(): boolean {
    this.setPracticeMode(!this._isPracticeMode);
    return this._isPracticeMode;
  }

  // ===========================================================================
  // Checkpoint Definitions (from level data)
  // ===========================================================================

  /**
   * Load checkpoint definitions from level data.
   * Called when a level is loaded.
   */
  loadCheckpoints(checkpoints: CheckpointDefinition[]): void {
    this.checkpointDefinitions.clear();
    for (const checkpoint of checkpoints) {
      this.checkpointDefinitions.set(checkpoint.id, checkpoint);
    }
  }

  /**
   * Get all checkpoint definitions.
   */
  getCheckpointDefinitions(): CheckpointDefinition[] {
    return Array.from(this.checkpointDefinitions.values());
  }

  /**
   * Get a specific checkpoint definition.
   */
  getCheckpointDefinition(id: number): CheckpointDefinition | undefined {
    return this.checkpointDefinitions.get(id);
  }

  // ===========================================================================
  // Checkpoint State Management
  // ===========================================================================

  /**
   * Record a checkpoint when the player passes through it.
   * Only saves state in practice mode.
   *
   * @param checkpointId The checkpoint ID
   * @param physicsState Current player physics state
   * @param audioTime Current audio playback time
   * @param gridX Grid X position of the checkpoint
   * @param gridY Grid Y position of the checkpoint
   * @returns The saved checkpoint state, or null if not in practice mode
   */
  recordCheckpoint(
    checkpointId: number,
    physicsState: PhysicsState,
    audioTime: number,
    gridX: number,
    gridY: number
  ): CheckpointState | null {
    // Always track which checkpoints have been triggered (for UI)
    const firstTime = !this.triggeredCheckpoints.has(checkpointId);
    this.triggeredCheckpoints.add(checkpointId);

    // Only save state in practice mode
    if (!this._isPracticeMode) {
      return null;
    }

    const state: CheckpointState = {
      id: checkpointId,
      gridX,
      gridY,
      audioTime,
      mode: physicsState.mode,
      speed: physicsState.speed,
      gravityInverted: physicsState.gravityInverted,
      playerX: physicsState.position.x,
      playerY: physicsState.position.y,
      savedAt: Date.now(),
    };

    this.checkpointStates.set(checkpointId, state);
    this.lastCheckpointId = checkpointId;

    if (firstTime) {
      this.emit('checkpointReached', state);
    }

    return state;
  }

  /**
   * Get the last checkpoint state for respawning.
   */
  getLastCheckpoint(): CheckpointState | null {
    if (this.lastCheckpointId === null) {
      return null;
    }
    return this.checkpointStates.get(this.lastCheckpointId) ?? null;
  }

  /**
   * Get a specific checkpoint state.
   */
  getCheckpointState(id: number): CheckpointState | null {
    return this.checkpointStates.get(id) ?? null;
  }

  /**
   * Get all saved checkpoint states.
   */
  getAllCheckpointStates(): CheckpointState[] {
    return Array.from(this.checkpointStates.values());
  }

  /**
   * Check if the player has reached any checkpoint.
   */
  hasCheckpoint(): boolean {
    return this.lastCheckpointId !== null && this.checkpointStates.has(this.lastCheckpointId);
  }

  /**
   * Check if a specific checkpoint has been triggered this attempt.
   */
  isCheckpointTriggered(id: number): boolean {
    return this.triggeredCheckpoints.has(id);
  }

  /**
   * Get the count of reached checkpoints.
   */
  getReachedCheckpointCount(): number {
    return this.triggeredCheckpoints.size;
  }

  // ===========================================================================
  // Respawn
  // ===========================================================================

  /**
   * Get the respawn state from the last checkpoint.
   * Returns null if no checkpoint available or not in practice mode.
   */
  getRespawnState(): CheckpointState | null {
    if (!this._isPracticeMode) {
      return null;
    }
    return this.getLastCheckpoint();
  }

  /**
   * Notify that player respawned at a checkpoint.
   */
  notifyRespawn(checkpoint: CheckpointState): void {
    this.emit('checkpointRespawn', checkpoint);
  }

  // ===========================================================================
  // Reset
  // ===========================================================================

  /**
   * Reset triggered checkpoints (for new attempt from beginning).
   */
  resetTriggeredCheckpoints(): void {
    this.triggeredCheckpoints.clear();
  }

  /**
   * Clear all saved checkpoint states.
   * Called when practice mode is disabled or level changes.
   */
  clearAllCheckpoints(): void {
    this.checkpointStates.clear();
    this.lastCheckpointId = null;
    this.triggeredCheckpoints.clear();
  }

  /**
   * Full reset for level change.
   */
  reset(): void {
    this.clearAllCheckpoints();
    this.checkpointDefinitions.clear();
  }

  // ===========================================================================
  // Events
  // ===========================================================================

  /**
   * Subscribe to a checkpoint event.
   */
  on<K extends keyof CheckpointEvents>(event: K, callback: CheckpointEvents[K]): () => void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from a checkpoint event.
   */
  off<K extends keyof CheckpointEvents>(event: K, callback: CheckpointEvents[K]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit<K extends keyof CheckpointEvents>(
    event: K,
    ...args: Parameters<CheckpointEvents[K]>
  ): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        (callback as Function)(...args);
      }
    }
  }

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  /**
   * Clean up all resources.
   */
  destroy(): void {
    this.reset();
    this.listeners.forEach((set) => set.clear());
  }
}

/** Singleton instance for global access */
export const checkpointManager = new CheckpointManager();
