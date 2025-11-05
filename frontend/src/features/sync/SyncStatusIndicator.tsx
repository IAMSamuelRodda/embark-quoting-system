/**
 * Sync Status Indicator Component
 *
 * Displays connection status and sync state in the app header
 * Shows pending changes count and allows manual sync trigger
 */

import { useEffect } from 'react';
import { useSync } from './useSync';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Cloud } from 'lucide-react';

export function SyncStatusIndicator() {
  const {
    isOnline,
    syncState,
    pendingChanges,
    pushedCount,
    pulledCount,
    errors,
    sync,
    refreshPendingCount,
    clearErrors,
    initialize,
  } = useSync();

  // Initialize sync system on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Refresh pending count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPendingCount();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  // Handle manual sync
  const handleSync = async () => {
    if (syncState === 'syncing') return; // Prevent double-click
    await sync();
  };

  // Determine status color
  const getStatusColor = () => {
    if (!isOnline) return 'text-gray-400';
    if (syncState === 'error') return 'text-red-500';
    if (syncState === 'success') return 'text-green-500';
    if (pendingChanges > 0) return 'text-yellow-500';
    return 'text-sky-500';
  };

  // Determine status icon
  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-5 h-5" />;
    if (syncState === 'syncing') return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (syncState === 'success') return <CheckCircle className="w-5 h-5" />;
    if (syncState === 'error') return <AlertCircle className="w-5 h-5" />;
    if (pendingChanges > 0) return <Cloud className="w-5 h-5" />;
    return <Wifi className="w-5 h-5" />;
  };

  // Determine status text
  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncState === 'syncing') return 'Syncing...';
    if (syncState === 'success') return `Synced (↑${pushedCount} ↓${pulledCount})`;
    if (syncState === 'error') return 'Sync Failed';
    if (pendingChanges > 0) return `${pendingChanges} pending`;
    return 'Synced';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Status Indicator */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 ${getStatusColor()} transition-colors`}
        title={getStatusText()}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>

      {/* Sync Button (only show when online and not syncing) */}
      {isOnline && syncState !== 'syncing' && (
        <button
          onClick={handleSync}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sky-500"
          title="Sync now"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      )}

      {/* Error Indicator */}
      {errors.length > 0 && (
        <div className="relative group">
          <button
            onClick={clearErrors}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-red-500"
            title="View errors"
          >
            <AlertCircle className="w-5 h-5" />
          </button>

          {/* Error Tooltip */}
          <div className="absolute right-0 top-full mt-2 w-80 p-3 bg-gray-900 border border-red-500 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="text-sm font-semibold text-red-500 mb-2">
              Sync Errors ({errors.length})
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="text-xs text-gray-300">
                  {error}
                </div>
              ))}
            </div>
            <button
              onClick={clearErrors}
              className="mt-2 w-full px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs text-red-500 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
