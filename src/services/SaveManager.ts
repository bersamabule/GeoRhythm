/**
 * Save Manager Service
 * Handles persistent storage for game progress, settings, and unlocks.
 * Uses localStorage with schema-validated SaveData format.
 */

import type { SaveData } from '@generated/save-data.schema';

// =============================================================================
// Constants
// =============================================================================

/** LocalStorage key for save data */
const STORAGE_KEY = 'georhythm_save';

/** Current save format version for migrations */
const SAVE_VERSION = '1.0.0';

// =============================================================================
// Types
// =============================================================================

/** Level progress data */
export interface LevelProgress {
  completed: boolean;
  bestProgress: number;
  attempts: number;
  stars: number;
  coins: number[];
  bestTime?: number;
  firstCompleted?: string;
  practiceCheckpoints: number[];
}

/** Statistics summary */
export interface GameStats {
  totalStars: number;
  totalCoins: number;
  totalAttempts: number;
  totalDeaths: number;
  totalJumps: number;
  playTime: number;
  levelsCompleted: number;
}

/** Settings that can be persisted */
export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  showFPS: boolean;
  showProgress: boolean;
  showAttempts: boolean;
  autoRetry: boolean;
  autoCheckpoints: boolean;
  screenShake: boolean;
  particleEffects: boolean;
  lowDetail: boolean;
}

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.8,
  sfxVolume: 1.0,
  showFPS: false,
  showProgress: true,
  showAttempts: true,
  autoRetry: true,
  autoCheckpoints: true,
  screenShake: true,
  particleEffects: true,
  lowDetail: false,
};

const DEFAULT_LEVEL_PROGRESS: LevelProgress = {
  completed: false,
  bestProgress: 0,
  attempts: 0,
  stars: 0,
  coins: [],
  practiceCheckpoints: [],
};

// =============================================================================
// Save Manager
// =============================================================================

/**
 * Manages persistent game data storage.
 * Provides methods to save/load progress, settings, and statistics.
 */
export class SaveManager {
  /** Cached save data (loaded once, updated on changes) */
  private saveData: SaveData | null = null;

  /** Whether localStorage is available */
  private storageAvailable: boolean = false;

  constructor() {
    this.storageAvailable = this.checkStorageAvailable();
    this.loadFromStorage();
  }

  // ===========================================================================
  // Storage Availability
  // ===========================================================================

  /**
   * Check if localStorage is available.
   */
  private checkStorageAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      console.warn('localStorage not available, progress will not be saved');
      return false;
    }
  }

  /**
   * Check if save functionality is available.
   */
  isAvailable(): boolean {
    return this.storageAvailable;
  }

  // ===========================================================================
  // Load / Save
  // ===========================================================================

  /**
   * Load save data from localStorage.
   */
  private loadFromStorage(): void {
    if (!this.storageAvailable) {
      this.saveData = this.createNewSave();
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SaveData;
        // Migrate if needed
        this.saveData = this.migrate(parsed);
      } else {
        this.saveData = this.createNewSave();
      }
    } catch (error) {
      console.error('Failed to load save data:', error);
      this.saveData = this.createNewSave();
    }
  }

  /**
   * Save current data to localStorage.
   */
  private saveToStorage(): void {
    if (!this.storageAvailable || !this.saveData) {
      return;
    }

    try {
      // Update last played timestamp
      this.saveData.lastPlayed = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saveData));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  /**
   * Create a new save data object with defaults.
   */
  private createNewSave(): SaveData {
    return {
      version: SAVE_VERSION,
      progress: {
        levels: {},
        totalStars: 0,
        totalCoins: 0,
        totalAttempts: 0,
        totalDeaths: 0,
        totalJumps: 0,
        playTime: 0,
        levelsCompleted: 0,
      },
      settings: { ...DEFAULT_SETTINGS },
      player: {
        iconId: 1,
        primaryColor: '#7dff00',
        secondaryColor: '#00ffff',
        trailEnabled: true,
      },
      unlocks: {
        icons: [1],
        colors: ['#7dff00', '#00ffff', '#ff0000', '#ffff00', '#ff00ff'],
        trails: [1],
        deathEffects: [1],
      },
      achievements: [],
      createdAt: new Date().toISOString(),
      lastPlayed: new Date().toISOString(),
    };
  }

  /**
   * Migrate save data from older versions.
   */
  private migrate(data: SaveData): SaveData {
    // For now, just ensure all required fields exist
    // Future migrations can check data.version and upgrade accordingly

    if (!data.progress) {
      data.progress = { levels: {} };
    }
    if (!data.progress.levels) {
      data.progress.levels = {};
    }
    if (!data.settings) {
      data.settings = { ...DEFAULT_SETTINGS };
    }
    if (!data.unlocks) {
      data.unlocks = {
        icons: [1],
        colors: ['#7dff00', '#00ffff'],
        trails: [1],
        deathEffects: [1],
      };
    }

    // Ensure version is current
    data.version = SAVE_VERSION;

    return data;
  }

  // ===========================================================================
  // Level Progress
  // ===========================================================================

  /**
   * Get progress for a specific level.
   */
  getLevelProgress(levelId: string): LevelProgress {
    const levels = this.saveData?.progress?.levels ?? {};
    const progress = levels[levelId];

    if (!progress) {
      return { ...DEFAULT_LEVEL_PROGRESS };
    }

    const result: LevelProgress = {
      completed: progress.completed ?? false,
      bestProgress: progress.bestProgress ?? 0,
      attempts: progress.attempts ?? 0,
      stars: progress.stars ?? 0,
      coins: progress.coins ?? [],
      practiceCheckpoints: progress.practiceCheckpoints ?? [],
    };

    // Only include optional properties if they exist
    if (progress.bestTime !== undefined) {
      result.bestTime = progress.bestTime;
    }
    if (progress.firstCompleted !== undefined) {
      result.firstCompleted = progress.firstCompleted;
    }

    return result;
  }

  /**
   * Record the start of a level attempt.
   */
  recordAttempt(levelId: string): void {
    if (!this.saveData?.progress?.levels) {
      return;
    }

    if (!this.saveData.progress.levels[levelId]) {
      this.saveData.progress.levels[levelId] = { ...DEFAULT_LEVEL_PROGRESS };
    }

    const level = this.saveData.progress.levels[levelId];
    level.attempts = (level.attempts ?? 0) + 1;

    // Update global stats
    this.saveData.progress.totalAttempts = (this.saveData.progress.totalAttempts ?? 0) + 1;

    this.saveToStorage();
  }

  /**
   * Record a death during gameplay.
   * @param _levelId Level ID (reserved for future per-level death tracking)
   */
  recordDeath(_levelId: string): void {
    if (!this.saveData?.progress) {
      return;
    }

    this.saveData.progress.totalDeaths = (this.saveData.progress.totalDeaths ?? 0) + 1;
    this.saveToStorage();
  }

  /**
   * Record a jump during gameplay.
   */
  recordJump(): void {
    if (!this.saveData?.progress) {
      return;
    }

    this.saveData.progress.totalJumps = (this.saveData.progress.totalJumps ?? 0) + 1;
    // Don't save on every jump - too frequent. Save will happen on death/completion.
  }

  /**
   * Update progress percentage during a level.
   * @param levelId Level ID
   * @param progress Progress as decimal (0.0 to 1.0)
   */
  updateProgress(levelId: string, progress: number): void {
    if (!this.saveData?.progress?.levels) {
      return;
    }

    if (!this.saveData.progress.levels[levelId]) {
      this.saveData.progress.levels[levelId] = { ...DEFAULT_LEVEL_PROGRESS };
    }

    const level = this.saveData.progress.levels[levelId];
    const currentBest = level.bestProgress ?? 0;
    const newProgress = Math.min(100, Math.round(progress * 100));

    if (newProgress > currentBest) {
      level.bestProgress = newProgress;
    }
    // Don't save on every progress update - save on death/completion
  }

  /**
   * Record level completion.
   */
  recordCompletion(levelId: string, time: number): void {
    if (!this.saveData?.progress?.levels) {
      return;
    }

    if (!this.saveData.progress.levels[levelId]) {
      this.saveData.progress.levels[levelId] = { ...DEFAULT_LEVEL_PROGRESS };
    }

    const level = this.saveData.progress.levels[levelId];
    const wasAlreadyCompleted = level.completed ?? false;

    level.completed = true;
    level.bestProgress = 100;

    // Record best time
    if (!level.bestTime || time < level.bestTime) {
      level.bestTime = time;
    }

    // First completion timestamp
    if (!level.firstCompleted) {
      level.firstCompleted = new Date().toISOString();
    }

    // Update global stats (only increment if first completion)
    if (!wasAlreadyCompleted) {
      this.saveData.progress.levelsCompleted = (this.saveData.progress.levelsCompleted ?? 0) + 1;
    }

    this.saveToStorage();
  }

  /**
   * Add play time to stats.
   */
  addPlayTime(seconds: number): void {
    if (!this.saveData?.progress) {
      return;
    }

    this.saveData.progress.playTime = (this.saveData.progress.playTime ?? 0) + seconds;
    this.saveToStorage();
  }

  /**
   * Check if a level has been completed.
   */
  isLevelCompleted(levelId: string): boolean {
    return this.getLevelProgress(levelId).completed;
  }

  /**
   * Get the attempt count for a level.
   */
  getLevelAttempts(levelId: string): number {
    return this.getLevelProgress(levelId).attempts;
  }

  /**
   * Get best progress percentage for a level.
   */
  getLevelBestProgress(levelId: string): number {
    return this.getLevelProgress(levelId).bestProgress;
  }

  // ===========================================================================
  // Settings
  // ===========================================================================

  /**
   * Get all settings.
   */
  getSettings(): GameSettings {
    const settings = this.saveData?.settings;
    return {
      musicVolume: settings?.musicVolume ?? DEFAULT_SETTINGS.musicVolume,
      sfxVolume: settings?.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume,
      showFPS: settings?.showFPS ?? DEFAULT_SETTINGS.showFPS,
      showProgress: settings?.showProgress ?? DEFAULT_SETTINGS.showProgress,
      showAttempts: settings?.showAttempts ?? DEFAULT_SETTINGS.showAttempts,
      autoRetry: settings?.autoRetry ?? DEFAULT_SETTINGS.autoRetry,
      autoCheckpoints: settings?.autoCheckpoints ?? DEFAULT_SETTINGS.autoCheckpoints,
      screenShake: settings?.screenShake ?? DEFAULT_SETTINGS.screenShake,
      particleEffects: settings?.particleEffects ?? DEFAULT_SETTINGS.particleEffects,
      lowDetail: settings?.lowDetail ?? DEFAULT_SETTINGS.lowDetail,
    };
  }

  /**
   * Get music volume setting.
   */
  getMusicVolume(): number {
    return this.saveData?.settings?.musicVolume ?? DEFAULT_SETTINGS.musicVolume;
  }

  /**
   * Get SFX volume setting.
   */
  getSfxVolume(): number {
    return this.saveData?.settings?.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume;
  }

  /**
   * Set music volume.
   */
  setMusicVolume(volume: number): void {
    if (!this.saveData) {
      return;
    }

    if (!this.saveData.settings) {
      this.saveData.settings = { ...DEFAULT_SETTINGS };
    }

    this.saveData.settings.musicVolume = Math.max(0, Math.min(1, volume));
    this.saveToStorage();
  }

  /**
   * Set SFX volume.
   */
  setSfxVolume(volume: number): void {
    if (!this.saveData) {
      return;
    }

    if (!this.saveData.settings) {
      this.saveData.settings = { ...DEFAULT_SETTINGS };
    }

    this.saveData.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveToStorage();
  }

  /**
   * Update a setting.
   */
  setSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
    if (!this.saveData) {
      return;
    }

    if (!this.saveData.settings) {
      this.saveData.settings = { ...DEFAULT_SETTINGS };
    }

    (this.saveData.settings as GameSettings)[key] = value;
    this.saveToStorage();
  }

  /**
   * Reset settings to defaults.
   */
  resetSettings(): void {
    if (!this.saveData) {
      return;
    }

    this.saveData.settings = { ...DEFAULT_SETTINGS };
    this.saveToStorage();
  }

  // ===========================================================================
  // Statistics
  // ===========================================================================

  /**
   * Get game statistics summary.
   */
  getStats(): GameStats {
    const progress = this.saveData?.progress;
    return {
      totalStars: progress?.totalStars ?? 0,
      totalCoins: progress?.totalCoins ?? 0,
      totalAttempts: progress?.totalAttempts ?? 0,
      totalDeaths: progress?.totalDeaths ?? 0,
      totalJumps: progress?.totalJumps ?? 0,
      playTime: progress?.playTime ?? 0,
      levelsCompleted: progress?.levelsCompleted ?? 0,
    };
  }

  /**
   * Get all completed level IDs.
   */
  getCompletedLevelIds(): string[] {
    const levels = this.saveData?.progress?.levels ?? {};
    return Object.entries(levels)
      .filter(([_, data]) => data.completed)
      .map(([id]) => id);
  }

  // ===========================================================================
  // Full Save Operations
  // ===========================================================================

  /**
   * Get the full save data (for export/debug).
   */
  getSaveData(): SaveData | null {
    return this.saveData ? { ...this.saveData } : null;
  }

  /**
   * Force save current data.
   */
  save(): void {
    this.saveToStorage();
  }

  /**
   * Clear all save data and reset to defaults.
   */
  reset(): void {
    this.saveData = this.createNewSave();
    this.saveToStorage();
  }

  /**
   * Delete save data entirely.
   */
  deleteSave(): void {
    if (this.storageAvailable) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.saveData = this.createNewSave();
  }

  /**
   * Import save data (for restore/debug).
   */
  importSave(data: SaveData): boolean {
    try {
      // Validate required fields
      if (!data.version || !data.progress) {
        throw new Error('Invalid save data format');
      }

      this.saveData = this.migrate(data);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import save data:', error);
      return false;
    }
  }
}

/** Singleton instance for global access */
export const saveManager = new SaveManager();
