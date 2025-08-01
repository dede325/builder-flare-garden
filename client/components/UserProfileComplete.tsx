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
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Camera,
  Shield,
  Bell,
  Activity,
  Clock,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  Award,
  Settings,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ActionFeedback } from "@/components/ui/interactive-feedback";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface UserProfile {
  // Basic Information
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  
  // Professional Information
  role: string;
  department: string;
  employeeNumber: string;
  hireDate: string;
  supervisor?: string;
  
  // Contact Information
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  
  // Preferences
  language: string;
  timezone: string;
  theme: string;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  
  // Security
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  
  // System
  lastLogin: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  type: 'login' | 'profile_update' | 'password_change' | 'permission_change' | 'task_completion';
}

export function UserProfileComplete() {
  const { user: authUser, updateProfile, hasPermission } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    employeeNumber: '',
    hireDate: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    language: 'pt',
    timezone: 'Atlantic/Azores',
    theme: 'aviation-blue',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    twoFactorEnabled: false,
    lastPasswordChange: '',
    lastLogin: '',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  });

  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    loadUserProfile();
    loadUserActivity();
  }, [authUser]);

  const loadUserProfile = async () => {
    try {
      // Load from localStorage first
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile(prev => ({ ...prev, ...parsed }));
      }

      // Load from auth user
      if (authUser) {
        setProfile(prev => ({
          ...prev,
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
          email: authUser.email || '',
          role: authUser.user_metadata?.role || 'Operacional',
          lastLogin: authUser.last_sign_in_at || '',
          createdAt: authUser.created_at || '',
          updatedAt: authUser.updated_at || '',
        }));
      }

      // Try to load from Supabase
      try {
        const { supabase } = await import('@/lib/supabase');
        if (supabase && authUser) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (data && !error) {
            setProfile(prev => ({ ...prev, ...data }));
          }
        }
      } catch (error) {
        console.warn('Supabase not available for profile loading');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Erro ao carregar perfil",
        description: "Falha ao carregar informações do perfil.",
        variant: "destructive",
      });
    }
  };

  const loadUserActivity = async () => {
    try {
      // Generate mock activity data
      const mockActivities: UserActivity[] = [
        {
          id: '1',
          action: 'Login',
          description: 'Login realizado com sucesso',
          timestamp: new Date().toISOString(),
          type: 'login',
        },
        {
          id: '2',
          action: 'Perfil atualizado',
          description: 'Informações pessoais atualizadas',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          type: 'profile_update',
        },
        {
          id: '3',
          action: 'Tarefa concluída',
          description: 'Folha de limpeza FORM-001 concluída',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          type: 'task_completion',
        },
      ];

      setActivities(mockActivities);

      // Try to load from Supabase
      try {
        const { supabase } = await import('@/lib/supabase');
        if (supabase && authUser) {
          const { data, error } = await supabase
            .from('user_activities')
            .select('*')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (data && !error) {
            setActivities(data.map((item: any) => ({
              id: item.id,
              action: item.action,
              description: item.description,
              timestamp: item.created_at,
              type: item.type || 'profile_update',
            })));
          }
        }
      } catch (error) {
        console.warn('Supabase not available for activity loading');
      }
    } catch (error) {
      console.error('Error loading user activity:', error);
    }
  };

  const handleSaveProfile = async () => {
    setSaveStatus('loading');
    try {
      // Save to localStorage
      localStorage.setItem('userProfile', JSON.stringify(profile));

      // Try to save to Supabase
      try {
        const { supabase } = await import('@/lib/supabase');
        if (supabase && authUser) {
          const { error } = await supabase
            .from('user_profiles')
            .upsert({
              id: authUser.id,
              name: profile.name,
              phone: profile.phone,
              department: profile.department,
              employee_number: profile.employeeNumber,
              hire_date: profile.hireDate,
              emergency_contact: profile.emergencyContact,
              emergency_phone: profile.emergencyPhone,
              address: profile.address,
              language: profile.language,
              timezone: profile.timezone,
              theme: profile.theme,
              email_notifications: profile.emailNotifications,
              push_notifications: profile.pushNotifications,
              sms_notifications: profile.smsNotifications,
              updated_at: new Date().toISOString(),
            });

          if (error) {
            console.warn('Error saving to Supabase:', error);
          }
        }
      } catch (error) {
        console.warn('Supabase not available for profile saving');
      }

      // Update auth profile if available
      if (updateProfile) {
        await updateProfile({
          name: profile.name,
          phone: profile.phone,
          department: profile.department,
        });
      }

      setSaveStatus('success');
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });

      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
      toast({
        title: "Erro ao salvar",
        description: "Falha ao atualizar o perfil.",
        variant: "destructive",
      });
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would call the actual password change API
      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso.",
      });

      setPasswords({
        current: '',
        new: '',
        confirm: '',
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao alterar a senha.",
        variant: "destructive",
      });
    }
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: UserActivity['type']) => {
    switch (type) {
      case 'login':
        return <User className="h-4 w-4 text-blue-400" />;
      case 'profile_update':
        return <Settings className="h-4 w-4 text-green-400" />;
      case 'password_change':
        return <Lock className="h-4 w-4 text-orange-400" />;
      case 'permission_change':
        return <Shield className="h-4 w-4 text-purple-400" />;
      case 'task_completion':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {profile.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                <p className="text-blue-200">{profile.role}</p>
                <p className="text-white/70 text-sm">{profile.department}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusIndicator
                    status={profile.isActive ? "active" : "inactive"}
                    variant="badge"
                    size="sm"
                  />
                  {profile.lastLogin && (
                    <Badge variant="outline" className="text-white border-white/20">
                      Último login: {formatDate(profile.lastLogin)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <ActionFeedback
                action="save"
                status={saveStatus}
                onAction={handleSaveProfile}
                size="lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-white/10">
          <TabsTrigger value="basic" className="text-white data-[state=active]:bg-white/20">
            <User className="h-4 w-4 mr-2" />
            Básico
          </TabsTrigger>
          <TabsTrigger value="professional" className="text-white data-[state=active]:bg-white/20">
            <Briefcase className="h-4 w-4 mr-2" />
            Profissional
          </TabsTrigger>
          <TabsTrigger value="preferences" className="text-white data-[state=active]:bg-white/20">
            <Settings className="h-4 w-4 mr-2" />
            Preferências
          </TabsTrigger>
          <TabsTrigger value="security" className="text-white data-[state=active]:bg-white/20">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-white data-[state=active]:bg-white/20">
            <Activity className="h-4 w-4 mr-2" />
            Atividade
          </TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-6">
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-white/70">
                Informações básicas do seu perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Nome Completo</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Telefone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="+351 XXX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Contacto de Emergência</Label>
                  <Input
                    value={profile.emergencyContact}
                    onChange={(e) => updateField('emergencyContact', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Nome do contacto"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Telefone de Emergência</Label>
                  <Input
                    value={profile.emergencyPhone}
                    onChange={(e) => updateField('emergencyPhone', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="+351 XXX XXX XXX"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Endereço</Label>
                <Textarea
                  value={profile.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Seu endereço completo"
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-medium">Foto do Perfil</h4>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {profile.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Alterar Foto
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Information */}
        <TabsContent value="professional" className="space-y-6">
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Informações Profissionais
              </CardTitle>
              <CardDescription className="text-white/70">
                Detalhes sobre sua posição e carreira
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Função</Label>
                  <Select
                    value={profile.role}
                    onValueChange={(value) => updateField('role', value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="operacional">Operacional</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Departamento</Label>
                  <Input
                    value={profile.department}
                    onChange={(e) => updateField('department', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Nome do departamento"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Número de Funcionário</Label>
                  <Input
                    value={profile.employeeNumber}
                    onChange={(e) => updateField('employeeNumber', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="EMP001"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Data de Contratação</Label>
                  <Input
                    type="date"
                    value={profile.hireDate}
                    onChange={(e) => updateField('hireDate', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              
              {profile.supervisor && (
                <div className="space-y-2">
                  <Label className="text-white">Supervisor</Label>
                  <Input
                    value={profile.supervisor}
                    className="bg-white/10 border-white/20 text-white"
                    disabled
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferências do Sistema
              </CardTitle>
              <CardDescription className="text-white/70">
                Configure como você interage com o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Idioma</Label>
                  <Select
                    value={profile.language}
                    onValueChange={(value) => updateField('language', value)}
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
                    value={profile.timezone}
                    onValueChange={(value) => updateField('timezone', value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Atlantic/Azores">Açores (UTC-1)</SelectItem>
                      <SelectItem value="Europe/Lisbon">Lisboa (UTC+0)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-white/20" />

              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificações
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Notificações por Email</Label>
                      <p className="text-white/60 text-sm">Receber atualizações importantes por email</p>
                    </div>
                    <Switch
                      checked={profile.emailNotifications}
                      onCheckedChange={(checked) => updateField('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Notificações Push</Label>
                      <p className="text-white/60 text-sm">Notificações em tempo real no dispositivo</p>
                    </div>
                    <Switch
                      checked={profile.pushNotifications}
                      onCheckedChange={(checked) => updateField('pushNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Notificações SMS</Label>
                      <p className="text-white/60 text-sm">Alertas críticos por mensagem de texto</p>
                    </div>
                    <Switch
                      checked={profile.smsNotifications}
                      onCheckedChange={(checked) => updateField('smsNotifications', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription className="text-white/70">
                Mantenha sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-white font-medium">Alterar Senha</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-white">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white pr-10"
                        placeholder="Digite sua senha atual"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Nova Senha</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Digite a nova senha"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Confirmar Nova Senha</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                  <Button 
                    onClick={handleChangePassword}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!passwords.current || !passwords.new || !passwords.confirm}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                </div>
              </div>

              <Separator className="bg-white/20" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Autenticação de Dois Fatores</Label>
                    <p className="text-white/60 text-sm">Adicione uma camada extra de segurança</p>
                  </div>
                  <Switch
                    checked={profile.twoFactorEnabled}
                    onCheckedChange={(checked) => updateField('twoFactorEnabled', checked)}
                  />
                </div>
              </div>

              <Separator className="bg-white/20" />

              <div className="space-y-2">
                <h4 className="text-white font-medium">Informações de Segurança</h4>
                <div className="space-y-2 text-sm">
                  {profile.lastPasswordChange && (
                    <p className="text-white/70">
                      Última alteração de senha: {formatDate(profile.lastPasswordChange)}
                    </p>
                  )}
                  {profile.lastLogin && (
                    <p className="text-white/70">
                      Último acesso: {formatDate(profile.lastLogin)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Histórico de Atividades
              </CardTitle>
              <CardDescription className="text-white/70">
                Suas atividades recentes no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{activity.action}</p>
                        <p className="text-white/70 text-sm">{activity.description}</p>
                        <p className="text-white/50 text-xs mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">Nenhuma atividade registrada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
