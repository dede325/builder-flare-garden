import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Smartphone,
  BarChart3,
  Bot,
  Shield,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Download,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Clock,
  Activity,
  Lock,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  advancedFeaturesService,
  AdvancedFeaturesConfig,
  MobileFeaturesConfig,
  AnalyticsConfig,
  SmartAutomationConfig,
  AdvancedSecurityConfig,
} from "@/lib/advanced-features-service";
import { MobileFeaturesConfig as MobileFeaturesConfigComponent } from "@/components/MobileFeaturesConfig";
import { AdvancedAnalyticsDashboard } from "@/components/AdvancedAnalyticsDashboard";
import { MobileFeaturesShowcase } from "@/components/MobileFeaturesShowcase";
import { SmartAutomationDashboard } from "@/components/SmartAutomationDashboard";
import { AdvancedSecurityDashboard } from "@/components/AdvancedSecurityDashboard";

const CategoryIcons = {
  MOBILE: Smartphone,
  ANALYTICS: BarChart3,
  AUTOMATION: Bot,
  SECURITY: Shield,
};

const CategoryColors = {
  MOBILE: "from-blue-500 to-blue-600",
  ANALYTICS: "from-green-500 to-green-600",
  AUTOMATION: "from-purple-500 to-purple-600",
  SECURITY: "from-red-500 to-red-600",
};

export default function AdvancedFeatures() {
  const [configurations, setConfigurations] = useState<AdvancedFeaturesConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editingConfig, setEditingConfig] = useState<AdvancedFeaturesConfig | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setIsLoading(true);
    try {
      const configs = await advancedFeaturesService.getAllConfigurations();
      setConfigurations(configs);
    } catch (error) {
      console.error("Error loading configurations:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações avançadas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleConfiguration = async (id: string) => {
    try {
      const updatedConfig = await advancedFeaturesService.toggleConfiguration(
        id,
        user?.email || "user"
      );
      setConfigurations(prev =>
        prev.map(config => config.id === id ? updatedConfig : config)
      );
      toast({
        title: "Configuração atualizada",
        description: `${updatedConfig.name} foi ${updatedConfig.isActive ? "ativada" : "desativada"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateConfiguration = async (config: AdvancedFeaturesConfig) => {
    try {
      const updatedConfig = await advancedFeaturesService.updateConfiguration(
        config.id,
        config,
        user?.email || "user"
      );
      setConfigurations(prev =>
        prev.map(c => c.id === config.id ? updatedConfig : c)
      );
      setEditingConfig(null);
      toast({
        title: "Configuração salva",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfiguration = async (id: string) => {
    try {
      await advancedFeaturesService.deleteConfiguration(id);
      setConfigurations(prev => prev.filter(config => config.id !== id));
      toast({
        title: "Configuração removida",
        description: "A configuração foi removida com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover configuração",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleExportConfigurations = async () => {
    try {
      const exportData = await advancedFeaturesService.exportConfiguration();
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `advanced-features-config-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Configurações exportadas",
        description: "O arquivo de configurações foi baixado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar configurações",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleImportConfigurations = async () => {
    try {
      const imported = await advancedFeaturesService.importConfiguration(
        importData,
        user?.email || "user"
      );
      setConfigurations(imported);
      setShowImportDialog(false);
      setImportData("");
      toast({
        title: "Configurações importadas",
        description: "As configurações foram importadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao importar configurações",
        description: error.message || "Dados inválidos ou corrompidos.",
        variant: "destructive",
      });
    }
  };

  const handleResetToDefaults = async () => {
    try {
      const defaultConfigs = await advancedFeaturesService.resetToDefaults();
      setConfigurations(defaultConfigs);
      toast({
        title: "Configurações resetadas",
        description: "As configurações foram restauradas para os valores padrão.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao resetar configurações",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const getConfigurationStats = () => {
    const total = configurations.length;
    const active = configurations.filter(c => c.isActive).length;
    const byCategory = configurations.reduce((acc, config) => {
      acc[config.category] = (acc[config.category] || 0) + (config.isActive ? 1 : 0);
      return acc;
    }, {} as Record<string, number>);

    return { total, active, byCategory };
  };

  const stats = getConfigurationStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-aviation-gradient flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Carregando funcionalidades avançadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aviation-gradient">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-4">
            <Link to="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <Zap className="h-6 w-6 text-white" />
              <h1 className="text-2xl font-bold text-white">
                Funcionalidades Avançadas
              </h1>
            </div>
            <div className="flex-1" />
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleExportConfigurations}
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/30 text-white hover:bg-white/20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-aviation-gray-800 border-white/20">
                  <DialogHeader>
                    <DialogTitle className="text-white">Importar Configurações</DialogTitle>
                    <DialogDescription className="text-white/70">
                      Cole o JSON de configurações para importar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      className="aviation-input min-h-[200px]"
                      placeholder="Cole aqui o JSON das configurações..."
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowImportDialog(false)}
                        className="border-white/30 text-white hover:bg-white/20"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleImportConfigurations}
                        disabled={!importData.trim()}
                        className="aviation-button"
                      >
                        Importar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/30 text-white hover:bg-white/20"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resetar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-aviation-gray-800 border-white/20">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Resetar Configurações</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/70">
                      Tem certeza que deseja resetar todas as configurações para os valores padrão?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/30 text-white hover:bg-white/20">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetToDefaults}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Resetar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="glass-card border-white/20">
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-blue-200">Total de Funcionalidades</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/20">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-xs text-green-200">Ativas</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/20">
            <CardContent className="p-4 text-center">
              <Smartphone className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.byCategory.MOBILE || 0}</p>
              <p className="text-xs text-blue-200">Móveis</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/20">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.byCategory.ANALYTICS || 0}</p>
              <p className="text-xs text-green-200">Analytics</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/20">
            <CardContent className="p-4 text-center">
              <Shield className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.byCategory.SECURITY || 0}</p>
              <p className="text-xs text-red-200">Segurança</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-aviation-gray-700">
            <TabsTrigger value="overview" className="text-white">
              <Eye className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="mobile" className="text-white">
              <Smartphone className="h-4 w-4 mr-2" />
              Móveis
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="automation" className="text-white">
              <Bot className="h-4 w-4 mr-2" />
              Automação
            </TabsTrigger>
            <TabsTrigger value="security" className="text-white">
              <Shield className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configurations.map((config) => {
                const IconComponent = CategoryIcons[config.category];
                const colorClass = CategoryColors[config.category];
                
                return (
                  <Card key={config.id} className="glass-card border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClass}`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{config.name}</h3>
                            <Badge variant={config.isActive ? "default" : "secondary"}>
                              {config.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>
                        </div>
                        <Switch
                          checked={config.isActive}
                          onCheckedChange={() => handleToggleConfiguration(config.id)}
                        />
                      </div>
                      <p className="text-white/70 text-sm mb-4">{config.description}</p>
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>Atualizado por: {config.updatedBy}</span>
                        <span>{new Date(config.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Mobile Features Tab */}
          <TabsContent value="mobile" className="space-y-6 mt-6">
            <MobileFeaturesShowcase />
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Configuração Avançada</CardTitle>
                <CardDescription className="text-white/70">
                  Configure detalhadamente as funcionalidades móveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MobileFeaturesConfigComponent onConfigChange={(config) => {
                  console.log("Mobile config updated:", config);
                }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <AdvancedAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="automation" className="space-y-6 mt-6">
            <SmartAutomationDashboard />
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            <div className="text-center py-8">
              <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Segurança Avançada
              </h3>
              <p className="text-white/70 mb-6">
                2FA, SSO, auditoria avançada e backup automático
              </p>
              <Button className="aviation-button">
                <Settings className="h-4 w-4 mr-2" />
                Configurar Segurança
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
