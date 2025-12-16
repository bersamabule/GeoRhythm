/**
 * Services exports.
 */

export { LevelLoader, levelLoader } from './LevelLoader';
export {
  LevelLoaderError,
  LevelNotFoundError,
  LevelValidationError,
  ManifestLoadError,
} from './LevelLoader';
export type {
  ParsedLevel,
  ParsedLevelObject,
  ParsedColorTrigger,
  ValidationError,
  LoadResult,
} from './LevelLoader';

export { AudioManager, audioManager } from './AudioManager';
export type { AudioConfig, SongConfig, AudioState } from './AudioManager';

export { CheckpointManager, checkpointManager } from './CheckpointManager';
export type {
  CheckpointState,
  CheckpointDefinition,
  CheckpointEvents,
} from './CheckpointManager';

export { SaveManager, saveManager } from './SaveManager';
export type { LevelProgress, GameStats, GameSettings } from './SaveManager';

// Re-export LevelEntry from generated for convenience
export type { LevelEntry } from '@generated/index';
