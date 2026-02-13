import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

// ==================== INTERFACES ====================

export interface Certification {
  id: string;
  vendorId: string;
  name: string;
  type: string; // GI_TAG, QUALITY, SUSTAINABILITY, ORGANIC, HANDLOOM, HANDICRAFT, OTHER
  description: string;
  issuingAuthority: string;
  certificateNumber: string;
  validityStart: string;
  validityEnd: string;
  status: string; // ACTIVE, PENDING, EXPIRED, EXPIRING_SOON, REJECTED
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
  documentUrl: string;
  documentUrls: string[];
  verificationId: string;
  verificationUrl: string;
  applicableProductIds: string[];
  applicableCategories: string[];
  productCount: number;
  verified: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificationSummary {
  vendorId: string;
  totalCertifications: number;
  activeCertifications: number;
  pendingCertifications: number;
  expiredCertifications: number;
  expiringSoon: number;
  trustScore: number;
  productCoverage: number;
  hasGiTag: boolean;
  giTagCertification?: Certification;
  giTagCount: number;
  qualityCount: number;
  sustainabilityCount: number;
  organicCount: number;
  handloomCount: number;
  otherCount: number;
  certifiedProductsCount: number;
  totalProductsCount: number;
  certificationCoveragePercent: number;
  certifications: Certification[];
  alerts: CertificationAlert[];
}

export interface CertificationAlert {
  id: string;
  certificationName: string;
  type: string; // EXPIRING, EXPIRED, PENDING_REVIEW
  severity: string; // CRITICAL, WARNING, INFO
  message: string;
  daysRemaining: number;
}

export interface CertificationRequest {
  vendorId?: string;
  name: string;
  type: string;
  description: string;
  issuingAuthority: string;
  certificateNumber: string;
  issuedDate: string;
  expiryDate: string;
  documentUrls: string[];
  verificationUrl?: string;
  applicableProductIds: string[];
  applicableCategories: string[];
}

export interface CertificationType {
  type: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class CertificationService {

  private readonly apiUrl = `${environment.apiUrl}/odop/certifications`;

  // State management
  private summarySubject = new BehaviorSubject<CertificationSummary | null>(null);
  public summary$ = this.summarySubject.asObservable();

  private certificationsSubject = new BehaviorSubject<Certification[]>([]);
  public certifications$ = this.certificationsSubject.asObservable();

  private alertsSubject = new BehaviorSubject<CertificationAlert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== SUMMARY & LIST ====================

  /**
   * Get certification summary for a vendor
   */
  getCertificationSummary(vendorId: string): Observable<CertificationSummary> {
    this.loadingSubject.next(true);
    return this.http.get<CertificationSummary>(`${this.apiUrl}/vendor/${vendorId}/summary`)
      .pipe(
        tap(summary => {
          this.summarySubject.next(summary);
          this.certificationsSubject.next(summary.certifications);
          this.alertsSubject.next(summary.alerts);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Get all certifications for a vendor (optionally filtered by status)
   */
  getVendorCertifications(vendorId: string, status?: string): Observable<Certification[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Certification[]>(`${this.apiUrl}/vendor/${vendorId}`, { params })
      .pipe(
        tap(certifications => this.certificationsSubject.next(certifications))
      );
  }

  /**
   * Get a single certification by ID
   */
  getCertificationById(certificationId: string): Observable<Certification> {
    return this.http.get<Certification>(`${this.apiUrl}/${certificationId}`);
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create/apply for a new certification
   */
  createCertification(vendorId: string, request: CertificationRequest): Observable<Certification> {
    request.vendorId = vendorId;
    return this.http.post<Certification>(`${this.apiUrl}/vendor/${vendorId}`, request)
      .pipe(
        tap(certification => {
          const current = this.certificationsSubject.getValue();
          this.certificationsSubject.next([certification, ...current]);
        })
      );
  }

  /**
   * Update an existing certification
   */
  updateCertification(certificationId: string, request: CertificationRequest): Observable<Certification> {
    return this.http.put<Certification>(`${this.apiUrl}/${certificationId}`, request)
      .pipe(
        tap(updated => {
          const current = this.certificationsSubject.getValue();
          const index = current.findIndex(c => c.id === certificationId);
          if (index !== -1) {
            current[index] = updated;
            this.certificationsSubject.next([...current]);
          }
        })
      );
  }

  /**
   * Delete a certification
   */
  deleteCertification(certificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${certificationId}`)
      .pipe(
        tap(() => {
          const current = this.certificationsSubject.getValue();
          this.certificationsSubject.next(current.filter(c => c.id !== certificationId));
        })
      );
  }

  /**
   * Renew an expired/expiring certification
   */
  renewCertification(certificationId: string): Observable<Certification> {
    return this.http.post<Certification>(`${this.apiUrl}/${certificationId}/renew`, {})
      .pipe(
        tap(renewed => {
          const current = this.certificationsSubject.getValue();
          this.certificationsSubject.next([renewed, ...current]);
        })
      );
  }

  // ==================== PRODUCT CERTIFICATIONS ====================

  /**
   * Get certifications for a specific product
   */
  getProductCertifications(productId: string): Observable<Certification[]> {
    return this.http.get<Certification[]>(`${this.apiUrl}/product/${productId}`);
  }

  // ==================== CERTIFICATION TYPES ====================

  /**
   * Get available certification types
   */
  getCertificationTypes(): Observable<CertificationType[]> {
    return this.http.get<CertificationType[]>(`${this.apiUrl}/types`);
  }

  /**
   * Get static certification types (fallback)
   */
  getStaticCertificationTypes(): CertificationType[] {
    return [
      { type: 'GI_TAG', label: 'GI Tag Certificate', icon: 'fa-map-marker-alt', color: '#f59e0b', description: 'Geographical Indication certification for authentic regional products' },
      { type: 'QUALITY', label: 'Quality Certification', icon: 'fa-check-circle', color: '#10b981', description: 'ISO or other quality management certifications' },
      { type: 'SUSTAINABILITY', label: 'Sustainability Certificate', icon: 'fa-leaf', color: '#059669', description: 'Environmental sustainability and eco-friendly certifications' },
      { type: 'ORGANIC', label: 'Organic Certification', icon: 'fa-seedling', color: '#22c55e', description: 'Organic product certification' },
      { type: 'HANDLOOM', label: 'Handloom Mark', icon: 'fa-scroll', color: '#8b5cf6', description: 'Handloom Board certification for authentic handwoven products' },
      { type: 'HANDICRAFT', label: 'Handicraft Mark', icon: 'fa-hand-holding-heart', color: '#ec4899', description: 'Handicraft certification for authentic handcrafted products' },
      { type: 'OTHER', label: 'Other Certification', icon: 'fa-certificate', color: '#6b7280', description: 'Other relevant certifications' }
    ];
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'status-success',
      'PENDING': 'status-warning',
      'EXPIRED': 'status-error',
      'REJECTED': 'status-error'
    };
    return statusMap[status] || 'status-default';
  }

  /**
   * Get type icon
   */
  getTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'GI_TAG': 'fas fa-map-marker-alt',
      'QUALITY': 'fas fa-award',
      'SUSTAINABILITY': 'fas fa-leaf',
      'ORGANIC': 'fas fa-seedling',
      'HANDLOOM': 'fas fa-scroll',
      'HANDICRAFT': 'fas fa-hand-holding-heart',
      'OTHER': 'fas fa-certificate'
    };
    return iconMap[type] || 'fas fa-certificate';
  }

  /**
   * Get type display name
   */
  getTypeName(type: string): string {
    const types = this.getStaticCertificationTypes();
    const found = types.find(t => t.type === type);
    return found ? found.label : type;
  }

  /**
   * Format expiry text
   */
  getExpiryText(certification: Certification): string {
    if (certification.status === 'EXPIRED') {
      return 'Expired';
    }
    if (certification.isExpiringSoon) {
      return `Expires in ${certification.daysUntilExpiry} days`;
    }
    if (certification.validityEnd) {
      return `Valid until ${new Date(certification.validityEnd).toLocaleDateString('en-IN')}`;
    }
    return 'No expiry';
  }

  /**
   * Check if certification has critical alerts
   */
  hasCriticalAlerts(): boolean {
    const alerts = this.alertsSubject.getValue();
    return alerts.some(a => a.type === 'EXPIRED' || (a.type === 'EXPIRING' && a.daysRemaining <= 7));
  }

  /**
   * Get alert count by type
   */
  getAlertCount(type: string): number {
    const alerts = this.alertsSubject.getValue();
    return alerts.filter(a => a.type === type).length;
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.summarySubject.next(null);
    this.certificationsSubject.next([]);
    this.alertsSubject.next([]);
  }
}
