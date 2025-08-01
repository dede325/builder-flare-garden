import jsPDF from "jspdf";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CleaningFormData {
  id: string;
  codigo: string;
  data: string;
  turno: "manha" | "tarde" | "noite";
  local: string;
  tipos_intervencao: string[];
  aeronave_id: string;
  funcionarios: {
    id: string;
    nome: string;
    tarefa: string;
    hora_inicio: string;
    hora_fim: string;
    telefone: string;
    numero_bilhete: string;
    foto?: string;
  }[];
  observacoes?: string;
  assinatura_supervisor?: string;
  assinatura_cliente?: string;
  cliente_confirmou: boolean;
  qr_code_data: string;
  status: string;
  created_at: string;
}

interface AircraftData {
  matricula: string;
  modelo: string;
  fabricante: string;
  proprietario?: string;
}

class AirPlusPDFService {
  // AirPlus brand colors
  private readonly brandColors = {
    primary: [37, 99, 235], // Blue
    secondary: [71, 85, 105], // Gray
    accent: [34, 197, 94], // Green
    text: [15, 23, 42], // Dark blue
    lightGray: [248, 250, 252], // Light gray
  };

  // Company information
  private readonly companyInfo = {
    name: "AirPlus Aviation Services",
    address: "Aeroporto Internacional 4 de Fevereiro",
    city: "Luanda, Angola",
    phone: "+244 923 000 000",
    email: "operacoes@airplus.co",
    website: "www.airplus.co",
  };

  async generateCleaningFormPDF(
    formData: CleaningFormData,
    aircraftData?: AircraftData,
    logoSettings?: {
      companyLogo?: string;
      clientLogo?: string;
      clientName?: string;
      clientAddress?: string;
      clientContact?: string;
    },
  ): Promise<jsPDF> {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Main brand colors
    const [primaryR, primaryG, primaryB] = this.brandColors.primary;
    const [textR, textG, textB] = this.brandColors.text;

    let currentY = margin;

    // Helper function to add header with AirPlus branding
    const addBrandedHeader = async (): Promise<number> => {
      // Header background
      pdf.setFillColor(primaryR, primaryG, primaryB);
      pdf.rect(0, 0, pageWidth, 45, "F"); // Increased height for client logo

      // Company logo (left side)
      try {
        if (logoSettings?.companyLogo) {
          // Add company logo from base64
          pdf.addImage(logoSettings.companyLogo, 'PNG', margin, 8, 40, 20);
        } else {
          // Fallback to default AirPlus logo
          try {
            // Try to load the default AirPlus logo
            const img = new Image();
            img.src = '/airplus-logo.png';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            pdf.addImage(img, 'PNG', margin, 8, 40, 20);
          } catch {
            // Ultimate fallback - text logo
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(margin, 8, 40, 20, 3, 3, "F");
            pdf.setTextColor(primaryR, primaryG, primaryB);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(14);
            pdf.text("AirPlus", margin + 20, 15, { align: "center" });
            pdf.setFontSize(8);
            pdf.text("AVIATION", margin + 20, 20, { align: "center" });
          }
        }
      } catch {
        // Fallback to text logo
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(margin, 8, 40, 20, 3, 3, "F");
        pdf.setTextColor(primaryR, primaryG, primaryB);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text("AirPlus", margin + 20, 15, { align: "center" });
        pdf.setFontSize(8);
        pdf.text("AVIATION", margin + 20, 20, { align: "center" });
      }

      // Client logo and info (right side)
      const clientAreaX = pageWidth - margin - 60; // Reserve 60mm for client area

      if (logoSettings?.clientLogo) {
        try {
          // Add client logo
          pdf.addImage(logoSettings.clientLogo, 'PNG', clientAreaX, 8, 25, 25);
        } catch (error) {
          console.warn('Failed to add client logo:', error);
        }
      }

      // Client information
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);

      if (logoSettings?.clientName) {
        pdf.text(logoSettings.clientName, pageWidth - margin - 30, 12, {
          align: "right",
        });
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      if (logoSettings?.clientAddress) {
        pdf.text(logoSettings.clientAddress, pageWidth - margin - 30, 18, {
          align: "right",
        });
      }

      if (logoSettings?.clientContact) {
        pdf.text(logoSettings.clientContact, pageWidth - margin - 30, 24, {
          align: "right",
        });
      }

      // Company title (center)
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("FOLHA DE LIMPEZA DE AERONAVE", pageWidth / 2, 12, {
        align: "center",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text("Sistema Profissional de Gestão", pageWidth / 2, 18, {
        align: "center",
      });

      pdf.setFontSize(8);
      pdf.text(this.companyInfo.address, pageWidth / 2, 24, {
        align: "center",
      });
      pdf.text(
        `${this.companyInfo.phone} | ${this.companyInfo.email}`,
        pageWidth / 2,
        28,
        { align: "center" },
      );

      return 55; // Return Y position after header (increased for larger header)
    };

    // Page 1: Main form data
    currentY = await addBrandedHeader();

    // Form identification section
    pdf.setFillColor(...this.brandColors.lightGray);
    pdf.roundedRect(margin, currentY, contentWidth, 25, 3, 3, "F");

    pdf.setTextColor(...this.brandColors.text);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("IDENTIFICAÇÃO DA FOLHA", margin + 5, currentY + 8);

    // Form code with special formatting for AP-PS-SNR codes
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    if (formData.codigo.startsWith("AP-PS-SNR")) {
      pdf.setTextColor(...this.brandColors.accent);
      pdf.text(`✓ ${formData.codigo}`, margin + 5, currentY + 15);
      pdf.setTextColor(...this.brandColors.text);
      pdf.setFontSize(8);
      pdf.text(
        "Código Único Verificado - Sistema Seguro",
        margin + 5,
        currentY + 19,
      );
    } else {
      pdf.setTextColor(...this.brandColors.text);
      pdf.text(formData.codigo, margin + 5, currentY + 15);
    }

    // Date and shift
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const formattedDate = format(
      parseISO(formData.data),
      "dd 'de' MMMM 'de' yyyy",
      { locale: ptBR },
    );
    const shiftText =
      formData.turno === "manha"
        ? "Manhã"
        : formData.turno === "tarde"
          ? "Tarde"
          : "Noite";
    pdf.text(
      `Data: ${formattedDate} | Turno: ${shiftText}`,
      pageWidth - margin,
      currentY + 12,
      { align: "right" },
    );

    // Status badge
    const statusText =
      formData.status === "rascunho"
        ? "RASCUNHO"
        : formData.status === "concluida"
          ? "CONCLUÍDA"
          : formData.status.toUpperCase();

    pdf.setFillColor(
      formData.status === "concluida"
        ? 34
        : formData.status === "rascunho"
          ? 234
          : 59,
      formData.status === "concluida"
        ? 197
        : formData.status === "rascunho"
          ? 179
          : 130,
      formData.status === "concluida"
        ? 94
        : formData.status === "rascunho"
          ? 8
          : 246,
    );
    pdf.roundedRect(pageWidth - margin - 25, currentY + 16, 25, 6, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(statusText, pageWidth - margin - 12.5, currentY + 20, {
      align: "center",
    });

    currentY += 35;

    // Aircraft information
    this.addSection(
      pdf,
      "INFORMAÇÕES DA AERONAVE",
      currentY,
      contentWidth,
      margin,
    );
    currentY += 15;

    if (aircraftData) {
      const aircraftInfo = [
        [
          `Matrícula: ${aircraftData.matricula}`,
          `Modelo: ${aircraftData.modelo}`,
        ],
        [
          `Fabricante: ${aircraftData.fabricante}`,
          `Proprietário: ${aircraftData.proprietario || "N/A"}`,
        ],
      ];

      aircraftInfo.forEach(([left, right]) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(...this.brandColors.text);
        pdf.text(left, margin + 5, currentY);
        pdf.text(right, margin + contentWidth / 2 + 5, currentY);
        currentY += 6;
      });
    }

    currentY += 10;

    // Location and intervention types
    this.addSection(
      pdf,
      "DETALHES DA INTERVENÇÃO",
      currentY,
      contentWidth,
      margin,
    );
    currentY += 15;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...this.brandColors.text);
    pdf.text(`Local: ${formData.local}`, margin + 5, currentY);
    currentY += 8;

    pdf.text("Tipos de Intervenção:", margin + 5, currentY);
    currentY += 6;

    formData.tipos_intervencao.forEach((tipo, index) => {
      pdf.setFillColor(...this.brandColors.primary);
      pdf.circle(margin + 8, currentY - 1, 1, "F");
      pdf.text(tipo, margin + 12, currentY);
      currentY += 5;
    });

    currentY += 10;

    // Employees section
    this.addSection(pdf, "EQUIPE DE LIMPEZA", currentY, contentWidth, margin);
    currentY += 15;

    formData.funcionarios.forEach((funcionario, index) => {
      // Employee card background
      pdf.setFillColor(250, 250, 250);
      pdf.roundedRect(margin, currentY - 3, contentWidth, 22, 2, 2, "F");
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(margin, currentY - 3, contentWidth, 22, 2, 2);

      // Employee photo placeholder
      if (funcionario.foto) {
        try {
          pdf.addImage(funcionario.foto, "JPEG", margin + 3, currentY, 15, 15);
        } catch (error) {
          // Fallback: draw placeholder
          pdf.setFillColor(200, 200, 200);
          pdf.roundedRect(margin + 3, currentY, 15, 15, 2, 2, "F");
          pdf.setTextColor(150, 150, 150);
          pdf.setFontSize(8);
          pdf.text("FOTO", margin + 10.5, currentY + 8, { align: "center" });
        }
      } else {
        // Draw initials circle
        pdf.setFillColor(...this.brandColors.primary);
        pdf.circle(margin + 10.5, currentY + 7.5, 7, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        const initials = funcionario.nome
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2);
        pdf.text(initials, margin + 10.5, currentY + 9, { align: "center" });
      }

      // Employee details
      pdf.setTextColor(...this.brandColors.text);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(funcionario.nome, margin + 22, currentY + 5);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Função: ${funcionario.tarefa}`, margin + 22, currentY + 10);
      pdf.text(
        `Horário: ${funcionario.hora_inicio} às ${funcionario.hora_fim}`,
        margin + 22,
        currentY + 14,
      );

      // Contact info on the right
      pdf.text(
        `Tel: ${funcionario.telefone}`,
        pageWidth - margin - 5,
        currentY + 5,
        { align: "right" },
      );
      pdf.text(
        `BI: ${funcionario.numero_bilhete}`,
        pageWidth - margin - 5,
        currentY + 10,
        { align: "right" },
      );

      currentY += 25;
    });

    // QR Code section
    if (formData.qr_code_data) {
      currentY += 10;
      this.addSection(
        pdf,
        "CÓDIGO QR - ACESSO DIGITAL",
        currentY,
        contentWidth,
        margin,
      );
      currentY += 15;

      try {
        // Add QR code
        const qrSize = 30;
        pdf.addImage(
          formData.qr_code_data,
          "PNG",
          margin + 5,
          currentY,
          qrSize,
          qrSize,
        );

        // QR code info
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(...this.brandColors.text);
        pdf.text(
          "Escaneie para acesso digital:",
          margin + qrSize + 15,
          currentY + 8,
        );
        pdf.text(
          "• Visualizar folha online",
          margin + qrSize + 15,
          currentY + 13,
        );
        pdf.text("• Download do PDF", margin + qrSize + 15, currentY + 17);
        pdf.text(
          "• Histórico de alterações",
          margin + qrSize + 15,
          currentY + 21,
        );

        if (formData.codigo.startsWith("AP-PS-SNR")) {
          pdf.setTextColor(...this.brandColors.accent);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.text(
            "✓ Código Verificado com Segurança Avançada",
            margin + qrSize + 15,
            currentY + 26,
          );
        }

        currentY += qrSize + 15;
      } catch (error) {
        console.warn("Could not add QR code to PDF:", error);
        pdf.setTextColor(...this.brandColors.text);
        pdf.text("QR Code não disponível", margin + 5, currentY);
        currentY += 10;
      }
    }

    // Signatures section
    if (currentY + 80 > pageHeight - 30) {
      pdf.addPage();
      currentY = addBrandedHeader();
    }

    this.addSection(
      pdf,
      "ASSINATURAS E APROVAÇÕES",
      currentY,
      contentWidth,
      margin,
    );
    currentY += 15;

    // Signature boxes
    const signatureWidth = (contentWidth - 20) / 2;
    const signatureHeight = 35;

    // Supervisor signature
    pdf.setDrawColor(200, 200, 200);
    pdf.roundedRect(margin, currentY, signatureWidth, signatureHeight, 3, 3);

    if (formData.assinatura_supervisor) {
      try {
        pdf.addImage(
          formData.assinatura_supervisor,
          "PNG",
          margin + 5,
          currentY + 5,
          signatureWidth - 10,
          signatureHeight - 15,
        );
      } catch (error) {
        console.warn("Could not add supervisor signature:", error);
      }
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...this.brandColors.text);
    pdf.text(
      "ASSINATURA DO SUPERVISOR",
      margin + signatureWidth / 2,
      currentY + signatureHeight + 5,
      { align: "center" },
    );

    // Client signature
    const clientX = margin + signatureWidth + 20;
    pdf.roundedRect(clientX, currentY, signatureWidth, signatureHeight, 3, 3);

    if (formData.assinatura_cliente) {
      try {
        pdf.addImage(
          formData.assinatura_cliente,
          "PNG",
          clientX + 5,
          currentY + 5,
          signatureWidth - 10,
          signatureHeight - 15,
        );
      } catch (error) {
        console.warn("Could not add client signature:", error);
      }
    } else if (formData.cliente_confirmou) {
      pdf.setTextColor(...this.brandColors.accent);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(
        "✓ CONFIRMADO",
        clientX + signatureWidth / 2,
        currentY + signatureHeight / 2,
        { align: "center" },
      );
      pdf.setFontSize(8);
      pdf.text(
        "SEM ASSINATURA",
        clientX + signatureWidth / 2,
        currentY + signatureHeight / 2 + 5,
        { align: "center" },
      );
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...this.brandColors.text);
    pdf.text(
      "ASSINATURA DO CLIENTE",
      clientX + signatureWidth / 2,
      currentY + signatureHeight + 5,
      { align: "center" },
    );

    // Footer with company info and generation timestamp
    const footerY = pageHeight - 15;
    pdf.setFillColor(...this.brandColors.primary);
    pdf.rect(0, footerY - 3, pageWidth, 18, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(this.companyInfo.name, margin, footerY + 2);
    pdf.text(
      `${this.companyInfo.phone} | ${this.companyInfo.website}`,
      margin,
      footerY + 7,
    );

    const generatedText = `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
    pdf.text(generatedText, pageWidth - margin, footerY + 2, {
      align: "right",
    });
    pdf.text("Sistema AirPlus Aviation v1.0", pageWidth - margin, footerY + 7, {
      align: "right",
    });

    return pdf;
  }

  private addSection(
    pdf: jsPDF,
    title: string,
    y: number,
    width: number,
    margin: number,
  ): void {
    pdf.setFillColor(...this.brandColors.primary);
    pdf.rect(margin, y, width, 12, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(title, margin + 5, y + 8);
  }

  async downloadPDF(
    formData: CleaningFormData,
    aircraftData?: AircraftData,
  ): Promise<void> {
    const pdf = await this.generateCleaningFormPDF(formData, aircraftData);

    // Save with AirPlus naming convention
    const fileName = `AirPlus_Limpeza_${formData.codigo}_${format(new Date(), "yyyyMMdd")}.pdf`;
    pdf.save(fileName);
  }

  async generatePDFBlob(
    formData: CleaningFormData,
    aircraftData?: AircraftData,
  ): Promise<Blob> {
    const pdf = await this.generateCleaningFormPDF(formData, aircraftData);
    return pdf.output("blob");
  }

  async previewPDF(
    formData: CleaningFormData,
    aircraftData?: AircraftData,
  ): Promise<void> {
    const pdf = await this.generateCleaningFormPDF(formData, aircraftData);
    const pdfDataUri = pdf.output("datauristring");
    window.open(pdfDataUri, "_blank");
  }
}

// Export singleton instance
export const airPlusPDFService = new AirPlusPDFService();
