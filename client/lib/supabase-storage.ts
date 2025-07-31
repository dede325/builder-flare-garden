import { supabase } from './supabase';

export const supabaseStorage = {
  async uploadCleaningFormPDF(formCode: string, pdfBlob: Blob): Promise<string | null> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping PDF upload');
      return null;
    }

    try {
      const fileName = `${formCode}.pdf`;
      const filePath = `cleaning-forms/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true // Overwrite if exists
        });

      if (error) {
        console.error('Error uploading PDF to Supabase Storage:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      return null;
    }
  },

  async uploadEmployeePhoto(formCode: string, employeeId: string, photoBlob: Blob): Promise<string | null> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping photo upload');
      return null;
    }

    try {
      const fileName = `${formCode}_${employeeId}_${Date.now()}.jpg`;
      const filePath = `employee-photos/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, photoBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('Error uploading photo to Supabase Storage:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  },

  async saveFormMetadata(formData: any): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping metadata save');
      return false;
    }

    try {
      const { error } = await supabase
        .from('cleaning_forms')
        .upsert({
          id: formData.id,
          code: formData.code,
          date: formData.date,
          shift: formData.shift,
          location: formData.location,
          intervention_types: formData.interventionTypes,
          aircraft_id: formData.aircraftId,
          employees: formData.employees,
          supervisor_signature: formData.supervisorSignature,
          client_signature: formData.clientSignature,
          client_confirmed_without_signature: formData.clientConfirmedWithoutSignature,
          qr_code: formData.qrCode,
          status: formData.status,
          created_at: formData.createdAt,
          updated_at: formData.updatedAt
        });

      if (error) {
        console.error('Error saving form metadata:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving form metadata:', error);
      return false;
    }
  }
};

// Helper function to convert data URL to blob
export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};
