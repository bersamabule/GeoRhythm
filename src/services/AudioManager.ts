/**
 * Audio Manager Service
 * Handles music playback and synchronization for the rhythm-based game loop.
 * Uses Howler.js for cross-browser audio support.
 *
 * The core principle is "music-first": game position is derived from audio time,
 * not frame deltas. This ensures perfect sync between gameplay and music.
 */

import { Howl, Howler } from 'howler';

// =============================================================================
// Types
// =============================================================================

export interface AudioConfig {
  /** Master volume (0-1) */
  masterVolume?: number;
  /** Music volume (0-1) */
  musicVolume?: number;
  /** Sound effects volume (0-1) */
  sfxVolume?: number;
}

export interface SongConfig {
  /** Path to the audio file */
  src: string;
  /** BPM of the song (for beat sync) */
  bpm?: number;
  /** Offset in ms before first beat */
  offset?: number;
}

export interface AudioState {
  /** Is music currently playing */
  isPlaying: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Progress 0-1 */
  progress: number;
  /** Whether audio is loaded and ready */
  isReady: boolean;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: Required<AudioConfig> = {
  masterVolume: 1.0,
  musicVolume: 0.7,
  sfxVolume: 0.8,
};

// =============================================================================
// Sound Effects (pre-defined paths)
// =============================================================================

const SFX_PATHS = {
  jump: '/assets/audio/sfx/jump.wav',
  death: '/assets/audio/sfx/death.wav',
  click: '/assets/audio/sfx/click.wav',
  complete: '/assets/audio/sfx/complete.wav',
} as const;

type SfxName = keyof typeof SFX_PATHS;

// =============================================================================
// Audio Manager
// =============================================================================

/**
 * Manages all game audio including music playback and sound effects.
 * Provides timing information for music-synchronized gameplay.
 */
export class AudioManager {
  private config: Required<AudioConfig>;

  /** Current playing song */
  private currentSong: Howl | null = null;
  private songConfig: SongConfig | null = null;

  /** Cached sound effects */
  private sfxCache: Map<SfxName, Howl> = new Map();

  /** Listeners for state changes */
  private listeners: Set<(state: AudioState) => void> = new Set();

  constructor(config: AudioConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Set global Howler volume
    Howler.volume(this.config.masterVolume);
  }

  // ===========================================================================
  // Music Control
  // ===========================================================================

  /**
   * Load a song for playback.
   * @param config Song configuration
   * @returns Promise that resolves when song is loaded
   */
  async loadSong(config: SongConfig): Promise<void> {
    // Unload previous song if any
    if (this.currentSong) {
      this.currentSong.unload();
      this.currentSong = null;
    }

    this.songConfig = config;

    return new Promise((resolve, reject) => {
      this.currentSong = new Howl({
        src: [config.src],
        volume: this.config.musicVolume,
        loop: false,
        preload: true,
        onload: () => {
          this.notifyListeners();
          resolve();
        },
        onloaderror: (_id, error) => {
          console.error('Failed to load song:', error);
          reject(new Error(`Failed to load song: ${error}`));
        },
        onend: () => {
          this.notifyListeners();
        },
        onplay: () => {
          this.notifyListeners();
        },
        onpause: () => {
          this.notifyListeners();
        },
        onstop: () => {
          this.notifyListeners();
        },
      });
    });
  }

  /**
   * Start playing the loaded song.
   * Handles browser autoplay policies by requiring user interaction.
   */
  play(): void {
    if (!this.currentSong) {
      console.warn('No song loaded');
      return;
    }

    // Resume AudioContext if suspended (browser autoplay policy)
    if (Howler.ctx?.state === 'suspended') {
      Howler.ctx.resume();
    }

    this.currentSong.play();
  }

  /**
   * Pause the current song.
   */
  pause(): void {
    if (this.currentSong?.playing()) {
      this.currentSong.pause();
    }
  }

  /**
   * Stop the current song and reset to beginning.
   */
  stop(): void {
    if (this.currentSong) {
      this.currentSong.stop();
    }
  }

  /**
   * Seek to a specific time in the song.
   * @param time Time in seconds
   */
  seek(time: number): void {
    if (this.currentSong) {
      this.currentSong.seek(time);
      this.notifyListeners();
    }
  }

  /**
   * Restart the song from the beginning.
   * Used when player dies and level restarts.
   */
  restart(): void {
    if (this.currentSong) {
      this.currentSong.stop();
      this.currentSong.play();
    }
  }

  // ===========================================================================
  // Timing (Music-First Game Loop)
  // ===========================================================================

  /**
   * Get the current playback time in seconds.
   * This is the primary source of truth for game position.
   */
  getCurrentTime(): number {
    if (!this.currentSong) return 0;
    const time = this.currentSong.seek();
    return typeof time === 'number' ? time : 0;
  }

  /**
   * Get the total duration of the current song in seconds.
   */
  getDuration(): number {
    if (!this.currentSong) return 0;
    return this.currentSong.duration();
  }

  /**
   * Get playback progress (0-1).
   */
  getProgress(): number {
    const duration = this.getDuration();
    if (duration === 0) return 0;
    return this.getCurrentTime() / duration;
  }

  /**
   * Check if music is currently playing.
   */
  isPlaying(): boolean {
    return this.currentSong?.playing() ?? false;
  }

  /**
   * Check if a song is loaded and ready.
   */
  isReady(): boolean {
    return this.currentSong?.state() === 'loaded';
  }

  /**
   * Get the current audio state.
   */
  getState(): AudioState {
    return {
      isPlaying: this.isPlaying(),
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      progress: this.getProgress(),
      isReady: this.isReady(),
    };
  }

  /**
   * Get current beat number based on BPM.
   * Useful for beat-synchronized effects.
   */
  getCurrentBeat(): number {
    if (!this.songConfig?.bpm) return 0;

    const time = this.getCurrentTime();
    const offset = (this.songConfig.offset ?? 0) / 1000; // Convert ms to seconds
    const adjustedTime = Math.max(0, time - offset);
    const beatsPerSecond = this.songConfig.bpm / 60;

    return adjustedTime * beatsPerSecond;
  }

  /**
   * Check if we're on a beat (within tolerance).
   * @param tolerance Time tolerance in seconds (default 0.05)
   */
  isOnBeat(tolerance: number = 0.05): boolean {
    const beat = this.getCurrentBeat();
    const fractional = beat - Math.floor(beat);
    return fractional < tolerance || fractional > 1 - tolerance;
  }

  // ===========================================================================
  // Sound Effects
  // ===========================================================================

  /**
   * Preload all sound effects.
   */
  async preloadSfx(): Promise<void> {
    const loadPromises = Object.entries(SFX_PATHS).map(([name, path]) => {
      return new Promise<void>((resolve) => {
        const sfx = new Howl({
          src: [path],
          volume: this.config.sfxVolume,
          preload: true,
          onload: () => resolve(),
          onloaderror: () => {
            console.warn(`Failed to load SFX: ${name}`);
            resolve(); // Don't fail on missing SFX
          },
        });
        this.sfxCache.set(name as SfxName, sfx);
      });
    });

    await Promise.all(loadPromises);
  }

  /**
   * Play a sound effect.
   * @param name Name of the sound effect
   */
  playSfx(name: SfxName): void {
    const sfx = this.sfxCache.get(name);
    if (sfx) {
      sfx.play();
    }
  }

  /**
   * Play jump sound effect.
   */
  playJump(): void {
    this.playSfx('jump');
  }

  /**
   * Play death sound effect.
   */
  playDeath(): void {
    this.playSfx('death');
  }

  /**
   * Play click/UI sound effect.
   */
  playClick(): void {
    this.playSfx('click');
  }

  /**
   * Play level complete sound effect.
   */
  playComplete(): void {
    this.playSfx('complete');
  }

  // ===========================================================================
  // Volume Control
  // ===========================================================================

  /**
   * Get master volume.
   * @returns Volume level (0-1)
   */
  getMasterVolume(): number {
    return this.config.masterVolume;
  }

  /**
   * Get music volume.
   * @returns Volume level (0-1)
   */
  getMusicVolume(): number {
    return this.config.musicVolume;
  }

  /**
   * Get sound effects volume.
   * @returns Volume level (0-1)
   */
  getSfxVolume(): number {
    return this.config.sfxVolume;
  }

  /**
   * Set master volume.
   * @param volume Volume level (0-1)
   */
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.config.masterVolume);
  }

  /**
   * Set music volume.
   * @param volume Volume level (0-1)
   */
  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentSong) {
      this.currentSong.volume(this.config.musicVolume);
    }
  }

  /**
   * Set sound effects volume.
   * @param volume Volume level (0-1)
   */
  setSfxVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    for (const sfx of this.sfxCache.values()) {
      sfx.volume(this.config.sfxVolume);
    }
  }

  /**
   * Mute/unmute all audio.
   * @param muted Whether to mute
   */
  setMuted(muted: boolean): void {
    Howler.mute(muted);
  }

  // ===========================================================================
  // State Listeners
  // ===========================================================================

  /**
   * Subscribe to audio state changes.
   * @param callback Function called when state changes
   * @returns Unsubscribe function
   */
  onStateChange(callback: (state: AudioState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  /**
   * Unload all audio and clean up resources.
   */
  destroy(): void {
    if (this.currentSong) {
      this.currentSong.unload();
      this.currentSong = null;
    }

    for (const sfx of this.sfxCache.values()) {
      sfx.unload();
    }
    this.sfxCache.clear();

    this.listeners.clear();
    this.songConfig = null;
  }
}

/** Singleton instance for global access */
export const audioManager = new AudioManager();
