import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  ProductVariantService, 
  ProductVariant, 
  VariantAttribute,
  AttributeValue 
} from '../../services/product-variant.service';

interface SelectedAttributes {
  [key: string]: string;
}

@Component({
  selector: 'app-product-variant-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-variant-selector.component.html',
  styleUrls: ['./product-variant-selector.component.css']
})
export class ProductVariantSelectorComponent implements OnInit, OnChanges {
  @Input() productId!: string;
  @Input() showPrice = true;
  @Input() showStock = true;
  @Input() compactMode = false;

  @Output() variantSelected = new EventEmitter<ProductVariant>();
  @Output() addToCart = new EventEmitter<{ variant: ProductVariant; quantity: number }>();

  // Data
  variants: ProductVariant[] = [];
  attributes: VariantAttribute[] = [];
  selectedVariant: ProductVariant | null = null;
  selectedAttributes: SelectedAttributes = {};

  // UI State
  isLoading = true;
  quantity = 1;
  maxQuantity = 10;
  showSizeGuide = false;
  errorMessage = '';

  constructor(private variantService: ProductVariantService) {}

  ngOnInit(): void {
    if (this.productId) {
      this.loadVariants();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && !changes['productId'].firstChange) {
      this.resetSelection();
      this.loadVariants();
    }
  }

  private loadVariants(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.variantService.getActiveProductVariants(this.productId).subscribe({
      next: (response: any) => {
        this.variants = response.variants || [];
        this.loadAttributes();
        this.selectDefaultVariant();
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to load product options';
        this.isLoading = false;
        console.error('Error loading variants:', err);
      }
    });
  }

  private loadAttributes(): void {
    this.variantService.getAvailableAttributes(this.productId).subscribe({
      next: (response: any) => {
        this.attributes = response.attributes || [];
      },
      error: (err: any) => console.error('Error loading attributes:', err)
    });
  }

  private selectDefaultVariant(): void {
    // Find default variant or first available
    const defaultVariant = this.variants.find(v => v.isDefault) || 
                          this.variants.find(v => v.availableStock > 0) ||
                          this.variants[0];
    
    if (defaultVariant) {
      this.selectedAttributes = { ...defaultVariant.attributes };
      this.selectedVariant = defaultVariant;
      this.updateMaxQuantity();
      this.variantSelected.emit(defaultVariant);
    }
  }

  private resetSelection(): void {
    this.selectedAttributes = {};
    this.selectedVariant = null;
    this.quantity = 1;
  }

  // ==================== Attribute Selection ====================

  selectAttribute(attributeCode: string, value: string): void {
    this.selectedAttributes[attributeCode] = value;
    this.findMatchingVariant();
  }

  isAttributeSelected(attributeCode: string, value: string): boolean {
    return this.selectedAttributes[attributeCode] === value;
  }

  isAttributeAvailable(attributeCode: string, value: string): boolean {
    // Check if any variant with this attribute value is in stock
    const testAttributes = { ...this.selectedAttributes, [attributeCode]: value };
    
    return this.variants.some(variant => {
      const matches = Object.keys(testAttributes).every(
        key => variant.attributes[key] === testAttributes[key]
      );
      return matches && variant.availableStock > 0;
    });
  }

  private findMatchingVariant(): void {
    const matchingVariant = this.variants.find(variant => {
      return Object.keys(this.selectedAttributes).every(
        key => variant.attributes[key] === this.selectedAttributes[key]
      );
    });

    if (matchingVariant) {
      this.selectedVariant = matchingVariant;
      this.updateMaxQuantity();
      this.variantSelected.emit(matchingVariant);
    } else {
      this.selectedVariant = null;
    }
  }

  private updateMaxQuantity(): void {
    if (this.selectedVariant) {
      this.maxQuantity = Math.min(this.selectedVariant.availableStock, 10);
      if (this.quantity > this.maxQuantity) {
        this.quantity = this.maxQuantity;
      }
    }
  }

  // ==================== Quantity ====================

  incrementQuantity(): void {
    if (this.quantity < this.maxQuantity) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  // ==================== Actions ====================

  onAddToCart(): void {
    if (this.selectedVariant && this.selectedVariant.availableStock > 0) {
      this.addToCart.emit({
        variant: this.selectedVariant,
        quantity: this.quantity
      });
    }
  }

  toggleSizeGuide(): void {
    this.showSizeGuide = !this.showSizeGuide;
  }

  // ==================== Helpers ====================

  getAttributeDisplayType(attribute: VariantAttribute): string {
    return attribute.displayType || 'BUTTONS';
  }

  getAttributeValues(attributeCode: string): AttributeValue[] {
    const attribute = this.attributes.find(a => a.code === attributeCode);
    if (attribute) {
      return attribute.values;
    }
    
    // Fallback: Extract unique values from variants
    const values = new Set<string>();
    this.variants.forEach(v => {
      if (v.attributes[attributeCode]) {
        values.add(v.attributes[attributeCode]);
      }
    });
    
    return Array.from(values).map((value, index) => ({
      value,
      label: value,
      displayOrder: index
    }));
  }

  getDiscountPercentage(): number {
    if (this.selectedVariant && this.selectedVariant.mrp > this.selectedVariant.price) {
      return Math.round((1 - this.selectedVariant.price / this.selectedVariant.mrp) * 100);
    }
    return 0;
  }

  getStockStatus(): string {
    if (!this.selectedVariant) return '';
    
    const stock = this.selectedVariant.availableStock;
    if (stock === 0) return 'Out of Stock';
    if (stock <= 5) return `Only ${stock} left!`;
    if (stock <= 10) return 'Low Stock';
    return 'In Stock';
  }

  getStockStatusClass(): string {
    if (!this.selectedVariant) return '';
    
    const stock = this.selectedVariant.availableStock;
    if (stock === 0) return 'out-of-stock';
    if (stock <= 5) return 'low-stock';
    return 'in-stock';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  }

  trackByAttributeCode(index: number, item: { key: string; value: any }): string {
    return item.key;
  }

  trackByValue(index: number, value: AttributeValue): string {
    return value.value;
  }
}
