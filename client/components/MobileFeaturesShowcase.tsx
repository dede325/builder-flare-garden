import { useState, useEffect } from "react";
import {
  Smartphone,
  Bell,
  Wifi,
  WifiOff,
  QrCode,
  Fingerprint,
  Download,
  Upload,
  Database,
  Shield,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Camera,
  Lock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { mobileFeaturesService } from "@/lib/mobile-features-service";
import { advancedFeaturesService } from "@/lib/advanced-features-service";

interface FeatureStatus {
  pushNotifications: boolean;
  offlineStorage: boolean;
  qrCode: boolean;
  biometricAuth: boolean;
  backgroundSync: boolean;
}

interface StorageInfo {
  used: number;
  quota: number;
  percentage: number;
}

export function MobileFeaturesShowcase() {
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus>({
    pushNotifications: false,
    offlineStorage: false,
    qrCode: false,
    biometricAuth: false,
    backgroundSync: false,
  });
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    quota: 0,
    percentage: 0,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    checkFeatureSupport();
    checkStorageUsage();
    setupConnectivityListener();
    loadNotifications();
  }, []);

  const checkFeatureSupport = async () => {
    try {
      const status = await mobileFeaturesService.getFeatureStatus();
      setFeatureStatus({
        pushNotifications: status.pushNotificationsSupported,
        offlineStorage: status.offlineStorageSupported,
        qrCode: status.qrCodeSupported,
        biometricAuth: status.biometricSupported,
        backgroundSync: status.backgroundSyncSupported,
      });
    } catch (error) {
      console.error("Error checking feature support:", error);
    }
  };

  const checkStorageUsage = async () => {
    try {
      const usage = await mobileFeaturesService.offlineStorage.getStorageUsage();
      const percentage = usage.quota > 0 ? (usage.used / usage.quota) * 100 : 0;
      setStorageInfo({
        used: usage.used,
        quota: usage.quota,
        percentage,
      });
    } catch (error) {
      console.error("Error checking storage usage:", error);
    }
  };

  const setupConnectivityListener = () => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  const loadNotifications = () => {
    // Mock notifications
    setNotifications([
      {
        id: 1,
        title: "Nova Folha de Limpeza",
        message: "Aeronave CS-TNP requer limpeza",
        time: "há 5 min",
        type: "new_form",
        read: false,
      },
      {
        id: 2,
        title: "Sincronização Concluída",
        message: "Dados sincronizados com sucesso",
        time: "há 15 min",
        type: "sync",
        read: true,
      },
      {
        id: 3,
        title: "Alerta de SLA",
        message: "Formulário pendente há mais de 2h",
        time: "há 30 min",
        type: "alert",
        read: false,
      },
    ]);
  };

  const handleTestNotification = async () => {
    try {
      await mobileFeaturesService.pushNotifications.sendNotification(
        "Teste de Notificação",
        "Esta é uma notificação de teste do sistema móvel",
        { test: true }
      );
      toast({
        title: "Notificação Enviada",
        description: "Notificação de teste enviada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar notificação",
        variant: "destructive",
      });
    }
  };

  const handleOfflineSync = async () => {
    setSyncing(true);
    try {
      // Simulate offline sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Sincronização Offline",
        description: "Dados offline sincronizados com sucesso",
      });
      
      await checkStorageUsage();
    } catch (error) {
      toast({
        title: "Erro de Sincronização",
        description: "Falha na sincronização offline",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleBiometricTest = async () => {
    try {
      const available = await mobileFeaturesService.biometricAuth.isAvailable();
      if (available) {
        toast({
          title: "Biometria Disponível",
          description: "Sensor biométrico detectado e funcional",
        });
      } else {
        toast({
          title: "Biometria Indisponível",
          description: "Sensor biométrico não encontrado",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de Biometria",
        description: "Falha ao acessar sensor biométrico",
        variant: "destructive",
      });
    }
  };

  const handleQRCodeTest = () => {
    if (featureStatus.qrCode) {
      toast({
        title: "QR Code Scanner",
        description: "Câmera disponível para leitura de QR codes",
      });
    } else {
      toast({
        title: "Scanner Indisponível",
        description: "Câmera não encontrada ou sem permissão",
        variant: "destructive",
      });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFeatureIcon = (feature: keyof FeatureStatus) => {
    const icons = {
      pushNotifications: Bell,
      offlineStorage: Database,
      qrCode: Camera,
      biometricAuth: Fingerprint,
      backgroundSync: Sync,
    };
    return icons[feature];
  };

  const getFeatureName = (feature: keyof FeatureStatus) => {
    const names = {
      pushNotifications: "Push Notifications",
      offlineStorage: "Armazenamento Offline",
      qrCode: "Scanner QR Code",
      biometricAuth: "Autenticação Biométrica",
      backgroundSync: "Sincronização Background",
    };
    return names[feature];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Smartphone className="h-7 w-7 text-blue-400" />
            Funcionalidades Móveis
          </h2>
          <p className="text-blue-200 mt-1">
            Recursos avançados para dispositivos móveis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Feature Support Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(featureStatus).map(([feature, supported]) => {
          const IconComponent = getFeatureIcon(feature as keyof FeatureStatus);
          const featureName = getFeatureName(feature as keyof FeatureStatus);
          
          return (
            <Card key={feature} className="glass-card border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5 text-blue-400" />
                    <span className="text-white font-medium text-sm">{featureName}</span>
                  </div>
                  {supported ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <Badge variant={supported ? "default" : "secondary"} className="text-xs">
                  {supported ? "Suportado" : "Não Suportado"}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Storage Information */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5" />
            Armazenamento Offline
          </CardTitle>
          <CardDescription className="text-white/70">
            Uso do armazenamento local para modo offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">Espaço Utilizado</span>
            <span className="text-white">
              {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
            </span>
          </div>
          <Progress value={storageInfo.percentage} className="h-2" />
          <div className="flex justify-between text-xs text-white/50">
            <span>{storageInfo.percentage.toFixed(1)}% utilizado</span>
            <span>{formatBytes(storageInfo.quota - storageInfo.used)} livres</span>
          </div>
          <Button
            onClick={handleOfflineSync}
            disabled={syncing}
            className="w-full aviation-button"
          >
            {syncing ? (
              <>
                <Sync className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Sincronizar Dados Offline
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Feature Testing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/70 text-sm">
              Teste o sistema de notificações push
            </p>
            <Button
              onClick={handleTestNotification}
              disabled={!featureStatus.pushNotifications}
              className="w-full aviation-button"
            >
              <Bell className="h-4 w-4 mr-2" />
              Enviar Notificação Teste
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Autenticação Biométrica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/70 text-sm">
              Teste o sensor biométrico do dispositivo
            </p>
            <Button
              onClick={handleBiometricTest}
              disabled={!featureStatus.biometricAuth}
              className="w-full aviation-button"
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              Testar Biometria
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scanner QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/70 text-sm">
              Teste o acesso à câmera para QR codes
            </p>
            <Button
              onClick={handleQRCodeTest}
              disabled={!featureStatus.qrCode}
              className="w-full aviation-button"
            >
              <Camera className="h-4 w-4 mr-2" />
              Testar Scanner
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sync className="h-5 w-5" />
              Sincronização Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/70 text-sm">
              Sincronização automática em segundo plano
            </p>
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Status:</span>
              <Badge variant={featureStatus.backgroundSync ? "default" : "secondary"}>
                {featureStatus.backgroundSync ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações Recentes
          </CardTitle>
          <CardDescription className="text-white/70">
            Últimas notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${
                notification.read
                  ? "bg-white/5 border-white/10"
                  : "bg-blue-500/10 border-blue-400/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-white font-medium text-sm">
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    )}
                  </div>
                  <p className="text-white/70 text-xs">{notification.message}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 text-white/50" />
                  <span className="text-white/50 text-xs">{notification.time}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
