import { SyncEvent, VectorClock, compareClock } from './events';
import { EventLog } from './EventLog';

// Peer connection states
export type PeerConnectionState = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';

// Peer information
export interface PeerInfo {
  id: string;
  deviceName: string;
  vaultId: string;
  lastSeen: string;
  vectorClock: VectorClock;
  connectionState: PeerConnectionState;
  address?: string;
  port?: number;
}

// Sync message types
export type SyncMessageType =
  | 'HELLO'
  | 'HELLO_ACK'
  | 'CLOCK_EXCHANGE'
  | 'EVENTS_REQUEST'
  | 'EVENTS_RESPONSE'
  | 'EVENT_BROADCAST'
  | 'GOODBYE';

// Base message structure
interface BaseSyncMessage {
  type: SyncMessageType;
  senderId: string;
  senderVaultId: string;
  timestamp: string;
}

// Hello message - initial handshake
export interface HelloMessage extends BaseSyncMessage {
  type: 'HELLO';
  payload: {
    deviceName: string;
    vectorClock: VectorClock;
  };
}

// Hello acknowledgment
export interface HelloAckMessage extends BaseSyncMessage {
  type: 'HELLO_ACK';
  payload: {
    deviceName: string;
    vectorClock: VectorClock;
    accepted: boolean;
    reason?: string;
  };
}

// Clock exchange for sync
export interface ClockExchangeMessage extends BaseSyncMessage {
  type: 'CLOCK_EXCHANGE';
  payload: {
    vectorClock: VectorClock;
  };
}

// Request events after a clock
export interface EventsRequestMessage extends BaseSyncMessage {
  type: 'EVENTS_REQUEST';
  payload: {
    afterClock: VectorClock;
  };
}

// Response with events
export interface EventsResponseMessage extends BaseSyncMessage {
  type: 'EVENTS_RESPONSE';
  payload: {
    events: SyncEvent[];
    complete: boolean;
  };
}

// Broadcast new event to peers
export interface EventBroadcastMessage extends BaseSyncMessage {
  type: 'EVENT_BROADCAST';
  payload: {
    event: SyncEvent;
  };
}

// Goodbye message on disconnect
export interface GoodbyeMessage extends BaseSyncMessage {
  type: 'GOODBYE';
  payload: Record<string, never>;
}

export type SyncMessage =
  | HelloMessage
  | HelloAckMessage
  | ClockExchangeMessage
  | EventsRequestMessage
  | EventsResponseMessage
  | EventBroadcastMessage
  | GoodbyeMessage;

// Sync event callbacks
export interface PeerManagerCallbacks {
  onPeerDiscovered?: (peer: PeerInfo) => void;
  onPeerConnected?: (peer: PeerInfo) => void;
  onPeerDisconnected?: (peerId: string) => void;
  onSyncStarted?: (peerId: string) => void;
  onSyncCompleted?: (peerId: string, eventsReceived: number) => void;
  onSyncError?: (peerId: string, error: string) => void;
  onEventReceived?: (event: SyncEvent) => void;
  onConflictDetected?: (event: SyncEvent, localEvent: SyncEvent) => void;
}

// Peer manager configuration
export interface PeerManagerConfig {
  deviceName: string;
  port: number;
  autoConnect: boolean;
  syncIntervalMs: number;
  heartbeatIntervalMs: number;
}

const DEFAULT_CONFIG: PeerManagerConfig = {
  deviceName: 'GraphNotes Device',
  port: 47632,
  autoConnect: true,
  syncIntervalMs: 30000, // 30 seconds
  heartbeatIntervalMs: 10000, // 10 seconds
};

export class PeerManager {
  private eventLog: EventLog;
  private config: PeerManagerConfig;
  private callbacks: PeerManagerCallbacks;
  private peers: Map<string, PeerInfo> = new Map();
  private isRunning = false;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    eventLog: EventLog,
    callbacks: PeerManagerCallbacks = {},
    config: Partial<PeerManagerConfig> = {}
  ) {
    this.eventLog = eventLog;
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the peer manager
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Start periodic sync
    if (this.config.syncIntervalMs > 0) {
      this.syncTimer = setInterval(() => {
        this.syncWithAllPeers();
      }, this.config.syncIntervalMs);
    }

    // Start heartbeat to check peer health
    if (this.config.heartbeatIntervalMs > 0) {
      this.heartbeatTimer = setInterval(() => {
        this.checkPeerHealth();
      }, this.config.heartbeatIntervalMs);
    }

    console.log('[PeerManager] Started');
  }

  /**
   * Stop the peer manager
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    // Clear timers
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Disconnect all peers
    for (const peer of this.peers.values()) {
      await this.disconnectPeer(peer.id);
    }

    console.log('[PeerManager] Stopped');
  }

  /**
   * Manually add a peer (for manual connection)
   */
  async addPeer(address: string, port: number): Promise<PeerInfo | null> {
    const tempPeer: PeerInfo = {
      id: `${address}:${port}`,
      deviceName: 'Unknown',
      vaultId: '',
      lastSeen: new Date().toISOString(),
      vectorClock: {},
      connectionState: 'connecting',
      address,
      port,
    };

    this.peers.set(tempPeer.id, tempPeer);
    this.callbacks.onPeerDiscovered?.(tempPeer);

    // In a real implementation, we'd establish a WebSocket connection here
    // For now, this is a placeholder for the connection logic
    console.log(`[PeerManager] Attempting to connect to ${address}:${port}`);

    return tempPeer;
  }

  /**
   * Disconnect from a peer
   */
  async disconnectPeer(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.connectionState = 'disconnected';
    this.peers.delete(peerId);
    this.callbacks.onPeerDisconnected?.(peerId);

    console.log(`[PeerManager] Disconnected from peer ${peerId}`);
  }

  /**
   * Get all known peers
   */
  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get connected peers
   */
  getConnectedPeers(): PeerInfo[] {
    return Array.from(this.peers.values()).filter(
      (p) => p.connectionState === 'connected' || p.connectionState === 'syncing'
    );
  }

  /**
   * Handle incoming sync message
   */
  async handleMessage(message: SyncMessage, fromPeerId: string): Promise<SyncMessage | null> {
    const peer = this.peers.get(fromPeerId);

    switch (message.type) {
      case 'HELLO':
        return this.handleHello(message, fromPeerId);

      case 'HELLO_ACK':
        return this.handleHelloAck(message, fromPeerId);

      case 'CLOCK_EXCHANGE':
        return this.handleClockExchange(message, fromPeerId);

      case 'EVENTS_REQUEST':
        return this.handleEventsRequest(message);

      case 'EVENTS_RESPONSE':
        await this.handleEventsResponse(message);
        return null;

      case 'EVENT_BROADCAST':
        await this.handleEventBroadcast(message);
        return null;

      case 'GOODBYE':
        if (peer) {
          peer.connectionState = 'disconnected';
          this.callbacks.onPeerDisconnected?.(fromPeerId);
        }
        return null;

      default:
        console.warn(`[PeerManager] Unknown message type: ${(message as BaseSyncMessage).type}`);
        return null;
    }
  }

  /**
   * Handle HELLO message
   */
  private handleHello(message: HelloMessage, fromPeerId: string): HelloAckMessage {
    const { deviceName, vectorClock } = message.payload;
    const myVaultId = this.eventLog.getVaultId();
    const theirVaultId = message.senderVaultId;

    // Check if same vault
    const accepted = myVaultId === theirVaultId;

    // Update or create peer info
    const peer: PeerInfo = {
      id: fromPeerId,
      deviceName,
      vaultId: theirVaultId,
      lastSeen: new Date().toISOString(),
      vectorClock,
      connectionState: accepted ? 'connected' : 'error',
    };

    this.peers.set(fromPeerId, peer);

    if (accepted) {
      this.callbacks.onPeerConnected?.(peer);
    }

    return {
      type: 'HELLO_ACK',
      senderId: this.eventLog.getDeviceId(),
      senderVaultId: myVaultId,
      timestamp: new Date().toISOString(),
      payload: {
        deviceName: this.config.deviceName,
        vectorClock: this.eventLog.getVectorClock(),
        accepted,
        reason: accepted ? undefined : 'Different vault',
      },
    };
  }

  /**
   * Handle HELLO_ACK message
   */
  private handleHelloAck(message: HelloAckMessage, fromPeerId: string): ClockExchangeMessage | null {
    const { deviceName, vectorClock, accepted, reason } = message.payload;

    const peer = this.peers.get(fromPeerId);
    if (!peer) return null;

    if (accepted) {
      peer.deviceName = deviceName;
      peer.vectorClock = vectorClock;
      peer.connectionState = 'connected';
      peer.lastSeen = new Date().toISOString();
      this.callbacks.onPeerConnected?.(peer);

      // Initiate sync by sending our clock
      return {
        type: 'CLOCK_EXCHANGE',
        senderId: this.eventLog.getDeviceId(),
        senderVaultId: this.eventLog.getVaultId(),
        timestamp: new Date().toISOString(),
        payload: {
          vectorClock: this.eventLog.getVectorClock(),
        },
      };
    } else {
      peer.connectionState = 'error';
      this.callbacks.onSyncError?.(fromPeerId, reason || 'Connection rejected');
      return null;
    }
  }

  /**
   * Handle CLOCK_EXCHANGE message
   */
  private handleClockExchange(
    message: ClockExchangeMessage,
    fromPeerId: string
  ): EventsRequestMessage | null {
    const peer = this.peers.get(fromPeerId);
    if (!peer) return null;

    peer.vectorClock = message.payload.vectorClock;
    peer.lastSeen = new Date().toISOString();

    // Compare clocks to determine if we need events
    const localClock = this.eventLog.getVectorClock();
    const comparison = compareClock(localClock, peer.vectorClock);

    if (comparison === 'before' || comparison === 'concurrent') {
      // We're behind or concurrent - request events
      peer.connectionState = 'syncing';
      this.callbacks.onSyncStarted?.(fromPeerId);

      return {
        type: 'EVENTS_REQUEST',
        senderId: this.eventLog.getDeviceId(),
        senderVaultId: this.eventLog.getVaultId(),
        timestamp: new Date().toISOString(),
        payload: {
          afterClock: localClock,
        },
      };
    }

    return null;
  }

  /**
   * Handle EVENTS_REQUEST message
   */
  private handleEventsRequest(message: EventsRequestMessage): EventsResponseMessage {
    const { afterClock } = message.payload;
    const events = this.eventLog.getEventsAfter(afterClock);

    return {
      type: 'EVENTS_RESPONSE',
      senderId: this.eventLog.getDeviceId(),
      senderVaultId: this.eventLog.getVaultId(),
      timestamp: new Date().toISOString(),
      payload: {
        events,
        complete: true,
      },
    };
  }

  /**
   * Handle EVENTS_RESPONSE message
   */
  private async handleEventsResponse(message: EventsResponseMessage): Promise<void> {
    const { events, complete } = message.payload;
    const peerId = message.senderId;

    if (events.length > 0) {
      // Merge remote events into our log
      const newEvents = await this.eventLog.mergeRemoteEvents(events);

      // Notify about each new event
      for (const event of newEvents) {
        this.callbacks.onEventReceived?.(event);
      }
    }

    if (complete) {
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.connectionState = 'connected';
        this.callbacks.onSyncCompleted?.(peerId, events.length);
      }
    }
  }

  /**
   * Handle EVENT_BROADCAST message (real-time event push)
   */
  private async handleEventBroadcast(message: EventBroadcastMessage): Promise<void> {
    const { event } = message.payload;

    // Merge single event
    const newEvents = await this.eventLog.mergeRemoteEvents([event]);

    if (newEvents.length > 0) {
      this.callbacks.onEventReceived?.(event);
    }
  }

  /**
   * Broadcast a new local event to all connected peers
   */
  async broadcastEvent(event: SyncEvent): Promise<void> {
    const connectedPeers = this.getConnectedPeers();
    for (const peer of connectedPeers) {
      // In a real implementation, this would send via WebSocket
      console.log(`[PeerManager] Broadcasting event ${event.id} to peer ${peer.id}`);
      // Would send: { type: 'EVENT_BROADCAST', payload: { event } }
    }
  }

  /**
   * Sync with all connected peers
   */
  private async syncWithAllPeers(): Promise<void> {
    const connectedPeers = this.getConnectedPeers();
    for (const peer of connectedPeers) {
      await this.syncWithPeer(peer.id);
    }
  }

  /**
   * Sync with a specific peer
   */
  async syncWithPeer(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer || peer.connectionState !== 'connected') return;

    peer.connectionState = 'syncing';
    this.callbacks.onSyncStarted?.(peerId);

    // In a real implementation, this would send a CLOCK_EXCHANGE message via WebSocket
    console.log(`[PeerManager] Initiating sync with peer ${peerId}`);
  }

  /**
   * Check health of connected peers
   */
  private checkPeerHealth(): void {
    const now = Date.now();
    const timeout = this.config.heartbeatIntervalMs * 3; // 3 missed heartbeats

    for (const peer of this.peers.values()) {
      const lastSeen = new Date(peer.lastSeen).getTime();
      if (now - lastSeen > timeout && peer.connectionState === 'connected') {
        peer.connectionState = 'disconnected';
        this.callbacks.onPeerDisconnected?.(peer.id);
        console.log(`[PeerManager] Peer ${peer.id} timed out`);
      }
    }
  }

  /**
   * Create a HELLO message for initiating connection
   */
  createHelloMessage(): HelloMessage {
    return {
      type: 'HELLO',
      senderId: this.eventLog.getDeviceId(),
      senderVaultId: this.eventLog.getVaultId(),
      timestamp: new Date().toISOString(),
      payload: {
        deviceName: this.config.deviceName,
        vectorClock: this.eventLog.getVectorClock(),
      },
    };
  }

  /**
   * Get sync statistics
   */
  getStats(): {
    totalPeers: number;
    connectedPeers: number;
    syncingPeers: number;
    localEventCount: number;
    localClock: VectorClock;
  } {
    const peers = this.getPeers();
    return {
      totalPeers: peers.length,
      connectedPeers: peers.filter((p) => p.connectionState === 'connected').length,
      syncingPeers: peers.filter((p) => p.connectionState === 'syncing').length,
      localEventCount: this.eventLog.getEventCount(),
      localClock: this.eventLog.getVectorClock(),
    };
  }
}
