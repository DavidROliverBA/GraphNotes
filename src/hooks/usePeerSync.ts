// src/hooks/usePeerSync.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useNoteStore } from '../stores/noteStore';
import { LocalPeerManager, PeerInfo, SyncStats } from '../lib/sync/PeerManager';
import { SyncEvent } from '../lib/sync/events';

interface UsePeerSyncReturn {
  isRunning: boolean;
  peers: PeerInfo[];
  stats: SyncStats;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  connectToPeer: (address: string) => Promise<string | null>;
  disconnectPeer: (peerId: string) => Promise<void>;
  lastSyncEvents: SyncEvent[];
}

/**
 * Hook for managing P2P sync with other devices
 */
export function usePeerSync(): UsePeerSyncReturn {
  const { vaultPath } = useUIStore();
  const { notes, setNotes } = useNoteStore();
  const [isRunning, setIsRunning] = useState(false);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [stats, setStats] = useState<SyncStats>({
    totalPeers: 0,
    connectedPeers: 0,
    eventsReceived: 0,
    eventsSent: 0,
    lastSyncTime: null,
    syncErrors: 0,
  });
  const [lastSyncEvents, setLastSyncEvents] = useState<SyncEvent[]>([]);

  const peerManagerRef = useRef<LocalPeerManager | null>(null);

  // Initialize peer manager when vault changes
  useEffect(() => {
    if (!vaultPath) {
      peerManagerRef.current = null;
      setIsRunning(false);
      setPeers([]);
      return;
    }

    const manager = new LocalPeerManager(vaultPath, notes);

    // Set up callbacks
    manager.setCallbacks({
      onPeerConnected: (peer) => {
        console.log('[usePeerSync] Peer connected:', peer.id);
        setPeers(manager.getPeers());
        setStats(manager.getStats());
      },
      onPeerDisconnected: (peerId) => {
        console.log('[usePeerSync] Peer disconnected:', peerId);
        setPeers(manager.getPeers());
        setStats(manager.getStats());
      },
      onSyncStarted: (peerId) => {
        console.log('[usePeerSync] Sync started with:', peerId);
        setPeers(manager.getPeers());
      },
      onSyncCompleted: (peerId, eventsReceived) => {
        console.log('[usePeerSync] Sync completed with:', peerId, 'events:', eventsReceived);
        setPeers(manager.getPeers());
        setStats(manager.getStats());
      },
      onSyncError: (peerId, error) => {
        console.error('[usePeerSync] Sync error with:', peerId, error);
        setPeers(manager.getPeers());
        setStats(manager.getStats());
      },
      onEventsReceived: (events) => {
        console.log('[usePeerSync] Events received:', events.length);
        setLastSyncEvents(events);
        // Update notes from sync engine
        setNotes(manager['syncEngine'].getNotes());
      },
    });

    peerManagerRef.current = manager;

    return () => {
      if (peerManagerRef.current?.['isRunning']) {
        peerManagerRef.current.stop();
      }
    };
  }, [vaultPath, notes, setNotes]);

  // Update peer manager when notes change
  useEffect(() => {
    if (peerManagerRef.current) {
      peerManagerRef.current.updateNotes(notes);
    }
  }, [notes]);

  const start = useCallback(async () => {
    if (!peerManagerRef.current) {
      console.warn('[usePeerSync] No peer manager available');
      return;
    }

    try {
      await peerManagerRef.current.start();
      setIsRunning(true);
      console.log('[usePeerSync] Peer sync started');
    } catch (error) {
      console.error('[usePeerSync] Failed to start:', error);
    }
  }, []);

  const stop = useCallback(async () => {
    if (!peerManagerRef.current) return;

    try {
      await peerManagerRef.current.stop();
      setIsRunning(false);
      setPeers([]);
      console.log('[usePeerSync] Peer sync stopped');
    } catch (error) {
      console.error('[usePeerSync] Failed to stop:', error);
    }
  }, []);

  const connectToPeer = useCallback(async (address: string): Promise<string | null> => {
    if (!peerManagerRef.current) {
      console.warn('[usePeerSync] No peer manager available');
      return null;
    }

    try {
      const peerId = await peerManagerRef.current.connectToPeer(address);
      setPeers(peerManagerRef.current.getPeers());
      setStats(peerManagerRef.current.getStats());
      return peerId;
    } catch (error) {
      console.error('[usePeerSync] Failed to connect:', error);
      return null;
    }
  }, []);

  const disconnectPeer = useCallback(async (peerId: string) => {
    if (!peerManagerRef.current) return;

    try {
      await peerManagerRef.current.disconnectPeer(peerId);
      setPeers(peerManagerRef.current.getPeers());
      setStats(peerManagerRef.current.getStats());
    } catch (error) {
      console.error('[usePeerSync] Failed to disconnect:', error);
    }
  }, []);

  return {
    isRunning,
    peers,
    stats,
    start,
    stop,
    connectToPeer,
    disconnectPeer,
    lastSyncEvents,
  };
}

export default usePeerSync;
