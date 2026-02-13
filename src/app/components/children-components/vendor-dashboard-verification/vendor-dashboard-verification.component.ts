import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { UserStateService } from 'src/app/project/services/user-state.service';
import {
  DocumentStatusDto,
  DocumentType,
  RequiredDocument,
  VerificationStatusResponse,
  VendorVerificationService
} from 'src/app/project/services/vendor-verification.service';

interface DocumentViewModel {
  type: string;
  displayName: string;
  required: boolean;
  uploaded: boolean;
  status: string;
  statusDisplayName: string;
  rejectionReason?: string;
  documentUrl?: string;
}

@Component({
  selector: 'app-vendor-dashboard-verification',
  templateUrl: './vendor-dashboard-verification.component.html',
  styleUrls: ['./vendor-dashboard-verification.component.css']
})
export class VendorDashboardVerificationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  vendorId = '';
  vendorName = 'Vendor';

  verificationStatus: VerificationStatusResponse | null = null;
  documentRows: DocumentViewModel[] = [];
  requiredDocuments: RequiredDocument[] = [];

  isLoading = true;
  isStartingVerification = false;
  isSubmittingForReview = false;
  uploadInProgress: Record<string, boolean> = {};
  selectedFiles: Record<string, File | null> = {};
  selectedFileNames: Record<string, string> = {};

  documentForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly userStateService: UserStateService,
    private readonly verificationService: VendorVerificationService,
    private readonly snackBar: MatSnackBar
  ) {
    this.documentForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.userStateService.vendor$
      .pipe(takeUntil(this.destroy$))
      .subscribe(vendor => {
        if (!vendor?.vendorId) {
          this.showMessage('Vendor session not found. Please login again.');
          this.isLoading = false;
          return;
        }
        this.vendorId = vendor.vendorId;
        this.vendorName = vendor.businessName || vendor.shoppeeName || vendor.shopkeeperName || 'Vendor';
        this.loadVerificationData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVerificationData(): void {
    if (!this.vendorId) {
      return;
    }

    this.isLoading = true;
    forkJoin({
      requiredDocuments: this.verificationService.getRequiredDocuments(),
      status: this.verificationService.getVerificationStatus(this.vendorId).pipe(
        catchError(() => of(null))
      )
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ requiredDocuments, status }) => {
        this.requiredDocuments = requiredDocuments || [];
        this.verificationStatus = status;
        this.buildDocumentRows();
      },
      error: () => {
        this.showMessage('Unable to load verification details.');
      }
    });
  }

  startVerification(): void {
    if (!this.vendorId) {
      return;
    }
    this.isStartingVerification = true;
    this.verificationService.startVerification(this.vendorId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isStartingVerification = false)
      )
      .subscribe({
        next: (status) => {
          this.verificationStatus = status;
          this.buildDocumentRows();
          this.showMessage('Verification started. Upload your documents to continue.');
        },
        error: (error: Error) => {
          this.showMessage(error?.message || 'Unable to start verification.');
        }
      });
  }

  onFileSelected(event: Event, documentType: string): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    this.selectedFiles[documentType] = file;
    this.selectedFileNames[documentType] = file?.name || '';
  }

  uploadDocument(documentType: string): void {
    if (!this.vendorId) {
      return;
    }

    const file = this.selectedFiles[documentType];
    if (!file) {
      this.showMessage('Please select a file before uploading.');
      return;
    }

    const validationMessage = this.verificationService.validateDocument(file, documentType as DocumentType);
    if (validationMessage) {
      this.showMessage(validationMessage);
      return;
    }

    const documentNumberControl = this.documentForm.get(documentType);
    const documentNumber = documentNumberControl?.value || undefined;

    this.uploadInProgress[documentType] = true;
    this.verificationService.uploadDocument(
      this.vendorId,
      documentType as DocumentType,
      file,
      documentNumber
    ).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.uploadInProgress[documentType] = false)
    ).subscribe({
      next: (status) => {
        this.verificationStatus = status;
        this.selectedFiles[documentType] = null;
        this.selectedFileNames[documentType] = '';
        this.buildDocumentRows();
        this.showMessage(`${this.getDisplayName(documentType)} uploaded successfully.`);
      },
      error: (error: Error) => {
        this.showMessage(error?.message || 'Upload failed.');
      }
    });
  }

  submitForReview(): void {
    if (!this.vendorId) {
      return;
    }
    this.isSubmittingForReview = true;
    this.verificationService.submitForReview(this.vendorId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmittingForReview = false)
      )
      .subscribe({
        next: (status) => {
          this.verificationStatus = status;
          this.buildDocumentRows();
          this.showMessage('Verification submitted for admin review.');
        },
        error: (error: Error) => {
          this.showMessage(error?.message || 'Unable to submit verification.');
        }
      });
  }

  get progressValue(): number {
    return this.verificationStatus?.completionPercentage || 0;
  }

  get statusColor(): string {
    return this.verificationService.getStatusColor(this.verificationStatus?.status || '');
  }

  get statusIcon(): string {
    const status = this.verificationStatus?.status || '';
    if (status === 'APPROVED') return 'fa-check-circle';
    if (status === 'REJECTED') return 'fa-triangle-exclamation';
    if (status === 'UNDER_REVIEW') return 'fa-hourglass-half';
    if (status === 'DOCUMENTS_SUBMITTED') return 'fa-file-circle-check';
    if (status === 'ADDITIONAL_INFO_REQUIRED') return 'fa-circle-exclamation';
    return 'fa-shield-alt';
  }

  get canStartVerification(): boolean {
    if (!this.verificationStatus) {
      return true;
    }
    return this.verificationStatus.status === 'NOT_STARTED';
  }

  get canSubmitForReview(): boolean {
    if (!this.verificationStatus) {
      return false;
    }
    const status = this.verificationStatus.status;
    return status !== 'UNDER_REVIEW' && status !== 'APPROVED' && status !== 'DOCUMENTS_SUBMITTED';
  }

  get canUploadDocuments(): boolean {
    return !!this.verificationStatus;
  }

  get requiredDocumentRows(): DocumentViewModel[] {
    return this.documentRows.filter(doc => doc.required);
  }

  get optionalDocumentRows(): DocumentViewModel[] {
    return this.documentRows.filter(doc => !doc.required);
  }

  get uploadedRequiredCount(): number {
    return this.requiredDocumentRows.filter(doc => doc.uploaded).length;
  }

  get approvedCount(): number {
    return this.documentRows.filter(doc => doc.status === 'VERIFIED').length;
  }

  get rejectedCount(): number {
    return this.documentRows.filter(doc => doc.status === 'REJECTED').length;
  }

  get pendingCount(): number {
    return this.documentRows.filter(doc => !doc.uploaded || doc.status === 'PENDING').length;
  }

  get formattedSubmittedAt(): string {
    return this.formatDateTime(this.verificationStatus?.submittedAt);
  }

  get formattedUpdatedAt(): string {
    return this.formatDateTime(this.verificationStatus?.lastUpdatedAt);
  }

  get formattedEta(): string {
    return this.formatDateTime(this.verificationStatus?.estimatedCompletionDate);
  }

  getDocumentStatusClass(doc: DocumentViewModel): string {
    if (doc.status === 'VERIFIED') return 'status-verified';
    if (doc.status === 'REJECTED') return 'status-rejected';
    if (doc.uploaded) return 'status-uploaded';
    return 'status-pending';
  }

  getStepClass(step: any): string {
    if (step.completed) return 'is-completed';
    if (step.current) return 'is-current';
    return 'is-pending';
  }

  private buildDocumentRows(): void {
    const statusDocuments = this.verificationStatus?.documents || [];
    const mappedStatus = new Map<string, DocumentStatusDto>(
      statusDocuments.map(doc => [doc.documentType, doc])
    );

    this.requiredDocuments.forEach(doc => {
      if (!this.documentForm.contains(doc.type)) {
        this.documentForm.addControl(doc.type, this.fb.control(''));
      }
    });

    this.documentRows = this.requiredDocuments.map(doc => {
      const statusDoc = mappedStatus.get(doc.type);
      return {
        type: doc.type,
        displayName: doc.displayName,
        required: doc.required,
        uploaded: !!statusDoc?.uploaded,
        status: statusDoc?.status || 'PENDING',
        statusDisplayName: statusDoc?.statusDisplayName || 'Pending',
        rejectionReason: statusDoc?.rejectionReason,
        documentUrl: statusDoc?.documentUrl
      };
    });
  }

  private getDisplayName(documentType: string): string {
    return this.requiredDocuments.find(doc => doc.type === documentType)?.displayName || documentType;
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  private formatDateTime(value?: Date): string {
    if (!value) {
      return 'Not available';
    }
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
