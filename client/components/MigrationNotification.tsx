import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Upload, X, Settings } from "lucide-react";
import { migrationService } from "@/lib/migration-service";
import { Link } from "react-router-dom";

interface MigrationNotificationProps {
  className?: string;
}

export function MigrationNotification({
  className,
}: MigrationNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    isConfigured: boolean;
    dataCounts: any;
  } | null>(null);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const [isConfigured, dataCounts] = await Promise.all([
        migrationService.isSupabaseConfigured(),
        migrationService.getOfflineDataCounts(),
      ]);

      setMigrationStatus({ isConfigured, dataCounts });

      // Show notification if Supabase is configured and there's offline data
      setIsVisible(isConfigured && dataCounts.total > 0);
    } catch (error) {
      console.error("Failed to check migration status:", error);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for this session
    sessionStorage.setItem("migrationNotificationDismissed", "true");
  };

  // Check if already dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem("migrationNotificationDismissed");
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible || !migrationStatus) {
    return null;
  }

  return (
    <Card
      className={`glass-card border-blue-500/30 bg-blue-500/10 ${className}`}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Database className="h-6 w-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-white font-medium">Migração Disponível</h4>
              <Badge
                variant="outline"
                className="text-blue-200 border-blue-400/50"
              >
                {migrationStatus.dataCounts.total} registros
              </Badge>
            </div>
            <p className="text-blue-200 text-sm">
              Supabase configurado! Migre seus dados offline para sincronização
              na nuvem.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/settings?tab=data">
            <Button size="sm" className="aviation-button">
              <Upload className="h-4 w-4 mr-1" />
              Migrar
            </Button>
          </Link>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
