import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CleaningFormData {
  id: string;
  code: string;
  date: string;
  shift: "morning" | "afternoon" | "night";
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
  notes?: string;
  supervisorSignature?: string;
  clientSignature?: string;
  clientConfirmed: boolean;
  qrCodeData: string;
  status: string;
  createdAt: string;
  interventionPhotos?: {
    before: {
      exterior?: any[];
      interior?: any[];
      details?: any[];
    };
    after: {
      exterior?: any[];
      interior?: any[];
      details?: any[];
    };
  };
}

export const generateCleaningFormPDF = async (
  formData: CleaningFormData,
  aircraftData?: any,
) => {
  // Load logo settings from localStorage
  const logoSettings = JSON.parse(localStorage.getItem("logoSettings") || "{}");
  
  // Use AirPlus PDF Service with logo settings
  const { AirPlusPDFService } = await import('./airplus-pdf-service');
  const pdfService = new AirPlusPDFService();
  
  // Transform data format if needed
  const transformedFormData = {
    id: formData.id,
    codigo: formData.code,
    data: formData.date,
    turno: formData.shift === 'morning' ? 'manha' as const : 
           formData.shift === 'afternoon' ? 'tarde' as const : 'noite' as const,
    local: formData.location,
    tipos_intervencao: formData.interventionTypes,
    aeronave_id: formData.aircraftId,
    funcionarios: formData.employees.map(emp => ({
      id: emp.id,
      nome: emp.name,
      tarefa: emp.task,
      hora_inicio: emp.startTime,
      hora_fim: emp.endTime,
      telefone: emp.phone,
      numero_bilhete: emp.idNumber,
      foto: emp.photo,
    })),
    observacoes: formData.notes,
    assinatura_supervisor: formData.supervisorSignature,
    assinatura_cliente: formData.clientSignature,
    cliente_confirmou: formData.clientConfirmed,
    qr_code_data: formData.qrCodeData,
    status: formData.status,
    created_at: formData.createdAt,
  };

  const transformedAircraftData = aircraftData ? {
    matricula: aircraftData.registration,
    modelo: aircraftData.model,
    fabricante: aircraftData.manufacturer,
    proprietario: aircraftData.owner,
  } : undefined;

  return await pdfService.generateCleaningFormPDF(
    transformedFormData, 
    transformedAircraftData,
    logoSettings
  );
};

export const downloadCleaningFormPDF = async (
  formData: CleaningFormData,
  aircraftData?: any,
) => {
  const pdf = await generateCleaningFormPDF(formData, aircraftData);

  // Try to upload to Supabase Storage if configured
  try {
    const { supabaseStorage, dataURLToBlob } = await import(
      "./supabase-storage"
    );
    const pdfBlob = pdf.output("blob");
    const uploadedUrl = await supabaseStorage.uploadCleaningFormPDF(
      formData.code,
      pdfBlob,
    );

    if (uploadedUrl) {
      console.log("PDF uploaded to Supabase Storage:", uploadedUrl);
    }
  } catch (error) {
    console.warn("Could not upload to Supabase Storage:", error);
  }

  // Download the PDF
  const fileName = `Folha_Limpeza_${formData.code}.pdf`;
  pdf.save(fileName);
};

export const generateCleaningFormPDFDataURL = async (
  formData: CleaningFormData,
  aircraftData?: any,
) => {
  const pdf = await generateCleaningFormPDF(formData, aircraftData);
  const pdfDataUri = pdf.output("datauristring");
  return pdfDataUri;
};

export const generateCleaningFormPDFToSupabase = async (
  formData: CleaningFormData,
  aircraftData?: any,
) => {
  try {
    const pdf = await generateCleaningFormPDF(formData, aircraftData);
    const pdfBlob = pdf.output("blob");

    const { supabaseStorage } = await import("./supabase-storage");
    const uploadedUrl = await supabaseStorage.uploadCleaningFormPDF(
      formData.code,
      pdfBlob,
    );

    return uploadedUrl;
  } catch (error) {
    console.error("Error generating and uploading PDF:", error);
    return null;
  }
};

export const generateCleaningFormPDFBlob = async (
  formData: CleaningFormData,
  aircraftData?: any,
): Promise<Blob> => {
  const pdf = await generateCleaningFormPDF(formData, aircraftData);
  return pdf.output("blob");
};
