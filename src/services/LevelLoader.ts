/**
 * Level Loader Service
 * Loads, parses, and validates level JSON files.
 * Supports manifest-based level discovery for static hosting.
 */

import type {
  GeoRhythmLevelFormat,
  LevelObject,
  ColorTrigger,
  GeoRhythmLevelManifest,
  LevelEntry,
} from '@generated/index';

import { GRID } from '@core/physics';

// =============================================================================
// Error Classes
// =============================================================================

/** Base error for level loading issues */
export class LevelLoaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelLoaderError';
  }
}

/** Thrown when a level cannot be found */
export class LevelNotFoundError extends LevelLoaderError {
  constructor(public readonly levelId: string) {
    super(`Level not found: ${levelId}`);
    this.name = 'LevelNotFoundError';
  }
}

/** Thrown when level validation fails */
export class LevelValidationError extends LevelLoaderError {
  constructor(
    public readonly levelId: string,
    public readonly issues: ValidationError[]
  ) {
    super(`Invalid level ${levelId}: ${issues.map((e) => e.message).join(', ')}`);
    this.name = 'LevelValidationError';
  }
}

/** Thrown when manifest cannot be loaded */
export class ManifestLoadError extends LevelLoaderError {
  constructor(cause: Error) {
    super(`Failed to load level manifest: ${cause.message}`);
    this.name = 'ManifestLoadError';
  }
}

// =============================================================================
// Configuration
// =============================================================================

/** Base URL for level files (configurable for CDN migration) */
const DEFAULT_BASE_URL = '/levels';

/** Manifest filename */
const MANIFEST_FILE = 'index.json';

/** Default level settings */
const DEFAULT_SETTINGS = {
  backgroundColor: '#0066FF',
  groundColor: '#0044AA',
  lineColor: '#0055CC',
  startMode: 'cube' as const,
  startSpeed: 'normal' as const,
  startGravity: 'normal' as const,
  groundY: 12,
};

/** Parsed level ready for game use */
export interface ParsedLevel {
  /** Level metadata */
  metadata: {
    id: string;
    name: string;
    author: string;
    description: string;
    difficulty: string;
    songId: number;
    songName: string;
    songArtist: string;
    duration: number;
  };

  /** Level visual settings */
  settings: {
    backgroundColor: number;
    groundColor: number;
    lineColor: number;
    startMode: 'cube' | 'ship' | 'ball';
    startSpeed: 'slow' | 'normal' | 'fast' | 'faster' | 'superFast';
    startGravityInverted: boolean;
    groundY: number;
  };

  /** Level objects sorted by X position */
  objects: ParsedLevelObject[];

  /** Color triggers sorted by X position */
  colorTriggers: ParsedColorTrigger[];

  /** Level length in pixels */
  lengthPixels: number;

  /** Level length in grid units */
  lengthUnits: number;
}

/** Parsed level object with pixel positions */
export interface ParsedLevelObject {
  id: number;
  type: LevelObject['type'];
  /** X position in pixels */
  x: number;
  /** Y position in pixels */
  y: number;
  /** Grid X position */
  gridX: number;
  /** Grid Y position */
  gridY: number;
  rotation: number;
  scale: number;
  flipX: boolean;
  flipY: boolean;
  zIndex: number;
  properties: LevelObject['properties'];
}

/** Parsed color trigger */
export interface ParsedColorTrigger {
  /** X position in pixels */
  x: number;
  target: 'background' | 'ground' | 'line';
  /** Color as hex number */
  color: number;
  duration: number;
}

/** Validation error */
export interface ValidationError {
  path: string;
  message: string;
}

/** Load result */
export interface LoadResult {
  success: boolean;
  level?: ParsedLevel;
  errors: ValidationError[];
}

/**
 * Convert hex color string to number.
 * @param hex Hex color string like "#0066FF"
 * @returns Number like 0x0066FF
 */
function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Generate a simple UUID.
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate a level object.
 */
function validateLevelObject(obj: LevelObject, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `objects[${index}]`;

  if (obj.x === undefined || obj.x === null) {
    errors.push({ path: `${path}.x`, message: 'X position is required' });
  }

  if (obj.y === undefined || obj.y === null) {
    errors.push({ path: `${path}.y`, message: 'Y position is required' });
  }

  if (!obj.type) {
    errors.push({ path: `${path}.type`, message: 'Object type is required' });
  }

  const validTypes = [
    'block',
    'spike',
    'spikeInverted',
    'padYellow',
    'padPink',
    'orbYellow',
    'orbBlue',
    'portalGravity',
    'portalMode',
    'portalSpeed',
    'checkpoint',
    'decoration',
  ];

  if (obj.type && !validTypes.includes(obj.type)) {
    errors.push({ path: `${path}.type`, message: `Invalid object type: ${obj.type}` });
  }

  return errors;
}

/**
 * Validate level data.
 */
function validateLevel(data: GeoRhythmLevelFormat): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check version
  if (!data.version) {
    errors.push({ path: 'version', message: 'Version is required' });
  } else if (!/^\d+\.\d+\.\d+$/.test(data.version)) {
    errors.push({ path: 'version', message: 'Version must be in format X.Y.Z' });
  }

  // Check metadata
  if (!data.metadata) {
    errors.push({ path: 'metadata', message: 'Metadata is required' });
  } else {
    if (!data.metadata.name) {
      errors.push({ path: 'metadata.name', message: 'Level name is required' });
    }
    if (!data.metadata.author) {
      errors.push({ path: 'metadata.author', message: 'Author is required' });
    }
    if (data.metadata.songId === undefined) {
      errors.push({ path: 'metadata.songId', message: 'Song ID is required' });
    }
  }

  // Check objects
  if (!data.objects) {
    errors.push({ path: 'objects', message: 'Objects array is required' });
  } else if (!Array.isArray(data.objects)) {
    errors.push({ path: 'objects', message: 'Objects must be an array' });
  } else {
    data.objects.forEach((obj, index) => {
      errors.push(...validateLevelObject(obj, index));
    });
  }

  return errors;
}

/**
 * Parse a level object to pixel coordinates.
 */
function parseLevelObject(obj: LevelObject, index: number): ParsedLevelObject {
  return {
    id: obj.id ?? index,
    type: obj.type,
    gridX: obj.x,
    gridY: obj.y,
    x: obj.x * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2,
    y: obj.y * GRID.UNIT_SIZE + GRID.UNIT_SIZE / 2,
    rotation: obj.rotation ?? 0,
    scale: obj.scale ?? 1,
    flipX: obj.flipX ?? false,
    flipY: obj.flipY ?? false,
    zIndex: obj.zIndex ?? 0,
    properties: obj.properties,
  };
}

/**
 * Parse a color trigger.
 */
function parseColorTrigger(trigger: ColorTrigger): ParsedColorTrigger {
  return {
    x: trigger.x * GRID.UNIT_SIZE,
    target: trigger.target,
    color: hexToNumber(trigger.color),
    duration: trigger.duration ?? 0.5,
  };
}

/**
 * Level Loader class.
 * Handles manifest-based level discovery and loading.
 */
export class LevelLoader {
  private cache: Map<string, ParsedLevel> = new Map();
  private manifestCache: GeoRhythmLevelManifest | null = null;
  private baseUrl: string;

  /**
   * Create a new LevelLoader.
   * @param baseUrl Base URL for level files (default: '/levels')
   */
  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ===========================================================================
  // Manifest Methods
  // ===========================================================================

  /**
   * Get the level manifest (list of available levels).
   * Caches the manifest after first fetch.
   * @returns Promise resolving to the manifest
   * @throws ManifestLoadError if fetch fails
   */
  async getManifest(): Promise<GeoRhythmLevelManifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }

    try {
      const url = `${this.baseUrl}/${MANIFEST_FILE}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const manifest = (await response.json()) as GeoRhythmLevelManifest;

      // Sort levels by order field
      manifest.levels.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      this.manifestCache = manifest;
      return manifest;
    } catch (error) {
      throw new ManifestLoadError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get metadata for a specific level from the manifest.
   * @param levelId Level identifier
   * @returns Level entry or undefined if not found
   */
  async getLevelEntry(levelId: string): Promise<LevelEntry | undefined> {
    const manifest = await this.getManifest();
    return manifest.levels.find((level) => level.id === levelId);
  }

  // ===========================================================================
  // Level Loading Methods
  // ===========================================================================

  /**
   * Load a level by ID (uses manifest to find the file).
   * @param levelId Level identifier from manifest
   * @returns Parsed level ready for game use
   * @throws LevelNotFoundError if level ID not in manifest
   * @throws LevelValidationError if level data is invalid
   */
  async loadLevel(levelId: string): Promise<ParsedLevel> {
    // Check cache first
    const cached = this.cache.get(levelId);
    if (cached) {
      return cached;
    }

    // Find level in manifest
    const entry = await this.getLevelEntry(levelId);
    if (!entry) {
      throw new LevelNotFoundError(levelId);
    }

    // Load and parse the level file
    const url = `${this.baseUrl}/${entry.file}`;
    const result = await this.load(url);

    if (!result.success || !result.level) {
      throw new LevelValidationError(levelId, result.errors);
    }

    // Ensure the level ID matches
    result.level.metadata.id = levelId;

    // Store in cache
    this.cache.set(levelId, result.level);

    return result.level;
  }

  /**
   * Load a level from a URL (lower-level method).
   * @param url URL to the level JSON file
   * @returns Load result with parsed level or errors
   */
  async load(url: string): Promise<LoadResult> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        return {
          success: false,
          errors: [{ path: '', message: `Failed to fetch level: ${response.status} ${response.statusText}` }],
        };
      }

      const data = (await response.json()) as GeoRhythmLevelFormat;
      return this.parse(data);
    } catch (error) {
      return {
        success: false,
        errors: [{ path: '', message: `Failed to load level: ${error instanceof Error ? error.message : String(error)}` }],
      };
    }
  }

  /**
   * Parse level data.
   * @param data Raw level data
   * @returns Load result with parsed level or errors
   */
  parse(data: GeoRhythmLevelFormat): LoadResult {
    // Validate
    const errors = validateLevel(data);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Parse settings
    const settings = data.settings ?? {};
    const parsedSettings = {
      backgroundColor: hexToNumber(settings.backgroundColor ?? DEFAULT_SETTINGS.backgroundColor),
      groundColor: hexToNumber(settings.groundColor ?? DEFAULT_SETTINGS.groundColor),
      lineColor: hexToNumber(settings.lineColor ?? DEFAULT_SETTINGS.lineColor),
      startMode: settings.startMode ?? DEFAULT_SETTINGS.startMode,
      startSpeed: settings.startSpeed ?? DEFAULT_SETTINGS.startSpeed,
      startGravityInverted: settings.startGravity === 'inverted',
      groundY: settings.groundY ?? DEFAULT_SETTINGS.groundY,
    };

    // Parse objects
    const parsedObjects = data.objects.map((obj, index) => parseLevelObject(obj, index));

    // Sort by X position for efficient processing
    parsedObjects.sort((a, b) => a.x - b.x);

    // Parse color triggers
    const colorTriggers = (data.colors ?? []).map(parseColorTrigger);
    colorTriggers.sort((a, b) => a.x - b.x);

    // Calculate level length
    const maxX = parsedObjects.reduce((max, obj) => Math.max(max, obj.gridX), 0);
    const lengthUnits = maxX + 10; // Add some padding at the end
    const lengthPixels = lengthUnits * GRID.UNIT_SIZE;

    // Create parsed level
    const level: ParsedLevel = {
      metadata: {
        id: data.metadata.id ?? generateId(),
        name: data.metadata.name,
        author: data.metadata.author,
        description: data.metadata.description ?? '',
        difficulty: data.metadata.difficulty ?? 'auto',
        songId: data.metadata.songId,
        songName: data.metadata.songName ?? 'Unknown',
        songArtist: data.metadata.songArtist ?? 'Unknown',
        duration: data.metadata.duration ?? 0,
      },
      settings: parsedSettings,
      objects: parsedObjects,
      colorTriggers,
      lengthPixels,
      lengthUnits,
    };

    // Cache the level
    this.cache.set(level.metadata.id, level);

    return { success: true, level, errors: [] };
  }

  // ===========================================================================
  // Cache Methods
  // ===========================================================================

  /**
   * Check if a level is cached.
   * @param levelId Level identifier
   * @returns True if level is in cache
   */
  isCached(levelId: string): boolean {
    return this.cache.has(levelId);
  }

  /**
   * Get a cached level by ID.
   * @param levelId Level identifier
   * @returns Cached level or undefined
   */
  getCached(levelId: string): ParsedLevel | undefined {
    return this.cache.get(levelId);
  }

  /**
   * Clear the level cache.
   * Optionally clears the manifest cache too.
   * @param includeManifest Also clear the manifest cache
   */
  clearCache(includeManifest: boolean = false): void {
    this.cache.clear();
    if (includeManifest) {
      this.manifestCache = null;
    }
  }

  // ===========================================================================
  // Test Utilities
  // ===========================================================================

  /**
   * Create a simple test level programmatically.
   */
  createTestLevel(name: string = 'Test Level'): ParsedLevel {
    const objects: LevelObject[] = [];

    // Ground blocks
    for (let x = 0; x < 100; x++) {
      objects.push({ type: 'block', x, y: 12 });
    }

    // Add some obstacles
    const obstacles: Array<{ type: LevelObject['type']; x: number; y: number }> = [
      { type: 'spike', x: 8, y: 11 },
      { type: 'block', x: 12, y: 10 },
      { type: 'block', x: 13, y: 10 },
      { type: 'spike', x: 16, y: 11 },
      { type: 'spike', x: 17, y: 11 },
      { type: 'block', x: 22, y: 11 },
      { type: 'block', x: 23, y: 10 },
      { type: 'block', x: 24, y: 9 },
      { type: 'spike', x: 25, y: 8 },
      { type: 'spike', x: 30, y: 11 },
      { type: 'spike', x: 31, y: 11 },
      { type: 'spike', x: 32, y: 11 },
      { type: 'block', x: 38, y: 11 },
      { type: 'block', x: 38, y: 10 },
      { type: 'block', x: 38, y: 9 },
      { type: 'spike', x: 39, y: 11 },
      { type: 'spike', x: 45, y: 11 },
      { type: 'spike', x: 46, y: 11 },
      { type: 'spike', x: 47, y: 11 },
      { type: 'block', x: 52, y: 9 },
      { type: 'block', x: 53, y: 9 },
      { type: 'block', x: 54, y: 9 },
      { type: 'spike', x: 53, y: 8 },
      { type: 'spike', x: 60, y: 11 },
      { type: 'block', x: 64, y: 10 },
      { type: 'spike', x: 65, y: 9 },
      { type: 'block', x: 68, y: 9 },
      { type: 'spike', x: 72, y: 11 },
      { type: 'spike', x: 73, y: 11 },
    ];

    objects.push(...obstacles);

    const levelData: GeoRhythmLevelFormat = {
      version: '1.0.0',
      metadata: {
        name,
        author: 'GeoRhythm',
        songId: 1,
        songName: 'Test Song',
        difficulty: 'easy',
      },
      settings: {
        backgroundColor: '#0066FF',
        groundColor: '#0044AA',
        lineColor: '#0077DD',
        startMode: 'cube',
        startSpeed: 'normal',
      },
      objects,
    };

    const result = this.parse(levelData);
    if (!result.success || !result.level) {
      throw new Error('Failed to create test level');
    }

    return result.level;
  }
}

/** Singleton instance */
export const levelLoader = new LevelLoader();
