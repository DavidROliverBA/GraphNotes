// src/components/sync/SyncStatusPanel.tsx

import { useState } from 'react';
import { usePeerSync } from '../../hooks/usePeerSync';
import { PeerInfo, PeerState } from '../../lib/sync/PeerManager';

/**
 * Get status indicator color based on peer state
 */
function getStateColor(state: PeerState): string {
  switch (state) {
    case 'connected':
      return 'bg-green-500';
    case 'syncing':
      return 'bg-yellow-500 animate-pulse';
    case 'synced':
      return 'bg-green-600';
    case 'connecting':
      return 'bg-blue-500 animate-pulse';
    case 'disconnected':
      return 'bg-gray-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

/**
 * Get human-readable state label
 */
function getStateLabel(state: PeerState): string {
  switch (state) {
    case 'connected':
      return 'Connected';
    case 'syncing':
      return 'Syncing...';
    case 'synced':
      return 'Synced';
    case 'connecting':
      return 'Connecting...';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string | null): string {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

/**
 * Peer card component
 */
function PeerCard({ peer, onDisconnect }: { peer: PeerInfo; onDisconnect: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${getStateColor(peer.state)}`} />
        <div>
          <div className="text-sm font-medium text-white">
            {peer.displayName || peer.id.slice(0, 8)}
          </div>
          <div className="text-xs text-gray-400">
            {getStateLabel(peer.state)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-gray-400">
          <span className="text-green-400">{peer.eventsReceived}</span>
          {' / '}
          <span className="text-blue-400">{peer.eventsSent}</span>
        </div>
        <button
          onClick={onDisconnect}
          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
          title="Disconnect"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Sync status panel component
 */
export function SyncStatusPanel() {
  const {
    isRunning,
    peers,
    stats,
    start,
    stop,
    connectToPeer,
    disconnectPeer,
  } = usePeerSync();

  const [peerAddress, setPeerAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!peerAddress.trim()) return;

    setIsConnecting(true);
    setError(null);

    try {
      const peerId = await connectToPeer(peerAddress);
      if (peerId) {
        setPeerAddress('');
      } else {
        setError('Failed to connect to peer');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Sync</h2>
        <button
          onClick={isRunning ? stop : start}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Peers</div>
            <div className="text-xl font-semibold">
              {stats.connectedPeers} / {stats.totalPeers}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Last Sync</div>
            <div className="text-sm">{formatTime(stats.lastSyncTime)}</div>
          </div>
          <div>
            <div className="text-gray-400">Events Received</div>
            <div className="text-green-400">{stats.eventsReceived}</div>
          </div>
          <div>
            <div className="text-gray-400">Events Sent</div>
            <div className="text-blue-400">{stats.eventsSent}</div>
          </div>
        </div>
        {stats.syncErrors > 0 && (
          <div className="mt-2 text-xs text-red-400">
            {stats.syncErrors} sync error{stats.syncErrors > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Connect to peer */}
      {isRunning && (
        <div className="p-4 border-b border-gray-700">
          <div className="text-sm text-gray-400 mb-2">Connect to Peer</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={peerAddress}
              onChange={(e) => setPeerAddress(e.target.value)}
              placeholder="ws://192.168.1.100:9000"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              disabled={isConnecting}
            />
            <button
              onClick={handleConnect}
              disabled={isConnecting || !peerAddress.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
            >
              {isConnecting ? '...' : 'Connect'}
            </button>
          </div>
          {error && (
            <div className="mt-2 text-xs text-red-400">{error}</div>
          )}
        </div>
      )}

      {/* Peer list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-sm text-gray-400 mb-2">Connected Peers</div>
        {peers.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            {isRunning ? 'No peers connected' : 'Start sync to connect to peers'}
          </div>
        ) : (
          <div className="space-y-2">
            {peers.map((peer) => (
              <PeerCard
                key={peer.id}
                peer={peer}
                onDisconnect={() => disconnectPeer(peer.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with sync legend */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="text-green-400">In</span> / <span className="text-blue-400">Out</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Synced</span>
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Syncing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact sync status indicator for the sidebar
 */
export function SyncStatusIndicator() {
  const { isRunning, stats } = usePeerSync();

  if (!isRunning) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
        <div className="w-2 h-2 rounded-full bg-gray-500" />
        <span>Sync off</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400">
      <div className={`w-2 h-2 rounded-full ${
        stats.connectedPeers > 0 ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
      }`} />
      <span>
        {stats.connectedPeers} peer{stats.connectedPeers !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

export default SyncStatusPanel;
