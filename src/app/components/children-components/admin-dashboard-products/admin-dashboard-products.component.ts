// product-management.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductServiceService } from '../../../project/services/product-service.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Product {
  id: string;
  name: string;
  sku: string;
  vendor: string;
  vendorEmail: string;
  category: string;
  price: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  dateAdded: Date;
  thumbnail: string;
  images: string[];
  description: string;
}

interface FilterTab {
  key: string;
  label: string;
  count: number;
}

interface SummaryCard {
  label: string;
  count: number;
  icon: string;
  trend: 'up' | 'down';
  trendIcon: string;
  trendValue: string;
}

@Component({
  selector: 'app-admin-dashboard-products',
  templateUrl: './admin-dashboard-products.component.html',
  styleUrls: ['./admin-dashboard-products.component.css']
})
export class AdminDashboardProductsComponent  implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data Properties
  products: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  selectedProducts: string[] = [];
  selectedProduct: Product | null = null;
  
  // Filter Properties
  filterTabs: FilterTab[] = [
    { key: 'all', label: 'All Products', count: 0 },
    { key: 'pending', label: 'Pending', count: 0 },
    { key: 'approved', label: 'Approved', count: 0 },
    { key: 'rejected', label: 'Rejected', count: 0 }
  ];
  
  summaryCards: SummaryCard[] = [
    {
      label: 'Total Products',
      count: 0,
      icon: 'fas fa-cube',
      trend: 'up',
      trendIcon: 'fas fa-arrow-up',
      trendValue: '+12%'
    },
    {
      label: 'Approved',
      count: 0,
      icon: 'fas fa-check-circle',
      trend: 'up',
      trendIcon: 'fas fa-arrow-up',
      trendValue: '+8%'
    },
    {
      label: 'Pending Approval',
      count: 0,
      icon: 'fas fa-clock',
      trend: 'down',
      trendIcon: 'fas fa-arrow-down',
      trendValue: '-5%'
    },
    {
      label: 'Rejected',
      count: 0,
      icon: 'fas fa-times-circle',
      trend: 'up',
      trendIcon: 'fas fa-arrow-up',
      trendValue: '+3%'
    }
  ];
  
  // Filter & Search Properties
  activeTab: string = 'all';
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedVendor: string = '';
  sortBy: string = 'name';
  
  // Pagination Properties
  currentPage: number = 1;
  pageSize: number = 10;
  totalProducts: number = 0;
  totalPages: number = 0;
  
  // UI Properties
  showBulkDropdown: boolean = false;
  currentImageIndex: number = 0;
  
  // Dropdown Options
  categories: string[] = [];
  vendors: string[] = [];
  
  // Math reference for template
  Math = Math;
  
  // Loading state
  loading: boolean = false;
  adminId: string = '';  // Will be set from auth service

  constructor(
    private productService: ProductServiceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    // In a real app, you'd use a FormControl with valueChanges
    // For now, we'll handle it in the onSearch method
  }

  loadProducts(): void {
    this.loading = true;
    
    // Load all products and approval stats from backend
    this.productService.getAllProducts().subscribe({
      next: (products: any[]) => {
        this.products = products.map(p => this.mapApiProductToLocalProduct(p));
        this.extractFilters();
        this.updateCounts();
        this.applyFilters();
        this.loadApprovalStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.snackBar.open('Failed to load products. Please try again.', 'Close', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.loading = false;
      }
    });
  }

  private loadApprovalStats(): void {
    this.productService.getApprovalStats().subscribe({
      next: (stats: any) => {
        // Update summary cards with real stats
        this.summaryCards[0].count = stats.totalProducts || 0;
        this.summaryCards[1].count = stats.approved || 0;
        this.summaryCards[2].count = stats.pendingApproval || 0;
        this.summaryCards[3].count = stats.rejected || 0;
      },
      error: (err) => {
        console.error('Failed to load approval stats:', err);
      }
    });
  }

  private mapApiProductToLocalProduct(apiProduct: any): Product {
    const statusMap: { [key: string]: 'Pending' | 'Approved' | 'Rejected' } = {
      'PENDING': 'Pending',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected'
    };
    
    return {
      id: apiProduct.productId || apiProduct.id,
      name: apiProduct.productName || apiProduct.name || 'Unknown',
      sku: apiProduct.productId || 'N/A',
      vendor: apiProduct.vendorId || 'Unknown Vendor',
      vendorEmail: '',
      category: apiProduct.categoryId || 'Uncategorized',
      price: apiProduct.price || 0,
      status: statusMap[apiProduct.approvalStatus] || 'Pending',
      dateAdded: apiProduct.createdAt ? new Date(apiProduct.createdAt) : new Date(),
      thumbnail: apiProduct.productImageURL || 'https://via.placeholder.com/150',
      images: apiProduct.productImageURL ? [apiProduct.productImageURL] : [],
      description: apiProduct.productDescription || ''
    };
  }

  private extractFilters(): void {
    // Extract unique categories and vendors
    this.categories = [...new Set(this.products.map(p => p.category))].sort();
    this.vendors = [...new Set(this.products.map(p => p.vendor))].sort();
  }

  private updateCounts(): void {
    const totalCount = this.products.length;
    const pendingCount = this.products.filter(p => p.status === 'Pending').length;
    const approvedCount = this.products.filter(p => p.status === 'Approved').length;
    const rejectedCount = this.products.filter(p => p.status === 'Rejected').length;

    this.filterTabs[0].count = totalCount;
    this.filterTabs[1].count = pendingCount;
    this.filterTabs[2].count = approvedCount;
    this.filterTabs[3].count = rejectedCount;

    this.summaryCards[0].count = totalCount;
    this.summaryCards[1].count = approvedCount;
    this.summaryCards[2].count = pendingCount;
    this.summaryCards[3].count = rejectedCount;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilter(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.products];

    // Apply status filter
    if (this.activeTab !== 'all') {
      const statusMap = {
        'pending': 'Pending',
        'approved': 'Approved',
        'rejected': 'Rejected'
      };
      filtered = filtered.filter(p => p.status === statusMap[this.activeTab as keyof typeof statusMap]);
    }

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.vendor.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    // Apply vendor filter
    if (this.selectedVendor) {
      filtered = filtered.filter(p => p.vendor === this.selectedVendor);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.dateAdded.getTime() - a.dateAdded.getTime();
        case 'price':
          return a.price - b.price;
        default:
          return 0;
      }
    });

    this.filteredProducts = filtered;
    this.totalProducts = filtered.length;
    this.totalPages = Math.ceil(this.totalProducts / this.pageSize);
    this.updatePagination();
  }

  private updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Selection Methods
  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.selectedProducts = [];
    } else {
      this.selectedProducts = this.paginatedProducts.map(p => p.id);
    }
  }

  toggleSelection(productId: string): void {
    const index = this.selectedProducts.indexOf(productId);
    if (index > -1) {
      this.selectedProducts.splice(index, 1);
    } else {
      this.selectedProducts.push(productId);
    }
  }

  isSelected(productId: string): boolean {
    return this.selectedProducts.includes(productId);
  }

  isAllSelected(): boolean {
    return this.paginatedProducts.length > 0 && 
           this.paginatedProducts.every(p => this.selectedProducts.includes(p.id));
  }

  clearSelection(): void {
    this.selectedProducts = [];
  }

  // Bulk Actions
  toggleBulkDropdown(): void {
    this.showBulkDropdown = !this.showBulkDropdown;
  }

  bulkApprove(): void {
    this.selectedProducts.forEach(id => {
      const product = this.products.find(p => p.id === id);
      if (product) {
        product.status = 'Approved';
      }
    });
    this.clearSelection();
    this.showBulkDropdown = false;
    this.updateCounts();
    this.applyFilters();
  }

  bulkReject(): void {
    this.selectedProducts.forEach(id => {
      const product = this.products.find(p => p.id === id);
      if (product) {
        product.status = 'Rejected';
      }
    });
    this.clearSelection();
    this.showBulkDropdown = false;
    this.updateCounts();
    this.applyFilters();
  }

  bulkDelete(): void {
    if (confirm('Are you sure you want to delete the selected products?')) {
      this.products = this.products.filter(p => !this.selectedProducts.includes(p.id));
      this.clearSelection();
      this.showBulkDropdown = false;
      this.extractFilters();
      this.updateCounts();
      this.applyFilters();
    }
  }

  // Product Actions
  viewProduct(product: Product): void {
    this.selectedProduct = product;
    this.currentImageIndex = 0;
  }

  closeModal(): void {
    this.selectedProduct = null;
  }

  approveProduct(productId: string): void {
    // Get admin ID from local storage or auth service
    const adminId = localStorage.getItem('adminId') || 'admin';
    
    this.productService.approveProduct(productId, adminId).subscribe({
      next: (updatedProduct) => {
        const product = this.products.find(p => p.id === productId);
        if (product) {
          product.status = 'Approved';
          this.updateCounts();
          this.applyFilters();
          if (this.selectedProduct && this.selectedProduct.id === productId) {
            this.selectedProduct.status = 'Approved';
          }
        }
        this.snackBar.open('Product approved successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.loadApprovalStats();
      },
      error: (err) => {
        console.error('Failed to approve product:', err);
        this.snackBar.open('Failed to approve product. Please try again.', 'Close', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  rejectProduct(productId: string): void {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    
    // Get admin ID from local storage or auth service
    const adminId = localStorage.getItem('adminId') || 'admin';
    
    this.productService.rejectProduct(productId, adminId, reason).subscribe({
      next: (updatedProduct) => {
        const product = this.products.find(p => p.id === productId);
        if (product) {
          product.status = 'Rejected';
          this.updateCounts();
          this.applyFilters();
          if (this.selectedProduct && this.selectedProduct.id === productId) {
            this.selectedProduct.status = 'Rejected';
          }
        }
        this.snackBar.open('Product rejected.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.loadApprovalStats();
      },
      error: (err) => {
        console.error('Failed to reject product:', err);
        this.snackBar.open('Failed to reject product. Please try again.', 'Close', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  deleteProduct(productId: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProductById(productId).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== productId);
          this.extractFilters();
          this.updateCounts();
          this.applyFilters();
          
          if (this.selectedProduct && this.selectedProduct.id === productId) {
            this.closeModal();
          }
          
          this.snackBar.open('Product deleted successfully.', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        },
        error: (err) => {
          console.error('Failed to delete product:', err);
          this.snackBar.open('Failed to delete product. Please try again.', 'Close', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  exportData(): void {
    // Implement export functionality
    const dataToExport = this.filteredProducts.map(product => ({
      'Product Name': product.name,
      'SKU': product.sku,
      'Vendor': product.vendor,
      'Category': product.category,
      'Price': product.price,
      'Status': product.status,
      'Date Added': product.dateAdded.toLocaleDateString()
    }));

    const csvContent = this.convertToCSV(dataToExport);
    this.downloadCSV(csvContent, 'products-export.csv');
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Track by function for *ngFor performance
  trackByProduct(index: number, product: Product): string {
    return product.id;
  }
}