import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Verification Status Enum
 */
export enum VerificationStatus {
  NOT_STARTED = 'NOT_STARTED',
  DOCUMENTS_PENDING = 'DOCUMENTS_PENDING',
  DOCUMENTS_SUBMITTED = 'DOCUMENTS_SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',
  GI_TAG_PENDING = 'GI_TAG_PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

/**
 * Document Type Enum
 */
export enum DocumentType {
  PAN_CARD = 'PAN_CARD',
  AADHAAR_CARD = 'AADHAAR_CARD',
  GSTIN_CERTIFICATE = 'GSTIN_CERTIFICATE',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  SHOP_ESTABLISHMENT_LICENSE = 'SHOP_ESTABLISHMENT_LICENSE',
  FSSAI_LICENSE = 'FSSAI_LICENSE',
  GI_TAG_CERTIFICATE = 'GI_TAG_CERTIFICATE',
  ARTISAN_CARD = 'ARTISAN_CARD',
  BANK_STATEMENT = 'BANK_STATEMENT',
  CANCELLED_CHEQUE = 'CANCELLED_CHEQUE',
  ADDRESS_PROOF = 'ADDRESS_PROOF',
  SHOP_PHOTO = 'SHOP_PHOTO',
  PRODUCT_SAMPLES = 'PRODUCT_SAMPLES'
}

/**
 * Interface for verification step status
 */
export interface StepStatus {
  stepName: string;
  stepDisplayName: string;
  completed: boolean;
  current: boolean;
  completedAt?: Date;
  icon: string;
}

/**
 * Interface for document status
 */
export interface DocumentStatusDto {
  documentType: string;
  documentDisplayName: string;
  required: boolean;
  uploaded: boolean;
  status: string;
  statusDisplayName: string;
  documentUrl?: string;
  rejectionReason?: string;
}

/**
 * Interface for GI tag status
 */
export interface GiTagStatusDto {
  applicable: boolean;
  submitted: boolean;
  verified: boolean;
  giTagNumber?: string;
  productCategory?: string;
  expiryDate?: Date;
}

/**
 * Interface for verification status response
 */
export interface VerificationStatusResponse {
  vendorId: string;
  vendorName: string;
  status: string;
  statusDisplayName: string;
  statusMessage: string;
  completionPercentage: number;
  steps: StepStatus[];
  documents: DocumentStatusDto[];
  missingDocuments: string[];
  giTagStatus?: GiTagStatusDto;
  submittedAt?: Date;
  lastUpdatedAt?: Date;
  estimatedCompletionDate?: Date;
  rejectionReason?: string;
  actionRequired?: string[];
}

/**
 * Interface for verification statistics
 */
export interface VerificationStats {
  pending: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
}

/**
 * Interface for required document info
 */
export interface RequiredDocument {
  type: string;
  displayName: string;
  required: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VendorVerificationService {
  private apiUrl = `${environment.apiUrl}/odop/verification`;

  constructor(private http: HttpClient) { }

  // ============================================
  // VENDOR METHODS
  // ============================================

  /**
   * Start verification process for a vendor
   */
  startVerification(vendorId: string): Observable<VerificationStatusResponse> {
    return this.http.post<VerificationStatusResponse>(
      `${this.apiUrl}/start/${vendorId}`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformResponse),
      catchError(this.handleError)
    );
  }

  /**
   * Get verification status for a vendor
   */
  getVerificationStatus(vendorId: string): Observable<VerificationStatusResponse> {
    return this.http.get<VerificationStatusResponse>(
      `${this.apiUrl}/status/${vendorId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformResponse),
      catchError(this.handleError)
    );
  }

  /**
   * Upload a verification document
   */
  uploadDocument(
    vendorId: string,
    documentType: DocumentType,
    file: File,
    documentNumber?: string
  ): Observable<VerificationStatusResponse> {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    if (documentNumber) {
      formData.append('documentNumber', documentNumber);
    }

    return this.http.post<VerificationStatusResponse>(
      `${this.apiUrl}/${vendorId}/document`,
      formData,
      { headers: this.getAuthHeadersForUpload() }
    ).pipe(
      map(this.transformResponse),
      catchError(this.handleError)
    );
  }

  /**
   * Submit verification for review
   */
  submitForReview(vendorId: string): Observable<VerificationStatusResponse> {
    return this.http.post<VerificationStatusResponse>(
      `${this.apiUrl}/${vendorId}/submit`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformResponse),
      catchError(this.handleError)
    );
  }

  /**
   * Get list of required documents
   */
  getRequiredDocuments(): Observable<RequiredDocument[]> {
    return this.http.get<RequiredDocument[]>(`${this.apiUrl}/required-documents`);
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  /**
   * Get all pending verifications (Admin)
   */
  getPendingVerifications(): Observable<VerificationStatusResponse[]> {
    return this.http.get<VerificationStatusResponse[]>(
      `${this.apiUrl}/admin/pending`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(responses => responses.map(this.transformResponse)),
      catchError(this.handleError)
    );
  }

  /**
   * Get verification statistics (Admin)
   */
  getVerificationStats(): Observable<VerificationStats> {
    return this.http.get<VerificationStats>(
      `${this.apiUrl}/admin/stats`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Start reviewing a verification (Admin)
   */
  startReview(vendorId: string, adminId: string, adminName: string): Observable<VerificationStatusResponse> {
    return this.http.post<VerificationStatusResponse>(
      `${this.apiUrl}/admin/review/${vendorId}`,
      { adminId, adminName },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformResponse),
      catchError(this.handleError)
    );
  }

  /**
   * Verify a specific document (Admin)
   */
  verifyDocument(
    vendorId: string,
    documentId: string,
    approved: boolean,
    adminId: string,
    rejectionReason?: string
  ): Observable<VerificationStatusResponse> {
    return this.http.post<VerificationStatusResponse>(
      `${this.apiUrl}/admin/verify-document/${vendorId}/${documentId}`,
      { approved, rejectionReason, adminId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformResponse),
      catchError(this.handleError)
    );
  }

  /**
   * Approve vendor verification (Admin)
   */
  approveVerification(
    vendorId: string,
    adminId: string,
    notes?: string,
    qualityScore?: number,
    trustScore?: number
  ): Observable<VerificationStatusResponse> {
    return this.http.post<VerificationStatusResponse>(
      `${this.apiUrl}/admin/approve/${vendorId}`,
      { adminId, notes, qualityScore, trustScore },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformResponse),
      catchError(this.handleError)
    );
  }

  /**
   * Reject vendor verification (Admin)
   */
  rejectVerification(
    vendorId: string,
    adminId: string,
    reason: string,
    documentIssues?: string[]
  ): Observable<VerificationStatusResponse> {
    return this.http.post<VerificationStatusResponse>(
      `${this.apiUrl}/admin/reject/${vendorId}`,
      { adminId, reason, documentIssues },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformResponse),
      catchError(this.handleError)
    );
  }

  /**
   * Request additional information (Admin)
   */
  requestAdditionalInfo(
    vendorId: string,
    adminId: string,
    requiredItems: string[]
  ): Observable<VerificationStatusResponse> {
    return this.http.post<VerificationStatusResponse>(
      `${this.apiUrl}/admin/request-info/${vendorId}`,
      { adminId, requiredItems },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformResponse),
      catchError(this.handleError)
    );
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      [VerificationStatus.NOT_STARTED]: 'grey',
      [VerificationStatus.DOCUMENTS_PENDING]: 'orange',
      [VerificationStatus.DOCUMENTS_SUBMITTED]: 'blue',
      [VerificationStatus.UNDER_REVIEW]: 'purple',
      [VerificationStatus.ADDITIONAL_INFO_REQUIRED]: 'yellow',
      [VerificationStatus.GI_TAG_PENDING]: 'cyan',
      [VerificationStatus.APPROVED]: 'green',
      [VerificationStatus.REJECTED]: 'red',
      [VerificationStatus.SUSPENDED]: 'black'
    };
    return colorMap[status] || 'grey';
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      [VerificationStatus.NOT_STARTED]: 'hourglass_empty',
      [VerificationStatus.DOCUMENTS_PENDING]: 'upload_file',
      [VerificationStatus.DOCUMENTS_SUBMITTED]: 'pending',
      [VerificationStatus.UNDER_REVIEW]: 'rate_review',
      [VerificationStatus.ADDITIONAL_INFO_REQUIRED]: 'info',
      [VerificationStatus.GI_TAG_PENDING]: 'verified',
      [VerificationStatus.APPROVED]: 'check_circle',
      [VerificationStatus.REJECTED]: 'cancel',
      [VerificationStatus.SUSPENDED]: 'block'
    };
    return iconMap[status] || 'help';
  }

  /**
   * Validate document before upload
   */
  validateDocument(file: File, documentType: DocumentType): string | null {
    const maxSizeMB = 5;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Allowed: PDF, JPEG, PNG';
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  }

  /**
   * Get document type display name
   */
  getDocumentDisplayName(type: string): string {
    const displayNames: Record<string, string> = {
      [DocumentType.PAN_CARD]: 'PAN Card',
      [DocumentType.AADHAAR_CARD]: 'Aadhaar Card',
      [DocumentType.GSTIN_CERTIFICATE]: 'GSTIN Certificate',
      [DocumentType.BUSINESS_LICENSE]: 'Business License',
      [DocumentType.SHOP_ESTABLISHMENT_LICENSE]: 'Shop Establishment License',
      [DocumentType.FSSAI_LICENSE]: 'FSSAI License',
      [DocumentType.GI_TAG_CERTIFICATE]: 'GI Tag Certificate',
      [DocumentType.ARTISAN_CARD]: 'Artisan Card',
      [DocumentType.BANK_STATEMENT]: 'Bank Statement',
      [DocumentType.CANCELLED_CHEQUE]: 'Cancelled Cheque',
      [DocumentType.ADDRESS_PROOF]: 'Address Proof',
      [DocumentType.SHOP_PHOTO]: 'Shop Photo',
      [DocumentType.PRODUCT_SAMPLES]: 'Product Samples'
    };
    return displayNames[type] || type;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private getAuthHeaders(): HttpHeaders {
    const token = this.getStoredToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getAuthHeadersForUpload(): HttpHeaders {
    const token = this.getStoredToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Note: Don't set Content-Type for FormData - browser will set it automatically
    });
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('jwt')
      || localStorage.getItem('auth_token')
      || localStorage.getItem('jwtToken')
      || localStorage.getItem('token');
  }

  private transformResponse(response: VerificationStatusResponse): VerificationStatusResponse {
    return {
      ...response,
      submittedAt: response.submittedAt ? new Date(response.submittedAt) : undefined,
      lastUpdatedAt: response.lastUpdatedAt ? new Date(response.lastUpdatedAt) : undefined,
      estimatedCompletionDate: response.estimatedCompletionDate ? new Date(response.estimatedCompletionDate) : undefined,
      steps: response.steps?.map(step => ({
        ...step,
        completedAt: step.completedAt ? new Date(step.completedAt) : undefined
      })) || []
    };
  }

  private handleError(error: any): Observable<never> {
    console.error('Verification Service Error:', error);
    let errorMessage = 'An error occurred while processing your request.';

    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.status === 404) {
      errorMessage = 'Verification not found.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
    } else if (error.status === 400) {
      errorMessage = error.error?.error || 'Invalid request.';
    }

    return throwError(() => new Error(errorMessage));
  }
}
