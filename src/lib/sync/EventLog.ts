// src/lib/sync/EventLog.ts

import { v4 as uuidv4 } from 'uuid';
import { readFile, writeFile, pathExists, createDirectory } from '../tauri/commands';
import {
  SyncEvent,
  VectorClock,
  NoteCreatedEvent,
  NoteUpdatedEvent,
  NoteDeletedEvent,
  NoteRenamedEvent,
  LinkCreatedEvent,
  LinkUpdatedEvent,
  LinkDeletedEvent,
} from './events';

const CONFIG_DIR = '.graphnotes';
const EVENTS_FILE = 'events.jsonl';
const CONFIG_FILE = 'config.json';

interface VaultConfig {
  deviceId: string;
  createdAt: string;
  lastSyncedClock?: VectorClock;
}

/**
 * EventLog - Manages the append-only event log for CDC/sync
 *
 * Events are stored as JSON Lines (.jsonl) format - one JSON object per line.
 * This enables efficient appending and streaming reads.
 */
export class EventLog {
  private vaultPath: string;
  private deviceId: string | null = null;
  private vectorClock: VectorClock = {};
  private eventBuffer: SyncEvent[] = [];
  private isInitialized = false;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  /**
   * Initialize the event log (load config, ensure directories exist)
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    const configDir = `${this.vaultPath}/${CONFIG_DIR}`;

    // Ensure .graphnotes directory exists
    if (!(await pathExists(configDir))) {
      await createDirectory(configDir);
    }

    // Load or create device config
    await this.loadOrCreateConfig();

    // Load existing events to rebuild vector clock
    await this.loadEvents();

    this.isInitialized = true;
    console.log('[EventLog] Initialized with device ID:', this.deviceId);
    console.log('[EventLog] Current vector clock:', this.vectorClock);
  }

  /**
   * Load or create the vault configuration (including device ID)
   */
  private async loadOrCreateConfig(): Promise<void> {
    const configPath = `${this.vaultPath}/${CONFIG_DIR}/${CONFIG_FILE}`;

    try {
      if (await pathExists(configPath)) {
        const fileContent = await readFile(configPath);
        const config: VaultConfig = JSON.parse(fileContent.content);
        this.deviceId = config.deviceId;
        if (config.lastSyncedClock) {
          this.vectorClock = config.lastSyncedClock;
        }
      } else {
        // Create new config with a unique device ID
        this.deviceId = uuidv4();
        const config: VaultConfig = {
          deviceId: this.deviceId,
          createdAt: new Date().toISOString(),
        };
        await writeFile(configPath, JSON.stringify(config, null, 2));
        console.log('[EventLog] Created new vault config');
      }
    } catch (error) {
      console.error('[EventLog] Error loading config:', error);
      // Fallback to generated device ID
      this.deviceId = uuidv4();
    }
  }

  /**
   * Load existing events from the event log file
   */
  private async loadEvents(): Promise<void> {
    const eventsPath = `${this.vaultPath}/${CONFIG_DIR}/${EVENTS_FILE}`;

    try {
      if (!(await pathExists(eventsPath))) {
        return;
      }

      const fileContent = await readFile(eventsPath);
      const lines = fileContent.content.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        try {
          const event: SyncEvent = JSON.parse(line);
          this.eventBuffer.push(event);

          // Update vector clock from event
          this.mergeVectorClock(event.vectorClock);
        } catch (e) {
          console.warn('[EventLog] Skipping malformed event line:', line);
        }
      }

      console.log('[EventLog] Loaded', this.eventBuffer.length, 'events');
    } catch (error) {
      console.error('[EventLog] Error loading events:', error);
    }
  }

  /**
   * Merge a vector clock into our local clock (take max of each component)
   */
  private mergeVectorClock(remote: VectorClock): void {
    for (const [deviceId, count] of Object.entries(remote)) {
      this.vectorClock[deviceId] = Math.max(this.vectorClock[deviceId] || 0, count);
    }
  }

  /**
   * Increment our local vector clock and return a copy
   */
  private incrementClock(): VectorClock {
    if (!this.deviceId) throw new Error('EventLog not initialized');

    this.vectorClock[this.deviceId] = (this.vectorClock[this.deviceId] || 0) + 1;
    return { ...this.vectorClock };
  }

  /**
   * Get the current device ID
   */
  getDeviceId(): string {
    if (!this.deviceId) throw new Error('EventLog not initialized');
    return this.deviceId;
  }

  /**
   * Get the current vector clock
   */
  getVectorClock(): VectorClock {
    return { ...this.vectorClock };
  }

  /**
   * Get all events (optionally after a specific clock)
   */
  getEvents(afterClock?: VectorClock): SyncEvent[] {
    if (!afterClock) {
      return [...this.eventBuffer];
    }

    // Filter events that are after the given clock
    return this.eventBuffer.filter((event) => {
      return this.isAfterClock(event.vectorClock, afterClock);
    });
  }

  /**
   * Check if clock A is after clock B (has any component greater)
   */
  private isAfterClock(a: VectorClock, b: VectorClock): boolean {
    for (const deviceId of Object.keys(a)) {
      if ((a[deviceId] || 0) > (b[deviceId] || 0)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Append an event to the log file
   */
  private async appendEvent(event: SyncEvent): Promise<void> {
    const eventsPath = `${this.vaultPath}/${CONFIG_DIR}/${EVENTS_FILE}`;

    // Read existing content (if any)
    let existingContent = '';
    try {
      if (await pathExists(eventsPath)) {
        const fileContent = await readFile(eventsPath);
        existingContent = fileContent.content;
        if (existingContent && !existingContent.endsWith('\n')) {
          existingContent += '\n';
        }
      }
    } catch {
      // File doesn't exist yet, that's fine
    }

    // Append new event as JSON line
    const newLine = JSON.stringify(event);
    await writeFile(eventsPath, existingContent + newLine + '\n');

    this.eventBuffer.push(event);
  }

  /**
   * Create and log a NOTE_CREATED event
   */
  async logNoteCreated(noteId: string, filepath: string, content: string): Promise<NoteCreatedEvent> {
    if (!this.deviceId) throw new Error('EventLog not initialized');

    const event: NoteCreatedEvent = {
      id: uuidv4(),
      type: 'NOTE_CREATED',
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      vectorClock: this.incrementClock(),
      payload: {
        noteId,
        filepath,
        content,
      },
    };

    await this.appendEvent(event);
    console.log('[EventLog] Logged NOTE_CREATED:', noteId);
    return event;
  }

  /**
   * Create and log a NOTE_UPDATED event
   */
  async logNoteUpdated(noteId: string, previousHash: string, newContent: string): Promise<NoteUpdatedEvent> {
    if (!this.deviceId) throw new Error('EventLog not initialized');

    const event: NoteUpdatedEvent = {
      id: uuidv4(),
      type: 'NOTE_UPDATED',
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      vectorClock: this.incrementClock(),
      payload: {
        noteId,
        previousHash,
        newContent,
      },
    };

    await this.appendEvent(event);
    console.log('[EventLog] Logged NOTE_UPDATED:', noteId);
    return event;
  }

  /**
   * Create and log a NOTE_DELETED event
   */
  async logNoteDeleted(noteId: string, filepath: string): Promise<NoteDeletedEvent> {
    if (!this.deviceId) throw new Error('EventLog not initialized');

    const event: NoteDeletedEvent = {
      id: uuidv4(),
      type: 'NOTE_DELETED',
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      vectorClock: this.incrementClock(),
      payload: {
        noteId,
        filepath,
      },
    };

    await this.appendEvent(event);
    console.log('[EventLog] Logged NOTE_DELETED:', noteId);
    return event;
  }

  /**
   * Create and log a NOTE_RENAMED event
   */
  async logNoteRenamed(noteId: string, oldFilepath: string, newFilepath: string): Promise<NoteRenamedEvent> {
    if (!this.deviceId) throw new Error('EventLog not initialized');

    const event: NoteRenamedEvent = {
      id: uuidv4(),
      type: 'NOTE_RENAMED',
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      vectorClock: this.incrementClock(),
      payload: {
        noteId,
        oldFilepath,
        newFilepath,
      },
    };

    await this.appendEvent(event);
    console.log('[EventLog] Logged NOTE_RENAMED:', noteId);
    return event;
  }

  /**
   * Create and log a LINK_CREATED event
   */
  async logLinkCreated(sourceId: string, targetId: string, name: string, description?: string): Promise<LinkCreatedEvent> {
    if (!this.deviceId) throw new Error('EventLog not initialized');

    const event: LinkCreatedEvent = {
      id: uuidv4(),
      type: 'LINK_CREATED',
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      vectorClock: this.incrementClock(),
      payload: {
        sourceId,
        targetId,
        name,
        description,
      },
    };

    await this.appendEvent(event);
    console.log('[EventLog] Logged LINK_CREATED:', sourceId, '->', targetId);
    return event;
  }

  /**
   * Create and log a LINK_UPDATED event
   */
  async logLinkUpdated(sourceId: string, targetId: string, name: string, description?: string): Promise<LinkUpdatedEvent> {
    if (!this.deviceId) throw new Error('EventLog not initialized');

    const event: LinkUpdatedEvent = {
      id: uuidv4(),
      type: 'LINK_UPDATED',
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      vectorClock: this.incrementClock(),
      payload: {
        sourceId,
        targetId,
        name,
        description,
      },
    };

    await this.appendEvent(event);
    console.log('[EventLog] Logged LINK_UPDATED:', sourceId, '->', targetId);
    return event;
  }

  /**
   * Create and log a LINK_DELETED event
   */
  async logLinkDeleted(sourceId: string, targetId: string): Promise<LinkDeletedEvent> {
    if (!this.deviceId) throw new Error('EventLog not initialized');

    const event: LinkDeletedEvent = {
      id: uuidv4(),
      type: 'LINK_DELETED',
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      vectorClock: this.incrementClock(),
      payload: {
        sourceId,
        targetId,
      },
    };

    await this.appendEvent(event);
    console.log('[EventLog] Logged LINK_DELETED:', sourceId, '->', targetId);
    return event;
  }

  /**
   * Apply remote events (from sync) to the local log
   */
  async applyRemoteEvents(events: SyncEvent[]): Promise<void> {
    for (const event of events) {
      // Check if we already have this event
      const exists = this.eventBuffer.some((e) => e.id === event.id);
      if (!exists) {
        await this.appendEvent(event);
        this.mergeVectorClock(event.vectorClock);
      }
    }
  }

  /**
   * Save the current config (including vector clock) to disk
   */
  async saveConfig(): Promise<void> {
    if (!this.deviceId) return;

    const configPath = `${this.vaultPath}/${CONFIG_DIR}/${CONFIG_FILE}`;
    const config: VaultConfig = {
      deviceId: this.deviceId,
      createdAt: new Date().toISOString(),
      lastSyncedClock: this.vectorClock,
    };

    await writeFile(configPath, JSON.stringify(config, null, 2));
  }
}

// Singleton management
let eventLogInstance: EventLog | null = null;

/**
 * Get or create the EventLog instance for a vault
 */
export function getEventLog(vaultPath: string): EventLog {
  if (!eventLogInstance || eventLogInstance['vaultPath'] !== vaultPath) {
    eventLogInstance = new EventLog(vaultPath);
  }
  return eventLogInstance;
}

/**
 * Reset the EventLog instance (for testing)
 */
export function resetEventLog(): void {
  eventLogInstance = null;
}
