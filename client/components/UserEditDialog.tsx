import { useState, useEffect } from "react";
import { authService } from "@/lib/auth-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save } from "lucide-react";

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSuccess?: () => void;
}

export function UserEditDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    department: "",
    phone: "",
    emergency_contact: "",
    employee_number: "",
    license_number: "",
  });

  const departments = [
    "Operações",
    "Manutenção",
    "Limpeza",
    "Administração",
    "Recursos Humanos",
    "Qualidade",
    "Segurança",
  ];

  useEffect(() => {
    if (user && open) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        display_name: user.display_name || "",
        department: user.department || "",
        phone: user.phone || "",
        emergency_contact: user.emergency_contact || "",
        employee_number: user.employee_number || "",
        license_number: user.license_number || "",
      });
    }
  }, [user, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate display name if needed
    if (field === "first_name" || field === "last_name") {
      const newFormData = { ...formData, [field]: value };
      if (newFormData.first_name && newFormData.last_name) {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          display_name: `${newFormData.first_name} ${newFormData.last_name}`,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.display_name) {
      toast({
        title: "Erro",
        description: "Nome de exibição é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await authService.updateProfile(formData);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description:
            error.message || "Falha ao atualizar perfil do utilizador.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Perfil atualizado",
        description: "Dados do utilizador atualizados com sucesso.",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar utilizador.",
        variant: "destructive",
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
            <Edit className="h-5 w-5" />
            Editar Utilizador
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Atualizar informações do utilizador:{" "}
            {user?.display_name || user?.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-white">
                Primeiro Nome
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                className="aviation-input"
                placeholder="Nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-white">
                Apelido
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                className="aviation-input"
                placeholder="Apelido"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-white">
              Nome Completo *
            </Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) =>
                handleInputChange("display_name", e.target.value)
              }
              className="aviation-input"
              placeholder="Nome para exibição"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Email</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="aviation-input opacity-50"
            />
            <p className="text-xs text-white/50">
              O email não pode ser alterado
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department" className="text-white">
                Departamento
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  handleInputChange("department", value)
                }
              >
                <SelectTrigger className="aviation-input">
                  <SelectValue placeholder="Selecionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_number" className="text-white">
                Nº Funcionário
              </Label>
              <Input
                id="employee_number"
                value={formData.employee_number}
                onChange={(e) =>
                  handleInputChange("employee_number", e.target.value)
                }
                className="aviation-input"
                placeholder="EMP001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="aviation-input"
                placeholder="+351 XXX XXX XXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact" className="text-white">
                Contacto Emergência
              </Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) =>
                  handleInputChange("emergency_contact", e.target.value)
                }
                className="aviation-input"
                placeholder="+351 XXX XXX XXX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_number" className="text-white">
              Nº Licença
            </Label>
            <Input
              id="license_number"
              value={formData.license_number}
              onChange={(e) =>
                handleInputChange("license_number", e.target.value)
              }
              className="aviation-input"
              placeholder="Número da licença profissional"
            />
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
                  <span>Guardando...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Alterações
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
