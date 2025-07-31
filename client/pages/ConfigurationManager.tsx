import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Settings,
  CheckSquare,
  Clock,
  MapPin,
  Wrench,
  AlertCircle,
  GripVertical,
  Eye,
  EyeOff,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import {
  configurationService,
  InterventionType,
  ShiftConfig,
  LocationConfig,
  SystemConfiguration,
} from "@/lib/configuration-service";

export default function ConfigurationManager() {
  const [configuration, setConfiguration] = useState<SystemConfiguration>({
    interventionTypes: [],
    shifts: [],
    locations: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("interventions");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogType, setAddDialogType] = useState<
    "intervention" | "shift" | "location"
  >("intervention");

  // Form states
  const [interventionForm, setInterventionForm] = useState({
    name: "",
    description: "",
    isActive: true,
    order: 0,
  });

  const [shiftForm, setShiftForm] = useState({
    name: "",
    displayName: "",
    startTime: "",
    endTime: "",
    isActive: true,
    order: 0,
  });

  const [locationForm, setLocationForm] = useState({
    name: "",
    description: "",
    isActive: true,
    order: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const config = await configurationService.getAllConfigurations();
      setConfiguration(config);
    } catch (error) {
      console.error("Error loading configuration:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações do sistema.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateInterventionForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!interventionForm.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (interventionForm.name.trim().length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }

    if (interventionForm.order < 0) {
      newErrors.order = "Ordem deve ser um número positivo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateShiftForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!shiftForm.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!shiftForm.displayName.trim()) {
      newErrors.displayName = "Nome de exibição é obrigatório";
    }

    if (!shiftForm.startTime) {
      newErrors.startTime = "Horário de início é obrigatório";
    }

    if (!shiftForm.endTime) {
      newErrors.endTime = "Horário de fim é obrigatório";
    }

    if (shiftForm.order < 0) {
      newErrors.order = "Ordem deve ser um número positivo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLocationForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!locationForm.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (locationForm.name.trim().length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }

    if (locationForm.order < 0) {
      newErrors.order = "Ordem deve ser um número positivo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForms = () => {
    setInterventionForm({
      name: "",
      description: "",
      isActive: true,
      order: 0,
    });

    setShiftForm({
      name: "",
      displayName: "",
      startTime: "",
      endTime: "",
      isActive: true,
      order: 0,
    });

    setLocationForm({
      name: "",
      description: "",
      isActive: true,
      order: 0,
    });

    setErrors({});
  };

  const handleAddInterventionType = async () => {
    if (!validateInterventionForm()) return;

    try {
      await configurationService.addInterventionType({
        name: interventionForm.name.trim(),
        description: interventionForm.description.trim(),
        isActive: interventionForm.isActive,
        order:
          interventionForm.order || configuration.interventionTypes.length + 1,
      });

      await loadConfiguration();
      setShowAddDialog(false);
      resetForms();

      toast({
        title: "Tipo de intervenção adicionado",
        description: `"${interventionForm.name}" foi adicionado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar tipo de intervenção",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleAddLocation = async () => {
    if (!validateLocationForm()) return;

    try {
      await configurationService.addLocation({
        name: locationForm.name.trim(),
        description: locationForm.description.trim(),
        isActive: locationForm.isActive,
        order: locationForm.order || configuration.locations.length + 1,
      });

      await loadConfiguration();
      setShowAddDialog(false);
      resetForms();

      toast({
        title: "Local adicionado",
        description: `"${locationForm.name}" foi adicionado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar local",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateInterventionType = async (
    id: string,
    updates: Partial<InterventionType>,
  ) => {
    try {
      await configurationService.updateInterventionType(id, updates);
      await loadConfiguration();
      setIsEditing(null);

      toast({
        title: "Tipo de intervenção atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar tipo de intervenção",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateLocation = async (
    id: string,
    updates: Partial<LocationConfig>,
  ) => {
    try {
      await configurationService.updateLocation(id, updates);
      await loadConfiguration();
      setIsEditing(null);

      toast({
        title: "Local atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar local",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInterventionType = async (id: string) => {
    try {
      await configurationService.deleteInterventionType(id);
      await loadConfiguration();

      toast({
        title: "Tipo de intervenção removido",
        description: "O item foi removido com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover tipo de intervenção",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      await configurationService.deleteLocation(id);
      await loadConfiguration();

      toast({
        title: "Local removido",
        description: "O item foi removido com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover local",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = (type: "intervention" | "shift" | "location") => {
    setAddDialogType(type);
    resetForms();
    setShowAddDialog(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-aviation-gradient flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Carregando configurações...</p>
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
              <Settings className="h-6 w-6 text-white" />
              <h1 className="text-2xl font-bold text-white">
                Gerenciamento de Configurações
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-lg text-white/90 mb-2">
            Configure os tipos de intervenção, turnos e locais do sistema
          </h2>
          <p className="text-white/70 text-sm">
            Gerencie as opções disponíveis nas folhas de limpeza de forma
            dinâmica
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-aviation-gray-700">
            <TabsTrigger value="interventions" className="text-white">
              <Wrench className="h-4 w-4 mr-2" />
              Tipos de Intervenção
            </TabsTrigger>
            <TabsTrigger value="shifts" className="text-white">
              <Clock className="h-4 w-4 mr-2" />
              Turnos
            </TabsTrigger>
            <TabsTrigger value="locations" className="text-white">
              <MapPin className="h-4 w-4 mr-2" />
              Locais
            </TabsTrigger>
          </TabsList>

          {/* Intervention Types Tab */}
          <TabsContent value="interventions" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Tipos de Intervenção
                </h3>
                <p className="text-white/70 text-sm">
                  Configure os tipos de serviços disponíveis (
                  {configuration.interventionTypes.length} itens)
                </p>
              </div>
              <Button
                onClick={() => openAddDialog("intervention")}
                className="aviation-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tipo
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configuration.interventionTypes.map((type) => (
                <Card key={type.id} className="glass-card border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="h-4 w-4 text-white/50" />
                        <Badge
                          variant={type.isActive ? "default" : "secondary"}
                        >
                          {type.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setIsEditing(isEditing === type.id ? null : type.id)
                          }
                          className="text-white hover:bg-white/20 h-8 w-8 p-0"
                        >
                          {isEditing === type.id ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-500/20 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-aviation-gray-800 border-white/20">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Confirmar Exclusão
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-white/70">
                                Tem certeza que deseja remover "{type.name}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/30 text-white hover:bg-white/20">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteInterventionType(type.id)
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {isEditing === type.id ? (
                      <div className="space-y-3">
                        <Input
                          value={type.name}
                          onChange={(e) => {
                            const updatedTypes =
                              configuration.interventionTypes.map((t) =>
                                t.id === type.id
                                  ? { ...t, name: e.target.value }
                                  : t,
                              );
                            setConfiguration((prev) => ({
                              ...prev,
                              interventionTypes: updatedTypes,
                            }));
                          }}
                          className="aviation-input"
                          placeholder="Nome do tipo"
                        />
                        <Textarea
                          value={type.description || ""}
                          onChange={(e) => {
                            const updatedTypes =
                              configuration.interventionTypes.map((t) =>
                                t.id === type.id
                                  ? { ...t, description: e.target.value }
                                  : t,
                              );
                            setConfiguration((prev) => ({
                              ...prev,
                              interventionTypes: updatedTypes,
                            }));
                          }}
                          className="aviation-input"
                          placeholder="Descrição (opcional)"
                          rows={2}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={type.isActive}
                              onCheckedChange={(checked) => {
                                const updatedTypes =
                                  configuration.interventionTypes.map((t) =>
                                    t.id === type.id
                                      ? { ...t, isActive: checked }
                                      : t,
                                  );
                                setConfiguration((prev) => ({
                                  ...prev,
                                  interventionTypes: updatedTypes,
                                }));
                              }}
                            />
                            <span className="text-white text-sm">Ativo</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleUpdateInterventionType(type.id, {
                                name: type.name,
                                description: type.description,
                                isActive: type.isActive,
                              })
                            }
                            className="aviation-button"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium text-white mb-1">
                          {type.name}
                        </h4>
                        {type.description && (
                          <p className="text-white/70 text-sm mb-2">
                            {type.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>Ordem: {type.order}</span>
                          <span>ID: {type.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {configuration.interventionTypes.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <AlertCircle className="h-16 w-16 text-white/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhum tipo de intervenção configurado
                  </h3>
                  <p className="text-white/70 mb-6">
                    Configure os tipos de serviços disponíveis no sistema
                  </p>
                  <Button
                    onClick={() => openAddDialog("intervention")}
                    className="aviation-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Tipo
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Shifts Tab */}
          <TabsContent value="shifts" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Turnos de Trabalho
                </h3>
                <p className="text-white/70 text-sm">
                  Configure os turnos disponíveis ({configuration.shifts.length}{" "}
                  itens)
                </p>
              </div>
              <Button
                onClick={() => openAddDialog("shift")}
                className="aviation-button"
                disabled
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Turno
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configuration.shifts.map((shift) => (
                <Card key={shift.id} className="glass-card border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant={shift.isActive ? "default" : "secondary"}>
                        {shift.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedShifts = configuration.shifts.map(
                              (s) =>
                                s.id === shift.id
                                  ? { ...s, isActive: !s.isActive }
                                  : s,
                            );
                            setConfiguration((prev) => ({
                              ...prev,
                              shifts: updatedShifts,
                            }));
                            configurationService.saveShifts(updatedShifts);
                          }}
                          className="text-white hover:bg-white/20 h-8 w-8 p-0"
                        >
                          {shift.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-white mb-1">
                        {shift.displayName}
                      </h4>
                      <p className="text-white/70 text-sm mb-2">
                        {shift.startTime} às {shift.endTime}
                      </p>
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>Identificador: {shift.name}</span>
                        <span>Ordem: {shift.order}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass-card border-white/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white mb-1">
                      Informação sobre Turnos
                    </h4>
                    <p className="text-white/70 text-sm">
                      Os turnos são configurações centrais do sistema e não
                      podem ser removidos. Você pode ativá-los ou desativá-los
                      conforme necessário.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Locais de Intervenção
                </h3>
                <p className="text-white/70 text-sm">
                  Configure os locais disponíveis (
                  {configuration.locations.length} itens)
                </p>
              </div>
              <Button
                onClick={() => openAddDialog("location")}
                className="aviation-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Local
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configuration.locations.map((location) => (
                <Card key={location.id} className="glass-card border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="h-4 w-4 text-white/50" />
                        <Badge
                          variant={location.isActive ? "default" : "secondary"}
                        >
                          {location.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setIsEditing(
                              isEditing === location.id ? null : location.id,
                            )
                          }
                          className="text-white hover:bg-white/20 h-8 w-8 p-0"
                        >
                          {isEditing === location.id ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-500/20 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-aviation-gray-800 border-white/20">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Confirmar Exclusão
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-white/70">
                                Tem certeza que deseja remover "{location.name}
                                "? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/30 text-white hover:bg-white/20">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteLocation(location.id)
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {isEditing === location.id ? (
                      <div className="space-y-3">
                        <Input
                          value={location.name}
                          onChange={(e) => {
                            const updatedLocations =
                              configuration.locations.map((l) =>
                                l.id === location.id
                                  ? { ...l, name: e.target.value }
                                  : l,
                              );
                            setConfiguration((prev) => ({
                              ...prev,
                              locations: updatedLocations,
                            }));
                          }}
                          className="aviation-input"
                          placeholder="Nome do local"
                        />
                        <Textarea
                          value={location.description || ""}
                          onChange={(e) => {
                            const updatedLocations =
                              configuration.locations.map((l) =>
                                l.id === location.id
                                  ? { ...l, description: e.target.value }
                                  : l,
                              );
                            setConfiguration((prev) => ({
                              ...prev,
                              locations: updatedLocations,
                            }));
                          }}
                          className="aviation-input"
                          placeholder="Descrição (opcional)"
                          rows={2}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={location.isActive}
                              onCheckedChange={(checked) => {
                                const updatedLocations =
                                  configuration.locations.map((l) =>
                                    l.id === location.id
                                      ? { ...l, isActive: checked }
                                      : l,
                                  );
                                setConfiguration((prev) => ({
                                  ...prev,
                                  locations: updatedLocations,
                                }));
                              }}
                            />
                            <span className="text-white text-sm">Ativo</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleUpdateLocation(location.id, {
                                name: location.name,
                                description: location.description,
                                isActive: location.isActive,
                              })
                            }
                            className="aviation-button"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium text-white mb-1">
                          {location.name}
                        </h4>
                        {location.description && (
                          <p className="text-white/70 text-sm mb-2">
                            {location.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>Ordem: {location.order}</span>
                          <span>ID: {location.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {configuration.locations.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <AlertCircle className="h-16 w-16 text-white/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhum local configurado
                  </h3>
                  <p className="text-white/70 mb-6">
                    Configure os locais disponíveis para intervenções
                  </p>
                  <Button
                    onClick={() => openAddDialog("location")}
                    className="aviation-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Local
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md bg-aviation-gray-800 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">
                {addDialogType === "intervention" &&
                  "Adicionar Tipo de Intervenção"}
                {addDialogType === "shift" && "Adicionar Turno"}
                {addDialogType === "location" && "Adicionar Local"}
              </DialogTitle>
              <DialogDescription className="text-white/70">
                {addDialogType === "intervention" &&
                  "Configure um novo tipo de serviço disponível"}
                {addDialogType === "shift" &&
                  "Configure um novo turno de trabalho"}
                {addDialogType === "location" &&
                  "Configure um novo local de intervenção"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {addDialogType === "intervention" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Nome *</Label>
                    <Input
                      value={interventionForm.name}
                      onChange={(e) =>
                        setInterventionForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="aviation-input"
                      placeholder="Ex: Limpeza Exterior"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Descrição</Label>
                    <Textarea
                      value={interventionForm.description}
                      onChange={(e) =>
                        setInterventionForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="aviation-input"
                      placeholder="Descrição detalhada do tipo de intervenção"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={interventionForm.isActive}
                      onCheckedChange={(checked) =>
                        setInterventionForm((prev) => ({
                          ...prev,
                          isActive: checked,
                        }))
                      }
                    />
                    <Label className="text-white">Ativo</Label>
                  </div>
                </>
              )}

              {addDialogType === "location" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Nome *</Label>
                    <Input
                      value={locationForm.name}
                      onChange={(e) =>
                        setLocationForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="aviation-input"
                      placeholder="Ex: Hangar A"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Descrição</Label>
                    <Textarea
                      value={locationForm.description}
                      onChange={(e) =>
                        setLocationForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="aviation-input"
                      placeholder="Descrição detalhada do local"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={locationForm.isActive}
                      onCheckedChange={(checked) =>
                        setLocationForm((prev) => ({
                          ...prev,
                          isActive: checked,
                        }))
                      }
                    />
                    <Label className="text-white">Ativo</Label>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="border-white/30 text-white hover:bg-white/20"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (addDialogType === "intervention") {
                    handleAddInterventionType();
                  } else if (addDialogType === "location") {
                    handleAddLocation();
                  }
                }}
                className="aviation-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
