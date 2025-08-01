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
  FileText,
  Download,
  CheckCircle,
  Clock,
  Eye,
  Plane,
  Calendar,
  Star,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ClientMetrics {
  totalServices: number;
  pendingConfirmations: number;
  completedThisMonth: number;
  averageRating: number;
  lastServiceDate: string;
}

interface ServiceReport {
  id: string;
  code: string;
  aircraft: {
    registration: string;
    model: string;
    location: string;
  };
  interventionType: string;
  completedAt: string;
  technician: string;
  status: "pending_confirmation" | "confirmed" | "disputed";
  rating?: number;
  photos: number;
  qualityScore: number;
  duration: number;
}

export function ClientDashboard() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalServices: 0,
    pendingConfirmations: 0,
    completedThisMonth: 0,
    averageRating: 4.8,
    lastServiceDate: "",
  });
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientMetrics();
  }, []);

  const loadClientMetrics = async () => {
    setLoading(true);
    try {
      const reportsData = await loadServiceReports();

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const completedThisMonth = reportsData.filter((report) => {
        const completedDate = new Date(report.completedAt);
        return (
          completedDate.getMonth() === currentMonth &&
          completedDate.getFullYear() === currentYear
        );
      }).length;

      const pendingConfirmations = reportsData.filter(
        (report) => report.status === "pending_confirmation",
      ).length;

      const lastService =
        reportsData.length > 0
          ? reportsData.sort(
              (a, b) =>
                new Date(b.completedAt).getTime() -
                new Date(a.completedAt).getTime(),
            )[0].completedAt
          : "";

      setMetrics({
        totalServices: reportsData.length,
        pendingConfirmations,
        completedThisMonth,
        averageRating: 4.8,
        lastServiceDate: lastService,
      });

      setServiceReports(reportsData);
    } catch (error) {
      console.error("Error loading client metrics:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Falha ao carregar relatórios de serviço.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadServiceReports = async (): Promise<ServiceReport[]> => {
    try {
      const savedForms = localStorage.getItem("cleaningForms");
      const savedAircraft = localStorage.getItem("aviation_aircraft");
      const savedEmployees = localStorage.getItem("aviation_employees");

      if (savedForms && savedAircraft && savedEmployees) {
        const forms = JSON.parse(savedForms);
        const aircraft = JSON.parse(savedAircraft);
        const employees = JSON.parse(savedEmployees);

        const reports: ServiceReport[] = [];

        forms.slice(0, 8).forEach((form: any, index: number) => {
          const aircraftData = aircraft[index % aircraft.length] || {
            registration: `D2-${String(index + 1).padStart(3, "0")}`,
            model: "Boeing 737",
            location: "Terminal A",
          };

          const employee = employees[index % employees.length] || {
            name: "Técnico Desconhecido",
          };

          const interventions = [
            "Limpeza Exterior",
            "Limpeza Interior",
            "Polimento",
            "Lavagem Profunda",
          ];

          const statuses: Array<
            "pending_confirmation" | "confirmed" | "disputed"
          > = ["pending_confirmation", "confirmed", "confirmed", "confirmed"];

          reports.push({
            id: form.id || `report-${index}`,
            code: form.code || `SRV-${String(index + 1).padStart(4, "0")}`,
            aircraft: {
              registration: aircraftData.registration,
              model: aircraftData.model,
              location: aircraftData.location || "Terminal A",
            },
            interventionType: interventions[index % interventions.length],
            completedAt:
              form.completedAt ||
              new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
            technician: employee.name,
            status: statuses[index % statuses.length],
            rating: index < 6 ? 5 : undefined,
            photos: Math.floor(Math.random() * 8) + 3,
            qualityScore: 85 + Math.floor(Math.random() * 15),
            duration: 30 + index * 10,
          });
        });

        return reports.sort(
          (a, b) =>
            new Date(b.completedAt).getTime() -
            new Date(a.completedAt).getTime(),
        );
      }
    } catch (error) {
      console.error("Error loading service reports:", error);
    }
    return [];
  };

  const handleConfirmService = async (reportId: string, rating: number) => {
    try {
      const updatedReports = serviceReports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: "confirmed" as const,
              rating,
            }
          : report,
      );
      setServiceReports(updatedReports);

      // Update metrics
      const pendingConfirmations = updatedReports.filter(
        (report) => report.status === "pending_confirmation",
      ).length;

      setMetrics((prev) => ({
        ...prev,
        pendingConfirmations,
      }));

      toast({
        title: "Serviço confirmado",
        description: "Obrigado pela sua avaliação!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao confirmar serviço.",
        variant: "destructive",
      });
    }
  };

  const handleDisputeService = async (reportId: string) => {
    try {
      const updatedReports = serviceReports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: "disputed" as const,
            }
          : report,
      );
      setServiceReports(updatedReports);

      toast({
        title: "Disputa registrada",
        description: "Nossa equipe entrará em contato em breve.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao registrar disputa.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      toast({
        title: "Download iniciado",
        description: "Relatório PDF será baixado em breve.",
      });
      // Here you would actually trigger the PDF download
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao baixar relat��rio.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: ServiceReport["status"]) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-300">
            Confirmado
          </Badge>
        );
      case "pending_confirmation":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            Aguardando Confirmação
          </Badge>
        );
      case "disputed":
        return <Badge variant="destructive">Em Disputa</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (
    rating: number,
    interactive: boolean = false,
    onRate?: (rating: number) => void,
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-400"
            } ${interactive ? "cursor-pointer hover:text-yellow-300" : ""}`}
            onClick={interactive && onRate ? () => onRate(star) : undefined}
          />
        ))}
      </div>
    );
  };

  if (!hasPermission("client_dashboard")) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Acesso Restrito
        </h3>
        <p className="text-white/70">
          Você não tem permissão para acessar o dashboard de cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-400" />
            Dashboard Cliente
          </h2>
          <p className="text-blue-200 mt-1">
            Acompanhamento dos serviços de limpeza
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => loadClientMetrics()}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Eye className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Service Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Total de Serviços</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.totalServices}
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
                <p className="text-sm text-white/70">Pendentes</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.pendingConfirmations}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Este Mês</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.completedThisMonth}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Avaliação Média</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-white">
                    {metrics.averageRating}
                  </p>
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Confirmations */}
      {metrics.pendingConfirmations > 0 && (
        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/30 backdrop-blur-xl border border-orange-400/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-400" />
              Confirmações Pendentes ({metrics.pendingConfirmations})
            </CardTitle>
            <CardDescription className="text-white/70">
              Serviços aguardando sua aprovação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceReports
              .filter((report) => report.status === "pending_confirmation")
              .map((report) => (
                <div key={report.id} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold">
                        {report.code}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {report.aircraft.registration} -{" "}
                        {report.interventionType}
                      </p>
                      <p className="text-white/60 text-xs mt-1">
                        Concluído em {formatDate(report.completedAt)} por{" "}
                        {report.technician}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-sm">
                        Qualidade: {report.qualityScore}%
                      </p>
                      <p className="text-white/70 text-sm">
                        Fotos: {report.photos}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-white text-sm mb-2">
                        Avalie este serviço:
                      </p>
                      {renderStars(0, true, (rating) =>
                        handleConfirmService(report.id, rating),
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownloadReport(report.id)}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Ver Relatório
                      </Button>
                      <Button
                        onClick={() => handleDisputeService(report.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-400/50 text-red-300 hover:bg-red-500/20"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Reportar Problema
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Service History */}
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Serviços
          </CardTitle>
          <CardDescription className="text-white/70">
            Todos os serviços de limpeza realizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceReports.length > 0 ? (
            serviceReports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Plane className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {report.code}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {report.aircraft.registration} -{" "}
                        {report.interventionType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(report.status)}
                    {report.rating && (
                      <div className="mt-1">{renderStars(report.rating)}</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-white/60">Data</p>
                    <p className="text-white">
                      {formatDate(report.completedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60">Técnico</p>
                    <p className="text-white">{report.technician}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Duração</p>
                    <p className="text-white">{report.duration}min</p>
                  </div>
                  <div>
                    <p className="text-white/60">Qualidade</p>
                    <p className="text-white">{report.qualityScore}%</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => handleDownloadReport(report.id)}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  {report.photos > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Fotos ({report.photos})
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhum serviço realizado ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/history-export">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 backdrop-blur-xl border border-blue-400/50 hover:scale-105 transition-all duration-300 cursor-pointer touch-manipulation">
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Relatórios</h3>
              <p className="text-sm text-blue-300">Ver todos os relatórios</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/30 backdrop-blur-xl border border-green-400/50 hover:scale-105 transition-all duration-300 cursor-pointer touch-manipulation">
          <CardContent className="p-6 text-center">
            <ThumbsUp className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Feedback</h3>
            <p className="text-sm text-green-300">Enviar comentários</p>
          </CardContent>
        </Card>

        <Link to="/settings?tab=profile">
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 backdrop-blur-xl border border-purple-400/50 hover:scale-105 transition-all duration-300 cursor-pointer touch-manipulation">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">
                Configurações
              </h3>
              <p className="text-sm text-purple-300">Preferências da conta</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
