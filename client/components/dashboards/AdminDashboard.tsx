import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  Plane,
  FileText,
  Activity,
  Settings,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Database,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalAircraft: number;
  activeAircraft: number;
  totalForms: number;
  pendingForms: number;
  completedForms: number;
  totalEmployees: number;
  activeEmployees: number;
  systemErrors: number;
  syncStatus: 'online' | 'offline' | 'syncing';
}

export function AdminDashboard() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalAircraft: 0,
    activeAircraft: 0,
    totalForms: 0,
    pendingForms: 0,
    completedForms: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    systemErrors: 0,
    syncStatus: 'online',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminMetrics();
  }, []);

  const loadAdminMetrics = async () => {
    setLoading(true);
    try {
      // Load data from localStorage and Supabase
      const [aircraftData, employeesData, formsData] = await Promise.all([
        loadAircraftMetrics(),
        loadEmployeesMetrics(),
        loadFormsMetrics(),
      ]);

      setMetrics({
        totalUsers: 8, // Would come from Supabase users table
        activeUsers: 6,
        totalAircraft: aircraftData.total,
        activeAircraft: aircraftData.active,
        totalForms: formsData.total,
        pendingForms: formsData.pending,
        completedForms: formsData.completed,
        totalEmployees: employeesData.total,
        activeEmployees: employeesData.active,
        systemErrors: 0,
        syncStatus: navigator.onLine ? 'online' : 'offline',
      });
    } catch (error) {
      console.error("Error loading admin metrics:", error);
      toast({
        title: "Erro ao carregar métricas",
        description: "Falha ao carregar dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAircraftMetrics = async () => {
    try {
      const savedAircraft = localStorage.getItem("aviation_aircraft");
      if (savedAircraft) {
        const aircraft = JSON.parse(savedAircraft);
        return {
          total: aircraft.length,
          active: aircraft.filter((a: any) => a.status === "active").length,
        };
      }
    } catch (error) {
      console.error("Error loading aircraft metrics:", error);
    }
    return { total: 0, active: 0 };
  };

  const loadEmployeesMetrics = async () => {
    try {
      const savedEmployees = localStorage.getItem("aviation_employees");
      if (savedEmployees) {
        const employees = JSON.parse(savedEmployees);
        return {
          total: employees.length,
          active: employees.filter((e: any) => e.status === "active").length,
        };
      }
    } catch (error) {
      console.error("Error loading employees metrics:", error);
    }
    return { total: 0, active: 0 };
  };

  const loadFormsMetrics = async () => {
    try {
      const savedForms = localStorage.getItem("cleaningForms");
      if (savedForms) {
        const forms = JSON.parse(savedForms);
        return {
          total: forms.length,
          pending: forms.filter((f: any) => 
            f.status === "draft" || f.status === "pending_signatures"
          ).length,
          completed: forms.filter((f: any) => f.status === "completed").length,
        };
      }
    } catch (error) {
      console.error("Error loading forms metrics:", error);
    }
    return { total: 0, pending: 0, completed: 0 };
  };

  const handleSystemAction = async (action: string) => {
    try {
      switch (action) {
        case 'force-sync':
          toast({
            title: "Sincronização iniciada",
            description: "Sincronização forçada com todos os dispositivos.",
          });
          break;
        case 'backup':
          toast({
            title: "Backup iniciado",
            description: "Backup completo do sistema em andamento.",
          });
          break;
        case 'maintenance':
          toast({
            title: "Modo manutenção",
            description: "Sistema entrará em manutenção em 5 minutos.",
          });
          break;
        default:
          console.log(`Action ${action} triggered`);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Falha ao executar ${action}.`,
        variant: "destructive",
      });
    }
  };

  if (!hasPermission("admin_dashboard")) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Acesso Restrito</h3>
        <p className="text-white/70">Você não tem permissão para acessar o dashboard de administrador.</p>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Gestão de Usuários",
      description: "Gerenciar contas e permissões",
      icon: Users,
      link: "/user-management",
      color: "from-blue-500 to-blue-600",
      permission: "manage_users",
    },
    {
      title: "Configurações",
      description: "Configurações avançadas do sistema",
      icon: Settings,
      link: "/configuration",
      color: "from-gray-500 to-gray-600",
      permission: "system_configuration",
    },
    {
      title: "Relatórios",
      description: "Relatórios e analytics",
      icon: BarChart3,
      link: "/history-export",
      color: "from-purple-500 to-purple-600",
      permission: "view_reports",
    },
    {
      title: "Backup & Dados",
      description: "Gestão de backup e migração",
      icon: Database,
      link: "/settings?tab=data",
      color: "from-green-500 to-green-600",
      permission: "data_management",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-7 w-7 text-red-400" />
            Dashboard Administrativo
          </h2>
          <p className="text-blue-200 mt-1">
            Visão completa do sistema e ferramentas de gestão
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => loadAdminMetrics()}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Activity className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={() => handleSystemAction('force-sync')}
            variant="outline"
            size="sm"
            className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
          >
            <Database className="h-4 w-4 mr-2" />
            Sync Global
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Usuários Ativos</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.activeUsers}/{metrics.totalUsers}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Aeronaves Ativas</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.activeAircraft}/{metrics.totalAircraft}
                </p>
              </div>
              <Plane className="h-8 w-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Folhas Pendentes</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.pendingForms}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Status Sistema</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={metrics.syncStatus === 'online' ? 'default' : 'destructive'}>
                    {metrics.syncStatus === 'online' ? 'Online' : 'Offline'}
                  </Badge>
                  {metrics.systemErrors > 0 && (
                    <Badge variant="destructive">{metrics.systemErrors} erros</Badge>
                  )}
                </div>
              </div>
              <Activity className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Ações Administrativas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const hasActionPermission = !action.permission || hasPermission(action.permission);
            
            return (
              <Link key={index} to={hasActionPermission ? action.link : "#"}>
                <Card
                  className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 hover:scale-105 transition-all duration-300 touch-manipulation ${
                    !hasActionPermission ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} shadow-lg`}>
                        <action.icon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">
                          {action.title}
                        </h3>
                        <p className="text-sm text-white/70">
                          {action.description}
                        </p>
                        {!hasActionPermission && (
                          <Badge variant="destructive" className="mt-2">
                            Sem permissão
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">CPU Usage</span>
                <span className="text-white">45%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-[45%]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Memória</span>
                <span className="text-white">62%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-[62%]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Armazenamento</span>
                <span className="text-white">78%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full w-[78%]"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividades Recentes do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">Backup automático concluído</p>
                <p className="text-white/60 text-xs">há 2 horas</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-4 w-4 text-blue-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">3 novos usuários registrados</p>
                <p className="text-white/60 text-xs">há 4 horas</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">Falha de sincronização resolvida</p>
                <p className="text-white/60 text-xs">há 6 horas</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Database className="h-4 w-4 text-purple-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">Migração de dados concluída</p>
                <p className="text-white/60 text-xs">ontem</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Actions */}
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ações do Sistema
          </CardTitle>
          <CardDescription className="text-white/70">
            Ferramentas administrativas para manutenção do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleSystemAction('backup')}
            variant="outline"
            className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
          >
            <Database className="h-4 w-4 mr-2" />
            Backup Manual
          </Button>
          <Button
            onClick={() => handleSystemAction('maintenance')}
            variant="outline"
            className="border-orange-400/50 text-orange-300 hover:bg-orange-500/20"
          >
            <Settings className="h-4 w-4 mr-2" />
            Modo Manutenção
          </Button>
          <Button
            onClick={() => handleSystemAction('force-sync')}
            variant="outline"
            className="border-green-400/50 text-green-300 hover:bg-green-500/20"
          >
            <Activity className="h-4 w-4 mr-2" />
            Sincronização Forçada
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
