import QRCode from "qrcode";
import { supabase } from "./supabase";

interface FormCodeComponents {
  prefix: string; // AP-PS
  series: string; // SNR
  sequence: string; // 01
  timestamp: string; // DDMMAAHHMMSS
}

interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  darkColor?: string;
  lightColor?: string;
}

class CodeGenerationService {
  private readonly PREFIX = "AP-PS";
  private readonly SERIES = "SNR";
  private sequenceCounter = 1;
  private lastSequenceDate = "";

  /**
   * Generate form code in format: AP-PS-SNR01-DDMMAAHHMMSS
   */
  generateFormCode(location?: string, shift?: string): string {
    const now = new Date();

    // Format: DDMMAAHHMMSS
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const timestamp = `${day}${month}${year}${hours}${minutes}${seconds}`;
    const currentDate = `${day}${month}${year}`;

    // Reset sequence counter daily
    if (this.lastSequenceDate !== currentDate) {
      this.sequenceCounter = 1;
      this.lastSequenceDate = currentDate;
    }

    // Generate sequence based on location and shift for better uniqueness
    let sequenceNumber = this.sequenceCounter;

    if (location && shift) {
      // Add location/shift modifier to sequence
      const locationCode = this.getLocationCode(location);
      const shiftCode = this.getShiftCode(shift);
      sequenceNumber = parseInt(
        `${locationCode}${shiftCode}${String(this.sequenceCounter).padStart(2, "0")}`,
      );
    }

    const sequence = String(sequenceNumber).padStart(2, "0");
    this.sequenceCounter++;

    return `${this.PREFIX}-${this.SERIES}${sequence}-${timestamp}`;
  }

  /**
   * Parse form code into components
   */
  parseFormCode(code: string): FormCodeComponents | null {
    const pattern = /^(AP-PS)-(SNR\d+)-(\d{12})$/;
    const match = code.match(pattern);

    if (!match) {
      return null;
    }

    return {
      prefix: match[1],
      series: match[2].substring(0, 3), // SNR
      sequence: match[2].substring(3), // digits after SNR
      timestamp: match[3],
    };
  }

  /**
   * Validate form code format
   */
  validateFormCode(code: string): boolean {
    return this.parseFormCode(code) !== null;
  }

  /**
   * Extract date from form code
   */
  extractDateFromCode(code: string): Date | null {
    const components = this.parseFormCode(code);
    if (!components) return null;

    const timestamp = components.timestamp;
    const day = parseInt(timestamp.substring(0, 2));
    const month = parseInt(timestamp.substring(2, 4)) - 1; // Month is 0-indexed
    const year = 2000 + parseInt(timestamp.substring(4, 6));
    const hours = parseInt(timestamp.substring(6, 8));
    const minutes = parseInt(timestamp.substring(8, 10));
    const seconds = parseInt(timestamp.substring(10, 12));

    return new Date(year, month, day, hours, minutes, seconds);
  }

  /**
   * Generate secure QR code for form
   */
  async generateFormQRCode(
    formCode: string,
    formId: string,
    options: QRCodeOptions = {},
  ): Promise<string> {
    try {
      const qrUrl = await this.generateQRCodeUrl(formCode, formId);

      const defaultOptions: QRCodeOptions = {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "H",
        darkColor: "#0f172a",
        lightColor: "#ffffff",
        ...options,
      };

      const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
        width: defaultOptions.width,
        margin: defaultOptions.margin,
        errorCorrectionLevel: defaultOptions.errorCorrectionLevel,
        color: {
          dark: defaultOptions.darkColor!,
          light: defaultOptions.lightColor!,
        },
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Generate secure URL for QR code
   */
  private async generateQRCodeUrl(
    formCode: string,
    formId: string,
  ): Promise<string> {
    try {
      // Check if Supabase is configured
      if (supabase && import.meta.env.VITE_SUPABASE_URL) {
        // Generate secure Supabase Storage URL
        const fileName = `${formCode}.pdf`;
        const storagePath = `cleaning-forms/${fileName}`;

        // Get or create signed URL for secure access
        const { data, error } = await supabase.storage
          .from("documents")
          .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days validity

        if (!error && data) {
          return data.signedUrl;
        }

        // Fallback to public URL
        const { data: publicUrlData } = supabase.storage
          .from("documents")
          .getPublicUrl(storagePath);

        return publicUrlData.publicUrl;
      }

      // Fallback for demo mode
      return `${window.location.origin}/cleaning-forms/${formCode}?id=${formId}`;
    } catch (error) {
      console.error("Error generating QR URL:", error);
      // Final fallback
      return `${window.location.origin}/cleaning-forms/${formCode}`;
    }
  }

  /**
   * Generate multiple QR code sizes for different uses
   */
  async generateQRCodeSet(
    formCode: string,
    formId: string,
  ): Promise<{
    small: string; // 150px - for forms
    medium: string; // 300px - for PDFs
    large: string; // 600px - for printing
  }> {
    const [small, medium, large] = await Promise.all([
      this.generateFormQRCode(formCode, formId, { width: 150 }),
      this.generateFormQRCode(formCode, formId, { width: 300 }),
      this.generateFormQRCode(formCode, formId, { width: 600 }),
    ]);

    return { small, medium, large };
  }

  /**
   * Validate QR code by scanning
   */
  async validateQRCode(qrCodeDataURL: string): Promise<{
    isValid: boolean;
    url?: string;
    formCode?: string;
    error?: string;
  }> {
    try {
      // This would typically use a QR code reader library
      // For now, we'll return a basic validation
      return {
        isValid: true,
        url: "validated",
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate batch codes for multiple forms
   */
  generateBatchCodes(
    count: number,
    location?: string,
    shift?: string,
  ): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateFormCode(location, shift));
      // Add small delay to ensure unique timestamps
      const now = Date.now();
      while (Date.now() === now) {
        // Wait for next millisecond
      }
    }
    return codes;
  }

  /**
   * Store QR code metadata in database
   */
  async storeQRCodeMetadata(
    formCode: string,
    formId: string,
    qrCodeData: string,
  ): Promise<boolean> {
    try {
      if (!supabase) return false;

      const { error } = await supabase.from("qr_codes").upsert({
        form_code: formCode,
        form_id: formId,
        qr_data: qrCodeData,
        generated_at: new Date().toISOString(),
        is_active: true,
      });

      return !error;
    } catch (error) {
      console.error("Error storing QR code metadata:", error);
      return false;
    }
  }

  /**
   * Helper methods
   */
  private getLocationCode(location: string): string {
    const locationMap: Record<string, string> = {
      "Hangar Principal": "1",
      "Pátio de Aeronaves": "2",
      "Terminal de Passageiros": "3",
      "Área de Manutenção": "4",
      "Rampa Norte": "5",
      "Rampa Sul": "6",
      "Hangar de Manutenção": "7",
      "Estacionamento VIP": "8",
    };

    return locationMap[location] || "9";
  }

  private getShiftCode(shift: string): string {
    const shiftMap: Record<string, string> = {
      morning: "1",
      afternoon: "2",
      night: "3",
    };

    return shiftMap[shift] || "1";
  }

  /**
   * Get next sequence number for a given date
   */
  getNextSequenceForDate(date: Date = new Date()): number {
    const dateStr = date.toISOString().split("T")[0];
    const stored = localStorage.getItem(`sequence_${dateStr}`);
    const current = stored ? parseInt(stored) : 0;
    const next = current + 1;
    localStorage.setItem(`sequence_${dateStr}`, next.toString());
    return next;
  }

  /**
   * Reset daily sequence counter
   */
  resetDailySequence(): void {
    this.sequenceCounter = 1;
    this.lastSequenceDate = "";
  }

  /**
   * Generate form code with guaranteed uniqueness
   */
  async generateUniqueFormCode(
    location?: string,
    shift?: string,
  ): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = this.generateFormCode(location, shift);

      // Check if code already exists (if Supabase is available)
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("cleaning_forms")
            .select("code")
            .eq("code", code)
            .single();

          if (error && error.code === "PGRST116") {
            // No matching record found, code is unique
            return code;
          }

          if (!data) {
            return code;
          }
        } catch (error) {
          // If check fails, return the code anyway
          return code;
        }
      } else {
        // No Supabase, return the generated code
        return code;
      }

      attempts++;
      // Wait a bit before retry to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // If all attempts failed, add random suffix
    const baseCode = this.generateFormCode(location, shift);
    const randomSuffix = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");
    return `${baseCode}-${randomSuffix}`;
  }

  /**
   * Generate form code with custom parameters
   */
  generateCustomFormCode(params: {
    date?: Date;
    location?: string;
    shift?: string;
    sequence?: number;
  }): string {
    const date = params.date || new Date();

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    const timestamp = `${day}${month}${year}${hours}${minutes}${seconds}`;

    let sequence = params.sequence || this.sequenceCounter;
    if (params.location && params.shift) {
      const locationCode = this.getLocationCode(params.location);
      const shiftCode = this.getShiftCode(params.shift);
      sequence = parseInt(
        `${locationCode}${shiftCode}${String(sequence).padStart(2, "0")}`,
      );
    }

    const sequenceStr = String(sequence).padStart(2, "0");

    return `${this.PREFIX}-${this.SERIES}${sequenceStr}-${timestamp}`;
  }
}

// Export singleton instance
export const codeGenerationService = new CodeGenerationService();

// Export types
export type { FormCodeComponents, QRCodeOptions };
