import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Edit, Trash2, Users, Phone, IdCard, Camera, Save, X, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import PhotoUpload from '@/components/PhotoUpload';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  role: string;
  department: string;
  shift: 'morning' | 'afternoon' | 'night' | 'flexible';
  certifications: string[];
  hireDate: string;
  status: 'active' | 'inactive' | 'suspended';
  photo?: string;
  notes?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
}

const defaultEmployee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  email: '',
  phone: '',
  idNumber: '',
  role: '',
  department: '',
  shift: 'morning',
  certifications: [],
  hireDate: format(new Date(), 'yyyy-MM-dd'),
  status: 'active',
  notes: '',
  emergencyContact: {
    name: '',
    phone: '',
    relationship: ''
  }
};

export default function EmployeeManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState(defaultEmployee);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const departments = [
    'Operações',
    'Manutenção',
    'Limpeza',
    'Segurança',
    'Administração',
    'Logística',
    'Qualidade',
    'Treinamento'
  ];

  const roles = [
    'Técnico de Limpeza',
    'Supervisor de Limpeza',
    'Operador de Equipamentos',
    'Inspetor de Qualidade',
    'Coordenador de Turno',
    'Técnico de Manutenção',
    'Operador de Rampa',
    'Agente de Segurança'
  ];

  const certificationOptions = [
    'ANAC Básico',
    'ANAC Avançado',
    'Segurança Operacional',
    'Manuseio de Produtos Químicos',
    'Primeiros Socorros',
    'Combate a Incêndio',
    'Operação de Equipamentos',
    'NR-35 Trabalho em Altura'
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, filterStatus, filterDepartment, filterShift]);

  const loadEmployees = () => {
    const savedEmployees = localStorage.getItem('aviation_employees');
    if (savedEmployees) {
      const parsed = JSON.parse(savedEmployees);
      setEmployees(parsed);
    } else {
      // Initialize with some demo data
      const demoEmployees: Employee[] = [
        {
          id: '1',
          name: 'Maria Santos Silva',
          email: 'maria.santos@aviation.com',
          phone: '(11) 99999-1234',
          idNumber: 'RG12345678',
          role: 'Supervisor de Limpeza',
          department: 'Limpeza',
          shift: 'morning',
          certifications: ['ANAC Básico', 'Segurança Operacional'],
          hireDate: '2023-01-15',
          status: 'active',
          notes: 'Funcionária exemplar com excelente desempenho',
          emergencyContact: {
            name: 'José Santos',
            phone: '(11) 98888-5678',
            relationship: 'Cônjuge'
          },
          createdAt: '2023-01-15T08:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'Carlos Lima Oliveira',
          email: 'carlos.lima@aviation.com',
          phone: '(11) 98888-9876',
          idNumber: 'RG87654321',
          role: 'Técnico de Limpeza',
          department: 'Limpeza',
          shift: 'afternoon',
          certifications: ['Manuseio de Produtos Químicos'],
          hireDate: '2023-03-10',
          status: 'active',
          emergencyContact: {
            name: 'Ana Lima',
            phone: '(11) 97777-1234',
            relationship: 'Irmã'
          },
          createdAt: '2023-03-10T08:00:00Z',
          updatedAt: '2024-01-10T14:20:00Z'
        }
      ];
      setEmployees(demoEmployees);
      localStorage.setItem('aviation_employees', JSON.stringify(demoEmployees));
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone.includes(searchTerm) ||
        emp.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(emp => emp.status === filterStatus);
    }

    if (filterDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === filterDepartment);
    }

    if (filterShift !== 'all') {
      filtered = filtered.filter(emp => emp.shift === filterShift);
    }

    setFilteredEmployees(filtered);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Telefone é obrigatório';
    }

    if (!formData.idNumber.trim()) {
      errors.idNumber = 'Documento é obrigatório';
    }

    if (!formData.role.trim()) {
      errors.role = 'Função é obrigatória';
    }

    if (!formData.department.trim()) {
      errors.department = 'Departamento é obrigatório';
    }

    // Check for duplicate email (excluding current employee when editing)
    const existingEmployee = employees.find(emp => 
      emp.email === formData.email && emp.id !== editingEmployee?.id
    );
    if (existingEmployee) {
      errors.email = 'Email já está em uso';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      
      if (editingEmployee) {
        // Update existing employee
        const updatedEmployee: Employee = {
          ...editingEmployee,
          ...formData,
          updatedAt: now
        };

        const updatedEmployees = employees.map(emp => 
          emp.id === editingEmployee.id ? updatedEmployee : emp
        );

        setEmployees(updatedEmployees);
        localStorage.setItem('aviation_employees', JSON.stringify(updatedEmployees));

        toast({
          title: "Funcionário atualizado",
          description: "Os dados foram salvos com sucesso.",
        });
      } else {
        // Create new employee
        const newEmployee: Employee = {
          ...formData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now
        };

        const updatedEmployees = [...employees, newEmployee];
        setEmployees(updatedEmployees);
        localStorage.setItem('aviation_employees', JSON.stringify(updatedEmployees));

        toast({
          title: "Funcionário cadastrado",
          description: "Novo funcionário adicionado com sucesso.",
        });
      }

      setIsCreateDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar os dados.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      idNumber: employee.idNumber,
      role: employee.role,
      department: employee.department,
      shift: employee.shift,
      certifications: employee.certifications,
      hireDate: employee.hireDate,
      status: employee.status,
      photo: employee.photo,
      notes: employee.notes || '',
      emergencyContact: employee.emergencyContact || { name: '', phone: '', relationship: '' }
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    if (confirm(`Tem certeza que deseja excluir ${employee.name}?`)) {
      const updatedEmployees = employees.filter(emp => emp.id !== employee.id);
      setEmployees(updatedEmployees);
      localStorage.setItem('aviation_employees', JSON.stringify(updatedEmployees));

      toast({
        title: "Funcionário excluído",
        description: "O funcionário foi removido do sistema.",
      });
    }
  };

  const resetForm = () => {
    setFormData(defaultEmployee);
    setFormErrors({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'suspended': return 'Suspenso';
      default: return 'Desconhecido';
    }
  };

  const getShiftText = (shift: string) => {
    switch (shift) {
      case 'morning': return 'Manhã';
      case 'afternoon': return 'Tarde';
      case 'night': return 'Noite';
      case 'flexible': return 'Flexível';
      default: return shift;
    }
  };

  return (
    <div className="min-h-screen bg-aviation-gradient">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-white" />
              <h1 className="text-2xl font-bold text-white">Gerenciamento de Funcionários</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/70" />
              <Input
                placeholder="Buscar funcionários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="aviation-input pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="aviation-input w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-aviation-gray-800 border-white/20">
                  <SelectItem value="all" className="text-white">Todos</SelectItem>
                  <SelectItem value="active" className="text-white">Ativo</SelectItem>
                  <SelectItem value="inactive" className="text-white">Inativo</SelectItem>
                  <SelectItem value="suspended" className="text-white">Suspenso</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="aviation-input w-40">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent className="bg-aviation-gray-800 border-white/20">
                  <SelectItem value="all" className="text-white">Todos</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept} className="text-white">{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterShift} onValueChange={setFilterShift}>
                <SelectTrigger className="aviation-input w-32">
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent className="bg-aviation-gray-800 border-white/20">
                  <SelectItem value="all" className="text-white">Todos</SelectItem>
                  <SelectItem value="morning" className="text-white">Manhã</SelectItem>
                  <SelectItem value="afternoon" className="text-white">Tarde</SelectItem>
                  <SelectItem value="night" className="text-white">Noite</SelectItem>
                  <SelectItem value="flexible" className="text-white">Flexível</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingEmployee(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="aviation-button">
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-aviation-gray-800 border-white/20 mx-4">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  {editingEmployee ? 'Atualize os dados do funcionário' : 'Cadastre um novo funcionário no sistema'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-white">Nome Completo *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`aviation-input ${formErrors.name ? 'border-red-500' : ''}`}
                      placeholder="Nome completo do funcionário"
                    />
                    {formErrors.name && <p className="text-red-400 text-sm">{formErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`aviation-input ${formErrors.email ? 'border-red-500' : ''}`}
                      placeholder="email@aviation.com"
                    />
                    {formErrors.email && <p className="text-red-400 text-sm">{formErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Telefone *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={`aviation-input ${formErrors.phone ? 'border-red-500' : ''}`}
                      placeholder="(11) 99999-9999"
                    />
                    {formErrors.phone && <p className="text-red-400 text-sm">{formErrors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Documento de Identidade *</Label>
                    <Input
                      value={formData.idNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                      className={`aviation-input ${formErrors.idNumber ? 'border-red-500' : ''}`}
                      placeholder="RG, CPF, CNH, etc."
                    />
                    {formErrors.idNumber && <p className="text-red-400 text-sm">{formErrors.idNumber}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Foto do Funcionário</Label>
                    <PhotoUpload
                      currentPhoto={formData.photo}
                      onPhotoChange={(photo) => setFormData(prev => ({ ...prev, photo: photo || undefined }))}
                      employeeName={formData.name || 'Novo Funcionário'}
                    />
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Informações Profissionais</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-white">Função *</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger className={`aviation-input ${formErrors.role ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        {roles.map(role => (
                          <SelectItem key={role} value={role} className="text-white">{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.role && <p className="text-red-400 text-sm">{formErrors.role}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Departamento *</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                      <SelectTrigger className={`aviation-input ${formErrors.department ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept} className="text-white">{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.department && <p className="text-red-400 text-sm">{formErrors.department}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Turno</Label>
                    <Select value={formData.shift} onValueChange={(value: any) => setFormData(prev => ({ ...prev, shift: value }))}>
                      <SelectTrigger className="aviation-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        <SelectItem value="morning" className="text-white">Manhã (06:00-14:00)</SelectItem>
                        <SelectItem value="afternoon" className="text-white">Tarde (14:00-22:00)</SelectItem>
                        <SelectItem value="night" className="text-white">Noite (22:00-06:00)</SelectItem>
                        <SelectItem value="flexible" className="text-white">Flexível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Data de Contratação</Label>
                    <Input
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                      className="aviation-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="aviation-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        <SelectItem value="active" className="text-white">Ativo</SelectItem>
                        <SelectItem value="inactive" className="text-white">Inativo</SelectItem>
                        <SelectItem value="suspended" className="text-white">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Observações</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="aviation-input min-h-20"
                      placeholder="Observações sobre o funcionário..."
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Contato de Emergência</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Nome</Label>
                    <Input
                      value={formData.emergencyContact?.name || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        emergencyContact: { 
                          ...prev.emergencyContact!, 
                          name: e.target.value 
                        } 
                      }))}
                      className="aviation-input"
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Telefone</Label>
                    <Input
                      value={formData.emergencyContact?.phone || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        emergencyContact: { 
                          ...prev.emergencyContact!, 
                          phone: e.target.value 
                        } 
                      }))}
                      className="aviation-input"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Parentesco</Label>
                    <Input
                      value={formData.emergencyContact?.relationship || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        emergencyContact: { 
                          ...prev.emergencyContact!, 
                          relationship: e.target.value 
                        } 
                      }))}
                      className="aviation-input"
                      placeholder="Cônjuge, Filho(a), etc."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-white/30 text-white hover:bg-white/20"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="aviation-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Salvando...</span>
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingEmployee ? 'Atualizar' : 'Cadastrar'}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Total de Funcionários</p>
                  <p className="text-3xl font-bold text-white">{employees.length}</p>
                </div>
                <Users className="h-8 w-8 text-aviation-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Funcionários Ativos</p>
                  <p className="text-3xl font-bold text-white">
                    {employees.filter(emp => emp.status === 'active').length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Departamentos</p>
                  <p className="text-3xl font-bold text-white">
                    {new Set(employees.map(emp => emp.department)).size}
                  </p>
                </div>
                <IdCard className="h-8 w-8 text-aviation-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Inativos/Suspensos</p>
                  <p className="text-3xl font-bold text-white">
                    {employees.filter(emp => emp.status !== 'active').length}
                  </p>
                </div>
                <UserX className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employees List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEmployees.map(employee => (
            <Card key={employee.id} className="glass-card border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {employee.photo ? (
                      <img 
                        src={employee.photo} 
                        alt={employee.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-aviation-blue-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-white text-lg">{employee.name}</CardTitle>
                      <CardDescription className="text-white/70">{employee.role}</CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(employee.status)} text-white`}>
                    {getStatusText(employee.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center text-white/80 text-sm">
                    <IdCard className="h-4 w-4 mr-2" />
                    {employee.department} • {getShiftText(employee.shift)}
                  </div>
                  
                  <div className="flex items-center text-white/80 text-sm">
                    <Phone className="h-4 w-4 mr-2" />
                    {employee.phone}
                  </div>
                  
                  <div className="flex items-center text-white/80 text-sm">
                    <Users className="h-4 w-4 mr-2" />
                    ID: {employee.idNumber}
                  </div>

                  {employee.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {employee.certifications.slice(0, 2).map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-white/30 text-white">
                          {cert}
                        </Badge>
                      ))}
                      {employee.certifications.length > 2 && (
                        <Badge variant="outline" className="text-xs border-white/30 text-white">
                          +{employee.certifications.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-white/60 text-xs">
                    Admitido em {format(new Date(employee.hireDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(employee)}
                      className="border-white/30 text-white hover:bg-white/20"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(employee)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredEmployees.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
              </h3>
              <p className="text-white/70 mb-6">
                {searchTerm 
                  ? 'Tente usar termos diferentes na busca'
                  : 'Comece cadastrando funcionários no sistema'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="aviation-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Funcionário
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
