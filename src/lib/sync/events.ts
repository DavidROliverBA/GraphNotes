// src/lib/sync/events.ts

export type EventType =
  | 'NOTE_CREATED'
  | 'NOTE_UPDATED'
  | 'NOTE_DELETED'
  | 'NOTE_RENAMED'
  | 'LINK_CREATED'
  | 'LINK_UPDATED'
  | 'LINK_DELETED';

export interface VectorClock {
  [deviceId: string]: number;
}

export interface BaseEvent {
  id: string;                      // UUID
  type: EventType;
  timestamp: string;               // ISO 8601
  deviceId: string;                // Originating device
  vectorClock: VectorClock;        // For ordering
}

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
    previousHash: string;          // For conflict detection
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
  };
}

export interface LinkCreatedEvent extends BaseEvent {
  type: 'LINK_CREATED';
  payload: {
    sourceId: string;
    targetId: string;
    name: string;
    description?: string;
  };
}

export interface LinkUpdatedEvent extends BaseEvent {
  type: 'LINK_UPDATED';
  payload: {
    sourceId: string;
    targetId: string;
    name: string;
    description?: string;
  };
}

export interface LinkDeletedEvent extends BaseEvent {
  type: 'LINK_DELETED';
  payload: {
    sourceId: string;
    targetId: string;
  };
}

export type SyncEvent =
  | NoteCreatedEvent
  | NoteUpdatedEvent
  | NoteDeletedEvent
  | NoteRenamedEvent
  | LinkCreatedEvent
  | LinkUpdatedEvent
  | LinkDeletedEvent;
