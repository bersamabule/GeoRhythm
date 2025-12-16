/**
 * CheckpointManager Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CheckpointManager } from '../../../src/services/CheckpointManager';
import { createDefaultPhysicsState } from '../../../src/core/physics/types';

describe('CheckpointManager', () => {
  let manager: CheckpointManager;

  beforeEach(() => {
    manager = new CheckpointManager();
  });

  describe('Practice Mode Control', () => {
    it('should start with practice mode disabled', () => {
      expect(manager.isPracticeMode).toBe(false);
    });

    it('should enable practice mode', () => {
      manager.setPracticeMode(true);
      expect(manager.isPracticeMode).toBe(true);
    });

    it('should disable practice mode', () => {
      manager.setPracticeMode(true);
      manager.setPracticeMode(false);
      expect(manager.isPracticeMode).toBe(false);
    });

    it('should toggle practice mode', () => {
      expect(manager.togglePracticeMode()).toBe(true);
      expect(manager.isPracticeMode).toBe(true);
      expect(manager.togglePracticeMode()).toBe(false);
      expect(manager.isPracticeMode).toBe(false);
    });

    it('should clear checkpoints when disabling practice mode', () => {
      manager.setPracticeMode(true);
      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(1, state, 5.0, 10, 11);

      expect(manager.hasCheckpoint()).toBe(true);

      manager.setPracticeMode(false);
      expect(manager.hasCheckpoint()).toBe(false);
    });

    it('should emit practiceModeChanged event', () => {
      let eventValue: boolean | null = null;
      manager.on('practiceModeChanged', (enabled) => {
        eventValue = enabled;
      });

      manager.setPracticeMode(true);
      expect(eventValue).toBe(true);

      manager.setPracticeMode(false);
      expect(eventValue).toBe(false);
    });
  });

  describe('Checkpoint Recording', () => {
    it('should not save state when not in practice mode', () => {
      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      const result = manager.recordCheckpoint(1, state, 5.0, 10, 11);

      expect(result).toBeNull();
      expect(manager.hasCheckpoint()).toBe(false);
    });

    it('should save state when in practice mode', () => {
      manager.setPracticeMode(true);
      const state = createDefaultPhysicsState({
        position: { x: 100, y: 200 },
        mode: 'ship',
        speed: 'fast',
        gravityInverted: true,
      });

      const result = manager.recordCheckpoint(1, state, 5.0, 10, 11);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.playerX).toBe(100);
      expect(result?.playerY).toBe(200);
      expect(result?.mode).toBe('ship');
      expect(result?.speed).toBe('fast');
      expect(result?.gravityInverted).toBe(true);
      expect(result?.audioTime).toBe(5.0);
    });

    it('should track triggered checkpoints even without practice mode', () => {
      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(1, state, 5.0, 10, 11);

      expect(manager.isCheckpointTriggered(1)).toBe(true);
      expect(manager.getReachedCheckpointCount()).toBe(1);
    });

    it('should update last checkpoint on record', () => {
      manager.setPracticeMode(true);
      const state1 = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      const state2 = createDefaultPhysicsState({ position: { x: 300, y: 200 } });

      manager.recordCheckpoint(1, state1, 5.0, 10, 11);
      manager.recordCheckpoint(2, state2, 10.0, 20, 11);

      const lastCheckpoint = manager.getLastCheckpoint();
      expect(lastCheckpoint?.id).toBe(2);
      expect(lastCheckpoint?.playerX).toBe(300);
    });

    it('should emit checkpointReached event on first trigger', () => {
      manager.setPracticeMode(true);
      let eventCheckpoint: any = null;
      manager.on('checkpointReached', (checkpoint) => {
        eventCheckpoint = checkpoint;
      });

      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(1, state, 5.0, 10, 11);

      expect(eventCheckpoint).not.toBeNull();
      expect(eventCheckpoint?.id).toBe(1);
    });

    it('should not emit checkpointReached event on repeated trigger', () => {
      manager.setPracticeMode(true);
      let eventCount = 0;
      manager.on('checkpointReached', () => {
        eventCount++;
      });

      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(1, state, 5.0, 10, 11);
      manager.recordCheckpoint(1, state, 5.5, 10, 11); // Same checkpoint

      expect(eventCount).toBe(1);
    });
  });

  describe('Checkpoint Retrieval', () => {
    beforeEach(() => {
      manager.setPracticeMode(true);
    });

    it('should get checkpoint by ID', () => {
      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(42, state, 5.0, 10, 11);

      const checkpoint = manager.getCheckpointState(42);
      expect(checkpoint).not.toBeNull();
      expect(checkpoint?.id).toBe(42);
    });

    it('should return null for unknown checkpoint ID', () => {
      const checkpoint = manager.getCheckpointState(999);
      expect(checkpoint).toBeNull();
    });

    it('should get all checkpoint states', () => {
      const state1 = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      const state2 = createDefaultPhysicsState({ position: { x: 200, y: 200 } });

      manager.recordCheckpoint(1, state1, 5.0, 10, 11);
      manager.recordCheckpoint(2, state2, 10.0, 20, 11);

      const allCheckpoints = manager.getAllCheckpointStates();
      expect(allCheckpoints).toHaveLength(2);
    });
  });

  describe('Respawn', () => {
    it('should return null respawn state when not in practice mode', () => {
      manager.setPracticeMode(true);
      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(1, state, 5.0, 10, 11);

      manager.setPracticeMode(false);
      expect(manager.getRespawnState()).toBeNull();
    });

    it('should return last checkpoint for respawn', () => {
      manager.setPracticeMode(true);
      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(1, state, 5.0, 10, 11);

      const respawnState = manager.getRespawnState();
      expect(respawnState).not.toBeNull();
      expect(respawnState?.id).toBe(1);
    });

    it('should emit checkpointRespawn event', () => {
      manager.setPracticeMode(true);
      let eventCheckpoint: any = null;
      manager.on('checkpointRespawn', (checkpoint) => {
        eventCheckpoint = checkpoint;
      });

      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(1, state, 5.0, 10, 11);

      const checkpoint = manager.getLastCheckpoint()!;
      manager.notifyRespawn(checkpoint);

      expect(eventCheckpoint).not.toBeNull();
      expect(eventCheckpoint?.id).toBe(1);
    });
  });

  describe('Reset', () => {
    beforeEach(() => {
      manager.setPracticeMode(true);
    });

    it('should reset triggered checkpoints', () => {
      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(1, state, 5.0, 10, 11);

      expect(manager.isCheckpointTriggered(1)).toBe(true);

      manager.resetTriggeredCheckpoints();
      expect(manager.isCheckpointTriggered(1)).toBe(false);
    });

    it('should clear all checkpoints', () => {
      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(1, state, 5.0, 10, 11);

      manager.clearAllCheckpoints();
      expect(manager.hasCheckpoint()).toBe(false);
      expect(manager.getReachedCheckpointCount()).toBe(0);
    });

    it('should fully reset for level change', () => {
      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(1, state, 5.0, 10, 11);
      manager.loadCheckpoints([{ id: 1, x: 10, y: 11 }]);

      manager.reset();

      expect(manager.hasCheckpoint()).toBe(false);
      expect(manager.getCheckpointDefinitions()).toHaveLength(0);
    });
  });

  describe('Checkpoint Definitions', () => {
    it('should load checkpoint definitions', () => {
      manager.loadCheckpoints([
        { id: 1, x: 10, y: 11, name: 'Start' },
        { id: 2, x: 20, y: 11, name: 'Middle' },
      ]);

      const definitions = manager.getCheckpointDefinitions();
      expect(definitions).toHaveLength(2);
    });

    it('should get checkpoint definition by ID', () => {
      manager.loadCheckpoints([{ id: 1, x: 10, y: 11, name: 'Start' }]);

      const definition = manager.getCheckpointDefinition(1);
      expect(definition?.name).toBe('Start');
    });

    it('should return undefined for unknown definition ID', () => {
      const definition = manager.getCheckpointDefinition(999);
      expect(definition).toBeUndefined();
    });
  });

  describe('Event Subscription', () => {
    it('should unsubscribe from events', () => {
      let eventCount = 0;
      const callback = () => {
        eventCount++;
      };

      const unsubscribe = manager.on('practiceModeChanged', callback);
      manager.setPracticeMode(true);
      expect(eventCount).toBe(1);

      unsubscribe();
      manager.setPracticeMode(false);
      expect(eventCount).toBe(1); // Should not have increased
    });

    it('should handle off method', () => {
      let eventCount = 0;
      const callback = () => {
        eventCount++;
      };

      manager.on('practiceModeChanged', callback);
      manager.setPracticeMode(true);
      expect(eventCount).toBe(1);

      manager.off('practiceModeChanged', callback);
      manager.setPracticeMode(false);
      expect(eventCount).toBe(1); // Should not have increased
    });
  });

  describe('Cleanup', () => {
    it('should clean up on destroy', () => {
      manager.setPracticeMode(true);
      const state = createDefaultPhysicsState({ position: { x: 100, y: 200 } });
      manager.recordCheckpoint(1, state, 5.0, 10, 11);
      manager.loadCheckpoints([{ id: 1, x: 10, y: 11 }]);

      manager.destroy();

      expect(manager.hasCheckpoint()).toBe(false);
      expect(manager.getCheckpointDefinitions()).toHaveLength(0);
    });
  });
});
