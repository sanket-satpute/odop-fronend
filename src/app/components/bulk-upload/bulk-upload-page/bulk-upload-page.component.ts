import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BulkUploadService } from '../../../services/bulk-upload.service';

interface UploadTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: string[];
  sampleFileUrl: string;
  maxRows: number;
}

interface FilePreview {
  headers: string[];
  rows: any[][];
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: ValidationError[];
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
  value: string;
}

interface UploadProgress {
  status: 'idle' | 'validating' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  processedRows: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
}

interface UploadHistory {
  id: string;
  templateName: string;
  fileName: string;
  uploadedAt: Date;
  status: 'success' | 'partial' | 'failed';
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
}

@Component({
  selector: 'app-bulk-upload-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './bulk-upload-page.component.html',
  styleUrls: ['./bulk-upload-page.component.css']
})
export class BulkUploadPageComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  currentStep = 1; // 1: Select Template, 2: Upload File, 3: Preview, 4: Progress, 5: Complete
  selectedTemplate: UploadTemplate | null = null;
  selectedFile: File | null = null;
  filePreview: FilePreview | null = null;
  uploadProgress: UploadProgress = {
    status: 'idle',
    progress: 0,
    message: '',
    processedRows: 0,
    totalRows: 0,
    successCount: 0,
    errorCount: 0
  };

  isDragOver = false;
  isValidating = false;
  showErrorDetails = false;

  templates: UploadTemplate[] = [
    {
      id: 'products',
      name: 'Products',
      description: 'Bulk upload product catalog with details, pricing, and inventory',
      icon: 'fa-box-open',
      fields: ['SKU', 'Name', 'Description', 'Category', 'Price', 'Stock', 'Weight', 'Images'],
      sampleFileUrl: '/assets/templates/products-template.csv',
      maxRows: 1000
    },
    {
      id: 'artisans',
      name: 'Artisans',
      description: 'Import artisan profiles with contact and skill information',
      icon: 'fa-user-tie',
      fields: ['Name', 'Email', 'Phone', 'Address', 'District', 'Craft', 'Experience', 'Bank Details'],
      sampleFileUrl: '/assets/templates/artisans-template.csv',
      maxRows: 500
    },
    {
      id: 'inventory',
      name: 'Inventory Update',
      description: 'Update stock levels for multiple products at once',
      icon: 'fa-warehouse',
      fields: ['SKU', 'Stock Quantity', 'Reorder Level', 'Warehouse Location'],
      sampleFileUrl: '/assets/templates/inventory-template.csv',
      maxRows: 2000
    },
    {
      id: 'prices',
      name: 'Price Update',
      description: 'Bulk update product prices and discounts',
      icon: 'fa-tags',
      fields: ['SKU', 'Regular Price', 'Sale Price', 'Discount %', 'Start Date', 'End Date'],
      sampleFileUrl: '/assets/templates/prices-template.csv',
      maxRows: 2000
    },
    {
      id: 'orders',
      name: 'Orders Import',
      description: 'Import offline or external orders into the system',
      icon: 'fa-shopping-cart',
      fields: ['Order ID', 'Customer Email', 'Products', 'Quantity', 'Amount', 'Date', 'Status'],
      sampleFileUrl: '/assets/templates/orders-template.csv',
      maxRows: 500
    },
    {
      id: 'customers',
      name: 'Customers',
      description: 'Import customer data for marketing and CRM',
      icon: 'fa-users',
      fields: ['Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Pincode'],
      sampleFileUrl: '/assets/templates/customers-template.csv',
      maxRows: 1000
    }
  ];

  uploadHistory: UploadHistory[] = [];

  constructor(private bulkUploadService: BulkUploadService) {}

  ngOnInit(): void {
    this.loadUploadHistory();
  }

  async loadUploadHistory(): Promise<void> {
    // Simulated history data
    this.uploadHistory = [
      {
        id: '1',
        templateName: 'Products',
        fileName: 'new-products-jan2025.csv',
        uploadedAt: new Date('2025-01-12T10:30:00'),
        status: 'success',
        totalRecords: 150,
        successRecords: 150,
        failedRecords: 0
      },
      {
        id: '2',
        templateName: 'Inventory Update',
        fileName: 'stock-update.csv',
        uploadedAt: new Date('2025-01-11T14:20:00'),
        status: 'partial',
        totalRecords: 320,
        successRecords: 315,
        failedRecords: 5
      },
      {
        id: '3',
        templateName: 'Artisans',
        fileName: 'artisan-profiles.csv',
        uploadedAt: new Date('2025-01-10T09:15:00'),
        status: 'failed',
        totalRecords: 50,
        successRecords: 0,
        failedRecords: 50
      }
    ];
  }

  selectTemplate(template: UploadTemplate): void {
    this.selectedTemplate = template;
    this.currentStep = 2;
  }

  downloadSampleFile(): void {
    if (this.selectedTemplate) {
      // In real app, trigger file download
      console.log('Downloading sample:', this.selectedTemplate.sampleFileUrl);
    }
  }

  // Drag and Drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  private handleFileSelection(file: File): void {
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const isValidType = validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx');

    if (!isValidType) {
      alert('Please upload a CSV or Excel file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should not exceed 10MB');
      return;
    }

    this.selectedFile = file;
    this.validateAndPreviewFile();
  }

  async validateAndPreviewFile(): Promise<void> {
    if (!this.selectedFile) return;

    this.isValidating = true;

    try {
      // Simulate file validation and preview generation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock preview data
      this.filePreview = {
        headers: this.selectedTemplate?.fields || [],
        rows: [
          ['SKU001', 'Handwoven Silk Saree', 'Beautiful traditional silk saree', 'Textiles', '5999', '25', '0.5', 'saree1.jpg'],
          ['SKU002', 'Blue Pottery Vase', 'Authentic Jaipur blue pottery', 'Pottery', '1299', '50', '1.2', 'vase1.jpg'],
          ['SKU003', 'Madhubani Painting', 'Original folk art painting', 'Art', '3499', '15', '0.3', 'painting1.jpg'],
          ['SKU004', 'Brass Diya Set', 'Traditional brass oil lamps', 'Metal Craft', '899', '100', '0.8', 'diya1.jpg'],
          ['SKU005', 'Chikankari Kurta', 'Lucknow embroidered kurta', 'Textiles', '2499', '30', '0.3', 'kurta1.jpg']
        ],
        totalRows: 150,
        validRows: 145,
        errorRows: 5,
        errors: [
          { row: 23, column: 'Price', message: 'Invalid price format', value: 'ABC' },
          { row: 45, column: 'SKU', message: 'Duplicate SKU', value: 'SKU045' },
          { row: 67, column: 'Stock', message: 'Negative value not allowed', value: '-10' },
          { row: 89, column: 'Category', message: 'Unknown category', value: 'Unknown' },
          { row: 112, column: 'Email', message: 'Invalid email format', value: 'invalid.email' }
        ]
      };

      this.currentStep = 3;
    } catch (error) {
      console.error('Error validating file:', error);
    } finally {
      this.isValidating = false;
    }
  }

  async startUpload(): Promise<void> {
    if (!this.selectedFile || !this.filePreview) return;

    this.currentStep = 4;
    this.uploadProgress = {
      status: 'uploading',
      progress: 0,
      message: 'Uploading file...',
      processedRows: 0,
      totalRows: this.filePreview.validRows,
      successCount: 0,
      errorCount: 0
    };

    try {
      // Simulate upload progress
      const steps = [
        { progress: 20, status: 'uploading', message: 'Uploading file to server...' },
        { progress: 40, status: 'processing', message: 'Validating data...' },
        { progress: 60, status: 'processing', message: 'Processing records...' },
        { progress: 80, status: 'processing', message: 'Saving to database...' },
        { progress: 100, status: 'complete', message: 'Upload complete!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.uploadProgress.progress = step.progress;
        this.uploadProgress.status = step.status as any;
        this.uploadProgress.message = step.message;
        this.uploadProgress.processedRows = Math.floor((step.progress / 100) * this.filePreview.validRows);
        this.uploadProgress.successCount = this.uploadProgress.processedRows - Math.floor(this.uploadProgress.processedRows * 0.02);
        this.uploadProgress.errorCount = Math.floor(this.uploadProgress.processedRows * 0.02);
      }

      this.currentStep = 5;

      // Add to history
      this.uploadHistory.unshift({
        id: Date.now().toString(),
        templateName: this.selectedTemplate?.name || '',
        fileName: this.selectedFile.name,
        uploadedAt: new Date(),
        status: this.uploadProgress.errorCount === 0 ? 'success' : 'partial',
        totalRecords: this.filePreview.totalRows,
        successRecords: this.uploadProgress.successCount,
        failedRecords: this.uploadProgress.errorCount
      });

    } catch (error) {
      this.uploadProgress.status = 'error';
      this.uploadProgress.message = 'Upload failed. Please try again.';
    }
  }

  resetUpload(): void {
    this.currentStep = 1;
    this.selectedTemplate = null;
    this.selectedFile = null;
    this.filePreview = null;
    this.uploadProgress = {
      status: 'idle',
      progress: 0,
      message: '',
      processedRows: 0,
      totalRows: 0,
      successCount: 0,
      errorCount: 0
    };
    this.showErrorDetails = false;
  }

  goBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 1) {
        this.selectedTemplate = null;
      } else if (this.currentStep === 2) {
        this.selectedFile = null;
        this.filePreview = null;
      }
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getSuccessfulUploadsCount(): number {
    return this.uploadHistory.filter(h => h.status === 'success').length;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  downloadErrorReport(): void {
    console.log('Downloading error report...');
  }

  retryUpload(history: UploadHistory): void {
    const template = this.templates.find(t => t.name === history.templateName);
    if (template) {
      this.selectTemplate(template);
    }
  }
}
