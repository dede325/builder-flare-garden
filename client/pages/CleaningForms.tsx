import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Download, QrCode, Calendar, Clock, MapPin, Wrench, Users, FileText, Camera, Phone, IdCard, Signature, X, Edit, CheckSquare, Shield, Wifi, WifiOff, AlertTriangle, Sync } from 'lucide-react';
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
import { downloadCleaningFormPDF, previewCleaningFormPDF, generateAndUploadPDF } from '@/lib/pdf-utils';
import { supabaseStorage } from '@/lib/supabase-storage';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QRCode from 'qrcode';
import { generateSecureFormId, generateSecureQRData, checkSecureContext } from '@/lib/crypto-utils';
import { secureSyncService } from '@/lib/secure-sync';

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
  version: number;
  changeHistory: {
    version: number;
    timestamp: string;
    changes: string[];
    author: string;
    previousData?: any;
  }[];
  syncStatus?: 'pending' | 'synced' | 'error';
  lastSyncAt?: string;
}

export default function CleaningForms() {
  const [forms, setForms] = useState<CleaningForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<CleaningForm | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [aircraft, setAircraft] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showSignatureDialog, setShowSignatureDialog] = useState<'supervisor' | 'client' | null>(null);
  const [showQRDialog, setShowQRDialog] = useState<CleaningForm | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [editingForm, setEditingForm] = useState<CleaningForm | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error' | 'offline'>('offline');
  const [securityStatus, setSecurityStatus] = useState<'secure' | 'insecure'>('secure');
  const [isSecureMode, setIsSecureMode] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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

  // Get intervention types from localStorage or use defaults
  const getInterventionTypes = () => {
    const saved = localStorage.getItem('intervention_types');
    if (saved) {
      return JSON.parse(saved);
    }
    const defaults = [
      'Limpeza Exterior',
      'Limpeza Interior',
      'Polimento',
      'Lavagem Profunda Durante a Manutenção de Base'
    ];
    localStorage.setItem('intervention_types', JSON.stringify(defaults));
    return defaults;
  };

  const [interventionTypeOptions, setInterventionTypeOptions] = useState<string[]>(getInterventionTypes());

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
    initializeSecureSystem();
  }, []);

  const initializeSecureSystem = async () => {
    // Check secure context
    checkSecureContext();
    setSecurityStatus(window.isSecureContext ? 'secure' : 'insecure');

    // Enable secure mode if available
    setIsSecureMode(window.isSecureContext);

    // Load data (secure if available, fallback to regular)
    await loadData();

    // Update sync status
    updateSyncStatus();

    // Listen for online/offline changes
    const handleOnlineStatus = () => {
      updateSyncStatus();
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  };

  const updateSyncStatus = async () => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    try {
      const stats = await secureSyncService.getSyncStats();
      if (stats.errors > 0) {
        setSyncStatus('error');
      } else if (stats.pendingSync > 0) {
        setSyncStatus('pending');
      } else {
        setSyncStatus('synced');
      }
    } catch {
      setSyncStatus('error');
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (formData.location || formData.employees.length > 0 || formData.interventionTypes.length > 0) {
      setAutoSaveStatus('saving');

      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData]);

  const autoSave = () => {
    try {
      const draftKey = `cleaning_form_draft_${Date.now()}`;
      const existingDrafts = JSON.parse(localStorage.getItem('cleaning_form_drafts') || '[]');

      // Keep only the latest 5 drafts
      const updatedDrafts = [
        {
          key: draftKey,
          data: formData,
          timestamp: new Date().toISOString(),
          description: `${formData.location || 'Sem local'} - ${format(new Date(), 'dd/MM HH:mm')}`
        },
        ...existingDrafts.slice(0, 4)
      ];

      localStorage.setItem('cleaning_form_drafts', JSON.stringify(updatedDrafts));
      localStorage.setItem(draftKey, JSON.stringify(formData));

      setAutoSaveStatus('saved');

      // Reset status after 3 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
    }
  };

  const loadDraft = (draftKey: string) => {
    try {
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        setFormData(JSON.parse(draftData));
        setFormErrors({});
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const getDrafts = () => {
    try {
      return JSON.parse(localStorage.getItem('cleaning_form_drafts') || '[]');
    } catch (error) {
      return [];
    }
  };

  const loadData = async () => {
    try {
      // Load from management modules first
      const savedAircraft = localStorage.getItem('aviation_aircraft');
      const savedEmployees = localStorage.getItem('aviation_employees');

      if (savedAircraft) {
        const aircraftData = JSON.parse(savedAircraft);
        // Filter only active aircraft for selection
        const activeAircraft = aircraftData.filter((ac: any) => ac.status === 'active');
        setAircraft(activeAircraft);
      } else {
        // Fallback to Supabase
        const aircraftResult = await db.getAircraft();
        if (aircraftResult.data) setAircraft(aircraftResult.data);
      }

      if (savedEmployees) {
        const employeesData = JSON.parse(savedEmployees);
        // Filter only active employees for selection
        const activeEmployees = employeesData.filter((emp: any) => emp.status === 'active');
        setEmployees(activeEmployees);
      } else {
        // Fallback to Supabase
        const employeesResult = await db.getEmployees();
        if (employeesResult.data) setEmployees(employeesResult.data);
      }

      // Load forms using secure sync service if available, fallback to localStorage
      try {
        if (isSecureMode) {
          const secureForms = await secureSyncService.getAllForms();
          setForms(secureForms);
          console.log('Loaded forms from secure storage:', secureForms.length);
        } else {
          // Fallback to localStorage
          const savedForms = localStorage.getItem('cleaningForms');
          if (savedForms) {
            const parsedForms = JSON.parse(savedForms);
            // Ensure all forms have proper changeHistory array
            const normalizedForms = parsedForms.map((form: any) => ({
              ...form,
              changeHistory: form.changeHistory || []
            }));
            setForms(normalizedForms);
          }
        }
      } catch (error) {
        console.warn('Failed to load from secure storage, falling back to localStorage:', error);
        // Fallback to localStorage
        const savedForms = localStorage.getItem('cleaningForms');
        if (savedForms) {
          const parsedForms = JSON.parse(savedForms);
          const normalizedForms = parsedForms.map((form: any) => ({
            ...form,
            changeHistory: form.changeHistory || []
          }));
          setForms(normalizedForms);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateFormCode = (date: string, shift: string, location: string) => {
    // Use the new secure ID format: AP-PS-SNR01-DDMMAAHHMMSS
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Generate unique serial number based on location and shift
    const locationCode = location.replace(/\s+/g, '').substring(0, 2).toUpperCase();
    const shiftCode = shift === 'morning' ? '01' : shift === 'afternoon' ? '02' : '03';
    const serialNumber = `${locationCode}${shiftCode}`;

    const timestamp = `${day}${month}${year}${hours}${minutes}${seconds}`;

    return `AP-PS-SNR${serialNumber}-${timestamp}`;
  };

  const generateQRCode = async (formCode: string) => {
    try {
      let finalUrl: string;

      if (isSecureMode) {
        // Generate secure QR data with authentication token
        finalUrl = await generateSecureQRData(formCode);
      } else {
        // Fallback to regular URL
        const supabaseStorageUrl = `${window.location.origin}/storage/v1/object/public/cleaning-forms/${formCode}`;
        finalUrl = import.meta.env.VITE_SUPABASE_URL ? supabaseStorageUrl : `${window.location.origin}/cleaning-forms/${formCode}`;
      }

      const qrCodeDataURL = await QRCode.toDataURL(finalUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a', // Darker for better security indication
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H' // Higher error correction for security
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

    // Employee validation - simplified since data comes from system
    formData.employees.forEach((employee, index) => {
      if (!employee.name.trim()) {
        errors[`employee_${index}_name`] = 'Funcionário inválido - reselecione do sistema';
      }

      if (!employee.id) {
        errors[`employee_${index}_id`] = 'Funcionário deve ser selecionado do sistema';
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
      if (editingForm) {
        // Track changes for version history
        const changes: string[] = [];
        if (editingForm.date !== formData.date) changes.push(`Data alterada de ${editingForm.date} para ${formData.date}`);
        if (editingForm.shift !== formData.shift) changes.push(`Turno alterado de ${editingForm.shift} para ${formData.shift}`);
        if (editingForm.location !== formData.location) changes.push(`Local alterado de ${editingForm.location} para ${formData.location}`);
        if (JSON.stringify(editingForm.interventionTypes) !== JSON.stringify(formData.interventionTypes)) {
          changes.push(`Tipos de intervenção alterados`);
        }
        if (editingForm.employees.length !== formData.employees.length) {
          changes.push(`Funcionários alterados (${editingForm.employees.length} → ${formData.employees.length})`);
        }

        // Update existing form
        const updatedForm: CleaningForm = {
          ...editingForm,
          date: formData.date,
          shift: formData.shift,
          location: formData.location,
          interventionTypes: formData.interventionTypes,
          aircraftId: formData.aircraftId,
          employees: formData.employees,
          supervisorSignature: formData.supervisorSignature,
          clientSignature: formData.clientSignature,
          clientConfirmedWithoutSignature: formData.clientConfirmedWithoutSignature,
          status: formData.supervisorSignature && (formData.clientSignature || formData.clientConfirmedWithoutSignature) ? 'completed' : 'draft',
          updatedAt: new Date().toISOString(),
          version: editingForm.version + 1,
          changeHistory: [
            ...(editingForm.changeHistory || []),
            {
              version: editingForm.version + 1,
              timestamp: new Date().toISOString(),
              changes,
              author: user.email || 'Usuário',
              previousData: {
                date: editingForm.date,
                shift: editingForm.shift,
                location: editingForm.location,
                interventionTypes: editingForm.interventionTypes,
                employees: editingForm.employees
              }
            }
          ],
          syncStatus: 'pending'
        };

        // Regenerate PDF and QR code if needed
        const aircraftData = aircraft.find((ac: any) => ac.id === formData.aircraftId);
        const pdfStorageUrl = await generateAndUploadPDF(updatedForm, aircraftData);

        const qrCodeUrl = pdfStorageUrl || `${window.location.origin}/cleaning-forms/${updatedForm.code}`;
        const qrCode = await QRCode.toDataURL(qrCodeUrl, {
          width: 250,
          margin: 2,
          color: {
            dark: '#1e293b',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        });

        updatedForm.qrCode = qrCode;

        const updatedForms = forms.map(form =>
          form.id === editingForm.id ? updatedForm : form
        );
        setForms(updatedForms);
        localStorage.setItem('cleaningForms', JSON.stringify(updatedForms));

        // Force re-render by updating the forms state
        setForms([...updatedForms]);

        toast({
          title: "Folha atualizada",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        // Create new form with secure ID
        const formCode = isSecureMode ? generateSecureFormId() : generateFormCode(formData.date, formData.shift, formData.location);
        const formId = isSecureMode ? formCode : crypto.randomUUID();

        const now = new Date().toISOString();
        const newForm: CleaningForm = {
          id: formId,
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
          qrCode: '',
          status: formData.supervisorSignature && (formData.clientSignature || formData.clientConfirmedWithoutSignature) ? 'completed' : 'draft',
          createdAt: now,
          updatedAt: now,
          version: 1,
          changeHistory: [{
            version: 1,
            timestamp: now,
            changes: ['Folha criada com sistema seguro'],
            author: user.email || 'Usuário'
          }],
          syncStatus: 'pending'
        };

        // Generate and upload PDF
        const aircraftData = aircraft.find((ac: any) => ac.id === formData.aircraftId);
        const pdfStorageUrl = await generateAndUploadPDF(newForm, aircraftData);

        const qrCodeUrl = pdfStorageUrl || `${window.location.origin}/cleaning-forms/${formCode}`;
        const qrCode = await QRCode.toDataURL(qrCodeUrl, {
          width: 250,
          margin: 2,
          color: {
            dark: '#1e293b',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        });

        newForm.qrCode = qrCode;

        // Save using secure system or fallback to localStorage
        if (isSecureMode) {
          try {
            await secureSyncService.saveFormSecurely(newForm);
            const updatedForms = await secureSyncService.getAllForms();
            setForms(updatedForms);
            await updateSyncStatus();

            toast({
              title: "Folha criada com segurança",
              description: `Nova folha criada e criptografada. ID: ${formCode}`,
            });
          } catch (error) {
            console.error('Secure save failed, falling back to localStorage:', error);
            // Fallback to localStorage
            const updatedForms = [...forms, newForm];
            setForms(updatedForms);
            localStorage.setItem('cleaningForms', JSON.stringify(updatedForms));

            toast({
              title: "Folha criada (modo local)",
              description: "Salva localmente. Sincronização pendente.",
              variant: "default"
            });
          }
        } else {
          // Regular localStorage save
          try {
            await supabaseStorage.saveFormMetadata(newForm);
          } catch (error) {
            console.log('Supabase metadata save skipped:', error);
          }

          const updatedForms = [...forms, newForm];
          setForms(updatedForms);
          localStorage.setItem('cleaningForms', JSON.stringify(updatedForms));

          toast({
            title: "Folha criada",
            description: "Nova folha de limpeza criada com sucesso.",
          });
        }
      }

      setIsCreateDialogOpen(false);
      setEditingForm(null);
      resetForm();
      setFormErrors({});
    } catch (error) {
      console.error('Error creating/updating form:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a folha.",
        variant: "destructive"
      });
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
    setEditingForm(null);
  };

  // Remove manual employee addition - only allow selection from database

  const addEmployeeFromDatabase = (employeeFromDb: any) => {
    // Get default working hours based on shift
    const getShiftTimes = (shift: string) => {
      switch (shift) {
        case 'morning': return { start: '06:00', end: '14:00' };
        case 'afternoon': return { start: '14:00', end: '22:00' };
        case 'night': return { start: '22:00', end: '06:00' };
        default: return { start: '08:00', end: '17:00' };
      }
    };

    const shiftTimes = getShiftTimes(formData.shift);

    const newEmployee = {
      id: employeeFromDb.id, // Use the actual employee ID from database
      name: employeeFromDb.name || '',
      task: employeeFromDb.role || '', // Use role as default task
      startTime: shiftTimes.start,
      endTime: shiftTimes.end,
      phone: employeeFromDb.phone || '',
      idNumber: employeeFromDb.idNumber || '',
      photo: employeeFromDb.photo || ''
    };

    setFormData(prev => ({
      ...prev,
      employees: [...prev.employees, newEmployee]
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

  const handleEditForm = (form: CleaningForm) => {
    // Only allow editing of draft forms
    if (form.status !== 'draft') {
      toast({
        title: "Edição não permitida",
        description: "Apenas folhas em rascunho podem ser editadas.",
        variant: "destructive"
      });
      return;
    }

    // Load form data into the form
    setFormData({
      date: form.date || format(new Date(), 'yyyy-MM-dd'),
      shift: form.shift || 'morning',
      location: form.location || '',
      interventionTypes: form.interventionTypes || [],
      aircraftId: form.aircraftId || '',
      employees: (form.employees || []).map(emp => ({
        id: emp.id || crypto.randomUUID(),
        name: emp.name || '',
        task: emp.task || '',
        startTime: emp.startTime || '',
        endTime: emp.endTime || '',
        phone: emp.phone || '',
        idNumber: emp.idNumber || '',
        photo: emp.photo || ''
      })),
      supervisorSignature: form.supervisorSignature || '',
      clientSignature: form.clientSignature || '',
      clientConfirmedWithoutSignature: form.clientConfirmedWithoutSignature || false
    });

    // Set editing mode
    setEditingForm(form);
    setIsCreateDialogOpen(true);
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || form.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/70" />
              <Input
                placeholder="Buscar por código ou local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="aviation-input pl-10 w-full"
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-aviation-gray-800 border-white/20 mx-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-white">
                      {editingForm ? 'Editar Folha de Limpeza' : 'Nova Folha de Limpeza'}
                    </DialogTitle>
                    <DialogDescription className="text-white/70">
                      {editingForm
                        ? `Editando folha ${editingForm.code} - Status: ${editingForm.status === 'draft' ? 'Rascunho' : 'Finalizada'}`
                        : 'Preencha os dados para criar uma nova folha de requisição de limpeza'
                      }
                    </DialogDescription>
                  </div>

                  {/* Auto-save status */}
                  <div className="flex items-center space-x-2">
                    {autoSaveStatus === 'saving' && (
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-400"></div>
                        <span className="text-xs">Salvando...</span>
                      </div>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <div className="flex items-center space-x-1 text-green-400">
                        <CheckSquare className="h-3 w-3" />
                        <span className="text-xs">Salvo</span>
                      </div>
                    )}
                    {autoSaveStatus === 'error' && (
                      <div className="flex items-center space-x-1 text-red-400">
                        <X className="h-3 w-3" />
                        <span className="text-xs">Erro ao salvar</span>
                      </div>
                    )}
                  </div>
                </div>
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
                          <SelectValue placeholder="Selecione a aeronave cadastrada" />
                        </SelectTrigger>
                        <SelectContent className="bg-aviation-gray-800 border-white/20 max-h-60">
                          {aircraft.length === 0 && (
                            <div className="px-4 py-3 text-white/70 text-sm">
                              Nenhuma aeronave cadastrada no sistema.
                              <br />
                              <Link to="/aircraft-manager" className="text-aviation-blue-300 underline">
                                Cadastrar aeronave
                              </Link>
                            </div>
                          )}
                          {aircraft.map((ac: any) => (
                            <SelectItem key={ac.id} value={ac.id} className="text-white hover:bg-white/10">
                              <div className="flex flex-col py-1">
                                <div className="font-semibold">{ac.registration}</div>
                                <div className="text-sm opacity-80">{ac.model} - {ac.manufacturer}</div>
                                <div className="text-xs opacity-60">
                                  {ac.location ? `📍 ${ac.location}` : ''}
                                  {ac.status && ` • Status: ${ac.status === 'active' ? 'Ativa' : ac.status === 'maintenance' ? 'Manutenção' : 'Inativa'}`}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.aircraftId && <p className="text-red-400 text-sm">{formErrors.aircraftId}</p>}
                      {aircraft.length > 0 && (
                        <p className="text-white/60 text-xs">
                          {aircraft.length} aeronave{aircraft.length !== 1 ? 's' : ''} ativa{aircraft.length !== 1 ? 's' : ''} disponível{aircraft.length !== 1 ? 'eis' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Intervention Types */}
                  <div className="space-y-2">
                    <Label className="text-white">Tipos de Intervenção *</Label>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-lg border ${formErrors.interventionTypes ? 'border-red-500' : 'border-white/30'}`}>
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg font-semibold text-white">Funcionários do Turno</h3>
                    <p className="text-white/70 text-sm">Selecione funcionários cadastrados no sistema</p>
                  </div>

                  {/* Employee Selection from Database */}
                  {employees.length > 0 && (
                    <Card className="glass-card border-white/20 p-6">
                      <h4 className="text-white font-medium mb-4">Funcionários Disponíveis</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {employees
                          .filter(emp => !formData.employees.some(formEmp => formEmp.id === emp.id))
                          .map(employee => (
                          <Button
                            key={employee.id}
                            variant="outline"
                            onClick={() => addEmployeeFromDatabase(employee)}
                            className="border-white/30 text-white hover:bg-white/20 h-20 p-3 flex flex-col items-center justify-center space-y-2"
                          >
                            {employee.photo ? (
                              <img src={employee.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-aviation-blue-600 flex items-center justify-center text-xs font-bold">
                                {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                            )}
                            <div className="text-center">
                              <div className="font-medium text-xs">{employee.name}</div>
                              <div className="text-xs opacity-70">{employee.role}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                      {employees.filter(emp => !formData.employees.some(formEmp => formEmp.id === emp.id)).length === 0 && (
                        <p className="text-white/60 text-center py-4">
                          Todos os funcionários disponíveis já foram adicionados
                        </p>
                      )}
                    </Card>
                  )}

                  {/* Selected Employees Display */}
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Funcionários Selecionados ({formData.employees.length})</h4>

                    {formData.employees.map((employee, index) => (
                      <Card key={employee.id} className="glass-card border-white/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {employee.photo ? (
                                <img src={employee.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-aviation-blue-600 flex items-center justify-center text-white font-bold">
                                  {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </div>
                              )}

                              <div className="flex-1">
                                <h5 className="text-white font-medium">{employee.name}</h5>
                                <p className="text-white/70 text-sm">{employee.task}</p>
                                <div className="flex items-center space-x-4 text-white/60 text-xs mt-1">
                                  <span>📞 {employee.phone}</span>
                                  <span>🆔 {employee.idNumber}</span>
                                  <span>⏰ {employee.startTime} - {employee.endTime}</span>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeEmployee(index)}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {formData.employees.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/70 mb-2">Nenhum funcionário selecionado</p>
                        <p className="text-white/50 text-sm">Selecione funcionários da lista acima</p>
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
                    editingForm ? 'Atualizar Folha de Limpeza' : 'Criar Folha de Limpeza'
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

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-4">
                  <div className="flex gap-2 w-full sm:w-auto">
                    {form.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditForm(form)}
                        className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 flex-1 sm:flex-none"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQRDialog(form)}
                      className="border-white/30 text-white hover:bg-white/20 flex-1 sm:w-auto"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </Button>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewPDF(form)}
                      className="border-white/30 text-white hover:bg-white/20 flex-1 sm:flex-none"
                    >
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(form)}
                      className="border-white/30 text-white hover:bg-white/20 flex-1 sm:flex-none"
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
                  Link para acesso:
                </p>
                <p className="text-aviation-blue-300 text-xs break-all mb-4">
                  {`${window.location.origin}/cleaning-forms/${showQRDialog.code}`}
                </p>

                {import.meta.env.VITE_SUPABASE_URL && (
                  <>
                    <p className="text-white/80 text-sm mb-2">
                      Link do PDF (Supabase Storage):
                    </p>
                    <p className="text-aviation-blue-300 text-xs break-all">
                      {`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/cleaning-forms/${showQRDialog.code}.pdf`}
                    </p>
                  </>
                )}
              </div>

              <div className="flex flex-col space-y-2 w-full">
                <div className="flex space-x-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const formUrl = `${window.location.origin}/cleaning-forms/${showQRDialog.code}`;
                      navigator.clipboard.writeText(formUrl);
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

                {import.meta.env.VITE_SUPABASE_URL && (
                  <Button
                    onClick={() => {
                      const pdfUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/cleaning-forms/${showQRDialog.code}.pdf`;
                      window.open(pdfUrl, '_blank');
                    }}
                    className="w-full aviation-button"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Abrir PDF do Storage
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
