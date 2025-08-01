import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MigrationDialog } from "@/components/MigrationDialog";
import { LogoUpload } from "@/components/LogoUpload";
import {
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Database,
  Download,
  Upload,
  Save,
  Camera,
  Plane,
  LogOut,
  ArrowLeft,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { migrationService } from "@/lib/migration-service";
import {
  populateDemoData,
  clearOfflineData,
  getOfflineDataSummary,
} from "@/lib/demo-data";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user: authUser, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    isConfigured: boolean | null;
    dataCounts: any;
  }>({ isConfigured: null, dataCounts: null });
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    emergencyContact: "",
  });

  const [systemSettings, setSystemSettings] = useState({
    theme: "aviation-blue",
    notifications: true,
    autoSync: true,
    offlineMode: false,
    language: "pt",
    timezone: "Atlantic/Azores",
  });

  const [companySettings, setCompanySettings] = useState({
    companyName: "AirPlus Aviation Services",
    logo: "/airplus-logo.png",
    primaryColor: "#00b0ea",
    secondaryColor: "#009ddf",
    interventionTypes: [
      "Limpeza Exterior",
      "Limpeza Interior",
      "Polimento",
      "Lavagem Profunda Durante a Manutenção de Base",
    ],
  });

  const [logoSettings, setLogoSettings] = useState({
    companyLogo: "/airplus-logo.png",
    clientLogo: "",
    clientName: "",
    clientAddress: "",
    clientContact: "",
  });

  // Fallback user data for demo mode
  const user = authUser
    ? {
        name:
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "Usuário",
        role: authUser.user_metadata?.role || "Gestor de Operações",
        email: authUser.email,
      }
    : {
        name: "João Silva",
        role: "Gestor de Operações",
        email: "demo@aviation.com",
      };

  useEffect(() => {
    // Load user profile data
    setProfileData({
      name: user.name,
      email: user.email || "",
      role: user.role,
      department: "Operações de Limpeza",
      phone: "+351 291 123 456",
      emergencyContact: "+351 291 654 321",
    });

    // Load settings from localStorage
    const savedSettings = localStorage.getItem("systemSettings");
    if (savedSettings) {
      setSystemSettings(JSON.parse(savedSettings));
    }

    const savedCompanySettings = localStorage.getItem("companySettings");
    if (savedCompanySettings) {
      setCompanySettings(JSON.parse(savedCompanySettings));
    }

    const savedLogoSettings = localStorage.getItem("logoSettings");
    if (savedLogoSettings) {
      setLogoSettings(JSON.parse(savedLogoSettings));
    }

    // Check migration status
    checkMigrationStatus();

    // Check online status
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, [user]);

  const checkMigrationStatus = async () => {
    try {
      const [isConfigured, dataCounts] = await Promise.all([
        migrationService.isSupabaseConfigured(),
        migrationService.getOfflineDataCounts(),
      ]);
      setMigrationStatus({ isConfigured, dataCounts });
    } catch (error) {
      console.error("Failed to check migration status:", error);
      setMigrationStatus({ isConfigured: false, dataCounts: null });
    }
  };

  const handleMigrationComplete = () => {
    // Refresh migration status after successful migration
    checkMigrationStatus();
  };

  const handlePopulateDemoData = async () => {
    try {
      await populateDemoData();
      await checkMigrationStatus();
      toast({
        title: "Dados demo criados",
        description:
          "Dados de demonstração foram adicionados ao banco offline.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar dados demo.",
        variant: "destructive",
      });
    }
  };

  const handleClearOfflineData = async () => {
    try {
      await clearOfflineData();
      await checkMigrationStatus();
      toast({
        title: "Dados limpos",
        description: "Todos os dados offline foram removidos.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao limpar dados.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    localStorage.setItem("userProfile", JSON.stringify(profileData));

    // Sync with Supabase when connected
    try {
      const { supabase } = await import("@/lib/supabase");
      if (supabase && authUser) {
        const { error } = await supabase
          .from("usuarios")
          .update({
            nome: profileData.name,
            telefone: profileData.phone,
            departamento: profileData.department,
            contacto_emergencia: profileData.emergencyContact,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id);

        if (error) {
          console.warn("Erro ao sincronizar perfil com Supabase:", error);
        } else {
          console.log("Perfil sincronizado com Supabase com sucesso");
        }
      }
    } catch (error) {
      console.warn("Supabase não disponível, dados salvos apenas localmente");
    }

    toast({
      title: "Perfil salvo",
      description: "Suas informações foram atualizadas com sucesso.",
    });
  };

  const handleSaveSystemSettings = () => {
    localStorage.setItem("systemSettings", JSON.stringify(systemSettings));
    console.log("System settings saved:", systemSettings);
  };

  const handleSaveCompanySettings = () => {
    localStorage.setItem("companySettings", JSON.stringify(companySettings));
    console.log("Company settings saved:", companySettings);
  };

  const handleSaveLogoSettings = () => {
    localStorage.setItem("logoSettings", JSON.stringify(logoSettings));
    console.log("Logo settings saved:", logoSettings);
    toast({
      title: "Configurações salvas",
      description: "As configurações de logos foram atualizadas com sucesso.",
    });
  };

  const handleExportData = () => {
    const data = {
      profile: profileData,
      systemSettings,
      companySettings,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aviation-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.profile) setProfileData(data.profile);
        if (data.systemSettings) setSystemSettings(data.systemSettings);
        if (data.companySettings) setCompanySettings(data.companySettings);
        console.log("Data imported successfully");
      } catch (error) {
        console.error("Error importing data:", error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-aviation-gradient">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Settings className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white">Configurações</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? "Online" : "Offline"}
              </Badge>

              <div className="text-right">
                <p className="text-sm text-white font-medium">{user.name}</p>
                <p className="text-xs text-white/70">{user.role}</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-white hover:bg-white/20"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          defaultValue={searchParams.get("tab") || "profile"}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-md">
            <TabsTrigger
              value="profile"
              className="text-white data-[state=active]:bg-white/20"
            >
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="text-white data-[state=active]:bg-white/20"
            >
              <Settings className="h-4 w-4 mr-2" />
              Sistema
            </TabsTrigger>
            <TabsTrigger
              value="company"
              className="text-white data-[state=active]:bg-white/20"
            >
              <Shield className="h-4 w-4 mr-2" />
              Empresa
            </TabsTrigger>
            <TabsTrigger
              value="logos"
              className="text-white data-[state=active]:bg-white/20"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Logos
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="text-white data-[state=active]:bg-white/20"
            >
              <Database className="h-4 w-4 mr-2" />
              Dados
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informações do Perfil</span>
                </CardTitle>
                <CardDescription className="text-white/70">
                  Gerencie suas informações pessoais e de contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-aviation-blue-600 text-white text-xl">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button
                      variant="outline"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Alterar Foto
                    </Button>
                    <p className="text-sm text-white/70 mt-1">
                      JPG, PNG até 5MB
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-white">
                      Função
                    </Label>
                    <Select
                      value={profileData.role}
                      onValueChange={(value) =>
                        setProfileData({ ...profileData, role: value })
                      }
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gestor de Operações">
                          Gestor de Operações
                        </SelectItem>
                        <SelectItem value="Supervisor de Limpeza">
                          Supervisor de Limpeza
                        </SelectItem>
                        <SelectItem value="Técnico de Limpeza">
                          Técnico de Limpeza
                        </SelectItem>
                        <SelectItem value="Administrador">
                          Administrador
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-white">
                      Departamento
                    </Label>
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          department: e.target.value,
                        })
                      }
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact" className="text-white">
                      Contacto de Emergência
                    </Label>
                    <Input
                      id="emergencyContact"
                      value={profileData.emergencyContact}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          emergencyContact: e.target.value,
                        })
                      }
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} className="aviation-button">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Perfil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações do Sistema</span>
                </CardTitle>
                <CardDescription className="text-white/70">
                  Ajuste as preferências do aplicativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Palette className="h-5 w-5 mr-2" />
                      Aparência
                    </h3>
                    <div className="space-y-2">
                      <Label className="text-white">Tema</Label>
                      <Select
                        value={systemSettings.theme}
                        onValueChange={(value) =>
                          setSystemSettings({ ...systemSettings, theme: value })
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aviation-blue">
                            Aviation Blue
                          </SelectItem>
                          <SelectItem value="dark">Escuro</SelectItem>
                          <SelectItem value="light">Claro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Idioma</Label>
                      <Select
                        value={systemSettings.language}
                        onValueChange={(value) =>
                          setSystemSettings({
                            ...systemSettings,
                            language: value,
                          })
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt">Português</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Fuso Horário</Label>
                      <Select
                        value={systemSettings.timezone}
                        onValueChange={(value) =>
                          setSystemSettings({
                            ...systemSettings,
                            timezone: value,
                          })
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Atlantic/Azores">
                            Açores (UTC-1)
                          </SelectItem>
                          <SelectItem value="Europe/Lisbon">
                            Lisboa (UTC+0)
                          </SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Notificações & Sincronização
                    </h3>

                    <div className="flex items-center justify-between">
                      <Label className="text-white">Notificações Push</Label>
                      <Switch
                        checked={systemSettings.notifications}
                        onCheckedChange={(checked) =>
                          setSystemSettings({
                            ...systemSettings,
                            notifications: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-white">
                        Sincronização Automática
                      </Label>
                      <Switch
                        checked={systemSettings.autoSync}
                        onCheckedChange={(checked) =>
                          setSystemSettings({
                            ...systemSettings,
                            autoSync: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-white">Modo Offline</Label>
                      <Switch
                        checked={systemSettings.offlineMode}
                        onCheckedChange={(checked) =>
                          setSystemSettings({
                            ...systemSettings,
                            offlineMode: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveSystemSettings}
                  className="aviation-button"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Settings */}
          <TabsContent value="company">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Configurações da Empresa</span>
                </CardTitle>
                <CardDescription className="text-white/70">
                  Personalize as configurações organizacionais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Nome da Empresa</Label>
                      <Input
                        value={companySettings.companyName}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            companyName: e.target.value,
                          })
                        }
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Cor Primária</Label>
                      <Input
                        type="color"
                        value={companySettings.primaryColor}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            primaryColor: e.target.value,
                          })
                        }
                        className="bg-white/10 border-white/20 h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Cor Secundária</Label>
                      <Input
                        type="color"
                        value={companySettings.secondaryColor}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            secondaryColor: e.target.value,
                          })
                        }
                        className="bg-white/10 border-white/20 h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Tipos de Intervenção</Label>
                      <div className="space-y-2">
                        {companySettings.interventionTypes.map(
                          (type, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <Input
                                value={type}
                                onChange={(e) => {
                                  const newTypes = [
                                    ...companySettings.interventionTypes,
                                  ];
                                  newTypes[index] = e.target.value;
                                  setCompanySettings({
                                    ...companySettings,
                                    interventionTypes: newTypes,
                                  });
                                }}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              />
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveCompanySettings}
                  className="aviation-button"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações da Empresa
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logo Settings */}
          <TabsContent value="logos">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5" />
                  <span>Configurações de Logos</span>
                </CardTitle>
                <CardDescription className="text-white/70">
                  Configure os logos da empresa e cliente para relatórios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Company Logo Section */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Plane className="h-5 w-5 text-blue-400" />
                        Logo da Empresa
                      </h3>
                      <p className="text-sm text-white/70">
                        Este logo aparecerá no cabeçalho dos relatórios PDF e na
                        interface do sistema.
                      </p>

                      <LogoUpload
                        label="Logo Principal"
                        description="Recomendado: 400x200px, formato PNG ou JPG"
                        value={logoSettings.companyLogo}
                        onChange={(base64) =>
                          setLogoSettings({
                            ...logoSettings,
                            companyLogo: base64 || "",
                          })
                        }
                        maxWidth={400}
                        maxHeight={200}
                        aspectRatio="landscape"
                      />
                    </div>
                  </div>

                  {/* Client Logo Section */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-400" />
                        Logo do Cliente
                      </h3>
                      <p className="text-sm text-white/70">
                        Logo do cliente aparecerá no canto superior direito dos
                        relatórios PDF.
                      </p>

                      <LogoUpload
                        label="Logo do Cliente"
                        description="Recomendado: 200x200px, formato PNG ou JPG"
                        value={logoSettings.clientLogo}
                        onChange={(base64) =>
                          setLogoSettings({
                            ...logoSettings,
                            clientLogo: base64 || "",
                          })
                        }
                        maxWidth={200}
                        maxHeight={200}
                        aspectRatio="square"
                      />

                      <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="space-y-2">
                          <Label className="text-white">Nome do Cliente</Label>
                          <Input
                            value={logoSettings.clientName}
                            onChange={(e) =>
                              setLogoSettings({
                                ...logoSettings,
                                clientName: e.target.value,
                              })
                            }
                            placeholder="Ex: TAAG Angola Airlines"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white">
                            Endereço do Cliente
                          </Label>
                          <Input
                            value={logoSettings.clientAddress}
                            onChange={(e) =>
                              setLogoSettings({
                                ...logoSettings,
                                clientAddress: e.target.value,
                              })
                            }
                            placeholder="Ex: Aeroporto 4 de Fevereiro, Luanda"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white">
                            Contacto do Cliente
                          </Label>
                          <Input
                            value={logoSettings.clientContact}
                            onChange={(e) =>
                              setLogoSettings({
                                ...logoSettings,
                                clientContact: e.target.value,
                              })
                            }
                            placeholder="Ex: +244 222 000 000"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="space-y-4 pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white">
                    Preview dos Logos
                  </h3>
                  <div className="bg-white/5 rounded-lg p-6">
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      {/* Simulated PDF Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          {logoSettings.companyLogo ? (
                            <img
                              src={logoSettings.companyLogo}
                              alt="Logo da empresa"
                              className="h-12 object-contain"
                            />
                          ) : (
                            <div className="h-12 w-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              Logo Empresa
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {logoSettings.clientLogo ? (
                            <img
                              src={logoSettings.clientLogo}
                              alt="Logo do cliente"
                              className="h-12 w-12 object-contain ml-auto"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              Logo Cliente
                            </div>
                          )}
                          {logoSettings.clientName && (
                            <p className="text-xs text-gray-600 mt-1">
                              {logoSettings.clientName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-300">
                        Preview do cabeçalho do relatório PDF
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveLogoSettings}
                  className="aviation-button w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações de Logos
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Gestão de Dados</span>
                </CardTitle>
                <CardDescription className="text-white/70">
                  Exporte, importe e gerencie seus dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">
                      Backup de Dados
                    </h3>
                    <p className="text-white/70 text-sm">
                      Faça backup das suas configurações e dados locais
                    </p>
                    <Button
                      onClick={handleExportData}
                      className="aviation-button w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Dados
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">
                      Restaurar Dados
                    </h3>
                    <p className="text-white/70 text-sm">
                      Importe configurações de um backup anterior
                    </p>
                    <div>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="bg-white/10 border-white/20 text-white file:bg-aviation-blue-600 file:text-white file:border-0 file:rounded file:px-4 file:py-2"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/20" />

                {/* Configuration Management Link */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Configuração do Sistema
                  </h3>
                  <p className="text-white/70 text-sm">
                    Gerencie tipos de intervenção, turnos e locais dinamicamente
                  </p>
                  <Link to="/configuration">
                    <Button className="aviation-button w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Abrir Gerenciador de Configurações
                    </Button>
                  </Link>
                </div>

                <Separator className="bg-white/20" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Migração de Dados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            Supabase
                          </span>
                          <Badge
                            variant={
                              migrationStatus.isConfigured
                                ? "default"
                                : "secondary"
                            }
                          >
                            {migrationStatus.isConfigured === null
                              ? "Verificando..."
                              : migrationStatus.isConfigured
                                ? "Configurado"
                                : "Não configurado"}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/70">
                          {migrationStatus.isConfigured
                            ? "Pronto para migração de dados"
                            : "Configure as variáveis de ambiente primeiro"}
                        </p>
                      </div>

                      {migrationStatus.dataCounts && (
                        <div className="p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">
                              Dados Offline
                            </span>
                            <Badge
                              variant="outline"
                              className="text-white border-white/20"
                            >
                              {migrationStatus.dataCounts.total} registros
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                            <span>
                              Aeronaves: {migrationStatus.dataCounts.aircraft}
                            </span>
                            <span>
                              Funcionários:{" "}
                              {migrationStatus.dataCounts.employees}
                            </span>
                            <span>
                              Tarefas: {migrationStatus.dataCounts.tasks}
                            </span>
                            <span>
                              Voos: {migrationStatus.dataCounts.flightSheets}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => setMigrationDialogOpen(true)}
                        disabled={
                          !migrationStatus.isConfigured ||
                          !migrationStatus.dataCounts?.total
                        }
                        className="aviation-button w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Migrar Dados para Supabase
                      </Button>

                      <Button
                        onClick={checkMigrationStatus}
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/10"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar Status
                      </Button>

                      <p className="text-xs text-white/60 text-center">
                        A migração transfere todos os dados offline para o
                        Supabase, permitindo sincronização entre dispositivos.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/20" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Dados de Teste
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={handlePopulateDemoData}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Criar Dados Demo
                    </Button>

                    <Button
                      onClick={handleClearOfflineData}
                      variant="outline"
                      className="border-red-500/50 text-red-200 hover:bg-red-500/20"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Limpar Dados Offline
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">
                    Use os dados demo para testar a migração. Limpe os dados
                    offline quando necessário.
                  </p>
                </div>

                <Separator className="bg-white/20" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Plane className="h-5 w-5 mr-2" />
                    Status da Sincronização
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white">Dados Locais</span>
                        <Badge variant="default">Atualizado</Badge>
                      </div>
                      <p className="text-sm text-white/70 mt-1">
                        Última atualização: Agora
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white">Supabase</span>
                        <Badge variant={isOnline ? "default" : "secondary"}>
                          {isOnline ? "Conectado" : "Desconectado"}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/70 mt-1">
                        {isOnline
                          ? "Sincronização ativa"
                          : "Aguardando conexão"}
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white">Backup Automático</span>
                        <Badge variant="default">Ativo</Badge>
                      </div>
                      <p className="text-sm text-white/70 mt-1">
                        Próximo: em 24h
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Migration Dialog */}
      <MigrationDialog
        open={migrationDialogOpen}
        onOpenChange={setMigrationDialogOpen}
        onComplete={handleMigrationComplete}
      />
    </div>
  );
}
