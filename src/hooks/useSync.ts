// src/hooks/useSync.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '../stores/uiStore';
import { getEventLog, EventLog } from '../lib/sync/EventLog';
import { SyncEvent, VectorClock } from '../lib/sync/events';

interface UseSyncReturn {
  isInitialized: boolean;
  deviceId: string | null;
  vectorClock: VectorClock;
  eventCount: number;
  logNoteCreated: (noteId: string, filepath: string, content: string) => Promise<void>;
  logNoteUpdated: (noteId: string, previousHash: string, newContent: string) => Promise<void>;
  logNoteDeleted: (noteId: string, filepath: string) => Promise<void>;
  logNoteRenamed: (noteId: string, oldFilepath: string, newFilepath: string) => Promise<void>;
  logLinkCreated: (sourceId: string, targetId: string, name: string, description?: string) => Promise<void>;
  logLinkUpdated: (sourceId: string, targetId: string, name: string, description?: string) => Promise<void>;
  logLinkDeleted: (sourceId: string, targetId: string) => Promise<void>;
  getEvents: (afterClock?: VectorClock) => SyncEvent[];
}

/**
 * Hook for managing the event log and sync state
 */
export function useSync(): UseSyncReturn {
  const { vaultPath } = useUIStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [vectorClock, setVectorClock] = useState<VectorClock>({});
  const [eventCount, setEventCount] = useState(0);
  const eventLogRef = useRef<EventLog | null>(null);

  // Initialize event log when vault changes
  useEffect(() => {
    if (!vaultPath) {
      setIsInitialized(false);
      setDeviceId(null);
      setVectorClock({});
      setEventCount(0);
      eventLogRef.current = null;
      return;
    }

    const initEventLog = async () => {
      try {
        const eventLog = getEventLog(vaultPath);
        await eventLog.init();

        eventLogRef.current = eventLog;
        setDeviceId(eventLog.getDeviceId());
        setVectorClock(eventLog.getVectorClock());
        setEventCount(eventLog.getEvents().length);
        setIsInitialized(true);

        console.log('[useSync] Event log initialized');
      } catch (error) {
        console.error('[useSync] Failed to initialize event log:', error);
        setIsInitialized(false);
      }
    };

    initEventLog();
  }, [vaultPath]);

  // Update state after logging an event
  const updateState = useCallback(() => {
    if (eventLogRef.current) {
      setVectorClock(eventLogRef.current.getVectorClock());
      setEventCount(eventLogRef.current.getEvents().length);
    }
  }, []);

  const logNoteCreated = useCallback(async (noteId: string, filepath: string, content: string) => {
    if (!eventLogRef.current) {
      console.warn('[useSync] Event log not initialized');
      return;
    }
    await eventLogRef.current.logNoteCreated(noteId, filepath, content);
    updateState();
  }, [updateState]);

  const logNoteUpdated = useCallback(async (noteId: string, previousHash: string, newContent: string) => {
    if (!eventLogRef.current) {
      console.warn('[useSync] Event log not initialized');
      return;
    }
    await eventLogRef.current.logNoteUpdated(noteId, previousHash, newContent);
    updateState();
  }, [updateState]);

  const logNoteDeleted = useCallback(async (noteId: string, filepath: string) => {
    if (!eventLogRef.current) {
      console.warn('[useSync] Event log not initialized');
      return;
    }
    await eventLogRef.current.logNoteDeleted(noteId, filepath);
    updateState();
  }, [updateState]);

  const logNoteRenamed = useCallback(async (noteId: string, oldFilepath: string, newFilepath: string) => {
    if (!eventLogRef.current) {
      console.warn('[useSync] Event log not initialized');
      return;
    }
    await eventLogRef.current.logNoteRenamed(noteId, oldFilepath, newFilepath);
    updateState();
  }, [updateState]);

  const logLinkCreated = useCallback(async (sourceId: string, targetId: string, name: string, description?: string) => {
    if (!eventLogRef.current) {
      console.warn('[useSync] Event log not initialized');
      return;
    }
    await eventLogRef.current.logLinkCreated(sourceId, targetId, name, description);
    updateState();
  }, [updateState]);

  const logLinkUpdated = useCallback(async (sourceId: string, targetId: string, name: string, description?: string) => {
    if (!eventLogRef.current) {
      console.warn('[useSync] Event log not initialized');
      return;
    }
    await eventLogRef.current.logLinkUpdated(sourceId, targetId, name, description);
    updateState();
  }, [updateState]);

  const logLinkDeleted = useCallback(async (sourceId: string, targetId: string) => {
    if (!eventLogRef.current) {
      console.warn('[useSync] Event log not initialized');
      return;
    }
    await eventLogRef.current.logLinkDeleted(sourceId, targetId);
    updateState();
  }, [updateState]);

  const getEvents = useCallback((afterClock?: VectorClock): SyncEvent[] => {
    if (!eventLogRef.current) {
      return [];
    }
    return eventLogRef.current.getEvents(afterClock);
  }, []);

  return {
    isInitialized,
    deviceId,
    vectorClock,
    eventCount,
    logNoteCreated,
    logNoteUpdated,
    logNoteDeleted,
    logNoteRenamed,
    logLinkCreated,
    logLinkUpdated,
    logLinkDeleted,
    getEvents,
  };
}

export default useSync;
