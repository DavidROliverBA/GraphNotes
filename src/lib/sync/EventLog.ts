import {
  SyncEvent,
  VectorClock,
  incrementClock,
  mergeClock,
  sortEventsCausally,
  createBaseEvent,
  EventType,
} from './events';
import { isTauriEnvironment } from '../tauri/environment';

const EVENTS_FILE = 'events.jsonl';
const CONFIG_FILE = 'config.json';

// Lazy load Tauri APIs
const getTauriApis = async () => {
  if (!isTauriEnvironment()) {
    return null;
  }
  const [fs, path] = await Promise.all([
    import('@tauri-apps/plugin-fs'),
    import('@tauri-apps/api/path'),
  ]);
  return { fs, path };
};

// Browser-mode storage (in-memory)
const browserStorage = {
  files: new Map<string, string>(),
};

// Browser-mode file operations
async function browserJoin(...parts: string[]): Promise<string> {
  return parts.join('/').replace(/\/+/g, '/');
}

async function browserReadTextFile(path: string): Promise<string> {
  const content = browserStorage.files.get(path);
  if (content === undefined) {
    throw new Error(`File not found: ${path}`);
  }
  return content;
}

async function browserWriteTextFile(path: string, content: string): Promise<void> {
  browserStorage.files.set(path, content);
}

async function browserMkdir(_path: string, _options?: { recursive?: boolean }): Promise<void> {
  // No-op in browser mode
}

interface VaultConfig {
  deviceId: string;
  vaultId: string;
  created: string;
}

export class EventLog {
  private vaultPath: string;
  private events: SyncEvent[] = [];
  private vectorClock: VectorClock = {};
  private deviceId: string = '';
  private vaultId: string = '';
  private isInitialized = false;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  /**
   * Initialize the event log - load events and config
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const tauri = await getTauriApis();
    const join = tauri ? tauri.path.join : browserJoin;
    const mkdir = tauri ? tauri.fs.mkdir : browserMkdir;

    const configPath = await join(this.vaultPath, '.graphnotes');

    // Ensure .graphnotes directory exists
    try {
      await mkdir(configPath, { recursive: true });
    } catch {
      // Directory might exist
    }

    // Load or create config
    await this.loadOrCreateConfig();

    // Load existing events
    await this.loadEvents();

    this.isInitialized = true;
  }

  /**
   * Load or create vault configuration
   */
  private async loadOrCreateConfig(): Promise<void> {
    const tauri = await getTauriApis();
    const join = tauri ? tauri.path.join : browserJoin;
    const readTextFile = tauri ? tauri.fs.readTextFile : browserReadTextFile;
    const writeTextFile = tauri ? tauri.fs.writeTextFile : browserWriteTextFile;

    const configFilePath = await join(this.vaultPath, '.graphnotes', CONFIG_FILE);

    try {
      const content = await readTextFile(configFilePath);
      const config: VaultConfig = JSON.parse(content);
      this.deviceId = config.deviceId;
      this.vaultId = config.vaultId;
    } catch {
      // Create new config
      this.deviceId = crypto.randomUUID();
      this.vaultId = crypto.randomUUID();

      const config: VaultConfig = {
        deviceId: this.deviceId,
        vaultId: this.vaultId,
        created: new Date().toISOString(),
      };

      await writeTextFile(configFilePath, JSON.stringify(config, null, 2));
    }
  }

  /**
   * Load events from the events.jsonl file
   */
  private async loadEvents(): Promise<void> {
    const tauri = await getTauriApis();
    const join = tauri ? tauri.path.join : browserJoin;
    const readTextFile = tauri ? tauri.fs.readTextFile : browserReadTextFile;

    const eventsFilePath = await join(this.vaultPath, '.graphnotes', EVENTS_FILE);

    try {
      const content = await readTextFile(eventsFilePath);
      const lines = content.trim().split('\n').filter(Boolean);

      this.events = lines.map((line) => JSON.parse(line) as SyncEvent);

      // Rebuild vector clock from loaded events
      this.vectorClock = {};
      for (const event of this.events) {
        this.vectorClock = mergeClock(this.vectorClock, event.vectorClock);
      }
    } catch {
      // File doesn't exist yet
      this.events = [];
      this.vectorClock = {};
    }
  }

  /**
   * Append an event to the log
   */
  async appendEvent<T extends SyncEvent>(
    type: T['type'],
    payload: T['payload']
  ): Promise<T> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Increment vector clock
    this.vectorClock = incrementClock(this.vectorClock, this.deviceId);

    // Create event
    const baseEvent = createBaseEvent(type, this.deviceId, this.vectorClock);
    const event = {
      ...baseEvent,
      payload,
    } as T;

    // Add to in-memory list
    this.events.push(event);

    // Append to file
    const tauri = await getTauriApis();
    const join = tauri ? tauri.path.join : browserJoin;
    const readTextFile = tauri ? tauri.fs.readTextFile : browserReadTextFile;
    const writeTextFile = tauri ? tauri.fs.writeTextFile : browserWriteTextFile;

    const eventsFilePath = await join(this.vaultPath, '.graphnotes', EVENTS_FILE);

    try {
      const existingContent = await readTextFile(eventsFilePath);
      await writeTextFile(eventsFilePath, existingContent + JSON.stringify(event) + '\n');
    } catch {
      // File doesn't exist, create it
      await writeTextFile(eventsFilePath, JSON.stringify(event) + '\n');
    }

    return event;
  }

  /**
   * Get all events
   */
  getEvents(): SyncEvent[] {
    return [...this.events];
  }

  /**
   * Get events sorted by causal order
   */
  getEventsSorted(): SyncEvent[] {
    return sortEventsCausally(this.events);
  }

  /**
   * Get events after a specific vector clock
   */
  getEventsAfter(clock: VectorClock): SyncEvent[] {
    return this.events.filter((event) => {
      // Check if this event is newer than the given clock
      for (const [deviceId, count] of Object.entries(event.vectorClock)) {
        if (count > (clock[deviceId] || 0)) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Get events by type
   */
  getEventsByType<T extends SyncEvent>(type: EventType): T[] {
    return this.events.filter((e) => e.type === type) as T[];
  }

  /**
   * Get events for a specific note
   */
  getEventsForNote(noteId: string): SyncEvent[] {
    return this.events.filter((event) => {
      const payload = event.payload as Record<string, unknown>;
      return payload.noteId === noteId || payload.sourceId === noteId;
    });
  }

  /**
   * Merge events from a remote peer
   */
  async mergeRemoteEvents(remoteEvents: SyncEvent[]): Promise<SyncEvent[]> {
    const newEvents: SyncEvent[] = [];

    const tauri = await getTauriApis();
    const join = tauri ? tauri.path.join : browserJoin;
    const readTextFile = tauri ? tauri.fs.readTextFile : browserReadTextFile;
    const writeTextFile = tauri ? tauri.fs.writeTextFile : browserWriteTextFile;

    for (const remoteEvent of remoteEvents) {
      // Check if we already have this event
      const exists = this.events.some((e) => e.id === remoteEvent.id);
      if (!exists) {
        this.events.push(remoteEvent);
        newEvents.push(remoteEvent);

        // Append to file
        const eventsFilePath = await join(this.vaultPath, '.graphnotes', EVENTS_FILE);
        try {
          const existingContent = await readTextFile(eventsFilePath);
          await writeTextFile(eventsFilePath, existingContent + JSON.stringify(remoteEvent) + '\n');
        } catch {
          await writeTextFile(eventsFilePath, JSON.stringify(remoteEvent) + '\n');
        }
      }
    }

    // Update vector clock
    for (const event of newEvents) {
      this.vectorClock = mergeClock(this.vectorClock, event.vectorClock);
    }

    return sortEventsCausally(newEvents);
  }

  /**
   * Get current vector clock
   */
  getVectorClock(): VectorClock {
    return { ...this.vectorClock };
  }

  /**
   * Get device ID
   */
  getDeviceId(): string {
    return this.deviceId;
  }

  /**
   * Get vault ID
   */
  getVaultId(): string {
    return this.vaultId;
  }

  /**
   * Get event count
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Clear all events (for testing/reset)
   */
  async clearEvents(): Promise<void> {
    this.events = [];
    this.vectorClock = {};

    const tauri = await getTauriApis();
    const join = tauri ? tauri.path.join : browserJoin;
    const writeTextFile = tauri ? tauri.fs.writeTextFile : browserWriteTextFile;

    const eventsFilePath = await join(this.vaultPath, '.graphnotes', EVENTS_FILE);
    await writeTextFile(eventsFilePath, '');
  }
}

// Singleton pattern for current vault
let currentEventLog: EventLog | null = null;

export async function getEventLog(vaultPath: string): Promise<EventLog> {
  if (!currentEventLog || (currentEventLog as any).vaultPath !== vaultPath) {
    currentEventLog = new EventLog(vaultPath);
    await currentEventLog.initialize();
  }
  return currentEventLog;
}

export function resetEventLog(): void {
  currentEventLog = null;
}
