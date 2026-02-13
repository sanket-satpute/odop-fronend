import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalVariable } from '../global/global';

export type EntityType = 'product' | 'vendor' | 'customer' | 'category';

export interface ImageMetadata {
  imageId: string;
  publicId: string;
  url: string;
  secureUrl: string;
  entityType: EntityType;
  entityId: string;
  isPrimary: boolean;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  createdAt: string;
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  imageMetadata?: ImageMetadata;
}

export interface MultipleUploadResponse {
  success: boolean;
  message: string;
  uploaded: ImageMetadata[];
  failed: string[];
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'images';

  constructor(private http: HttpClient) { }

  // ============== UPLOAD ==============

  /**
   * Upload a single image
   */
  uploadImage(file: File, entityType: EntityType, entityId: string, isPrimary: boolean = false): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('isPrimary', isPrimary.toString());

    return this.http.post<ImageUploadResponse>(`${this.baseUrl}/upload`, formData);
  }

  /**
   * Upload multiple images
   */
  uploadMultipleImages(files: File[], entityType: EntityType, entityId: string): Observable<MultipleUploadResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    return this.http.post<MultipleUploadResponse>(`${this.baseUrl}/upload-multiple`, formData);
  }

  // ============== ENTITY-SPECIFIC UPLOADS ==============

  /**
   * Upload product image
   */
  uploadProductImage(file: File, productId: string, isPrimary: boolean = false): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', isPrimary.toString());

    return this.http.post<ImageUploadResponse>(`${this.baseUrl}/product/${productId}`, formData);
  }

  /**
   * Upload vendor profile/shop image
   */
  uploadVendorImage(file: File, vendorId: string): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImageUploadResponse>(`${this.baseUrl}/vendor/${vendorId}`, formData);
  }

  /**
   * Upload customer profile image
   */
  uploadCustomerImage(file: File, customerId: string): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImageUploadResponse>(`${this.baseUrl}/customer/${customerId}`, formData);
  }

  /**
   * Upload category image
   */
  uploadCategoryImage(file: File, categoryId: string): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImageUploadResponse>(`${this.baseUrl}/category/${categoryId}`, formData);
  }

  // ============== GET IMAGES ==============

  /**
   * Get all images for an entity
   */
  getImagesForEntity(entityType: EntityType, entityId: string): Observable<ImageMetadata[]> {
    return this.http.get<ImageMetadata[]>(`${this.baseUrl}/${entityType}/${entityId}`);
  }

  /**
   * Get primary image for an entity
   */
  getPrimaryImage(entityType: EntityType, entityId: string): Observable<ImageMetadata> {
    return this.http.get<ImageMetadata>(`${this.baseUrl}/${entityType}/${entityId}/primary`);
  }

  // ============== DELETE ==============

  /**
   * Delete an image by public ID
   */
  deleteImage(publicId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${encodeURIComponent(publicId)}`);
  }

  /**
   * Delete all images for an entity
   */
  deleteAllImagesForEntity(entityType: EntityType, entityId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${entityType}/${entityId}/all`);
  }

  // ============== UPDATE ==============

  /**
   * Set an image as primary
   */
  setImageAsPrimary(imageId: string): Observable<ImageMetadata> {
    return this.http.put<ImageMetadata>(`${this.baseUrl}/${imageId}/set-primary`, {});
  }

  // ============== TRANSFORM ==============

  /**
   * Get transformed image URL
   */
  getTransformedImageUrl(publicId: string, options: ImageTransformOptions): Observable<string> {
    const params = new URLSearchParams();
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.crop) params.append('crop', options.crop);
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.format) params.append('format', options.format);

    return this.http.get(`${this.baseUrl}/transform?publicId=${encodeURIComponent(publicId)}&${params.toString()}`, 
      { responseType: 'text' });
  }

  // ============== HEALTH CHECK ==============

  /**
   * Check if image service is healthy
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // ============== HELPER METHODS ==============

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeMB: number = 5, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): { valid: boolean; error?: string } {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { valid: false, error: `File too large. Maximum size: ${maxSizeMB}MB` };
    }

    return { valid: true };
  }

  /**
   * Create preview URL for a file
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke preview URL to free memory
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Get thumbnail URL (with Cloudinary transformation)
   */
  getThumbnailUrl(imageUrl: string, width: number = 150, height: number = 150): string {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return imageUrl;
    }
    
    // Insert transformation before /upload/
    return imageUrl.replace('/upload/', `/upload/c_fill,w_${width},h_${height}/`);
  }

  /**
   * Get optimized URL for display
   */
  getOptimizedUrl(imageUrl: string, width?: number): string {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return imageUrl;
    }
    
    let transformation = 'f_auto,q_auto';
    if (width) {
      transformation += `,w_${width}`;
    }
    
    return imageUrl.replace('/upload/', `/upload/${transformation}/`);
  }
}
