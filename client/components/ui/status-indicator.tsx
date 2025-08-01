import React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Info,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Battery,
  BatteryLow,
  Signal,
  SignalLow,
  AlertTriangle,
  Zap,
  Shield,
  Activity,
  Pause,
  Play,
  Upload,
  Download,
  RotateCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type StatusType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "pending"
  | "processing"
  | "online"
  | "offline"
  | "syncing"
  | "active"
  | "inactive";

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  variant?: "badge" | "inline" | "card" | "minimal";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  showIcon = true,
  variant = "badge",
  size = "md",
  animated = true,
  className,
}: StatusIndicatorProps) {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case "success":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-400/50",
          badgeVariant: "secondary" as const,
          label: label || "Sucesso",
        };
      case "error":
        return {
          icon: XCircle,
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          borderColor: "border-red-400/50",
          badgeVariant: "destructive" as const,
          label: label || "Erro",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: "text-orange-400",
          bgColor: "bg-orange-500/20",
          borderColor: "border-orange-400/50",
          badgeVariant: "secondary" as const,
          label: label || "Aviso",
        };
      case "info":
        return {
          icon: Info,
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          borderColor: "border-blue-400/50",
          badgeVariant: "secondary" as const,
          label: label || "Informação",
        };
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-400/50",
          badgeVariant: "secondary" as const,
          label: label || "Pendente",
        };
      case "processing":
        return {
          icon: Activity,
          color: "text-purple-400",
          bgColor: "bg-purple-500/20",
          borderColor: "border-purple-400/50",
          badgeVariant: "secondary" as const,
          label: label || "Processando",
        };
      case "online":
        return {
          icon: Wifi,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-400/50",
          badgeVariant: "secondary" as const,
          label: label || "Online",
        };
      case "offline":
        return {
          icon: WifiOff,
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          borderColor: "border-red-400/50",
          badgeVariant: "destructive" as const,
          label: label || "Offline",
        };
      case "syncing":
        return {
          icon: Sync,
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          borderColor: "border-blue-400/50",
          badgeVariant: "secondary" as const,
          label: label || "Sincronizando",
        };
      case "active":
        return {
          icon: Play,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-400/50",
          badgeVariant: "secondary" as const,
          label: label || "Ativo",
        };
      case "inactive":
        return {
          icon: Pause,
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          borderColor: "border-gray-400/50",
          badgeVariant: "secondary" as const,
          label: label || "Inativo",
        };
      default:
        return {
          icon: Info,
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          borderColor: "border-gray-400/50",
          badgeVariant: "secondary" as const,
          label: label || "Desconhecido",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (variant === "badge") {
    return (
      <Badge
        variant={config.badgeVariant}
        className={cn("flex items-center gap-1", className)}
      >
        {showIcon && (
          <Icon
            className={cn(
              sizeClasses[size],
              animated &&
                (status === "processing" || status === "syncing") &&
                "animate-spin",
            )}
          />
        )}
        <span className={textSizes[size]}>{config.label}</span>
      </Badge>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showIcon && (
          <Icon
            className={cn(
              sizeClasses[size],
              config.color,
              animated &&
                (status === "processing" || status === "syncing") &&
                "animate-spin",
            )}
          />
        )}
        <span className={cn("text-white", textSizes[size])}>
          {config.label}
        </span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "p-3 rounded-lg border",
          config.bgColor,
          config.borderColor,
          className,
        )}
      >
        <div className="flex items-center gap-3">
          {showIcon && (
            <Icon
              className={cn(
                sizeClasses[size],
                config.color,
                animated &&
                  (status === "processing" || status === "syncing") &&
                  "animate-spin",
              )}
            />
          )}
          <span className={cn("text-white font-medium", textSizes[size])}>
            {config.label}
          </span>
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {showIcon && (
          <Icon
            className={cn(
              sizeClasses[size],
              config.color,
              animated &&
                (status === "processing" || status === "syncing") &&
                "animate-spin",
            )}
          />
        )}
      </div>
    );
  }

  return null;
}

interface ConnectionStatusProps {
  isOnline: boolean;
  isSyncing?: boolean;
  lastSync?: Date;
  className?: string;
}

export function ConnectionStatus({
  isOnline,
  isSyncing = false,
  lastSync,
  className,
}: ConnectionStatusProps) {
  const getStatus = (): StatusType => {
    if (isSyncing) return "syncing";
    return isOnline ? "online" : "offline";
  };

  const getLabel = () => {
    if (isSyncing) return "Sincronizando";
    if (isOnline) {
      if (lastSync) {
        const timeAgo = Math.floor((Date.now() - lastSync.getTime()) / 60000);
        if (timeAgo < 1) return "Online - Sincronizado agora";
        if (timeAgo < 60) return `Online - Sync há ${timeAgo}m`;
        return "Online";
      }
      return "Online";
    }
    return "Offline";
  };

  return (
    <StatusIndicator
      status={getStatus()}
      label={getLabel()}
      variant="inline"
      className={className}
    />
  );
}

interface TaskStatusProps {
  status: "not_started" | "in_progress" | "completed" | "cancelled" | "failed";
  progress?: number;
  className?: string;
}

export function TaskStatus({ status, progress, className }: TaskStatusProps) {
  const getStatusType = (): StatusType => {
    switch (status) {
      case "not_started":
        return "pending";
      case "in_progress":
        return "processing";
      case "completed":
        return "success";
      case "cancelled":
        return "warning";
      case "failed":
        return "error";
      default:
        return "info";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "not_started":
        return "Não iniciado";
      case "in_progress":
        return progress
          ? `Em andamento (${Math.round(progress)}%)`
          : "Em andamento";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      case "failed":
        return "Falhou";
      default:
        return "Desconhecido";
    }
  };

  return (
    <StatusIndicator
      status={getStatusType()}
      label={getLabel()}
      variant="badge"
      className={className}
    />
  );
}

interface SystemHealthProps {
  cpu?: number;
  memory?: number;
  storage?: number;
  network?: "good" | "poor" | "offline";
  className?: string;
}

export function SystemHealth({
  cpu,
  memory,
  storage,
  network = "good",
  className,
}: SystemHealthProps) {
  const getThresholdStatus = (value: number): StatusType => {
    if (value < 60) return "success";
    if (value < 80) return "warning";
    return "error";
  };

  const getNetworkStatus = (): StatusType => {
    switch (network) {
      case "good":
        return "success";
      case "poor":
        return "warning";
      case "offline":
        return "error";
      default:
        return "info";
    }
  };

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {cpu !== undefined && (
        <StatusIndicator
          status={getThresholdStatus(cpu)}
          label={`CPU ${Math.round(cpu)}%`}
          variant="inline"
          size="sm"
        />
      )}
      {memory !== undefined && (
        <StatusIndicator
          status={getThresholdStatus(memory)}
          label={`RAM ${Math.round(memory)}%`}
          variant="inline"
          size="sm"
        />
      )}
      {storage !== undefined && (
        <StatusIndicator
          status={getThresholdStatus(storage)}
          label={`Disco ${Math.round(storage)}%`}
          variant="inline"
          size="sm"
        />
      )}
      <StatusIndicator
        status={getNetworkStatus()}
        label={`Rede ${network}`}
        variant="inline"
        size="sm"
      />
    </div>
  );
}

interface QualityScoreProps {
  score: number;
  maxScore?: number;
  showLabel?: boolean;
  className?: string;
}

export function QualityScore({
  score,
  maxScore = 100,
  showLabel = true,
  className,
}: QualityScoreProps) {
  const percentage = (score / maxScore) * 100;

  const getStatus = (): StatusType => {
    if (percentage >= 90) return "success";
    if (percentage >= 70) return "warning";
    return "error";
  };

  const getLabel = () => {
    if (!showLabel) return undefined;
    return `Qualidade: ${Math.round(percentage)}%`;
  };

  return (
    <StatusIndicator
      status={getStatus()}
      label={getLabel()}
      variant="badge"
      className={className}
    />
  );
}
