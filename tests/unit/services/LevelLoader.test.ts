/**
 * LevelLoader service tests.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  LevelLoader,
  LevelNotFoundError,
  LevelValidationError,
  ManifestLoadError,
} from '@services/LevelLoader';
import type { GeoRhythmLevelFormat, GeoRhythmLevelManifest } from '@generated/index';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('LevelLoader', () => {
  let loader: LevelLoader;

  // Sample valid manifest
  const validManifest: GeoRhythmLevelManifest = {
    version: '1.0.0',
    levels: [
      {
        id: 'test-level',
        file: 'test-level.json',
        name: 'Test Level',
        author: 'Test Author',
        difficulty: 'easy',
        duration: 60,
        order: 0,
      },
      {
        id: 'second-level',
        file: 'second-level.json',
        name: 'Second Level',
        author: 'Test Author',
        difficulty: 'normal',
        duration: 90,
        order: 1,
      },
    ],
  };

  // Sample valid level
  const validLevel: GeoRhythmLevelFormat = {
    version: '1.0.0',
    metadata: {
      name: 'Test Level',
      author: 'Test Author',
      songId: 1,
      difficulty: 'easy',
    },
    settings: {
      backgroundColor: '#0066FF',
      groundColor: '#0044AA',
      startMode: 'cube',
      startSpeed: 'normal',
    },
    objects: [
      { type: 'block', x: 0, y: 12 },
      { type: 'block', x: 1, y: 12 },
      { type: 'spike', x: 5, y: 11 },
    ],
  };

  beforeEach(() => {
    loader = new LevelLoader('/levels');
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Constructor Tests
  // ===========================================================================

  describe('constructor', () => {
    it('should use default base URL', () => {
      const defaultLoader = new LevelLoader();
      expect(defaultLoader).toBeDefined();
    });

    it('should accept custom base URL', () => {
      const customLoader = new LevelLoader('/custom/path');
      expect(customLoader).toBeDefined();
    });
  });

  // ===========================================================================
  // Manifest Tests
  // ===========================================================================

  describe('getManifest', () => {
    it('should fetch and return manifest', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(validManifest),
      });

      const manifest = await loader.getManifest();

      expect(mockFetch).toHaveBeenCalledWith('/levels/index.json');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.levels).toHaveLength(2);
    });

    it('should cache manifest after first fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(validManifest),
      });

      await loader.getManifest();
      await loader.getManifest();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should sort levels by order field', async () => {
      const unorderedManifest = {
        ...validManifest,
        levels: [
          { ...validManifest.levels[1], order: 2 },
          { ...validManifest.levels[0], order: 1 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(unorderedManifest),
      });

      const manifest = await loader.getManifest();

      expect(manifest.levels[0]?.order).toBe(1);
      expect(manifest.levels[1]?.order).toBe(2);
    });

    it('should throw ManifestLoadError on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(loader.getManifest()).rejects.toThrow(ManifestLoadError);
    });

    it('should throw ManifestLoadError on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(loader.getManifest()).rejects.toThrow(ManifestLoadError);
    });
  });

  describe('getLevelEntry', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(validManifest),
      });
    });

    it('should return level entry by ID', async () => {
      const entry = await loader.getLevelEntry('test-level');

      expect(entry).toBeDefined();
      expect(entry?.name).toBe('Test Level');
    });

    it('should return undefined for unknown level ID', async () => {
      const entry = await loader.getLevelEntry('nonexistent');

      expect(entry).toBeUndefined();
    });
  });

  // ===========================================================================
  // Level Loading Tests
  // ===========================================================================

  describe('loadLevel', () => {
    it('should load level by ID', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validManifest),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validLevel),
        });

      const level = await loader.loadLevel('test-level');

      expect(level).toBeDefined();
      expect(level!.metadata.id).toBe('test-level');
      expect(level!.metadata.name).toBe('Test Level');
      expect(level!.objects).toHaveLength(3);
    });

    it('should cache loaded level', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validManifest),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validLevel),
        });

      await loader.loadLevel('test-level');
      const cached = await loader.loadLevel('test-level');

      // Second call should use cache (only 2 fetch calls total)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(cached.metadata.id).toBe('test-level');
    });

    it('should throw LevelNotFoundError for unknown ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(validManifest),
      });

      await expect(loader.loadLevel('nonexistent')).rejects.toThrow(LevelNotFoundError);
    });

    it('should throw LevelValidationError for invalid level data', async () => {
      const invalidLevel = { version: '1.0.0', objects: [] }; // Missing metadata

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validManifest),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(invalidLevel),
        });

      await expect(loader.loadLevel('test-level')).rejects.toThrow(LevelValidationError);
    });
  });

  describe('load (URL)', () => {
    it('should load and parse level from URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(validLevel),
      });

      const result = await loader.load('/custom/level.json');

      expect(result.success).toBe(true);
      expect(result.level).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for failed fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await loader.load('/missing.json');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('404');
    });
  });

  // ===========================================================================
  // Parse Tests
  // ===========================================================================

  describe('parse', () => {
    it('should parse valid level data', () => {
      const result = loader.parse(validLevel);

      expect(result.success).toBe(true);
      expect(result.level).toBeDefined();
      expect(result.level?.metadata.name).toBe('Test Level');
    });

    it('should convert grid positions to pixels', () => {
      const result = loader.parse(validLevel);

      expect(result.level?.objects[0]?.gridX).toBe(0);
      expect(result.level?.objects[0]?.gridY).toBe(12);
      // Pixel position should be grid * UNIT_SIZE + UNIT_SIZE/2
      expect(result.level?.objects[0]?.x).toBeGreaterThan(0);
    });

    it('should sort objects by X position', () => {
      const unsortedLevel: GeoRhythmLevelFormat = {
        ...validLevel,
        objects: [
          { type: 'spike', x: 10, y: 11 },
          { type: 'block', x: 0, y: 12 },
          { type: 'block', x: 5, y: 12 },
        ],
      };

      const result = loader.parse(unsortedLevel);

      expect(result.level?.objects[0]?.gridX).toBe(0);
      expect(result.level?.objects[1]?.gridX).toBe(5);
      expect(result.level?.objects[2]?.gridX).toBe(10);
    });

    it('should apply default settings', () => {
      const minimalLevel: GeoRhythmLevelFormat = {
        version: '1.0.0',
        metadata: {
          name: 'Minimal',
          author: 'Test',
          songId: 1,
        },
        objects: [{ type: 'block', x: 0, y: 12 }],
      };

      const result = loader.parse(minimalLevel);

      expect(result.level?.settings.startMode).toBe('cube');
      expect(result.level?.settings.startSpeed).toBe('normal');
    });

    it('should reject invalid version format', () => {
      const badVersion: GeoRhythmLevelFormat = {
        ...validLevel,
        version: 'invalid',
      };

      const result = loader.parse(badVersion);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.path === 'version')).toBe(true);
    });

    it('should reject missing required fields', () => {
      const noMetadata = {
        version: '1.0.0',
        objects: [],
      } as unknown as GeoRhythmLevelFormat;

      const result = loader.parse(noMetadata);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.path === 'metadata')).toBe(true);
    });

    it('should reject invalid object types', () => {
      const badObject: GeoRhythmLevelFormat = {
        ...validLevel,
        objects: [{ type: 'invalid' as 'block', x: 0, y: 0 }],
      };

      const result = loader.parse(badObject);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Invalid object type'))).toBe(true);
    });

    it('should calculate level length', () => {
      const result = loader.parse(validLevel);

      expect(result.level?.lengthUnits).toBeGreaterThan(0);
      expect(result.level?.lengthPixels).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Cache Tests
  // ===========================================================================

  describe('cache methods', () => {
    it('isCached should return false for uncached level', () => {
      expect(loader.isCached('test-level')).toBe(false);
    });

    it('isCached should return true after loading', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validManifest),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validLevel),
        });

      await loader.loadLevel('test-level');

      expect(loader.isCached('test-level')).toBe(true);
    });

    it('getCached should return cached level', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validManifest),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validLevel),
        });

      await loader.loadLevel('test-level');
      const cached = loader.getCached('test-level');

      expect(cached).toBeDefined();
      expect(cached?.metadata.name).toBe('Test Level');
    });

    it('clearCache should clear level cache', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validManifest),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validLevel),
        });

      await loader.loadLevel('test-level');
      loader.clearCache();

      expect(loader.isCached('test-level')).toBe(false);
    });

    it('clearCache with includeManifest should clear manifest cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validManifest),
      });

      await loader.getManifest();
      loader.clearCache(true);
      await loader.getManifest();

      // Should fetch twice (manifest was cleared)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // Test Level Creation
  // ===========================================================================

  describe('createTestLevel', () => {
    it('should create a valid test level', () => {
      const level = loader.createTestLevel();

      expect(level.metadata.name).toBe('Test Level');
      expect(level.objects.length).toBeGreaterThan(0);
    });

    it('should accept custom name', () => {
      const level = loader.createTestLevel('Custom Name');

      expect(level.metadata.name).toBe('Custom Name');
    });
  });
});
