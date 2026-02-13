import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, switchMap, takeWhile, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReportType {
  value: string;
  label: string;
  description: string;
  available: boolean;
}

export interface ReportFormat {
  value: string;
  label: string;
  icon: string;
}

export interface ReportRequest {
  reportType: string;
  format: string;
  startDate?: string;
  endDate?: string;
  vendorId?: string;
  productId?: string;
  categoryId?: string;
  originDistrict?: string;
  originState?: string;
  includeGiTagOnly?: boolean;
  includeCharts?: boolean;
  groupBy?: string;
  sortBy?: string;
  sortDirection?: string;
  maxRecords?: number;
}

export interface ReportResponse {
  reportId: string;
  reportType: string;
  reportName: string;
  format: string;
  status: string;
  progress: number;
  fileName: string;
  fileSize: number;
  createdAt: string;
  completedAt: string;
  errorMessage: string;
  downloadUrl: string;
}

export interface ReportGenerationResult {
  success: boolean;
  message: string;
  report?: ReportResponse;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private apiUrl = `${environment.apiUrl}/odop/reports`;
  
  // State management
  private reportTypesSubject = new BehaviorSubject<ReportType[]>([]);
  private reportFormatsSubject = new BehaviorSubject<ReportFormat[]>([]);
  private currentReportSubject = new BehaviorSubject<ReportResponse | null>(null);
  private reportHistorySubject = new BehaviorSubject<ReportResponse[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  // Public observables
  reportTypes$ = this.reportTypesSubject.asObservable();
  reportFormats$ = this.reportFormatsSubject.asObservable();
  currentReport$ = this.currentReportSubject.asObservable();
  reportHistory$ = this.reportHistorySubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadReportTypes();
    this.loadReportFormats();
  }

  // ==================== REPORT TYPES ====================

  /**
   * Load available report types
   */
  loadReportTypes(): void {
    this.http.get<any>(`${this.apiUrl}/types`).subscribe({
      next: (response) => {
        if (response.success) {
          this.reportTypesSubject.next(response.reportTypes);
        }
      },
      error: (err) => console.error('Failed to load report types', err)
    });
  }

  /**
   * Load available report formats
   */
  loadReportFormats(): void {
    this.http.get<any>(`${this.apiUrl}/formats`).subscribe({
      next: (response) => {
        if (response.success) {
          this.reportFormatsSubject.next(response.formats);
        }
      },
      error: (err) => console.error('Failed to load report formats', err)
    });
  }

  /**
   * Get report types
   */
  getReportTypes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/types`);
  }

  /**
   * Get report formats
   */
  getReportFormats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/formats`);
  }

  // ==================== REPORT GENERATION ====================

  /**
   * Generate a new report
   */
  generateReport(request: ReportRequest): Observable<ReportGenerationResult> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.http.post<ReportGenerationResult>(`${this.apiUrl}/generate`, request).pipe(
      tap({
        next: (response) => {
          this.loadingSubject.next(false);
          if (response.success && response.report) {
            this.currentReportSubject.next(response.report);
          }
        },
        error: (err) => {
          this.loadingSubject.next(false);
          this.errorSubject.next(err.error?.message || 'Failed to generate report');
        }
      })
    );
  }

  /**
   * Generate report and wait for completion
   */
  generateReportAndWait(request: ReportRequest): Observable<ReportResponse> {
    return new Observable(observer => {
      this.generateReport(request).subscribe({
        next: (result) => {
          if (result.success && result.report) {
            // Start polling for completion
            this.pollReportStatus(result.report.reportId).subscribe({
              next: (report) => {
                if (report.status === 'COMPLETED' || report.status === 'FAILED') {
                  observer.next(report);
                  observer.complete();
                }
              },
              error: (err) => observer.error(err)
            });
          } else {
            observer.error(new Error(result.message));
          }
        },
        error: (err) => observer.error(err)
      });
    });
  }

  /**
   * Poll report status until completion
   */
  pollReportStatus(reportId: string, intervalMs: number = 2000): Observable<ReportResponse> {
    return interval(intervalMs).pipe(
      switchMap(() => this.getReport(reportId)),
      tap(report => this.currentReportSubject.next(report)),
      takeWhile(report => report.status === 'PENDING' || report.status === 'PROCESSING', true)
    );
  }

  // ==================== REPORT STATUS ====================

  /**
   * Get report by ID
   */
  getReport(reportId: string): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.apiUrl}/${reportId}`);
  }

  /**
   * Get report history
   */
  getReportHistory(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/history`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.reportHistorySubject.next(response.reports);
        }
      })
    );
  }

  /**
   * Refresh report history
   */
  refreshHistory(): void {
    this.getReportHistory().subscribe({
      error: (err) => console.error('Failed to refresh report history:', err)
    });
  }

  // ==================== DOWNLOAD ====================

  /**
   * Download report file
   */
  downloadReport(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${reportId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Download report and trigger browser download
   */
  downloadAndSave(reportId: string, fileName: string): void {
    this.downloadReport(reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download failed', err);
        this.errorSubject.next('Failed to download report');
      }
    });
  }

  // ==================== DELETE ====================

  /**
   * Delete a report
   */
  deleteReport(reportId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${reportId}`).pipe(
      tap({
        next: () => this.refreshHistory(),
        error: (err) => this.errorSubject.next('Failed to delete report')
      })
    );
  }

  // ==================== QUICK REPORTS ====================

  /**
   * Generate sales summary report
   */
  generateSalesSummary(startDate: string, endDate: string, format: string = 'EXCEL'): Observable<ReportGenerationResult> {
    return this.generateReport({
      reportType: 'SALES_SUMMARY',
      format,
      startDate,
      endDate,
      includeCharts: true
    });
  }

  /**
   * Generate inventory report
   */
  generateInventoryReport(format: string = 'EXCEL'): Observable<ReportGenerationResult> {
    return this.generateReport({
      reportType: 'PRODUCT_INVENTORY',
      format
    });
  }

  /**
   * Generate low stock alert
   */
  generateLowStockAlert(format: string = 'EXCEL'): Observable<ReportGenerationResult> {
    return this.generateReport({
      reportType: 'LOW_STOCK_ALERT',
      format
    });
  }

  /**
   * Generate order history
   */
  generateOrderHistory(startDate: string, endDate: string, format: string = 'EXCEL'): Observable<ReportGenerationResult> {
    return this.generateReport({
      reportType: 'ORDER_HISTORY',
      format,
      startDate,
      endDate
    });
  }

  /**
   * Generate tax report
   */
  generateTaxReport(startDate: string, endDate: string, format: string = 'EXCEL'): Observable<ReportGenerationResult> {
    return this.generateReport({
      reportType: 'TAX_REPORT',
      format,
      startDate,
      endDate
    });
  }

  /**
   * Generate ODOP district sales (admin only)
   */
  generateOdopDistrictSales(startDate: string, endDate: string, format: string = 'EXCEL'): Observable<ReportGenerationResult> {
    return this.generateReport({
      reportType: 'ODOP_DISTRICT_SALES',
      format,
      startDate,
      endDate
    });
  }

  /**
   * Generate GI Tag products report
   */
  generateGiTagReport(format: string = 'EXCEL'): Observable<ReportGenerationResult> {
    return this.generateReport({
      reportType: 'GI_TAG_PRODUCTS',
      format,
      includeGiTagOnly: true
    });
  }

  // ==================== UTILITIES ====================

  /**
   * Get file extension for format
   */
  getFileExtension(format: string): string {
    const extensions: { [key: string]: string } = {
      'EXCEL': '.xlsx',
      'CSV': '.csv',
      'PDF': '.pdf'
    };
    return extensions[format] || '.dat';
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': 'warning',
      'PROCESSING': 'info',
      'COMPLETED': 'success',
      'FAILED': 'danger'
    };
    return colors[status] || 'secondary';
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'PENDING': 'clock',
      'PROCESSING': 'spinner',
      'COMPLETED': 'check-circle',
      'FAILED': 'x-circle'
    };
    return icons[status] || 'circle';
  }

  /**
   * Check health
   */
  healthCheck(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/health`);
  }

  // ==================== STATE HELPERS ====================

  clearError(): void {
    this.errorSubject.next(null);
  }

  clearCurrentReport(): void {
    this.currentReportSubject.next(null);
  }
}
