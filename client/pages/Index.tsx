import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Users, CheckSquare, FileText, Activity, Shield, Cloud, Wifi, WifiOff, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Index() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user: authUser, signOut } = useAuth();

  // Fallback user data for demo mode
  const user = authUser
    ? {
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
        role: authUser.user_metadata?.role || 'Gestor de Operações',
        email: authUser.email
      }
    : { name: 'João Silva', role: 'Gestor de Operações', email: 'demo@aviation.com' };

  const handleSignOut = async () => {
    await signOut();
  };

  // Mock data for demonstration
  const stats = [
    { title: 'Aeronaves Ativas', value: '12', icon: Plane, change: '+2' },
    { title: 'Funcionários', value: '48', icon: Users, change: '+3' },
    { title: 'Tarefas Pendentes', value: '23', icon: CheckSquare, change: '-5' },
    { title: 'Folhas Abertas', value: '8', icon: FileText, change: '+1' },
  ];

  const recentActivities = [
    { id: 1, action: 'Aeronave PT-ABC inspecionada', time: '2 min atrás', type: 'aircraft' },
    { id: 2, action: 'Nova tarefa atribuída a Maria Santos', time: '15 min atrás', type: 'task' },
    { id: 3, action: 'Folha de voo #2024-001 finalizada', time: '1h atrás', type: 'sheet' },
    { id: 4, action: 'Funcionário Carlos Lima adicionado', time: '2h atrás', type: 'employee' },
  ];

  return (
    <div className="min-h-screen bg-aviation-gradient">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Plane className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white">AviationOps</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-400" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-400" />
                )}
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>

              <div className="text-right">
                <p className="text-sm text-white font-medium">{user.name}</p>
                <p className="text-xs text-white/70">{user.role}</p>
              </div>

              <div className="h-10 w-10 bg-aviation-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-white hover:bg-white/20"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">
            Bem-vindo ao Sistema de Gestão
          </h2>
          <p className="text-xl text-white/80">
            Gerencie aeronaves, funcionários e operações em um só lugar
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="glass-card border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-aviation-blue-300 text-sm">
                      {stat.change} esta semana
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-aviation-blue-600/30 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-aviation-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Ações Rápidas</span>
                </CardTitle>
                <CardDescription className="text-white/70">
                  Acesse as principais funcionalidades do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Link to="/aircraft-manager">
                  <Button className="aviation-button justify-start h-16 w-full">
                    <Plane className="h-6 w-6 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">Gerenciar Aeronaves</p>
                      <p className="text-sm opacity-80">Cadastro e manutenção</p>
                    </div>
                  </Button>
                </Link>

                <Link to="/employee-manager">
                  <Button className="aviation-button justify-start h-16 w-full">
                    <Users className="h-6 w-6 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">Gerenciar Funcionários</p>
                      <p className="text-sm opacity-80">Equipe e dados pessoais</p>
                    </div>
                  </Button>
                </Link>

                <Link to="/cleaning-forms">
                  <Button className="aviation-button justify-start h-16 w-full">
                    <FileText className="h-6 w-6 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">Folhas de Limpeza</p>
                      <p className="text-sm opacity-80">Requisições e controle</p>
                    </div>
                  </Button>
                </Link>

                <Link to="/tasks">
                  <Button className="aviation-button justify-start h-16 w-full">
                    <CheckSquare className="h-6 w-6 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">Tarefas</p>
                      <p className="text-sm opacity-80">Acompanhar progresso</p>
                    </div>
                  </Button>
                </Link>

                <Link to="/flight-sheets">
                  <Button className="aviation-button justify-start h-16 w-full">
                    <FileText className="h-6 w-6 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">Folhas de Voo</p>
                      <p className="text-sm opacity-80">Documentação</p>
                    </div>
                  </Button>
                </Link>

                <Link to="/employees">
                  <Button className="aviation-button justify-start h-16 w-full">
                    <Users className="h-6 w-6 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">Equipe Simples</p>
                      <p className="text-sm opacity-80">Visualização básica</p>
                    </div>
                  </Button>
                </Link>

                <Link to="/aircraft">
                  <Button className="aviation-button justify-start h-16 w-full">
                    <Plane className="h-6 w-6 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">Aeronaves Simples</p>
                      <p className="text-sm opacity-80">Visualização básica</p>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Atividades Recentes</CardTitle>
              <CardDescription className="text-white/70">
                Últimas atualizações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-aviation-blue-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.action}</p>
                    <p className="text-white/60 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Status do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-white font-medium">Banco de Dados</p>
                  <p className="text-white/70 text-sm">Conectado</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-white font-medium">Supabase</p>
                  <p className="text-white/70 text-sm">Online</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Cloud className="h-5 w-5 text-aviation-blue-300" />
                <div>
                  <p className="text-white font-medium">Sincronização</p>
                  <p className="text-white/70 text-sm">Ativa</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
