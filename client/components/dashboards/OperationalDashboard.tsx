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
  Wrench,
  FileText,
  Clock,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Camera,
  Upload,
  MapPin,
  Plane,
  User,
  Timer,
  AlertCircle,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface OperationalMetrics {
  assignedForms: number;
  completedToday: number;
  inProgress: number;
  averageTime: number;
  qualityScore: number;
  pendingUploads: number;
}

interface AssignedTask {
  id: string;
  code: string;
  aircraft: {
    registration: string;
    model: string;
    location: string;
  };
  interventionType: string;
  priority: "high" | "medium" | "low";
  estimatedTime: number;
  status: "pending" | "in_progress" | "completed";
  assignedAt: string;
  dueTime?: string;
  completedAt?: string;
}

export function OperationalDashboard() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<OperationalMetrics>({
    assignedForms: 0,
    completedToday: 0,
    inProgress: 0,
    averageTime: 45,
    qualityScore: 94,
    pendingUploads: 0,
  });
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [currentTask, setCurrentTask] = useState<AssignedTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOperationalMetrics();
  }, []);

  const loadOperationalMetrics = async () => {
    setLoading(true);
    try {
      const [formsData, tasksData] = await Promise.all([
        loadAssignedForms(),
        loadAssignedTasks(),
      ]);

      const today = new Date().toDateString();
      const completedToday = tasksData.filter(
        (task) =>
          task.status === "completed" &&
          task.completedAt &&
          new Date(task.completedAt).toDateString() === today,
      ).length;

      const inProgress = tasksData.filter(
        (task) => task.status === "in_progress",
      ).length;

      setMetrics({
        assignedForms: tasksData.length,
        completedToday,
        inProgress,
        averageTime: 45,
        qualityScore: 94,
        pendingUploads: Math.floor(Math.random() * 3), // Simulate pending uploads
      });

      setAssignedTasks(tasksData);

      // Set current task if any is in progress
      const activeTask = tasksData.find(
        (task) => task.status === "in_progress",
      );
      setCurrentTask(activeTask || null);
    } catch (error) {
      console.error("Error loading operational metrics:", error);
      toast({
        title: "Erro ao carregar métricas",
        description: "Falha ao carregar suas tarefas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedForms = async () => {
    try {
      const savedForms = localStorage.getItem("cleaningForms");
      if (savedForms) {
        const forms = JSON.parse(savedForms);
        // Filter forms assigned to current user
        return forms.filter(
          (f: any) => f.assignedTo === user?.id || f.status !== "completed",
        );
      }
    } catch (error) {
      console.error("Error loading assigned forms:", error);
    }
    return [];
  };

  const loadAssignedTasks = async (): Promise<AssignedTask[]> => {
    try {
      const savedForms = localStorage.getItem("cleaningForms");
      const savedAircraft = localStorage.getItem("aviation_aircraft");

      if (savedForms && savedAircraft) {
        const forms = JSON.parse(savedForms);
        const aircraft = JSON.parse(savedAircraft);

        const tasks: AssignedTask[] = [];

        forms.slice(0, 5).forEach((form: any, index: number) => {
          const aircraftData = aircraft[index % aircraft.length] || {
            registration: `D2-${String(index + 1).padStart(3, "0")}`,
            model: "Boeing 737",
            location: "Terminal A",
          };

          const priorities: Array<"high" | "medium" | "low"> = [
            "high",
            "medium",
            "low",
          ];
          const interventions = [
            "Limpeza Exterior",
            "Limpeza Interior",
            "Polimento",
            "Lavagem Profunda",
          ];

          tasks.push({
            id: form.id || `task-${index}`,
            code: form.code || `FORM-${String(index + 1).padStart(4, "0")}`,
            aircraft: {
              registration: aircraftData.registration,
              model: aircraftData.model,
              location: aircraftData.location || "Terminal A",
            },
            interventionType: interventions[index % interventions.length],
            priority: priorities[index % priorities.length],
            estimatedTime: 30 + index * 15,
            status:
              form.status === "completed"
                ? "completed"
                : form.status === "in_progress"
                  ? "in_progress"
                  : "pending",
            assignedAt: form.createdAt || new Date().toISOString(),
            dueTime: form.dueTime,
            completedAt: form.completedAt,
          });
        });

        return tasks.sort((a, b) => {
          if (a.status === "in_progress") return -1;
          if (b.status === "in_progress") return 1;
          if (a.status === "pending" && b.status === "completed") return -1;
          if (b.status === "pending" && a.status === "completed") return 1;
          return (
            new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime()
          );
        });
      }
    } catch (error) {
      console.error("Error loading assigned tasks:", error);
    }
    return [];
  };

  const handleStartTask = async (taskId: string) => {
    try {
      const updatedTasks = assignedTasks.map((task) =>
        task.id === taskId ? { ...task, status: "in_progress" as const } : task,
      );
      setAssignedTasks(updatedTasks);

      const startedTask = updatedTasks.find((task) => task.id === taskId);
      setCurrentTask(startedTask || null);

      toast({
        title: "Tarefa iniciada",
        description: `Limpeza da aeronave ${startedTask?.aircraft.registration} iniciada.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao iniciar tarefa.",
        variant: "destructive",
      });
    }
  };

  const handlePauseTask = async (taskId: string) => {
    try {
      const updatedTasks = assignedTasks.map((task) =>
        task.id === taskId ? { ...task, status: "pending" as const } : task,
      );
      setAssignedTasks(updatedTasks);
      setCurrentTask(null);

      toast({
        title: "Tarefa pausada",
        description: "Você pode retomar a tarefa a qualquer momento.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao pausar tarefa.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const completedTime = new Date().toISOString();
      const updatedTasks = assignedTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "completed" as const,
              completedAt: completedTime,
            }
          : task,
      );
      setAssignedTasks(updatedTasks);
      setCurrentTask(null);

      // Update metrics
      const today = new Date().toDateString();
      const completedToday = updatedTasks.filter(
        (task) =>
          task.status === "completed" &&
          task.completedAt &&
          new Date(task.completedAt).toDateString() === today,
      ).length;

      setMetrics((prev) => ({
        ...prev,
        completedToday,
        inProgress: prev.inProgress - 1,
      }));

      toast({
        title: "Tarefa concluída",
        description: "Parabéns! Tarefa marcada como concluída.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao concluir tarefa.",
        variant: "destructive",
      });
    }
  };

  const handleUploadPhotos = async () => {
    try {
      toast({
        title: "Upload de fotos",
        description: "Interface de upload será aberta.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao abrir upload de fotos.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: AssignedTask["priority"]) => {
    switch (priority) {
      case "high":
        return "border-red-400/50 bg-red-500/10";
      case "medium":
        return "border-orange-400/50 bg-orange-500/10";
      case "low":
        return "border-green-400/50 bg-green-500/10";
      default:
        return "border-white/20 bg-white/5";
    }
  };

  const getPriorityBadge = (priority: AssignedTask["priority"]) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta</Badge>;
      case "medium":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">Média</Badge>
        );
      case "low":
        return <Badge variant="secondary">Baixa</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getStatusIcon = (status: AssignedTask["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "in_progress":
        return <PlayCircle className="h-5 w-5 text-blue-400" />;
      case "pending":
        return <Clock className="h-5 w-5 text-orange-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Operational Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wrench className="h-7 w-7 text-green-400" />
            Dashboard Operacional
          </h2>
          <p className="text-blue-200 mt-1">
            Suas tarefas e atividades de limpeza
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => loadOperationalMetrics()}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Timer className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={handleUploadPhotos}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Camera className="h-4 w-4 mr-2" />
            Upload Fotos
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Tarefas Atribuídas</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.assignedForms}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
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
                  {metrics.averageTime}min
                </p>
              </div>
              <Timer className="h-8 w-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Qualidade</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.qualityScore}%
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Task */}
      {currentTask && (
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 backdrop-blur-xl border border-blue-400/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-blue-400" />
              Tarefa Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Plane className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {currentTask.aircraft.registration}
                  </h3>
                  <p className="text-blue-200">
                    {currentTask.interventionType}
                  </p>
                  <p className="text-sm text-blue-300 flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {currentTask.aircraft.location}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePauseTask(currentTask.id)}
                  variant="outline"
                  size="sm"
                  className="border-orange-400/50 text-orange-300 hover:bg-orange-500/20"
                >
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
                <Button
                  onClick={() => handleCompleteTask(currentTask.id)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Concluir
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleUploadPhotos}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                <Camera className="h-4 w-4 mr-2" />
                Adicionar Fotos
              </Button>
              <Link to="/cleaning-forms" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Tasks */}
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Minhas Tarefas ({assignedTasks.length})
          </CardTitle>
          <CardDescription className="text-white/70">
            Tarefas atribuídas e seu status atual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignedTasks.length > 0 ? (
            assignedTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border ${getPriorityColor(task.priority)} transition-all hover:bg-white/5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(task.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold">
                          {task.code}
                        </h3>
                        {getPriorityBadge(task.priority)}
                      </div>
                      <p className="text-white/80 text-sm">
                        {task.aircraft.registration} - {task.interventionType}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-cyan-300 text-xs flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {task.aircraft.location}
                        </span>
                        <span className="text-blue-300 text-xs flex items-center gap-1">
                          <Timer className="h-3 w-3" />~{task.estimatedTime}min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {task.status === "pending" && (
                      <Button
                        onClick={() => handleStartTask(task.id)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    )}
                    {task.status === "in_progress" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handlePauseTask(task.id)}
                          variant="outline"
                          size="sm"
                          className="border-orange-400/50 text-orange-300 hover:bg-orange-500/20"
                        >
                          <PauseCircle className="h-4 w-4 mr-2" />
                          Pausar
                        </Button>
                        <Button
                          onClick={() => handleCompleteTask(task.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Concluir
                        </Button>
                      </div>
                    )}
                    {task.status === "completed" && (
                      <Badge
                        variant="secondary"
                        className="bg-green-500/20 text-green-300"
                      >
                        Concluída
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhuma tarefa atribuída</p>
              <p className="text-white/40 text-sm mt-1">
                Aguarde novas atribuições do supervisor
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/cleaning-forms">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 backdrop-blur-xl border border-blue-400/50 hover:scale-105 transition-all duration-300 cursor-pointer touch-manipulation">
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">
                Minhas Folhas
              </h3>
              <p className="text-sm text-blue-300">
                Ver todas as folhas de limpeza
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card
          className="bg-gradient-to-br from-green-500/20 to-green-600/30 backdrop-blur-xl border border-green-400/50 hover:scale-105 transition-all duration-300 cursor-pointer touch-manipulation"
          onClick={handleUploadPhotos}
        >
          <CardContent className="p-6 text-center">
            <Camera className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Upload Fotos</h3>
            <p className="text-sm text-green-300">
              Adicionar evidências fotográficas
              {metrics.pendingUploads > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {metrics.pendingUploads} pendentes
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>

        <Link to="/settings?tab=profile">
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 backdrop-blur-xl border border-purple-400/50 hover:scale-105 transition-all duration-300 cursor-pointer touch-manipulation">
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Meu Perfil</h3>
              <p className="text-sm text-purple-300">
                Configurações e performance
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
