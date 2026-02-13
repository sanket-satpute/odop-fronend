import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ProductServiceService } from '../../../project/services/product-service.service';
import { UserStateService } from '../../../project/services/user-state.service';
import { Product } from '../../../project/models/product';

interface ProductDisplay {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  isLowStock?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
}

@Component({
  selector: 'app-vendor-dashboard-manage-products',
  templateUrl: './vendor-dashboard-manage-products.component.html',
  styleUrls: ['./vendor-dashboard-manage-products.component.css']
})
export class VendorDashboardManageProductsComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  private vendorId: string = '';

  productList: ProductDisplay[] = [];
  filteredProducts: ProductDisplay[] = [];
  
  // Loading and error states
  isLoading: boolean = false;
  loadError: string | null = null;
  
  // Filter properties
  searchQuery: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalProducts: number = 0;
  totalPages: number = 0;
  
  // Categories extracted from products
  categories: { value: string; label: string }[] = [
    { value: '', label: 'All Categories' }
  ];

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  // Math for template
  Math = Math;

  constructor(
    private productService: ProductServiceService,
    private userStateService: UserStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get vendor ID from user state
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

    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    if (!this.vendorId) {
      this.loadError = 'No vendor ID found. Please login again.';
      return;
    }

    this.isLoading = true;
    this.loadError = null;

    this.productService.getProductByVendorId(this.vendorId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (products: Product[]) => {
        this.productList = this.mapProductsToDisplay(products);
        this.extractCategories();
        this.applyFilters();
        this.updatePagination();
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loadError = error.error?.message || 'Failed to load products. Please try again.';
      }
    });
  }

  private mapProductsToDisplay(products: Product[]): ProductDisplay[] {
    return products.map(p => {
      const stock = p.productQuantity || 0;
      const isLowStock = stock < 10;
      const isBestseller = (p.totalSold || 0) > 50;
      const price = p.discount ? (p.price || 0) * (1 - (p.discount / 100)) : (p.price || 0);

      return {
        id: p.productId || '',
        name: p.productName || 'Unnamed Product',
        sku: p.productId?.substring(0, 8).toUpperCase() || 'SKU-XXX',
        price: price,
        stock: stock,
        category: p.subCategory || p.categoryId || 'Uncategorized',
        image: p.productImageURL || 'assets/products/placeholder.jpg',
        active: stock > 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isLowStock,
        isBestseller,
        isNew: false
      };
    });
  }

  private isRecent(date: Date): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date > thirtyDaysAgo;
  }

  private extractCategories(): void {
    const uniqueCategories = new Set<string>();
    this.productList.forEach(p => {
      if (p.category) {
        uniqueCategories.add(p.category);
      }
    });
    
    this.categories = [
      { value: '', label: 'All Categories' },
      ...Array.from(uniqueCategories).map(cat => ({ value: cat, label: cat }))
    ];
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = this.productList.filter(product => {
      const matchesSearch = !this.searchQuery || 
        product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || product.category === this.selectedCategory;
      
      const matchesStatus = !this.selectedStatus || 
        (this.selectedStatus === 'active' && product.active) ||
        (this.selectedStatus === 'inactive' && !product.active);

      return matchesSearch && matchesCategory && matchesStatus;
    });

    this.totalProducts = filtered.length;
    this.totalPages = Math.ceil(this.totalProducts / this.itemsPerPage);
    
    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredProducts = filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  toggleProductStatus(product: ProductDisplay): void {
    product.active = !product.active;
    // TODO: Call API to update product status
    console.log('Toggle status for product:', product.id, 'to', product.active);
  }

  editProduct(product: ProductDisplay): void {
    // Navigate to edit product page
    this.router.navigate(['/vendor/edit-product', product.id]);
  }

  deleteProduct(product: ProductDisplay): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.productService.deleteProductById(product.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.productList = this.productList.filter(p => p.id !== product.id);
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          alert('Failed to delete product. Please try again.');
        }
      });
    }
  }

  addProduct(): void {
    this.router.navigate(['/vendor/add-product']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  }

  refreshData(): void {
    this.loadProducts();
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.totalProducts / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
      this.applyFilters();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilters();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilters();
    }
  }

  trackByProduct(index: number, product: ProductDisplay): string {
    return product.id;
  }

  openAddProductModal(): void {
    this.addProduct();
  }

  filterProducts(): void {
    this.applyFilters();
  }
}
