import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CleaningFormData {
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
  status: string;
  createdAt: string;
}

export const generateCleaningFormPDF = async (formData: CleaningFormData, aircraftData?: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize: number = 10) => {
    pdf.setFontSize(fontSize);
    if (maxWidth) {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * (fontSize * 0.5));
    } else {
      pdf.text(text, x, y);
      return y + (fontSize * 0.5);
    }
  };

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FOLHA DE REQUISIÇÃO DE LIMPEZA', margin, yPosition);
  yPosition += 15;

  // Form code and date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Código: ${formData.code}`, margin, yPosition);
  pdf.text(`Data: ${format(new Date(formData.date), 'dd/MM/yyyy', { locale: ptBR })}`, pageWidth - margin - 50, yPosition);
  yPosition += 10;

  const shiftText = formData.shift === 'morning' ? 'Manhã (06:00-14:00)' : 
                   formData.shift === 'afternoon' ? 'Tarde (14:00-22:00)' : 'Noite (22:00-06:00)';
  pdf.text(`Turno: ${shiftText}`, margin, yPosition);
  yPosition += 15;

  // Basic Information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMAÇÕES BÁSICAS', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  yPosition = addText(`Local da Intervenção: ${formData.location}`, margin, yPosition, contentWidth);
  yPosition += 5;

  if (aircraftData) {
    yPosition = addText(`Aeronave: ${aircraftData.registration} - ${aircraftData.model}`, margin, yPosition, contentWidth);
    yPosition += 5;
  }

  yPosition = addText(`Tipos de Intervenção: ${formData.interventionTypes.join(', ')}`, margin, yPosition, contentWidth);
  yPosition += 15;

  // Employees section
  if (formData.employees.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FUNCIONÁRIOS DO TURNO', margin, yPosition);
    yPosition += 10;

    // Table header
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const colWidths = [40, 40, 20, 20, 30, 30];
    const headers = ['Nome', 'Tarefa', 'Início', 'Fim', 'Telefone', 'ID'];
    let xPos = margin;
    
    headers.forEach((header, index) => {
      pdf.text(header, xPos, yPosition);
      xPos += colWidths[index];
    });
    yPosition += 8;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    formData.employees.forEach(employee => {
      xPos = margin;
      const values = [
        employee.name,
        employee.task,
        employee.startTime,
        employee.endTime,
        employee.phone,
        employee.idNumber
      ];

      values.forEach((value, index) => {
        const maxWidth = colWidths[index] - 2;
        pdf.text(pdf.splitTextToSize(value || '', maxWidth), xPos, yPosition);
        xPos += colWidths[index];
      });
      yPosition += 10;
    });
    yPosition += 10;
  }

  // QR Code
  if (formData.qrCode) {
    try {
      const qrSize = 30;
      pdf.addImage(formData.qrCode, 'PNG', pageWidth - margin - qrSize, yPosition, qrSize, qrSize);
      pdf.setFontSize(8);
      pdf.text('Escaneie para visualizar online', pageWidth - margin - qrSize, yPosition + qrSize + 5);
    } catch (error) {
      console.error('Error adding QR code to PDF:', error);
    }
  }

  // Check if we need a new page for signatures
  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = margin;
  } else {
    yPosition += 20;
  }

  // Signatures section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ASSINATURAS', margin, yPosition);
  yPosition += 15;

  const signatureWidth = (contentWidth - 20) / 2;
  const signatureHeight = 30;

  // Supervisor signature
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Supervisor:', margin, yPosition);
  
  if (formData.supervisorSignature) {
    try {
      pdf.addImage(formData.supervisorSignature, 'PNG', margin, yPosition + 5, signatureWidth, signatureHeight);
    } catch (error) {
      console.error('Error adding supervisor signature:', error);
    }
  }
  
  pdf.rect(margin, yPosition + 5, signatureWidth, signatureHeight);
  pdf.text('Data: ___/___/___', margin, yPosition + signatureHeight + 15);

  // Client signature
  const clientX = margin + signatureWidth + 20;
  pdf.text('Cliente:', clientX, yPosition);
  
  if (formData.clientConfirmedWithoutSignature) {
    pdf.text('Confirmado sem assinatura', clientX, yPosition + 20);
  } else if (formData.clientSignature) {
    try {
      pdf.addImage(formData.clientSignature, 'PNG', clientX, yPosition + 5, signatureWidth, signatureHeight);
    } catch (error) {
      console.error('Error adding client signature:', error);
    }
  }
  
  pdf.rect(clientX, yPosition + 5, signatureWidth, signatureHeight);
  pdf.text('Data: ___/___/___', clientX, yPosition + signatureHeight + 15);

  // Footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Este documento foi gerado automaticamente pelo sistema AviationOps', margin, pageHeight - 10);
  pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth - margin - 60, pageHeight - 10);

  return pdf;
};

export const downloadCleaningFormPDF = async (formData: CleaningFormData, aircraftData?: any) => {
  const pdf = await generateCleaningFormPDF(formData, aircraftData);
  pdf.save(`folha-limpeza-${formData.code}.pdf`);
};

export const previewCleaningFormPDF = async (formData: CleaningFormData, aircraftData?: any) => {
  const pdf = await generateCleaningFormPDF(formData, aircraftData);
  const pdfDataUri = pdf.output('datauristring');
  window.open(pdfDataUri, '_blank');
};
