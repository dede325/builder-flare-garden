import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Download,
  Filter,
  Calendar,
  MapPin,
  Users,
  FileText,
  Eye,
  Printer,
  Archive,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  CheckSquare,
  X,
  AlertCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { intelligentSyncService } from "@/lib/intelligent-sync-service";
import { cacheService } from "@/lib/cache-service";
import { previewCleaningFormPDF, downloadCleaningFormPDF } from "@/lib/pdf-utils";
import { exportService } from "@/lib/export-service";

interface CleaningForm {
  id: string;
  code: string;
  date: string;
  shift: "morning" | "afternoon" | "night";
  location: string;
  interventionTypes: string[];
  aircraftId: string;
  employees: {
    id: string;
    name: string;
    task: string;
    startTime: string;
    endTime: string;
    phone: string;
    idNumber: string;
    photo?: string;
  }[];
  status: "draft" | "pending_signatures" | "completed";
  createdAt: string;
  updatedAt: string;
  syncStatus?: "pending" | "synced" | "error";
}

interface FilterOptions {
  dateFrom: string;
  dateTo: string;
  location: string;
  employeeId: string;
  aircraftId: string;
  status: string;
  syncStatus: string;
}

interface ExportOptions {
  format: "csv" | "zip";
  includePhotos: boolean;
  includePDFs: boolean;
  selectedForms: string[];
}

export default function HistoryExportPanel() {
  const [forms, setForms] = useState<CleaningForm[]>([]);
  const [filteredForms, setFilteredForms] = useState<CleaningForm[]>([]);
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [viewingFormPDF, setViewingFormPDF] = useState<CleaningForm | null>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: "",
    dateTo: "",
    location: "",
    employeeId: "",
    aircraftId: "",
    status: "",
    syncStatus: "",
  });

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    includePhotos: false,
    includePDFs: true,
    selectedForms: [],
  });

  const { toast } = useToast();

  const locationOptions = [
    "Hangar Principal",
    "Pátio de Aeronaves",
    "Terminal de Passageiros",
    "Área de Manutenção",
    "Rampa Norte",
    "Rampa Sul",
    "Hangar de Manutenção",
    "Estacionamento VIP",
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [forms, filters, searchTerm]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load forms using intelligent sync service
      const syncedForms = await intelligentSyncService.getAllForms();
      setForms(syncedForms);

      // Load aircraft and employees using cache service
      const [aircraftData, employeesData] = await Promise.all([
        cacheService.loadAircraftWithCache(),
        cacheService.loadEmployeesWithCache(),
      ]);
      
      setAircraft(aircraftData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do histórico.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...forms];

    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (form) =>
          form.code.toLowerCase().includes(term) ||
          form.location.toLowerCase().includes(term) ||
          form.employees.some((emp) =>
            emp.name.toLowerCase().includes(term)
          )
      );
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter((form) => {
        const formDate = parseISO(form.date);
        
        if (filters.dateFrom && filters.dateTo) {
          return isWithinInterval(formDate, {
            start: parseISO(filters.dateFrom),
            end: parseISO(filters.dateTo),
          });
        } else if (filters.dateFrom) {
          return formDate >= parseISO(filters.dateFrom);
        } else if (filters.dateTo) {
          return formDate <= parseISO(filters.dateTo);
        }
        return true;
      });
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter((form) => form.location === filters.location);
    }

    // Employee filter
    if (filters.employeeId) {
      filtered = filtered.filter((form) =>
        form.employees.some((emp) => emp.id === filters.employeeId)
      );
    }

    // Aircraft filter
    if (filters.aircraftId) {
      filtered = filtered.filter((form) => form.aircraftId === filters.aircraftId);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((form) => form.status === filters.status);
    }

    // Sync status filter
    if (filters.syncStatus) {
      filtered = filtered.filter((form) => form.syncStatus === filters.syncStatus);
    }

    setFilteredForms(filtered);
  };

  const handleSelectAll = () => {
    if (selectedForms.length === filteredForms.length) {
      setSelectedForms([]);
    } else {
      setSelectedForms(filteredForms.map((form) => form.id));
    }
  };

  const handleSelectForm = (formId: string) => {
    setSelectedForms((prev) =>
      prev.includes(formId)
        ? prev.filter((id) => id !== formId)
        : [...prev, formId]
    );
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      location: "",
      employeeId: "",
      aircraftId: "",
      status: "",
      syncStatus: "",
    });
    setSearchTerm("");
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((value) => value !== "").length +
           (searchTerm ? 1 : 0);
  };

  const exportToCSV = async (formsToExport: CleaningForm[]) => {
    await exportService.exportToCSV(formsToExport, aircraft, {
      includePDFs: exportOptions.includePDFs,
      includePhotos: false, // CSV doesn't support photos
      includeEmployeePhotos: false,
    });
  };

  const exportToZIP = async (formsToExport: CleaningForm[]) => {
    await exportService.exportToZIP(formsToExport, aircraft, {
      includePDFs: exportOptions.includePDFs,
      includePhotos: exportOptions.includePhotos,
      includeEmployeePhotos: true,
    });
  };

  const handleExport = async () => {
    if (selectedForms.length === 0) {
      toast({
        title: "Nenhuma folha selecionada",
        description: "Selecione pelo menos uma folha para exportar.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const formsToExport = forms.filter((form) =>
        selectedForms.includes(form.id)
      );

      if (exportOptions.format === "csv") {
        await exportToCSV(formsToExport);
      } else {
        await exportToZIP(formsToExport);
      }

      toast({
        title: "Exportação concluída",
        description: `${formsToExport.length} folha(s) exportada(s) com sucesso.`,
      });

      setShowExportDialog(false);
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintForm = async (form: CleaningForm) => {
    try {
      const aircraftData = aircraft.find((ac) => ac.id === form.aircraftId);
      await previewCleaningFormPDF(form, aircraftData);
      // After opening PDF, user can print from browser
    } catch (error) {
      console.error("Error printing form:", error);
      toast({
        title: "Erro na impressão",
        description: "Não foi possível abrir o PDF para impressão.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-500";
      case "pending_signatures":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "Rascunho";
      case "pending_signatures":
        return "Aguardando Assinaturas";
      case "completed":
        return "Concluído";
      default:
        return "Desconhecido";
    }
  };

  const getSyncStatusColor = (syncStatus?: string) => {
    switch (syncStatus) {
      case "synced":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-aviation-gradient flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Carregando histórico...</p>
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
              <Archive className="h-6 w-6 text-white" />
              <h1 className="text-2xl font-bold text-white">
                Histórico e Exportação
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/70" />
              <Input
                placeholder="Buscar por código, local ou funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="aviation-input pl-10 w-full"
              />
            </div>

            <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/20"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {getActiveFilterCount() > 0 && (
                    <Badge className="ml-2 bg-aviation-blue-600">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-aviation-gray-800 border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Filtros Avançados</DialogTitle>
                  <DialogDescription className="text-white/70">
                    Configure os filtros para refinar sua busca
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Data Inicial</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                      }
                      className="aviation-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Data Final</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                      }
                      className="aviation-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Local</Label>
                    <Select
                      value={filters.location}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, location: value }))
                      }
                    >
                      <SelectTrigger className="aviation-input">
                        <SelectValue placeholder="Todos os locais" />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        <SelectItem value="" className="text-white">
                          Todos os locais
                        </SelectItem>
                        {locationOptions.map((location) => (
                          <SelectItem
                            key={location}
                            value={location}
                            className="text-white"
                          >
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Funcionário</Label>
                    <Select
                      value={filters.employeeId}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, employeeId: value }))
                      }
                    >
                      <SelectTrigger className="aviation-input">
                        <SelectValue placeholder="Todos os funcionários" />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        <SelectItem value="" className="text-white">
                          Todos os funcionários
                        </SelectItem>
                        {employees.map((employee) => (
                          <SelectItem
                            key={employee.id}
                            value={employee.id}
                            className="text-white"
                          >
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Aeronave</Label>
                    <Select
                      value={filters.aircraftId}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, aircraftId: value }))
                      }
                    >
                      <SelectTrigger className="aviation-input">
                        <SelectValue placeholder="Todas as aeronaves" />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        <SelectItem value="" className="text-white">
                          Todas as aeronaves
                        </SelectItem>
                        {aircraft.map((ac) => (
                          <SelectItem
                            key={ac.id}
                            value={ac.id}
                            className="text-white"
                          >
                            {ac.registration} - {ac.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="aviation-input">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        <SelectItem value="" className="text-white">
                          Todos os status
                        </SelectItem>
                        <SelectItem value="draft" className="text-white">
                          Rascunho
                        </SelectItem>
                        <SelectItem value="pending_signatures" className="text-white">
                          Aguardando Assinaturas
                        </SelectItem>
                        <SelectItem value="completed" className="text-white">
                          Concluído
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="border-white/30 text-white hover:bg-white/20"
                  >
                    Limpar Filtros
                  </Button>
                  <Button
                    onClick={() => setShowFilterDialog(false)}
                    className="aviation-button"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => setSelectedForms([])}
              className="border-white/30 text-white hover:bg-white/20"
              disabled={selectedForms.length === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Seleção
            </Button>
          </div>

          {/* Export Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="border-white/30 text-white hover:bg-white/20"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectedForms.length === filteredForms.length ? "Desmarcar Todos" : "Selecionar Todos"}
            </Button>

            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
              <DialogTrigger asChild>
                <Button
                  className="aviation-button"
                  disabled={selectedForms.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar ({selectedForms.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-aviation-gray-800 border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Exportar Dados</DialogTitle>
                  <DialogDescription className="text-white/70">
                    Configure as opções de exportação para {selectedForms.length} folha(s) selecionada(s)
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Formato de Exportação</Label>
                    <Select
                      value={exportOptions.format}
                      onValueChange={(value: "csv" | "zip") =>
                        setExportOptions((prev) => ({ ...prev, format: value }))
                      }
                    >
                      <SelectTrigger className="aviation-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        <SelectItem value="csv" className="text-white">
                          CSV (Planilha)
                        </SelectItem>
                        <SelectItem value="zip" className="text-white">
                          ZIP (Arquivo Compactado)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white">Incluir</Label>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includePDFs"
                        checked={exportOptions.includePDFs}
                        onCheckedChange={(checked) =>
                          setExportOptions((prev) => ({
                            ...prev,
                            includePDFs: !!checked,
                          }))
                        }
                        className="border-white/30"
                      />
                      <Label htmlFor="includePDFs" className="text-white text-sm">
                        Links para PDFs
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includePhotos"
                        checked={exportOptions.includePhotos}
                        onCheckedChange={(checked) =>
                          setExportOptions((prev) => ({
                            ...prev,
                            includePhotos: !!checked,
                          }))
                        }
                        className="border-white/30"
                        disabled={exportOptions.format === "csv"}
                      />
                      <Label htmlFor="includePhotos" className="text-white text-sm">
                        Evidências fotográficas (apenas ZIP)
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowExportDialog(false)}
                    className="border-white/30 text-white hover:bg-white/20"
                    disabled={isExporting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleExport}
                    className="aviation-button"
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Exportando...</span>
                      </div>
                    ) : (
                      <>
                        {exportOptions.format === "csv" ? (
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                        ) : (
                          <Archive className="h-4 w-4 mr-2" />
                        )}
                        Exportar
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{filteredForms.length}</div>
              <div className="text-white/70 text-sm">Folhas Encontradas</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{selectedForms.length}</div>
              <div className="text-white/70 text-sm">Selecionadas</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {filteredForms.filter((f) => f.status === "completed").length}
              </div>
              <div className="text-white/70 text-sm">Concluídas</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {filteredForms.filter((f) => f.syncStatus === "synced").length}
              </div>
              <div className="text-white/70 text-sm">Sincronizadas</div>
            </CardContent>
          </Card>
        </div>

        {/* Forms List */}
        <div className="space-y-4">
          {filteredForms.map((form) => {
            const aircraftData = aircraft.find((ac) => ac.id === form.aircraftId);
            const isSelected = selectedForms.includes(form.id);

            return (
              <Card
                key={form.id}
                className={`glass-card border-white/20 transition-all duration-200 ${
                  isSelected ? "ring-2 ring-aviation-blue-500 bg-white/25" : "hover:bg-white/20"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectForm(form.id)}
                        className="border-white/30 mt-1"
                      />

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {form.code}
                          </h3>
                          <Badge className={`${getStatusColor(form.status)} text-white`}>
                            {getStatusText(form.status)}
                          </Badge>
                          {form.syncStatus && (
                            <div className={`text-xs ${getSyncStatusColor(form.syncStatus)}`}>
                              {form.syncStatus === "synced" ? "Sincronizado" :
                               form.syncStatus === "pending" ? "Sincronizando..." : "Erro de sinc."}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-white/80">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(parseISO(form.date), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                              {form.shift === "morning"
                                ? "Manhã"
                                : form.shift === "afternoon"
                                ? "Tarde"
                                : "Noite"}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{form.location}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{form.employees.length} funcionário(s)</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>
                              {aircraftData
                                ? `${aircraftData.registration} - ${aircraftData.model}`
                                : "Aeronave não encontrada"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-white/60">
                          <span>Tipos: {form.interventionTypes.join(", ")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const aircraftData = aircraft.find((ac) => ac.id === form.aircraftId);
                          previewCleaningFormPDF(form, aircraftData);
                        }}
                        className="border-white/30 text-white hover:bg-white/20"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintForm(form)}
                        className="border-white/30 text-white hover:bg-white/20"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/30 text-white hover:bg-white/20"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-aviation-gray-800 border-white/20">
                          <DropdownMenuLabel className="text-white">Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-white hover:bg-white/20"
                            onClick={() => {
                              const aircraftData = aircraft.find((ac) => ac.id === form.aircraftId);
                              downloadCleaningFormPDF(form, aircraftData);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredForms.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhuma folha encontrada
              </h3>
              <p className="text-white/70 mb-6">
                {getActiveFilterCount() > 0
                  ? "Ajuste os filtros para encontrar as folhas desejadas"
                  : "Não há folhas de limpeza no sistema"}
              </p>
              {getActiveFilterCount() > 0 && (
                <Button
                  onClick={clearFilters}
                  className="aviation-button"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
