import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CertificationService, Certification, CertificationSummary, CertificationType, CertificationAlert } from '../../../services/certification.service';
import { UserStateService } from '../../../project/services/user-state.service';

@Component({
  selector: 'app-vendor-dashboard-certifications',
  templateUrl: './vendor-dashboard-certifications.component.html',
  styleUrls: ['./vendor-dashboard-certifications.component.css']
})
export class VendorDashboardCertificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State
  isLoading = true;
  loadError: string | null = null;
  vendorId: string = '';

  // Data
  certifications: Certification[] = [];
  summary: CertificationSummary | null = null;
  alerts: CertificationAlert[] = [];
  certificationTypes: CertificationType[] = [];

  // UI State
  filterStatus: string = 'all';
  isRefreshing = false;

  constructor(
    private certificationService: CertificationService,
    private userStateService: UserStateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get vendor ID from user state service first, then localStorage fallback
    const currentVendor = this.userStateService.vendor;
    if (currentVendor?.vendorId) {
      this.vendorId = currentVendor.vendorId;
    } else {
      const storedVendor = localStorage.getItem('vendor');
      if (storedVendor) {
        try {
          const vendor = JSON.parse(storedVendor);
          this.vendorId = vendor.vendorId || '';
        } catch (e) {
          this.vendorId = '';
        }
      }
    }

    if (this.vendorId) {
      this.loadCertificationData();
      this.loadCertificationTypes();
    } else {
      this.loadError = 'Vendor ID not found. Please log in again.';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCertificationData(): void {
    this.isLoading = true;
    this.loadError = null;

    // Load summary first
    this.certificationService.getCertificationSummary(this.vendorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
          this.alerts = summary.alerts || [];
        },
        error: (error) => {
          console.error('Error loading summary:', error);
        }
      });

    // Load certifications
    this.certificationService.getVendorCertifications(this.vendorId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.isRefreshing = false;
        })
      )
      .subscribe({
        next: (certifications) => {
          this.certifications = certifications;
        },
        error: (error) => {
          this.loadError = error.error?.message || 'Failed to load certifications';
          this.snackBar.open(this.loadError || 'Error loading data', 'Close', { duration: 4000 });
        }
      });
  }

  loadCertificationTypes(): void {
    this.certificationService.getCertificationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.certificationTypes = types;
        },
        error: (error) => {
          console.error('Error loading certification types:', error);
          // Use fallback types
          this.certificationTypes = this.getDefaultTypes();
        }
      });
  }

  getDefaultTypes(): CertificationType[] {
    return [
      { type: 'GI_TAG', label: 'GI Tag', icon: 'fa-map-marker-alt', color: '#f59e0b', description: 'Geographical Indication certification' },
      { type: 'ARTISAN', label: 'Artisan Certificate', icon: 'fa-hands', color: '#8b5cf6', description: 'Traditional craftsmanship recognition' },
      { type: 'QUALITY', label: 'Quality Assurance', icon: 'fa-check-circle', color: '#10b981', description: 'Product quality certification' },
      { type: 'SUSTAINABILITY', label: 'Sustainability', icon: 'fa-leaf', color: '#059669', description: 'Environmental certification' },
      { type: 'ORGANIC', label: 'Organic', icon: 'fa-seedling', color: '#22c55e', description: 'Organic materials certification' }
    ];
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.loadCertificationData();
  }

  // Stats from summary
  get totalCertifications(): number {
    return this.summary?.totalCertifications || this.certifications.length;
  }

  get activeCertifications(): number {
    return this.summary?.activeCertifications || this.certifications.filter(c => c.status === 'ACTIVE').length;
  }

  get expiringSoon(): number {
    return this.summary?.expiringSoon || this.certifications.filter(c => c.status === 'EXPIRING_SOON').length;
  }

  get trustScore(): number {
    return this.summary?.trustScore || 0;
  }

  getTypeInfo(type: string): CertificationType {
    return this.certificationTypes.find(t => t.type === type) || 
      { type, label: type, icon: 'fa-certificate', color: '#6b7280', description: '' };
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'status-active',
      'EXPIRING_SOON': 'status-expiring-soon',
      'EXPIRED': 'status-expired',
      'PENDING': 'status-pending',
      'REJECTED': 'status-rejected'
    };
    return statusMap[status] || `status-${status.toLowerCase()}`;
  }

  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getDaysUntilExpiry(date: string | Date): number {
    const d = typeof date === 'string' ? new Date(date) : date;
    const diff = d.getTime() - Date.now();
    return Math.ceil(diff / (24 * 3600000));
  }

  getExpiryText(cert: Certification): string {
    if (!cert.validityEnd) return 'No expiry';
    const days = this.getDaysUntilExpiry(cert.validityEnd);
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    if (days <= 30) return `Expires in ${days} days`;
    if (days <= 365) return `Expires in ${Math.floor(days / 30)} months`;
    return `Expires in ${Math.floor(days / 365)} years`;
  }

  get filteredCertifications(): Certification[] {
    if (this.filterStatus === 'all') return this.certifications;
    return this.certifications.filter(c => c.status === this.filterStatus.toUpperCase());
  }

  viewCertificate(cert: Certification): void {
    if (cert.documentUrl) {
      window.open(cert.documentUrl, '_blank');
    } else {
      this.snackBar.open('Certificate document not available', 'Close', { duration: 3000 });
    }
  }

  downloadCertificate(cert: Certification): void {
    if (cert.documentUrl) {
      const link = document.createElement('a');
      link.href = cert.documentUrl;
      link.download = `${cert.name.replace(/\s+/g, '_')}_certificate.pdf`;
      link.click();
    } else {
      this.snackBar.open('Certificate document not available', 'Close', { duration: 3000 });
    }
  }

  renewCertificate(cert: Certification): void {
    this.certificationService.renewCertification(cert.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (renewed) => {
          this.snackBar.open('Renewal request submitted successfully', 'Close', { duration: 3000 });
          this.loadCertificationData();
        },
        error: (error) => {
          this.snackBar.open(error.error?.message || 'Failed to submit renewal request', 'Close', { duration: 4000 });
        }
      });
  }

  applyForCertification(type: CertificationType): void {
    // This would typically open a dialog for certification application
    this.snackBar.open(`Opening application for ${type.label}...`, 'Close', { duration: 3000 });
    // TODO: Implement dialog for certification application
  }

  dismissAlert(alert: CertificationAlert): void {
    this.alerts = this.alerts.filter(a => a !== alert);
  }

  getAlertIcon(severity: string): string {
    const icons: { [key: string]: string } = {
      'CRITICAL': 'fa-exclamation-circle',
      'WARNING': 'fa-exclamation-triangle',
      'INFO': 'fa-info-circle'
    };
    return icons[severity] || 'fa-bell';
  }

  getAlertClass(severity: string): string {
    return `alert-${severity.toLowerCase()}`;
  }
}
