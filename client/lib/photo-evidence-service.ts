import Dexie, { Table } from 'dexie';
import { supabaseStorage } from './supabase-storage';

export interface PhotoEvidence {
  id: string;
  formId: string;
  type: 'before' | 'after';
  category: 'exterior' | 'interior' | 'details';
  photoDataURL: string;
  thumbnail: string;
  description: string;
  location?: string;
  gpsCoordinates?: { lat: number; lng: number };
  timestamp: string;
  capturedBy: string;
  capturedByUserId: string;
  fileSize: number;
  resolution: { width: number; height: number };
  tags: string[];
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error';
  supabaseUrl?: string;
  metadata: {
    device: string;
    userAgent: string;
    orientation: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PhotoUploadQueue {
  id?: number;
  photoId: string;
  attempts: number;
  lastAttempt?: string;
  errorMessage?: string;
}

class PhotoEvidenceDatabase extends Dexie {
  photos!: Table<PhotoEvidence>;
  uploadQueue!: Table<PhotoUploadQueue>;

  constructor() {
    super('PhotoEvidenceDB');
    
    this.version(1).stores({
      photos: 'id, formId, type, category, timestamp, uploadStatus, capturedByUserId',
      uploadQueue: '++id, photoId, attempts, lastAttempt'
    });
  }
}

const photoDb = new PhotoEvidenceDatabase();

class PhotoEvidenceService {
  
  // Save photo to offline storage
  async savePhoto(photo: PhotoEvidence): Promise<void> {
    const now = new Date().toISOString();
    const photoWithTimestamps = {
      ...photo,
      createdAt: now,
      updatedAt: now
    };
    
    await photoDb.photos.put(photoWithTimestamps);
    
    // Add to upload queue if not already uploaded
    if (photo.uploadStatus === 'pending') {
      await this.addToUploadQueue(photo.id);
    }
  }

  // Get all photos for a specific form
  async getPhotosByForm(formId: string): Promise<PhotoEvidence[]> {
    return await photoDb.photos
      .where('formId')
      .equals(formId)
      .orderBy('timestamp')
      .toArray();
  }

  // Get photos by type and category
  async getPhotosByTypeAndCategory(
    formId: string, 
    type: 'before' | 'after', 
    category: 'exterior' | 'interior' | 'details'
  ): Promise<PhotoEvidence[]> {
    return await photoDb.photos
      .where(['formId', 'type', 'category'])
      .equals([formId, type, category])
      .orderBy('timestamp')
      .toArray();
  }

  // Get photo by ID
  async getPhoto(photoId: string): Promise<PhotoEvidence | undefined> {
    return await photoDb.photos.get(photoId);
  }

  // Update photo
  async updatePhoto(photoId: string, updates: Partial<PhotoEvidence>): Promise<void> {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await photoDb.photos.update(photoId, updatedData);
  }

  // Delete photo
  async deletePhoto(photoId: string): Promise<void> {
    const photo = await this.getPhoto(photoId);
    
    if (photo) {
      // Delete from Supabase if uploaded
      if (photo.supabaseUrl && photo.uploadStatus === 'uploaded') {
        try {
          await supabaseStorage.deleteFile(photo.supabaseUrl);
        } catch (error) {
          console.warn('Failed to delete from Supabase:', error);
        }
      }
      
      // Remove from local database
      await photoDb.photos.delete(photoId);
      
      // Remove from upload queue
      await photoDb.uploadQueue.where('photoId').equals(photoId).delete();
    }
  }

  // Add photo to upload queue
  async addToUploadQueue(photoId: string): Promise<void> {
    const existing = await photoDb.uploadQueue.where('photoId').equals(photoId).first();
    
    if (!existing) {
      await photoDb.uploadQueue.add({
        photoId,
        attempts: 0
      });
    }
  }

  // Upload photo to Supabase
  async uploadPhoto(photoId: string): Promise<boolean> {
    try {
      const photo = await this.getPhoto(photoId);
      if (!photo || photo.uploadStatus === 'uploaded') {
        return true;
      }

      // Update status to uploading
      await this.updatePhoto(photoId, { uploadStatus: 'uploading' });

      // Convert data URL to blob
      const response = await fetch(photo.photoDataURL);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `cleaning-forms/${photo.formId}/evidence/${photo.type}_${photo.category}_${photo.timestamp}_${photo.id}.jpg`;

      // Upload to Supabase Storage
      const uploadResult = await supabaseStorage.uploadFile(filename, blob);
      
      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseStorage.getPublicUrl(filename);

      // Update photo with Supabase URL and status
      await this.updatePhoto(photoId, {
        uploadStatus: 'uploaded',
        supabaseUrl: publicUrl
      });

      // Remove from upload queue
      await photoDb.uploadQueue.where('photoId').equals(photoId).delete();

      // Save metadata to Supabase database
      await this.savePhotoMetadataToSupabase(photo, publicUrl);

      return true;

    } catch (error) {
      console.error('Upload failed for photo:', photoId, error);
      
      // Update photo status to error
      await this.updatePhoto(photoId, { uploadStatus: 'error' });
      
      // Update upload queue with error info
      const queueItem = await photoDb.uploadQueue.where('photoId').equals(photoId).first();
      if (queueItem) {
        await photoDb.uploadQueue.update(queueItem.id!, {
          attempts: (queueItem.attempts || 0) + 1,
          lastAttempt: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      return false;
    }
  }

  // Save photo metadata to Supabase database
  private async savePhotoMetadataToSupabase(photo: PhotoEvidence, supabaseUrl: string): Promise<void> {
    try {
      const { supabase } = await import('./supabase');
      
      const metadata = {
        id: photo.id,
        form_id: photo.formId,
        type: photo.type,
        category: photo.category,
        description: photo.description,
        location: photo.location,
        gps_coordinates: photo.gpsCoordinates,
        timestamp: photo.timestamp,
        captured_by: photo.capturedBy,
        captured_by_user_id: photo.capturedByUserId,
        file_size: photo.fileSize,
        resolution: photo.resolution,
        tags: photo.tags,
        supabase_url: supabaseUrl,
        metadata: photo.metadata,
        created_at: photo.createdAt,
        updated_at: photo.updatedAt
      };

      const { error } = await supabase
        .from('photo_evidence')
        .upsert(metadata);

      if (error) {
        console.warn('Failed to save photo metadata to Supabase:', error);
      }
    } catch (error) {
      console.warn('Supabase not configured for photo metadata:', error);
    }
  }

  // Process upload queue (retry failed uploads)
  async processUploadQueue(): Promise<void> {
    const pendingUploads = await photoDb.uploadQueue
      .where('attempts')
      .below(3) // Max 3 attempts
      .toArray();

    for (const queueItem of pendingUploads) {
      const photo = await this.getPhoto(queueItem.photoId);
      
      if (photo && photo.uploadStatus !== 'uploaded') {
        // Don't retry too frequently
        const lastAttempt = queueItem.lastAttempt ? new Date(queueItem.lastAttempt) : new Date(0);
        const minutesSinceLastAttempt = (Date.now() - lastAttempt.getTime()) / (1000 * 60);
        
        if (minutesSinceLastAttempt >= 5) { // Wait at least 5 minutes between attempts
          await this.uploadPhoto(queueItem.photoId);
        }
      }
    }
  }

  // Get upload statistics
  async getUploadStats(): Promise<{
    total: number;
    uploaded: number;
    pending: number;
    error: number;
    uploading: number;
  }> {
    const allPhotos = await photoDb.photos.toArray();
    
    return {
      total: allPhotos.length,
      uploaded: allPhotos.filter(p => p.uploadStatus === 'uploaded').length,
      pending: allPhotos.filter(p => p.uploadStatus === 'pending').length,
      error: allPhotos.filter(p => p.uploadStatus === 'error').length,
      uploading: allPhotos.filter(p => p.uploadStatus === 'uploading').length
    };
  }

  // Bulk upload all pending photos
  async uploadAllPending(): Promise<void> {
    const pendingPhotos = await photoDb.photos
      .where('uploadStatus')
      .equals('pending')
      .toArray();

    const uploadPromises = pendingPhotos.map(photo => this.uploadPhoto(photo.id));
    await Promise.allSettled(uploadPromises);
  }

  // Clean up old photos (optional - for storage management)
  async cleanupOldPhotos(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const oldPhotos = await photoDb.photos
      .where('timestamp')
      .below(cutoffDate.toISOString())
      .and(photo => photo.uploadStatus === 'uploaded')
      .toArray();

    for (const photo of oldPhotos) {
      // Only delete if successfully uploaded
      if (photo.uploadStatus === 'uploaded') {
        await photoDb.photos.delete(photo.id);
      }
    }
  }

  // Get photos for PDF generation
  async getPhotosForPDF(formId: string): Promise<{
    before: {
      exterior: PhotoEvidence[];
      interior: PhotoEvidence[];
      details: PhotoEvidence[];
    };
    after: {
      exterior: PhotoEvidence[];
      interior: PhotoEvidence[];
      details: PhotoEvidence[];
    };
  }> {
    const photos = await this.getPhotosByForm(formId);
    
    return {
      before: {
        exterior: photos.filter(p => p.type === 'before' && p.category === 'exterior'),
        interior: photos.filter(p => p.type === 'before' && p.category === 'interior'),
        details: photos.filter(p => p.type === 'before' && p.category === 'details')
      },
      after: {
        exterior: photos.filter(p => p.type === 'after' && p.category === 'exterior'),
        interior: photos.filter(p => p.type === 'after' && p.category === 'interior'),
        details: photos.filter(p => p.type === 'after' && p.category === 'details')
      }
    };
  }

  // Export photos for backup
  async exportPhotos(formId?: string): Promise<PhotoEvidence[]> {
    if (formId) {
      return await this.getPhotosByForm(formId);
    }
    return await photoDb.photos.toArray();
  }

  // Import photos from backup
  async importPhotos(photos: PhotoEvidence[]): Promise<void> {
    for (const photo of photos) {
      await this.savePhoto(photo);
    }
  }

  // Generate photo summary for form
  async getPhotoSummary(formId: string): Promise<{
    totalPhotos: number;
    beforePhotos: number;
    afterPhotos: number;
    categorySummary: {
      exterior: { before: number; after: number };
      interior: { before: number; after: number };
      details: { before: number; after: number };
    };
    uploadStatus: {
      uploaded: number;
      pending: number;
      error: number;
    };
  }> {
    const photos = await this.getPhotosByForm(formId);
    
    return {
      totalPhotos: photos.length,
      beforePhotos: photos.filter(p => p.type === 'before').length,
      afterPhotos: photos.filter(p => p.type === 'after').length,
      categorySummary: {
        exterior: {
          before: photos.filter(p => p.type === 'before' && p.category === 'exterior').length,
          after: photos.filter(p => p.type === 'after' && p.category === 'exterior').length
        },
        interior: {
          before: photos.filter(p => p.type === 'before' && p.category === 'interior').length,
          after: photos.filter(p => p.type === 'after' && p.category === 'interior').length
        },
        details: {
          before: photos.filter(p => p.type === 'before' && p.category === 'details').length,
          after: photos.filter(p => p.type === 'after' && p.category === 'details').length
        }
      },
      uploadStatus: {
        uploaded: photos.filter(p => p.uploadStatus === 'uploaded').length,
        pending: photos.filter(p => p.uploadStatus === 'pending').length,
        error: photos.filter(p => p.uploadStatus === 'error').length
      }
    };
  }
}

export const photoEvidenceService = new PhotoEvidenceService();

// Auto-sync when coming online
export const setupPhotoAutoSync = () => {
  const handleOnline = () => {
    console.log('Device came online, processing photo upload queue...');
    photoEvidenceService.processUploadQueue();
  };

  const handleVisibilityChange = () => {
    if (!document.hidden) {
      // App became visible, process queue
      photoEvidenceService.processUploadQueue();
    }
  };

  window.addEventListener('online', handleOnline);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Process queue every 10 minutes
  const interval = setInterval(() => {
    if (navigator.onLine) {
      photoEvidenceService.processUploadQueue();
    }
  }, 10 * 60 * 1000);

  return () => {
    window.removeEventListener('online', handleOnline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(interval);
  };
};
