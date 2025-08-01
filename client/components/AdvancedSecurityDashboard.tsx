import { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Smartphone,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Database,
  Download,
  Upload,
  Settings,
  User,
  Building,
  Globe,
  FileText,
  Trash2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  advancedSecurityService,
  AuditLogEntry,
  SecurityEvent,
  BackupConfig,
  TwoFactorAuthConfig,
} from "@/lib/advanced-security-service";

export function AdvancedSecurityDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [backupConfigs, setBackupConfigs] = useState<BackupConfig[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);
  const [loadingAudit, setLoadingAudit] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      // Load audit logs
      const logs = await advancedSecurityService.getAuditLogs({ limit: 20 });
      setAuditLogs(logs);

      // Check security features status
      const twoFactorStatus = await advancedSecurityService.isTwoFactorEnabled();
      const ssoStatus = await advancedSecurityService.isSSOEnabled();
      
      setTwoFactorEnabled(twoFactorStatus);
      setSsoEnabled(ssoStatus);

      // Calculate security score
      let score = 0;
      if (twoFactorStatus) score += 25;
      if (ssoStatus) score += 20;
      score += 30; // Base security measures
      score += 15; // Audit logging (always on in demo)
      
      setSecurityScore(score);

      // Load mock security events
      const mockEvents: SecurityEvent[] = [
        {
          id: "evt-1",
          type: "failed_login",
          severity: "medium",
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          description: "Múltiplas tentativas de login falharam",
          details: { attempts: 3, ip: "192.168.1.100" },
          ipAddress: "192.168.1.100",
          resolved: false,
          actions: [],
        },
        {
          id: "evt-2",
          type: "suspicious_activity",
          severity: "high",
          timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
          description: "Acesso de localização incomum",
          details: { location: "Unknown City", country: "Unknown" },
          ipAddress: "203.0.113.1",
          resolved: true,
          resolvedAt: new Date(Date.now() - 60 * 60000).toISOString(),
          resolvedBy: "admin",
          actions: [],
        },
      ];
      setSecurityEvents(mockEvents);

      // Load mock backup configs
      const mockBackups: BackupConfig[] = [
        {
          id: "backup-1",
          name: "Backup Diário",
          frequency: "DAILY",
          regions: ["us-east-1", "eu-west-1"],
          encryption: true,
          verification: true,
          retention: 30,
          lastBackup: new Date(Date.now() - 12 * 60 * 60000).toISOString(),
          nextBackup: new Date(Date.now() + 12 * 60 * 60000).toISOString(),
          status: "active",
          isActive: true,
        },
      ];
      setBackupConfigs(mockBackups);

    } catch (error) {
      console.error("Error loading security data:", error);
    }
  };

  const handleSetup2FA = async () => {
    try {
      const userId = user?.id || user?.email || "demo-user";
      const result = await advancedSecurityService.setupTwoFactor(userId, ["AUTHENTICATOR", "SMS"]);
      
      setTwoFactorEnabled(true);
      setShowSetup2FA(false);
      
      toast({
        title: "2FA Configurado",
        description: "Autenticação de dois fatores ativada com sucesso",
      });
      
      await loadSecurityData();
    } catch (error) {
      toast({
        title: "Erro ao configurar 2FA",
        description: "Falha na configuração da autenticação de dois fatores",
        variant: "destructive",
      });
    }
  };

  const handleExecuteBackup = async (configId: string) => {
    try {
      await advancedSecurityService.executeBackup(configId);
      toast({
        title: "Backup Iniciado",
        description: "Backup sendo executado em background",
      });
      await loadSecurityData();
    } catch (error) {
      toast({
        title: "Erro no Backup",
        description: "Falha ao executar backup",
        variant: "destructive",
      });
    }
  };

  const handleResolveSecurityEvent = async (eventId: string) => {
    try {
      await advancedSecurityService.resolveSecurityEvent(eventId, user?.email || "admin");
      toast({
        title: "Evento Resolvido",
        description: "Evento de segurança marcado como resolvido",
      });
      await loadSecurityData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao resolver evento de segurança",
        variant: "destructive",
      });
    }
  };

  const handleExportAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const csvData = await advancedSecurityService.exportAuditLogs("CSV");
      
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Logs Exportados",
        description: "Logs de auditoria exportados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description: "Falha ao exportar logs de auditoria",
        variant: "destructive",
      });
    } finally {
      setLoadingAudit(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-400 bg-red-500/20 border-red-400/50";
      case "high":
        return "text-orange-400 bg-orange-500/20 border-orange-400/50";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-400/50";
      default:
        return "text-blue-400 bg-blue-500/20 border-blue-400/50";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-7 w-7 text-red-400" />
            Segurança Avançada
          </h2>
          <p className="text-blue-200 mt-1">
            2FA, SSO, auditoria e backup automático
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={`${getScoreColor(securityScore)} border-current`}>
            <Shield className="h-3 w-3 mr-1" />
            Score: {securityScore}/100
          </Badge>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">2FA Status</p>
                <p className="text-lg font-bold text-white">
                  {twoFactorEnabled ? "Ativado" : "Desativado"}
                </p>
              </div>
              <Key className={`h-8 w-8 ${twoFactorEnabled ? "text-green-400" : "text-red-400"}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">SSO Status</p>
                <p className="text-lg font-bold text-white">
                  {ssoEnabled ? "Configurado" : "Inativo"}
                </p>
              </div>
              <Building className={`h-8 w-8 ${ssoEnabled ? "text-green-400" : "text-gray-400"}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Eventos Ativos</p>
                <p className="text-lg font-bold text-white">
                  {securityEvents.filter(e => !e.resolved).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Últimos Logs</p>
                <p className="text-lg font-bold text-white">{auditLogs.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-aviation-gray-700">
          <TabsTrigger value="overview" className="text-white">
            <Shield className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="2fa" className="text-white">
            <Key className="h-4 w-4 mr-2" />
            2FA & SSO
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-white">
            <FileText className="h-4 w-4 mr-2" />
            Auditoria
          </TabsTrigger>
          <TabsTrigger value="events" className="text-white">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="backup" className="text-white">
            <Database className="h-4 w-4 mr-2" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Status de Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-blue-400" />
                    <span className="text-white">Autenticação 2FA</span>
                  </div>
                  {twoFactorEnabled ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-blue-400" />
                    <span className="text-white">Single Sign-On</span>
                  </div>
                  {ssoEnabled ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <span className="text-white">Logs de Auditoria</span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-blue-400" />
                    <span className="text-white">Backup Automático</span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!twoFactorEnabled && (
                  <Button
                    onClick={() => setShowSetup2FA(true)}
                    className="w-full aviation-button"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Configurar 2FA
                  </Button>
                )}
                <Button
                  onClick={handleExportAuditLogs}
                  disabled={loadingAudit}
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/20"
                >
                  {loadingAudit ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Exportar Logs
                </Button>
                <Button
                  onClick={() => handleExecuteBackup("backup-1")}
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/20"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Backup Manual
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2FA & SSO Tab */}
        <TabsContent value="2fa" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Autenticação de Dois Fatores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Status 2FA:</span>
                  <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
                    {twoFactorEnabled ? "Ativado" : "Desativado"}
                  </Badge>
                </div>
                {twoFactorEnabled ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-400/30">
                      <CheckCircle className="h-5 w-5 text-green-400 mb-2" />
                      <p className="text-green-300 text-sm">2FA está ativo para sua conta</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-red-400/50 text-red-300 hover:bg-red-500/20"
                    >
                      Desativar 2FA
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowSetup2FA(true)}
                    className="w-full aviation-button"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Configurar 2FA
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Single Sign-On (SSO)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Status SSO:</span>
                  <Badge variant={ssoEnabled ? "default" : "secondary"}>
                    {ssoEnabled ? "Configurado" : "Inativo"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-white text-sm">Provedor:</Label>
                  <Select disabled={!ssoEnabled}>
                    <SelectTrigger className="aviation-input">
                      <SelectValue placeholder="Selecionar provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Workspace</SelectItem>
                      <SelectItem value="microsoft">Microsoft Azure</SelectItem>
                      <SelectItem value="okta">Okta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  disabled
                  variant="outline"
                  className="w-full border-white/30 text-white/50"
                >
                  Configurar SSO (Em Breve)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6 mt-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Logs de Auditoria</span>
                <Button
                  onClick={handleExportAuditLogs}
                  disabled={loadingAudit}
                  size="sm"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/20"
                >
                  {loadingAudit ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Exportar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                          <span className="text-white font-medium text-sm">{log.action}</span>
                        </div>
                        <p className="text-white/70 text-xs">
                          Usuário: {log.userEmail} • Recurso: {log.resource}
                        </p>
                        <p className="text-white/60 text-xs">IP: {log.ipAddress}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/50 text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-400 ml-auto mt-1" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 ml-auto mt-1" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-6 mt-6">
          <div className="space-y-4">
            {securityEvents.map((event) => (
              <Card key={event.id} className="glass-card border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <span className="text-white font-medium">{event.type.replace("_", " ")}</span>
                        {event.resolved && (
                          <Badge variant="outline" className="text-green-300 border-green-400/50">
                            Resolvido
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/70 text-sm mb-1">{event.description}</p>
                      <p className="text-white/50 text-xs">
                        {new Date(event.timestamp).toLocaleString()} • IP: {event.ipAddress}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!event.resolved && (
                        <Button
                          onClick={() => handleResolveSecurityEvent(event.id)}
                          size="sm"
                          className="aviation-button"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-6 mt-6">
          <div className="space-y-4">
            {backupConfigs.map((config) => (
              <Card key={config.id} className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{config.name}</span>
                    <Badge variant={config.status === "active" ? "default" : "secondary"}>
                      {config.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-white/70">Frequência:</span>
                      <p className="text-white font-medium">{config.frequency}</p>
                    </div>
                    <div>
                      <span className="text-white/70">Regiões:</span>
                      <p className="text-white font-medium">{config.regions.length}</p>
                    </div>
                    <div>
                      <span className="text-white/70">Último Backup:</span>
                      <p className="text-white font-medium">
                        {config.lastBackup 
                          ? new Date(config.lastBackup).toLocaleDateString()
                          : "Nunca"
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-white/70">Próximo Backup:</span>
                      <p className="text-white font-medium">
                        {config.nextBackup 
                          ? new Date(config.nextBackup).toLocaleDateString()
                          : "N/A"
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {config.encryption && (
                      <Badge variant="outline" className="text-green-300 border-green-400/50">
                        <Lock className="h-3 w-3 mr-1" />
                        Criptografado
                      </Badge>
                    )}
                    {config.verification && (
                      <Badge variant="outline" className="text-blue-300 border-blue-400/50">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => handleExecuteBackup(config.id)}
                    className="aviation-button"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Executar Backup
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 2FA Setup Dialog */}
      <Dialog open={showSetup2FA} onOpenChange={setShowSetup2FA}>
        <DialogContent className="max-w-md bg-aviation-gray-800 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Configurar Autenticação 2FA</DialogTitle>
            <DialogDescription className="text-white/70">
              Adicione uma camada extra de segurança à sua conta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Key className="h-12 w-12 text-blue-400 mx-auto mb-3" />
              <p className="text-white text-sm">
                Configure seu app authenticator favorito (Google Authenticator, Authy, etc.)
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSetup2FA(false)}
                className="flex-1 border-white/30 text-white hover:bg-white/20"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSetup2FA}
                className="flex-1 aviation-button"
              >
                Configurar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
