import { describe, it, expect } from 'vitest';
import {
  VectorClock,
  incrementClock,
  mergeClock,
  compareClock,
  happenedBefore,
  sortEventsCausally,
  createBaseEvent,
  SyncEvent,
  NoteCreatedEvent,
} from './events';

describe('Vector Clock Operations', () => {
  describe('incrementClock', () => {
    it('should increment existing device count', () => {
      const clock: VectorClock = { 'device-1': 5 };
      const result = incrementClock(clock, 'device-1');
      expect(result['device-1']).toBe(6);
    });

    it('should initialize new device count to 1', () => {
      const clock: VectorClock = { 'device-1': 5 };
      const result = incrementClock(clock, 'device-2');
      expect(result['device-1']).toBe(5);
      expect(result['device-2']).toBe(1);
    });

    it('should not mutate original clock', () => {
      const clock: VectorClock = { 'device-1': 5 };
      incrementClock(clock, 'device-1');
      expect(clock['device-1']).toBe(5);
    });
  });

  describe('mergeClock', () => {
    it('should take max of each component', () => {
      const local: VectorClock = { 'device-1': 5, 'device-2': 3 };
      const remote: VectorClock = { 'device-1': 3, 'device-2': 7 };
      const result = mergeClock(local, remote);
      expect(result['device-1']).toBe(5);
      expect(result['device-2']).toBe(7);
    });

    it('should include devices only in local', () => {
      const local: VectorClock = { 'device-1': 5 };
      const remote: VectorClock = { 'device-2': 3 };
      const result = mergeClock(local, remote);
      expect(result['device-1']).toBe(5);
      expect(result['device-2']).toBe(3);
    });

    it('should handle empty clocks', () => {
      const local: VectorClock = {};
      const remote: VectorClock = { 'device-1': 3 };
      const result = mergeClock(local, remote);
      expect(result['device-1']).toBe(3);
    });
  });

  describe('compareClock', () => {
    it('should return "equal" for identical clocks', () => {
      const a: VectorClock = { 'device-1': 5, 'device-2': 3 };
      const b: VectorClock = { 'device-1': 5, 'device-2': 3 };
      expect(compareClock(a, b)).toBe('equal');
    });

    it('should return "before" when a happened before b', () => {
      const a: VectorClock = { 'device-1': 3 };
      const b: VectorClock = { 'device-1': 5 };
      expect(compareClock(a, b)).toBe('before');
    });

    it('should return "after" when a happened after b', () => {
      const a: VectorClock = { 'device-1': 5 };
      const b: VectorClock = { 'device-1': 3 };
      expect(compareClock(a, b)).toBe('after');
    });

    it('should return "concurrent" for concurrent clocks', () => {
      const a: VectorClock = { 'device-1': 5, 'device-2': 3 };
      const b: VectorClock = { 'device-1': 3, 'device-2': 5 };
      expect(compareClock(a, b)).toBe('concurrent');
    });

    it('should handle clocks with different devices', () => {
      const a: VectorClock = { 'device-1': 5 };
      const b: VectorClock = { 'device-2': 5 };
      expect(compareClock(a, b)).toBe('concurrent');
    });
  });

  describe('happenedBefore', () => {
    it('should return true when event a happened before event b', () => {
      const a = createMockEvent({ 'device-1': 3 });
      const b = createMockEvent({ 'device-1': 5 });
      expect(happenedBefore(a, b)).toBe(true);
    });

    it('should return false when events are concurrent', () => {
      const a = createMockEvent({ 'device-1': 5, 'device-2': 3 });
      const b = createMockEvent({ 'device-1': 3, 'device-2': 5 });
      expect(happenedBefore(a, b)).toBe(false);
    });
  });

  describe('sortEventsCausally', () => {
    it('should sort events in causal order', () => {
      const events = [
        createMockEvent({ 'device-1': 5 }, '2024-01-01T00:00:03Z'),
        createMockEvent({ 'device-1': 1 }, '2024-01-01T00:00:01Z'),
        createMockEvent({ 'device-1': 3 }, '2024-01-01T00:00:02Z'),
      ];

      const sorted = sortEventsCausally(events);

      expect(sorted[0].vectorClock['device-1']).toBe(1);
      expect(sorted[1].vectorClock['device-1']).toBe(3);
      expect(sorted[2].vectorClock['device-1']).toBe(5);
    });

    it('should use timestamp as tiebreaker for concurrent events', () => {
      const events = [
        createMockEvent({ 'device-1': 5 }, '2024-01-01T00:00:02Z'),
        createMockEvent({ 'device-2': 5 }, '2024-01-01T00:00:01Z'),
      ];

      const sorted = sortEventsCausally(events);

      // Earlier timestamp should come first for concurrent events
      expect(sorted[0].timestamp).toBe('2024-01-01T00:00:01Z');
      expect(sorted[1].timestamp).toBe('2024-01-01T00:00:02Z');
    });

    it('should not mutate original array', () => {
      const events = [
        createMockEvent({ 'device-1': 5 }),
        createMockEvent({ 'device-1': 1 }),
      ];
      const original = [...events];

      sortEventsCausally(events);

      expect(events[0]).toBe(original[0]);
      expect(events[1]).toBe(original[1]);
    });
  });
});

describe('createBaseEvent', () => {
  it('should create event with all required fields', () => {
    const clock: VectorClock = { 'device-1': 5 };
    const event = createBaseEvent('NOTE_CREATED', 'device-1', clock);

    expect(event.id).toBeDefined();
    expect(event.type).toBe('NOTE_CREATED');
    expect(event.deviceId).toBe('device-1');
    expect(event.timestamp).toBeDefined();
    expect(event.vectorClock).toEqual({ 'device-1': 5 });
  });

  it('should generate unique IDs', () => {
    const clock: VectorClock = { 'device-1': 5 };
    const event1 = createBaseEvent('NOTE_CREATED', 'device-1', clock);
    const event2 = createBaseEvent('NOTE_CREATED', 'device-1', clock);

    expect(event1.id).not.toBe(event2.id);
  });

  it('should copy vector clock to prevent mutation', () => {
    const clock: VectorClock = { 'device-1': 5 };
    const event = createBaseEvent('NOTE_CREATED', 'device-1', clock);

    clock['device-1'] = 10;

    expect(event.vectorClock['device-1']).toBe(5);
  });
});

// Helper to create mock events for testing
function createMockEvent(
  vectorClock: VectorClock,
  timestamp: string = new Date().toISOString()
): SyncEvent {
  return {
    id: crypto.randomUUID(),
    type: 'NOTE_CREATED',
    timestamp,
    deviceId: 'test-device',
    vectorClock,
    payload: {
      noteId: 'test-note',
      filepath: 'test.md',
      content: 'test content',
    },
  } as NoteCreatedEvent;
}
