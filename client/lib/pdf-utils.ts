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
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  const primaryColor = [30, 64, 175]; // Aviation blue
  const secondaryColor = [71, 85, 105]; // Aviation gray

  let yPosition = margin;

  // Helper functions
  const addHeaderBox = (title: string, y: number) => {
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, y, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin + 3, y + 5.5);
    pdf.setTextColor(0, 0, 0);
    return y + 8;
  };

  const addInfoRow = (label: string, value: string, y: number, isEven: boolean = false) => {
    if (isEven) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y - 1, contentWidth, 6, 'F');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(label + ':', margin + 2, y + 3);

    pdf.setFont('helvetica', 'normal');
    const labelWidth = pdf.getTextWidth(label + ': ') + 5;
    pdf.text(value, margin + 2 + labelWidth, y + 3);

    return y + 6;
  };

  const addSeparator = (y: number) => {
    pdf.setDrawColor(...secondaryColor);
    pdf.line(margin, y, pageWidth - margin, y);
    return y + 3;
  };

  // HEADER SECTION
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  // Company logo placeholder
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, 5, 15, 15, 'F');
  pdf.setTextColor(...primaryColor);
  pdf.setFontSize(8);
  pdf.text('LOGO', margin + 5, 13);

  // Main title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AVIATIONOPS', margin + 20, 13);

  pdf.setFontSize(12);
  pdf.text('FOLHA DE REQUISIÇÃO DE LIMPEZA', margin + 20, 18);

  // Form code (top right)
  pdf.setFontSize(10);
  pdf.text(`Código: ${formData.code}`, pageWidth - margin - 50, 13);
  pdf.text(`Página 1 de 1`, pageWidth - margin - 50, 18);

  yPosition = 30;

  // BASIC INFORMATION SECTION
  yPosition = addHeaderBox('INFORMAÇÕES BÁSICAS', yPosition);
  yPosition += 2;

  const formattedDate = format(new Date(formData.date), 'dd/MM/yyyy', { locale: ptBR });
  const shiftText = formData.shift === 'morning' ? 'Manhã (06:00-14:00)' :
                   formData.shift === 'afternoon' ? 'Tarde (14:00-22:00)' : 'Noite (22:00-06:00)';

  yPosition = addInfoRow('Data da Intervenção', formattedDate, yPosition, false);
  yPosition = addInfoRow('Turno', shiftText, yPosition, true);
  yPosition = addInfoRow('Local da Intervenção', formData.location, yPosition, false);

  if (aircraftData) {
    yPosition = addInfoRow('Aeronave', `${aircraftData.registration} - ${aircraftData.model} (${aircraftData.manufacturer})`, yPosition, true);
  }

  yPosition = addInfoRow('Status da Folha', formData.status === 'completed' ? 'Concluída' : 'Em Andamento', yPosition, false);
  yPosition += 5;

  // INTERVENTION TYPES SECTION
  yPosition = addHeaderBox('TIPOS DE INTERVENÇÃO', yPosition);
  yPosition += 2;

  if (formData.interventionTypes.length > 0) {
    const types = formData.interventionTypes;
    const itemsPerRow = 2;
    const colWidth = contentWidth / itemsPerRow;

    for (let i = 0; i < types.length; i += itemsPerRow) {
      for (let j = 0; j < itemsPerRow && i + j < types.length; j++) {
        const xPos = margin + 2 + (j * colWidth);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text('• ' + types[i + j], xPos, yPosition + 3);
      }
      yPosition += 6;
    }
  } else {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text('Nenhum tipo de intervenção especificado', margin + 2, yPosition + 3);
    yPosition += 6;
  }
  yPosition += 3;

  // EMPLOYEES SECTION
  if (formData.employees.length > 0) {
    yPosition = addHeaderBox('FUNCIONÁRIOS DO TURNO', yPosition);
    yPosition += 2;

    // Table headers
    pdf.setFillColor(...secondaryColor);
    pdf.rect(margin, yPosition, contentWidth, 7, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);

    const colWidths = [45, 35, 18, 18, 28, 26];
    const headers = ['Nome Completo', 'Tarefa Designada', 'Início', 'Término', 'Telefone', 'Documento'];
    let xPos = margin + 1;

    headers.forEach((header, index) => {
      pdf.text(header, xPos, yPosition + 4.5);
      xPos += colWidths[index];
    });

    yPosition += 7;
    pdf.setTextColor(0, 0, 0);

    // Table rows
    formData.employees.forEach((employee, index) => {
      const isEven = index % 2 === 0;
      if (isEven) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      const values = [
        employee.name || 'Não informado',
        employee.task || 'Não especificada',
        employee.startTime || '--:--',
        employee.endTime || '--:--',
        employee.phone || 'Não informado',
        employee.idNumber || 'Não informado'
      ];

      xPos = margin + 1;
      values.forEach((value, colIndex) => {
        const maxWidth = colWidths[colIndex] - 2;
        const lines = pdf.splitTextToSize(value, maxWidth);
        pdf.text(lines, xPos, yPosition + 4);
        xPos += colWidths[colIndex];
      });

      yPosition += 8;
    });

    yPosition += 5;
  }

  // QR CODE AND TRACKING
  if (formData.qrCode) {
    const qrSize = 25;
    const qrX = pageWidth - margin - qrSize;
    const qrY = yPosition;

    try {
      pdf.addImage(formData.qrCode, 'PNG', qrX, qrY, qrSize, qrSize);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Escaneie para', qrX - 2, qrY + qrSize + 4);
      pdf.text('acessar online', qrX - 2, qrY + qrSize + 8);

      // Form details on the left
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, margin, qrY + 5);
      pdf.text(`Código de rastreamento: ${formData.code}`, margin, qrY + 10);

    } catch (error) {
      console.error('Error adding QR code to PDF:', error);
    }

    yPosition += Math.max(qrSize + 15, 20);
  }

  // Check if we need a new page for signatures
  const spaceNeeded = 80;
  if (yPosition + spaceNeeded > pageHeight - 25) {
    pdf.addPage();
    yPosition = margin;
  }

  // SIGNATURES SECTION
  yPosition = addHeaderBox('ASSINATURAS E APROVAÇÕES', yPosition);
  yPosition += 5;

  const signatureWidth = (contentWidth - 10) / 2;
  const signatureHeight = 25;

  // Supervisor signature
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('SUPERVISOR RESPONSÁVEL', margin, yPosition);

  pdf.setDrawColor(150, 150, 150);
  pdf.rect(margin, yPosition + 3, signatureWidth, signatureHeight);

  if (formData.supervisorSignature) {
    try {
      pdf.addImage(formData.supervisorSignature, 'PNG', margin + 2, yPosition + 4, signatureWidth - 4, signatureHeight - 2);
    } catch (error) {
      console.error('Error adding supervisor signature:', error);
    }
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Nome: _________________________________', margin, yPosition + signatureHeight + 8);
  pdf.text('Data: ____/____/_______ Hora: ____:____', margin, yPosition + signatureHeight + 13);

  // Client signature
  const clientX = margin + signatureWidth + 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('CLIENTE/SOLICITANTE', clientX, yPosition);

  pdf.rect(clientX, yPosition + 3, signatureWidth, signatureHeight);

  if (formData.clientConfirmedWithoutSignature) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text('CONFIRMADO SEM ASSINATURA', clientX + 5, yPosition + 15);
    pdf.text('CONFORME AUTORIZAÇÃO', clientX + 5, yPosition + 19);
  } else if (formData.clientSignature) {
    try {
      pdf.addImage(formData.clientSignature, 'PNG', clientX + 2, yPosition + 4, signatureWidth - 4, signatureHeight - 2);
    } catch (error) {
      console.error('Error adding client signature:', error);
    }
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Nome: _________________________________', clientX, yPosition + signatureHeight + 8);
  pdf.text('Data: ____/____/_______ Hora: ____:____', clientX, yPosition + signatureHeight + 13);

  yPosition += signatureHeight + 20;

  // FOOTER
  const footerY = pageHeight - 15;
  pdf.setDrawColor(...secondaryColor);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  pdf.setFillColor(...primaryColor);
  pdf.rect(0, footerY - 3, pageWidth, 18, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('AviationOps - Sistema de Gestão Aeronáutica', margin, footerY + 2);
  pdf.text('Documento gerado automaticamente - Validade sujeita à verificação digital', margin, footerY + 6);
  pdf.text(`URL de verificação: ${window.location.origin}/cleaning-forms/${formData.code}`, margin, footerY + 10);

  const currentDateTime = format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
  pdf.text(`Impresso em: ${currentDateTime}`, pageWidth - margin - 50, footerY + 6);

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
