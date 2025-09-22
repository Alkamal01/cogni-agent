// Cloudinary Image Upload Service
// Handles image uploads to Cloudinary and returns public URLs

const CLOUDINARY_CLOUD_NAME = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = (import.meta as any).env?.VITE_CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = (import.meta as any).env?.VITE_CLOUDINARY_API_SECRET || '';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

class CloudinaryService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = CLOUDINARY_CLOUD_NAME;
    this.apiKey = CLOUDINARY_API_KEY;
    this.apiSecret = CLOUDINARY_API_SECRET;
  }

  // Upload image file to Cloudinary
  async uploadImage(file: File, folder: string = 'cogniedufy/tutors'): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    const preset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
    formData.append('upload_preset', preset);
    formData.append('folder', folder);
    formData.append('cloud_name', this.cloudName);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }

  // Upload image from base64 data URL
  async uploadImageFromDataUrl(dataUrl: string, fileName: string, folder: string = 'cogniedufy/tutors'): Promise<CloudinaryUploadResult> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: blob.type });
    return await this.uploadImage(file, folder);
  }

  // Delete image from Cloudinary
  async deleteImage(publicId: string): Promise<void> {
    // Usually deletion should be done server-side to protect API secret.
    // If you have a backend route, call it instead of direct Cloudinary destroy.
    console.warn('deleteImage should be handled by the backend for security');
  }

  // Generate optimized image URL with transformations
  getOptimizedImageUrl(publicId: string, width: number = 300, height: number = 300, quality: string = 'auto'): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/w_${width},h_${height},c_fill,q_${quality},f_auto/${publicId}`;
  }

  // Generate thumbnail URL
  getThumbnailUrl(publicId: string, size: number = 100): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/w_${size},h_${size},c_fill,q_auto,f_auto/${publicId}`;
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;


