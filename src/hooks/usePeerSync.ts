import { useState, useCallback, useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useNoteStore } from '../stores/noteStore';
import { getEventLog, EventLog } from '../lib/sync/EventLog';
import { FileBasedSync, SyncDeviceState } from '../lib/sync/FileBasedSync';
import { SyncEvent } from '../lib/sync/events';

// Re-export SyncDeviceState for consumers
export type { SyncDeviceState };

export interface PeerSyncState {
  isInitialized: boolean;
  isSyncing: boolean;
  isEnabled: boolean;
  deviceName: string;
  deviceId: string;
  connectedDevices: SyncDeviceState[];
  lastSyncTime: string | null;
  pendingChanges: number;
  error: string | null;
}

const DEFAULT_STATE: PeerSyncState = {
  isInitialized: false,
  isSyncing: false,
  isEnabled: false,
  deviceName: 'This Device',
  deviceId: '',
  connectedDevices: [],
  lastSyncTime: null,
  pendingChanges: 0,
  error: null,
};

export function usePeerSync() {
  const { currentVault } = useSettingsStore();
  const { loadNotesFromVault } = useNoteStore();
  const [state, setState] = useState<PeerSyncState>(DEFAULT_STATE);

  const eventLogRef = useRef<EventLog | null>(null);
  const fileBasedSyncRef = useRef<FileBasedSync | null>(null);

  // Initialize sync when vault changes
  useEffect(() => {
    if (currentVault) {
      initializeSync(currentVault.path);
    } else {
      cleanupSync();
    }

    return () => {
      cleanupSync();
    };
  }, [currentVault]);

  const initializeSync = async (vaultPath: string) => {
    try {
      // Get event log instance
      const eventLog = await getEventLog(vaultPath);
      eventLogRef.current = eventLog;

      // Create file-based sync
      const fileSync = new FileBasedSync(eventLog, vaultPath, {
        deviceName: state.deviceName || 'This Device',
      });
      fileBasedSyncRef.current = fileSync;

      setState((prev) => ({
        ...prev,
        isInitialized: true,
        deviceId: eventLog.getDeviceId(),
        error: null,
      }));
    } catch (err) {
      console.error('[usePeerSync] Failed to initialize:', err);
      setState((prev) => ({
        ...prev,
        isInitialized: false,
        error: err instanceof Error ? err.message : 'Failed to initialize sync',
      }));
    }
  };

  const cleanupSync = async () => {
    if (fileBasedSyncRef.current) {
      await fileBasedSyncRef.current.stop();
      fileBasedSyncRef.current = null;
    }
    eventLogRef.current = null;
    setState(DEFAULT_STATE);
  };

  // Handle received events
  const handleEventReceived = useCallback(
    (event: SyncEvent) => {
      console.log('[usePeerSync] Received event:', event.type, event.id);

      // Refresh notes to reflect changes
      // In a more sophisticated implementation, we'd apply the event
      // directly to the state instead of reloading everything
      if (currentVault) {
        loadNotesFromVault(currentVault.path);
      }
    },
    [loadNotesFromVault, currentVault]
  );

  // Handle device state changes
  const handleDeviceStateChanged = useCallback((devices: SyncDeviceState[]) => {
    setState((prev) => ({
      ...prev,
      connectedDevices: devices,
    }));
  }, []);

  // Enable sync
  const enableSync = useCallback(async () => {
    if (!fileBasedSyncRef.current || state.isEnabled) return;

    try {
      await fileBasedSyncRef.current.start(
        handleEventReceived,
        handleDeviceStateChanged
      );
      setState((prev) => ({
        ...prev,
        isEnabled: true,
        error: null,
      }));
    } catch (err) {
      console.error('[usePeerSync] Failed to enable sync:', err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to enable sync',
      }));
    }
  }, [state.isEnabled, handleEventReceived, handleDeviceStateChanged]);

  // Disable sync
  const disableSync = useCallback(async () => {
    if (!fileBasedSyncRef.current || !state.isEnabled) return;

    try {
      await fileBasedSyncRef.current.stop();
      setState((prev) => ({
        ...prev,
        isEnabled: false,
        connectedDevices: [],
      }));
    } catch (err) {
      console.error('[usePeerSync] Failed to disable sync:', err);
    }
  }, [state.isEnabled]);

  // Force sync now
  const syncNow = useCallback(async () => {
    if (!fileBasedSyncRef.current || !state.isEnabled || state.isSyncing) return;

    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      const result = await fileBasedSyncRef.current.forceSync();
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date().toISOString(),
        error: null,
      }));

      if (result.imported > 0 && currentVault) {
        loadNotesFromVault(currentVault.path);
      }

      return result;
    } catch (err) {
      console.error('[usePeerSync] Sync failed:', err);
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Sync failed',
      }));
      return null;
    }
  }, [state.isEnabled, state.isSyncing, loadNotesFromVault, currentVault]);

  // Set device name
  const setDeviceName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, deviceName: name }));
    // Could persist this to settings store
  }, []);

  // Get sync status
  const getSyncStatus = useCallback(async () => {
    if (!fileBasedSyncRef.current) return null;
    return fileBasedSyncRef.current.getSyncStatus();
  }, []);

  // Get connected device count
  const getOnlineDeviceCount = useCallback(() => {
    return state.connectedDevices.filter((d) => d.isOnline).length;
  }, [state.connectedDevices]);

  // Check if any device needs sync
  const hasDevicesNeedingSync = useCallback(() => {
    return state.connectedDevices.some((d) => d.needsSync);
  }, [state.connectedDevices]);

  return {
    // State
    ...state,

    // Actions
    enableSync,
    disableSync,
    syncNow,
    setDeviceName,
    getSyncStatus,

    // Computed
    onlineDeviceCount: getOnlineDeviceCount(),
    hasDevicesNeedingSync: hasDevicesNeedingSync(),
  };
}
