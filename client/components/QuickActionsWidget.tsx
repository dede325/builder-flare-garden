import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  FileText,
  Users,
  Plane,
  Search,
  Download,
  Settings,
  Clock,
  Zap,
  BarChart3,
  Shield,
  Bell,
  ChevronRight,
  Star,
  History,
  Filter,
  RefreshCw,
  Eye,
  Camera,
  QrCode,
  Smartphone,
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: string | (() => void);
  category: "form" | "management" | "analytics" | "system" | "mobile";
  priority: "high" | "medium" | "low";
  roles?: string[];
  badge?: string;
  shortcut?: string;
}

const quickActions: QuickAction[] = [
  {
    id: "new-form",
    title: "Nova Folha de Limpeza",
    description: "Criar formulário de limpeza",
    icon: Plus,
    action: "/cleaning-forms",
    category: "form",
    priority: "high",
    shortcut: "Ctrl+N",
  },
  {
    id: "search-forms",
    title: "Buscar Formulários",
    description: "Pesquisar folhas existentes",
    icon: Search,
    action: () => console.log("Search forms"),
    category: "form",
    priority: "medium",
    shortcut: "Ctrl+F",
  },
  {
    id: "quick-capture",
    title: "Captura Rápida",
    description: "Foto com câmera",
    icon: Camera,
    action: () => console.log("Quick capture"),
    category: "mobile",
    priority: "high",
  },
  {
    id: "scan-qr",
    title: "Escanear QR Code",
    description: "Identificar aeronave",
    icon: QrCode,
    action: () => console.log("Scan QR"),
    category: "mobile",
    priority: "medium",
  },
  {
    id: "manage-aircraft",
    title: "Gerenciar Aeronaves",
    description: "Frota e configurações",
    icon: Plane,
    action: "/aircraft-manager",
    category: "management",
    priority: "medium",
  },
  {
    id: "manage-employees",
    title: "Gerenciar Funcionários",
    description: "Equipe e permissões",
    icon: Users,
    action: "/employee-manager",
    category: "management",
    priority: "medium",
  },
  {
    id: "view-analytics",
    title: "Analytics Executivo",
    description: "Métricas e relatórios",
    icon: BarChart3,
    action: "/advanced-features?tab=analytics",
    category: "analytics",
    priority: "high",
    roles: ["admin", "supervisor"],
  },
  {
    id: "export-data",
    title: "Exportar Dados",
    description: "Backup e relatórios",
    icon: Download,
    action: "/history-export",
    category: "analytics",
    priority: "medium",
  },
  {
    id: "system-settings",
    title: "Configurações",
    description: "Sistema e preferências",
    icon: Settings,
    action: "/settings",
    category: "system",
    priority: "low",
  },
  {
    id: "advanced-features",
    title: "Recursos Avançados",
    description: "Mobile, IA, Segurança",
    icon: Zap,
    action: "/advanced-features",
    category: "system",
    priority: "high",
    roles: ["admin"],
    badge: "Novo",
  },
  {
    id: "security-center",
    title: "Centro de Segurança",
    description: "2FA, auditoria, backup",
    icon: Shield,
    action: "/advanced-features?tab=security",
    category: "system",
    priority: "high",
    roles: ["admin"],
  },
  {
    id: "mobile-sync",
    title: "Sincronização",
    description: "Status e configuração",
    icon: RefreshCw,
    action: () => console.log("Mobile sync"),
    category: "mobile",
    priority: "medium",
  },
];

interface QuickActionsWidgetProps {
  compact?: boolean;
  className?: string;
}

export function QuickActionsWidget({ compact = false, className }: QuickActionsWidgetProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [favoriteActions, setFavoriteActions] = useState<string[]>([]);

  const { toast } = useToast();
  const { hasRole } = useAuth();

  const getAvailableActions = () => {
    return quickActions.filter(action => {
      // Role-based filtering
      if (action.roles && !action.roles.some(role => hasRole(role))) {
        return false;
      }

      // Category filtering
      if (selectedCategory !== "all" && action.category !== selectedCategory) {
        return false;
      }

      // Search filtering
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          action.title.toLowerCase().includes(query) ||
          action.description.toLowerCase().includes(query)
        );
      }

      return true;
    });
  };

  const executeAction = (action: QuickAction) => {
    if (typeof action.action === "string") {
      // It's a route
      window.location.href = action.action;
    } else {
      // It's a function
      action.action();
    }

    // Track usage
    setRecentActions(prev => {
      const newRecent = [action.id, ...prev.filter(id => id !== action.id)].slice(0, 5);
      localStorage.setItem("aviation_recent_actions", JSON.stringify(newRecent));
      return newRecent;
    });

    setOpen(false);
    
    toast({
      title: "Ação Executada",
      description: action.title,
    });
  };

  const toggleFavorite = (actionId: string) => {
    setFavoriteActions(prev => {
      const newFavorites = prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId];
      
      localStorage.setItem("aviation_favorite_actions", JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "form":
        return FileText;
      case "management":
        return Users;
      case "analytics":
        return BarChart3;
      case "system":
        return Settings;
      case "mobile":
        return Smartphone;
      default:
        return Zap;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "form":
        return "text-blue-400";
      case "management":
        return "text-green-400";
      case "analytics":
        return "text-purple-400";
      case "system":
        return "text-gray-400";
      case "mobile":
        return "text-cyan-400";
      default:
        return "text-white";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-300 border-red-400/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/50";
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-400/50";
    }
  };

  const availableActions = getAvailableActions();
  const recentActionsData = quickActions.filter(action => recentActions.includes(action.id));
  const favoriteActionsData = quickActions.filter(action => favoriteActions.includes(action.id));

  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button className="aviation-button">
            <Zap className="h-4 w-4 mr-2" />
            Ações Rápidas
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0 bg-aviation-gray-800 border-white/20" align="end">
          <Command className="bg-transparent border-none">
            <CommandInput
              placeholder="Buscar ações..."
              className="text-white border-none focus:ring-0"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-96">
              <CommandEmpty className="text-white/70 py-6 text-center">
                Nenhuma ação encontrada.
              </CommandEmpty>

              {favoriteActionsData.length > 0 && (
                <CommandGroup heading="Favoritos" className="text-yellow-300">
                  {favoriteActionsData.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <CommandItem
                        key={action.id}
                        onSelect={() => executeAction(action)}
                        className="text-white hover:bg-white/10 cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className={`h-4 w-4 ${getCategoryColor(action.category)}`} />
                          <div>
                            <p className="font-medium">{action.title}</p>
                            <p className="text-xs text-white/60">{action.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {action.badge && (
                            <Badge className="text-xs">{action.badge}</Badge>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(action.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          </button>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {recentActionsData.length > 0 && (
                <CommandGroup heading="Recentes" className="text-blue-300">
                  {recentActionsData.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <CommandItem
                        key={action.id}
                        onSelect={() => executeAction(action)}
                        className="text-white hover:bg-white/10 cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className={`h-4 w-4 ${getCategoryColor(action.category)}`} />
                          <div>
                            <p className="font-medium">{action.title}</p>
                            <p className="text-xs text-white/60">{action.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {action.shortcut && (
                            <CommandShortcut className="text-xs">{action.shortcut}</CommandShortcut>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(action.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Star className={`h-3 w-3 ${
                              favoriteActions.includes(action.id) 
                                ? "text-yellow-400 fill-current" 
                                : "text-white/50"
                            }`} />
                          </button>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              <CommandSeparator />

              <CommandGroup heading="Todas as Ações" className="text-white/70">
                {availableActions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <CommandItem
                      key={action.id}
                      onSelect={() => executeAction(action)}
                      className="text-white hover:bg-white/10 cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`h-4 w-4 ${getCategoryColor(action.category)}`} />
                        <div>
                          <p className="font-medium">{action.title}</p>
                          <p className="text-xs text-white/60">{action.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {action.badge && (
                          <Badge className="text-xs">{action.badge}</Badge>
                        )}
                        {action.priority === "high" && (
                          <Badge className={`text-xs ${getPriorityBadge(action.priority)}`}>
                            !
                          </Badge>
                        )}
                        {action.shortcut && (
                          <CommandShortcut className="text-xs">{action.shortcut}</CommandShortcut>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(action.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Star className={`h-3 w-3 ${
                            favoriteActions.includes(action.id) 
                              ? "text-yellow-400 fill-current" 
                              : "text-white/50"
                          }`} />
                        </button>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Card className={`glass-card border-white/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white">Ações Rápidas</CardTitle>
        <CardDescription className="text-white/70">
          Acesso rápido às funcionalidades principais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableActions.slice(0, 6).map((action) => {
            const IconComponent = action.icon;
            
            return (
              <Button
                key={action.id}
                onClick={() => executeAction(action)}
                variant="outline"
                className="h-auto p-4 border-white/20 hover:bg-white/10 text-left justify-start"
              >
                <div className="flex items-center space-x-3 w-full">
                  <IconComponent className={`h-5 w-5 ${getCategoryColor(action.category)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{action.title}</p>
                    <p className="text-white/60 text-xs truncate">{action.description}</p>
                  </div>
                  {action.badge && (
                    <Badge className="text-xs">{action.badge}</Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
        
        {availableActions.length > 6 && (
          <Button
            onClick={() => setOpen(true)}
            variant="ghost"
            className="w-full mt-3 text-white/70 hover:text-white hover:bg-white/10"
          >
            Ver todas as ações
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
