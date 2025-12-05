import { LinkAppearance, AttributeValue } from '../notes/types';
import { SuperTag } from '../superTags/types';

// Vector clock for causal ordering
export interface VectorClock {
  [deviceId: string]: number;
}

// Event types
export type EventType =
  | 'NOTE_CREATED'
  | 'NOTE_UPDATED'
  | 'NOTE_DELETED'
  | 'NOTE_RENAMED'
  | 'LINK_CREATED'
  | 'LINK_UPDATED'
  | 'LINK_DELETED'
  | 'SUPERTAG_CREATED'
  | 'SUPERTAG_UPDATED'
  | 'SUPERTAG_DELETED'
  | 'SUPERTAG_ASSIGNED'
  | 'SUPERTAG_UNASSIGNED'
  | 'ATTRIBUTE_UPDATED';

// Base event structure
export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: string;
  deviceId: string;
  vectorClock: VectorClock;
}

// Note events
export interface NoteCreatedEvent extends BaseEvent {
  type: 'NOTE_CREATED';
  payload: {
    noteId: string;
    filepath: string;
    content: string;
  };
}

export interface NoteUpdatedEvent extends BaseEvent {
  type: 'NOTE_UPDATED';
  payload: {
    noteId: string;
    previousHash: string;
    newContent: string;
  };
}

export interface NoteDeletedEvent extends BaseEvent {
  type: 'NOTE_DELETED';
  payload: {
    noteId: string;
    filepath: string;
  };
}

export interface NoteRenamedEvent extends BaseEvent {
  type: 'NOTE_RENAMED';
  payload: {
    noteId: string;
    oldFilepath: string;
    newFilepath: string;
    newTitle: string;
  };
}

// Link events
export interface LinkCreatedEvent extends BaseEvent {
  type: 'LINK_CREATED';
  payload: {
    linkId: string;
    sourceId: string;
    targetId: string;
    name: string;
    description?: string;
    appearance: LinkAppearance;
  };
}

export interface LinkUpdatedEvent extends BaseEvent {
  type: 'LINK_UPDATED';
  payload: {
    linkId: string;
    sourceId: string;
    changes: Partial<{
      name: string;
      description: string;
      appearance: LinkAppearance;
    }>;
  };
}

export interface LinkDeletedEvent extends BaseEvent {
  type: 'LINK_DELETED';
  payload: {
    linkId: string;
    sourceId: string;
  };
}

// Super tag events
export interface SuperTagCreatedEvent extends BaseEvent {
  type: 'SUPERTAG_CREATED';
  payload: {
    superTag: SuperTag;
  };
}

export interface SuperTagUpdatedEvent extends BaseEvent {
  type: 'SUPERTAG_UPDATED';
  payload: {
    superTagId: string;
    changes: Partial<SuperTag>;
  };
}

export interface SuperTagDeletedEvent extends BaseEvent {
  type: 'SUPERTAG_DELETED';
  payload: {
    superTagId: string;
  };
}

export interface SuperTagAssignedEvent extends BaseEvent {
  type: 'SUPERTAG_ASSIGNED';
  payload: {
    noteId: string;
    superTagId: string;
  };
}

export interface SuperTagUnassignedEvent extends BaseEvent {
  type: 'SUPERTAG_UNASSIGNED';
  payload: {
    noteId: string;
    superTagId: string;
  };
}

export interface AttributeUpdatedEvent extends BaseEvent {
  type: 'ATTRIBUTE_UPDATED';
  payload: {
    noteId: string;
    superTagId: string;
    attributeKey: string;
    value: AttributeValue;
  };
}

// Union type for all events
export type SyncEvent =
  | NoteCreatedEvent
  | NoteUpdatedEvent
  | NoteDeletedEvent
  | NoteRenamedEvent
  | LinkCreatedEvent
  | LinkUpdatedEvent
  | LinkDeletedEvent
  | SuperTagCreatedEvent
  | SuperTagUpdatedEvent
  | SuperTagDeletedEvent
  | SuperTagAssignedEvent
  | SuperTagUnassignedEvent
  | AttributeUpdatedEvent;

// Helper to create a base event
export function createBaseEvent(
  type: EventType,
  deviceId: string,
  vectorClock: VectorClock
): BaseEvent {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    deviceId,
    vectorClock: { ...vectorClock },
  };
}

// Vector clock utilities
export function incrementClock(clock: VectorClock, deviceId: string): VectorClock {
  return {
    ...clock,
    [deviceId]: (clock[deviceId] || 0) + 1,
  };
}

export function mergeClock(local: VectorClock, remote: VectorClock): VectorClock {
  const merged: VectorClock = { ...local };
  for (const [deviceId, count] of Object.entries(remote)) {
    merged[deviceId] = Math.max(merged[deviceId] || 0, count);
  }
  return merged;
}

export function compareClock(
  a: VectorClock,
  b: VectorClock
): 'before' | 'after' | 'concurrent' | 'equal' {
  let aBeforeB = false;
  let bBeforeA = false;

  const allDevices = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const deviceId of allDevices) {
    const aCount = a[deviceId] || 0;
    const bCount = b[deviceId] || 0;

    if (aCount < bCount) aBeforeB = true;
    if (bCount < aCount) bBeforeA = true;
  }

  if (!aBeforeB && !bBeforeA) return 'equal';
  if (aBeforeB && !bBeforeA) return 'before';
  if (bBeforeA && !aBeforeB) return 'after';
  return 'concurrent';
}

// Check if event a happened before event b
export function happenedBefore(a: SyncEvent, b: SyncEvent): boolean {
  return compareClock(a.vectorClock, b.vectorClock) === 'before';
}

// Sort events by causal order (topological sort)
export function sortEventsCausally(events: SyncEvent[]): SyncEvent[] {
  return [...events].sort((a, b) => {
    const comparison = compareClock(a.vectorClock, b.vectorClock);
    if (comparison === 'before') return -1;
    if (comparison === 'after') return 1;
    // For concurrent events, use timestamp as tiebreaker
    return a.timestamp.localeCompare(b.timestamp);
  });
}
