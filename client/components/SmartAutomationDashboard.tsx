import { useState, useEffect } from "react";
import {
  Bot,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plane,
  TrendingUp,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Route,
  Timer,
  Brain,
  Target,
  CheckCircle,
  AlertTriangle,
  Activity,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  smartAutomationService,
  SchedulingTask,
  OptimizedSchedule,
  TimePrediction,
  RouteOptimization,
} from "@/lib/smart-automation-service";

export function SmartAutomationDashboard() {
  const [activeTab, setActiveTab] = useState("scheduling");
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<OptimizedSchedule | null>(null);
  const [predictions, setPredictions] = useState<TimePrediction[]>([]);
  const [routeOptimizations, setRouteOptimizations] = useState<RouteOptimization[]>([]);
  const [automationSettings, setAutomationSettings] = useState({
    autoScheduling: false,
    timePrediction: true,
    routeOptimization: true,
    flightIntegration: false,
  });
  const [algorithm, setAlgorithm] = useState<"EFFICIENCY" | "BALANCED" | "QUALITY">("BALANCED");
  
  const { toast } = useToast();

  useEffect(() => {
    loadAutomationData();
  }, []);

  const loadAutomationData = async () => {
    try {
      // Load mock data for demonstration
      const mockPredictions: TimePrediction[] = [
        {
          taskId: "task-1",
          aircraftType: "A320",
          interventionType: "Limpeza Completa",
          baselineTime: 90,
          predictedTime: 85,
          factors: {
            aircraftComplexity: 1.1,
            weatherImpact: 0.9,
            teamExperience: 0.95,
            historicalAverage: 0.88,
          },
          confidence: 87,
          lastUpdated: new Date().toISOString(),
        },
        {
          taskId: "task-2",
          aircraftType: "B737",
          interventionType: "Limpeza Rápida",
          baselineTime: 60,
          predictedTime: 58,
          factors: {
            aircraftComplexity: 1.0,
            weatherImpact: 1.0,
            teamExperience: 0.98,
            historicalAverage: 0.95,
          },
          confidence: 92,
          lastUpdated: new Date().toISOString(),
        },
      ];

      setPredictions(mockPredictions);

      // Load mock route optimizations
      const mockOptimizations: RouteOptimization[] = [
        {
          employeeId: "emp-1",
          tasks: [],
          optimizedRoute: [
            {
              sequence: 1,
              taskId: "task-1",
              location: "Hangar A",
              travelTime: 0,
              arrivalTime: new Date().toISOString(),
              departureTime: new Date(Date.now() + 90 * 60000).toISOString(),
            },
            {
              sequence: 2,
              taskId: "task-2",
              location: "Gate B",
              travelTime: 15,
              arrivalTime: new Date(Date.now() + 105 * 60000).toISOString(),
              departureTime: new Date(Date.now() + 165 * 60000).toISOString(),
            },
          ],
          totalDistance: 2.5,
          totalTravelTime: 15,
          efficiency: 94,
        },
      ];

      setRouteOptimizations(mockOptimizations);
    } catch (error) {
      console.error("Error loading automation data:", error);
    }
  };

  const handleGenerateSchedule = async () => {
    setIsGeneratingSchedule(true);
    try {
      // Mock schedule generation
      const mockTasks: SchedulingTask[] = [
        {
          id: "task-1",
          aircraftId: "CS-TNP",
          aircraftCode: "CS-TNP",
          interventionTypes: ["Limpeza Completa"],
          estimatedDuration: 90,
          priority: "high",
          preferredEmployees: [],
          requiredSkills: ["basic_cleaning"],
          location: "Hangar A",
          weatherSensitive: false,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "task-2",
          aircraftId: "CS-TOR",
          aircraftCode: "CS-TOR",
          interventionTypes: ["Limpeza Rápida"],
          estimatedDuration: 60,
          priority: "medium",
          preferredEmployees: [],
          requiredSkills: ["basic_cleaning"],
          location: "Gate B",
          weatherSensitive: false,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const schedule = await smartAutomationService.generateOptimizedSchedule(
        mockTasks,
        [],
        algorithm
      );

      setCurrentSchedule(schedule);
      toast({
        title: "Cronograma Gerado",
        description: `Cronograma otimizado criado com ${schedule.tasks.length} tarefas`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar cronograma automático",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const handleSyncFlightData = async () => {
    try {
      await smartAutomationService.syncFlightData();
      toast({
        title: "Sincronização Completa",
        description: "Dados de voo sincronizados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro de Sincronização",
        description: "Falha ao sincronizar dados de voo",
        variant: "destructive",
      });
    }
  };

  const getAlgorithmDescription = (alg: string) => {
    switch (alg) {
      case "EFFICIENCY":
        return "Foca na velocidade de conclusão";
      case "QUALITY":
        return "Prioriza a qualidade do trabalho";
      default:
        return "Equilibra eficiência e qualidade";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-400";
    if (confidence >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="h-7 w-7 text-purple-400" />
            Automação Inteligente
          </h2>
          <p className="text-blue-200 mt-1">
            Auto-agendamento, predições e otimização de rotas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-purple-300 border-purple-400/50">
            <Brain className="h-3 w-3 mr-1" />
            IA Ativa
          </Badge>
        </div>
      </div>

      {/* Automation Settings */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Automação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <Label className="text-white text-sm">Auto-agendamento</Label>
              <Switch
                checked={automationSettings.autoScheduling}
                onCheckedChange={(checked) =>
                  setAutomationSettings(prev => ({ ...prev, autoScheduling: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <Label className="text-white text-sm">Predição de Tempo</Label>
              <Switch
                checked={automationSettings.timePrediction}
                onCheckedChange={(checked) =>
                  setAutomationSettings(prev => ({ ...prev, timePrediction: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <Label className="text-white text-sm">Otimização de Rotas</Label>
              <Switch
                checked={automationSettings.routeOptimization}
                onCheckedChange={(checked) =>
                  setAutomationSettings(prev => ({ ...prev, routeOptimization: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <Label className="text-white text-sm">Integração de Voos</Label>
              <Switch
                checked={automationSettings.flightIntegration}
                onCheckedChange={(checked) =>
                  setAutomationSettings(prev => ({ ...prev, flightIntegration: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-aviation-gray-700">
          <TabsTrigger value="scheduling" className="text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Agendamento
          </TabsTrigger>
          <TabsTrigger value="predictions" className="text-white">
            <Timer className="h-4 w-4 mr-2" />
            Predições
          </TabsTrigger>
          <TabsTrigger value="routes" className="text-white">
            <Route className="h-4 w-4 mr-2" />
            Rotas
          </TabsTrigger>
          <TabsTrigger value="flights" className="text-white">
            <Plane className="h-4 w-4 mr-2" />
            Voos
          </TabsTrigger>
        </TabsList>

        {/* Auto-Scheduling Tab */}
        <TabsContent value="scheduling" className="space-y-6 mt-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Gerador de Cronograma Inteligente</CardTitle>
              <CardDescription className="text-white/70">
                Crie cronogramas otimizados automaticamente baseados em IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label className="text-white text-sm">Algoritmo de Otimização</Label>
                  <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as any)}>
                    <SelectTrigger className="aviation-input mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFFICIENCY">Eficiência</SelectItem>
                      <SelectItem value="BALANCED">Balanceado</SelectItem>
                      <SelectItem value="QUALITY">Qualidade</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-white/60 text-xs mt-1">
                    {getAlgorithmDescription(algorithm)}
                  </p>
                </div>
                <Button
                  onClick={handleGenerateSchedule}
                  disabled={isGeneratingSchedule}
                  className="aviation-button"
                >
                  {isGeneratingSchedule ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Gerar Cronograma
                    </>
                  )}
                </Button>
              </div>

              {currentSchedule && (
                <div className="mt-6 p-4 bg-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium">Cronograma Gerado</h4>
                    <Badge variant="outline" className="text-green-300 border-green-400/50">
                      {currentSchedule.tasks.length} tarefas
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-white/70">Eficiência:</span>
                      <p className="text-white font-medium">{currentSchedule.efficiency.toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-white/70">Utilização:</span>
                      <p className="text-white font-medium">{currentSchedule.utilizationRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-white/70">Tempo de Viagem:</span>
                      <p className="text-white font-medium">{currentSchedule.totalTravelTime} min</p>
                    </div>
                  </div>
                  {currentSchedule.constraintViolations.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-300 text-sm font-medium">
                          {currentSchedule.constraintViolations.length} violações de restrições
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions.map((prediction) => (
              <Card key={prediction.taskId} className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{prediction.aircraftType} - {prediction.interventionType}</span>
                    <Badge className={getConfidenceColor(prediction.confidence)}>
                      {prediction.confidence}% confiança
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/70">Tempo Base:</span>
                      <p className="text-white font-medium">{prediction.baselineTime} min</p>
                    </div>
                    <div>
                      <span className="text-white/70">Tempo Previsto:</span>
                      <p className="text-green-300 font-medium">{prediction.predictedTime} min</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-white text-sm font-medium">Fatores de Influência:</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">Complexidade da Aeronave</span>
                        <span className="text-white">{(prediction.factors.aircraftComplexity * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">Impacto do Clima</span>
                        <span className="text-white">{(prediction.factors.weatherImpact * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">Experiência da Equipe</span>
                        <span className="text-white">{(prediction.factors.teamExperience * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">Média Histórica</span>
                        <span className="text-white">{(prediction.factors.historicalAverage * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <Progress value={prediction.confidence} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Route Optimization Tab */}
        <TabsContent value="routes" className="space-y-6 mt-6">
          {routeOptimizations.map((optimization) => (
            <Card key={optimization.employeeId} className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Rota Otimizada - Funcionário {optimization.employeeId}</span>
                  <Badge variant="outline" className="text-green-300 border-green-400/50">
                    {optimization.efficiency}% eficiência
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-white/70">Distância Total:</span>
                    <p className="text-white font-medium">{optimization.totalDistance} km</p>
                  </div>
                  <div>
                    <span className="text-white/70">Tempo de Viagem:</span>
                    <p className="text-white font-medium">{optimization.totalTravelTime} min</p>
                  </div>
                  <div>
                    <span className="text-white/70">Paradas:</span>
                    <p className="text-white font-medium">{optimization.optimizedRoute.length}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-white text-sm font-medium">Sequência Otimizada:</h5>
                  <div className="space-y-2">
                    {optimization.optimizedRoute.map((stop) => (
                      <div key={stop.sequence} className="flex items-center space-x-3 p-2 bg-white/5 rounded">
                        <Badge variant="outline" className="text-white">
                          {stop.sequence}
                        </Badge>
                        <div className="flex-1">
                          <span className="text-white text-sm">{stop.location}</span>
                          <p className="text-white/60 text-xs">
                            Viagem: {stop.travelTime} min
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/70 text-xs">
                            {new Date(stop.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Flight Integration Tab */}
        <TabsContent value="flights" className="space-y-6 mt-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Integração com Sistemas de Voo
              </CardTitle>
              <CardDescription className="text-white/70">
                Sincronização automática com dados de voo para otimização de limpeza
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Status da Integração</h4>
                  <p className="text-white/70 text-sm">
                    {automationSettings.flightIntegration ? "Conectado e sincronizando" : "Desconectado"}
                  </p>
                </div>
                <Badge variant={automationSettings.flightIntegration ? "default" : "secondary"}>
                  {automationSettings.flightIntegration ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <Button
                onClick={handleSyncFlightData}
                disabled={!automationSettings.flightIntegration}
                className="w-full aviation-button"
              >
                <Activity className="h-4 w-4 mr-2" />
                Sincronizar Dados de Voo
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-white font-medium">Voo TP1234</span>
                  </div>
                  <p className="text-white/70 text-sm">CS-TNP • Chegada: 14:30</p>
                  <p className="text-green-300 text-xs">Limpeza agendada automaticamente</p>
                </div>

                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-400/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span className="text-white font-medium">Voo TP5678</span>
                  </div>
                  <p className="text-white/70 text-sm">CS-TOR • Chegada: 16:15</p>
                  <p className="text-yellow-300 text-xs">Aguardando confirmação</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
