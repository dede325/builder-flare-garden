import React from "react";
import { cn } from "@/lib/utils";
import { Loader2, Plane, Settings, RefreshCw, Download, Upload } from "lucide-react";

interface LoadingStateProps {
  variant?: "default" | "aviation" | "minimal" | "card" | "inline";
  size?: "sm" | "md" | "lg";
  message?: string;
  progress?: number;
  className?: string;
}

export function LoadingState({
  variant = "default",
  size = "md",
  message,
  progress,
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const messageSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  if (variant === "aviation") {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8", className)}>
        <div className="relative">
          <Plane className={cn("text-blue-400 animate-pulse", sizeClasses[size])} />
          <div className="absolute inset-0 animate-spin">
            <Loader2 className={cn("text-blue-600", sizeClasses[size])} />
          </div>
        </div>
        {message && (
          <p className={cn("text-white mt-4 text-center", messageSizes[size])}>
            {message}
          </p>
        )}
        {progress !== undefined && (
          <div className="w-full max-w-xs mt-4">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className={cn("animate-spin text-blue-400", sizeClasses[size])} />
        {message && (
          <span className={cn("text-white", messageSizes[size])}>{message}</span>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn(
        "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-lg p-6",
        className
      )}>
        <div className="flex flex-col items-center justify-center">
          <Loader2 className={cn("animate-spin text-blue-400 mb-4", sizeClasses[size])} />
          {message && (
            <p className={cn("text-white text-center", messageSizes[size])}>
              {message}
            </p>
          )}
          {progress !== undefined && (
            <div className="w-full mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Carregando</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2 py-2", className)}>
        <Loader2 className={cn("animate-spin text-blue-400", sizeClasses[size])} />
        {message && (
          <span className={cn("text-white/80", messageSizes[size])}>{message}</span>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <Loader2 className={cn("animate-spin text-blue-400 mb-4", sizeClasses[size])} />
      {message && (
        <p className={cn("text-white text-center", messageSizes[size])}>
          {message}
        </p>
      )}
      {progress !== undefined && (
        <div className="w-full max-w-sm mt-4">
          <div className="flex justify-between text-xs text-white/70 mb-1">
            <span>Progresso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionLoadingProps {
  action: "sync" | "download" | "upload" | "save" | "delete" | "process";
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ActionLoading({
  action,
  message,
  size = "md",
  className,
}: ActionLoadingProps) {
  const icons = {
    sync: RefreshCw,
    download: Download,
    upload: Upload,
    save: Settings,
    delete: Loader2,
    process: Loader2,
  };

  const Icon = icons[action];
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const defaultMessages = {
    sync: "Sincronizando...",
    download: "Baixando...",
    upload: "Enviando...",
    save: "Salvando...",
    delete: "Removendo...",
    process: "Processando...",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon className={cn("animate-spin text-blue-400", sizeClasses[size])} />
      <span className="text-white/80 text-sm">
        {message || defaultMessages[action]}
      </span>
    </div>
  );
}

interface SkeletonProps {
  variant?: "text" | "circle" | "rectangle" | "card";
  className?: string;
  animate?: boolean;
}

export function Skeleton({
  variant = "text",
  className,
  animate = true,
}: SkeletonProps) {
  const baseClasses = cn(
    "bg-white/10 rounded",
    animate && "animate-pulse",
    className
  );

  if (variant === "text") {
    return <div className={cn(baseClasses, "h-4 w-full")} />;
  }

  if (variant === "circle") {
    return <div className={cn(baseClasses, "h-12 w-12 rounded-full")} />;
  }

  if (variant === "rectangle") {
    return <div className={cn(baseClasses, "h-24 w-full")} />;
  }

  if (variant === "card") {
    return (
      <div className={cn(baseClasses, "p-4 space-y-3")}>
        <Skeleton variant="circle" className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  return <div className={baseClasses} />;
}

interface ProgressIndicatorProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function ProgressIndicator({
  progress,
  label,
  showPercentage = true,
  variant = "default",
  className,
}: ProgressIndicatorProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const variantClasses = {
    default: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-orange-500",
    error: "bg-red-500",
  };

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm text-white/70 mb-2">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out",
            variantClasses[variant]
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

export interface PulseIndicatorProps {
  variant?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "orange" | "red";
  className?: string;
}

export function PulseIndicator({
  variant = "md",
  color = "blue",
  className,
}: PulseIndicatorProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  const colorClasses = {
    blue: "bg-blue-400",
    green: "bg-green-400",
    orange: "bg-orange-400",
    red: "bg-red-400",
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div
        className={cn(
          "rounded-full animate-ping absolute",
          sizeClasses[variant],
          colorClasses[color],
          "opacity-75"
        )}
      />
      <div
        className={cn(
          "rounded-full",
          sizeClasses[variant],
          colorClasses[color]
        )}
      />
    </div>
  );
}
