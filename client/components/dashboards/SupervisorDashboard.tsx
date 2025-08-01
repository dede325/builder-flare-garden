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
  Eye,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Activity,
  Calendar,
  MapPin,
  User,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TeamMetrics {
  teamMembers: number;
  activeMembers: number;
  activeForms: number;
  completedToday: number;
  pendingAssignments: number;
  averageCompletionTime: number;
}

interface TeamActivity {
  id: string;
  employeeName: string;
  action: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'in_progress';
  formCode?: string;
  aircraft?: string;
}

export function SupervisorDashboard() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<TeamMetrics>({
    teamMembers: 0,
    activeMembers: 0,
    activeForms: 0,
    completedToday: 0,
    pendingAssignments: 0,
    averageCompletionTime: 45,
  });
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupervisorMetrics();
  }, []);

  const loadSupervisorMetrics = async () => {
    setLoading(true);
    try {
      const [employeesData, formsData, activitiesData] = await Promise.all([
        loadTeamMembers(),
        loadTeamForms(),
        loadTeamActivities(),
      ]);

      setMetrics({
        teamMembers: employeesData.total,
        activeMembers: employeesData.active,
        activeForms: formsData.active,
        completedToday: formsData.completedToday,
        pendingAssignments: formsData.pending,
        averageCompletionTime: 45,
      });

      setTeamActivities(activitiesData);
    } catch (error) {
      console.error("Error loading supervisor metrics:", error);
      toast({
        title: "Erro ao carregar métricas",
        description: "Falha ao carregar dados da equipe.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
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
      console.error("Error loading team members:", error);
    }
    return { total: 0, active: 0 };
  };

  const loadTeamForms = async () => {
    try {
      const savedForms = localStorage.getItem("cleaningForms");
      if (savedForms) {
        const forms = JSON.parse(savedForms);
        const today = new Date().toDateString();
        
        return {
          active: forms.filter((f: any) => 
            f.status === "in_progress" || f.status === "pending_signatures"
          ).length,
          completedToday: forms.filter((f: any) => 
            f.status === "completed" && 
            new Date(f.completedAt).toDateString() === today
          ).length,
          pending: forms.filter((f: any) => f.status === "draft").length,
        };
      }
    } catch (error) {
      console.error("Error loading team forms:", error);
    }
    return { active: 0, completedToday: 0, pending: 0 };
  };

  const loadTeamActivities = async (): Promise<TeamActivity[]> => {
    try {
      const savedForms = localStorage.getItem("cleaningForms");
      const savedEmployees = localStorage.getItem("aviation_employees");
      
      if (savedForms && savedEmployees) {
        const forms = JSON.parse(savedForms);
        const employees = JSON.parse(savedEmployees);
        
        const activities: TeamActivity[] = [];
        
        forms.slice(0, 10).forEach((form: any, index: number) => {
          const employee = employees.find((e: any) => e.id === form.assignedTo) || 
                          employees[index % employees.length];
          
          activities.push({
            id: `activity-${index}`,
            employeeName: employee?.name || "Funcionário Desconhecido",
            action: form.status === "completed" ? "Concluiu limpeza" : "Iniciou limpeza",
            timestamp: form.updatedAt || new Date().toISOString(),
            status: form.status as any,
            formCode: form.code,
            aircraft: form.aircraft?.registration || "N/A",
          });
        });
        
        return activities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    } catch (error) {
      console.error("Error loading team activities:", error);
    }
    return [];
  };

  const handleAssignTask = async () => {
    try {
      toast({
        title: "Atribuição de tarefa",
        description: "Interface de atribuição será aberta.",
      });
      // Here you would open a task assignment modal
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao abrir atribuição de tarefa.",
        variant: "destructive",
      });
    }
  };

  const handleViewTeamPerformance = async () => {
    try {
      toast({
        title: "Relatório de performance",
        description: "Carregando relatório detalhado da equipe.",
      });
      // Here you would navigate to a detailed performance view
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar relatório.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: TeamActivity['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${Math.floor(diffHours / 24)} dias atrás`;
  };

  const quickActions = [
    {
      title: "Nova Folha",
      description: "Criar nova folha de limpeza",
      icon: Plus,
      action: () => window.location.href = "/cleaning-forms",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Atribuir Tarefa",
      description: "Atribuir tarefa a funcionário",
      icon: Users,
      action: handleAssignTask,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Performance",
      description: "Ver performance da equipe",
      icon: TrendingUp,
      action: handleViewTeamPerformance,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Funcionários",
      description: "Gerenciar equipe",
      icon: User,
      action: () => window.location.href = "/employee-manager",
      color: "from-orange-500 to-orange-600",
    },
  ];

  if (!hasPermission("supervisor_dashboard")) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Acesso Restrito</h3>
        <p className="text-white/70">Você não tem permissão para acessar o dashboard de supervisor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supervisor Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="h-7 w-7 text-blue-400" />
            Dashboard Supervisor
          </h2>
          <p className="text-blue-200 mt-1">
            Supervisão da equipe e gestão de operações
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => loadSupervisorMetrics()}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Activity className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={handleAssignTask}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Atribuir Tarefa
          </Button>
        </div>
      </div>

      {/* Team Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Membros da Equipe</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.activeMembers}/{metrics.teamMembers}
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
                <p className="text-sm text-white/70">Folhas Ativas</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.activeForms}
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
                <p className="text-sm text-white/70">Concluídas Hoje</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.completedToday}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Tempo Médio</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.averageCompletionTime}min
                </p>
              </div>
              <Clock className="h-8 w-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Ações Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer touch-manipulation"
              onClick={action.action}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Team Activity & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade da Equipe
            </CardTitle>
            <CardDescription className="text-white/70">
              Últimas atividades dos funcionários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
            {teamActivities.length > 0 ? (
              teamActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  {getStatusIcon(activity.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {activity.employeeName}
                    </p>
                    <p className="text-white/70 text-xs">
                      {activity.action} {activity.formCode && `(${activity.formCode})`}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-blue-300 text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(activity.timestamp)}
                      </span>
                      {activity.aircraft && (
                        <span className="text-cyan-300 text-xs flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.aircraft}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/60 text-sm">Nenhuma atividade recente</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance da Equipe
            </CardTitle>
            <CardDescription className="text-white/70">
              Métricas de produtividade da equipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Taxa de Conclusão</span>
                <span className="text-white">87%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-[87%]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Qualidade Média</span>
                <span className="text-white">94%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-[94%]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Pontualidade</span>
                <span className="text-white">92%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full w-[92%]"></div>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10">
              <Button
                onClick={handleViewTeamPerformance}
                variant="outline"
                size="sm"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Ver Relatório Completo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programação de Hoje
          </CardTitle>
          <CardDescription className="text-white/70">
            Folhas agendadas e em andamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.pendingAssignments > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Manhã</span>
                  <Badge variant="default">{Math.ceil(metrics.pendingAssignments / 3)} tarefas</Badge>
                </div>
                <p className="text-sm text-white/70">08:00 - 12:00</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Tarde</span>
                  <Badge variant="secondary">{Math.floor(metrics.pendingAssignments / 3)} tarefas</Badge>
                </div>
                <p className="text-sm text-white/70">13:00 - 17:00</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Noite</span>
                  <Badge variant="outline" className="text-white border-white/20">
                    {Math.max(0, metrics.pendingAssignments - Math.ceil(metrics.pendingAssignments / 3) - Math.floor(metrics.pendingAssignments / 3))} tarefas
                  </Badge>
                </div>
                <p className="text-sm text-white/70">18:00 - 22:00</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhuma tarefa agendada para hoje</p>
              <Button
                onClick={handleAssignTask}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agendar Nova Tarefa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
