import { useState, useEffect } from "react";
import { Camera, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { photoEvidenceService } from "@/lib/photo-evidence-service";

interface PhotoEvidenceSummaryProps {
  formId: string;
  compact?: boolean;
}

export default function PhotoEvidenceSummary({
  formId,
  compact = false,
}: PhotoEvidenceSummaryProps) {
  const [summary, setSummary] = useState({
    totalPhotos: 0,
    beforePhotos: 0,
    afterPhotos: 0,
    categorySummary: {
      exterior: { before: 0, after: 0 },
      interior: { before: 0, after: 0 },
      details: { before: 0, after: 0 },
    },
    uploadStatus: {
      uploaded: 0,
      pending: 0,
      error: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [formId]);

  const loadSummary = async () => {
    try {
      const photoSummary = await photoEvidenceService.getPhotoSummary(formId);
      setSummary(photoSummary);
    } catch (error) {
      console.error("Error loading photo summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-white/50">
        <Camera className="h-4 w-4 animate-pulse" />
        <span className="text-xs">Carregando fotos...</span>
      </div>
    );
  }

  if (summary.totalPhotos === 0) {
    return (
      <div className="flex items-center space-x-2 text-white/50">
        <Camera className="h-4 w-4" />
        <span className="text-xs">Nenhuma evidência</span>
      </div>
    );
  }

  const getUploadStatusColor = () => {
    if (summary.uploadStatus.error > 0) return "bg-red-500";
    if (summary.uploadStatus.pending > 0) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getUploadStatusText = () => {
    if (summary.uploadStatus.error > 0) return "Erro no envio";
    if (summary.uploadStatus.pending > 0) return "Envio pendente";
    return "Sincronizada";
  };

  const getUploadStatusIcon = () => {
    if (summary.uploadStatus.error > 0) return AlertCircle;
    if (summary.uploadStatus.pending > 0) return Clock;
    return CheckCircle;
  };

  if (compact) {
    const StatusIcon = getUploadStatusIcon();

    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Camera className="h-4 w-4 text-blue-300" />
          <span className="text-xs text-white">{summary.totalPhotos}</span>
        </div>
        <div className="flex items-center space-x-1">
          <StatusIcon className="h-3 w-3 text-white" />
          <Badge
            className={`${getUploadStatusColor()} text-white text-xs px-1 py-0`}
          >
            {summary.uploadStatus.uploaded}/{summary.totalPhotos}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="h-4 w-4 text-blue-300" />
          <span className="text-sm text-white font-medium">
            Evidências Fotográficas
          </span>
        </div>
        <Badge className={`${getUploadStatusColor()} text-white text-xs`}>
          {getUploadStatusText()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <div className="text-white/70">Antes: {summary.beforePhotos}</div>
          <div className="text-white/50 space-y-0.5">
            <div>• Exterior: {summary.categorySummary.exterior.before}</div>
            <div>• Interior: {summary.categorySummary.interior.before}</div>
            <div>• Detalhes: {summary.categorySummary.details.before}</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-white/70">Depois: {summary.afterPhotos}</div>
          <div className="text-white/50 space-y-0.5">
            <div>• Exterior: {summary.categorySummary.exterior.after}</div>
            <div>• Interior: {summary.categorySummary.interior.after}</div>
            <div>• Detalhes: {summary.categorySummary.details.after}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60">
          Total: {summary.totalPhotos} foto
          {summary.totalPhotos !== 1 ? "s" : ""}
        </span>
        <div className="flex space-x-2">
          {summary.uploadStatus.uploaded > 0 && (
            <Badge
              variant="secondary"
              className="text-xs bg-green-500/20 text-green-300"
            >
              ✓ {summary.uploadStatus.uploaded}
            </Badge>
          )}
          {summary.uploadStatus.pending > 0 && (
            <Badge
              variant="secondary"
              className="text-xs bg-yellow-500/20 text-yellow-300"
            >
              ⏳ {summary.uploadStatus.pending}
            </Badge>
          )}
          {summary.uploadStatus.error > 0 && (
            <Badge
              variant="secondary"
              className="text-xs bg-red-500/20 text-red-300"
            >
              ✗ {summary.uploadStatus.error}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
