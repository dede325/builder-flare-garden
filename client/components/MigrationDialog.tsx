import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  Database,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { migrationService } from "@/lib/migration-service";

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface MigrationProgress {
  current: number;
  total: number;
  table: string;
  status: "migrating" | "completed" | "error";
}

export function MigrationDialog({
  open,
  onOpenChange,
  onComplete,
}: MigrationDialogProps) {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [dataCounts, setDataCounts] = useState<any>(null);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (open) {
      checkConfiguration();
      getDataCounts();
    }
  }, [open]);

  const checkConfiguration = async () => {
    const configured = await migrationService.isSupabaseConfigured();
    setIsConfigured(configured);
  };

  const getDataCounts = async () => {
    const counts = await migrationService.getOfflineDataCounts();
    setDataCounts(counts);
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setResult(null);

    // Set up progress callback
    migrationService.setProgressCallback((progressData) => {
      setProgress(progressData);
    });

    try {
      const migrationResult = await migrationService.migrateAllData();
      setResult(migrationResult);

      if (migrationResult.success) {
        // Clear sync queue and mark as synced
        await migrationService.clearSyncQueue();
        await migrationService.markAllAsSynced();

        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Erro durante a migração: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      });
    } finally {
      setMigrating(false);
    }
  };

  const getProgressPercentage = () => {
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  const handleClose = () => {
    if (!migrating) {
      onOpenChange(false);
      setProgress(null);
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5" />
            Migração de Dados
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Migrar dados offline para o Supabase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Configuration Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10">
            {isConfigured === null ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isConfigured ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <span className="text-white text-sm">
              {isConfigured === null
                ? "Verificando configuração..."
                : isConfigured
                  ? "Supabase configurado"
                  : "Supabase não configurado"}
            </span>
          </div>

          {/* Data Counts */}
          {dataCounts && (
            <div className="space-y-2">
              <h4 className="text-white font-medium">Dados Offline:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between text-white/80">
                  <span>Aeronaves:</span>
                  <span>{dataCounts.aircraft}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Funcionários:</span>
                  <span>{dataCounts.employees}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Tarefas:</span>
                  <span>{dataCounts.tasks}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Voos:</span>
                  <span>{dataCounts.flightSheets}</span>
                </div>
              </div>
              <div className="border-t border-white/20 pt-2">
                <div className="flex justify-between text-white font-medium">
                  <span>Total:</span>
                  <span>{dataCounts.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Migration Progress */}
          {migrating && progress && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Upload className="h-4 w-4 animate-pulse" />
                <span className="text-sm">
                  Migrando {progress.table}... ({progress.current}/
                  {progress.total})
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
              <div className="text-center text-white/70 text-sm">
                {getProgressPercentage()}% concluído
              </div>
            </div>
          )}

          {/* Migration Result */}
          {result && (
            <div
              className={`p-3 rounded-lg border ${
                result.success
                  ? "bg-green-500/20 border-green-500/30"
                  : "bg-red-500/20 border-red-500/30"
              }`}
            >
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="space-y-1">
                  <p
                    className={`text-sm font-medium ${
                      result.success ? "text-green-200" : "text-red-200"
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.details && (
                    <div className="text-xs space-y-1 text-white/70">
                      <p>Aeronaves: {result.details.aircraft}</p>
                      <p>Funcionários: {result.details.employees}</p>
                      <p>Tarefas: {result.details.tasks}</p>
                      <p>Voos: {result.details.flightSheets}</p>
                      {result.details.errors?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-300 font-medium">Erros:</p>
                          {result.details.errors
                            .slice(0, 3)
                            .map((error: string, index: number) => (
                              <p key={index} className="text-red-200 text-xs">
                                • {error}
                              </p>
                            ))}
                          {result.details.errors.length > 3 && (
                            <p className="text-red-200 text-xs">
                              ... e mais {result.details.errors.length - 3}{" "}
                              erros
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!migrating && !result && isConfigured && dataCounts?.total > 0 && (
              <Button
                onClick={handleMigrate}
                className="aviation-button flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Iniciar Migração
              </Button>
            )}

            {!migrating && (!isConfigured || dataCounts?.total === 0) && (
              <div className="text-center text-white/70 text-sm py-4">
                {!isConfigured
                  ? "Configure o Supabase primeiro"
                  : "Nenhum dado offline para migrar"}
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleClose}
              disabled={migrating}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {result?.success ? "Concluir" : "Cancelar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
