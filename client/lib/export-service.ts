import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import JSZip from "jszip";
import { downloadCleaningFormPDF, generateCleaningFormPDFBlob } from "./pdf-utils";
import { photoEvidenceService } from "./photo-evidence-service";

interface CleaningForm {
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
  status: "draft" | "pending_signatures" | "completed";
  createdAt: string;
  updatedAt: string;
  syncStatus?: "pending" | "synced" | "error";
}

interface ExportOptions {
  includePDFs: boolean;
  includePhotos: boolean;
  includeEmployeePhotos: boolean;
}

class ExportService {
  private getShiftText(shift: string): string {
    switch (shift) {
      case "morning":
        return "Manhã";
      case "afternoon":
        return "Tarde";
      case "night":
        return "Noite";
      default:
        return shift;
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case "draft":
        return "Rascunho";
      case "pending_signatures":
        return "Aguardando Assinaturas";
      case "completed":
        return "Concluído";
      default:
        return status;
    }
  }

  private getSyncStatusText(syncStatus?: string): string {
    switch (syncStatus) {
      case "synced":
        return "Sincronizado";
      case "pending":
        return "Pendente";
      case "error":
        return "Erro";
      default:
        return "N/A";
    }
  }

  async exportToCSV(
    forms: CleaningForm[],
    aircraft: any[],
    options: ExportOptions = { includePDFs: true, includePhotos: false, includeEmployeePhotos: false }
  ): Promise<void> {
    // CSV Header
    const csvHeader = [
      "Código",
      "Data",
      "Turno",
      "Local",
      "Aeronave - Matrícula",
      "Aeronave - Modelo",
      "Aeronave - Fabricante",
      "Funcionários - Nomes",
      "Funcionários - Quantidade",
      "Tipos de Intervenção",
      "Status",
      "Status de Sincronização",
      "Criado em",
      "Atualizado em",
      "Detalhes dos Funcionários",
    ];

    if (options.includePDFs) {
      csvHeader.push("Link PDF");
    }

    // Process each form
    const csvRows = await Promise.all(
      forms.map(async (form) => {
        const aircraftData = aircraft.find((ac) => ac.id === form.aircraftId);
        const employeeNames = form.employees.map((emp) => emp.name).join("; ");
        const employeeDetails = form.employees
          .map((emp) => `${emp.name} (${emp.task}, ${emp.startTime}-${emp.endTime}, Tel: ${emp.phone})`)
          .join(" | ");
        const interventionTypes = form.interventionTypes.join("; ");

        const row = [
          form.code,
          format(parseISO(form.date), "dd/MM/yyyy", { locale: ptBR }),
          this.getShiftText(form.shift),
          form.location,
          aircraftData?.registration || "N/A",
          aircraftData?.model || "N/A",
          aircraftData?.manufacturer || "N/A",
          employeeNames,
          form.employees.length.toString(),
          interventionTypes,
          this.getStatusText(form.status),
          this.getSyncStatusText(form.syncStatus),
          format(parseISO(form.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
          format(parseISO(form.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
          employeeDetails,
        ];

        if (options.includePDFs) {
          // Generate PDF filename reference
          row.push(`PDF_${form.code}.pdf`);
        }

        return row;
      })
    );

    // Create CSV content
    const csvContent = [csvHeader, ...csvRows]
      .map((row) => row.map((cell) => `"${cell?.toString().replace(/"/g, '""') || ''}"`).join(","))
      .join("\n");

    // Add BOM for Excel compatibility
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { 
      type: "text/csv;charset=utf-8;" 
    });

    // Download file
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `historico_limpeza_${format(new Date(), "yyyyMMdd_HHmm", { locale: ptBR })}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async exportToZIP(
    forms: CleaningForm[],
    aircraft: any[],
    options: ExportOptions = { includePDFs: true, includePhotos: true, includeEmployeePhotos: true }
  ): Promise<void> {
    const zip = new JSZip();
    const timestamp = format(new Date(), "yyyyMMdd_HHmm", { locale: ptBR });

    // Create folders
    const dataFolder = zip.folder("dados");
    const pdfFolder = options.includePDFs ? zip.folder("pdfs") : null;
    const photosFolder = options.includePhotos ? zip.folder("evidencias_fotograficas") : null;
    const employeePhotosFolder = options.includeEmployeePhotos ? zip.folder("fotos_funcionarios") : null;

    // Generate and add CSV
    if (dataFolder) {
      await this.addCSVToZip(dataFolder, forms, aircraft, options);
    }

    // Add detailed JSON data
    if (dataFolder) {
      const detailedData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          totalForms: forms.length,
          options: options,
        },
        forms: forms.map((form) => ({
          ...form,
          aircraft: aircraft.find((ac) => ac.id === form.aircraftId),
        })),
        aircraft: aircraft,
      };

      dataFolder.file(
        "dados_detalhados.json",
        JSON.stringify(detailedData, null, 2)
      );
    }

    // Add PDFs
    if (options.includePDFs && pdfFolder) {
      await this.addPDFsToZip(pdfFolder, forms, aircraft);
    }

    // Add photo evidence
    if (options.includePhotos && photosFolder) {
      await this.addPhotosToZip(photosFolder, forms);
    }

    // Add employee photos
    if (options.includeEmployeePhotos && employeePhotosFolder) {
      await this.addEmployeePhotosToZip(employeePhotosFolder, forms);
    }

    // Add readme file
    const readmeContent = this.generateReadmeContent(forms.length, options);
    zip.file("LEIA-ME.txt", readmeContent);

    // Generate and download ZIP
    try {
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(content);
      link.setAttribute("href", url);
      link.setAttribute("download", `historico_limpeza_${timestamp}.zip`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating ZIP:", error);
      throw new Error("Falha ao gerar arquivo ZIP");
    }
  }

  private async addCSVToZip(
    folder: JSZip,
    forms: CleaningForm[],
    aircraft: any[],
    options: ExportOptions
  ): Promise<void> {
    // Generate CSV header
    const csvHeader = [
      "Código",
      "Data",
      "Turno",
      "Local",
      "Aeronave - Matrícula",
      "Aeronave - Modelo",
      "Funcionários",
      "Tipos de Intervenção",
      "Status",
      "Status de Sincronização",
      "Criado em",
      "Atualizado em",
    ];

    // Generate CSV rows
    const csvRows = forms.map((form) => {
      const aircraftData = aircraft.find((ac) => ac.id === form.aircraftId);
      const employeeNames = form.employees.map((emp) => emp.name).join("; ");
      const interventionTypes = form.interventionTypes.join("; ");

      return [
        form.code,
        format(parseISO(form.date), "dd/MM/yyyy", { locale: ptBR }),
        this.getShiftText(form.shift),
        form.location,
        aircraftData?.registration || "N/A",
        aircraftData?.model || "N/A",
        employeeNames,
        interventionTypes,
        this.getStatusText(form.status),
        this.getSyncStatusText(form.syncStatus),
        format(parseISO(form.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        format(parseISO(form.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      ];
    });

    // Create CSV content
    const csvContent = [csvHeader, ...csvRows]
      .map((row) => row.map((cell) => `"${cell?.toString().replace(/"/g, '""') || ''}"`).join(","))
      .join("\n");

    // Add BOM for Excel compatibility
    const bom = "\uFEFF";
    folder.file("dados_limpeza.csv", bom + csvContent);
  }

  private async addPDFsToZip(
    folder: JSZip,
    forms: CleaningForm[],
    aircraft: any[]
  ): Promise<void> {
    for (const form of forms) {
      try {
        const aircraftData = aircraft.find((ac) => ac.id === form.aircraftId);
        const pdfBlob = await generateCleaningFormPDFBlob(form, aircraftData);
        folder.file(`PDF_${form.code}.pdf`, pdfBlob);
      } catch (error) {
        console.warn(`Failed to generate PDF for form ${form.code}:`, error);
        // Add error file instead
        folder.file(
          `PDF_${form.code}_ERRO.txt`,
          `Erro ao gerar PDF para a folha ${form.code}\nDetalhes: ${error}`
        );
      }
    }
  }

  private async addPhotosToZip(
    folder: JSZip,
    forms: CleaningForm[]
  ): Promise<void> {
    for (const form of forms) {
      try {
        const photos = await photoEvidenceService.getPhotosByForm(form.id);
        if (photos.length > 0) {
          const formFolder = folder.folder(form.code);
          if (formFolder) {
            for (const photo of photos) {
              if (photo.photoData) {
                // Convert base64 to blob
                const response = await fetch(photo.photoData);
                const blob = await response.blob();
                formFolder.file(`${photo.category}_${photo.id}.jpg`, blob);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to add photos for form ${form.code}:`, error);
      }
    }
  }

  private async addEmployeePhotosToZip(
    folder: JSZip,
    forms: CleaningForm[]
  ): Promise<void> {
    const addedPhotos = new Set<string>();

    for (const form of forms) {
      for (const employee of form.employees) {
        if (employee.photo && !addedPhotos.has(employee.id)) {
          try {
            // Convert base64 to blob
            const response = await fetch(employee.photo);
            const blob = await response.blob();
            folder.file(`funcionario_${employee.id}_${employee.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`, blob);
            addedPhotos.add(employee.id);
          } catch (error) {
            console.warn(`Failed to add photo for employee ${employee.name}:`, error);
          }
        }
      }
    }
  }

  private generateReadmeContent(formsCount: number, options: ExportOptions): string {
    const timestamp = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    return `HISTÓRICO DE LIMPEZA DE AERONAVES
========================================

Exportação gerada em: ${timestamp}
Total de folhas: ${formsCount}

CONTEÚDO DO ARQUIVO:
-------------------

📁 dados/
  - dados_limpeza.csv: Dados principais em formato planilha
  - dados_detalhados.json: Dados completos em formato JSON

${options.includePDFs ? `📁 pdfs/
  - PDFs individuais de cada folha de limpeza` : ''}

${options.includePhotos ? `📁 evidencias_fotograficas/
  - Fotos de evidência organizadas por folha` : ''}

${options.includeEmployeePhotos ? `📁 fotos_funcionarios/
  - Fotos dos funcionários envolvidos` : ''}

FORMATOS INCLUÍDOS:
------------------
- CSV: ✅ Dados principais
- JSON: ✅ Dados detalhados
${options.includePDFs ? '- PDF: ✅ Documentos completos' : '- PDF: ❌ Não incluído'}
${options.includePhotos ? '- Fotos de evidência: ✅ Incluídas' : '- Fotos de evidência: ❌ Não incluídas'}
${options.includeEmployeePhotos ? '- Fotos de funcionários: ✅ Incluídas' : '- Fotos de funcionários: ❌ Não incluídas'}

INSTRUÇÕES:
----------
1. Os arquivos CSV podem ser abertos no Excel ou Google Sheets
2. Os arquivos JSON contêm todos os dados estruturados
3. Os PDFs são documentos completos de cada folha
4. As fotos estão organizadas por categoria e folha

Para suporte técnico, contate a equipe de TI.

Sistema AviationOps
Gerado automaticamente pelo sistema de gestão de limpeza de aeronaves.
`;
  }

  // Method to print a specific form
  async printForm(form: CleaningForm, aircraftData: any): Promise<void> {
    try {
      // Import the PDF utilities
      const { previewCleaningFormPDF } = await import("./pdf-utils");
      
      // Open PDF in new window for printing
      await previewCleaningFormPDF(form, aircraftData);
      
      // Note: The actual printing will be handled by the browser's print dialog
      // when the user opens the PDF preview
    } catch (error) {
      console.error("Error printing form:", error);
      throw new Error("Não foi possível abrir o PDF para impressão");
    }
  }
}

export const exportService = new ExportService();
