import { useState, useCallback, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { EventLog, getEventLog } from '../lib/sync/EventLog';
import { SyncEngine, SyncStatus } from '../lib/sync/SyncEngine';
import {
  SyncEvent,
  VectorClock,
  NoteCreatedEvent,
  NoteUpdatedEvent,
  NoteDeletedEvent,
  LinkCreatedEvent,
  LinkUpdatedEvent,
  LinkDeletedEvent,
  SuperTagCreatedEvent,
  SuperTagUpdatedEvent,
  SuperTagDeletedEvent,
  SuperTagAssignedEvent,
  SuperTagUnassignedEvent,
  AttributeUpdatedEvent,
} from '../lib/sync/events';
import { LinkAppearance, AttributeValue } from '../lib/notes/types';
import { SuperTag } from '../lib/superTags/types';

export function useSync() {
  const { currentVault } = useSettingsStore();
  const [eventLog, setEventLog] = useState<EventLog | null>(null);
  const [syncEngine, setSyncEngine] = useState<SyncEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus] = useState<SyncStatus>({
    issyncing: false,
    lastSyncTime: null,
    pendingEvents: 0,
    conflicts: [],
  });

  // Initialize event log when vault changes
  useEffect(() => {
    if (currentVault) {
      initializeEventLog(currentVault.path);
    } else {
      setEventLog(null);
      setSyncEngine(null);
      setIsInitialized(false);
    }
  }, [currentVault]);

  const initializeEventLog = async (vaultPath: string) => {
    try {
      const log = await getEventLog(vaultPath);
      const engine = new SyncEngine(log);
      setEventLog(log);
      setSyncEngine(engine);
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize event log:', err);
    }
  };

  // Event emission functions
  const emitNoteCreated = useCallback(
    async (noteId: string, filepath: string, content: string) => {
      if (!eventLog) return;
      await eventLog.appendEvent<NoteCreatedEvent>('NOTE_CREATED', {
        noteId,
        filepath,
        content,
      });
    },
    [eventLog]
  );

  const emitNoteUpdated = useCallback(
    async (noteId: string, previousHash: string, newContent: string) => {
      if (!eventLog) return;
      await eventLog.appendEvent<NoteUpdatedEvent>('NOTE_UPDATED', {
        noteId,
        previousHash,
        newContent,
      });
    },
    [eventLog]
  );

  const emitNoteDeleted = useCallback(
    async (noteId: string, filepath: string) => {
      if (!eventLog) return;
      await eventLog.appendEvent<NoteDeletedEvent>('NOTE_DELETED', {
        noteId,
        filepath,
      });
    },
    [eventLog]
  );

  const emitLinkCreated = useCallback(
    async (
      linkId: string,
      sourceId: string,
      targetId: string,
      name: string,
      appearance: LinkAppearance,
      description?: string
    ) => {
      if (!eventLog) return;
      await eventLog.appendEvent<LinkCreatedEvent>('LINK_CREATED', {
        linkId,
        sourceId,
        targetId,
        name,
        description,
        appearance,
      });
    },
    [eventLog]
  );

  const emitLinkUpdated = useCallback(
    async (
      linkId: string,
      sourceId: string,
      changes: Partial<{ name: string; description: string; appearance: LinkAppearance }>
    ) => {
      if (!eventLog) return;
      await eventLog.appendEvent<LinkUpdatedEvent>('LINK_UPDATED', {
        linkId,
        sourceId,
        changes,
      });
    },
    [eventLog]
  );

  const emitLinkDeleted = useCallback(
    async (linkId: string, sourceId: string) => {
      if (!eventLog) return;
      await eventLog.appendEvent<LinkDeletedEvent>('LINK_DELETED', {
        linkId,
        sourceId,
      });
    },
    [eventLog]
  );

  const emitSuperTagCreated = useCallback(
    async (superTag: SuperTag) => {
      if (!eventLog) return;
      await eventLog.appendEvent<SuperTagCreatedEvent>('SUPERTAG_CREATED', {
        superTag,
      });
    },
    [eventLog]
  );

  const emitSuperTagUpdated = useCallback(
    async (superTagId: string, changes: Partial<SuperTag>) => {
      if (!eventLog) return;
      await eventLog.appendEvent<SuperTagUpdatedEvent>('SUPERTAG_UPDATED', {
        superTagId,
        changes,
      });
    },
    [eventLog]
  );

  const emitSuperTagDeleted = useCallback(
    async (superTagId: string) => {
      if (!eventLog) return;
      await eventLog.appendEvent<SuperTagDeletedEvent>('SUPERTAG_DELETED', {
        superTagId,
      });
    },
    [eventLog]
  );

  const emitSuperTagAssigned = useCallback(
    async (noteId: string, superTagId: string) => {
      if (!eventLog) return;
      await eventLog.appendEvent<SuperTagAssignedEvent>('SUPERTAG_ASSIGNED', {
        noteId,
        superTagId,
      });
    },
    [eventLog]
  );

  const emitSuperTagUnassigned = useCallback(
    async (noteId: string, superTagId: string) => {
      if (!eventLog) return;
      await eventLog.appendEvent<SuperTagUnassignedEvent>('SUPERTAG_UNASSIGNED', {
        noteId,
        superTagId,
      });
    },
    [eventLog]
  );

  const emitAttributeUpdated = useCallback(
    async (noteId: string, superTagId: string, attributeKey: string, value: AttributeValue) => {
      if (!eventLog) return;
      await eventLog.appendEvent<AttributeUpdatedEvent>('ATTRIBUTE_UPDATED', {
        noteId,
        superTagId,
        attributeKey,
        value,
      });
    },
    [eventLog]
  );

  // Query functions
  const getEvents = useCallback((): SyncEvent[] => {
    return eventLog?.getEvents() || [];
  }, [eventLog]);

  const getEventCount = useCallback((): number => {
    return eventLog?.getEventCount() || 0;
  }, [eventLog]);

  const getVectorClock = useCallback((): VectorClock => {
    return eventLog?.getVectorClock() || {};
  }, [eventLog]);

  const getDeviceId = useCallback((): string => {
    return eventLog?.getDeviceId() || '';
  }, [eventLog]);

  const getVaultId = useCallback((): string => {
    return eventLog?.getVaultId() || '';
  }, [eventLog]);

  return {
    // State
    isInitialized,
    syncStatus,
    eventLog,
    syncEngine,

    // Event emitters
    emitNoteCreated,
    emitNoteUpdated,
    emitNoteDeleted,
    emitLinkCreated,
    emitLinkUpdated,
    emitLinkDeleted,
    emitSuperTagCreated,
    emitSuperTagUpdated,
    emitSuperTagDeleted,
    emitSuperTagAssigned,
    emitSuperTagUnassigned,
    emitAttributeUpdated,

    // Query functions
    getEvents,
    getEventCount,
    getVectorClock,
    getDeviceId,
    getVaultId,
  };
}
