import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/lib/auth-service";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserCreateDialog } from "@/components/UserCreateDialog";
import { UserEditDialog } from "@/components/UserEditDialog";
import { RoleManagementDialog } from "@/components/RoleManagementDialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Shield,
  Activity,
  ArrowLeft,
  Settings,
  Ban,
  CheckCircle,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  display_name: string;
  department: string;
  employee_number: string;
  is_active: boolean;
  roles: Array<{ name: string; display_name: string; level: number }>;
  permissions: string[];
  last_login: string;
  user_created_at: string;
}

export default function UserManagement() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  // Check permissions
  const canManageUsers = hasPermission("manage_users");
  const canReadUsers = hasPermission("read_users");
  const canUpdateUsers = hasPermission("update_users");
  const canManageRoles = hasPermission("manage_user_roles");

  useEffect(() => {
    if (!canReadUsers) {
      toast({
        title: "Acesso Negado",
        description: "Não tem permissão para aceder à gestão de utilizadores.",
        variant: "destructive",
      });
      return;
    }

    loadUsers();
  }, [canReadUsers]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await authService.getUsers();

      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao carregar utilizadores.",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar utilizadores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.employee_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          user.department?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) =>
        statusFilter === "active" ? user.is_active : !user.is_active,
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) =>
        user.roles?.some((role) => role.name === roleFilter),
      );
    }

    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!canUpdateUsers) {
      toast({
        title: "Erro",
        description: "Sem permissão para atualizar utilizadores.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await authService.updateUserStatus(
        userId,
        !currentStatus,
      );

      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao atualizar status do utilizador.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: `Utilizador ${!currentStatus ? "ativado" : "desativado"} com sucesso.`,
      });

      loadUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar utilizador.",
        variant: "destructive",
      });
    }
  };

  const getRoleDisplayName = (roles: any[]) => {
    if (!roles || roles.length === 0) return "Sem role";

    const highestRole = roles.reduce((prev, current) =>
      prev.level > current.level ? prev : current,
    );

    return highestRole.display_name;
  };

  const getRoleBadgeVariant = (roles: any[]) => {
    if (!roles || roles.length === 0) return "secondary";

    const maxLevel = Math.max(...roles.map((r) => r.level));

    if (maxLevel >= 90) return "destructive"; // Admin
    if (maxLevel >= 70) return "default"; // Manager
    if (maxLevel >= 40) return "secondary"; // Supervisor/Pilot
    return "outline"; // Technician/Viewer
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString("pt-PT");
  };

  if (!canReadUsers) {
    return (
      <div className="min-h-screen bg-aviation-gradient flex items-center justify-center">
        <Card className="glass-card border-white/20 max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
            <p className="text-white/70 mb-4">
              Não tem permissão para aceder à gestão de utilizadores.
            </p>
            <Link to="/">
              <Button className="aviation-button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Users className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white">
                Gestão de Utilizadores
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {canManageUsers && (
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="aviation-button"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Utilizador
                </Button>
              )}

              <Link to="/settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Utilizadores do Sistema</span>
              <Badge variant="outline" className="text-white border-white/20">
                {filteredUsers.length} utilizadores
              </Badge>
            </CardTitle>
            <CardDescription className="text-white/70">
              Gerir utilizadores, roles e permissões do sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-white/70" />
                  <Input
                    placeholder="Procurar utilizadores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="aviation-input pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value: any) => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Roles</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gestor</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="pilot">Piloto</SelectItem>
                    <SelectItem value="mechanic">Mecânico</SelectItem>
                    <SelectItem value="technician">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-lg border border-white/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 hover:bg-white/5">
                    <TableHead className="text-white">Utilizador</TableHead>
                    <TableHead className="text-white">Role Principal</TableHead>
                    <TableHead className="text-white">Departamento</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Último Login</TableHead>
                    <TableHead className="text-white">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-white/70 py-8"
                      >
                        Carregando utilizadores...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-white/70 py-8"
                      >
                        Nenhum utilizador encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((userData) => (
                      <TableRow
                        key={userData.id}
                        className="border-white/20 hover:bg-white/5"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-aviation-blue-600 text-white text-xs">
                                {userData.display_name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-white font-medium">
                                {userData.display_name || userData.email}
                              </div>
                              <div className="text-white/70 text-sm">
                                {userData.email}
                              </div>
                              {userData.employee_number && (
                                <div className="text-white/50 text-xs">
                                  #{userData.employee_number}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(userData.roles)}>
                            {getRoleDisplayName(userData.roles)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/80">
                          {userData.department || "Não definido"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {userData.is_active ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <Ban className="h-4 w-4 text-red-400" />
                            )}
                            <span
                              className={
                                userData.is_active
                                  ? "text-green-200"
                                  : "text-red-200"
                              }
                            >
                              {userData.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white/80">
                          {formatDate(userData.last_login)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {canUpdateUsers && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(userData);
                                  setEditDialogOpen(true);
                                }}
                                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}

                            {canManageRoles && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(userData);
                                  setRoleDialogOpen(true);
                                }}
                                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            )}

                            {canUpdateUsers && (
                              <Switch
                                checked={userData.is_active}
                                onCheckedChange={() =>
                                  toggleUserStatus(
                                    userData.id,
                                    userData.is_active,
                                  )
                                }
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <UserCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadUsers}
      />

      {selectedUser && (
        <>
          <UserEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            user={selectedUser}
            onSuccess={loadUsers}
          />

          <RoleManagementDialog
            open={roleDialogOpen}
            onOpenChange={setRoleDialogOpen}
            user={selectedUser}
            onSuccess={loadUsers}
          />
        </>
      )}
    </div>
  );
}
