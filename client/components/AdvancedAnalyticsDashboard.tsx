import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Clock,
  Award,
  AlertTriangle,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Target,
  CheckCircle,
  XCircle,
  Mail,
  FileText,
  Settings,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  analyticsService,
  MetricData,
  PerformanceMetric,
  TeamMetric,
  LocationMetric,
  ComplianceAlert,
  ReportTemplate,
} from "@/lib/analytics-service";

interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

export function AdvancedAnalyticsDashboard({ className }: AdvancedAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [employeePerformance, setEmployeePerformance] = useState<PerformanceMetric[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetric[]>([]);
  const [locationMetrics, setLocationMetrics] = useState<LocationMetric[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [showCreateReportDialog, setShowCreateReportDialog] = useState(false);
  const [newReportTemplate, setNewReportTemplate] = useState<Partial<ReportTemplate>>({
    name: "",
    description: "",
    type: "monthly",
    format: "PDF",
    sections: [],
    recipients: [],
    isActive: true,
  });

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [
        metricsData,
        employeeData,
        teamData,
        locationData,
        alertsData,
        templatesData,
      ] = await Promise.all([
        analyticsService.calculateExecutiveMetrics(),
        analyticsService.calculateEmployeePerformance(),
        analyticsService.calculateTeamMetrics(),
        analyticsService.calculateLocationMetrics(),
        analyticsService.generateComplianceAlerts(),
        analyticsService.getReportTemplates(),
      ]);

      setMetrics(metricsData);
      setEmployeePerformance(employeeData);
      setTeamMetrics(teamData);
      setLocationMetrics(locationData);
      setComplianceAlerts(alertsData);
      setReportTemplates(templatesData);
    } catch (error) {
      console.error("Error loading analytics data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de analytics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast({
      title: "Dados atualizados",
      description: "Os dados de analytics foram atualizados com sucesso.",
    });
  };

  const handleGenerateReport = async (templateId: string) => {
    try {
      const report = await analyticsService.generateReport(templateId);
      toast({
        title: "Relatório gerado",
        description: `O relatório "${report.title}" foi gerado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleCreateReportTemplate = async () => {
    try {
      if (!newReportTemplate.name || !newReportTemplate.description) {
        toast({
          title: "Dados incompletos",
          description: "Nome e descrição são obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      await analyticsService.createReportTemplate(newReportTemplate as Omit<ReportTemplate, "id" | "createdAt" | "updatedAt">);
      
      setShowCreateReportDialog(false);
      setNewReportTemplate({
        name: "",
        description: "",
        type: "monthly",
        format: "PDF",
        sections: [],
        recipients: [],
        isActive: true,
      });
      
      await loadAllData();
      
      toast({
        title: "Template criado",
        description: "O template de relatório foi criado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar template",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === "%") {
      return `${value.toFixed(1)}%`;
    }
    if (unit === "min") {
      return `${value.toFixed(0)} min`;
    }
    return `${value.toFixed(0)} ${unit}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <BarChart3 className="h-8 w-8 text-white animate-pulse mr-3" />
        <span className="text-white">Carregando analytics...</span>
      </div>
    );
  }

  const criticalAlerts = complianceAlerts.filter(a => a.severity === "critical").length;
  const highAlerts = complianceAlerts.filter(a => a.severity === "high").length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Executivo</h2>
          <p className="text-white/70">Métricas e análises avançadas do sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32 aviation-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.slice(0, 4).map((metric) => (
          <Card key={metric.id} className="glass-card border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">{metric.name}</p>
                  <p className="text-2xl font-bold text-white">
                    {formatValue(metric.value, metric.unit)}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                  <Badge variant={metric.category === "quality" ? "default" : "secondary"}>
                    {metric.category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Banner */}
      {(criticalAlerts > 0 || highAlerts > 0) && (
        <Card className="glass-card border-red-400/50 bg-red-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <div>
                  <p className="text-red-300 font-medium">Alertas de Conformidade</p>
                  <p className="text-red-200 text-sm">
                    {criticalAlerts} críticos, {highAlerts} altos - Requer atenção imediata
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setActiveTab("alerts")}
                variant="outline"
                size="sm"
                className="border-red-400/50 text-red-300 hover:bg-red-500/20"
              >
                Ver Alertas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-aviation-gray-700">
          <TabsTrigger value="overview" className="text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-white">
            <Users className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="teams" className="text-white">
            <Target className="h-4 w-4 mr-2" />
            Equipes
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-white">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-white">
            <FileText className="h-4 w-4 mr-2" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Metrics Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Métricas Principais</h3>
              {metrics.map((metric) => (
                <Card key={metric.id} className="glass-card border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{metric.name}</p>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="flex items-end space-x-2">
                      <p className="text-2xl font-bold text-white">
                        {formatValue(metric.value, metric.unit)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {metric.category}
                      </Badge>
                    </div>
                    {metric.unit === "%" && (
                      <Progress value={metric.value} className="mt-2 h-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Location Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Métricas por Local</h3>
              {locationMetrics.map((location) => (
                <Card key={location.locationId} className="glass-card border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">{location.locationName}</h4>
                      <Badge variant={location.maintenanceAlerts > 0 ? "destructive" : "default"}>
                        {location.totalActivities} atividades
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Tempo médio</span>
                        <span className="text-white">{location.averageCompletionTime.toFixed(0)} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Utilização</span>
                        <span className="text-white">{location.utilizationRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={location.utilizationRate} className="h-1" />
                      {location.maintenanceAlerts > 0 && (
                        <div className="flex items-center space-x-1 text-yellow-400 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{location.maintenanceAlerts} alertas de manutenção</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {employeePerformance.map((employee) => (
              <Card key={employee.employeeId} className="glass-card border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">{employee.employeeName}</h4>
                    <Badge variant="outline">
                      {employee.completedForms} formulários
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Tempo médio</span>
                      <span className="text-white">{employee.averageTime.toFixed(0)} min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Qualidade</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-white">{employee.qualityScore.toFixed(1)}%</span>
                        {getTrendIcon(employee.trends.qualityTrend)}
                      </div>
                    </div>
                    <Progress value={employee.qualityScore} className="h-1" />
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Eficiência</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-white">{employee.efficiency.toFixed(1)}%</span>
                        {getTrendIcon(employee.trends.efficiencyTrend)}
                      </div>
                    </div>
                    <Progress value={employee.efficiency} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamMetrics.map((team) => (
              <Card key={team.teamId} className="glass-card border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{team.teamName}</CardTitle>
                    <Badge variant="outline">
                      {team.memberCount} membros
                    </Badge>
                  </div>
                  <CardDescription className="text-white/70">
                    Performance da equipe nos últimos {team.period}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{team.totalCompletedForms}</p>
                        <p className="text-xs text-white/70">Formulários Concluídos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{team.slaCompliance.toFixed(1)}%</p>
                        <p className="text-xs text-white/70">Conformidade SLA</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Qualidade Média</span>
                        <span className="text-white">{team.averageQualityScore.toFixed(1)}%</span>
                      </div>
                      <Progress value={team.averageQualityScore} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Eficiência Média</span>
                        <span className="text-white">{team.averageEfficiency.toFixed(1)}%</span>
                      </div>
                      <Progress value={team.averageEfficiency} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6 mt-6">
          <div className="space-y-4">
            {complianceAlerts.length === 0 ? (
              <Card className="glass-card border-white/20">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhum Alerta Ativo
                  </h3>
                  <p className="text-white/70">
                    Todos os indicadores estão dentro dos parâmetros esperados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              complianceAlerts.map((alert) => (
                <Card key={alert.id} className="glass-card border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{alert.title}</h4>
                          <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-white/70 text-sm mb-2">{alert.description}</p>
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>Limite: {alert.threshold} | Atual: {alert.actualValue.toFixed(1)}</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Templates de Relatório</h3>
            <Dialog open={showCreateReportDialog} onOpenChange={setShowCreateReportDialog}>
              <DialogTrigger asChild>
                <Button className="aviation-button">
                  <FileText className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-aviation-gray-800 border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Criar Template de Relatório</DialogTitle>
                  <DialogDescription className="text-white/70">
                    Configure um novo template para geração automática de relatórios
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Nome</Label>
                    <Input
                      value={newReportTemplate.name || ""}
                      onChange={(e) => setNewReportTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="aviation-input"
                      placeholder="Nome do relatório"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Descrição</Label>
                    <Textarea
                      value={newReportTemplate.description || ""}
                      onChange={(e) => setNewReportTemplate(prev => ({ ...prev, description: e.target.value }))}
                      className="aviation-input"
                      placeholder="Descrição do relatório"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Tipo</Label>
                      <Select
                        value={newReportTemplate.type}
                        onValueChange={(value) => setNewReportTemplate(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger className="aviation-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Formato</Label>
                      <Select
                        value={newReportTemplate.format}
                        onValueChange={(value) => setNewReportTemplate(prev => ({ ...prev, format: value as any }))}
                      >
                        <SelectTrigger className="aviation-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PDF">PDF</SelectItem>
                          <SelectItem value="CSV">CSV</SelectItem>
                          <SelectItem value="EXCEL">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateReportDialog(false)}
                      className="border-white/30 text-white hover:bg-white/20"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateReportTemplate} className="aviation-button">
                      Criar Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="glass-card border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">{template.name}</h4>
                      <p className="text-white/70 text-sm">{template.description}</p>
                    </div>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                    <span>Formato: {template.format}</span>
                    <span>Seções: {template.sections.length}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleGenerateReport(template.id)}
                      size="sm"
                      className="aviation-button flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Gerar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white/20"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
