import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

// Interface matching DisplayProduct from products component
interface CompareProduct {
  id: string;
  name: string;
  price: number;
  unit?: string;
  rating: number;
  reviews: number;
  vendor: string;
  vendorId?: string;
  district: string;
  category: string;
  categoryId?: string;
  image: string;
  giTagged?: boolean;
  originStory?: string;
  discount?: number;
}

export interface CompareDialogData {
  products: CompareProduct[];
  allProducts: CompareProduct[];
}

@Component({
  selector: 'app-compare-dialog',
  templateUrl: './compare-dialog.component.html',
  styleUrls: ['./compare-dialog.component.css']
})
export class CompareDialogComponent implements OnInit {
  compareProducts: CompareProduct[] = [];
  allProducts: CompareProduct[] = [];
  highlightBestValue: boolean = true;

  // Comparison attributes
  attributes = [
    { key: 'price', label: 'Price', type: 'price', icon: 'fas fa-rupee-sign' },
    { key: 'rating', label: 'Rating', type: 'rating', icon: 'fas fa-star' },
    { key: 'reviews', label: 'Reviews', type: 'number', icon: 'fas fa-comment' },
    { key: 'vendor', label: 'Artisan/Vendor', type: 'text', icon: 'fas fa-user' },
    { key: 'district', label: 'Origin', type: 'text', icon: 'fas fa-map-marker-alt' },
    { key: 'category', label: 'Category', type: 'text', icon: 'fas fa-tag' },
    { key: 'giTagged', label: 'GI Certified', type: 'boolean', icon: 'fas fa-certificate' }
  ];

  constructor(
    public dialogRef: MatDialogRef<CompareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompareDialogData,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.compareProducts = data.products;
    this.allProducts = data.allProducts;
  }

  ngOnInit(): void {}

  close(): void {
    this.dialogRef.close();
  }

  removeProduct(productId: string): void {
    this.compareProducts = this.compareProducts.filter(p => p.id !== productId);
    if (this.compareProducts.length < 2) {
      this.snackBar.open('Need at least 2 products to compare', 'Close', {
        duration: 2000
      });
    }
  }

  addMoreProducts(): void {
    // Dynamic import for compare select dialog
    import('../compare-select-dialog/compare-select-dialog.component').then(module => {
      const dialogRef = this.dialog.open(module.CompareSelectDialogComponent, {
        data: {
          products: this.allProducts,
          selectedIds: this.compareProducts.map(p => p.id),
          maxItems: 4
        },
        width: '800px',
        maxWidth: '95vw',
        maxHeight: '80vh',
        panelClass: 'compare-select-dialog-container'
      });

      dialogRef.afterClosed().subscribe((selectedIds: string[] | undefined) => {
        if (selectedIds) {
          this.compareProducts = selectedIds
            .map(id => this.allProducts.find(p => p.id === id))
            .filter((p): p is CompareProduct => p !== undefined);
        }
      });
    });
  }

  viewProduct(productId: string): void {
    this.dialogRef.close();
    this.router.navigate(['/product_detail', productId]);
  }

  addToCart(product: CompareProduct): void {
    this.snackBar.open(`${product.name} added to cart!`, 'View Cart', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  // Get attribute value for product
  getAttributeValue(product: CompareProduct, key: string): any {
    return (product as any)[key];
  }

  // Format display value based on type
  formatValue(value: any, type: string): string {
    if (value === undefined || value === null) return '-';
    
    switch (type) {
      case 'price':
        return '₹' + value.toLocaleString('en-IN');
      case 'rating':
        return value.toFixed(1) + ' ★';
      case 'number':
        return value.toLocaleString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  }

  // Check if value is the best among compared products
  isBestValue(key: string, value: any, type: string): boolean {
    if (!this.highlightBestValue || value === undefined || value === null) return false;
    
    const values = this.compareProducts.map(p => (p as any)[key]).filter(v => v !== undefined && v !== null);
    
    switch (type) {
      case 'price':
        return value === Math.min(...values); // Lower is better for price
      case 'rating':
      case 'number':
        return value === Math.max(...values); // Higher is better
      case 'boolean':
        return value === true; // True is better for certifications
      default:
        return false;
    }
  }

  // Generate star rating display
  generateStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }

  // Get original price if discount exists
  getOriginalPrice(price: number, discount?: number): number {
    if (!discount || discount <= 0) return price;
    return Math.round(price / (1 - discount / 100));
  }
}
