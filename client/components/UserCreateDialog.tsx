import { useState } from 'react';
import { authService } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UserCreateDialog({ open, onOpenChange, onSuccess }: UserCreateDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    display_name: '',
    department: '',
    phone: '',
    employee_number: '',
    role: 'technician'
  });

  const departments = [
    'Operações',
    'Manutenção',
    'Limpeza',
    'Administração',
    'Recursos Humanos',
    'Qualidade',
    'Segurança'
  ];

  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'manager', label: 'Gestor' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'pilot', label: 'Piloto' },
    { value: 'mechanic', label: 'Mecânico' },
    { value: 'technician', label: 'Técnico' },
    { value: 'viewer', label: 'Visualizador' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate display name if needed
    if (field === 'first_name' || field === 'last_name') {
      const newFormData = { ...formData, [field]: value };
      if (newFormData.first_name && newFormData.last_name) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          display_name: `${newFormData.first_name} ${newFormData.last_name}`
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Erro',
        description: 'Email e senha são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await authService.signUp(
        formData.email,
        formData.password,
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          display_name: formData.display_name || formData.email,
          department: formData.department,
          phone: formData.phone
        }
      );

      if (authError) {
        toast({
          title: 'Erro ao criar conta',
          description: authError.message || 'Falha ao criar conta de utilizador.',
          variant: 'destructive'
        });
        return;
      }

      // Assign role to user if account was created
      if (authData.user && formData.role !== 'technician') {
        try {
          await authService.assignRole(authData.user.id, formData.role);
        } catch (roleError) {
          console.warn('Failed to assign role:', roleError);
          // Don't fail the whole operation for this
        }
      }

      toast({
        title: 'Utilizador criado',
        description: 'Nova conta de utilizador criada com sucesso.',
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        display_name: '',
        department: '',
        phone: '',
        employee_number: '',
        role: 'technician'
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar utilizador.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Criar Novo Utilizador
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Criar uma nova conta de utilizador no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-white">Primeiro Nome</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="aviation-input"
                placeholder="Nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-white">Apelido</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="aviation-input"
                placeholder="Apelido"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-white">Nome Completo</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              className="aviation-input"
              placeholder="Nome para exibição"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="aviation-input"
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Senha *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="aviation-input pr-10"
                placeholder="Senha (min. 6 caracteres)"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1 h-8 w-8 text-white/70 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department" className="text-white">Departamento</Label>
              <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                <SelectTrigger className="aviation-input">
                  <SelectValue placeholder="Selecionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-white">Role Inicial</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger className="aviation-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="aviation-input"
                placeholder="+351 XXX XXX XXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_number" className="text-white">Nº Funcionário</Label>
              <Input
                id="employee_number"
                value={formData.employee_number}
                onChange={(e) => handleInputChange('employee_number', e.target.value)}
                className="aviation-input"
                placeholder="EMP001"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="aviation-button flex-1"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Criando...</span>
                </div>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Utilizador
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
