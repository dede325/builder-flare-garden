import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Edit, Trash2, Plane, Calendar, Clock, Wrench, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Aircraft {
  id: string;
  registration: string; // e.g., D2-ABC
  model: string; // e.g., Boeing 737-800
  manufacturer: string; // e.g., Boeing
  owner: string; // e.g., TAAG Angola Airlines
  type: string; // Commercial, Private, Cargo, etc.
  capacity: {
    passengers?: number;
    cargo?: number; // in kg
  };
  specifications: {
    wingspan: number; // in meters
    length: number; // in meters
    height: number; // in meters
    exteriorArea: number; // in m² for cleaning estimates
  };
  status: 'active' | 'inactive' | 'out_of_service';
  location: string;
  hangar: string;
  lastCleaningDate?: string;
  lastCleaningType?: string;
  cleaningNotes?: string;
  cleaningRequirements: string[]; // Special cleaning requirements
  createdAt: string;
  updatedAt: string;
}

const defaultAircraft: Omit<Aircraft, 'id' | 'createdAt' | 'updatedAt'> = {
  registration: '',
  model: '',
  manufacturer: '',
  owner: '',
  type: 'commercial',
  capacity: {
    passengers: 0,
    cargo: 0
  },
  specifications: {
    maxTakeoffWeight: 0,
    wingspan: 0,
    length: 0,
    engines: ''
  },
  status: 'active',
  lastInspection: '',
  nextInspection: '',
  flightHours: 0,
  location: '',
  maintenanceNotes: '',
  certifications: [],
  insuranceExpiry: ''
};

export default function AircraftManager() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [filteredAircraft, setFilteredAircraft] = useState<Aircraft[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null);
  const [formData, setFormData] = useState(defaultAircraft);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const aircraftTypes = [
    'commercial',
    'private',
    'cargo',
    'military',
    'training',
    'charter'
  ];

  const manufacturers = [
    'Boeing',
    'Airbus',
    'Embraer',
    'Bombardier',
    'Cessna',
    'Gulfstream',
    'Dassault',
    'Beechcraft'
  ];

  const certificationOptions = [
    'Certificado de Aeronavegabilidade',
    'Certificado de Matrícula',
    'Seguro de Responsabilidade Civil',
    'Certificado de Ruído',
    'ETOPS (Extended Twin Operations)',
    'Certificado de Operador Aéreo'
  ];

  const getTypeText = (type: string) => {
    const types: Record<string, string> = {
      commercial: 'Comercial',
      private: 'Privada',
      cargo: 'Carga',
      military: 'Militar',
      training: 'Treinamento',
      charter: 'Charter'
    };
    return types[type] || type;
  };

  useEffect(() => {
    loadAircraft();
  }, []);

  useEffect(() => {
    filterAircraft();
  }, [aircraft, searchTerm, filterStatus, filterType, filterManufacturer]);

  const loadAircraft = () => {
    const savedAircraft = localStorage.getItem('aviation_aircraft');
    if (savedAircraft) {
      const parsed = JSON.parse(savedAircraft);
      setAircraft(parsed);
    } else {
      // Initialize with demo data
      const demoAircraft: Aircraft[] = [
        {
          id: '1',
          registration: 'D2-ABC',
          model: 'Boeing 737-800',
          manufacturer: 'Boeing',
          owner: 'TAAG Angola Airlines',
          type: 'commercial',
          capacity: {
            passengers: 189,
            cargo: 1200
          },
          specifications: {
            maxTakeoffWeight: 79000,
            wingspan: 35.8,
            length: 39.5,
            engines: '2x CFM56-7B26'
          },
          status: 'active',
          lastInspection: '2024-01-15',
          nextInspection: '2024-07-15',
          flightHours: 12450,
          location: 'Hangar Principal',
          maintenanceNotes: 'Última manutenção preventiva realizada com sucesso',
          certifications: ['Certificado de Aeronavegabilidade', 'Certificado de Matrícula'],
          insuranceExpiry: '2024-12-31',
          createdAt: '2023-01-01T08:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          registration: 'D2-XYZ',
          model: 'Embraer E190',
          manufacturer: 'Embraer',
          owner: 'TAAG Angola Airlines',
          type: 'commercial',
          capacity: {
            passengers: 114,
            cargo: 800
          },
          specifications: {
            maxTakeoffWeight: 54500,
            wingspan: 28.7,
            length: 36.2,
            engines: '2x CF34-10E'
          },
          status: 'maintenance',
          lastInspection: '2024-01-10',
          nextInspection: '2024-06-10',
          flightHours: 8920,
          location: 'Hangar de Manutenção',
          maintenanceNotes: 'Substituição do trem de pouso em andamento',
          certifications: ['Certificado de Aeronavegabilidade', 'Certificado de Matrícula'],
          insuranceExpiry: '2024-11-30',
          createdAt: '2023-02-15T08:00:00Z',
          updatedAt: '2024-01-20T14:15:00Z'
        }
      ];
      setAircraft(demoAircraft);
      localStorage.setItem('aviation_aircraft', JSON.stringify(demoAircraft));
    }
  };

  const filterAircraft = () => {
    let filtered = aircraft;

    if (searchTerm) {
      filtered = filtered.filter(ac => 
        ac.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ac.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ac.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ac.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(ac => ac.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(ac => ac.type === filterType);
    }

    if (filterManufacturer !== 'all') {
      filtered = filtered.filter(ac => ac.manufacturer === filterManufacturer);
    }

    setFilteredAircraft(filtered);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.registration.trim()) {
      errors.registration = 'Matrícula é obrigat��ria';
    } else if (!/^[A-Z]{1,2}-[A-Z]{3}$/.test(formData.registration.toUpperCase())) {
      errors.registration = 'Formato inválido. Use: D2-ABC';
    }

    if (!formData.model.trim()) {
      errors.model = 'Modelo é obrigatório';
    }

    if (!formData.manufacturer.trim()) {
      errors.manufacturer = 'Fabricante é obrigatório';
    }

    if (!formData.owner.trim()) {
      errors.owner = 'Proprietário é obrigatório';
    }

    if (!formData.location.trim()) {
      errors.location = 'Localização é obrigatória';
    }

    // Check for duplicate registration (excluding current aircraft when editing)
    const existingAircraft = aircraft.find(ac => 
      ac.registration.toUpperCase() === formData.registration.toUpperCase() && ac.id !== editingAircraft?.id
    );
    if (existingAircraft) {
      errors.registration = 'Matrícula já está em uso';
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
      
      if (editingAircraft) {
        // Update existing aircraft
        const updatedAircraft: Aircraft = {
          ...editingAircraft,
          ...formData,
          registration: formData.registration.toUpperCase(),
          updatedAt: now
        };

        const updatedAircraftList = aircraft.map(ac => 
          ac.id === editingAircraft.id ? updatedAircraft : ac
        );

        setAircraft(updatedAircraftList);
        localStorage.setItem('aviation_aircraft', JSON.stringify(updatedAircraftList));

        toast({
          title: "Aeronave atualizada",
          description: "Os dados foram salvos com sucesso.",
        });
      } else {
        // Create new aircraft
        const newAircraft: Aircraft = {
          ...formData,
          id: crypto.randomUUID(),
          registration: formData.registration.toUpperCase(),
          createdAt: now,
          updatedAt: now
        };

        const updatedAircraftList = [...aircraft, newAircraft];
        setAircraft(updatedAircraftList);
        localStorage.setItem('aviation_aircraft', JSON.stringify(updatedAircraftList));

        toast({
          title: "Aeronave cadastrada",
          description: "Nova aeronave adicionada com sucesso.",
        });
      }

      setIsCreateDialogOpen(false);
      setEditingAircraft(null);
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

  const handleEdit = (aircraftItem: Aircraft) => {
    setEditingAircraft(aircraftItem);
    setFormData({
      registration: aircraftItem.registration,
      model: aircraftItem.model,
      manufacturer: aircraftItem.manufacturer,
      owner: aircraftItem.owner,
      type: aircraftItem.type,
      capacity: aircraftItem.capacity,
      specifications: aircraftItem.specifications,
      status: aircraftItem.status,
      lastInspection: aircraftItem.lastInspection,
      nextInspection: aircraftItem.nextInspection,
      flightHours: aircraftItem.flightHours,
      location: aircraftItem.location,
      maintenanceNotes: aircraftItem.maintenanceNotes || '',
      certifications: aircraftItem.certifications,
      insuranceExpiry: aircraftItem.insuranceExpiry
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (aircraftItem: Aircraft) => {
    if (confirm(`Tem certeza que deseja excluir a aeronave ${aircraftItem.registration}?`)) {
      const updatedAircraftList = aircraft.filter(ac => ac.id !== aircraftItem.id);
      setAircraft(updatedAircraftList);
      localStorage.setItem('aviation_aircraft', JSON.stringify(updatedAircraftList));

      toast({
        title: "Aeronave excluída",
        description: "A aeronave foi removida do sistema.",
      });
    }
  };

  const resetForm = () => {
    setFormData(defaultAircraft);
    setFormErrors({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-500';
      case 'grounded': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Operacional';
      case 'maintenance': return 'Manutenção';
      case 'inactive': return 'Inativa';
      case 'grounded': return 'Retida';
      default: return 'Desconhecido';
    }
  };

  const getInspectionStatus = (nextInspection: string) => {
    if (!nextInspection) return null;
    
    const nextDate = new Date(nextInspection);
    const now = new Date();
    const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Vencida', color: 'text-red-400' };
    } else if (diffDays <= 30) {
      return { text: `${diffDays} dias`, color: 'text-yellow-400' };
    } else {
      return { text: `${diffDays} dias`, color: 'text-green-400' };
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
              <Plane className="h-6 w-6 text-white" />
              <h1 className="text-2xl font-bold text-white">Gerenciamento de Aeronaves</h1>
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
                placeholder="Buscar aeronaves..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="aviation-input pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="aviation-input w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-aviation-gray-800 border-white/20">
                  <SelectItem value="all" className="text-white">Todos</SelectItem>
                  <SelectItem value="active" className="text-white">Operacional</SelectItem>
                  <SelectItem value="maintenance" className="text-white">Manutenção</SelectItem>
                  <SelectItem value="inactive" className="text-white">Inativa</SelectItem>
                  <SelectItem value="grounded" className="text-white">Retida</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="aviation-input w-32">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-aviation-gray-800 border-white/20">
                  <SelectItem value="all" className="text-white">Todos</SelectItem>
                  {aircraftTypes.map(type => (
                    <SelectItem key={type} value={type} className="text-white">
                      {getTypeText(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterManufacturer} onValueChange={setFilterManufacturer}>
                <SelectTrigger className="aviation-input w-36">
                  <SelectValue placeholder="Fabricante" />
                </SelectTrigger>
                <SelectContent className="bg-aviation-gray-800 border-white/20">
                  <SelectItem value="all" className="text-white">Todos</SelectItem>
                  {manufacturers.map(manufacturer => (
                    <SelectItem key={manufacturer} value={manufacturer} className="text-white">
                      {manufacturer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingAircraft(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="aviation-button">
                <Plus className="h-4 w-4 mr-2" />
                Nova Aeronave
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-aviation-gray-800 border-white/20 mx-4">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingAircraft ? 'Editar Aeronave' : 'Nova Aeronave'}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  {editingAircraft ? 'Atualize os dados da aeronave' : 'Cadastre uma nova aeronave no sistema'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-white">Matrícula *</Label>
                    <Input
                      value={formData.registration}
                      onChange={(e) => setFormData(prev => ({ ...prev, registration: e.target.value.toUpperCase() }))}
                      className={`aviation-input ${formErrors.registration ? 'border-red-500' : ''}`}
                      placeholder="D2-ABC"
                    />
                    {formErrors.registration && <p className="text-red-400 text-sm">{formErrors.registration}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Modelo *</Label>
                    <Input
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      className={`aviation-input ${formErrors.model ? 'border-red-500' : ''}`}
                      placeholder="Boeing 737-800"
                    />
                    {formErrors.model && <p className="text-red-400 text-sm">{formErrors.model}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Fabricante *</Label>
                    <Select value={formData.manufacturer} onValueChange={(value) => setFormData(prev => ({ ...prev, manufacturer: value }))}>
                      <SelectTrigger className={`aviation-input ${formErrors.manufacturer ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Selecione o fabricante" />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        {manufacturers.map(manufacturer => (
                          <SelectItem key={manufacturer} value={manufacturer} className="text-white">
                            {manufacturer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.manufacturer && <p className="text-red-400 text-sm">{formErrors.manufacturer}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Proprietário *</Label>
                    <Input
                      value={formData.owner}
                      onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                      className={`aviation-input ${formErrors.owner ? 'border-red-500' : ''}`}
                      placeholder="TAAG Angola Airlines"
                    />
                    {formErrors.owner && <p className="text-red-400 text-sm">{formErrors.owner}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Tipo</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger className="aviation-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        {aircraftTypes.map(type => (
                          <SelectItem key={type} value={type} className="text-white">
                            {getTypeText(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="aviation-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-aviation-gray-800 border-white/20">
                        <SelectItem value="active" className="text-white">Operacional</SelectItem>
                        <SelectItem value="maintenance" className="text-white">Manutenção</SelectItem>
                        <SelectItem value="inactive" className="text-white">Inativa</SelectItem>
                        <SelectItem value="grounded" className="text-white">Retida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Localização Atual *</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className={`aviation-input ${formErrors.location ? 'border-red-500' : ''}`}
                      placeholder="Hangar Principal"
                    />
                    {formErrors.location && <p className="text-red-400 text-sm">{formErrors.location}</p>}
                  </div>
                </div>

                {/* Technical Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Informações Técnicas</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Capacidade Passageiros</Label>
                      <Input
                        type="number"
                        value={formData.capacity.passengers || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          capacity: { ...prev.capacity, passengers: parseInt(e.target.value) || 0 }
                        }))}
                        className="aviation-input"
                        placeholder="189"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Capacidade Carga (kg)</Label>
                      <Input
                        type="number"
                        value={formData.capacity.cargo || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          capacity: { ...prev.capacity, cargo: parseInt(e.target.value) || 0 }
                        }))}
                        className="aviation-input"
                        placeholder="1200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Peso Máx. Decolagem (kg)</Label>
                      <Input
                        type="number"
                        value={formData.specifications.maxTakeoffWeight || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          specifications: { ...prev.specifications, maxTakeoffWeight: parseInt(e.target.value) || 0 }
                        }))}
                        className="aviation-input"
                        placeholder="79000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Horas de Voo</Label>
                      <Input
                        type="number"
                        value={formData.flightHours || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, flightHours: parseInt(e.target.value) || 0 }))}
                        className="aviation-input"
                        placeholder="12450"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Envergadura (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.specifications.wingspan || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          specifications: { ...prev.specifications, wingspan: parseFloat(e.target.value) || 0 }
                        }))}
                        className="aviation-input"
                        placeholder="35.8"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Comprimento (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.specifications.length || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          specifications: { ...prev.specifications, length: parseFloat(e.target.value) || 0 }
                        }))}
                        className="aviation-input"
                        placeholder="39.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Motores</Label>
                    <Input
                      value={formData.specifications.engines}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        specifications: { ...prev.specifications, engines: e.target.value }
                      }))}
                      className="aviation-input"
                      placeholder="2x CFM56-7B26"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Última Inspeção</Label>
                      <Input
                        type="date"
                        value={formData.lastInspection}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastInspection: e.target.value }))}
                        className="aviation-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Próxima Inspeção</Label>
                      <Input
                        type="date"
                        value={formData.nextInspection}
                        onChange={(e) => setFormData(prev => ({ ...prev, nextInspection: e.target.value }))}
                        className="aviation-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Vencimento do Seguro</Label>
                    <Input
                      type="date"
                      value={formData.insuranceExpiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceExpiry: e.target.value }))}
                      className="aviation-input"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance Notes */}
              <div className="mt-6">
                <Label className="text-white">Observações de Manutenção</Label>
                <Textarea
                  value={formData.maintenanceNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenanceNotes: e.target.value }))}
                  className="aviation-input min-h-20 mt-2"
                  placeholder="Observações sobre manutenção, reparos, etc..."
                />
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
                      {editingAircraft ? 'Atualizar' : 'Cadastrar'}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Total de Aeronaves</p>
                  <p className="text-3xl font-bold text-white">{aircraft.length}</p>
                </div>
                <Plane className="h-8 w-8 text-aviation-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Operacionais</p>
                  <p className="text-3xl font-bold text-white">
                    {aircraft.filter(ac => ac.status === 'active').length}
                  </p>
                </div>
                <div className="h-3 w-3 bg-green-400 rounded-full"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Manutenção</p>
                  <p className="text-3xl font-bold text-white">
                    {aircraft.filter(ac => ac.status === 'maintenance').length}
                  </p>
                </div>
                <Wrench className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Horas de Voo</p>
                  <p className="text-3xl font-bold text-white">
                    {aircraft.reduce((sum, ac) => sum + ac.flightHours, 0).toLocaleString()}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-aviation-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Inspeções Próximas</p>
                  <p className="text-3xl font-bold text-white">
                    {aircraft.filter(ac => {
                      if (!ac.nextInspection) return false;
                      const diffDays = Math.ceil((new Date(ac.nextInspection).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return diffDays <= 30 && diffDays >= 0;
                    }).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aircraft List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAircraft.map(aircraftItem => {
            const inspectionStatus = getInspectionStatus(aircraftItem.nextInspection);
            
            return (
              <Card key={aircraftItem.id} className="glass-card border-white/20 hover:bg-white/20 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-xl">{aircraftItem.registration}</CardTitle>
                      <CardDescription className="text-white/70">
                        {aircraftItem.model} • {aircraftItem.manufacturer}
                      </CardDescription>
                      <p className="text-white/60 text-sm mt-1">{aircraftItem.owner}</p>
                    </div>
                    <Badge className={`${getStatusColor(aircraftItem.status)} text-white`}>
                      {getStatusText(aircraftItem.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-white/80">
                      <Plane className="h-4 w-4 mr-2" />
                      {getTypeText(aircraftItem.type)}
                    </div>
                    
                    <div className="flex items-center text-white/80">
                      <Clock className="h-4 w-4 mr-2" />
                      {aircraftItem.flightHours.toLocaleString()}h
                    </div>

                    {aircraftItem.capacity.passengers && (
                      <div className="text-white/80">
                        👥 {aircraftItem.capacity.passengers} pax
                      </div>
                    )}

                    <div className="text-white/80">
                      📍 {aircraftItem.location}
                    </div>
                  </div>

                  {inspectionStatus && (
                    <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                      <span className="text-white/80 text-sm">Próxima inspeção:</span>
                      <span className={`text-sm font-medium ${inspectionStatus.color}`}>
                        {inspectionStatus.text}
                      </span>
                    </div>
                  )}

                  {aircraftItem.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {aircraftItem.certifications.slice(0, 2).map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-white/30 text-white">
                          {cert.replace('Certificado de ', '')}
                        </Badge>
                      ))}
                      {aircraftItem.certifications.length > 2 && (
                        <Badge variant="outline" className="text-xs border-white/30 text-white">
                          +{aircraftItem.certifications.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4">
                    <span className="text-white/60 text-xs">
                      Atualizada em {format(new Date(aircraftItem.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(aircraftItem)}
                        className="border-white/30 text-white hover:bg-white/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(aircraftItem)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredAircraft.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Plane className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'Nenhuma aeronave encontrada' : 'Nenhuma aeronave cadastrada'}
              </h3>
              <p className="text-white/70 mb-6">
                {searchTerm 
                  ? 'Tente usar termos diferentes na busca'
                  : 'Comece cadastrando aeronaves no sistema'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="aviation-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira Aeronave
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
