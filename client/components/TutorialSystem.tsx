import { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Lightbulb,
  Target,
  Users,
  Plane,
  FileText,
  Settings,
  BarChart3,
  Zap,
  Shield,
  Eye,
  MousePointer,
  BookOpen,
  Graduation,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: "top" | "bottom" | "left" | "right" | "center";
  content: React.ReactNode;
  action?: () => void;
  nextEnabled?: boolean;
  skippable?: boolean;
}

interface TutorialFlow {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: "basics" | "advanced" | "admin";
  estimatedTime: number; // minutes
  steps: TutorialStep[];
  prerequisite?: string[];
}

const tutorialFlows: TutorialFlow[] = [
  {
    id: "dashboard-basics",
    name: "Dashboard Básico",
    description: "Aprenda a navegar pelo dashboard principal",
    icon: Target,
    category: "basics",
    estimatedTime: 5,
    steps: [
      {
        id: "welcome",
        title: "Bem-vindo ao AviationOps",
        description: "Vamos fazer um tour rápido pelas funcionalidades principais",
        target: "",
        position: "center",
        content: (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Plane className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-white/80">
              Este sistema de gestão de limpeza de aeronaves foi projetado para 
              otimizar suas operações e garantir máxima eficiência.
            </p>
          </div>
        ),
        nextEnabled: true,
        skippable: true,
      },
      {
        id: "navigation",
        title: "Navegação Principal",
        description: "Estas são as principais áreas do sistema",
        target: "[data-tutorial='main-actions']",
        position: "bottom",
        content: (
          <div className="space-y-3">
            <p className="text-white/80">
              Cada cartão representa uma funcionalidade principal:
            </p>
            <ul className="space-y-2 text-sm text-white/70">
              <li>• <strong>Nova Folha:</strong> Criar formulários de limpeza</li>
              <li>• <strong>Aeronaves:</strong> Gerenciar sua frota</li>
              <li>• <strong>Funcionários:</strong> Equipe de trabalho</li>
              <li>• <strong>Relatórios:</strong> Analytics e exportação</li>
            </ul>
          </div>
        ),
        nextEnabled: true,
      },
      {
        id: "status-cards",
        title: "Status do Sistema",
        description: "Monitore métricas importantes em tempo real",
        target: "[data-tutorial='status-overview']",
        position: "bottom",
        content: (
          <div className="space-y-3">
            <p className="text-white/80">
              Estes cartões mostram o status atual do sistema:
            </p>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• Formulários ativos e concluídos</li>
              <li>• Status de sincronização</li>
              <li>• Conectividade online/offline</li>
            </ul>
          </div>
        ),
        nextEnabled: true,
      },
    ],
  },
  {
    id: "create-form",
    name: "Criar Folha de Limpeza",
    description: "Passo a passo para criar sua primeira folha",
    icon: FileText,
    category: "basics",
    estimatedTime: 8,
    steps: [
      {
        id: "start-form",
        title: "Nova Folha de Limpeza",
        description: "Vamos criar uma folha de limpeza do zero",
        target: "[data-tutorial='new-form-button']",
        position: "top",
        content: (
          <div className="space-y-3">
            <p className="text-white/80">
              Clique no botão "Nova Folha" para começar a criar um formulário.
            </p>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <p className="text-blue-300 text-sm">
                💡 Dica: Você pode criar formulários mesmo offline!
              </p>
            </div>
          </div>
        ),
        action: () => {
          const button = document.querySelector("[data-tutorial='new-form-button']") as HTMLElement;
          if (button) button.click();
        },
        nextEnabled: true,
      },
    ],
  },
  {
    id: "advanced-features",
    name: "Funcionalidades Avançadas",
    description: "Explore recursos avançados como Analytics e Automação",
    icon: Zap,
    category: "advanced",
    estimatedTime: 12,
    steps: [
      {
        id: "advanced-intro",
        title: "Recursos Avançados",
        description: "Descubra funcionalidades poderosas para otimizar seu trabalho",
        target: "[data-tutorial='advanced-features']",
        position: "top",
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-400 mb-2" />
                <p className="text-white font-medium">Analytics</p>
                <p className="text-white/70 text-xs">Relatórios e métricas</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Zap className="h-5 w-5 text-purple-400 mb-2" />
                <p className="text-white font-medium">Automação</p>
                <p className="text-white/70 text-xs">IA e otimização</p>
              </div>
            </div>
          </div>
        ),
        nextEnabled: true,
      },
    ],
  },
  {
    id: "admin-panel",
    name: "Painel Administrativo",
    description: "Funcionalidades exclusivas para administradores",
    icon: Shield,
    category: "admin",
    estimatedTime: 15,
    prerequisite: ["dashboard-basics"],
    steps: [
      {
        id: "admin-intro",
        title: "Painel do Administrador",
        description: "Gerencie usuários, configurações e segurança",
        target: "",
        position: "center",
        content: (
          <div className="space-y-4">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <p className="text-white/80">
                Como administrador, você tem acesso a funcionalidades especiais
                para gerenciar todo o sistema.
              </p>
            </div>
          </div>
        ),
        nextEnabled: true,
      },
    ],
  },
];

interface TutorialSystemProps {
  autoStart?: boolean;
  className?: string;
}

export function TutorialSystem({ autoStart = false, className }: TutorialSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<TutorialFlow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const [tutorialSettings, setTutorialSettings] = useState({
    autoplay: false,
    highlightElements: true,
    showHints: true,
  });
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const completed = localStorage.getItem("aviation_completed_tutorials");
    if (completed) {
      setCompletedTutorials(JSON.parse(completed));
    }

    if (autoStart && !completed) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, [autoStart]);

  useEffect(() => {
    if (activeTutorial && tutorialSettings.highlightElements) {
      highlightCurrentStep();
    }

    return () => {
      removeHighlight();
    };
  }, [activeTutorial, currentStepIndex, tutorialSettings.highlightElements]);

  const highlightCurrentStep = () => {
    if (!activeTutorial) return;
    
    const step = activeTutorial.steps[currentStepIndex];
    if (!step.target) return;

    const element = document.querySelector(step.target) as HTMLElement;
    if (element) {
      removeHighlight();
      
      element.style.position = "relative";
      element.style.zIndex = "1000";
      element.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.5)";
      element.style.borderRadius = "8px";
      element.style.transition = "all 0.3s ease";
      
      setHighlightedElement(element);
      
      // Scroll into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const removeHighlight = () => {
    if (highlightedElement) {
      highlightedElement.style.boxShadow = "";
      highlightedElement.style.zIndex = "";
      setHighlightedElement(null);
    }
  };

  const startTutorial = (flow: TutorialFlow) => {
    setActiveTutorial(flow);
    setCurrentStepIndex(0);
    setIsOpen(false);
    
    toast({
      title: "Tutorial Iniciado",
      description: `Começando: ${flow.name}`,
    });
  };

  const nextStep = () => {
    if (!activeTutorial) return;
    
    const step = activeTutorial.steps[currentStepIndex];
    if (step.action) {
      step.action();
    }

    if (currentStepIndex < activeTutorial.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const skipTutorial = () => {
    setActiveTutorial(null);
    setCurrentStepIndex(0);
    removeHighlight();
  };

  const completeTutorial = () => {
    if (!activeTutorial) return;

    const newCompleted = [...completedTutorials, activeTutorial.id];
    setCompletedTutorials(newCompleted);
    localStorage.setItem("aviation_completed_tutorials", JSON.stringify(newCompleted));

    toast({
      title: "Tutorial Concluído!",
      description: `Parabéns! Você concluiu: ${activeTutorial.name}`,
    });

    setActiveTutorial(null);
    setCurrentStepIndex(0);
    removeHighlight();
  };

  const resetTutorials = () => {
    setCompletedTutorials([]);
    localStorage.removeItem("aviation_completed_tutorials");
    toast({
      title: "Tutoriais Resetados",
      description: "Todos os tutoriais foram marcados como não concluídos",
    });
  };

  const getAvailableTutorials = () => {
    const userRole = hasRole("admin") ? "admin" : hasRole("supervisor") ? "advanced" : "basics";
    
    return tutorialFlows.filter(flow => {
      // Check category access
      if (flow.category === "admin" && !hasRole("admin")) return false;
      if (flow.category === "advanced" && !hasRole("supervisor") && !hasRole("admin")) return false;
      
      // Check prerequisites
      if (flow.prerequisite) {
        return flow.prerequisite.every(req => completedTutorials.includes(req));
      }
      
      return true;
    });
  };

  const currentStep = activeTutorial?.steps[currentStepIndex];
  const progress = activeTutorial ? ((currentStepIndex + 1) / activeTutorial.steps.length) * 100 : 0;

  return (
    <>
      {/* Tutorial Launcher Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
        size="icon"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      {/* Tutorial Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl bg-aviation-gray-800 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Centro de Aprendizagem
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Escolha um tutorial para aprender a usar o sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Settings */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white text-sm">Destacar elementos</Label>
                  <Switch
                    checked={tutorialSettings.highlightElements}
                    onCheckedChange={(checked) =>
                      setTutorialSettings(prev => ({ ...prev, highlightElements: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white text-sm">Mostrar dicas</Label>
                  <Switch
                    checked={tutorialSettings.showHints}
                    onCheckedChange={(checked) =>
                      setTutorialSettings(prev => ({ ...prev, showHints: checked }))
                    }
                  />
                </div>
                <Button
                  onClick={resetTutorials}
                  variant="outline"
                  size="sm"
                  className="border-red-400/50 text-red-300 hover:bg-red-500/20"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Resetar Progresso
                </Button>
              </CardContent>
            </Card>

            {/* Tutorial List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getAvailableTutorials().map((flow) => {
                const isCompleted = completedTutorials.includes(flow.id);
                const IconComponent = flow.icon;
                
                return (
                  <Card
                    key={flow.id}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                      isCompleted
                        ? "bg-green-500/10 border-green-400/30"
                        : "bg-white/5 border-white/10 hover:border-blue-400/50"
                    }`}
                    onClick={() => startTutorial(flow)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            flow.category === "admin" ? "bg-red-500/20" :
                            flow.category === "advanced" ? "bg-purple-500/20" :
                            "bg-blue-500/20"
                          }`}>
                            <IconComponent className={`h-5 w-5 ${
                              flow.category === "admin" ? "text-red-400" :
                              flow.category === "advanced" ? "text-purple-400" :
                              "text-blue-400"
                            }`} />
                          </div>
                          <div>
                            <h3 className="text-white font-medium">{flow.name}</h3>
                            <p className="text-white/60 text-sm">{flow.description}</p>
                          </div>
                        </div>
                        {isCompleted && (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>~{flow.estimatedTime} min</span>
                        <Badge variant={
                          flow.category === "admin" ? "destructive" :
                          flow.category === "advanced" ? "secondary" :
                          "default"
                        }>
                          {flow.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Progress Summary */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">Progresso Geral</span>
                  <span className="text-white/70 text-sm">
                    {completedTutorials.length}/{getAvailableTutorials().length}
                  </span>
                </div>
                <Progress 
                  value={(completedTutorials.length / getAvailableTutorials().length) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Tutorial Overlay */}
      {activeTutorial && currentStep && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
          style={{ pointerEvents: currentStep.target ? "none" : "auto" }}
        >
          <div className="relative w-full h-full">
            {/* Tutorial Content */}
            <div
              className={`absolute ${
                currentStep.position === "center"
                  ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  : "top-4 right-4"
              } w-96 max-w-[90vw]`}
              style={{ pointerEvents: "auto" }}
            >
              <Card className="bg-aviation-gray-800 border-white/20 shadow-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">{currentStep.title}</CardTitle>
                      <CardDescription className="text-white/70">
                        {currentStep.description}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={skipTutorial}
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">
                        Passo {currentStepIndex + 1} de {activeTutorial.steps.length}
                      </span>
                      <span className="text-white/70">
                        {activeTutorial.name}
                      </span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentStep.content}
                  
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={previousStep}
                      disabled={currentStepIndex === 0}
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white/20"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Anterior
                    </Button>
                    
                    <div className="flex space-x-2">
                      {currentStep.skippable && (
                        <Button
                          onClick={skipTutorial}
                          variant="ghost"
                          size="sm"
                          className="text-white/70 hover:text-white hover:bg-white/10"
                        >
                          Pular
                        </Button>
                      )}
                      <Button
                        onClick={nextStep}
                        disabled={currentStep.nextEnabled === false}
                        className="aviation-button"
                        size="sm"
                      >
                        {currentStepIndex === activeTutorial.steps.length - 1 ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Concluir
                          </>
                        ) : (
                          <>
                            Próximo
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Tutorial data attributes helper
export const tutorialData = (id: string) => ({
  "data-tutorial": id,
});
