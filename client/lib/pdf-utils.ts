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
  interventionPhotos?: {
    before: {
      exterior?: string[];
      interior?: string[];
      details?: string[];
    };
    after: {
      exterior?: string[];
      interior?: string[];
      details?: string[];
    };
  };
  supervisorSignature?: string;
  clientSignature?: string;
  clientConfirmedWithoutSignature: boolean;
  qrCode: string;
  status: string;
  createdAt: string;
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
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const primaryColor = [0, 176, 234]; // Aviation blue #00b0ea
  const gradientColor = [0, 157, 223]; // Aviation blue #009ddf
  const accentColor = [0, 136, 199]; // Aviation blue #0088c7

  let yPosition = margin;
  const hasEmployeePhotos = formData.employees.some((emp) => emp.photo);
  const hasInterventionPhotos =
    formData.interventionPhotos &&
    (formData.interventionPhotos.before.exterior?.length || 0) +
      (formData.interventionPhotos.before.interior?.length || 0) +
      (formData.interventionPhotos.before.details?.length || 0) +
      (formData.interventionPhotos.after.exterior?.length || 0) +
      (formData.interventionPhotos.after.interior?.length || 0) +
      (formData.interventionPhotos.after.details?.length || 0) >
      0;
  const totalPages =
    hasEmployeePhotos && hasInterventionPhotos
      ? 3
      : hasEmployeePhotos || hasInterventionPhotos
        ? 2
        : 1;

  // Helper functions
  const addModernHeader = () => {
    // Modern gradient header
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 35, "F");

    // Light gradient overlay
    pdf.setFillColor(255, 255, 255, 0.1);
    pdf.rect(0, 0, pageWidth, 35, "F");

    // Company branding section
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(margin, 8, 25, 20, 3, 3, "F");

    // Logo placeholder with modern styling
    pdf.setFillColor(...primaryColor);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("AO", margin + 8, 20);

    // Main title with modern typography
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("AVIATIONOPS", margin + 35, 16);

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("FOLHA DE REQUISIÇÃO DE LIMPEZA", margin + 35, 23);

    // Modern info box on the right
    const infoBoxWidth = 60;
    pdf.setFillColor(255, 255, 255, 0.2);
    pdf.roundedRect(
      pageWidth - margin - infoBoxWidth,
      8,
      infoBoxWidth,
      20,
      2,
      2,
      "F",
    );

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("CÓDIGO:", pageWidth - margin - infoBoxWidth + 3, 15);
    pdf.setFont("helvetica", "normal");
    pdf.text(formData.code, pageWidth - margin - infoBoxWidth + 3, 19);

    pdf.setFont("helvetica", "bold");
    pdf.text("STATUS:", pageWidth - margin - infoBoxWidth + 3, 23);
    pdf.setFont("helvetica", "normal");
    const statusText =
      formData.status === "completed" ? "CONCLUÍDA" : "EM ANDAMENTO";
    pdf.text(statusText, pageWidth - margin - infoBoxWidth + 3, 27);

    return 40;
  };

  const addSectionHeader = (title: string, y: number, icon?: string) => {
    // Modern section header with subtle background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, contentWidth, 10, "F");

    // Left accent bar
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, y, 3, 10, "F");

    // Title
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, margin + 8, y + 7);

    // Subtle border
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y + 10, pageWidth - margin, y + 10);

    return y + 15;
  };

  const addInfoGrid = (
    data: Array<{ label: string; value: string }>,
    y: number,
  ) => {
    const colWidth = contentWidth / 2;
    let currentY = y;

    for (let i = 0; i < data.length; i += 2) {
      // Row background
      if (Math.floor(i / 2) % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, currentY - 2, contentWidth, 8, "F");
      }

      // Left column
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(data[i].label + ":", margin + 3, currentY + 3);

      pdf.setTextColor(15, 23, 42);
      pdf.setFont("helvetica", "normal");
      pdf.text(data[i].value, margin + 3, currentY + 6);

      // Right column (if exists)
      if (data[i + 1]) {
        pdf.setTextColor(71, 85, 105);
        pdf.setFont("helvetica", "bold");
        pdf.text(data[i + 1].label + ":", margin + colWidth + 3, currentY + 3);

        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "normal");
        pdf.text(data[i + 1].value, margin + colWidth + 3, currentY + 6);
      }

      currentY += 10;
    }

    return currentY + 5;
  };

  // PAGE 1 - MAIN FORM
  yPosition = addModernHeader();

  // Basic Information Section
  yPosition = addSectionHeader("INFORMAÇÕES BÁSICAS", yPosition);

  const formattedDate = format(new Date(formData.date), "dd/MM/yyyy", {
    locale: ptBR,
  });
  const shiftText =
    formData.shift === "morning"
      ? "Manhã (06:00-14:00)"
      : formData.shift === "afternoon"
        ? "Tarde (14:00-22:00)"
        : "Noite (22:00-06:00)";

  const basicInfo = [
    { label: "Data da Intervenção", value: formattedDate },
    { label: "Turno", value: shiftText },
    { label: "Local", value: formData.location },
    {
      label: "Aeronave",
      value: aircraftData
        ? `${aircraftData.registration} - ${aircraftData.model}`
        : "Não especificada",
    },
  ];

  yPosition = addInfoGrid(basicInfo, yPosition);

  // Intervention Types Section - Only show if types are selected
  if (formData.interventionTypes.length > 0) {
    yPosition = addSectionHeader("TIPOS DE INTERVENÇÃO REALIZADOS", yPosition);

    const itemsPerCol = Math.ceil(formData.interventionTypes.length / 2);
    const colWidth = contentWidth / 2;

    formData.interventionTypes.forEach((type, index) => {
      const col = Math.floor(index / itemsPerCol);
      const row = index % itemsPerCol;
      const xPos = margin + 5 + col * colWidth;
      const typeYPos = yPosition + row * 6;

      // Modern bullet point
      pdf.setFillColor(...primaryColor);
      pdf.circle(xPos, typeYPos + 2, 1, "F");

      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(type, xPos + 4, typeYPos + 3);
    });

    yPosition += itemsPerCol * 6 + 8;
  }

  // Employees Section - Only show if employees are selected
  if (formData.employees.length > 0) {
    yPosition = addSectionHeader("FUNCIONÁRIOS DESIGNADOS", yPosition);

    formData.employees.forEach((employee, index) => {
      const isEven = index % 2 === 0;
      const employeeHeight = employee.photo ? 35 : 25;

      // Employee card background
      pdf.setFillColor(
        isEven ? 255 : 249,
        isEven ? 255 : 250,
        isEven ? 255 : 251,
      );
      pdf.roundedRect(
        margin,
        yPosition,
        contentWidth,
        employeeHeight,
        2,
        2,
        "F",
      );

      // Employee photo
      if (employee.photo) {
        try {
          pdf.addImage(
            employee.photo,
            "JPEG",
            margin + 5,
            yPosition + 3,
            20,
            20,
          );
          // Photo border
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.5);
          pdf.rect(margin + 5, yPosition + 3, 20, 20);
        } catch (error) {
          // Photo placeholder
          pdf.setFillColor(229, 231, 235);
          pdf.rect(margin + 5, yPosition + 3, 20, 20, "F");
          pdf.setTextColor(107, 114, 128);
          pdf.setFontSize(8);
          pdf.text("FOTO", margin + 12, yPosition + 15);
        }
      }

      // Employee details
      const detailsX = employee.photo ? margin + 30 : margin + 5;

      // Name
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(employee.name || "Nome não informado", detailsX, yPosition + 8);

      // Task
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Tarefa: ${employee.task || "Não especificada"}`,
        detailsX,
        yPosition + 13,
      );

      // Contact info
      const contactInfo = `Tel: ${employee.phone || "N/A"} | ID: ${employee.idNumber || "N/A"}`;
      pdf.text(contactInfo, detailsX, yPosition + 17);

      // Time info
      const timeInfo = `Horário: ${employee.startTime || "--:--"} às ${employee.endTime || "--:--"}`;
      pdf.text(timeInfo, detailsX, yPosition + 21);

      yPosition += employeeHeight + 5;
    });
  }

  // QR Code and Document Info
  const qrSize = 30;
  const qrY = yPosition + 10;

  if (formData.qrCode) {
    try {
      // QR Code with modern styling
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(
        pageWidth - margin - qrSize - 4,
        qrY - 2,
        qrSize + 8,
        qrSize + 8,
        2,
        2,
        "F",
      );

      pdf.addImage(
        formData.qrCode,
        "PNG",
        pageWidth - margin - qrSize,
        qrY,
        qrSize,
        qrSize,
      );

      // QR Code info
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        "Escaneie para acessar",
        pageWidth - margin - qrSize - 2,
        qrY + qrSize + 10,
      );
      pdf.text(
        "a versão digital",
        pageWidth - margin - qrSize - 2,
        qrY + qrSize + 14,
      );
    } catch (error) {
      console.error("Error adding QR code to PDF:", error);
    }
  }

  // Document generation info with secure ID verification
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(8);
  pdf.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
    margin,
    qrY + 10,
  );
  pdf.text(`Código de rastreamento: ${formData.code}`, margin, qrY + 15);

  // Security verification for AP-PS-SNR format
  if (formData.code.startsWith("AP-PS-SNR")) {
    pdf.setFontSize(7);
    pdf.setTextColor(34, 197, 94); // Green color for secure ID
    pdf.text(`✓ Código Único Verificado: ${formData.code}`, margin, qrY + 20);

    // Add code format explanation
    pdf.setFontSize(6);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Formato: AP-PS-SNR##-DDMMAAHHMMSS`, margin, qrY + 24);
  }

  // Signatures Section
  const signaturesY = Math.max(qrY + qrSize + 20, yPosition + 30);
  let sigY = signaturesY;

  if (sigY + 70 > pageHeight - 20) {
    pdf.addPage();
    sigY = addModernHeader();
  }

  sigY = addSectionHeader("ASSINATURAS E APROVAÇÕES", sigY);

  const signatureWidth = (contentWidth - 15) / 2;
  const signatureHeight = 30;

  // Supervisor signature (left)
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("SUPERVISOR", margin, sigY);

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, sigY + 5, signatureWidth, signatureHeight, 2, 2, "F");
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, sigY + 5, signatureWidth, signatureHeight, 2, 2);

  if (formData.supervisorSignature) {
    try {
      pdf.addImage(
        formData.supervisorSignature,
        "PNG",
        margin + 2,
        sigY + 7,
        signatureWidth - 4,
        signatureHeight - 4,
      );
    } catch (error) {
      console.error("Error adding supervisor signature:", error);
    }
  }

  // Client signature (right)
  const clientX = margin + signatureWidth + 15;
  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "bold");
  pdf.text("CLIENTE", clientX, sigY);

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(
    clientX,
    sigY + 5,
    signatureWidth,
    signatureHeight,
    2,
    2,
    "F",
  );
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(clientX, sigY + 5, signatureWidth, signatureHeight, 2, 2);

  if (formData.clientConfirmedWithoutSignature) {
    pdf.setTextColor(185, 28, 28);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.text("CONFIRMADO SEM", clientX + 10, sigY + 18);
    pdf.text("ASSINATURA", clientX + 10, sigY + 23);
  } else if (formData.clientSignature) {
    try {
      pdf.addImage(
        formData.clientSignature,
        "PNG",
        clientX + 2,
        sigY + 7,
        signatureWidth - 4,
        signatureHeight - 4,
      );
    } catch (error) {
      console.error("Error adding client signature:", error);
    }
  }

  // Signature lines
  pdf.setTextColor(107, 114, 128);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(
    "Nome: ________________________",
    margin,
    sigY + signatureHeight + 10,
  );
  pdf.text(
    "Data: ___/___/___ Hora: ___:___",
    margin,
    sigY + signatureHeight + 15,
  );

  pdf.text(
    "Nome: ________________________",
    clientX,
    sigY + signatureHeight + 10,
  );
  pdf.text(
    "Data: ___/___/___ Hora: ___:___",
    clientX,
    sigY + signatureHeight + 15,
  );

  // Modern footer
  const footerY = pageHeight - 20;
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, footerY - 2, pageWidth, 22, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("AviationOps - Sistema de Gestão Aeronáutica", margin, footerY + 3);
  pdf.text(
    "Documento gerado automaticamente | Verificação digital disponível",
    margin,
    footerY + 8,
  );

  const currentDateTime = format(new Date(), "dd/MM/yyyy HH:mm:ss", {
    locale: ptBR,
  });
  pdf.text(
    `Impresso: ${currentDateTime}`,
    pageWidth - margin - 45,
    footerY + 3,
  );
  pdf.text(`Página 1 de ${totalPages}`, pageWidth - margin - 25, footerY + 8);

  // PAGE 2 - EMPLOYEE PHOTOGRAPHIC EVIDENCE (if employee photos exist)
  if (hasEmployeePhotos) {
    pdf.addPage();
    let evidenceY = addModernHeader();

    evidenceY = addSectionHeader("EVIDÊNCIAS FOTOGRÁFICAS", evidenceY);

    const photosWithEvidence = formData.employees.filter((emp) => emp.photo);
    const photosPerRow = 2;
    const photoWidth = (contentWidth - 20) / photosPerRow;
    const photoHeight = photoWidth * 0.75;

    photosWithEvidence.forEach((employee, index) => {
      const col = index % photosPerRow;
      const row = Math.floor(index / photosPerRow);
      const photoX = margin + 5 + col * (photoWidth + 10);
      const photoY = evidenceY + row * (photoHeight + 40);

      // Check if we need a new page
      if (photoY + photoHeight + 40 > pageHeight - 30) {
        pdf.addPage();
        evidenceY = addModernHeader();
        evidenceY = addSectionHeader(
          "EVIDÊNCIAS FOTOGRÁFICAS (CONT.)",
          evidenceY,
        );
        const newRow = 0;
        const newPhotoY = evidenceY + newRow * (photoHeight + 40);

        // Recalculate position
        const newCol = index % photosPerRow;
        const newPhotoX = margin + 5 + newCol * (photoWidth + 10);

        addPhotoEvidence(
          employee,
          newPhotoX,
          newPhotoY,
          photoWidth,
          photoHeight,
          index + 1,
        );
      } else {
        addPhotoEvidence(
          employee,
          photoX,
          photoY,
          photoWidth,
          photoHeight,
          index + 1,
        );
      }
    });

    function addPhotoEvidence(
      employee: any,
      x: number,
      y: number,
      width: number,
      height: number,
      photoNum: number,
    ) {
      // Photo background
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(x, y, width, height + 30, 3, 3, "F");
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(x, y, width, height + 30, 3, 3);

      // Photo
      if (employee.photo) {
        try {
          pdf.addImage(
            employee.photo,
            "JPEG",
            x + 2,
            y + 2,
            width - 4,
            height - 4,
          );
        } catch (error) {
          // Error placeholder
          pdf.setFillColor(229, 231, 235);
          pdf.rect(x + 2, y + 2, width - 4, height - 4, "F");
          pdf.setTextColor(107, 114, 128);
          pdf.setFontSize(10);
          pdf.text("ERRO AO CARREGAR FOTO", x + 10, y + height / 2);
        }
      }

      // Caption
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(`FOTO ${photoNum}: ${employee.name}`, x + 2, y + height + 8);

      pdf.setTextColor(71, 85, 105);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(
        `Função: ${employee.task || "Não especificada"}`,
        x + 2,
        y + height + 13,
      );
      pdf.text(
        `Horário: ${employee.startTime || "--:--"} às ${employee.endTime || "--:--"}`,
        x + 2,
        y + height + 18,
      );
      pdf.text(
        `Timestamp: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
        x + 2,
        y + height + 23,
      );
    }

    // Footer for evidence page
    const evidenceFooterY = pageHeight - 20;
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, evidenceFooterY - 2, pageWidth, 22, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      "AviationOps - Evidências Fotográficas",
      margin,
      evidenceFooterY + 3,
    );
    pdf.text(
      "Fotos capturadas durante a execução dos serviços",
      margin,
      evidenceFooterY + 8,
    );
    pdf.text(
      `Página 2 de ${totalPages}`,
      pageWidth - margin - 25,
      evidenceFooterY + 8,
    );
  }

  // PAGE 3 (or 2) - INTERVENTION PHOTOGRAPHIC EVIDENCE (if intervention photos exist)
  if (hasInterventionPhotos) {
    pdf.addPage();
    let interventionY = addModernHeader();

    interventionY = addSectionHeader(
      "EVID��NCIAS FOTOGRÁFICAS DA INTERVENÇÃO",
      interventionY,
    );

    // Try to load photos from the new photo evidence service
    let photoEvidenceData = null;
    try {
      const { photoEvidenceService } = await import("./photo-evidence-service");
      photoEvidenceData = await photoEvidenceService.getPhotosForPDF(
        formData.id,
      );
    } catch (error) {
      console.log("Photo evidence service not available, using legacy format");
    }

    // Use new photo evidence format if available, otherwise fall back to legacy
    const photoCategories = photoEvidenceData
      ? [
          {
            key: "before",
            title: "ANTES DA INTERVENÇÃO",
            photos: [
              ...photoEvidenceData.before.exterior.map((p) => ({
                photo: p.photoDataURL,
                type: "Exterior",
                description: p.description,
                capturedBy: p.capturedBy,
                timestamp: p.timestamp,
                tags: p.tags,
                gpsCoordinates: p.gpsCoordinates,
              })),
              ...photoEvidenceData.before.interior.map((p) => ({
                photo: p.photoDataURL,
                type: "Interior",
                description: p.description,
                capturedBy: p.capturedBy,
                timestamp: p.timestamp,
                tags: p.tags,
                gpsCoordinates: p.gpsCoordinates,
              })),
              ...photoEvidenceData.before.details.map((p) => ({
                photo: p.photoDataURL,
                type: "Detalhes",
                description: p.description,
                capturedBy: p.capturedBy,
                timestamp: p.timestamp,
                tags: p.tags,
                gpsCoordinates: p.gpsCoordinates,
              })),
            ],
          },
          {
            key: "after",
            title: "DEPOIS DA INTERVENÇÃO",
            photos: [
              ...photoEvidenceData.after.exterior.map((p) => ({
                photo: p.photoDataURL,
                type: "Exterior",
                description: p.description,
                capturedBy: p.capturedBy,
                timestamp: p.timestamp,
                tags: p.tags,
                gpsCoordinates: p.gpsCoordinates,
              })),
              ...photoEvidenceData.after.interior.map((p) => ({
                photo: p.photoDataURL,
                type: "Interior",
                description: p.description,
                capturedBy: p.capturedBy,
                timestamp: p.timestamp,
                tags: p.tags,
                gpsCoordinates: p.gpsCoordinates,
              })),
              ...photoEvidenceData.after.details.map((p) => ({
                photo: p.photoDataURL,
                type: "Detalhes",
                description: p.description,
                capturedBy: p.capturedBy,
                timestamp: p.timestamp,
                tags: p.tags,
                gpsCoordinates: p.gpsCoordinates,
              })),
            ],
          },
        ]
      : [
          {
            key: "before",
            title: "ANTES DA INTERVENÇÃO",
            photos: [
              ...(formData.interventionPhotos?.before.exterior || []).map(
                (photo) => ({
                  photo,
                  type: "Exterior",
                }),
              ),
              ...(formData.interventionPhotos?.before.interior || []).map(
                (photo) => ({
                  photo,
                  type: "Interior",
                }),
              ),
              ...(formData.interventionPhotos?.before.details || []).map(
                (photo) => ({
                  photo,
                  type: "Detalhes",
                }),
              ),
            ],
          },
          {
            key: "after",
            title: "DEPOIS DA INTERVENÇÃO",
            photos: [
              ...(formData.interventionPhotos?.after.exterior || []).map(
                (photo) => ({
                  photo,
                  type: "Exterior",
                }),
              ),
              ...(formData.interventionPhotos?.after.interior || []).map(
                (photo) => ({
                  photo,
                  type: "Interior",
                }),
              ),
              ...(formData.interventionPhotos?.after.details || []).map(
                (photo) => ({
                  photo,
                  type: "Detalhes",
                }),
              ),
            ],
          },
        ];

    photoCategories.forEach((category) => {
      if (category.photos && category.photos.length > 0) {
        // Section header
        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text(category.title, margin, interventionY + 5);
        interventionY += 15;

        const photosPerRow = 2;
        const photoWidth = (contentWidth - 20) / photosPerRow;
        const photoHeight = photoWidth * 0.6;

        category.photos.forEach((item, index) => {
          const col = index % photosPerRow;
          const row = Math.floor(index / photosPerRow);
          const photoX = margin + 5 + col * (photoWidth + 10);
          const photoY = interventionY + row * (photoHeight + 45);

          // Check if we need a new page
          if (photoY + photoHeight + 45 > pageHeight - 30) {
            pdf.addPage();
            interventionY = addModernHeader();
            interventionY = addSectionHeader(
              `${category.title} (CONT.)`,
              interventionY,
            );
            const newRow = 0;
            const newPhotoY = interventionY + newRow * (photoHeight + 45);
            const newCol = index % photosPerRow;
            const newPhotoX = margin + 5 + newCol * (photoWidth + 10);

            addInterventionPhotoEvidence(
              item,
              newPhotoX,
              newPhotoY,
              photoWidth,
              photoHeight,
              index + 1,
            );
          } else {
            addInterventionPhotoEvidence(
              item,
              photoX,
              photoY,
              photoWidth,
              photoHeight,
              index + 1,
            );
          }
        });

        interventionY +=
          Math.ceil(category.photos.length / photosPerRow) *
            (photoHeight + 45) +
          10;
      }
    });

    function addInterventionPhotoEvidence(
      item: any,
      x: number,
      y: number,
      width: number,
      height: number,
      photoNum: number,
    ) {
      // Photo background
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(x, y, width, height + 35, 3, 3, "F");
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(x, y, width, height + 35, 3, 3);

      // Photo
      if (item.photo) {
        try {
          pdf.addImage(item.photo, "JPEG", x + 2, y + 2, width - 4, height - 4);
        } catch (error) {
          // Error placeholder
          pdf.setFillColor(229, 231, 235);
          pdf.rect(x + 2, y + 2, width - 4, height - 4, "F");
          pdf.setTextColor(107, 114, 128);
          pdf.setFontSize(10);
          pdf.text("ERRO AO CARREGAR FOTO", x + 10, y + height / 2);
        }
      }

      // Enhanced caption with metadata
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${item.type.toUpperCase()} ${photoNum}`, x + 2, y + height + 8);

      // Description if available
      if (item.description && item.description !== `${item.type}`) {
        pdf.setTextColor(71, 85, 105);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        const descText =
          item.description.length > 40
            ? item.description.substring(0, 37) + "..."
            : item.description;
        pdf.text(descText, x + 2, y + height + 12);
      }

      // Timestamp and captured by
      pdf.setTextColor(71, 85, 105);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      const timestamp = item.timestamp
        ? format(new Date(item.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })
        : format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });
      pdf.text(`${timestamp}`, x + 2, y + height + 18);

      if (item.capturedBy) {
        pdf.setFontSize(7);
        pdf.text(`Por: ${item.capturedBy}`, x + 2, y + height + 22);
      }

      // GPS coordinates if available
      if (item.gpsCoordinates) {
        pdf.setTextColor(34, 197, 94);
        pdf.setFontSize(6);
        pdf.text(
          `GPS: ${item.gpsCoordinates.lat.toFixed(6)}, ${item.gpsCoordinates.lng.toFixed(6)}`,
          x + 2,
          y + height + 26,
        );
      }

      // Security verification stamp for secure IDs
      if (formData.code.startsWith("AP-PS-SNR")) {
        pdf.setTextColor(34, 197, 94);
        pdf.setFontSize(6);
        pdf.text(`✓ Código: ${formData.code}`, x + 2, y + height + 30);
      }

      // Tags if available
      if (item.tags && item.tags.length > 0) {
        pdf.setTextColor(147, 51, 234);
        pdf.setFontSize(6);
        const tagsText = item.tags.slice(0, 3).join(", ");
        pdf.text(`Tags: ${tagsText}`, x + width - 60, y + height + 8);
      }
    }

    // Footer for intervention evidence page
    const interventionFooterY = pageHeight - 20;
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, interventionFooterY - 2, pageWidth, 22, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      "AviationOps - Evidências Fotográficas da Intervenção",
      margin,
      interventionFooterY + 3,
    );
    pdf.text(
      "Fotos capturadas durante e após a execução dos serviços com metadados completos",
      margin,
      interventionFooterY + 8,
    );
    pdf.text(
      `Página ${totalPages} de ${totalPages}`,
      pageWidth - margin - 25,
      interventionFooterY + 8,
    );
  }

  return pdf;
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
    console.log("Supabase Storage upload skipped:", error);
  }

  // Download locally
  pdf.save(`folha-limpeza-${formData.code}.pdf`);
};

export const previewCleaningFormPDF = async (
  formData: CleaningFormData,
  aircraftData?: any,
) => {
  const pdf = await generateCleaningFormPDF(formData, aircraftData);
  const pdfDataUri = pdf.output("datauristring");
  window.open(pdfDataUri, "_blank");
};

export const generateAndUploadPDF = async (
  formData: CleaningFormData,
  aircraftData?: any,
): Promise<string | null> => {
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
