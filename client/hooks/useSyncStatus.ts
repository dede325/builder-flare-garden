import { useState, useEffect } from "react";
import {
  intelligentSyncService,
  SyncStats,
  ConnectionStatus,
} from "@/lib/intelligent-sync-service";

export function useSyncStatus() {
  const [syncStats, setSyncStats] = useState<SyncStats>({
    totalItems: 0,
    syncedItems: 0,
    pendingItems: 0,
    errorItems: 0,
    isOnline: navigator.onLine,
    syncInProgress: false,
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
  });

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    // Subscribe to sync stats updates
    const unsubscribe = intelligentSyncService.subscribe((stats) => {
      setSyncStats(stats);
    });

    // Update connection status periodically
    const updateConnectionStatus = async () => {
      try {
        const status = await intelligentSyncService.getConnectionStatus();
        setConnectionStatus(status);
      } catch (error) {
        console.warn("Failed to get connection status:", error);
      }
    };

    updateConnectionStatus();
    const interval = setInterval(updateConnectionStatus, 10000); // Update every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const forceSyncNow = async (): Promise<boolean> => {
    if (!connectionStatus.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    if (isManualSyncing || syncStats.syncInProgress) {
      return false;
    }

    setIsManualSyncing(true);

    try {
      const result = await intelligentSyncService.forceSyncNow();
      return result;
    } finally {
      setIsManualSyncing(false);
    }
  };

  const retryFailedOperations = async (): Promise<void> => {
    await intelligentSyncService.retryFailedOperations();
  };

  const getSyncStatusText = (): string => {
    if (!connectionStatus.isOnline) return "Offline";
    if (syncStats.syncInProgress || isManualSyncing) return "Sincronizando";
    if (syncStats.errorItems > 0) return "Erro";
    if (syncStats.pendingItems > 0) return "Pendente";
    return "Sincronizado";
  };

  const getSyncStatusColor = (): "green" | "yellow" | "red" | "gray" => {
    if (!connectionStatus.isOnline) return "gray";
    if (syncStats.errorItems > 0) return "red";
    if (syncStats.pendingItems > 0) return "yellow";
    return "green";
  };

  const getSyncProgress = (): number => {
    if (syncStats.totalItems === 0) return 100;
    return Math.round((syncStats.syncedItems / syncStats.totalItems) * 100);
  };

  const isHealthy = (): boolean => {
    return (
      connectionStatus.isOnline &&
      syncStats.errorItems === 0 &&
      syncStats.pendingItems === 0
    );
  };

  const needsAttention = (): boolean => {
    return (
      syncStats.errorItems > 0 ||
      (connectionStatus.isOnline && syncStats.pendingItems > 5)
    );
  };

  return {
    // Status data
    syncStats,
    connectionStatus,
    isManualSyncing,

    // Actions
    forceSyncNow,
    retryFailedOperations,

    // Computed values
    getSyncStatusText,
    getSyncStatusColor,
    getSyncProgress,
    isHealthy,
    needsAttention,

    // Direct service access for advanced usage
    syncService: intelligentSyncService,
  };
}

// Hook for just connection status (lighter weight)
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>("unknown");

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
      // @ts-ignore
      setConnectionType(navigator.connection?.type || "unknown");
    };

    const handleOnline = () => {
      setIsOnline(true);
      updateStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Monitor connection changes
    // @ts-ignore
    if (navigator.connection) {
      // @ts-ignore
      navigator.connection.addEventListener("change", updateStatus);
    }

    // Initial update
    updateStatus();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      // @ts-ignore
      if (navigator.connection) {
        // @ts-ignore
        navigator.connection.removeEventListener("change", updateStatus);
      }
    };
  }, []);

  return {
    isOnline,
    connectionType,
  };
}

// Hook for sync logs
export function useSyncLogs(limit: number = 50) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const syncLogs = await intelligentSyncService.getSyncLogs(limit);
      setLogs(syncLogs);
    } catch (error) {
      console.error("Error loading sync logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      await intelligentSyncService.clearSyncLogs();
      setLogs([]);
    } catch (error) {
      console.error("Error clearing sync logs:", error);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [limit]);

  return {
    logs,
    loading,
    loadLogs,
    clearLogs,
  };
}
