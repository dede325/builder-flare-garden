import { useState, useEffect } from "react";
import {
  Smartphone,
  Bell,
  Wifi,
  WifiOff,
  QrCode,
  Fingerprint,
  Settings,
  Check,
  X,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Camera,
  Shield,
  Database,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  advancedFeaturesService,
  type MobileFeaturesConfig,
} from "@/lib/advanced-features-service";
import { mobileFeaturesService } from "@/lib/mobile-features-service";

interface MobileFeaturesConfigProps {
  onConfigChange?: (config: MobileFeaturesConfig) => void;
}

export function MobileFeaturesConfig({ onConfigChange }: MobileFeaturesConfigProps) {
  const [config, setConfig] = useState<MobileFeaturesConfig | null>(null);
  const [featureStatus, setFeatureStatus] = useState<Record<string, boolean>>({});
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadConfiguration();
    checkFeatureStatus();
    checkStorageUsage();
  }, []);

  const loadConfiguration = async () => {
    try {
      const mobileFeaturesConfig = await advancedFeaturesService.getConfigurationById('mobile-features');
      if (mobileFeaturesConfig) {
        setConfig(mobileFeaturesConfig.config as MobileFeaturesConfig);
      }
    } catch (error) {
      console.error("Error loading mobile features config:", error);
      toast({
        title: "Erro ao carregar configuração",
        description: "Não foi possível carregar as configurações móveis.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkFeatureStatus = async () => {
    try {
      const status = await mobileFeaturesService.getFeatureStatus();
      setFeatureStatus(status);
    } catch (error) {
      console.error("Error checking feature status:", error);
    }
  };

  const checkStorageUsage = async () => {
    try {
      const usage = await mobileFeaturesService.offlineStorage.getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      console.error("Error checking storage usage:", error);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!config) return;

    setIsSaving(true);
    try {
      await advancedFeaturesService.updateConfiguration(
        'mobile-features',
        { config },
        user?.email || "user"
      );

      onConfigChange?.(config);

      toast({
        title: "Configuração salva",
        description: "As configurações móveis foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPushNotification = async () => {
    try {
      await mobileFeaturesService.pushNotifications.sendNotification(
        "Teste de Notificação",
        "Esta é uma notificação de teste do sistema.",
        { test: true }
      );
      toast({
        title: "Notificação enviada",
        description: "Uma notificação de teste foi enviada.",
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar notificação",
        description: "Não foi possível enviar a notificação de teste.",
        variant: "destructive",
      });
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const granted = await mobileFeaturesService.pushNotifications.requestPermission();
      if (granted) {
        toast({
          title: "Permissão concedida",
          description: "Notificações foram habilitadas.",
        });
        checkFeatureStatus();
      } else {
        toast({
          title: "Permissão negada",
          description: "Notificações não puderam ser habilitadas.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao solicitar permissão",
        description: "Não foi possível solicitar permissão para notificações.",
        variant: "destructive",
      });
    }
  };

  const handleBiometricSetup = async () => {
    try {
      const userId = user?.id || user?.email || "user";
      const registered = await mobileFeaturesService.biometricAuth.register(userId);
      if (registered) {
        toast({
          title: "Autenticação biométrica configurada",
          description: "A autenticação biométrica foi configurada com sucesso.",
        });
      } else {
        toast({
          title: "Falha na configuração",
          description: "Não foi possível configurar a autenticação biométrica.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na configuração biométrica",
        description: "Ocorreu um erro ao configurar a autenticação biométrica.",
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

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center py-8">
        <Smartphone className="h-8 w-8 text-white animate-pulse mr-3" />
        <span className="text-white">Carregando configurações móveis...</span>
      </div>
    );
  }

  const storagePercentage = storageUsage.quota > 0 ? (storageUsage.used / storageUsage.quota) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Feature Status Overview */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Status das Funcionalidades Móveis
          </CardTitle>
          <CardDescription className="text-white/70">
            Compatibilidade do dispositivo com as funcionalidades avançadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(featureStatus).map(([feature, supported]) => {
              const featureNames: Record<string, string> = {
                pushNotificationsSupported: "Push Notifications",
                offlineStorageSupported: "Armazenamento Offline", 
                qrCodeSupported: "Câmera para QR Code",
                biometricSupported: "Autenticação Biométrica",
                backgroundSyncSupported: "Sincronização em Background",
              };

              return (
                <div key={feature} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white text-sm">{featureNames[feature]}</span>
                  <Badge variant={supported ? "default" : "secondary"}>
                    {supported ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    {supported ? "Suportado" : "Não Suportado"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-aviation-gray-700">
          <TabsTrigger value="notifications" className="text-white">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="offline" className="text-white">
            <Database className="h-4 w-4 mr-2" />
            Modo Offline
          </TabsTrigger>
          <TabsTrigger value="qr" className="text-white">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </TabsTrigger>
          <TabsTrigger value="biometric" className="text-white">
            <Fingerprint className="h-4 w-4 mr-2" />
            Biometria
          </TabsTrigger>
        </TabsList>

        {/* Push Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Push Notifications</CardTitle>
              <CardDescription className="text-white/70">
                Configure notificações em tempo real para eventos importantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Habilitar Push Notifications</Label>
                <Switch
                  checked={config.pushNotifications.enabled}
                  onCheckedChange={(checked) =>
                    setConfig(prev => prev ? {
                      ...prev,
                      pushNotifications: { ...prev.pushNotifications, enabled: checked }
                    } : prev)
                  }
                />
              </div>

              {config.pushNotifications.enabled && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Novos formulários</Label>
                      <Switch
                        checked={config.pushNotifications.newForms}
                        onCheckedChange={(checked) =>
                          setConfig(prev => prev ? {
                            ...prev,
                            pushNotifications: { ...prev.pushNotifications, newForms: checked }
                          } : prev)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Atualizações de status</Label>
                      <Switch
                        checked={config.pushNotifications.statusUpdates}
                        onCheckedChange={(checked) =>
                          setConfig(prev => prev ? {
                            ...prev,
                            pushNotifications: { ...prev.pushNotifications, statusUpdates: checked }
                          } : prev)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Alertas urgentes</Label>
                      <Switch
                        checked={config.pushNotifications.urgentAlerts}
                        onCheckedChange={(checked) =>
                          setConfig(prev => prev ? {
                            ...prev,
                            pushNotifications: { ...prev.pushNotifications, urgentAlerts: checked }
                          } : prev)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Endpoint do servidor</Label>
                    <Input
                      value={config.pushNotifications.endpoint || ""}
                      onChange={(e) =>
                        setConfig(prev => prev ? {
                          ...prev,
                          pushNotifications: { ...prev.pushNotifications, endpoint: e.target.value }
                        } : prev)
                      }
                      className="aviation-input"
                      placeholder="https://api.example.com/push"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleRequestNotificationPermission}
                      className="aviation-button"
                      disabled={!featureStatus.pushNotificationsSupported}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Solicitar Permissão
                    </Button>
                    <Button
                      onClick={handleTestPushNotification}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/20"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Testar Notificação
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offline Mode Tab */}
        <TabsContent value="offline" className="space-y-4">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Modo Offline</CardTitle>
              <CardDescription className="text-white/70">
                Configure armazenamento local e sincronização automática
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Habilitar modo offline</Label>
                <Switch
                  checked={config.offlineMode.enabled}
                  onCheckedChange={(checked) =>
                    setConfig(prev => prev ? {
                      ...prev,
                      offlineMode: { ...prev.offlineMode, enabled: checked }
                    } : prev)
                  }
                />
              </div>

              {config.offlineMode.enabled && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Limite de armazenamento (MB)</Label>
                    <Input
                      type="number"
                      min="10"
                      max="1000"
                      value={config.offlineMode.maxStorageMB}
                      onChange={(e) =>
                        setConfig(prev => prev ? {
                          ...prev,
                          offlineMode: { ...prev.offlineMode, maxStorageMB: parseInt(e.target.value) || 100 }
                        } : prev)
                      }
                      className="aviation-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Intervalo de sincronização (minutos)</Label>
                    <Select
                      value={config.offlineMode.syncInterval.toString()}
                      onValueChange={(value) =>
                        setConfig(prev => prev ? {
                          ...prev,
                          offlineMode: { ...prev.offlineMode, syncInterval: parseInt(value) }
                        } : prev)
                      }
                    >
                      <SelectTrigger className="aviation-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutos</SelectItem>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Sincronização automática</Label>
                      <Switch
                        checked={config.offlineMode.autoSync}
                        onCheckedChange={(checked) =>
                          setConfig(prev => prev ? {
                            ...prev,
                            offlineMode: { ...prev.offlineMode, autoSync: checked }
                          } : prev)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Sincronização em background</Label>
                      <Switch
                        checked={config.offlineMode.backgroundSync}
                        onCheckedChange={(checked) =>
                          setConfig(prev => prev ? {
                            ...prev,
                            offlineMode: { ...prev.offlineMode, backgroundSync: checked }
                          } : prev)
                        }
                        disabled={!featureStatus.backgroundSyncSupported}
                      />
                    </div>
                  </div>

                  {/* Storage Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Uso do armazenamento</Label>
                      <Badge variant="outline" className="text-white border-white/30">
                        {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.quota)}
                      </Badge>
                    </div>
                    <Progress value={storagePercentage} className="h-2" />
                    <p className="text-xs text-white/70">
                      {storagePercentage.toFixed(1)}% do espaço disponível utilizado
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Code Tab */}
        <TabsContent value="qr" className="space-y-4">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">QR Code Scanner</CardTitle>
              <CardDescription className="text-white/70">
                Configure leitura de códigos QR para identificação rápida
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Habilitar scanner QR</Label>
                <Switch
                  checked={config.qrCodeScanning.enabled}
                  onCheckedChange={(checked) =>
                    setConfig(prev => prev ? {
                      ...prev,
                      qrCodeScanning: { ...prev.qrCodeScanning, enabled: checked }
                    } : prev)
                  }
                  disabled={!featureStatus.qrCodeSupported}
                />
              </div>

              {config.qrCodeScanning.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Códigos de aeronave</Label>
                    <Switch
                      checked={config.qrCodeScanning.aircraftCode}
                      onCheckedChange={(checked) =>
                        setConfig(prev => prev ? {
                          ...prev,
                          qrCodeScanning: { ...prev.qrCodeScanning, aircraftCode: checked }
                        } : prev)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Códigos de funcionário</Label>
                    <Switch
                      checked={config.qrCodeScanning.employeeCode}
                      onCheckedChange={(checked) =>
                        setConfig(prev => prev ? {
                          ...prev,
                          qrCodeScanning: { ...prev.qrCodeScanning, employeeCode: checked }
                        } : prev)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Códigos personalizados</Label>
                    <Switch
                      checked={config.qrCodeScanning.customCodes}
                      onCheckedChange={(checked) =>
                        setConfig(prev => prev ? {
                          ...prev,
                          qrCodeScanning: { ...prev.qrCodeScanning, customCodes: checked }
                        } : prev)
                      }
                    />
                  </div>
                </div>
              )}

              {!featureStatus.qrCodeSupported && (
                <div className="flex items-start space-x-2 p-3 bg-yellow-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 text-sm font-medium">
                      Câmera não disponível
                    </p>
                    <p className="text-yellow-200 text-xs">
                      Este dispositivo não suporta acesso à câmera para leitura de QR codes.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Biometric Authentication Tab */}
        <TabsContent value="biometric" className="space-y-4">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Autenticação Biométrica</CardTitle>
              <CardDescription className="text-white/70">
                Configure autenticação por impressão digital ou reconhecimento facial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Habilitar autenticação biométrica</Label>
                <Switch
                  checked={config.biometricAuth.enabled}
                  onCheckedChange={(checked) =>
                    setConfig(prev => prev ? {
                      ...prev,
                      biometricAuth: { ...prev.biometricAuth, enabled: checked }
                    } : prev)
                  }
                  disabled={!featureStatus.biometricSupported}
                />
              </div>

              {config.biometricAuth.enabled && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Impressão digital</Label>
                      <Switch
                        checked={config.biometricAuth.fingerprint}
                        onCheckedChange={(checked) =>
                          setConfig(prev => prev ? {
                            ...prev,
                            biometricAuth: { ...prev.biometricAuth, fingerprint: checked }
                          } : prev)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Reconhecimento facial</Label>
                      <Switch
                        checked={config.biometricAuth.faceRecognition}
                        onCheckedChange={(checked) =>
                          setConfig(prev => prev ? {
                            ...prev,
                            biometricAuth: { ...prev.biometricAuth, faceRecognition: checked }
                          } : prev)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Obrigatório para login</Label>
                      <Switch
                        checked={config.biometricAuth.mandatory}
                        onCheckedChange={(checked) =>
                          setConfig(prev => prev ? {
                            ...prev,
                            biometricAuth: { ...prev.biometricAuth, mandatory: checked }
                          } : prev)
                        }
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleBiometricSetup}
                    className="aviation-button w-full"
                  >
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Configurar Autenticação Biométrica
                  </Button>
                </>
              )}

              {!featureStatus.biometricSupported && (
                <div className="flex items-start space-x-2 p-3 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-300 text-sm font-medium">
                      Biometria não suportada
                    </p>
                    <p className="text-red-200 text-xs">
                      Este dispositivo não suporta autenticação biométrica.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveConfiguration}
          disabled={isSaving}
          className="aviation-button"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>
    </div>
  );
}
