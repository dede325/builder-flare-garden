import { useState, useEffect } from "react";
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Users,
  Plane,
  FileText,
  Shield,
  Zap,
  BarChart3,
  Settings,
  Trash2,
  MarkAsUnread,
  Filter,
  Search,
  Archive,
  Star,
  StarOff,
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "system";
  category: "form" | "user" | "system" | "security" | "analytics" | "automation";
  priority: "low" | "medium" | "high" | "urgent";
  timestamp: string;
  read: boolean;
  starred: boolean;
  archived: boolean;
  actionable: boolean;
  actions?: NotificationAction[];
  data?: Record<string, any>;
}

interface NotificationAction {
  id: string;
  label: string;
  type: "primary" | "secondary" | "danger";
  action: () => void;
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  categories: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    title: "Nova Folha de Limpeza",
    message: "Folha CS-TNP-001 foi criada e precisa de assinatura",
    type: "info",
    category: "form",
    priority: "medium",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    read: false,
    starred: false,
    archived: false,
    actionable: true,
    actions: [
      {
        id: "review",
        label: "Revisar",
        type: "primary",
        action: () => console.log("Review action"),
      },
      {
        id: "assign",
        label: "Atribuir",
        type: "secondary",
        action: () => console.log("Assign action"),
      },
    ],
  },
  {
    id: "notif-2",
    title: "Alerta de SLA",
    message: "Formulário de limpeza está atrasado há 2 horas",
    type: "warning",
    category: "analytics",
    priority: "high",
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    read: false,
    starred: true,
    archived: false,
    actionable: true,
    actions: [
      {
        id: "escalate",
        label: "Escalar",
        type: "danger",
        action: () => console.log("Escalate action"),
      },
    ],
  },
  {
    id: "notif-3",
    title: "Backup Concluído",
    message: "Backup automático foi realizado com sucesso",
    type: "success",
    category: "system",
    priority: "low",
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    read: true,
    starred: false,
    archived: false,
    actionable: false,
  },
  {
    id: "notif-4",
    title: "Novo Usuário Registrado",
    message: "Maria Silva se registrou no sistema",
    type: "info",
    category: "user",
    priority: "medium",
    timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    read: false,
    starred: false,
    archived: false,
    actionable: true,
    actions: [
      {
        id: "approve",
        label: "Aprovar",
        type: "primary",
        action: () => console.log("Approve user"),
      },
      {
        id: "review_user",
        label: "Revisar",
        type: "secondary",
        action: () => console.log("Review user"),
      },
    ],
  },
  {
    id: "notif-5",
    title: "Falha de Segurança Detectada",
    message: "Tentativas de login inválidas detectadas",
    type: "error",
    category: "security",
    priority: "urgent",
    timestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
    read: false,
    starred: true,
    archived: false,
    actionable: true,
    actions: [
      {
        id: "investigate",
        label: "Investigar",
        type: "danger",
        action: () => console.log("Investigate security"),
      },
    ],
  },
];

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true,
    desktop: true,
    categories: {
      form: true,
      user: true,
      system: true,
      security: true,
      analytics: true,
      automation: true,
    },
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
    },
  });
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("aviation_notification_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Simulate real-time notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 30 seconds
        addRandomNotification();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const addRandomNotification = () => {
    const templates = [
      {
        title: "Formulário Atualizado",
        message: "CS-TOR-002 foi atualizado",
        type: "info" as const,
        category: "form" as const,
        priority: "medium" as const,
      },
      {
        title: "Sistema Sincronizado",
        message: "Todos os dados foram sincronizados",
        type: "success" as const,
        category: "system" as const,
        priority: "low" as const,
      },
      {
        title: "Alerta de Performance",
        message: "Eficiência abaixo do esperado",
        type: "warning" as const,
        category: "analytics" as const,
        priority: "high" as const,
      },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      ...template,
      timestamp: new Date().toISOString(),
      read: false,
      starred: false,
      archived: false,
      actionable: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    if (settings.desktop) {
      showDesktopNotification(newNotification);
    }
  };

  const showDesktopNotification = (notification: Notification) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/icon-192x192.png",
        tag: notification.id,
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: "Notificações Habilitadas",
          description: "Você receberá notificações do sistema",
        });
      }
    }
  };

  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      // Search filter
      if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filterCategory !== "all" && notification.category !== filterCategory) {
        return false;
      }

      // Priority filter
      if (filterPriority !== "all" && notification.priority !== filterPriority) {
        return false;
      }

      // Unread filter
      if (showUnreadOnly && notification.read) {
        return false;
      }

      // Tab filter
      if (activeTab === "unread" && notification.read) return false;
      if (activeTab === "starred" && !notification.starred) return false;
      if (activeTab === "archived" && !notification.archived) return false;

      return true;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    toast({
      title: "Todas as notificações marcadas como lidas",
    });
  };

  const toggleStar = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, starred: !notif.starred } : notif
      )
    );
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, archived: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem("aviation_notification_settings", JSON.stringify(newSettings));
    toast({
      title: "Configurações Salvas",
      description: "Suas preferências de notificação foram atualizadas",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return CheckCircle;
      case "warning":
        return AlertTriangle;
      case "error":
        return X;
      default:
        return Info;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "form":
        return FileText;
      case "user":
        return Users;
      case "system":
        return Settings;
      case "security":
        return Shield;
      case "analytics":
        return BarChart3;
      case "automation":
        return Zap;
      default:
        return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-400 bg-red-500/20 border-red-400/50";
      case "high":
        return "text-orange-400 bg-orange-500/20 border-orange-400/50";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-400/50";
      default:
        return "text-blue-400 bg-blue-500/20 border-blue-400/50";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.priority === "urgent" && !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className={`absolute -top-1 -right-1 h-5 w-5 p-0 text-xs ${
                urgentCount > 0 ? "bg-red-500" : "bg-blue-500"
              }`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-aviation-gray-800 border-white/20" align="end">
        <div className="max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Notificações</h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={requestNotificationPermission}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                {unreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <Input
                placeholder="Buscar notificações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="aviation-input text-sm"
              />
              <div className="flex space-x-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="aviation-input text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="form">Formulários</SelectItem>
                    <SelectItem value="user">Usuários</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="security">Segurança</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-1">
                  <Switch
                    checked={showUnreadOnly}
                    onCheckedChange={setShowUnreadOnly}
                    size="sm"
                  />
                  <Label className="text-white text-xs">Não lidas</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 bg-white/5 mx-4 mt-2">
              <TabsTrigger value="all" className="text-white text-xs">Todas</TabsTrigger>
              <TabsTrigger value="unread" className="text-white text-xs">
                Não lidas {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="starred" className="text-white text-xs">Favoritas</TabsTrigger>
              <TabsTrigger value="archived" className="text-white text-xs">Arquivo</TabsTrigger>
            </TabsList>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              <TabsContent value={activeTab} className="mt-0 space-y-0">
                {getFilteredNotifications().length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/70 text-sm">Nenhuma notificação encontrada</p>
                  </div>
                ) : (
                  getFilteredNotifications().map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    const CategoryIcon = getCategoryIcon(notification.category);
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                          !notification.read ? "bg-blue-500/10" : ""
                        }`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <IconComponent className={`h-4 w-4 ${getTypeColor(notification.type)}`} />
                                <span className="text-white font-medium text-sm truncate">
                                  {notification.title}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                <Badge className={`${getPriorityColor(notification.priority)} text-xs`}>
                                  {notification.priority}
                                </Badge>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStar(notification.id);
                                  }}
                                  className="text-white/50 hover:text-yellow-400 transition-colors"
                                >
                                  {notification.starred ? (
                                    <Star className="h-3 w-3 fill-current" />
                                  ) : (
                                    <StarOff className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-white/70 text-xs mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <CategoryIcon className="h-3 w-3 text-white/50" />
                                <span className="text-white/50 text-xs">
                                  {new Date(notification.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              
                              {notification.actions && notification.actions.length > 0 && (
                                <div className="flex space-x-1">
                                  {notification.actions.slice(0, 2).map((action) => (
                                    <Button
                                      key={action.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        action.action();
                                      }}
                                      variant={action.type === "primary" ? "default" : "ghost"}
                                      size="sm"
                                      className={`text-xs h-6 px-2 ${
                                        action.type === "danger" ? "text-red-300 hover:bg-red-500/20" : ""
                                      }`}
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}
