import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plane,
  Users,
  FileText,
  Activity,
  Shield,
  Cloud,
  Wifi,
  WifiOff,
  LogOut,
  Settings,
  Menu,
  X,
  Home,
  History,
  Download,
  RefreshCw,
  Plus,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MigrationNotification } from "@/components/MigrationNotification";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";

export default function Index() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [systemStats, setSystemStats] = useState({
    aircraft: 0,
    employees: 0,
    activeForms: 0,
    completedForms: 0,
  });
  const { user: authUser, signOut } = useAuth();

  // Fallback user data for demo mode
  const user = authUser
    ? {
        name:
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "Usuário",
        role: authUser.user_metadata?.role || "Gestor de Operações",
        email: authUser.email,
      }
    : {
        name: "João Silva",
        role: "Gestor de Operações",
        email: "demo@aviation.com",
      };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSync = () => {
    // Simulate sync action
    console.log("Sincronizando dados...");
  };

  useEffect(() => {
    let isMounted = true;

    const loadSystemStatsAsync = () => {
      try {
        const savedAircraft = localStorage.getItem("aviation_aircraft");
        const aircraftCount = savedAircraft
          ? JSON.parse(savedAircraft).filter((a: any) => a.status === "active")
              .length
          : 0;

        const savedEmployees = localStorage.getItem("aviation_employees");
        const employeesCount = savedEmployees
          ? JSON.parse(savedEmployees).filter((e: any) => e.status === "active")
              .length
          : 0;

        const savedForms = localStorage.getItem("cleaningForms");
        const forms = savedForms ? JSON.parse(savedForms) : [];
        const activeForms = forms.filter(
          (f: any) => f.status === "draft" || f.status === "pending_signatures",
        ).length;
        const completedForms = forms.filter(
          (f: any) => f.status === "completed",
        ).length;

        if (isMounted) {
          setSystemStats({
            aircraft: aircraftCount,
            employees: employeesCount,
            activeForms,
            completedForms,
          });
        }
      } catch (error) {
        console.error("Error loading system stats:", error);
      }
    };

    const handleOnlineStatus = () => {
      if (isMounted) {
        setIsOnline(navigator.onLine);
      }
    };

    loadSystemStatsAsync();
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  const getRecentActivities = () => {
    const activities = [];
    const savedForms = localStorage.getItem("cleaningForms");
    if (savedForms) {
      const forms = JSON.parse(savedForms);
      const recentForms = forms
        .sort(
          (a: any, b: any) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 5);

      recentForms.forEach((form: any, index: number) => {
        const timeAgo = getTimeAgo(form.updatedAt);
        activities.push({
          id: `form-${index}`,
          action: `Folha ${form.code} - ${form.status === "completed" ? "Concluída" : "Atualizada"}`,
          time: timeAgo,
          type: "form",
        });
      });
    }

    return activities.length > 0
      ? activities
      : [
          { id: 1, action: "Sistema iniciado", time: "Agora", type: "system" },
          {
            id: 2,
            action: "Aguardando atividade do usuário",
            time: "Agora",
            type: "system",
          },
        ];
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays} dias atrás`;
  };

  const recentActivities = getRecentActivities();

  // Mobile tabs configuration
  const tabs = [
    { id: "home", label: "Início", icon: Home },
    { id: "history", label: "Histórico", icon: History },
  ];

  // Main action buttons for mobile
  const mainActions = [
    {
      title: "Nova Folha",
      description: "Criar nova folha de limpeza",
      icon: Plus,
      link: "/cleaning-forms",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-500/20 to-blue-600/30",
      borderColor: "border-blue-400/50",
      textColor: "text-blue-300",
    },
    {
      title: "Aeronaves",
      description: "Gestão da frota",
      icon: Plane,
      link: "/aircraft-manager",
      gradient: "from-cyan-500 to-cyan-600",
      bgGradient: "from-cyan-500/20 to-cyan-600/30",
      borderColor: "border-cyan-400/50",
      textColor: "text-cyan-300",
    },
    {
      title: "Funcionários",
      description: "Equipe de limpeza",
      icon: Users,
      link: "/employee-manager",
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-500/20 to-emerald-600/30",
      borderColor: "border-emerald-400/50",
      textColor: "text-emerald-300",
    },
    {
      title: "Utilizadores",
      description: "Gestão de acesso",
      icon: Shield,
      link: "/user-management",
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-500/20 to-orange-600/30",
      borderColor: "border-orange-400/50",
      textColor: "text-orange-300",
    },
    {
      title: "Histórico",
      description: "Histórico e exportação",
      icon: History,
      link: "/history-export",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-500/20 to-purple-600/30",
      borderColor: "border-purple-400/50",
      textColor: "text-purple-300",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900/95 to-blue-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-white/10 lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <Plane className="h-7 w-7 text-blue-400" />
            <h1 className="text-lg font-bold text-white">AviationOps</h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* Intelligent Sync Status */}
            <SyncStatusIndicator compact={true} />

            {/* User Avatar */}
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-gradient-to-r from-slate-900 to-blue-900 border-t border-white/10">
            <div className="px-4 py-4 space-y-3">
              <div className="text-center border-b border-white/10 pb-3">
                <p className="text-sm text-white font-medium">{user.name}</p>
                <p className="text-xs text-blue-300">{user.role}</p>
              </div>
              
              <Link 
                to="/settings" 
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="h-5 w-5 text-blue-300" />
                <span className="text-white">Configurações</span>
              </Link>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors w-full text-left"
              >
                <LogOut className="h-5 w-5 text-red-400" />
                <span className="text-white">Sair</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pb-20 lg:pb-8">
        {/* Migration Notification */}
        <div className="px-4 pt-4">
          <MigrationNotification className="mb-4" />
        </div>

        {/* Tab Content */}
        {activeTab === "home" && (
          <div className="px-4 space-y-6">
            {/* Welcome Section */}
            <div className="text-center py-6">
              <h2 className="text-2xl lg:text-4xl font-bold text-white mb-2">
                Bem-vindo ao AviationOps
              </h2>
              <p className="text-blue-200 text-sm lg:text-lg">
                Gestão completa de limpeza de aeronaves
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
                <CardContent className="p-4 text-center">
                  <Plane className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{systemStats.aircraft}</p>
                  <p className="text-xs text-blue-200">Aeronaves</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{systemStats.employees}</p>
                  <p className="text-xs text-emerald-200">Funcionários</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
                <CardContent className="p-4 text-center">
                  <FileText className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{systemStats.activeForms}</p>
                  <p className="text-xs text-orange-200">Folhas Abertas</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
                <CardContent className="p-4 text-center">
                  <Activity className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{systemStats.completedForms}</p>
                  <p className="text-xs text-cyan-200">Concluídas</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Ações Principais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mainActions.map((action, index) => (
                  <Link key={index} to={action.link}>
                    <Card className={`bg-gradient-to-br ${action.bgGradient} backdrop-blur-xl border ${action.borderColor} hover:scale-105 transition-all duration-300 touch-manipulation`}>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg`}>
                            <action.icon className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1">
                              {action.title}
                            </h3>
                            <p className={`text-sm ${action.textColor}`}>
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Intelligent Sync Status */}
            <SyncStatusIndicator showManualSync={true} />
          </div>
        )}

        {activeTab === "history" && (
          <div className="px-4 space-y-6">
            <div className="text-center py-6">
              <h2 className="text-2xl font-bold text-white mb-2">Histórico e Exportação</h2>
              <p className="text-blue-200 text-sm">
                Visualize e exporte dados de limpeza
              </p>
            </div>

            {/* Quick Access to History Export Panel */}
            <Link to="/history-export">
              <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 backdrop-blur-xl border border-purple-400/50 hover:scale-105 transition-all duration-300 touch-manipulation">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                      <History className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">
                        Painel de Histórico
                      </h3>
                      <p className="text-sm text-purple-300">
                        Acesse o painel completo de histórico e exportação
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Export Options Quick Access */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
                <CardContent className="p-4 text-center">
                  <Download className="h-6 w-6 text-green-400 mx-auto mb-2" />
                  <p className="text-lg font-bold text-white">Exportar</p>
                  <p className="text-xs text-green-200">CSV e ZIP disponíveis</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
                <CardContent className="p-4 text-center">
                  <FileText className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-lg font-bold text-white">Filtros</p>
                  <p className="text-xs text-blue-200">Data, local, funcionário</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Atividades Recentes</h3>
              {recentActivities.map((activity) => (
                <Card key={activity.id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="h-2 w-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium break-words">
                          {activity.action}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-3 w-3 text-blue-300" />
                          <p className="text-blue-200 text-xs">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Tab Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/95 to-blue-900/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg transition-all duration-200 touch-manipulation ${
                activeTab === tab.id
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
