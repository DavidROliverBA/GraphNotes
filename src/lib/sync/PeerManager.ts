// src/lib/sync/PeerManager.ts

import { v4 as uuidv4 } from 'uuid';
import { EventLog, getEventLog } from './EventLog';
import { SyncEngine } from './SyncEngine';
import { SyncEvent, VectorClock } from './events';
import { Note } from '../notes/types';

/**
 * Peer connection state
 */
export type PeerState = 'connecting' | 'connected' | 'syncing' | 'synced' | 'disconnected' | 'error';

/**
 * Peer information
 */
export interface PeerInfo {
  id: string;
  displayName?: string;
  state: PeerState;
  vectorClock: VectorClock;
  lastSeen: string;
  eventsReceived: number;
  eventsSent: number;
}

/**
 * Sync message types for P2P protocol
 */
export type SyncMessageType =
  | 'HELLO'           // Initial handshake with device ID and clock
  | 'CLOCK_EXCHANGE'  // Exchange vector clocks to determine what to sync
  | 'REQUEST_EVENTS'  // Request events after a specific clock
  | 'EVENTS'          // Batch of events
  | 'ACK'             // Acknowledgment
  | 'GOODBYE';        // Graceful disconnect

/**
 * Sync message structure
 */
export interface SyncMessage {
  type: SyncMessageType;
  senderId: string;
  timestamp: string;
  payload: unknown;
}

/**
 * Hello message payload
 */
export interface HelloPayload {
  deviceId: string;
  displayName?: string;
  vectorClock: VectorClock;
  protocolVersion: string;
}

/**
 * Clock exchange payload
 */
export interface ClockExchangePayload {
  vectorClock: VectorClock;
}

/**
 * Request events payload
 */
export interface RequestEventsPayload {
  afterClock: VectorClock;
  limit?: number;
}

/**
 * Events payload
 */
export interface EventsPayload {
  events: SyncEvent[];
  hasMore: boolean;
}

/**
 * Sync statistics
 */
export interface SyncStats {
  totalPeers: number;
  connectedPeers: number;
  eventsReceived: number;
  eventsSent: number;
  lastSyncTime: string | null;
  syncErrors: number;
}

/**
 * PeerManager - Manages P2P connections and sync protocol
 *
 * This is an abstract base that can be extended for different
 * transport layers (WebSocket, WebRTC, Hyperswarm, etc.)
 */
export abstract class PeerManager {
  protected vaultPath: string;
  protected eventLog: EventLog;
  protected syncEngine: SyncEngine;
  protected notes: Map<string, Note>;
  protected peers: Map<string, PeerInfo> = new Map();
  protected stats: SyncStats;
  protected isRunning = false;
  protected protocolVersion = '1.0.0';

  // Event callbacks
  protected onPeerConnected?: (peer: PeerInfo) => void;
  protected onPeerDisconnected?: (peerId: string) => void;
  protected onSyncStarted?: (peerId: string) => void;
  protected onSyncCompleted?: (peerId: string, eventsReceived: number) => void;
  protected onSyncError?: (peerId: string, error: string) => void;
  protected onEventsReceived?: (events: SyncEvent[]) => void;

  constructor(vaultPath: string, notes: Map<string, Note>) {
    this.vaultPath = vaultPath;
    this.notes = notes;
    this.eventLog = getEventLog(vaultPath);
    this.syncEngine = new SyncEngine(vaultPath, notes);
    this.stats = {
      totalPeers: 0,
      connectedPeers: 0,
      eventsReceived: 0,
      eventsSent: 0,
      lastSyncTime: null,
      syncErrors: 0,
    };
  }

  /**
   * Start the peer manager and begin accepting connections
   */
  abstract start(): Promise<void>;

  /**
   * Stop the peer manager and disconnect all peers
   */
  abstract stop(): Promise<void>;

  /**
   * Connect to a specific peer
   */
  abstract connectToPeer(address: string): Promise<string>;

  /**
   * Disconnect from a specific peer
   */
  abstract disconnectPeer(peerId: string): Promise<void>;

  /**
   * Send a message to a specific peer
   */
  protected abstract sendMessage(peerId: string, message: SyncMessage): Promise<void>;

  /**
   * Get the current stats
   */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Get all connected peers
   */
  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get a specific peer
   */
  getPeer(peerId: string): PeerInfo | undefined {
    return this.peers.get(peerId);
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: {
    onPeerConnected?: (peer: PeerInfo) => void;
    onPeerDisconnected?: (peerId: string) => void;
    onSyncStarted?: (peerId: string) => void;
    onSyncCompleted?: (peerId: string, eventsReceived: number) => void;
    onSyncError?: (peerId: string, error: string) => void;
    onEventsReceived?: (events: SyncEvent[]) => void;
  }): void {
    this.onPeerConnected = callbacks.onPeerConnected;
    this.onPeerDisconnected = callbacks.onPeerDisconnected;
    this.onSyncStarted = callbacks.onSyncStarted;
    this.onSyncCompleted = callbacks.onSyncCompleted;
    this.onSyncError = callbacks.onSyncError;
    this.onEventsReceived = callbacks.onEventsReceived;
  }

  /**
   * Handle incoming message from a peer
   */
  protected async handleMessage(peerId: string, message: SyncMessage): Promise<void> {
    console.log(`[PeerManager] Received ${message.type} from ${peerId}`);

    switch (message.type) {
      case 'HELLO':
        await this.handleHello(peerId, message.payload as HelloPayload);
        break;
      case 'CLOCK_EXCHANGE':
        await this.handleClockExchange(peerId, message.payload as ClockExchangePayload);
        break;
      case 'REQUEST_EVENTS':
        await this.handleRequestEvents(peerId, message.payload as RequestEventsPayload);
        break;
      case 'EVENTS':
        await this.handleEvents(peerId, message.payload as EventsPayload);
        break;
      case 'ACK':
        // Acknowledgment received, nothing to do
        break;
      case 'GOODBYE':
        await this.handleGoodbye(peerId);
        break;
      default:
        console.warn(`[PeerManager] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle HELLO message (initial handshake)
   */
  protected async handleHello(peerId: string, payload: HelloPayload): Promise<void> {
    // Update or create peer info
    const existingPeer = this.peers.get(peerId);
    const peer: PeerInfo = {
      id: peerId,
      displayName: payload.displayName,
      state: 'connected',
      vectorClock: payload.vectorClock,
      lastSeen: new Date().toISOString(),
      eventsReceived: existingPeer?.eventsReceived || 0,
      eventsSent: existingPeer?.eventsSent || 0,
    };
    this.peers.set(peerId, peer);
    this.updateStats();

    // Send our HELLO back if this is a new connection
    if (!existingPeer) {
      await this.sendHello(peerId);
    }

    // Trigger sync
    this.onPeerConnected?.(peer);
    await this.initiateSync(peerId);
  }

  /**
   * Handle CLOCK_EXCHANGE message
   */
  protected async handleClockExchange(peerId: string, payload: ClockExchangePayload): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.vectorClock = payload.vectorClock;
    peer.lastSeen = new Date().toISOString();

    // Determine what events the peer needs from us
    const ourClock = this.eventLog.getVectorClock();
    const eventsToSend = this.eventLog.getEvents(payload.vectorClock);

    if (eventsToSend.length > 0) {
      await this.sendEvents(peerId, eventsToSend);
    }

    // Request events we need from the peer
    const theirEventsWeNeed = this.determineNeededEvents(ourClock, payload.vectorClock);
    if (theirEventsWeNeed) {
      await this.requestEvents(peerId, ourClock);
    }
  }

  /**
   * Handle REQUEST_EVENTS message
   */
  protected async handleRequestEvents(peerId: string, payload: RequestEventsPayload): Promise<void> {
    const events = this.eventLog.getEvents(payload.afterClock);
    const limit = payload.limit || 100;

    const batch = events.slice(0, limit);
    const hasMore = events.length > limit;

    await this.sendEvents(peerId, batch, hasMore);
  }

  /**
   * Handle EVENTS message
   */
  protected async handleEvents(peerId: string, payload: EventsPayload): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.state = 'syncing';
    this.onSyncStarted?.(peerId);

    try {
      // Apply events through the sync engine
      const result = await this.syncEngine.applyEvents(payload.events);

      // Update local event log with remote events
      await this.eventLog.applyRemoteEvents(payload.events);

      // Update stats
      peer.eventsReceived += payload.events.length;
      this.stats.eventsReceived += payload.events.length;
      this.stats.lastSyncTime = new Date().toISOString();

      // Send acknowledgment
      await this.sendAck(peerId);

      // Request more if available
      if (payload.hasMore) {
        await this.requestEvents(peerId, this.eventLog.getVectorClock());
      } else {
        peer.state = 'synced';
        this.onSyncCompleted?.(peerId, payload.events.length);
      }

      // Notify about received events
      if (payload.events.length > 0) {
        this.onEventsReceived?.(payload.events);
      }

      // Log any conflicts
      if (result.conflicts.length > 0) {
        console.warn(`[PeerManager] ${result.conflicts.length} conflicts detected during sync`);
      }
    } catch (error) {
      peer.state = 'error';
      this.stats.syncErrors++;
      this.onSyncError?.(peerId, String(error));
    }
  }

  /**
   * Handle GOODBYE message
   */
  protected async handleGoodbye(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.state = 'disconnected';
    }
    this.peers.delete(peerId);
    this.updateStats();
    this.onPeerDisconnected?.(peerId);
  }

  /**
   * Send HELLO message
   */
  protected async sendHello(peerId: string): Promise<void> {
    const payload: HelloPayload = {
      deviceId: this.eventLog.getDeviceId(),
      vectorClock: this.eventLog.getVectorClock(),
      protocolVersion: this.protocolVersion,
    };

    await this.sendMessage(peerId, {
      type: 'HELLO',
      senderId: this.eventLog.getDeviceId(),
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  /**
   * Initiate sync with a peer
   */
  protected async initiateSync(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.state = 'syncing';
    this.onSyncStarted?.(peerId);

    // Send our clock for comparison
    const payload: ClockExchangePayload = {
      vectorClock: this.eventLog.getVectorClock(),
    };

    await this.sendMessage(peerId, {
      type: 'CLOCK_EXCHANGE',
      senderId: this.eventLog.getDeviceId(),
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  /**
   * Request events from a peer
   */
  protected async requestEvents(peerId: string, afterClock: VectorClock): Promise<void> {
    const payload: RequestEventsPayload = {
      afterClock,
      limit: 100,
    };

    await this.sendMessage(peerId, {
      type: 'REQUEST_EVENTS',
      senderId: this.eventLog.getDeviceId(),
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  /**
   * Send events to a peer
   */
  protected async sendEvents(peerId: string, events: SyncEvent[], hasMore = false): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.eventsSent += events.length;
      this.stats.eventsSent += events.length;
    }

    const payload: EventsPayload = {
      events,
      hasMore,
    };

    await this.sendMessage(peerId, {
      type: 'EVENTS',
      senderId: this.eventLog.getDeviceId(),
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  /**
   * Send acknowledgment to a peer
   */
  protected async sendAck(peerId: string): Promise<void> {
    await this.sendMessage(peerId, {
      type: 'ACK',
      senderId: this.eventLog.getDeviceId(),
      timestamp: new Date().toISOString(),
      payload: {},
    });
  }

  /**
   * Send goodbye message to a peer
   */
  protected async sendGoodbye(peerId: string): Promise<void> {
    await this.sendMessage(peerId, {
      type: 'GOODBYE',
      senderId: this.eventLog.getDeviceId(),
      timestamp: new Date().toISOString(),
      payload: {},
    });
  }

  /**
   * Determine if we need events from a peer based on clock comparison
   */
  protected determineNeededEvents(ourClock: VectorClock, theirClock: VectorClock): boolean {
    for (const [deviceId, count] of Object.entries(theirClock)) {
      if ((count || 0) > (ourClock[deviceId] || 0)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Update stats based on current peer state
   */
  protected updateStats(): void {
    this.stats.totalPeers = this.peers.size;
    this.stats.connectedPeers = Array.from(this.peers.values())
      .filter(p => p.state === 'connected' || p.state === 'syncing' || p.state === 'synced')
      .length;
  }

  /**
   * Update the notes map (called when notes change externally)
   */
  updateNotes(notes: Map<string, Note>): void {
    this.notes = notes;
    this.syncEngine = new SyncEngine(this.vaultPath, notes);
  }
}

/**
 * Local network peer manager using WebSocket signaling
 * This is a simplified implementation for local network sync
 */
export class LocalPeerManager extends PeerManager {
  private connections: Map<string, WebSocket> = new Map();
  private server: WebSocket | null = null;

  async start(): Promise<void> {
    if (this.isRunning) return;

    // Initialize the event log
    await this.eventLog.init();

    this.isRunning = true;
    console.log('[LocalPeerManager] Started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    // Send goodbye to all peers
    for (const peerId of this.connections.keys()) {
      try {
        await this.sendGoodbye(peerId);
      } catch {
        // Ignore errors during shutdown
      }
    }

    // Close all connections
    for (const ws of this.connections.values()) {
      ws.close();
    }
    this.connections.clear();
    this.peers.clear();

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    this.isRunning = false;
    console.log('[LocalPeerManager] Stopped');
  }

  async connectToPeer(address: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(address);
        const tempId = uuidv4();

        ws.onopen = async () => {
          console.log(`[LocalPeerManager] Connected to ${address}`);
          this.connections.set(tempId, ws);

          // Send hello
          await this.sendHello(tempId);
          resolve(tempId);
        };

        ws.onmessage = async (event) => {
          try {
            const message: SyncMessage = JSON.parse(event.data);

            // Update peer ID if we receive their device ID
            if (message.type === 'HELLO') {
              const payload = message.payload as HelloPayload;
              if (payload.deviceId !== tempId) {
                // Remap connection to actual device ID
                this.connections.delete(tempId);
                this.connections.set(payload.deviceId, ws);
              }
            }

            await this.handleMessage(message.senderId, message);
          } catch (error) {
            console.error('[LocalPeerManager] Error handling message:', error);
          }
        };

        ws.onclose = () => {
          console.log(`[LocalPeerManager] Disconnected from ${address}`);
          this.connections.delete(tempId);
          this.handleGoodbye(tempId);
        };

        ws.onerror = (error) => {
          console.error(`[LocalPeerManager] Connection error:`, error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnectPeer(peerId: string): Promise<void> {
    const ws = this.connections.get(peerId);
    if (ws) {
      await this.sendGoodbye(peerId);
      ws.close();
      this.connections.delete(peerId);
      this.peers.delete(peerId);
      this.updateStats();
    }
  }

  protected async sendMessage(peerId: string, message: SyncMessage): Promise<void> {
    const ws = this.connections.get(peerId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error(`No connection to peer ${peerId}`);
    }

    ws.send(JSON.stringify(message));
  }

  /**
   * Handle an incoming WebSocket connection
   */
  handleIncomingConnection(ws: WebSocket): void {
    const tempId = uuidv4();
    this.connections.set(tempId, ws);

    ws.onmessage = async (event) => {
      try {
        const message: SyncMessage = JSON.parse(event.data);

        // Update peer ID mapping
        if (message.type === 'HELLO') {
          const payload = message.payload as HelloPayload;
          if (payload.deviceId !== tempId) {
            this.connections.delete(tempId);
            this.connections.set(payload.deviceId, ws);
          }
        }

        await this.handleMessage(message.senderId, message);
      } catch (error) {
        console.error('[LocalPeerManager] Error handling message:', error);
      }
    };

    ws.onclose = () => {
      this.connections.delete(tempId);
      this.handleGoodbye(tempId);
    };
  }
}

export default PeerManager;
