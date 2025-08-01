import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Clock,
  Globe,
  Shield,
  Bell,
  Palette,
  Database,
  Zap,
  AlertTriangle,
  Save,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MacroConfiguration {
  // Company Information
  companyName: string;
  companyLogo: string;
  timezone: string;
  language: string;
  
  // Operation Settings
  maxTaskDurationMinutes: number;
  autoAssignTasks: boolean;
  requireSupervisorApproval: boolean;
  enablePhotoUpload: boolean;
  maxPhotosPerTask: number;
  
  // Quality Control
  qualityScoreThreshold: number;
  enableQualityAlerts: boolean;
  requireQualityReview: boolean;
  
  // Notifications
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  enableSmsNotifications: boolean;
  
  // Data Management
  dataRetentionDays: number;
  autoBackupEnabled: boolean;
  backupFrequencyHours: number;
  
  // Security
  sessionTimeoutMinutes: number;
  requireStrongPasswords: boolean;
  enableTwoFactorAuth: boolean;
  maxLoginAttempts: number;
  
  // Performance
  enableCaching: boolean;
  cacheTimeoutMinutes: number;
  enableOfflineMode: boolean;
  syncIntervalMinutes: number;
}

const defaultConfiguration: MacroConfiguration = {
  companyName: "AirPlus Aviation Services",
  companyLogo: "/airplus-logo.png",
  timezone: "Atlantic/Azores",
  language: "pt",
  maxTaskDurationMinutes: 120,
  autoAssignTasks: false,
  requireSupervisorApproval: true,
  enablePhotoUpload: true,
  maxPhotosPerTask: 10,
  qualityScoreThreshold: 80,
  enableQualityAlerts: true,
  requireQualityReview: false,
  enableEmailNotifications: true,
  enablePushNotifications: true,
  enableSmsNotifications: false,
  dataRetentionDays: 365,
  autoBackupEnabled: true,
  backupFrequencyHours: 24,
  sessionTimeoutMinutes: 60,
  requireStrongPasswords: true,
  enableTwoFactorAuth: false,
  maxLoginAttempts: 5,
  enableCaching: true,
  cacheTimeoutMinutes: 30,
  enableOfflineMode: true,
  syncIntervalMinutes: 15,
};

export function MacroConfigurationPanel() {
  const [config, setConfig] = useState<MacroConfiguration>(defaultConfiguration);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // Load from localStorage first
      const saved = localStorage.getItem("macroConfiguration");
      if (saved) {
        const savedConfig = JSON.parse(saved);
        setConfig({ ...defaultConfiguration, ...savedConfig });
      }

      // Attempt to load from Supabase if available
      try {
        const { supabase } = await import("@/lib/supabase");
        if (supabase) {
          const { data, error } = await supabase
            .from('system_configurations')
            .select('*')
            .eq('key', 'macro_config')
            .single();

          if (data && !error) {
            const remoteConfig = JSON.parse(data.value);
            setConfig({ ...defaultConfiguration, ...remoteConfig });
          }
        }
      } catch (error) {
        console.warn("Supabase not available for macro configuration");
      }
    } catch (error) {
      console.error("Error loading macro configuration:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Usando configurações padrão.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem("macroConfiguration", JSON.stringify(config));

      // Attempt to save to Supabase if available
      try {
        const { supabase } = await import("@/lib/supabase");
        if (supabase) {
          const { error } = await supabase
            .from('system_configurations')
            .upsert({
              key: 'macro_config',
              value: JSON.stringify(config),
              updated_at: new Date().toISOString(),
            });

          if (error) {
            console.warn("Failed to save to Supabase:", error);
          }
        }
      } catch (error) {
        console.warn("Supabase not available for saving macro configuration");
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações macro foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Error saving macro configuration:", error);
      toast({
        title: "Erro ao salvar",
        description: "Falha ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig(defaultConfiguration);
    toast({
      title: "Configurações resetadas",
      description: "Todas as configurações foram restauradas aos valores padrão.",
    });
  };

  const updateConfig = (key: keyof MacroConfiguration, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Settings className="h-8 w-8 text-white animate-spin mr-3" />
        <span className="text-white">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações Macro
          </h3>
          <p className="text-white/70 text-sm">
            Configurações globais que afetam todo o sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={resetToDefaults}
            variant="outline"
            size="sm"
            className="border-orange-400/50 text-orange-300 hover:bg-orange-500/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </Button>
          <Button
            onClick={saveConfiguration}
            disabled={saving}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <Settings className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </div>

      {/* Company Information */}
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription className="text-white/70">
            Configurações básicas da organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Nome da Empresa</Label>
              <Input
                value={config.companyName}
                onChange={(e) => updateConfig('companyName', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Fuso Horário</Label>
              <Select
                value={config.timezone}
                onValueChange={(value) => updateConfig('timezone', value)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Atlantic/Azores">Açores (UTC-1)</SelectItem>
                  <SelectItem value="Europe/Lisbon">Lisboa (UTC+0)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-white">Idioma do Sistema</Label>
            <Select
              value={config.language}
              onValueChange={(value) => updateConfig('language', value)}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Operation Settings */}
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurações Operacionais
          </CardTitle>
          <CardDescription className="text-white/70">
            Parâmetros de funcionamento das operações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Duração Máxima da Tarefa (minutos)</Label>
              <Input
                type="number"
                value={config.maxTaskDurationMinutes}
                onChange={(e) => updateConfig('maxTaskDurationMinutes', Number(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
                min="30"
                max="480"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Máximo de Fotos por Tarefa</Label>
              <Input
                type="number"
                value={config.maxPhotosPerTask}
                onChange={(e) => updateConfig('maxPhotosPerTask', Number(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
                min="1"
                max="50"
              />
            </div>
          </div>

          <Separator className="bg-white/20" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Atribuição Automática de Tarefas</Label>
                <p className="text-white/60 text-sm">Atribuir tarefas automaticamente aos funcionários disponíveis</p>
              </div>
              <Switch
                checked={config.autoAssignTasks}
                onCheckedChange={(checked) => updateConfig('autoAssignTasks', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Aprovação do Supervisor</Label>
                <p className="text-white/60 text-sm">Exigir aprovação do supervisor para conclusão</p>
              </div>
              <Switch
                checked={config.requireSupervisorApproval}
                onCheckedChange={(checked) => updateConfig('requireSupervisorApproval', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Upload de Fotos</Label>
                <p className="text-white/60 text-sm">Permitir upload de evidências fotográficas</p>
              </div>
              <Switch
                checked={config.enablePhotoUpload}
                onCheckedChange={(checked) => updateConfig('enablePhotoUpload', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Control */}
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Controle de Qualidade
          </CardTitle>
          <CardDescription className="text-white/70">
            Configurações para monitoramento de qualidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Pontuação Mínima de Qualidade (%)</Label>
            <Input
              type="number"
              value={config.qualityScoreThreshold}
              onChange={(e) => updateConfig('qualityScoreThreshold', Number(e.target.value))}
              className="bg-white/10 border-white/20 text-white"
              min="0"
              max="100"
            />
          </div>

          <Separator className="bg-white/20" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Alertas de Qualidade</Label>
                <p className="text-white/60 text-sm">Notificar quando a qualidade estiver abaixo do limite</p>
              </div>
              <Switch
                checked={config.enableQualityAlerts}
                onCheckedChange={(checked) => updateConfig('enableQualityAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Revisão Obrigatória</Label>
                <p className="text-white/60 text-sm">Exigir revisão manual para qualidade baixa</p>
              </div>
              <Switch
                checked={config.requireQualityReview}
                onCheckedChange={(checked) => updateConfig('requireQualityReview', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription className="text-white/70">
            Configurar tipos de notificações ativas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Notificações por Email</Label>
              <p className="text-white/60 text-sm">Enviar notificações importantes por email</p>
            </div>
            <Switch
              checked={config.enableEmailNotifications}
              onCheckedChange={(checked) => updateConfig('enableEmailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Notificações Push</Label>
              <p className="text-white/60 text-sm">Notificações em tempo real no dispositivo</p>
            </div>
            <Switch
              checked={config.enablePushNotifications}
              onCheckedChange={(checked) => updateConfig('enablePushNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Notificações SMS</Label>
              <p className="text-white/60 text-sm">Enviar alertas críticos por SMS</p>
            </div>
            <Switch
              checked={config.enableSmsNotifications}
              onCheckedChange={(checked) => updateConfig('enableSmsNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Timeout de Sessão (minutos)</Label>
              <Input
                type="number"
                value={config.sessionTimeoutMinutes}
                onChange={(e) => updateConfig('sessionTimeoutMinutes', Number(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
                min="15"
                max="480"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Máximo de Tentativas de Login</Label>
              <Input
                type="number"
                value={config.maxLoginAttempts}
                onChange={(e) => updateConfig('maxLoginAttempts', Number(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
                min="3"
                max="10"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Senhas Fortes</Label>
                <p className="text-white/60 text-xs">Exigir senhas complexas</p>
              </div>
              <Switch
                checked={config.requireStrongPasswords}
                onCheckedChange={(checked) => updateConfig('requireStrongPasswords', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Intervalo de Sincronização (minutos)</Label>
              <Input
                type="number"
                value={config.syncIntervalMinutes}
                onChange={(e) => updateConfig('syncIntervalMinutes', Number(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
                min="5"
                max="60"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Cache Timeout (minutos)</Label>
              <Input
                type="number"
                value={config.cacheTimeoutMinutes}
                onChange={(e) => updateConfig('cacheTimeoutMinutes', Number(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
                min="5"
                max="120"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Modo Offline</Label>
                <p className="text-white/60 text-xs">Funcionalidade offline</p>
              </div>
              <Switch
                checked={config.enableOfflineMode}
                onCheckedChange={(checked) => updateConfig('enableOfflineMode', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning about critical settings */}
      <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/30 backdrop-blur-xl border border-orange-400/50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-white mb-1">Configurações Críticas</h4>
              <p className="text-white/70 text-sm">
                Algumas configurações podem afetar significativamente o funcionamento do sistema. 
                Certifique-se de testar as alterações em um ambiente seguro antes de aplicar em produção.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
