import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent, HttpRequest } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, map, filter } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Bulk upload interfaces
 */
export interface BulkUploadJob {
  jobId: string;
  vendorId: string;
  originalFileName: string;
  uploadType: string;
  status: 'PENDING' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED' | 'CANCELLED';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  progressPercent: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  processingTimeSeconds: number;
  errors?: RowError[];
  totalErrors: number;
  hasMoreErrors: boolean;
}

export interface RowError {
  rowNumber: number;
  errorMessage: string;
  errorType: 'VALIDATION' | 'DUPLICATE' | 'SYSTEM';
  rowData?: { [key: string]: string };
}

export interface TemplateColumn {
  name: string;
  displayName: string;
  dataType: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  allowedValues?: string[];
  example: string;
}

export interface UploadTemplate {
  uploadType: string;
  description: string;
  requiredColumns: TemplateColumn[];
  optionalColumns: TemplateColumn[];
  sampleCsvContent: string;
}

export interface PreviewResult {
  success: boolean;
  headers: string[];
  previewRows: { [key: string]: string }[];
  totalRows: number;
  previewCount: number;
  errors?: string[];
}

export interface UploadProgress {
  jobId: string;
  status: string;
  progress: number;
  successCount: number;
  errorCount: number;
  message?: string;
}

/**
 * Service for bulk upload operations
 */
@Injectable({
  providedIn: 'root'
})
export class BulkUploadService {
  
  private apiUrl = `${environment.apiUrl}/odop/bulk-upload`;
  
  // Progress tracking for active uploads
  private activeUploads = new Map<string, BehaviorSubject<UploadProgress>>();
  private pollingIntervals = new Map<string, any>();

  constructor(private http: HttpClient) { }

  // ==================== FILE OPERATIONS ====================

  /**
   * Preview CSV file before upload
   */
  previewFile(file: File, hasHeader: boolean = true, maxRows: number = 10): Observable<PreviewResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hasHeader', String(hasHeader));
    formData.append('maxRows', String(maxRows));
    
    return this.http.post<PreviewResult>(`${this.apiUrl}/preview`, formData);
  }

  /**
   * Upload CSV file for processing
   */
  uploadFile(
    file: File,
    uploadType: string,
    options: {
      updateExisting?: boolean;
      skipInvalid?: boolean;
      generateSkus?: boolean;
      hasHeader?: boolean;
      defaultCategoryId?: string;
    } = {}
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadType', uploadType);
    formData.append('updateExisting', String(options.updateExisting ?? false));
    formData.append('skipInvalid', String(options.skipInvalid ?? true));
    formData.append('generateSkus', String(options.generateSkus ?? true));
    formData.append('hasHeader', String(options.hasHeader ?? true));
    
    if (options.defaultCategoryId) {
      formData.append('defaultCategoryId', options.defaultCategoryId);
    }
    
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Upload with progress tracking
   */
  uploadFileWithProgress(
    file: File,
    uploadType: string,
    options: any = {}
  ): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadType', uploadType);
    formData.append('updateExisting', String(options.updateExisting ?? false));
    formData.append('skipInvalid', String(options.skipInvalid ?? true));
    formData.append('generateSkus', String(options.generateSkus ?? true));
    formData.append('hasHeader', String(options.hasHeader ?? true));
    
    if (options.defaultCategoryId) {
      formData.append('defaultCategoryId', options.defaultCategoryId);
    }
    
    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true
    });
    
    return this.http.request(req);
  }

  // ==================== JOB MANAGEMENT ====================

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Observable<BulkUploadJob> {
    return this.http.get<BulkUploadJob>(`${this.apiUrl}/job/${jobId}`);
  }

  /**
   * Get vendor's upload history
   */
  getJobHistory(page: number = 0, size: number = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}/jobs`, {
      params: { page: String(page), size: String(size) }
    });
  }

  /**
   * Cancel a running job
   */
  cancelJob(jobId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/job/${jobId}/cancel`, {});
  }

  /**
   * Start polling for job progress
   */
  startProgressPolling(jobId: string, intervalMs: number = 2000): Observable<UploadProgress> {
    // Create subject if not exists
    if (!this.activeUploads.has(jobId)) {
      this.activeUploads.set(jobId, new BehaviorSubject<UploadProgress>({
        jobId,
        status: 'PENDING',
        progress: 0,
        successCount: 0,
        errorCount: 0
      }));
    }
    
    // Start polling if not already
    if (!this.pollingIntervals.has(jobId)) {
      const interval = setInterval(() => {
        this.getJobStatus(jobId).subscribe({
          next: (job) => {
            const subject = this.activeUploads.get(jobId);
            if (subject) {
              subject.next({
                jobId: job.jobId,
                status: job.status,
                progress: job.progressPercent,
                successCount: job.successCount,
                errorCount: job.errorCount,
                message: this.getStatusMessage(job)
              });
              
              // Stop polling if job is complete
              if (!this.isJobRunning(job.status)) {
                this.stopProgressPolling(jobId);
              }
            }
          },
          error: () => {
            this.stopProgressPolling(jobId);
          }
        });
      }, intervalMs);
      
      this.pollingIntervals.set(jobId, interval);
    }
    
    return this.activeUploads.get(jobId)!.asObservable();
  }

  /**
   * Stop polling for job progress
   */
  stopProgressPolling(jobId: string): void {
    const interval = this.pollingIntervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(jobId);
    }
  }

  // ==================== TEMPLATES ====================

  /**
   * Get all available template types
   */
  getTemplateTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/templates`);
  }

  /**
   * Get template information
   */
  getTemplate(uploadType: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/template/${uploadType}`);
  }

  /**
   * Download template CSV file
   */
  downloadTemplate(uploadType: string): void {
    const url = `${this.apiUrl}/template/${uploadType}/download`;
    
    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${uploadType.toLowerCase()}_template.csv`;
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
    });
  }

  // ==================== HELPER METHODS ====================

  /**
   * Check if job is still running
   */
  isJobRunning(status: string): boolean {
    return ['PENDING', 'VALIDATING', 'PROCESSING'].includes(status);
  }

  /**
   * Get human-readable status message
   */
  getStatusMessage(job: BulkUploadJob): string {
    switch (job.status) {
      case 'PENDING':
        return 'Waiting to start...';
      case 'VALIDATING':
        return 'Validating file...';
      case 'PROCESSING':
        return `Processing: ${job.processedRows}/${job.totalRows} rows`;
      case 'COMPLETED':
        return `Completed! ${job.successCount} items imported`;
      case 'COMPLETED_WITH_ERRORS':
        return `Completed with ${job.errorCount} errors`;
      case 'FAILED':
        return 'Upload failed';
      case 'CANCELLED':
        return 'Upload cancelled';
      default:
        return job.status;
    }
  }

  /**
   * Get status color class
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'COMPLETED_WITH_ERRORS':
        return 'warning';
      case 'FAILED':
      case 'CANCELLED':
        return 'error';
      case 'PROCESSING':
      case 'VALIDATING':
        return 'info';
      default:
        return 'default';
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format processing time
   */
  formatProcessingTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'];
    
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }
    
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension !== 'csv' && !allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only CSV files are allowed' };
    }
    
    return { valid: true };
  }

  /**
   * Generate column mapping suggestions based on headers
   */
  suggestColumnMapping(headers: string[], uploadType: string): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    
    // Common field mappings
    const fieldMappings: { [key: string]: string[] } = {
      product_name: ['product_name', 'name', 'productname', 'product name', 'title'],
      price: ['price', 'selling_price', 'sellingprice', 'cost'],
      stock_quantity: ['stock', 'quantity', 'stock_quantity', 'inventory', 'qty'],
      description: ['description', 'desc', 'product_description', 'details'],
      category_id: ['category', 'category_id', 'categoryid', 'cat_id'],
      image_url: ['image', 'image_url', 'imageurl', 'photo', 'picture'],
      tags: ['tags', 'keywords', 'labels'],
      sku: ['sku', 'product_code', 'code', 'item_code'],
      discount: ['discount', 'discount_percent', 'sale'],
      size: ['size', 'variant_size'],
      color: ['color', 'colour', 'variant_color'],
      identifier: ['id', 'product_id', 'variant_id', 'sku', 'identifier'],
      new_price: ['new_price', 'price', 'updated_price'],
      quantity: ['quantity', 'stock', 'qty', 'new_quantity']
    };
    
    // Try to match each header to a field
    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim().replace(/\s+/g, '_');
      
      for (const [field, variations] of Object.entries(fieldMappings)) {
        if (variations.includes(normalizedHeader)) {
          mapping[field] = header;
          break;
        }
      }
    });
    
    return mapping;
  }
}
