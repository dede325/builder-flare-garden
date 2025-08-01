import { exportService } from "./export-service";
import { downloadCleaningFormPDF, previewCleaningFormPDF } from "./pdf-utils";

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
  clientConfirmed: boolean;
  qrCodeData: string;
}

interface BatchOperationResult {
  successful: number;
  failed: number;
  errors: string[];
}

class BatchOperationsService {
  async batchPrint(
    forms: CleaningForm[],
    aircraft: any[],
    onProgress?: (current: number, total: number) => void,
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      try {
        const aircraftData = aircraft.find((ac) => ac.id === form.aircraftId);

        // Open each PDF in a new tab for printing
        // Small delay to prevent browser blocking multiple popups
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        await previewCleaningFormPDF(form, aircraftData);
        result.successful++;

        if (onProgress) {
          onProgress(i + 1, forms.length);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Erro ao imprimir folha ${form.code}: ${error}`);
        console.error(`Error printing form ${form.code}:`, error);
      }
    }

    return result;
  }

  async batchDownload(
    forms: CleaningForm[],
    aircraft: any[],
    onProgress?: (current: number, total: number) => void,
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      try {
        const aircraftData = aircraft.find((ac) => ac.id === form.aircraftId);

        // Small delay between downloads
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        await downloadCleaningFormPDF(form, aircraftData);
        result.successful++;

        if (onProgress) {
          onProgress(i + 1, forms.length);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Erro ao baixar folha ${form.code}: ${error}`);
        console.error(`Error downloading form ${form.code}:`, error);
      }
    }

    return result;
  }

  async batchExportToEmailAttachments(
    forms: CleaningForm[],
    aircraft: any[],
    emailSubject?: string,
  ): Promise<string[]> {
    const attachmentUrls: string[] = [];

    try {
      // Generate ZIP export with all PDFs
      await exportService.exportToZIP(forms, aircraft, {
        includePDFs: true,
        includePhotos: true,
        includeEmployeePhotos: true,
      });

      // Note: In a real implementation, you would upload the ZIP to a cloud service
      // and return the download URL for email attachment
    } catch (error) {
      console.error("Error creating email attachments:", error);
      throw new Error("Falha ao preparar anexos para email");
    }

    return attachmentUrls;
  }

  generateBatchReport(
    forms: CleaningForm[],
    aircraft: any[],
  ): {
    summary: {
      totalForms: number;
      byStatus: Record<string, number>;
      byLocation: Record<string, number>;
      byShift: Record<string, number>;
      dateRange: { start: string; end: string };
    };
    details: any[];
  } {
    const summary = {
      totalForms: forms.length,
      byStatus: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
      byShift: {} as Record<string, number>,
      dateRange: { start: "", end: "" },
    };

    // Calculate statistics
    forms.forEach((form) => {
      // Status counts
      summary.byStatus[form.status] = (summary.byStatus[form.status] || 0) + 1;

      // Location counts
      summary.byLocation[form.location] =
        (summary.byLocation[form.location] || 0) + 1;

      // Shift counts
      summary.byShift[form.shift] = (summary.byShift[form.shift] || 0) + 1;
    });

    // Date range
    const dates = forms.map((f) => f.date).sort();
    summary.dateRange.start = dates[0] || "";
    summary.dateRange.end = dates[dates.length - 1] || "";

    // Detailed information
    const details = forms.map((form) => {
      const aircraftData = aircraft.find((ac) => ac.id === form.aircraftId);
      return {
        code: form.code,
        date: form.date,
        location: form.location,
        aircraft: aircraftData
          ? `${aircraftData.registration} - ${aircraftData.model}`
          : "N/A",
        employeeCount: form.employees.length,
        interventionTypes: form.interventionTypes.length,
        status: form.status,
        syncStatus: form.syncStatus,
      };
    });

    return { summary, details };
  }

  async validateFormsBeforeExport(forms: CleaningForm[]): Promise<{
    valid: CleaningForm[];
    invalid: { form: CleaningForm; reasons: string[] }[];
  }> {
    const valid: CleaningForm[] = [];
    const invalid: { form: CleaningForm; reasons: string[] }[] = [];

    forms.forEach((form) => {
      const reasons: string[] = [];

      // Basic validation
      if (!form.code || form.code.trim() === "") {
        reasons.push("Código da folha não informado");
      }

      if (!form.date) {
        reasons.push("Data não informada");
      }

      if (!form.location || form.location.trim() === "") {
        reasons.push("Local não informado");
      }

      if (!form.aircraftId) {
        reasons.push("Aeronave não selecionada");
      }

      if (!form.employees || form.employees.length === 0) {
        reasons.push("Nenhum funcionário cadastrado");
      }

      if (!form.interventionTypes || form.interventionTypes.length === 0) {
        reasons.push("Tipos de intervenção não selecionados");
      }

      // Employee validation
      form.employees.forEach((emp, index) => {
        if (!emp.name || emp.name.trim() === "") {
          reasons.push(`Funcionário ${index + 1}: Nome não informado`);
        }
        if (!emp.id) {
          reasons.push(`Funcionário ${index + 1}: ID não encontrado`);
        }
      });

      if (reasons.length === 0) {
        valid.push(form);
      } else {
        invalid.push({ form, reasons });
      }
    });

    return { valid, invalid };
  }
}

export const batchOperationsService = new BatchOperationsService();
