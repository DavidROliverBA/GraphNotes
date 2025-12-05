import { SyncEvent, VectorClock, compareClock } from './events';
import { EventLog } from './EventLog';
import { isTauriEnvironment } from '../tauri/environment';

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
  directories: new Set<string>(),
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

async function browserMkdir(path: string, _options?: { recursive?: boolean }): Promise<void> {
  browserStorage.directories.add(path);
}

async function browserRemove(path: string): Promise<void> {
  browserStorage.files.delete(path);
  browserStorage.directories.delete(path);
}

interface BrowserDirEntry {
  name: string;
}

async function browserReadDir(path: string): Promise<BrowserDirEntry[]> {
  const entries: BrowserDirEntry[] = [];
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;

  for (const filePath of browserStorage.files.keys()) {
    if (filePath.startsWith(normalizedPath + '/')) {
      const relativePath = filePath.slice(normalizedPath.length + 1);
      if (!relativePath.includes('/')) {
        entries.push({ name: relativePath });
      }
    }
  }

  return entries;
}

// Device presence file structure
interface DevicePresence {
  deviceId: string;
  deviceName: string;
  vaultId: string;
  vectorClock: VectorClock;
  lastSeen: string;
  eventCount: number;
}

// Sync state for a device
export interface SyncDeviceState {
  deviceId: string;
  deviceName: string;
  isOnline: boolean;
  lastSeen: string;
  vectorClock: VectorClock;
  eventCount: number;
  needsSync: boolean;
}

// File-based sync configuration
export interface FileBasedSyncConfig {
  deviceName: string;
  presenceUpdateIntervalMs: number;
  syncCheckIntervalMs: number;
  staleThresholdMs: number;
}

const DEFAULT_CONFIG: FileBasedSyncConfig = {
  deviceName: 'GraphNotes Device',
  presenceUpdateIntervalMs: 5000, // Update presence every 5 seconds
  syncCheckIntervalMs: 10000, // Check for sync every 10 seconds
  staleThresholdMs: 30000, // Consider device offline after 30 seconds
};

const SYNC_DIR = '.graphnotes/sync';
const PRESENCE_DIR = 'presence';
const EVENTS_DIR = 'events';

/**
 * File-based sync mechanism for syncing via shared folders
 * Works with Dropbox, iCloud, Google Drive, network shares, etc.
 */
export class FileBasedSync {
  private eventLog: EventLog;
  private vaultPath: string;
  private config: FileBasedSyncConfig;
  private presenceTimer: ReturnType<typeof setInterval> | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private onEventReceived?: (event: SyncEvent) => void;
  private onDeviceStateChanged?: (devices: SyncDeviceState[]) => void;

  constructor(
    eventLog: EventLog,
    vaultPath: string,
    config: Partial<FileBasedSyncConfig> = {}
  ) {
    this.eventLog = eventLog;
    this.vaultPath = vaultPath;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start file-based sync
   */
  async start(
    onEventReceived?: (event: SyncEvent) => void,
    onDeviceStateChanged?: (devices: SyncDeviceState[]) => void
  ): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onEventReceived = onEventReceived;
    this.onDeviceStateChanged = onDeviceStateChanged;

    // Ensure sync directories exist
    await this.ensureSyncDirectories();

    // Start presence updates
    await this.updatePresence();
    this.presenceTimer = setInterval(() => {
      this.updatePresence();
    }, this.config.presenceUpdateIntervalMs);

    // Start sync checks
    await this.checkForSync();
    this.syncTimer = setInterval(() => {
      this.checkForSync();
    }, this.config.syncCheckIntervalMs);

    console.log('[FileBasedSync] Started');
  }

  /**
   * Stop file-based sync
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.presenceTimer) {
      clearInterval(this.presenceTimer);
      this.presenceTimer = null;
    }
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    // Remove our presence file
    try {
      const tauri = await getTauriApis();
      const remove = tauri ? tauri.fs.remove : browserRemove;
      const presenceFile = await this.getPresenceFilePath();
      await remove(presenceFile);
    } catch {
      // File may not exist
    }

    console.log('[FileBasedSync] Stopped');
  }

  /**
   * Ensure sync directories exist
   */
  private async ensureSyncDirectories(): Promise<void> {
    try {
      const tauri = await getTauriApis();
      const join = tauri ? tauri.path.join : browserJoin;
      const mkdir = tauri ? tauri.fs.mkdir : browserMkdir;

      const syncPath = await join(this.vaultPath, SYNC_DIR);
      await mkdir(syncPath, { recursive: true });

      const presencePath = await join(syncPath, PRESENCE_DIR);
      await mkdir(presencePath, { recursive: true });

      const eventsPath = await join(syncPath, EVENTS_DIR);
      await mkdir(eventsPath, { recursive: true });
    } catch (err) {
      console.error('[FileBasedSync] Failed to create sync directories:', err);
    }
  }

  /**
   * Get path for our presence file
   */
  private async getPresenceFilePath(): Promise<string> {
    const tauri = await getTauriApis();
    const join = tauri ? tauri.path.join : browserJoin;
    const deviceId = this.eventLog.getDeviceId();
    return join(this.vaultPath, SYNC_DIR, PRESENCE_DIR, `${deviceId}.json`);
  }

  /**
   * Update our presence file
   */
  private async updatePresence(): Promise<void> {
    try {
      const tauri = await getTauriApis();
      const writeTextFile = tauri ? tauri.fs.writeTextFile : browserWriteTextFile;

      const presence: DevicePresence = {
        deviceId: this.eventLog.getDeviceId(),
        deviceName: this.config.deviceName,
        vaultId: this.eventLog.getVaultId(),
        vectorClock: this.eventLog.getVectorClock(),
        lastSeen: new Date().toISOString(),
        eventCount: this.eventLog.getEventCount(),
      };

      const presenceFile = await this.getPresenceFilePath();
      await writeTextFile(presenceFile, JSON.stringify(presence, null, 2));
    } catch (err) {
      console.error('[FileBasedSync] Failed to update presence:', err);
    }
  }

  /**
   * Get all device states
   */
  async getDeviceStates(): Promise<SyncDeviceState[]> {
    const states: SyncDeviceState[] = [];
    const now = Date.now();
    const myDeviceId = this.eventLog.getDeviceId();
    const myClock = this.eventLog.getVectorClock();

    const tauri = await getTauriApis();
    const join = tauri ? tauri.path.join : browserJoin;
    const readDir = tauri ? tauri.fs.readDir : browserReadDir;
    const readTextFile = tauri ? tauri.fs.readTextFile : browserReadTextFile;

    try {
      const presencePath = await join(this.vaultPath, SYNC_DIR, PRESENCE_DIR);
      const entries = await readDir(presencePath);

      for (const entry of entries) {
        if (!entry.name?.endsWith('.json')) continue;

        try {
          const filePath = await join(presencePath, entry.name);
          const content = await readTextFile(filePath);
          const presence: DevicePresence = JSON.parse(content);

          // Skip our own device
          if (presence.deviceId === myDeviceId) continue;

          const lastSeenTime = new Date(presence.lastSeen).getTime();
          const isOnline = now - lastSeenTime < this.config.staleThresholdMs;

          // Determine if sync is needed
          const clockComparison = compareClock(myClock, presence.vectorClock);
          const needsSync =
            clockComparison === 'before' || clockComparison === 'concurrent';

          states.push({
            deviceId: presence.deviceId,
            deviceName: presence.deviceName,
            isOnline,
            lastSeen: presence.lastSeen,
            vectorClock: presence.vectorClock,
            eventCount: presence.eventCount,
            needsSync,
          });
        } catch {
          // Skip invalid presence files
        }
      }
    } catch (err) {
      console.error('[FileBasedSync] Failed to get device states:', err);
    }

    return states;
  }

  /**
   * Check for and perform sync
   */
  private async checkForSync(): Promise<void> {
    try {
      const deviceStates = await this.getDeviceStates();
      this.onDeviceStateChanged?.(deviceStates);

      // Export our events for other devices
      await this.exportLocalEvents();

      // Import events from other devices
      await this.importRemoteEvents(deviceStates);
    } catch (err) {
      console.error('[FileBasedSync] Sync check failed:', err);
    }
  }

  /**
   * Export local events to sync folder
   */
  private async exportLocalEvents(): Promise<void> {
    const tauri = await getTauriApis();
    const join = tauri ? tauri.path.join : browserJoin;
    const writeTextFile = tauri ? tauri.fs.writeTextFile : browserWriteTextFile;

    const deviceId = this.eventLog.getDeviceId();
    const eventsPath = await join(
      this.vaultPath,
      SYNC_DIR,
      EVENTS_DIR,
      `${deviceId}.jsonl`
    );

    // Get all events and write to file
    const events = this.eventLog.getEvents();
    const content = events.map((e) => JSON.stringify(e)).join('\n');

    if (content) {
      await writeTextFile(eventsPath, content + '\n');
    }
  }

  /**
   * Import events from other devices
   */
  private async importRemoteEvents(deviceStates: SyncDeviceState[]): Promise<void> {
    const tauri = await getTauriApis();
    const join = tauri ? tauri.path.join : browserJoin;
    const readTextFile = tauri ? tauri.fs.readTextFile : browserReadTextFile;

    const eventsDir = await join(this.vaultPath, SYNC_DIR, EVENTS_DIR);

    for (const device of deviceStates) {
      if (!device.needsSync) continue;

      try {
        const eventsFile = await join(eventsDir, `${device.deviceId}.jsonl`);
        const content = await readTextFile(eventsFile);
        const lines = content.trim().split('\n').filter(Boolean);
        const events: SyncEvent[] = lines.map((line) => JSON.parse(line));

        // Merge events
        const newEvents = await this.eventLog.mergeRemoteEvents(events);

        // Notify about new events
        for (const event of newEvents) {
          this.onEventReceived?.(event);
        }

        if (newEvents.length > 0) {
          console.log(
            `[FileBasedSync] Imported ${newEvents.length} events from ${device.deviceName}`
          );
        }
      } catch {
        // Events file may not exist yet
      }
    }
  }

  /**
   * Force immediate sync
   */
  async forceSync(): Promise<{ imported: number; exported: number }> {
    const tauri = await getTauriApis();
    const join = tauri ? tauri.path.join : browserJoin;
    const readTextFile = tauri ? tauri.fs.readTextFile : browserReadTextFile;

    let imported = 0;
    const exported = this.eventLog.getEventCount();

    await this.updatePresence();
    await this.exportLocalEvents();

    const deviceStates = await this.getDeviceStates();

    for (const device of deviceStates) {
      if (!device.needsSync) continue;

      try {
        const eventsDir = await join(this.vaultPath, SYNC_DIR, EVENTS_DIR);
        const eventsFile = await join(eventsDir, `${device.deviceId}.jsonl`);
        const content = await readTextFile(eventsFile);
        const lines = content.trim().split('\n').filter(Boolean);
        const events: SyncEvent[] = lines.map((line) => JSON.parse(line));

        const newEvents = await this.eventLog.mergeRemoteEvents(events);
        imported += newEvents.length;

        for (const event of newEvents) {
          this.onEventReceived?.(event);
        }
      } catch {
        // Events file may not exist
      }
    }

    this.onDeviceStateChanged?.(deviceStates);

    return { imported, exported };
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    isRunning: boolean;
    deviceCount: number;
    onlineDevices: number;
    needsSync: boolean;
    lastSync: string | null;
  }> {
    const deviceStates = await this.getDeviceStates();
    const onlineDevices = deviceStates.filter((d) => d.isOnline).length;
    const needsSync = deviceStates.some((d) => d.needsSync);

    return {
      isRunning: this.isRunning,
      deviceCount: deviceStates.length,
      onlineDevices,
      needsSync,
      lastSync: null, // Could track this if needed
    };
  }
}
