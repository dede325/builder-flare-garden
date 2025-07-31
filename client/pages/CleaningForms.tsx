import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Download, QrCode, Calendar, Clock, MapPin, Wrench, Users, FileText, Camera, Phone, IdCard, Signature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/lib/supabase';
import SignatureCanvas from '@/components/SignatureCanvas';
import PhotoUpload from '@/components/PhotoUpload';
import { downloadCleaningFormPDF, previewCleaningFormPDF } from '@/lib/pdf-utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QRCode from 'qrcode';

interface CleaningForm {
  id: string;
  code: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'night';
  location: string;
  interventionTypes: string[];
  aircraftId: string;
  employees: {
    id: string;
    name: string;
    task: string;
    startTime: string;
    endTime: string;
    phone: string;
    idNumber: string;
    photo?: string;
  }[];
  supervisorSignature?: string;
  clientSignature?: string;
  clientConfirmedWithoutSignature: boolean;
  qrCode: string;
  status: 'draft' | 'pending_signatures' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export default function CleaningForms() {
  const [forms, setForms] = useState<CleaningForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<CleaningForm | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [aircraft, setAircraft] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSignatureDialog, setShowSignatureDialog] = useState<'supervisor' | 'client' | null>(null);
  const [showQRDialog, setShowQRDialog] = useState<CleaningForm | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    shift: 'morning' as 'morning' | 'afternoon' | 'night',
    location: '',
    interventionTypes: [] as string[],
    aircraftId: '',
    employees: [] as any[],
    supervisorSignature: '',
    clientSignature: '',
    clientConfirmedWithoutSignature: false
  });

  const interventionTypeOptions = [
    'Limpeza Externa',
    'Limpeza Interna',
    'Limpeza de Motores',
    'Limpeza de Cockpit',
    'Limpeza de Bagageiro',
    'Inspeção Visual',
    'Lavagem Completa',
    'Enceramento',
    'Limpeza de Vidros',
    'Aspiração'
  ];

  const locationOptions = [
    'Hangar Principal',
    'Pátio de Aeronaves',
    'Terminal de Passageiros',
    'Área de Manutenção',
    'Rampa Norte',
    'Rampa Sul',
    'Hangar de Manutenção',
    'Estacionamento VIP'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [aircraftResult, employeesResult] = await Promise.all([
        db.getAircraft(),
        db.getEmployees()
      ]);
      
      if (aircraftResult.data) setAircraft(aircraftResult.data);
      if (employeesResult.data) setEmployees(employeesResult.data);
      
      // Load saved forms from localStorage for demo
      const savedForms = localStorage.getItem('cleaningForms');
      if (savedForms) {
        setForms(JSON.parse(savedForms));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateFormCode = (date: string, shift: string, location: string) => {
    const dateFormatted = format(new Date(date), 'ddMMyy');
    const timeStamp = format(new Date(), 'HHmmss');
    const locationCode = location.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const shiftCode = shift === 'morning' ? 'M' : shift === 'afternoon' ? 'T' : 'N';
    
    return `FL-${locationCode}-${shiftCode}${dateFormatted}${timeStamp}`;
  };

  const generateQRCode = async (formCode: string) => {
    try {
      const url = `${window.location.origin}/cleaning-forms/${formCode}`;
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Basic validation
    if (!formData.date) {
      errors.date = 'Data é obrigatória';
    }

    if (!formData.location) {
      errors.location = 'Local da intervenção é obrigatório';
    }

    if (formData.interventionTypes.length === 0) {
      errors.interventionTypes = 'Selecione pelo menos um tipo de intervenção';
    }

    if (!formData.aircraftId) {
      errors.aircraftId = 'Selecione uma aeronave';
    }

    if (formData.employees.length === 0) {
      errors.employees = 'Adicione pelo menos um funcionário';
    }

    // Employee validation
    formData.employees.forEach((employee, index) => {
      if (!employee.name.trim()) {
        errors[`employee_${index}_name`] = 'Nome é obrigatório';
      }

      if (!employee.task.trim()) {
        errors[`employee_${index}_task`] = 'Tarefa é obrigatória';
      }

      if (!employee.phone.trim()) {
        errors[`employee_${index}_phone`] = 'Telefone é obrigatório';
      } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(employee.phone)) {
        errors[`employee_${index}_phone`] = 'Formato inválido. Use (11) 99999-9999';
      }

      if (!employee.idNumber.trim()) {
        errors[`employee_${index}_idNumber`] = 'Documento é obrigatório';
      }

      if (employee.startTime && employee.endTime) {
        const start = new Date(`2000-01-01T${employee.startTime}`);
        const end = new Date(`2000-01-01T${employee.endTime}`);
        if (start >= end) {
          errors[`employee_${index}_time`] = 'Horário de fim deve ser maior que o início';
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateForm = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formCode = generateFormCode(formData.date, formData.shift, formData.location);
      const qrCode = await generateQRCode(formCode);

      const newForm: CleaningForm = {
        id: crypto.randomUUID(),
        code: formCode,
        date: formData.date,
        shift: formData.shift,
        location: formData.location,
        interventionTypes: formData.interventionTypes,
        aircraftId: formData.aircraftId,
        employees: formData.employees,
        supervisorSignature: formData.supervisorSignature,
        clientSignature: formData.clientSignature,
        clientConfirmedWithoutSignature: formData.clientConfirmedWithoutSignature,
        qrCode,
        status: formData.supervisorSignature && (formData.clientSignature || formData.clientConfirmedWithoutSignature) ? 'completed' : 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedForms = [...forms, newForm];
      setForms(updatedForms);
      localStorage.setItem('cleaningForms', JSON.stringify(updatedForms));

      setIsCreateDialogOpen(false);
      resetForm();
      setFormErrors({});
    } catch (error) {
      console.error('Error creating form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      shift: 'morning',
      location: '',
      interventionTypes: [],
      aircraftId: '',
      employees: [],
      supervisorSignature: '',
      clientSignature: '',
      clientConfirmedWithoutSignature: false
    });
    setFormErrors({});
  };

  const addEmployee = () => {
    setFormData(prev => ({
      ...prev,
      employees: [...prev.employees, {
        id: crypto.randomUUID(),
        name: '',
        task: '',
        startTime: '',
        endTime: '',
        phone: '',
        idNumber: '',
        photo: ''
      }]
    }));
  };

  const updateEmployee = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      employees: prev.employees.map((emp, i) =>
        i === index ? { ...emp, [field]: value } : emp
      )
    }));
  };

  const updateEmployeePhoto = (index: number, photoDataURL: string | null) => {
    setFormData(prev => ({
      ...prev,
      employees: prev.employees.map((emp, i) =>
        i === index ? { ...emp, photo: photoDataURL || undefined } : emp
      )
    }));
  };

  const removeEmployee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      employees: prev.employees.filter((_, i) => i !== index)
    }));
  };

  const handleSignature = (signatureDataURL: string) => {
    if (showSignatureDialog === 'supervisor') {
      setFormData(prev => ({ ...prev, supervisorSignature: signatureDataURL }));
    } else if (showSignatureDialog === 'client') {
      setFormData(prev => ({ ...prev, clientSignature: signatureDataURL }));
    }
    setShowSignatureDialog(null);
  };

  const clearSignature = (type: 'supervisor' | 'client') => {
    if (type === 'supervisor') {
      setFormData(prev => ({ ...prev, supervisorSignature: '' }));
    } else {
      setFormData(prev => ({ ...prev, clientSignature: '' }));
    }
  };

  const handleDownloadPDF = async (form: CleaningForm) => {
    try {
      const aircraftData = aircraft.find((ac: any) => ac.id === form.aircraftId);
      await downloadCleaningFormPDF(form, aircraftData);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handlePreviewPDF = async (form: CleaningForm) => {
    try {
      const aircraftData = aircraft.find((ac: any) => ac.id === form.aircraftId);
      await previewCleaningFormPDF(form, aircraftData);
    } catch (error) {
      console.error('Error previewing PDF:', error);
    }
  };

  const filteredForms = forms.filter(form => 
    form.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-500';
      case 'pending_signatures': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'pending_signatures': return 'Aguardando Assinaturas';
      case 'completed': return 'Concluído';
      default: return 'Desconhecido';
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
              <FileText className="h-6 w-6 text-white" />
              <h1 className="text-2xl font-bold text-white">Folhas de Limpeza</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/70" />
              <Input
                placeholder="Buscar por código ou local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="aviation-input pl-10 w-80"
              />
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="aviation-button">
                <Plus className="h-4 w-4 mr-2" />
                Nova Folha de Limpeza
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-aviation-gray-800 border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">Nova Folha de Limpeza</DialogTitle>
                <DialogDescription className="text-white/70">
                  Preencha os dados para criar uma nova folha de requisição de limpeza
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-aviation-gray-700">
                  <TabsTrigger value="basic" className="text-white">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="employees" className="text-white">Funcionários</TabsTrigger>
                  <TabsTrigger value="signatures" className="text-white">Assinaturas</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date and Shift */}
                    <div className="space-y-2">
                      <Label className="text-white">Data</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="aviation-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Turno</Label>
                      <Select value={formData.shift} onValueChange={(value: any) => setFormData(prev => ({ ...prev, shift: value }))}>
                        <SelectTrigger className="aviation-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-aviation-gray-800 border-white/20">
                          <SelectItem value="morning" className="text-white">Manhã (06:00 - 14:00)</SelectItem>
                          <SelectItem value="afternoon" className="text-white">Tarde (14:00 - 22:00)</SelectItem>
                          <SelectItem value="night" className="text-white">Noite (22:00 - 06:00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label className="text-white">Local da Intervenção *</Label>
                      <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                        <SelectTrigger className={`aviation-input ${formErrors.location ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Selecione o local" />
                        </SelectTrigger>
                        <SelectContent className="bg-aviation-gray-800 border-white/20">
                          {locationOptions.map(location => (
                            <SelectItem key={location} value={location} className="text-white">{location}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.location && <p className="text-red-400 text-sm">{formErrors.location}</p>}
                    </div>

                    {/* Aircraft Selection */}
                    <div className="space-y-2">
                      <Label className="text-white">Aeronave *</Label>
                      <Select value={formData.aircraftId} onValueChange={(value) => setFormData(prev => ({ ...prev, aircraftId: value }))}>
                        <SelectTrigger className={`aviation-input ${formErrors.aircraftId ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Selecione a aeronave" />
                        </SelectTrigger>
                        <SelectContent className="bg-aviation-gray-800 border-white/20">
                          {aircraft.map((ac: any) => (
                            <SelectItem key={ac.id} value={ac.id} className="text-white">
                              {ac.registration} - {ac.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.aircraftId && <p className="text-red-400 text-sm">{formErrors.aircraftId}</p>}
                    </div>
                  </div>

                  {/* Intervention Types */}
                  <div className="space-y-2">
                    <Label className="text-white">Tipos de Intervenção *</Label>
                    <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 p-3 rounded-lg border ${formErrors.interventionTypes ? 'border-red-500' : 'border-white/30'}`}>
                      {interventionTypeOptions.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={formData.interventionTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  interventionTypes: [...prev.interventionTypes, type]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  interventionTypes: prev.interventionTypes.filter(t => t !== type)
                                }));
                              }
                            }}
                            className="border-white/30"
                          />
                          <Label htmlFor={type} className="text-white text-sm">{type}</Label>
                        </div>
                      ))}
                    </div>
                    {formErrors.interventionTypes && <p className="text-red-400 text-sm">{formErrors.interventionTypes}</p>}
                  </div>
                </TabsContent>

                <TabsContent value="employees" className="space-y-6 mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Funcionários do Turno</h3>
                    <Button onClick={addEmployee} className="aviation-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Funcionário
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.employees.map((employee, index) => (
                      <Card key={employee.id} className="glass-card border-white/20">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white">Nome *</Label>
                              <Input
                                value={employee.name}
                                onChange={(e) => updateEmployee(index, 'name', e.target.value)}
                                className={`aviation-input ${formErrors[`employee_${index}_name`] ? 'border-red-500' : ''}`}
                                placeholder="Nome completo"
                              />
                              {formErrors[`employee_${index}_name`] &&
                                <p className="text-red-400 text-sm">{formErrors[`employee_${index}_name`]}</p>
                              }
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white">Tarefa *</Label>
                              <Input
                                value={employee.task}
                                onChange={(e) => updateEmployee(index, 'task', e.target.value)}
                                className={`aviation-input ${formErrors[`employee_${index}_task`] ? 'border-red-500' : ''}`}
                                placeholder="Descrição da tarefa"
                              />
                              {formErrors[`employee_${index}_task`] &&
                                <p className="text-red-400 text-sm">{formErrors[`employee_${index}_task`]}</p>
                              }
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white">Telefone *</Label>
                              <Input
                                value={employee.phone}
                                onChange={(e) => updateEmployee(index, 'phone', e.target.value)}
                                className={`aviation-input ${formErrors[`employee_${index}_phone`] ? 'border-red-500' : ''}`}
                                placeholder="(11) 99999-9999"
                              />
                              {formErrors[`employee_${index}_phone`] &&
                                <p className="text-red-400 text-sm">{formErrors[`employee_${index}_phone`]}</p>
                              }
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white">Início</Label>
                              <Input
                                type="time"
                                value={employee.startTime}
                                onChange={(e) => updateEmployee(index, 'startTime', e.target.value)}
                                className="aviation-input"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white">Fim</Label>
                              <Input
                                type="time"
                                value={employee.endTime}
                                onChange={(e) => updateEmployee(index, 'endTime', e.target.value)}
                                className="aviation-input"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white">Bilhete de Identidade *</Label>
                              <Input
                                value={employee.idNumber}
                                onChange={(e) => updateEmployee(index, 'idNumber', e.target.value)}
                                className={`aviation-input ${formErrors[`employee_${index}_idNumber`] ? 'border-red-500' : ''}`}
                                placeholder="Número do documento"
                              />
                              {formErrors[`employee_${index}_idNumber`] &&
                                <p className="text-red-400 text-sm">{formErrors[`employee_${index}_idNumber`]}</p>
                              }
                            </div>

                            {formErrors[`employee_${index}_time`] && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <p className="text-red-400 text-sm">{formErrors[`employee_${index}_time`]}</p>
                              </div>
                            )}

                            <div className="md:col-span-2 lg:col-span-3 flex justify-between items-center pt-2">
                              <PhotoUpload
                                currentPhoto={employee.photo}
                                onPhotoChange={(photoDataURL) => updateEmployeePhoto(index, photoDataURL)}
                                employeeName={employee.name || `Funcionário ${index + 1}`}
                              />
                              <Button
                                variant="destructive"
                                onClick={() => removeEmployee(index)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {formData.employees.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/70">Nenhum funcionário adicionado</p>
                        <Button onClick={addEmployee} className="aviation-button mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Primeiro Funcionário
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="signatures" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="glass-card border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Signature className="h-5 w-5 mr-2" />
                          Assinatura do Supervisor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {formData.supervisorSignature ? (
                          <div className="space-y-2">
                            <img
                              src={formData.supervisorSignature}
                              alt="Assinatura do Supervisor"
                              className="w-full h-32 object-contain border border-white/30 rounded-lg bg-white"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => clearSignature('supervisor')}
                              className="w-full border-white/30 text-white hover:bg-white/20"
                            >
                              Limpar Assinatura
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setShowSignatureDialog('supervisor')}
                            className="w-full h-32 border-2 border-dashed border-white/30 rounded-lg bg-transparent hover:bg-white/10 text-white"
                          >
                            <div className="text-center">
                              <Signature className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-sm">Clique para assinar</p>
                            </div>
                          </Button>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="glass-card border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Signature className="h-5 w-5 mr-2" />
                          Assinatura do Cliente
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {formData.clientSignature ? (
                          <div className="space-y-2">
                            <img
                              src={formData.clientSignature}
                              alt="Assinatura do Cliente"
                              className="w-full h-32 object-contain border border-white/30 rounded-lg bg-white"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => clearSignature('client')}
                              className="w-full border-white/30 text-white hover:bg-white/20"
                            >
                              Limpar Assinatura
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setShowSignatureDialog('client')}
                            className="w-full h-32 border-2 border-dashed border-white/30 rounded-lg bg-transparent hover:bg-white/10 text-white"
                            disabled={formData.clientConfirmedWithoutSignature}
                          >
                            <div className="text-center">
                              <Signature className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-sm">Clique para assinar</p>
                            </div>
                          </Button>
                        )}

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="noSignature"
                            checked={formData.clientConfirmedWithoutSignature}
                            onCheckedChange={(checked) => {
                              setFormData(prev => ({
                                ...prev,
                                clientConfirmedWithoutSignature: !!checked,
                                clientSignature: checked ? '' : prev.clientSignature
                              }));
                            }}
                            className="border-white/30"
                          />
                          <Label htmlFor="noSignature" className="text-white text-sm">
                            Cliente confirmou sem assinar
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

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
                  onClick={handleCreateForm}
                  className="aviation-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Criando...</span>
                    </div>
                  ) : (
                    'Criar Folha de Limpeza'
                  )}
                </Button>
              </div>

              {Object.keys(formErrors).length > 0 && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm font-medium mb-2">Corrija os seguintes erros:</p>
                  <ul className="text-red-400 text-sm space-y-1">
                    {Object.values(formErrors).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Forms List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredForms.map(form => (
            <Card key={form.id} className="glass-card border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-lg">{form.code}</CardTitle>
                    <CardDescription className="text-white/70">
                      {format(new Date(form.date), 'dd/MM/yyyy', { locale: ptBR })} - {
                        form.shift === 'morning' ? 'Manhã' : 
                        form.shift === 'afternoon' ? 'Tarde' : 'Noite'
                      }
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(form.status)} text-white`}>
                    {getStatusText(form.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-white/80 text-sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  {form.location}
                </div>
                
                <div className="flex items-center text-white/80 text-sm">
                  <Wrench className="h-4 w-4 mr-2" />
                  {form.interventionTypes.length} tipo(s) de intervenção
                </div>
                
                <div className="flex items-center text-white/80 text-sm">
                  <Users className="h-4 w-4 mr-2" />
                  {form.employees.length} funcionário(s)
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQRDialog(form)}
                    className="border-white/30 text-white hover:bg-white/20"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                  </Button>

                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewPDF(form)}
                      className="border-white/30 text-white hover:bg-white/20"
                    >
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(form)}
                      className="border-white/30 text-white hover:bg-white/20"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredForms.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'Nenhuma folha encontrada' : 'Nenhuma folha de limpeza criada'}
              </h3>
              <p className="text-white/70 mb-6">
                {searchTerm 
                  ? 'Tente usar termos diferentes na busca'
                  : 'Comece criando sua primeira folha de requisição de limpeza'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="aviation-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Folha
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Signature Dialog */}
      <Dialog open={!!showSignatureDialog} onOpenChange={() => setShowSignatureDialog(null)}>
        <DialogContent className="max-w-2xl bg-aviation-gray-800 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              {showSignatureDialog === 'supervisor' ? 'Assinatura do Supervisor' : 'Assinatura do Cliente'}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Use o mouse ou toque na tela para desenhar sua assinatura
            </DialogDescription>
          </DialogHeader>

          {showSignatureDialog && (
            <SignatureCanvas
              title={showSignatureDialog === 'supervisor' ? 'Supervisor' : 'Cliente'}
              onSave={handleSignature}
              onCancel={() => setShowSignatureDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!showQRDialog} onOpenChange={() => setShowQRDialog(null)}>
        <DialogContent className="max-w-md bg-aviation-gray-800 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">QR Code - {showQRDialog?.code}</DialogTitle>
            <DialogDescription className="text-white/70">
              Escaneie para acessar a folha online ou compartilhar
            </DialogDescription>
          </DialogHeader>

          {showQRDialog && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={showQRDialog.qrCode}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>

              <div className="text-center">
                <p className="text-white/80 text-sm mb-2">
                  Link direto:
                </p>
                <p className="text-aviation-blue-300 text-xs break-all">
                  {`${window.location.origin}/cleaning-forms/${showQRDialog.code}`}
                </p>
              </div>

              <div className="flex space-x-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/cleaning-forms/${showQRDialog.code}`);
                  }}
                  className="flex-1 border-white/30 text-white hover:bg-white/20"
                >
                  Copiar Link
                </Button>
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = `qr-code-${showQRDialog.code}.png`;
                    link.href = showQRDialog.qrCode;
                    link.click();
                  }}
                  className="flex-1 aviation-button"
                >
                  Baixar QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
