import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReportService } from '../../../services/report.service';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  estimatedTime: string;
  formats: string[];
}

interface ReportHistory {
  id: string;
  reportType: string;
  generatedAt: Date;
  status: 'completed' | 'failed' | 'processing';
  format: string;
  size: string;
  downloadUrl?: string;
  parameters: any;
}

interface ReportStats {
  totalGenerated: number;
  thisMonth: number;
  mostPopular: string;
  averageTime: string;
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.css']
})
export class ReportsDashboardComponent implements OnInit {
  isLoading = true;
  isGenerating = false;
  generationProgress = 0;
  currentStep = 'select'; // select, configure, generate, complete
  reportForm: FormGroup;
  selectedReportType: ReportType | null = null;
  generatedReportUrl: string | null = null;

  reportStats: ReportStats = {
    totalGenerated: 156,
    thisMonth: 23,
    mostPopular: 'Sales Report',
    averageTime: '2.5 min'
  };

  reportCategories = [
    { id: 'sales', name: 'Sales & Revenue', icon: 'fa-chart-line' },
    { id: 'inventory', name: 'Inventory', icon: 'fa-boxes' },
    { id: 'artisans', name: 'Artisan Performance', icon: 'fa-users' },
    { id: 'products', name: 'Product Analytics', icon: 'fa-box-open' },
    { id: 'customers', name: 'Customer Insights', icon: 'fa-user-friends' },
    { id: 'operations', name: 'Operations', icon: 'fa-cogs' }
  ];

  reportTypes: ReportType[] = [
    {
      id: 'sales-summary',
      name: 'Sales Summary Report',
      description: 'Comprehensive overview of sales performance with trends and comparisons',
      icon: 'fa-chart-bar',
      category: 'sales',
      estimatedTime: '1-2 min',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      id: 'revenue-analysis',
      name: 'Revenue Analysis',
      description: 'Detailed revenue breakdown by product, region, and time period',
      icon: 'fa-rupee-sign',
      category: 'sales',
      estimatedTime: '2-3 min',
      formats: ['PDF', 'Excel']
    },
    {
      id: 'inventory-status',
      name: 'Inventory Status Report',
      description: 'Current stock levels, low stock alerts, and reorder suggestions',
      icon: 'fa-warehouse',
      category: 'inventory',
      estimatedTime: '1 min',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      id: 'stock-movement',
      name: 'Stock Movement Report',
      description: 'Track inventory changes, inflows, and outflows over time',
      icon: 'fa-exchange-alt',
      category: 'inventory',
      estimatedTime: '2 min',
      formats: ['PDF', 'Excel']
    },
    {
      id: 'artisan-performance',
      name: 'Artisan Performance Report',
      description: 'Individual artisan sales, ratings, and product quality metrics',
      icon: 'fa-user-tie',
      category: 'artisans',
      estimatedTime: '3-4 min',
      formats: ['PDF', 'Excel']
    },
    {
      id: 'artisan-earnings',
      name: 'Artisan Earnings Statement',
      description: 'Detailed earnings breakdown and payment history for artisans',
      icon: 'fa-wallet',
      category: 'artisans',
      estimatedTime: '2 min',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      id: 'product-catalog',
      name: 'Product Catalog Export',
      description: 'Complete product listing with images, prices, and specifications',
      icon: 'fa-list-alt',
      category: 'products',
      estimatedTime: '3-5 min',
      formats: ['PDF', 'Excel']
    },
    {
      id: 'bestsellers',
      name: 'Bestsellers Report',
      description: 'Top performing products by sales volume and revenue',
      icon: 'fa-trophy',
      category: 'products',
      estimatedTime: '1 min',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      id: 'customer-analytics',
      name: 'Customer Analytics Report',
      description: 'Customer demographics, behavior patterns, and purchase history',
      icon: 'fa-chart-pie',
      category: 'customers',
      estimatedTime: '2-3 min',
      formats: ['PDF', 'Excel']
    },
    {
      id: 'order-report',
      name: 'Order Fulfillment Report',
      description: 'Order status, delivery times, and fulfillment efficiency',
      icon: 'fa-shipping-fast',
      category: 'operations',
      estimatedTime: '2 min',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      id: 'return-analysis',
      name: 'Returns & Refunds Report',
      description: 'Analysis of product returns, reasons, and refund patterns',
      icon: 'fa-undo-alt',
      category: 'operations',
      estimatedTime: '1-2 min',
      formats: ['PDF', 'Excel']
    },
    {
      id: 'tax-report',
      name: 'Tax Summary Report',
      description: 'GST and tax collection summary for compliance',
      icon: 'fa-file-invoice-dollar',
      category: 'operations',
      estimatedTime: '2-3 min',
      formats: ['PDF', 'Excel']
    }
  ];

  reportHistory: ReportHistory[] = [];
  filteredReportTypes: ReportType[] = [];
  selectedCategory = 'all';

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService
  ) {
    this.reportForm = this.createForm();
    this.filteredReportTypes = [...this.reportTypes];
  }

  ngOnInit(): void {
    this.loadReportHistory();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      dateRange: ['last30days', Validators.required],
      customStartDate: [''],
      customEndDate: [''],
      format: ['PDF', Validators.required],
      includeCharts: [true],
      includeSummary: [true],
      emailCopy: [false],
      emailAddress: [''],
      region: ['all'],
      category: ['all']
    });
  }

  async loadReportHistory(): Promise<void> {
    this.isLoading = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.reportHistory = [
        {
          id: '1',
          reportType: 'Sales Summary Report',
          generatedAt: new Date('2025-01-12T10:30:00'),
          status: 'completed',
          format: 'PDF',
          size: '2.4 MB',
          downloadUrl: '/reports/download/1',
          parameters: { dateRange: 'January 2025' }
        },
        {
          id: '2',
          reportType: 'Inventory Status Report',
          generatedAt: new Date('2025-01-11T14:20:00'),
          status: 'completed',
          format: 'Excel',
          size: '1.8 MB',
          downloadUrl: '/reports/download/2',
          parameters: { dateRange: 'Q4 2024' }
        },
        {
          id: '3',
          reportType: 'Artisan Performance Report',
          generatedAt: new Date('2025-01-10T09:15:00'),
          status: 'completed',
          format: 'PDF',
          size: '5.2 MB',
          downloadUrl: '/reports/download/3',
          parameters: { dateRange: 'Year 2024' }
        },
        {
          id: '4',
          reportType: 'Customer Analytics Report',
          generatedAt: new Date('2025-01-09T16:45:00'),
          status: 'failed',
          format: 'Excel',
          size: '-',
          parameters: { dateRange: 'December 2024' }
        },
        {
          id: '5',
          reportType: 'Bestsellers Report',
          generatedAt: new Date('2025-01-08T11:00:00'),
          status: 'completed',
          format: 'CSV',
          size: '0.8 MB',
          downloadUrl: '/reports/download/5',
          parameters: { dateRange: 'Last 30 days' }
        }
      ];
    } catch (error) {
      console.error('Error loading report history:', error);
    } finally {
      this.isLoading = false;
    }
  }

  filterByCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    if (categoryId === 'all') {
      this.filteredReportTypes = [...this.reportTypes];
    } else {
      this.filteredReportTypes = this.reportTypes.filter(r => r.category === categoryId);
    }
  }

  selectReport(reportType: ReportType): void {
    this.selectedReportType = reportType;
    this.currentStep = 'configure';
    this.reportForm.patchValue({
      format: reportType.formats[0]
    });
  }

  goBack(): void {
    if (this.currentStep === 'configure') {
      this.currentStep = 'select';
      this.selectedReportType = null;
    } else if (this.currentStep === 'complete') {
      this.resetGenerator();
    }
  }

  async generateReport(): Promise<void> {
    if (!this.reportForm.valid || !this.selectedReportType) return;

    this.isGenerating = true;
    this.currentStep = 'generate';
    this.generationProgress = 0;

    try {
      // Simulate report generation with progress
      const steps = [
        { progress: 20, message: 'Fetching data...' },
        { progress: 40, message: 'Processing records...' },
        { progress: 60, message: 'Generating charts...' },
        { progress: 80, message: 'Compiling report...' },
        { progress: 100, message: 'Finalizing...' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        this.generationProgress = step.progress;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.generatedReportUrl = '/reports/download/new-report-' + Date.now();
      this.currentStep = 'complete';
      
      // Add to history
      this.reportHistory.unshift({
        id: Date.now().toString(),
        reportType: this.selectedReportType.name,
        generatedAt: new Date(),
        status: 'completed',
        format: this.reportForm.value.format,
        size: '2.1 MB',
        downloadUrl: this.generatedReportUrl,
        parameters: { dateRange: this.getDateRangeLabel() }
      });

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      this.isGenerating = false;
    }
  }

  resetGenerator(): void {
    this.currentStep = 'select';
    this.selectedReportType = null;
    this.generationProgress = 0;
    this.generatedReportUrl = null;
    this.reportForm.reset({
      dateRange: 'last30days',
      format: 'PDF',
      includeCharts: true,
      includeSummary: true,
      emailCopy: false,
      region: 'all',
      category: 'all'
    });
  }

  downloadReport(url: string): void {
    // In real app, trigger file download
    console.log('Downloading report:', url);
    window.open(url, '_blank');
  }

  retryReport(report: ReportHistory): void {
    const reportType = this.reportTypes.find(r => r.name === report.reportType);
    if (reportType) {
      this.selectReport(reportType);
    }
  }

  deleteReport(reportId: string): void {
    this.reportHistory = this.reportHistory.filter(r => r.id !== reportId);
  }

  getDateRangeLabel(): string {
    const value = this.reportForm.value.dateRange;
    const labels: { [key: string]: string } = {
      'last7days': 'Last 7 Days',
      'last30days': 'Last 30 Days',
      'last90days': 'Last 90 Days',
      'thisMonth': 'This Month',
      'lastMonth': 'Last Month',
      'thisQuarter': 'This Quarter',
      'lastQuarter': 'Last Quarter',
      'thisYear': 'This Year',
      'custom': 'Custom Range'
    };
    return labels[value] || value;
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

  getFormatIcon(format: string): string {
    const icons: { [key: string]: string } = {
      'PDF': 'fa-file-pdf',
      'Excel': 'fa-file-excel',
      'CSV': 'fa-file-csv'
    };
    return icons[format] || 'fa-file';
  }

  getCategoryIcon(categoryId: string): string {
    const category = this.reportCategories.find(c => c.id === categoryId);
    return category ? category.icon : 'fa-file';
  }
}
