import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ProductServiceService } from '../../../project/services/product-service.service';
import { UserStateService } from '../../../project/services/user-state.service';
import { Product } from '../../../project/models/product';
import { VendorDto as Vendor } from '../../../project/models/vendor';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  image: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastRestocked: string;
  price: number;
}

interface StockAlert {
  productName: string;
  currentStock: number;
  minStock: number;
  urgency: 'critical' | 'warning' | 'info';
}

@Component({
  selector: 'app-vendor-dashboard-inventory',
  templateUrl: './vendor-dashboard-inventory.component.html',
  styleUrls: ['./vendor-dashboard-inventory.component.css']
})
export class VendorDashboardInventoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading states
  isLoading = false;
  loadError: string | null = null;
  vendorId: string = '';

  // Inventory Stats
  inventoryStats = {
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  };

  // Inventory Items
  inventoryItems: InventoryItem[] = [];

  // Stock Alerts
  stockAlerts: StockAlert[] = [];

  // Filters
  selectedCategory: string = 'all';
  selectedStatus: string = 'all';
  searchQuery: string = '';

  categories: string[] = ['All'];

  constructor(
    private productService: ProductServiceService,
    private userStateService: UserStateService
  ) { }

  ngOnInit(): void {
    this.initializeVendor();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeVendor(): void {
    this.userStateService.vendor$
      .pipe(takeUntil(this.destroy$))
      .subscribe((vendor: Vendor | null) => {
        if (vendor && vendor.vendorId) {
          this.vendorId = vendor.vendorId;
          this.loadInventory();
        } else {
          this.loadError = 'Vendor not authenticated';
        }
      });
  }

  loadInventory(): void {
    this.isLoading = true;
    this.loadError = null;

    this.productService.getProductByVendorId(this.vendorId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (products: Product[]) => {
          this.processInventoryData(products);
        },
        error: (error) => {
          console.error('Error loading inventory:', error);
          this.loadError = error.error?.message || 'Failed to load inventory. Please try again.';
        }
      });
  }

  private processInventoryData(products: Product[]): void {
    // Map products to inventory items
    this.inventoryItems = products.map(p => this.mapToInventoryItem(p));
    
    // Calculate stats
    this.calculateStats();
    
    // Generate stock alerts
    this.generateStockAlerts();
    
    // Extract categories
    this.extractCategories();
  }

  private mapToInventoryItem(product: Product): InventoryItem {
    const stock = product.productQuantity || 0;
    const minStock = 10; // Default minimum stock threshold
    const maxStock = 100; // Default maximum stock capacity
    
    let status: 'in-stock' | 'low-stock' | 'out-of-stock';
    if (stock === 0) {
      status = 'out-of-stock';
    } else if (stock < minStock) {
      status = 'low-stock';
    } else {
      status = 'in-stock';
    }

    return {
      id: product.productId || '',
      name: product.productName || 'Unnamed Product',
      sku: product.productId?.substring(0, 8).toUpperCase() || 'SKU-XXX',
      category: product.subCategory || product.categoryId || 'Uncategorized',
      image: product.productImageURL || 'assets/products/placeholder.jpg',
      currentStock: stock,
      minStock: minStock,
      maxStock: maxStock,
      status: status,
      lastRestocked: 'N/A', // Would need a separate field in backend
      price: product.price || 0
    };
  }

  private calculateStats(): void {
    this.inventoryStats = {
      totalProducts: this.inventoryItems.length,
      inStock: this.inventoryItems.filter(i => i.status === 'in-stock').length,
      lowStock: this.inventoryItems.filter(i => i.status === 'low-stock').length,
      outOfStock: this.inventoryItems.filter(i => i.status === 'out-of-stock').length,
      totalValue: this.inventoryItems.reduce((sum, item) => sum + (item.price * item.currentStock), 0)
    };
  }

  private generateStockAlerts(): void {
    this.stockAlerts = this.inventoryItems
      .filter(item => item.status !== 'in-stock')
      .map(item => ({
        productName: item.name,
        currentStock: item.currentStock,
        minStock: item.minStock,
        urgency: item.currentStock === 0 ? 'critical' as const : 'warning' as const
      }))
      .sort((a, b) => {
        // Sort by urgency (critical first)
        if (a.urgency === 'critical' && b.urgency !== 'critical') return -1;
        if (a.urgency !== 'critical' && b.urgency === 'critical') return 1;
        return a.currentStock - b.currentStock;
      })
      .slice(0, 10); // Limit to top 10 alerts
  }

  private extractCategories(): void {
    const uniqueCategories = new Set<string>();
    this.inventoryItems.forEach(item => {
      if (item.category && item.category !== 'Uncategorized') {
        uniqueCategories.add(item.category);
      }
    });
    this.categories = ['All', ...Array.from(uniqueCategories)];
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStockPercentage(item: InventoryItem): number {
    if (item.maxStock === 0) return 0;
    return (item.currentStock / item.maxStock) * 100;
  }

  updateStock(item: InventoryItem): void {
    console.log('Opening stock update dialog for:', item.name);
    // TODO: Implement stock update modal
  }

  restockItem(item: InventoryItem): void {
    console.log('Restocking item:', item.name);
    // TODO: Implement restock functionality
  }

  exportInventory(): void {
    console.log('Exporting inventory...');
    // Generate CSV export
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Stock', 'Status', 'Price'];
    const csvContent = [
      headers.join(','),
      ...this.filteredItems.map(item => 
        [item.id, `"${item.name}"`, item.sku, item.category, item.currentStock, item.status, item.price].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  bulkUpdate(): void {
    console.log('Opening bulk update dialog...');
    // TODO: Implement bulk update modal
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category.toLowerCase();
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
  }

  refreshInventory(): void {
    this.loadInventory();
  }

  get filteredItems(): InventoryItem[] {
    return this.inventoryItems.filter(item => {
      const matchesCategory = this.selectedCategory === 'all' || item.category.toLowerCase() === this.selectedCategory.toLowerCase();
      const matchesStatus = this.selectedStatus === 'all' || item.status === this.selectedStatus;
      const matchesSearch = item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                           item.sku.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }
}
