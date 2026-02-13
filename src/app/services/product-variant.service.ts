import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Product Variant interfaces
 */
export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: { [key: string]: string };
  price: number;
  mrp: number;
  costPrice?: number;
  stockQuantity: number;
  reservedQuantity: number;
  availableStock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  active: boolean;
  isDefault: boolean;
  imageUrls: string[];
  thumbnailUrl?: string;
  weight?: number;
  weightUnit?: string;
  barcode?: string;
  displayOrder: number;
  lowStock: boolean;
  outOfStock: boolean;
  discountPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVariantRequest {
  productId: string;
  sku?: string;
  attributes: { [key: string]: string };
  price: number;
  mrp?: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  active?: boolean;
  isDefault?: boolean;
  imageUrls?: string[];
  thumbnailUrl?: string;
  weight?: number;
  weightUnit?: string;
  barcode?: string;
  barcodeType?: string;
  displayOrder?: number;
}

export interface UpdateStockRequest {
  variantId: string;
  quantity: number;
  absolute?: boolean;
  reason?: string;
}

export interface GenerateVariantsRequest {
  basePrice: number;
  baseStock: number;
  attributeOptions: { [key: string]: string[] };
}

export interface AttributeValue {
  value: string;
  label: string;
  colorCode?: string;
  imageUrl?: string;
  displayOrder: number;
}

export interface VariantAttribute {
  id: string;
  code: string;
  name: string;
  description?: string;
  displayType: 'DROPDOWN' | 'BUTTONS' | 'COLOR_SWATCH' | 'SIZE_SELECTOR' | 'TEXT' | 'IMAGE_SELECTOR';
  values: AttributeValue[];
  required: boolean;
  categoryIds: string[];
  displayOrder: number;
  active: boolean;
}

/**
 * Service for managing product variants
 */
@Injectable({
  providedIn: 'root'
})
export class ProductVariantService {
  
  private apiUrl = `${environment.apiUrl}/odop/variants`;

  constructor(private http: HttpClient) { }

  // ==================== VARIANT CRUD ====================

  /**
   * Create a new variant
   */
  createVariant(request: CreateVariantRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}`, request);
  }

  /**
   * Update a variant
   */
  updateVariant(variantId: string, request: CreateVariantRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${variantId}`, request);
  }

  /**
   * Get variant by ID
   */
  getVariant(variantId: string): Observable<ProductVariant> {
    return this.http.get<ProductVariant>(`${this.apiUrl}/${variantId}`);
  }

  /**
   * Get variant by SKU
   */
  getVariantBySku(sku: string): Observable<ProductVariant> {
    return this.http.get<ProductVariant>(`${this.apiUrl}/sku/${sku}`);
  }

  /**
   * Get all variants for a product
   */
  getProductVariants(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/product/${productId}`);
  }

  /**
   * Get active variants for a product
   */
  getActiveProductVariants(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/product/${productId}/active`);
  }

  /**
   * Get default variant for a product
   */
  getDefaultVariant(productId: string): Observable<ProductVariant> {
    return this.http.get<ProductVariant>(`${this.apiUrl}/product/${productId}/default`);
  }

  /**
   * Delete a variant
   */
  deleteVariant(variantId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${variantId}`);
  }

  // ==================== STOCK MANAGEMENT ====================

  /**
   * Update variant stock
   */
  updateStock(request: UpdateStockRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/stock/update`, request);
  }

  /**
   * Check stock availability
   */
  checkStock(variantId: string, quantity: number): Observable<any> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.get(`${this.apiUrl}/${variantId}/stock/check`, { params });
  }

  /**
   * Get low stock variants
   */
  getLowStockVariants(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stock/low`);
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Create multiple variants at once
   */
  createBulkVariants(productId: string, variants: CreateVariantRequest[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk/${productId}`, variants);
  }

  /**
   * Generate variants from attribute combinations
   */
  generateVariants(productId: string, request: GenerateVariantsRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate/${productId}`, request);
  }

  /**
   * Get available attribute values for a product (in-stock only)
   */
  getAvailableAttributes(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/product/${productId}/available-attributes`);
  }

  // ==================== ATTRIBUTE MANAGEMENT ====================

  /**
   * Get all variant attributes
   */
  getAllAttributes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/attributes`);
  }

  /**
   * Get attributes for a category
   */
  getAttributesForCategory(categoryId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/attributes/category/${categoryId}`);
  }

  /**
   * Create or update attribute (admin only)
   */
  saveAttribute(attribute: VariantAttribute): Observable<any> {
    return this.http.post(`${this.apiUrl}/attributes`, attribute);
  }

  /**
   * Initialize default attributes (admin only)
   */
  initializeAttributes(): Observable<any> {
    return this.http.post(`${this.apiUrl}/attributes/init`, {});
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get display label for variant attributes
   */
  getVariantLabel(variant: ProductVariant): string {
    if (!variant.attributes) {
      return variant.sku;
    }
    return Object.entries(variant.attributes)
      .map(([key, value]) => `${this.capitalize(key)}: ${value}`)
      .join(' / ');
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return `₹${price.toLocaleString('en-IN')}`;
  }

  /**
   * Calculate savings amount
   */
  getSavings(variant: ProductVariant): number {
    return variant.mrp - variant.price;
  }

  /**
   * Get stock status label
   */
  getStockStatus(variant: ProductVariant): { label: string; class: string } {
    if (variant.outOfStock) {
      return { label: 'Out of Stock', class: 'out-of-stock' };
    }
    if (variant.lowStock) {
      return { label: `Only ${variant.availableStock} left`, class: 'low-stock' };
    }
    return { label: 'In Stock', class: 'in-stock' };
  }

  /**
   * Group variants by attribute
   */
  groupByAttribute(variants: ProductVariant[], attributeKey: string): Map<string, ProductVariant[]> {
    const grouped = new Map<string, ProductVariant[]>();
    
    variants.forEach(variant => {
      const value = variant.attributes[attributeKey] || 'Unknown';
      if (!grouped.has(value)) {
        grouped.set(value, []);
      }
      grouped.get(value)!.push(variant);
    });
    
    return grouped;
  }

  /**
   * Find variant by selected attributes
   */
  findVariantByAttributes(
    variants: ProductVariant[],
    selectedAttributes: { [key: string]: string }
  ): ProductVariant | null {
    return variants.find(variant => {
      return Object.entries(selectedAttributes).every(
        ([key, value]) => variant.attributes[key] === value
      );
    }) || null;
  }

  /**
   * Get all unique values for an attribute from variants
   */
  getUniqueAttributeValues(variants: ProductVariant[], attributeKey: string): string[] {
    const values = new Set<string>();
    variants.forEach(v => {
      if (v.attributes && v.attributes[attributeKey]) {
        values.add(v.attributes[attributeKey]);
      }
    });
    return Array.from(values);
  }

  /**
   * Check if a specific attribute value is available (in stock)
   */
  isAttributeValueAvailable(
    variants: ProductVariant[],
    attributeKey: string,
    attributeValue: string,
    otherSelectedAttributes: { [key: string]: string } = {}
  ): boolean {
    return variants.some(variant => {
      if (!variant.active || variant.outOfStock) {
        return false;
      }
      if (variant.attributes[attributeKey] !== attributeValue) {
        return false;
      }
      // Check if other selected attributes match
      return Object.entries(otherSelectedAttributes).every(
        ([key, value]) => variant.attributes[key] === value
      );
    });
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
