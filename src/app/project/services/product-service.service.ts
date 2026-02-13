import { Injectable } from '@angular/core';
import { GlobalVariable } from '../global/global';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductServiceService {
  mainUrl = GlobalVariable.BASE_API_URL + "product";

  constructor(private http: HttpClient) { }

  /**
   * Get all GI-tagged products
   */
  getGiTaggedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/gi_tagged`);
  }

  /**
   * Get GI-tagged products by state
   */
  getGiTaggedProductsByState(state: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/gi_tagged_by_state?state=${encodeURIComponent(state)}`);
  }

  /**
   * Get GI-tagged products by district and state
   */
  getGiTaggedProductsByLocation(district: string, state: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/gi_tagged_by_location?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`);
  }

  /**
   * Get products by district and state (location-based discovery)
   */
  getProductsByLocation(district: string, state: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/search_by_location?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`);
  }

  /**
   * Get products by state only (location-based discovery)
   */
  getProductsByState(state: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/search_by_state?state=${encodeURIComponent(state)}`);
  }

  registerProduct(product: Product, file: File): Observable<Product> {
    const formData: FormData = new FormData();
    formData.append('product', new Blob([JSON.stringify(product)], { type: 'application/json' }));
    formData.append('file', file);
    return this.http.post<Product>(`${this.mainUrl}/save_product`, formData);
  }

  getImage(productId: string): Observable<Blob> {
    return this.http.get(`${this.mainUrl}/get_image/${productId}`, { responseType: 'blob' });
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/get_all_products`);
  }

  getAllProductsByName(productName: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/get_product_by_product_name/${productName}`);
  }

  getProductById(id: string | undefined): Observable<Product> {
    return this.http.get<Product>(`${this.mainUrl}/get_product_id/${id}`);
  }

  getProductByCategoryId(id: any): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/get_product_by_category_id/${id}`);
  }

  getProductByVendorId(id: any): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/get_product_by_vendor_id/${id}`);
  }

  deleteProductById(id: string) {
    return this.http.delete<boolean>(`${this.mainUrl}/delete_by_id/${id}`);
  }

  /**
   * Get multiple products by their IDs
   * @param ids Array of product IDs
   * @returns Observable of Product array
   */
  getProductsByIds(ids: string[]): Observable<Product[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }
    
    // Fetch each product by ID and combine results
    const requests = ids.map(id => 
      this.getProductById(id).pipe(
        catchError(() => of(null)) // Return null if product not found
      )
    );
    
    return forkJoin(requests).pipe(
      map(products => products.filter((p): p is Product => p !== null))
    );
  }

  /**
   * Get featured products (top rated/top selling)
   */
  getFeaturedProducts(limit: number = 6): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/featured?limit=${limit}`);
  }

  /**
   * Get latest products
   */
  getLatestProducts(limit: number = 6): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/latest?limit=${limit}`);
  }

  // ==================== ADMIN PRODUCT APPROVAL ====================

  /**
   * Get products by approval status with pagination
   */
  getProductsByApprovalStatus(status: string, page: number = 0, size: number = 12): Observable<any> {
    return this.http.get<any>(`${this.mainUrl}/admin/status/${status}?page=${page}&size=${size}`);
  }

  /**
   * Get all pending products awaiting approval
   */
  getPendingProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.mainUrl}/admin/pending`);
  }

  /**
   * Approve a product
   */
  approveProduct(productId: string, adminId: string): Observable<Product> {
    return this.http.post<Product>(`${this.mainUrl}/admin/approve/${productId}?adminId=${adminId}`, {});
  }

  /**
   * Reject a product with reason
   */
  rejectProduct(productId: string, adminId: string, reason: string): Observable<Product> {
    return this.http.post<Product>(
      `${this.mainUrl}/admin/reject/${productId}?adminId=${adminId}&reason=${encodeURIComponent(reason)}`,
      {}
    );
  }

  /**
   * Toggle product active status (suspend/reactivate)
   */
  toggleProductStatus(productId: string, isActive: boolean): Observable<Product> {
    return this.http.post<Product>(`${this.mainUrl}/admin/toggle-status/${productId}?isActive=${isActive}`, {});
  }

  /**
   * Get product approval statistics for admin dashboard
   */
  getApprovalStats(): Observable<any> {
    return this.http.get<any>(`${this.mainUrl}/admin/stats`);
  }

  /**
   * Get active products only
   */
  getActiveProducts(page: number = 0, size: number = 12): Observable<any> {
    return this.http.get<any>(`${this.mainUrl}/admin/active?page=${page}&size=${size}`);
  }

  /**
   * Get inactive products (suspended or rejected)
   */
  getInactiveProducts(page: number = 0, size: number = 12): Observable<any> {
    return this.http.get<any>(`${this.mainUrl}/admin/inactive?page=${page}&size=${size}`);
  }
}
