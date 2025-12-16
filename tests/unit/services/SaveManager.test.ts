/**
 * SaveManager Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SaveManager } from '../../../src/services/SaveManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Replace global localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('SaveManager', () => {
  let saveManager: SaveManager;

  beforeEach(() => {
    // Clear mock and storage
    localStorageMock.clear();
    vi.clearAllMocks();
    saveManager = new SaveManager();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Storage Availability', () => {
    it('should detect localStorage availability', () => {
      expect(saveManager.isAvailable()).toBe(true);
    });
  });

  describe('Default Save Data', () => {
    it('should create new save with default values', () => {
      const data = saveManager.getSaveData();
      expect(data).not.toBeNull();
      expect(data?.version).toBe('1.0.0');
      expect(data?.progress).toBeDefined();
      expect(data?.settings).toBeDefined();
    });

    it('should have default settings', () => {
      const settings = saveManager.getSettings();
      expect(settings.musicVolume).toBe(0.8);
      expect(settings.sfxVolume).toBe(1.0);
      expect(settings.showProgress).toBe(true);
      expect(settings.autoRetry).toBe(true);
    });
  });

  describe('Level Progress', () => {
    it('should return default progress for unknown level', () => {
      const progress = saveManager.getLevelProgress('unknown-level');
      expect(progress.completed).toBe(false);
      expect(progress.bestProgress).toBe(0);
      expect(progress.attempts).toBe(0);
      expect(progress.stars).toBe(0);
    });

    it('should record attempts', () => {
      saveManager.recordAttempt('level-1');
      saveManager.recordAttempt('level-1');
      saveManager.recordAttempt('level-1');

      const progress = saveManager.getLevelProgress('level-1');
      expect(progress.attempts).toBe(3);
    });

    it('should update global attempts count', () => {
      saveManager.recordAttempt('level-1');
      saveManager.recordAttempt('level-2');

      const stats = saveManager.getStats();
      expect(stats.totalAttempts).toBe(2);
    });

    it('should record deaths', () => {
      saveManager.recordDeath('level-1');
      saveManager.recordDeath('level-1');

      const stats = saveManager.getStats();
      expect(stats.totalDeaths).toBe(2);
    });

    it('should record jumps', () => {
      saveManager.recordJump();
      saveManager.recordJump();
      saveManager.recordJump();

      const stats = saveManager.getStats();
      expect(stats.totalJumps).toBe(3);
    });

    it('should update best progress', () => {
      saveManager.updateProgress('level-1', 0.25);
      expect(saveManager.getLevelBestProgress('level-1')).toBe(25);

      saveManager.updateProgress('level-1', 0.50);
      expect(saveManager.getLevelBestProgress('level-1')).toBe(50);

      // Should not decrease
      saveManager.updateProgress('level-1', 0.30);
      expect(saveManager.getLevelBestProgress('level-1')).toBe(50);
    });

    it('should cap progress at 100', () => {
      saveManager.updateProgress('level-1', 1.5);
      expect(saveManager.getLevelBestProgress('level-1')).toBe(100);
    });

    it('should record completion', () => {
      saveManager.recordCompletion('level-1', 120.5);

      const progress = saveManager.getLevelProgress('level-1');
      expect(progress.completed).toBe(true);
      expect(progress.bestProgress).toBe(100);
      expect(progress.bestTime).toBe(120.5);
      expect(progress.firstCompleted).toBeDefined();
    });

    it('should update best time on faster completion', () => {
      saveManager.recordCompletion('level-1', 120);
      saveManager.recordCompletion('level-1', 100);

      const progress = saveManager.getLevelProgress('level-1');
      expect(progress.bestTime).toBe(100);
    });

    it('should not update best time on slower completion', () => {
      saveManager.recordCompletion('level-1', 100);
      saveManager.recordCompletion('level-1', 120);

      const progress = saveManager.getLevelProgress('level-1');
      expect(progress.bestTime).toBe(100);
    });

    it('should not increment levelsCompleted on re-completion', () => {
      saveManager.recordCompletion('level-1', 100);
      saveManager.recordCompletion('level-1', 100);

      const stats = saveManager.getStats();
      expect(stats.levelsCompleted).toBe(1);
    });

    it('should check if level is completed', () => {
      expect(saveManager.isLevelCompleted('level-1')).toBe(false);
      saveManager.recordCompletion('level-1', 100);
      expect(saveManager.isLevelCompleted('level-1')).toBe(true);
    });

    it('should get level attempts', () => {
      saveManager.recordAttempt('level-1');
      saveManager.recordAttempt('level-1');
      expect(saveManager.getLevelAttempts('level-1')).toBe(2);
    });

    it('should get completed level IDs', () => {
      saveManager.recordCompletion('level-1', 100);
      saveManager.recordCompletion('level-3', 150);
      saveManager.recordAttempt('level-2'); // Not completed

      const completed = saveManager.getCompletedLevelIds();
      expect(completed).toContain('level-1');
      expect(completed).toContain('level-3');
      expect(completed).not.toContain('level-2');
    });
  });

  describe('Settings', () => {
    it('should get music volume', () => {
      expect(saveManager.getMusicVolume()).toBe(0.8);
    });

    it('should set music volume', () => {
      saveManager.setMusicVolume(0.5);
      expect(saveManager.getMusicVolume()).toBe(0.5);
    });

    it('should clamp music volume to valid range', () => {
      saveManager.setMusicVolume(-0.5);
      expect(saveManager.getMusicVolume()).toBe(0);

      saveManager.setMusicVolume(1.5);
      expect(saveManager.getMusicVolume()).toBe(1);
    });

    it('should get SFX volume', () => {
      expect(saveManager.getSfxVolume()).toBe(1.0);
    });

    it('should set SFX volume', () => {
      saveManager.setSfxVolume(0.7);
      expect(saveManager.getSfxVolume()).toBe(0.7);
    });

    it('should set individual setting', () => {
      saveManager.setSetting('showFPS', true);
      expect(saveManager.getSettings().showFPS).toBe(true);
    });

    it('should reset settings to defaults', () => {
      saveManager.setMusicVolume(0.3);
      saveManager.setSfxVolume(0.4);
      saveManager.setSetting('showFPS', true);

      saveManager.resetSettings();

      const settings = saveManager.getSettings();
      expect(settings.musicVolume).toBe(0.8);
      expect(settings.sfxVolume).toBe(1.0);
      expect(settings.showFPS).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should get stats summary', () => {
      saveManager.recordAttempt('level-1');
      saveManager.recordDeath('level-1');
      saveManager.recordJump();
      saveManager.recordCompletion('level-1', 100);

      const stats = saveManager.getStats();
      expect(stats.totalAttempts).toBe(1);
      expect(stats.totalDeaths).toBe(1);
      expect(stats.totalJumps).toBe(1);
      expect(stats.levelsCompleted).toBe(1);
    });

    it('should track play time', () => {
      saveManager.addPlayTime(60);
      saveManager.addPlayTime(30);

      const stats = saveManager.getStats();
      expect(stats.playTime).toBe(90);
    });
  });

  describe('Persistence', () => {
    it('should persist data to localStorage', () => {
      saveManager.recordAttempt('level-1');
      saveManager.save();

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should load data from localStorage', () => {
      // Create save data and persist
      saveManager.recordAttempt('level-1');
      saveManager.recordAttempt('level-1');
      saveManager.setMusicVolume(0.5);
      saveManager.save();

      // Create new instance (should load from storage)
      const newManager = new SaveManager();

      expect(newManager.getLevelAttempts('level-1')).toBe(2);
      expect(newManager.getMusicVolume()).toBe(0.5);
    });

    it('should reset all save data', () => {
      saveManager.recordAttempt('level-1');
      saveManager.setMusicVolume(0.3);

      saveManager.reset();

      expect(saveManager.getLevelAttempts('level-1')).toBe(0);
      expect(saveManager.getMusicVolume()).toBe(0.8);
    });

    it('should delete save from localStorage', () => {
      saveManager.save();
      saveManager.deleteSave();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('georhythm_save');
    });
  });

  describe('Import/Export', () => {
    it('should import valid save data', () => {
      const importData = {
        version: '1.0.0',
        progress: {
          levels: {
            'test-level': {
              completed: true,
              attempts: 10,
              bestProgress: 100,
            },
          },
          totalAttempts: 10,
        },
        settings: {
          musicVolume: 0.6,
        },
      };

      const result = saveManager.importSave(importData as any);
      expect(result).toBe(true);

      expect(saveManager.getLevelProgress('test-level').completed).toBe(true);
      expect(saveManager.getLevelAttempts('test-level')).toBe(10);
      expect(saveManager.getMusicVolume()).toBe(0.6);
    });

    it('should reject invalid save data', () => {
      const invalidData = { foo: 'bar' };

      const result = saveManager.importSave(invalidData as any);
      expect(result).toBe(false);
    });

    it('should export save data', () => {
      saveManager.recordAttempt('level-1');
      saveManager.setMusicVolume(0.5);

      const exported = saveManager.getSaveData();
      expect(exported).not.toBeNull();
      expect(exported?.progress.levels?.['level-1']?.attempts).toBe(1);
      expect(exported?.settings?.musicVolume).toBe(0.5);
    });
  });
});
