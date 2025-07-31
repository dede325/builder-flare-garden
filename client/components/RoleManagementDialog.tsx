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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Minus, Crown, Users, Eye } from "lucide-react";

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSuccess?: () => void;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  level: number;
  is_system_role: boolean;
}

export function RoleManagementDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: RoleManagementDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [changes, setChanges] = useState<{
    toAdd: string[];
    toRemove: string[];
  }>({ toAdd: [], toRemove: [] });

  useEffect(() => {
    if (open) {
      loadRoles();
      setUserRoles(user?.roles?.map((r: any) => r.name) || []);
      setChanges({ toAdd: [], toRemove: [] });
    }
  }, [open, user]);

  const loadRoles = async () => {
    try {
      const { data, error } = await authService.getRoles();

      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao carregar roles disponíveis.",
          variant: "destructive",
        });
        return;
      }

      setAvailableRoles(data || []);
    } catch (error) {
      console.error("Error loading roles:", error);
    }
  };

  const toggleRole = (roleName: string, currentlyHas: boolean) => {
    if (currentlyHas) {
      // User has this role, mark for removal
      setChanges((prev) => ({
        toAdd: prev.toAdd.filter((r) => r !== roleName),
        toRemove: [...prev.toRemove.filter((r) => r !== roleName), roleName],
      }));
    } else {
      // User doesn't have this role, mark for addition
      setChanges((prev) => ({
        toAdd: [...prev.toAdd.filter((r) => r !== roleName), roleName],
        toRemove: prev.toRemove.filter((r) => r !== roleName),
      }));
    }
  };

  const isRoleSelected = (roleName: string) => {
    const hasRole = userRoles.includes(roleName);
    const willAdd = changes.toAdd.includes(roleName);
    const willRemove = changes.toRemove.includes(roleName);

    return (hasRole && !willRemove) || (!hasRole && willAdd);
  };

  const getRoleIcon = (role: Role) => {
    if (role.level >= 90) return <Crown className="h-4 w-4 text-yellow-400" />;
    if (role.level >= 70) return <Shield className="h-4 w-4 text-blue-400" />;
    if (role.level >= 40) return <Users className="h-4 w-4 text-green-400" />;
    return <Eye className="h-4 w-4 text-gray-400" />;
  };

  const getRoleBadgeVariant = (role: Role) => {
    if (role.level >= 90) return "destructive"; // Admin
    if (role.level >= 70) return "default"; // Manager
    if (role.level >= 40) return "secondary"; // Supervisor/Pilot
    return "outline"; // Technician/Viewer
  };

  const handleSave = async () => {
    if (changes.toAdd.length === 0 && changes.toRemove.length === 0) {
      onOpenChange(false);
      return;
    }

    setLoading(true);

    try {
      const promises = [];

      // Add new roles
      for (const roleName of changes.toAdd) {
        promises.push(authService.assignRole(user.id, roleName));
      }

      // Remove roles
      for (const roleName of changes.toRemove) {
        promises.push(authService.removeRole(user.id, roleName));
      }

      const results = await Promise.allSettled(promises);

      const errors = results
        .filter((r) => r.status === "rejected")
        .map((r) => (r as PromiseRejectedResult).reason);

      if (errors.length > 0) {
        toast({
          title: "Algumas alterações falharam",
          description: "Nem todas as alterações de roles foram aplicadas.",
          variant: "destructive",
        });
        console.error("Role assignment errors:", errors);
      } else {
        toast({
          title: "Roles atualizadas",
          description: "As roles do utilizador foram atualizadas com sucesso.",
        });
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error updating roles:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar roles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = changes.toAdd.length > 0 || changes.toRemove.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Roles
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Atribuir ou remover roles para: {user?.display_name || user?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Roles */}
          <div className="space-y-2">
            <h4 className="text-white font-medium">Roles Atuais</h4>
            <div className="flex flex-wrap gap-2">
              {userRoles.length > 0 ? (
                userRoles.map((roleName) => {
                  const role = availableRoles.find((r) => r.name === roleName);
                  if (!role) return null;

                  return (
                    <Badge
                      key={roleName}
                      variant={getRoleBadgeVariant(role)}
                      className="flex items-center gap-1"
                    >
                      {getRoleIcon(role)}
                      {role.display_name}
                    </Badge>
                  );
                })
              ) : (
                <span className="text-white/70 text-sm">
                  Nenhuma role atribuída
                </span>
              )}
            </div>
          </div>

          {/* Available Roles */}
          <div className="space-y-3">
            <h4 className="text-white font-medium">Roles Disponíveis</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableRoles.map((role) => {
                const selected = isRoleSelected(role.name);
                const isChange =
                  changes.toAdd.includes(role.name) ||
                  changes.toRemove.includes(role.name);

                return (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg border transition-all ${
                      selected
                        ? "bg-blue-500/20 border-blue-500/50"
                        : "bg-white/5 border-white/20"
                    } ${isChange ? "ring-2 ring-yellow-400/50" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() =>
                            toggleRole(role.name, userRoles.includes(role.name))
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(role)}
                            <span className="text-white font-medium">
                              {role.display_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Nível {role.level}
                            </Badge>
                          </div>
                          {role.description && (
                            <p className="text-white/70 text-sm mt-1">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {isChange && (
                        <div className="ml-2">
                          {changes.toAdd.includes(role.name) ? (
                            <Plus className="h-4 w-4 text-green-400" />
                          ) : (
                            <Minus className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Changes Summary */}
          {hasChanges && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <h5 className="text-yellow-200 font-medium text-sm mb-2">
                Alterações Pendentes:
              </h5>
              <div className="space-y-1">
                {changes.toAdd.map((roleName) => {
                  const role = availableRoles.find((r) => r.name === roleName);
                  return (
                    <div
                      key={roleName}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Plus className="h-3 w-3 text-green-400" />
                      <span className="text-green-200">
                        Adicionar: {role?.display_name}
                      </span>
                    </div>
                  );
                })}
                {changes.toRemove.map((roleName) => {
                  const role = availableRoles.find((r) => r.name === roleName);
                  return (
                    <div
                      key={roleName}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Minus className="h-3 w-3 text-red-400" />
                      <span className="text-red-200">
                        Remover: {role?.display_name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="aviation-button flex-1"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Aplicando...</span>
                </div>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  {hasChanges ? "Aplicar Alterações" : "Sem Alterações"}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
