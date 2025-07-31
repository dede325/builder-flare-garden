import { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  CloudUpload,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  intelligentSyncService,
  SyncStats,
  ConnectionStatus,
} from "@/lib/intelligent-sync-service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SyncStatusIndicatorProps {
  compact?: boolean;
  showManualSync?: boolean;
}

export default function SyncStatusIndicator({
  compact = false,
  showManualSync = true,
}: SyncStatusIndicatorProps) {
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
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to sync stats updates
    const unsubscribe = intelligentSyncService.subscribe((stats) => {
      setSyncStats(stats);
    });

    // Update connection status
    const updateConnectionStatus = async () => {
      const status = await intelligentSyncService.getConnectionStatus();
      setConnectionStatus(status);
    };

    updateConnectionStatus();
    const interval = setInterval(updateConnectionStatus, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!connectionStatus.isOnline) {
      toast({
        title: "Sem conexão",
        description: "Não é possível sincronizar enquanto offline.",
        variant: "destructive",
      });
      return;
    }

    if (isSyncing) {
      return;
    }

    setIsSyncing(true);

    try {
      const success = await intelligentSyncService.forceSyncNow();

      if (success) {
        toast({
          title: "Sincronização concluída",
          description: "Todos os dados foram sincronizados com sucesso.",
        });
      } else {
        toast({
          title: "Sincronização falhou",
          description: "Alguns itens podem não ter sido sincronizados.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Manual sync failed:", error);
      toast({
        title: "Erro na sincronização",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryErrors = async () => {
    try {
      await intelligentSyncService.retryFailedOperations();
      toast({
        title: "Tentativas reiniciadas",
        description: "Os itens com erro serão tentados novamente.",
      });
    } catch (error) {
      toast({
        title: "Erro ao reiniciar",
        description: "Não foi possível reiniciar as tentativas.",
        variant: "destructive",
      });
    }
  };

  const getSyncStatusColor = () => {
    if (!connectionStatus.isOnline) return "bg-gray-500";
    if (syncStats.errorItems > 0) return "bg-red-500";
    if (syncStats.pendingItems > 0) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getSyncStatusText = () => {
    if (!connectionStatus.isOnline) return "Offline";
    if (syncStats.syncInProgress || isSyncing) return "Sincronizando";
    if (syncStats.errorItems > 0) return "Erro";
    if (syncStats.pendingItems > 0) return "Pendente";
    return "Sincronizado";
  };

  const getSyncStatusIcon = () => {
    if (!connectionStatus.isOnline) return WifiOff;
    if (syncStats.syncInProgress || isSyncing) return RefreshCw;
    if (syncStats.errorItems > 0) return AlertTriangle;
    if (syncStats.pendingItems > 0) return Clock;
    return CheckCircle;
  };

  const getSyncProgress = () => {
    if (syncStats.totalItems === 0) return 100;
    return Math.round((syncStats.syncedItems / syncStats.totalItems) * 100);
  };

  if (compact) {
    const StatusIcon = getSyncStatusIcon();

    return (
      <div className="flex items-center space-x-2">
        {/* Connection Status */}
        <div className="flex items-center space-x-1">
          {connectionStatus.isOnline ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
        </div>

        {/* Sync Status */}
        <div className="flex items-center space-x-1">
          <StatusIcon
            className={`h-4 w-4 ${syncStats.syncInProgress || isSyncing ? "animate-spin" : ""} ${
              connectionStatus.isOnline
                ? syncStats.errorItems > 0
                  ? "text-red-400"
                  : syncStats.pendingItems > 0
                    ? "text-yellow-400"
                    : "text-green-400"
                : "text-gray-400"
            }`}
          />
          <Badge
            className={`${getSyncStatusColor()} text-white text-xs px-2 py-0`}
          >
            {getSyncStatusText()}
          </Badge>
        </div>

        {/* Manual Sync Button */}
        {showManualSync &&
          connectionStatus.isOnline &&
          syncStats.pendingItems > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSync}
              disabled={isSyncing || syncStats.syncInProgress}
              className="text-white hover:bg-white/20 h-6 px-2"
            >
              <RefreshCw
                className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`}
              />
            </Button>
          )}
      </div>
    );
  }

  const StatusIcon = getSyncStatusIcon();

  return (
    <div className="space-y-3">
      {/* Main Status Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <StatusIcon
                className={`h-5 w-5 ${syncStats.syncInProgress || isSyncing ? "animate-spin" : ""} ${
                  connectionStatus.isOnline
                    ? syncStats.errorItems > 0
                      ? "text-red-400"
                      : syncStats.pendingItems > 0
                        ? "text-yellow-400"
                        : "text-green-400"
                    : "text-gray-400"
                }`}
              />
              <span>Status de Sincronização</span>
            </div>
            <Badge className={`${getSyncStatusColor()} text-white text-xs`}>
              {getSyncStatusText()}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Connection Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {connectionStatus.isOnline ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-white">
                {connectionStatus.isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {connectionStatus.connectionType && (
              <span className="text-white/70 text-xs">
                {connectionStatus.effectiveType} •{" "}
                {connectionStatus.connectionType}
              </span>
            )}
          </div>

          {/* Sync Progress */}
          {syncStats.totalItems > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/70">
                <span>Progresso da Sincronização</span>
                <span>{getSyncProgress()}%</span>
              </div>
              <Progress value={getSyncProgress()} className="h-2" />
            </div>
          )}

          {/* Sync Stats */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="text-white/70">Itens Sincronizados</div>
              <div className="text-green-400 font-medium">
                {syncStats.syncedItems} de {syncStats.totalItems}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-white/70">Pendentes</div>
              <div className="text-yellow-400 font-medium">
                {syncStats.pendingItems}
              </div>
            </div>
          </div>

          {syncStats.errorItems > 0 && (
            <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-red-300 text-sm">
                    {syncStats.errorItems} item
                    {syncStats.errorItems !== 1 ? "s" : ""} com erro
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryErrors}
                  className="border-red-400/50 text-red-300 hover:bg-red-500/20 h-7 text-xs"
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}

          {/* Last Sync Info */}
          {syncStats.lastSync && (
            <div className="text-xs text-white/50">
              Última sincronização:{" "}
              {format(new Date(syncStats.lastSync), "dd/MM/yyyy HH:mm", {
                locale: ptBR,
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {showManualSync && connectionStatus.isOnline && (
              <Button
                onClick={handleManualSync}
                disabled={isSyncing || syncStats.syncInProgress}
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/20 flex-1"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isSyncing || syncStats.syncInProgress ? "animate-spin" : ""}`}
                />
                {isSyncing || syncStats.syncInProgress
                  ? "Sincronizando..."
                  : "Sincronizar Agora"}
              </Button>
            )}

            <Dialog
              open={isDetailDialogOpen}
              onOpenChange={setIsDetailDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/20"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Detalhes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-aviation-gray-800 border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Detalhes da Sincronização
                  </DialogTitle>
                  <DialogDescription className="text-white/70">
                    Informações detalhadas sobre o status de sincronização dos
                    dados
                  </DialogDescription>
                </DialogHeader>

                <SyncDetailView />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Detailed sync view component
function SyncDetailView() {
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSyncLogs();
  }, []);

  const loadSyncLogs = async () => {
    try {
      const logs = await intelligentSyncService.getSyncLogs(50);
      setSyncLogs(logs);
    } catch (error) {
      console.error("Error loading sync logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success":
        return CheckCircle;
      case "error":
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-white" />
        <span className="ml-2 text-white">Carregando logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-h-96 overflow-y-auto space-y-2">
        {syncLogs.length === 0 ? (
          <div className="text-center py-8 text-white/70">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum log de sincronização disponível</p>
          </div>
        ) : (
          syncLogs.map((log, index) => {
            const LogIcon = getLogIcon(log.type);

            return (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <LogIcon
                  className={`h-4 w-4 mt-0.5 ${getLogColor(log.type)}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-white text-sm font-medium">
                      {log.operation}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {log.entity}
                    </Badge>
                  </div>
                  <p className="text-white/70 text-xs mt-1">{log.message}</p>
                  <div className="text-white/50 text-xs mt-1">
                    {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/20">
        <Button
          variant="outline"
          size="sm"
          onClick={loadSyncLogs}
          className="border-white/30 text-white hover:bg-white/20"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => intelligentSyncService.clearSyncLogs()}
          className="border-red-500/30 text-red-300 hover:bg-red-500/20"
        >
          Limpar Logs
        </Button>
      </div>
    </div>
  );
}
