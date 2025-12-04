// src/lib/sync/EventLog.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SyncEvent,
  VectorClock,
  NoteCreatedEvent,
  NoteUpdatedEvent,
} from './events';

// Mock Tauri commands
vi.mock('../tauri/commands', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  pathExists: vi.fn(),
  createDirectory: vi.fn(),
}));

// Import after mocking
import { EventLog, getEventLog, resetEventLog } from './EventLog';
import { readFile, writeFile, pathExists, createDirectory } from '../tauri/commands';

describe('EventLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetEventLog();
  });

  describe('initialization', () => {
    it('should create config directory if it does not exist', async () => {
      vi.mocked(pathExists).mockResolvedValueOnce(false); // config dir doesn't exist
      vi.mocked(createDirectory).mockResolvedValue(undefined);
      vi.mocked(pathExists).mockResolvedValueOnce(false); // config file doesn't exist
      vi.mocked(writeFile).mockResolvedValue(undefined);
      vi.mocked(pathExists).mockResolvedValueOnce(false); // events file doesn't exist

      const eventLog = new EventLog('/test/vault');
      await eventLog.init();

      expect(createDirectory).toHaveBeenCalledWith('/test/vault/.graphnotes');
    });

    it('should generate a new device ID if config does not exist', async () => {
      vi.mocked(pathExists).mockResolvedValueOnce(true); // config dir exists
      vi.mocked(pathExists).mockResolvedValueOnce(false); // config file doesn't exist
      vi.mocked(writeFile).mockResolvedValue(undefined);
      vi.mocked(pathExists).mockResolvedValueOnce(false); // events file doesn't exist

      const eventLog = new EventLog('/test/vault');
      await eventLog.init();

      const deviceId = eventLog.getDeviceId();
      expect(deviceId).toBeDefined();
      expect(deviceId.length).toBeGreaterThan(0);
    });

    it('should load existing device ID from config', async () => {
      const existingConfig = {
        deviceId: 'existing-device-id',
        createdAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(pathExists).mockResolvedValueOnce(true); // config dir exists
      vi.mocked(pathExists).mockResolvedValueOnce(true); // config file exists
      vi.mocked(readFile).mockResolvedValueOnce({
        path: '/test/vault/.graphnotes/config.json',
        content: JSON.stringify(existingConfig),
        exists: true,
      });
      vi.mocked(pathExists).mockResolvedValueOnce(false); // events file doesn't exist

      const eventLog = new EventLog('/test/vault');
      await eventLog.init();

      expect(eventLog.getDeviceId()).toBe('existing-device-id');
    });

    it('should load existing events and rebuild vector clock', async () => {
      const existingEvents: SyncEvent[] = [
        {
          id: 'event-1',
          type: 'NOTE_CREATED',
          timestamp: '2024-01-01T00:00:00Z',
          deviceId: 'device-a',
          vectorClock: { 'device-a': 1 },
          payload: {
            noteId: 'note-1',
            filepath: 'note-1.md',
            content: '# Test',
          },
        } as NoteCreatedEvent,
        {
          id: 'event-2',
          type: 'NOTE_UPDATED',
          timestamp: '2024-01-01T00:01:00Z',
          deviceId: 'device-a',
          vectorClock: { 'device-a': 2 },
          payload: {
            noteId: 'note-1',
            previousHash: 'abc123',
            newContent: '# Updated Test',
          },
        } as NoteUpdatedEvent,
      ];

      vi.mocked(pathExists).mockResolvedValueOnce(true); // config dir exists
      vi.mocked(pathExists).mockResolvedValueOnce(true); // config file exists
      vi.mocked(readFile).mockResolvedValueOnce({
        path: '/test/vault/.graphnotes/config.json',
        content: JSON.stringify({ deviceId: 'device-a', createdAt: '2024-01-01T00:00:00Z' }),
        exists: true,
      });
      vi.mocked(pathExists).mockResolvedValueOnce(true); // events file exists
      vi.mocked(readFile).mockResolvedValueOnce({
        path: '/test/vault/.graphnotes/events.jsonl',
        content: existingEvents.map((e) => JSON.stringify(e)).join('\n'),
        exists: true,
      });

      const eventLog = new EventLog('/test/vault');
      await eventLog.init();

      const events = eventLog.getEvents();
      expect(events.length).toBe(2);

      const clock = eventLog.getVectorClock();
      expect(clock['device-a']).toBe(2);
    });
  });

  describe('logging events', () => {
    let eventLog: EventLog;

    beforeEach(async () => {
      vi.mocked(pathExists).mockResolvedValue(false);
      vi.mocked(createDirectory).mockResolvedValue(undefined);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      eventLog = new EventLog('/test/vault');
      await eventLog.init();
    });

    it('should log NOTE_CREATED event with incremented vector clock', async () => {
      const event = await eventLog.logNoteCreated('note-1', 'note-1.md', '# Test');

      expect(event.type).toBe('NOTE_CREATED');
      expect(event.payload.noteId).toBe('note-1');
      expect(event.payload.filepath).toBe('note-1.md');
      expect(event.payload.content).toBe('# Test');
      expect(event.deviceId).toBe(eventLog.getDeviceId());
      expect(event.vectorClock[eventLog.getDeviceId()]).toBe(1);

      // Verify event was written to file
      expect(writeFile).toHaveBeenCalled();
    });

    it('should log NOTE_UPDATED event', async () => {
      const event = await eventLog.logNoteUpdated('note-1', 'hash123', '# Updated');

      expect(event.type).toBe('NOTE_UPDATED');
      expect(event.payload.noteId).toBe('note-1');
      expect(event.payload.previousHash).toBe('hash123');
      expect(event.payload.newContent).toBe('# Updated');
    });

    it('should log NOTE_DELETED event', async () => {
      const event = await eventLog.logNoteDeleted('note-1', 'note-1.md');

      expect(event.type).toBe('NOTE_DELETED');
      expect(event.payload.noteId).toBe('note-1');
      expect(event.payload.filepath).toBe('note-1.md');
    });

    it('should log NOTE_RENAMED event', async () => {
      const event = await eventLog.logNoteRenamed('note-1', 'old.md', 'new.md');

      expect(event.type).toBe('NOTE_RENAMED');
      expect(event.payload.noteId).toBe('note-1');
      expect(event.payload.oldFilepath).toBe('old.md');
      expect(event.payload.newFilepath).toBe('new.md');
    });

    it('should log LINK_CREATED event', async () => {
      const event = await eventLog.logLinkCreated('source', 'target', 'relates to', 'description');

      expect(event.type).toBe('LINK_CREATED');
      expect(event.payload.sourceId).toBe('source');
      expect(event.payload.targetId).toBe('target');
      expect(event.payload.name).toBe('relates to');
      expect(event.payload.description).toBe('description');
    });

    it('should log LINK_DELETED event', async () => {
      const event = await eventLog.logLinkDeleted('source', 'target');

      expect(event.type).toBe('LINK_DELETED');
      expect(event.payload.sourceId).toBe('source');
      expect(event.payload.targetId).toBe('target');
    });

    it('should increment vector clock for each event', async () => {
      await eventLog.logNoteCreated('note-1', 'note-1.md', '# Test 1');
      await eventLog.logNoteCreated('note-2', 'note-2.md', '# Test 2');
      await eventLog.logNoteCreated('note-3', 'note-3.md', '# Test 3');

      const clock = eventLog.getVectorClock();
      expect(clock[eventLog.getDeviceId()]).toBe(3);
    });
  });

  describe('vector clock operations', () => {
    it('should filter events by vector clock', async () => {
      // Create event log with some existing events
      const events: SyncEvent[] = [
        {
          id: 'event-1',
          type: 'NOTE_CREATED',
          timestamp: '2024-01-01T00:00:00Z',
          deviceId: 'device-a',
          vectorClock: { 'device-a': 1 },
          payload: { noteId: 'note-1', filepath: 'note-1.md', content: '# Test 1' },
        } as NoteCreatedEvent,
        {
          id: 'event-2',
          type: 'NOTE_CREATED',
          timestamp: '2024-01-01T00:01:00Z',
          deviceId: 'device-a',
          vectorClock: { 'device-a': 2 },
          payload: { noteId: 'note-2', filepath: 'note-2.md', content: '# Test 2' },
        } as NoteCreatedEvent,
        {
          id: 'event-3',
          type: 'NOTE_CREATED',
          timestamp: '2024-01-01T00:02:00Z',
          deviceId: 'device-b',
          vectorClock: { 'device-a': 2, 'device-b': 1 },
          payload: { noteId: 'note-3', filepath: 'note-3.md', content: '# Test 3' },
        } as NoteCreatedEvent,
      ];

      vi.mocked(pathExists).mockResolvedValueOnce(true);
      vi.mocked(pathExists).mockResolvedValueOnce(true);
      vi.mocked(readFile).mockResolvedValueOnce({
        path: '/test/vault/.graphnotes/config.json',
        content: JSON.stringify({ deviceId: 'device-a', createdAt: '2024-01-01T00:00:00Z' }),
        exists: true,
      });
      vi.mocked(pathExists).mockResolvedValueOnce(true);
      vi.mocked(readFile).mockResolvedValueOnce({
        path: '/test/vault/.graphnotes/events.jsonl',
        content: events.map((e) => JSON.stringify(e)).join('\n'),
        exists: true,
      });

      const eventLog = new EventLog('/test/vault');
      await eventLog.init();

      // Get events after device-a: 1
      const afterClock: VectorClock = { 'device-a': 1 };
      const filteredEvents = eventLog.getEvents(afterClock);

      // Should return events 2 and 3 (they have device-a > 1 or device-b > 0)
      expect(filteredEvents.length).toBe(2);
      expect(filteredEvents.map((e) => e.id)).toContain('event-2');
      expect(filteredEvents.map((e) => e.id)).toContain('event-3');
    });

    it('should return all events when no clock filter provided', async () => {
      vi.mocked(pathExists).mockResolvedValue(false);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const eventLog = new EventLog('/test/vault');
      await eventLog.init();

      await eventLog.logNoteCreated('note-1', 'note-1.md', '# Test 1');
      await eventLog.logNoteCreated('note-2', 'note-2.md', '# Test 2');

      const allEvents = eventLog.getEvents();
      expect(allEvents.length).toBe(2);
    });
  });

  describe('singleton management', () => {
    it('should return same instance for same vault path', () => {
      const instance1 = getEventLog('/test/vault');
      const instance2 = getEventLog('/test/vault');

      expect(instance1).toBe(instance2);
    });

    it('should return new instance for different vault path', () => {
      const instance1 = getEventLog('/test/vault1');
      const instance2 = getEventLog('/test/vault2');

      expect(instance1).not.toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getEventLog('/test/vault');
      resetEventLog();
      const instance2 = getEventLog('/test/vault');

      expect(instance1).not.toBe(instance2);
    });
  });
});
