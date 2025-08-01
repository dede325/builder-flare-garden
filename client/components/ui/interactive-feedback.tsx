import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  Heart,
  Zap,
  Clock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Save,
  Download,
  Upload,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActionFeedbackProps {
  action: "save" | "delete" | "upload" | "download" | "sync" | "like" | "dislike";
  status: "idle" | "loading" | "success" | "error";
  onAction?: () => void;
  disabled?: boolean;
  variant?: "button" | "icon";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ActionFeedback({
  action,
  status,
  onAction,
  disabled = false,
  variant = "button",
  size = "md",
  className,
}: ActionFeedbackProps) {
  const { toast } = useToast();

  const getActionConfig = (action: string) => {
    switch (action) {
      case "save":
        return {
          icon: Save,
          label: "Salvar",
          loadingLabel: "Salvando...",
          successLabel: "Salvo!",
          errorLabel: "Erro ao salvar",
          color: "blue",
        };
      case "delete":
        return {
          icon: Trash2,
          label: "Excluir",
          loadingLabel: "Excluindo...",
          successLabel: "Excluído!",
          errorLabel: "Erro ao excluir",
          color: "red",
        };
      case "upload":
        return {
          icon: Upload,
          label: "Enviar",
          loadingLabel: "Enviando...",
          successLabel: "Enviado!",
          errorLabel: "Erro no envio",
          color: "green",
        };
      case "download":
        return {
          icon: Download,
          label: "Baixar",
          loadingLabel: "Baixando...",
          successLabel: "Baixado!",
          errorLabel: "Erro no download",
          color: "purple",
        };
      case "sync":
        return {
          icon: RefreshCw,
          label: "Sincronizar",
          loadingLabel: "Sincronizando...",
          successLabel: "Sincronizado!",
          errorLabel: "Erro na sincronização",
          color: "blue",
        };
      case "like":
        return {
          icon: ThumbsUp,
          label: "Curtir",
          loadingLabel: "Enviando...",
          successLabel: "Curtido!",
          errorLabel: "Erro",
          color: "green",
        };
      case "dislike":
        return {
          icon: ThumbsDown,
          label: "Não curtir",
          loadingLabel: "Enviando...",
          successLabel: "Enviado!",
          errorLabel: "Erro",
          color: "red",
        };
      default:
        return {
          icon: CheckCircle,
          label: "Ação",
          loadingLabel: "Processando...",
          successLabel: "Sucesso!",
          errorLabel: "Erro",
          color: "blue",
        };
    }
  };

  const config = getActionConfig(action);
  const Icon = config.icon;

  const getLabel = () => {
    switch (status) {
      case "loading":
        return config.loadingLabel;
      case "success":
        return config.successLabel;
      case "error":
        return config.errorLabel;
      default:
        return config.label;
    }
  };

  const getVariant = () => {
    switch (status) {
      case "success":
        return "default";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size={size === "sm" ? "sm" : "icon"}
        onClick={onAction}
        disabled={disabled || status === "loading"}
        className={cn(
          status === "success" && "text-green-400 hover:text-green-300",
          status === "error" && "text-red-400 hover:text-red-300",
          className
        )}
      >
        <Icon
          className={cn(
            sizeClasses[size],
            status === "loading" && "animate-spin"
          )}
        />
      </Button>
    );
  }

  return (
    <Button
      variant={getVariant()}
      size={size}
      onClick={onAction}
      disabled={disabled || status === "loading"}
      className={cn(className)}
    >
      <Icon
        className={cn(
          sizeClasses[size],
          status === "loading" && "animate-spin",
          "mr-2"
        )}
      />
      {getLabel()}
    </Button>
  );
}

interface RatingProps {
  value: number;
  maxValue?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Rating({
  value,
  maxValue = 5,
  onChange,
  readonly = false,
  size = "md",
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxValue }, (_, index) => {
        const starValue = index + 1;
        const isFilled = (hoverValue || value) >= starValue;

        return (
          <button
            key={index}
            type="button"
            onClick={() => !readonly && onChange?.(starValue)}
            onMouseEnter={() => !readonly && setHoverValue(starValue)}
            onMouseLeave={() => !readonly && setHoverValue(0)}
            disabled={readonly}
            className={cn(
              "transition-colors",
              !readonly && "hover:scale-110 transform transition-transform",
              readonly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-400",
                !readonly && "hover:text-yellow-300"
              )}
            />
          </button>
        );
      })}
      {!readonly && (
        <span className="ml-2 text-sm text-white/70">
          {hoverValue || value || 0} de {maxValue}
        </span>
      )}
    </div>
  );
}

interface ToggleButtonProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  icon: React.ElementType;
  pressedIcon?: React.ElementType;
  label?: string;
  pressedLabel?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ToggleButton({
  pressed,
  onPressedChange,
  icon: Icon,
  pressedIcon: PressedIcon,
  label,
  pressedLabel,
  variant = "outline",
  size = "md",
  className,
}: ToggleButtonProps) {
  const ActiveIcon = PressedIcon || Icon;
  const currentLabel = pressed ? (pressedLabel || label) : label;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Button
      variant={pressed ? "default" : variant}
      size={size}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        pressed && "bg-blue-600 hover:bg-blue-700 text-white",
        className
      )}
    >
      {pressed ? (
        <ActiveIcon className={cn(sizeClasses[size], currentLabel && "mr-2")} />
      ) : (
        <Icon className={cn(sizeClasses[size], currentLabel && "mr-2")} />
      )}
      {currentLabel}
    </Button>
  );
}

interface LikeButtonProps {
  liked: boolean;
  onLike: (liked: boolean) => void;
  count?: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LikeButton({
  liked,
  onLike,
  count,
  showCount = true,
  size = "md",
  className,
}: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onLike(!liked);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 transition-all",
        liked && "text-red-400 hover:text-red-300",
        isAnimating && "scale-110",
        className
      )}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          liked && "fill-red-400",
          isAnimating && "animate-pulse"
        )}
      />
      {showCount && count !== undefined && (
        <span className="text-sm">{count}</span>
      )}
    </Button>
  );
}

interface VisibilityToggleProps {
  visible: boolean;
  onToggle: (visible: boolean) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VisibilityToggle({
  visible,
  onToggle,
  size = "md",
  className,
}: VisibilityToggleProps) {
  return (
    <ToggleButton
      pressed={visible}
      onPressedChange={onToggle}
      icon={EyeOff}
      pressedIcon={Eye}
      variant="ghost"
      size={size}
      className={className}
    />
  );
}

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export function SuccessAnimation({
  show,
  message = "Sucesso!",
  duration = 2000,
  onComplete,
  className,
}: SuccessAnimationProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm",
        className
      )}
    >
      <Card className="bg-green-500/20 border-green-400/50 backdrop-blur-xl p-8">
        <div className="flex flex-col items-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-400 animate-bounce" />
          <p className="text-white text-lg font-medium text-center">
            {message}
          </p>
        </div>
      </Card>
    </div>
  );
}

interface PulseButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  pulseColor?: "blue" | "green" | "red" | "yellow";
  disabled?: boolean;
  className?: string;
}

export function PulseButton({
  children,
  onClick,
  pulseColor = "blue",
  disabled = false,
  className,
}: PulseButtonProps) {
  const [isPulsing, setIsPulsing] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    setIsPulsing(true);
    onClick?.();
    
    setTimeout(() => setIsPulsing(false), 1000);
  };

  const colorClasses = {
    blue: "shadow-blue-400/50",
    green: "shadow-green-400/50",
    red: "shadow-red-400/50",
    yellow: "shadow-yellow-400/50",
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative transition-all duration-300",
        isPulsing && `animate-pulse shadow-lg ${colorClasses[pulseColor]}`,
        className
      )}
    >
      {children}
    </Button>
  );
}
