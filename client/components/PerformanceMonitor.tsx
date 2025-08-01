import { useState, useEffect, useRef } from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Zap,
  Database,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Monitor,
  Smartphone,
  Globe,
  RefreshCw,
  Settings,
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: "good" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  history: number[];
  threshold: {
    warning: number;
    critical: number;
  };
}

interface SystemInfo {
  browser: string;
  os: string;
  device: string;
  screen: string;
  connection: string;
  language: string;
  timezone: string;
}

interface NetworkStats {
  online: boolean;
  type: string;
  speed: string;
  latency: number;
  downlink: number;
  rtt: number;
}

const mockInitialMetrics: PerformanceMetric[] = [
  {
    id: "memory",
    name: "Uso de Memória",
    value: 45,
    unit: "%",
    status: "good",
    trend: "stable",
    history: [42, 44, 43, 45, 46, 45],
    threshold: { warning: 70, critical: 85 },
  },
  {
    id: "storage",
    name: "Armazenamento Local",
    value: 62,
    unit: "%",
    status: "warning",
    trend: "up",
    history: [58, 59, 60, 61, 62, 62],
    threshold: { warning: 60, critical: 80 },
  },
  {
    id: "response_time",
    name: "Tempo de Resposta",
    value: 120,
    unit: "ms",
    status: "good",
    trend: "down",
    history: [145, 140, 135, 130, 125, 120],
    threshold: { warning: 200, critical: 500 },
  },
  {
    id: "fps",
    name: "Taxa de Quadros",
    value: 58,
    unit: "fps",
    status: "good",
    trend: "stable",
    history: [60, 59, 58, 58, 57, 58],
    threshold: { warning: 45, critical: 30 },
  },
];

interface PerformanceMonitorProps {
  compact?: boolean;
  className?: string;
}

export function PerformanceMonitor({ compact = false, className }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>(mockInitialMetrics);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    detectSystemInfo();
    detectNetworkInfo();
    
    if (isMonitoring) {
      startMonitoring();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, refreshInterval]);

  const detectSystemInfo = () => {
    const nav = navigator as any;
    const screen = window.screen;
    
    const info: SystemInfo = {
      browser: getBrowserInfo(),
      os: getOSInfo(),
      device: getDeviceInfo(),
      screen: `${screen.width}x${screen.height}`,
      connection: getConnectionInfo(),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    setSystemInfo(info);
  };

  const detectNetworkInfo = () => {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    const stats: NetworkStats = {
      online: navigator.onLine,
      type: connection?.effectiveType || "unknown",
      speed: connection?.downlink ? `${connection.downlink} Mbps` : "unknown",
      latency: connection?.rtt || 0,
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
    };
    
    setNetworkStats(stats);
  };

  const getBrowserInfo = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  };

  const getOSInfo = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iOS")) return "iOS";
    return "Unknown";
  };

  const getDeviceInfo = (): string => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?=.*Mobile)/i.test(navigator.userAgent);
    
    if (isTablet) return "Tablet";
    if (isMobile) return "Mobile";
    return "Desktop";
  };

  const getConnectionInfo = (): string => {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    return connection?.effectiveType || "unknown";
  };

  const startMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      updateMetrics();
    }, refreshInterval);
  };

  const updateMetrics = () => {
    setMetrics(prevMetrics => 
      prevMetrics.map(metric => {
        let newValue = metric.value;
        
        // Simulate realistic changes
        switch (metric.id) {
          case "memory":
            newValue = Math.max(20, Math.min(90, metric.value + (Math.random() - 0.5) * 5));
            break;
          case "storage":
            newValue = Math.max(30, Math.min(95, metric.value + (Math.random() - 0.3) * 2));
            break;
          case "response_time":
            newValue = Math.max(50, Math.min(800, metric.value + (Math.random() - 0.5) * 30));
            break;
          case "fps":
            newValue = Math.max(20, Math.min(60, metric.value + (Math.random() - 0.5) * 3));
            break;
        }

        // Update status based on thresholds
        let status: "good" | "warning" | "critical" = "good";
        if (newValue >= metric.threshold.critical) {
          status = "critical";
        } else if (newValue >= metric.threshold.warning) {
          status = "warning";
        }

        // Calculate trend
        const oldAvg = metric.history.slice(-3).reduce((a, b) => a + b, 0) / 3;
        let trend: "up" | "down" | "stable" = "stable";
        if (newValue > oldAvg * 1.05) trend = "up";
        else if (newValue < oldAvg * 0.95) trend = "down";

        return {
          ...metric,
          value: Math.round(newValue * 100) / 100,
          status,
          trend,
          history: [...metric.history.slice(-9), newValue],
        };
      })
    );

    // Update network stats
    detectNetworkInfo();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "text-red-400 bg-red-500/20 border-red-400/50";
      case "warning":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-400/50";
      default:
        return "text-green-400 bg-green-500/20 border-green-400/50";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-400" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-400" />;
      default:
        return <Activity className="h-3 w-3 text-gray-400" />;
    }
  };

  const getMetricIcon = (id: string) => {
    switch (id) {
      case "memory":
        return Cpu;
      case "storage":
        return HardDrive;
      case "response_time":
        return Clock;
      case "fps":
        return Monitor;
      default:
        return Activity;
    }
  };

  const criticalCount = metrics.filter(m => m.status === "critical").length;
  const warningCount = metrics.filter(m => m.status === "warning").length;

  if (compact) {
    return (
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`text-white hover:bg-white/10 ${
              criticalCount > 0 ? "text-red-400" : 
              warningCount > 0 ? "text-yellow-400" : "text-green-400"
            }`}
          >
            <Activity className="h-4 w-4 mr-2" />
            Performance
            {(criticalCount > 0 || warningCount > 0) && (
              <Badge className="ml-2 h-4 w-4 p-0 text-xs bg-red-500">
                {criticalCount + warningCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl bg-aviation-gray-800 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Monitor de Performance</DialogTitle>
            <DialogDescription className="text-white/70">
              Métricas em tempo real do sistema
            </DialogDescription>
          </DialogHeader>
          <PerformanceMonitor compact={false} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-white font-semibold">Monitor de Performance</h3>
          <div className="flex items-center space-x-2">
            <Switch
              checked={isMonitoring}
              onCheckedChange={setIsMonitoring}
              size="sm"
            />
            <Label className="text-white text-sm">
              {isMonitoring ? "Monitorando" : "Pausado"}
            </Label>
          </div>
        </div>
        <Button
          onClick={() => updateMetrics()}
          variant="outline"
          size="sm"
          className="border-white/30 text-white hover:bg-white/20"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const IconComponent = getMetricIcon(metric.id);
          
          return (
            <Card key={metric.id} className="glass-card border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5 text-blue-400" />
                    <span className="text-white font-medium text-sm">{metric.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metric.trend)}
                    <Badge className={`${getStatusColor(metric.status)} text-xs`}>
                      {metric.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-end space-x-2">
                    <span className="text-2xl font-bold text-white">
                      {metric.value}
                    </span>
                    <span className="text-white/60 text-sm">{metric.unit}</span>
                  </div>
                  
                  {metric.unit === "%" && (
                    <Progress 
                      value={metric.value} 
                      className={`h-2 ${
                        metric.status === "critical" ? "bg-red-500/20" :
                        metric.status === "warning" ? "bg-yellow-500/20" :
                        "bg-green-500/20"
                      }`}
                    />
                  )}
                  
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Warn: {metric.threshold.warning}{metric.unit}</span>
                    <span>Crit: {metric.threshold.critical}{metric.unit}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemInfo && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-white/70">Navegador:</span>
                  <p className="text-white font-medium">{systemInfo.browser}</p>
                </div>
                <div>
                  <span className="text-white/70">Sistema:</span>
                  <p className="text-white font-medium">{systemInfo.os}</p>
                </div>
                <div>
                  <span className="text-white/70">Dispositivo:</span>
                  <p className="text-white font-medium">{systemInfo.device}</p>
                </div>
                <div>
                  <span className="text-white/70">Resolução:</span>
                  <p className="text-white font-medium">{systemInfo.screen}</p>
                </div>
                <div>
                  <span className="text-white/70">Idioma:</span>
                  <p className="text-white font-medium">{systemInfo.language}</p>
                </div>
                <div>
                  <span className="text-white/70">Fuso Horário:</span>
                  <p className="text-white font-medium">{systemInfo.timezone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Status da Rede</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {networkStats && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Status:</span>
                  <div className="flex items-center space-x-2">
                    {networkStats.online ? (
                      <Wifi className="h-4 w-4 text-green-400" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-400" />
                    )}
                    <Badge variant={networkStats.online ? "default" : "destructive"}>
                      {networkStats.online ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-white/70">Tipo:</span>
                    <p className="text-white font-medium">{networkStats.type}</p>
                  </div>
                  <div>
                    <span className="text-white/70">Velocidade:</span>
                    <p className="text-white font-medium">{networkStats.speed}</p>
                  </div>
                  <div>
                    <span className="text-white/70">Latência:</span>
                    <p className="text-white font-medium">{networkStats.rtt}ms</p>
                  </div>
                  <div>
                    <span className="text-white/70">Download:</span>
                    <p className="text-white font-medium">{networkStats.downlink} Mbps</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(criticalCount > 0 || warningCount > 0) && (
        <Card className="glass-card border-yellow-400/50 bg-yellow-500/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-yellow-300 font-medium">Alertas de Performance</p>
                <p className="text-yellow-200 text-sm">
                  {criticalCount > 0 && `${criticalCount} críticos`}
                  {criticalCount > 0 && warningCount > 0 && ", "}
                  {warningCount > 0 && `${warningCount} avisos`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
