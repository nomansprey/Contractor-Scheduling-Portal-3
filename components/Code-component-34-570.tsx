import React from 'react';
import { CheckCircle, Wifi, WifiOff } from 'lucide-react';

interface SyncStatusProps {
  isOnline: boolean;
  lastSync?: Date;
}

export function SyncStatus({ isOnline, lastSync }: SyncStatusProps) {
  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-green-600">Online</span>
          {lastSync && (
            <>
              <span>•</span>
              <span>Synced {formatLastSync(lastSync)}</span>
            </>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-500" />
          <span className="text-red-600">Offline</span>
        </>
      )}
    </div>
  );
}