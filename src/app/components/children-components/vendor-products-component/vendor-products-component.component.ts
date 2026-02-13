import { Component, OnInit, OnDestroy } from "@angular/core";
import { Product } from '../../../project/models/product';
import { ProductServiceService } from '../../../project/services/product-service.service';
import { UserStateService } from '../../../project/services/user-state.service';
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

interface ProductWithExtras extends Product {
  selected?: boolean;
  stockLevel?: number;
  salesCount?: number;
  viewCount?: number;
  lastUpdated?: Date;
  category?: string;
  productSingleImage?: string;
}

@Component({
  selector: 'app-vendor-products-component',
  templateUrl: './vendor-products-component.component.html',
  styleUrls: ['./vendor-products-component.component.css']
})
export class VendorProductsComponentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Vendor Info
  vendorId: string = '';
  
  // View & Display
  viewMode: 'grid' | 'list' | 'table' = 'grid';
  isLoading: boolean = true;
  showFilters: boolean = true;
  showBulkActions: boolean = false;
  loadError: string = '';
  
  // Products Data
  products: ProductWithExtras[] = [];
  filteredProducts: ProductWithExtras[] = [];
  
  // Filters
  searchQuery: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';
  selectedPromotion: string = '';
  selectedSort: string = 'newest';
  priceRange: { min: number; max: number } = { min: 0, max: 500000 };
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 1;
  
  // Categories - will be populated from products
  categories: string[] = ['All Categories'];
  
  // Bulk Selection
  selectAll: boolean = false;
  selectedCount: number = 0;

  // Quick Stats
  stats = {
    totalProducts: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
    promotionsActive: 0,
    avgRating: 0
  };

  Math = Math;

  constructor(
    private prod_service: ProductServiceService,
    private userStateService: UserStateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get vendor ID from user state
    const vendor = this.userStateService.vendor;
    if (vendor?.vendorId) {
      this.vendorId = vendor.vendorId;
      this.loadProducts();
    } else {
      // Subscribe to vendor changes in case it loads later
      this.userStateService.vendor$
        .pipe(takeUntil(this.destroy$))
        .subscribe(v => {
          if (v?.vendorId && !this.vendorId) {
            this.vendorId = v.vendorId;
            this.loadProducts();
          }
        });
      
      // Check localStorage as fallback
      const storedVendor = localStorage.getItem('vendor');
      if (storedVendor) {
        try {
          const parsedVendor = JSON.parse(storedVendor);
          if (parsedVendor?.vendorId) {
            this.vendorId = parsedVendor.vendorId;
            this.loadProducts();
          }
        } catch (e) {
          console.error('Error parsing vendor from storage:', e);
        }
      }
      
      if (!this.vendorId) {
        this.isLoading = false;
        this.loadError = 'No vendor logged in. Please log in to view your products.';
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    if (!this.vendorId) {
      this.isLoading = false;
      this.loadError = 'No vendor ID available';
      return;
    }

    this.isLoading = true;
    this.loadError = '';

    this.prod_service.getProductByVendorId(this.vendorId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (products: Product[]) => {
          // Map backend products to ProductWithExtras
          this.products = products.map(product => this.mapProductToExtras(product));
          
          // Extract unique categories from products
          this.extractCategories();
          
          this.calculateStats();
          this.applyFilters();
          
          if (this.products.length === 0) {
            this.snackBar.open('No products found. Add your first product!', 'Add Product', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            }).onAction().subscribe(() => {
              this.router.navigate(['/vendor-dashboard/add-product']);
            });
          }
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.loadError = 'Failed to load products. Please try again.';
          this.snackBar.open('Failed to load products', 'Retry', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          }).onAction().subscribe(() => {
            this.loadProducts();
          });
        }
      });
  }

  /**
   * Map backend Product to ProductWithExtras for UI
   */
  private mapProductToExtras(product: Product): ProductWithExtras {
    return {
      ...product,
      productSingleImage: product.productImageURL || '',
      stockLevel: product.productQuantity || 0,
      salesCount: product.totalSold || 0,
      viewCount: product.popularityScore || 0,
      category: product.craftType || product.categoryId || 'Uncategorized',
      lastUpdated: new Date(), // Backend should provide updatedAt
      selected: false
    };
  }

  /**
   * Extract unique categories from loaded products
   */
  private extractCategories(): void {
    const categorySet = new Set<string>();
    categorySet.add('All Categories');
    
    this.products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
      if (product.craftType) {
        categorySet.add(product.craftType);
      }
    });
    
    this.categories = Array.from(categorySet);
  }

  /**
   * Refresh products from API
   */
  refreshProducts(): void {
    this.loadProducts();
    this.snackBar.open('Refreshing products...', '', {
      duration: 1500,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  calculateStats(): void {
    this.stats.totalProducts = this.products.length;
    this.stats.totalValue = this.products.reduce((sum, p) => sum + (p.price || 0), 0);
    this.stats.lowStock = this.products.filter(p => (p.stockLevel || 0) > 0 && (p.stockLevel || 0) <= 20).length;
    this.stats.outOfStock = this.products.filter(p => (p.stockLevel || 0) === 0).length;
    this.stats.promotionsActive = this.products.filter(p => p.promotionEnabled).length;
    this.stats.avgRating = this.products.reduce((sum, p) => sum + (p.rating || 0), 0) / this.products.length;
  }

  // View Mode
  setViewMode(mode: 'grid' | 'list' | 'table'): void {
    this.viewMode = mode;
    this.itemsPerPage = mode === 'table' ? 10 : mode === 'list' ? 6 : 9;
    this.calculatePagination();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // Discount Methods
  add(value: number | undefined): number {
    if (typeof value !== "undefined") {
      const newValue = value + 1;
      return newValue <= 100 ? newValue : 100;
    }
    return 1;
  }

  minus(value: number | undefined): number {
    if (typeof value !== "undefined") {
      const newValue = value - 1;
      return newValue >= 0 ? newValue : 0;
    }
    return 0;
  }

  // Filter Methods
  applyFilters(): void {
    this.filteredProducts = this.products.filter(product => {
      let matches = true;

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        matches = matches && (
          (product.productName?.toLowerCase() || '').includes(query) ||
          (product.productDescription?.toLowerCase() || '').includes(query) ||
          (product.category?.toLowerCase() || '').includes(query)
        );
      }

      if (this.selectedCategory && this.selectedCategory !== 'All Categories') {
        matches = matches && product.category === this.selectedCategory;
      }

      if (this.selectedStatus && this.selectedStatus !== 'All Status') {
        if (this.selectedStatus === 'In Stock') {
          matches = matches && (product.stockLevel || 0) > 20;
        } else if (this.selectedStatus === 'Low Stock') {
          matches = matches && (product.stockLevel || 0) > 0 && (product.stockLevel || 0) <= 20;
        } else if (this.selectedStatus === 'Out of Stock') {
          matches = matches && (product.stockLevel || 0) === 0;
        }
      }

      if (this.selectedPromotion && this.selectedPromotion !== 'All Promotions') {
        if (this.selectedPromotion === 'Active') {
          matches = matches && !!product.promotionEnabled;
        } else if (this.selectedPromotion === 'Inactive') {
          matches = matches && !product.promotionEnabled;
        }
      }

      matches = matches && (product.price || 0) >= this.priceRange.min && (product.price || 0) <= this.priceRange.max;

      return matches;
    });

    this.applySorting();
    this.currentPage = 1;
    this.calculatePagination();
    this.updateSelectedCount();
  }

  applySorting(): void {
    switch (this.selectedSort) {
      case 'newest':
        this.filteredProducts.sort((a, b) => (b.lastUpdated?.getTime() || 0) - (a.lastUpdated?.getTime() || 0));
        break;
      case 'oldest':
        this.filteredProducts.sort((a, b) => (a.lastUpdated?.getTime() || 0) - (b.lastUpdated?.getTime() || 0));
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'price-low':
        this.filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'name-az':
        this.filteredProducts.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
        break;
      case 'name-za':
        this.filteredProducts.sort((a, b) => (b.productName || '').localeCompare(a.productName || ''));
        break;
      case 'best-selling':
        this.filteredProducts.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
      case 'rating':
        this.filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }
  }

  onSearchChange(event: any): void {
    this.searchQuery = event.target.value;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.selectedPromotion = '';
    this.searchQuery = '';
    this.selectedSort = 'newest';
    this.priceRange = { min: 0, max: 500000 };
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      (this.selectedCategory && this.selectedCategory !== 'All Categories') ||
      (this.selectedStatus && this.selectedStatus !== 'All Status') ||
      (this.selectedPromotion && this.selectedPromotion !== 'All Promotions')
    );
  }

  // Pagination
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  getPaginatedProducts(): ProductWithExtras[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Selection
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.getPaginatedProducts().forEach(p => p.selected = this.selectAll);
    this.updateSelectedCount();
  }

  toggleProductSelection(product: ProductWithExtras): void {
    product.selected = !product.selected;
    this.updateSelectedCount();
  }

  updateSelectedCount(): void {
    this.selectedCount = this.filteredProducts.filter(p => p.selected).length;
    this.showBulkActions = this.selectedCount > 0;
  }

  clearSelection(): void {
    this.products.forEach(p => p.selected = false);
    this.selectAll = false;
    this.updateSelectedCount();
  }

  // Product Actions
  editProduct(product: ProductWithExtras): void {
    this.router.navigate(['/vendor-dashboard/vendor-products'], { 
      queryParams: { edit: product.productId }
    });
    this.snackBar.open(`Editing: ${product.productName}`, 'Close', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  deleteProduct(product: ProductWithExtras): void {
    const confirmed = confirm(`Are you sure you want to delete "${product.productName}"?\n\nThis action cannot be undone.`);
    
    if (confirmed) {
      this.prod_service.deleteProductById(product.productId!).subscribe({
        next: (success) => {
          if (success) {
            this.products = this.products.filter(p => p.productId !== product.productId);
            this.calculateStats();
            this.applyFilters();
            this.snackBar.open(`"${product.productName}" has been deleted.`, 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        },
        error: () => {
          this.products = this.products.filter(p => p.productId !== product.productId);
          this.calculateStats();
          this.applyFilters();
          this.snackBar.open(`"${product.productName}" removed.`, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  previewProduct(product: ProductWithExtras): void {
    window.open(`/product-details/${product.productId}`, '_blank');
    this.snackBar.open(`Opening preview: ${product.productName}`, 'Close', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  duplicateProduct(product: ProductWithExtras): void {
    const newProduct: ProductWithExtras = {
      ...product,
      productId: Date.now().toString(),
      productName: `${product.productName} (Copy)`,
      selected: false,
      lastUpdated: new Date()
    };
    this.products.unshift(newProduct);
    this.calculateStats();
    this.applyFilters();
    this.snackBar.open(`Duplicated: ${product.productName}`, 'Close', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  togglePromotion(product: ProductWithExtras): void {
    product.promotionEnabled = !product.promotionEnabled;
    this.calculateStats();
    const status = product.promotionEnabled ? 'enabled' : 'disabled';
    this.snackBar.open(`Promotion ${status} for: ${product.productName}`, 'Close', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  // Bulk Actions
  bulkAction(action: string): void {
    const selectedProducts = this.filteredProducts.filter(p => p.selected);
    
    if (selectedProducts.length === 0) {
      this.snackBar.open('No products selected.', 'Close', { duration: 2000 });
      return;
    }

    switch (action) {
      case 'delete':
        const confirmed = confirm(`Delete ${selectedProducts.length} product(s)?`);
        if (confirmed) {
          selectedProducts.forEach(p => {
            this.products = this.products.filter(prod => prod.productId !== p.productId);
          });
          this.calculateStats();
          this.applyFilters();
          this.snackBar.open(`${selectedProducts.length} product(s) deleted.`, 'Close', { duration: 3000 });
        }
        break;
      case 'enable-promo':
        selectedProducts.forEach(p => p.promotionEnabled = true);
        this.calculateStats();
        this.clearSelection();
        this.snackBar.open(`Promotions enabled for ${selectedProducts.length} product(s).`, 'Close', { duration: 2000 });
        break;
      case 'disable-promo':
        selectedProducts.forEach(p => p.promotionEnabled = false);
        this.calculateStats();
        this.clearSelection();
        this.snackBar.open(`Promotions disabled for ${selectedProducts.length} product(s).`, 'Close', { duration: 2000 });
        break;
      case 'export':
        this.exportSelectedToCSV(selectedProducts);
        break;
    }
  }

  // Utility Methods
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getDiscountedPrice(product: ProductWithExtras): number {
    const discount = typeof product.discount === 'number' ? product.discount : 0;
    const price = typeof product.price === 'number' ? product.price : 0;
    return price - (price * discount / 100);
  }

  getStockStatus(product: ProductWithExtras): { label: string; class: string } {
    const stock = product.stockLevel || 0;
    if (stock === 0) {
      return { label: 'Out of Stock', class: 'out-of-stock' };
    } else if (stock <= 10) {
      return { label: 'Critical', class: 'critical' };
    } else if (stock <= 20) {
      return { label: 'Low Stock', class: 'low-stock' };
    }
    return { label: 'In Stock', class: 'in-stock' };
  }

  getStockPercentage(product: ProductWithExtras): number {
    const stock = product.stockLevel || 0;
    const maxStock = 250;
    return Math.min((stock / maxStock) * 100, 100);
  }

  addNewProduct(): void {
    this.router.navigate(['/vendor-dashboard/add-new-product']);
  }

  exportToCSV(): void {
    this.exportSelectedToCSV(this.filteredProducts);
  }

  exportSelectedToCSV(products: ProductWithExtras[]): void {
    const headers = ['Product ID', 'Name', 'Category', 'Price', 'Discount', 'Stock', 'Sales', 'Rating', 'Promotion'];
    const csvRows = [headers.join(',')];
    
    products.forEach(product => {
      const row = [
        product.productId || '',
        `"${(product.productName || '').replace(/"/g, '""')}"`,
        product.category || '',
        product.price || 0,
        (product.discount || 0) + '%',
        product.stockLevel || 0,
        product.salesCount || 0,
        product.rating || 0,
        product.promotionEnabled ? 'Active' : 'Inactive'
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.snackBar.open(`Exported ${products.length} products to CSV.`, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  getPromotionCount(): number {
    return this.products.filter(product => product.promotionEnabled).length;
  }

  getLowStockCount(): number {
    return this.products.filter(product => (product.stockLevel || 0) > 0 && (product.stockLevel || 0) <= 20).length;
  }

  getOutOfStockCount(): number {
    return this.products.filter(product => (product.stockLevel || 0) === 0).length;
  }

  getTotalValue(): number {
    return this.products.reduce((total, product) => total + (typeof product.price === 'number' ? product.price : 0), 0);
  }

  getRatingStars(rating: number): { full: number; half: boolean; empty: number } {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return { full, half, empty };
  }
}
