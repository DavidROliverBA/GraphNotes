import { useState } from 'react';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import { usePeerSync } from '../../hooks/usePeerSync';
import { SyncDeviceState } from '../../lib/sync/FileBasedSync';

interface SyncStatusPanelProps {
  className?: string;
  compact?: boolean;
}

export function SyncStatusPanel({ className = '', compact = false }: SyncStatusPanelProps) {
  const {
    isInitialized,
    isEnabled,
    isSyncing,
    deviceName,
    deviceId,
    connectedDevices,
    lastSyncTime,
    error,
    onlineDeviceCount,
    hasDevicesNeedingSync,
    enableSync,
    disableSync,
    syncNow,
    setDeviceName,
  } = usePeerSync();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempDeviceName, setTempDeviceName] = useState(deviceName);

  if (!isInitialized) {
    return (
      <div className={`p-3 text-sm text-text-tertiary ${className}`}>
        <div className="flex items-center gap-2">
          <CloudOff className="w-4 h-4" />
          <span>Sync not available</span>
        </div>
      </div>
    );
  }

  // Compact view for sidebar
  if (compact) {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full p-2 flex items-center gap-2 text-sm rounded-lg transition-colors
          ${isEnabled ? 'text-text-primary hover:bg-bg-tertiary' : 'text-text-tertiary hover:bg-bg-tertiary'}
          ${className}
        `}
      >
        {isEnabled ? (
          <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
        ) : (
          <CloudOff className="w-4 h-4" />
        )}
        <span className="flex-1 text-left">
          {isEnabled
            ? isSyncing
              ? 'Syncing...'
              : `${onlineDeviceCount} device${onlineDeviceCount !== 1 ? 's' : ''}`
            : 'Sync disabled'}
        </span>
        {hasDevicesNeedingSync && (
          <span className="w-2 h-2 rounded-full bg-accent-warning" />
        )}
      </button>
    );
  }

  const handleSaveDeviceName = () => {
    setDeviceName(tempDeviceName);
    setIsEditingName(false);
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`bg-bg-secondary border border-border-subtle rounded-lg ${className}`}>
      {/* Header */}
      <div
        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-bg-tertiary rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${isEnabled ? 'bg-accent-success/20 text-accent-success' : 'bg-bg-tertiary text-text-tertiary'}
          `}
        >
          {isEnabled ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">
              {isEnabled ? 'Sync Enabled' : 'Sync Disabled'}
            </span>
            {isSyncing && (
              <RefreshCw className="w-3 h-3 text-accent-primary animate-spin" />
            )}
          </div>
          <div className="text-xs text-text-tertiary">
            {isEnabled
              ? `${onlineDeviceCount} device${onlineDeviceCount !== 1 ? 's' : ''} online`
              : 'Click to expand'}
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-text-tertiary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-tertiary" />
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border-subtle">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-accent-error/10 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-accent-error text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* This device */}
          <div className="p-3 border-b border-border-subtle">
            <div className="text-xs text-text-tertiary mb-2">THIS DEVICE</div>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-text-secondary" />
              {isEditingName ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={tempDeviceName}
                    onChange={(e) => setTempDeviceName(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm bg-bg-primary border border-border-default rounded"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDeviceName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <button
                    onClick={handleSaveDeviceName}
                    className="px-2 py-1 text-xs bg-accent-primary text-white rounded"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-text-primary">{deviceName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempDeviceName(deviceName);
                      setIsEditingName(true);
                    }}
                    className="p-1 text-text-tertiary hover:text-text-primary rounded"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
            <div className="text-xs text-text-tertiary mt-1 font-mono">
              ID: {deviceId.slice(0, 8)}...
            </div>
          </div>

          {/* Connected devices */}
          {isEnabled && (
            <div className="p-3 border-b border-border-subtle">
              <div className="text-xs text-text-tertiary mb-2">CONNECTED DEVICES</div>
              {connectedDevices.length === 0 ? (
                <div className="text-sm text-text-tertiary py-2">
                  No other devices found
                </div>
              ) : (
                <div className="space-y-2">
                  {connectedDevices.map((device) => (
                    <DeviceRow key={device.deviceId} device={device} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Last sync time */}
          {isEnabled && (
            <div className="p-3 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock className="w-4 h-4" />
                <span>Last sync: {formatTime(lastSyncTime)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-3 flex gap-2">
            {isEnabled ? (
              <>
                <button
                  onClick={() => syncNow()}
                  disabled={isSyncing}
                  className="flex-1 px-3 py-2 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  onClick={() => disableSync()}
                  className="px-3 py-2 text-sm border border-border-default text-text-secondary rounded-lg hover:bg-bg-tertiary"
                >
                  Disable
                </button>
              </>
            ) : (
              <button
                onClick={() => enableSync()}
                className="flex-1 px-3 py-2 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 flex items-center justify-center gap-2"
              >
                <Cloud className="w-4 h-4" />
                Enable Sync
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface DeviceRowProps {
  device: SyncDeviceState;
}

function DeviceRow({ device }: DeviceRowProps) {
  const formatLastSeen = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2 py-1">
      <div
        className={`w-2 h-2 rounded-full ${
          device.isOnline ? 'bg-accent-success' : 'bg-text-tertiary'
        }`}
      />
      <Monitor className="w-4 h-4 text-text-tertiary" />
      <div className="flex-1">
        <div className="text-sm text-text-primary">{device.deviceName}</div>
        <div className="text-xs text-text-tertiary">
          {device.isOnline ? 'Online' : formatLastSeen(device.lastSeen)}
          {device.needsSync && (
            <span className="ml-2 text-accent-warning">• Needs sync</span>
          )}
        </div>
      </div>
      {device.isOnline ? (
        <Wifi className="w-4 h-4 text-accent-success" />
      ) : (
        <WifiOff className="w-4 h-4 text-text-tertiary" />
      )}
    </div>
  );
}

// Compact sync indicator for status bar
export function SyncIndicator() {
  const { isEnabled, isSyncing, onlineDeviceCount, hasDevicesNeedingSync } = usePeerSync();

  if (!isEnabled) {
    return (
      <div className="flex items-center gap-1 text-text-tertiary">
        <CloudOff className="w-3.5 h-3.5" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {isSyncing ? (
        <RefreshCw className="w-3.5 h-3.5 text-accent-primary animate-spin" />
      ) : hasDevicesNeedingSync ? (
        <Cloud className="w-3.5 h-3.5 text-accent-warning" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 text-accent-success" />
      )}
      <span className="text-xs text-text-secondary">{onlineDeviceCount}</span>
    </div>
  );
}

export default SyncStatusPanel;
