import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CompareService } from '../../project/services/compare.service';
import { Product } from '../../project/models/product';

@Component({
  selector: 'app-compare-page',
  templateUrl: './compare-page.component.html',
  styleUrls: ['./compare-page.component.css']
})
export class ComparePageComponent implements OnInit, OnDestroy {
  compareProducts: Product[] = [];
  private subscription!: Subscription;

  // Define comparison attributes
  comparisonAttributes = [
    { key: 'productName', label: 'Product Name', type: 'text' },
    { key: 'subCategory', label: 'Category', type: 'text' },
    { key: 'price', label: 'Price', type: 'currency' },
    { key: 'rating', label: 'Rating', type: 'rating' },
    { key: 'originDistrict', label: 'Origin', type: 'text' },
    { key: 'originState', label: 'State', type: 'text' },
    { key: 'giTagCertified', label: 'GI Certified', type: 'boolean' },
    { key: 'craftType', label: 'Craft Type', type: 'text' },
    { key: 'materialsUsed', label: 'Materials', type: 'text' },
    { key: 'warranty', label: 'Warranty', type: 'text' },
    { key: 'productQuantity', label: 'Stock', type: 'stock' }
  ];

  constructor(
    private compareService: CompareService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.compareService.compareList$.subscribe(products => {
      this.compareProducts = products;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  removeProduct(productId: string): void {
    this.compareService.removeFromCompare(productId);
  }

  clearAll(): void {
    this.compareService.clearCompare();
  }

  viewProduct(productId: string | undefined): void {
    if (productId) {
      this.router.navigate(['/product_detail', productId]);
    }
  }

  getValue(product: Product, key: string): any {
    return (product as any)[key];
  }

  getDisplayValue(product: Product, attr: any): string {
    const value = this.getValue(product, attr.key);
    
    if (value === undefined || value === null || value === '') {
      return '-';
    }

    switch (attr.type) {
      case 'currency':
        return `₹${value.toLocaleString()}`;
      case 'rating':
        return value ? `${value}/5` : '-';
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'stock':
        return value > 0 ? `${value} in stock` : 'Out of stock';
      default:
        return String(value);
    }
  }

  isHighlight(attr: any, product: Product): boolean {
    if (attr.type === 'currency') {
      const value = this.getValue(product, attr.key);
      const minPrice = Math.min(...this.compareProducts.map(p => this.getValue(p, attr.key) || Infinity));
      return value === minPrice;
    }
    if (attr.type === 'rating') {
      const value = this.getValue(product, attr.key);
      const maxRating = Math.max(...this.compareProducts.map(p => this.getValue(p, attr.key) || 0));
      return value === maxRating && value > 0;
    }
    if (attr.key === 'giTagCertified') {
      return this.getValue(product, attr.key) === true;
    }
    return false;
  }

  browseProducts(): void {
    this.router.navigate(['/products']);
  }
}
