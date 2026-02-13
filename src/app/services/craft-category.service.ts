import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, Subject } from 'rxjs';
import { tap, map, catchError, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

/**
 * Service for managing craft categories
 * Provides hierarchical category navigation, filtering, and search
 */
@Injectable({
  providedIn: 'root'
})
export class CraftCategoryService {
  private baseUrl = `${environment.apiUrl}/craft-categories`;
  
  // Cache for category tree (refreshed on demand)
  private categoryTreeCache$: Observable<CategoryTreeResponse> | null = null;
  private categoryTreeSubject = new BehaviorSubject<CategoryTreeResponse | null>(null);
  
  // Currently selected category
  private selectedCategorySubject = new BehaviorSubject<CraftCategoryResponse | null>(null);
  selectedCategory$ = this.selectedCategorySubject.asObservable();
  
  // Breadcrumb trail
  private breadcrumbSubject = new BehaviorSubject<CraftCategoryResponse[]>([]);
  breadcrumb$ = this.breadcrumbSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== Read Operations ====================

  /**
   * Get all root categories
   */
  getRootCategories(): Observable<CraftCategoryResponse[]> {
    return this.http.get<CraftCategoryResponse[]>(`${this.baseUrl}/roots`);
  }

  /**
   * Get full category tree (cached)
   */
  getCategoryTree(forceRefresh: boolean = false): Observable<CategoryTreeResponse> {
    if (!this.categoryTreeCache$ || forceRefresh) {
      this.categoryTreeCache$ = this.http.get<CategoryTreeResponse>(`${this.baseUrl}/tree`)
        .pipe(
          tap(tree => this.categoryTreeSubject.next(tree)),
          shareReplay(1),
          catchError(error => {
            console.error('Error loading category tree:', error);
            this.categoryTreeCache$ = null;
            throw error;
          })
        );
    }
    return this.categoryTreeCache$;
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: string): Observable<CraftCategoryResponse> {
    return this.http.get<CraftCategoryResponse>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(category => {
          this.selectedCategorySubject.next(category);
          this.loadBreadcrumb(id);
        })
      );
  }

  /**
   * Get category by slug
   */
  getCategoryBySlug(slug: string): Observable<CraftCategoryResponse> {
    return this.http.get<CraftCategoryResponse>(`${this.baseUrl}/slug/${slug}`)
      .pipe(
        tap(category => {
          this.selectedCategorySubject.next(category);
          if (category.id) {
            this.loadBreadcrumb(category.id);
          }
        })
      );
  }

  /**
   * Get subcategories of a parent category
   */
  getSubcategories(parentId: string): Observable<CraftCategoryResponse[]> {
    return this.http.get<CraftCategoryResponse[]>(`${this.baseUrl}/${parentId}/children`);
  }

  /**
   * Get featured categories for homepage
   */
  getFeaturedCategories(): Observable<CraftCategoryResponse[]> {
    return this.http.get<CraftCategoryResponse[]>(`${this.baseUrl}/featured`);
  }

  /**
   * Get categories by state
   */
  getCategoriesByState(state: string): Observable<CraftCategoryResponse[]> {
    return this.http.get<CraftCategoryResponse[]>(`${this.baseUrl}/state/${encodeURIComponent(state)}`);
  }

  /**
   * Get categories by GI tag
   */
  getCategoriesByGiTag(giTag: string): Observable<CraftCategoryResponse[]> {
    return this.http.get<CraftCategoryResponse[]>(`${this.baseUrl}/gi-tag/${encodeURIComponent(giTag)}`);
  }

  /**
   * Get breadcrumb for a category
   */
  getBreadcrumb(categoryId: string): Observable<CraftCategoryResponse[]> {
    return this.http.get<CraftCategoryResponse[]>(`${this.baseUrl}/${categoryId}/breadcrumb`);
  }

  /**
   * Search categories
   */
  searchCategories(query: string): Observable<CraftCategoryResponse[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<CraftCategoryResponse[]>(`${this.baseUrl}/search`, { params });
  }

  /**
   * Get filter options for a category
   */
  getCategoryFilters(categoryId: string): Observable<CategoryFilterResponse> {
    return this.http.get<CategoryFilterResponse>(`${this.baseUrl}/${categoryId}/filters`);
  }

  /**
   * Get category statistics
   */
  getCategoryStatistics(): Observable<CategoryStatistics> {
    return this.http.get<CategoryStatistics>(`${this.baseUrl}/statistics`);
  }

  // ==================== Admin Operations ====================

  /**
   * Create new category (Admin)
   */
  createCategory(request: CreateCraftCategoryRequest): Observable<CraftCategoryResponse> {
    return this.http.post<CraftCategoryResponse>(this.baseUrl, request)
      .pipe(
        tap(() => this.refreshCategoryTree())
      );
  }

  /**
   * Update category (Admin)
   */
  updateCategory(id: string, request: CreateCraftCategoryRequest): Observable<CraftCategoryResponse> {
    return this.http.put<CraftCategoryResponse>(`${this.baseUrl}/${id}`, request)
      .pipe(
        tap(() => this.refreshCategoryTree())
      );
  }

  /**
   * Delete category (Admin)
   */
  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(() => this.refreshCategoryTree())
      );
  }

  /**
   * Update product count (Admin)
   */
  updateProductCount(categoryId: string, count: number): Observable<void> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.patch<void>(`${this.baseUrl}/${categoryId}/product-count`, null, { params });
  }

  /**
   * Update artisan count (Admin)
   */
  updateArtisanCount(categoryId: string, count: number): Observable<void> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.patch<void>(`${this.baseUrl}/${categoryId}/artisan-count`, null, { params });
  }

  // ==================== Helper Methods ====================

  /**
   * Select a category and update breadcrumb
   */
  selectCategory(category: CraftCategoryResponse | null): void {
    this.selectedCategorySubject.next(category);
    if (category?.id) {
      this.loadBreadcrumb(category.id);
    } else {
      this.breadcrumbSubject.next([]);
    }
  }

  /**
   * Load breadcrumb for a category
   */
  private loadBreadcrumb(categoryId: string): void {
    this.getBreadcrumb(categoryId).subscribe({
      next: breadcrumb => this.breadcrumbSubject.next(breadcrumb),
      error: err => console.error('Error loading breadcrumb:', err)
    });
  }

  /**
   * Refresh the category tree cache
   */
  refreshCategoryTree(): void {
    this.categoryTreeCache$ = null;
    this.getCategoryTree(true).subscribe({
      error: (err) => console.error('Failed to refresh categories:', err)
    });
  }

  /**
   * Find category in tree by ID
   */
  findCategoryInTree(categories: CraftCategoryResponse[], id: string): CraftCategoryResponse | null {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.children && category.children.length > 0) {
        const found = this.findCategoryInTree(category.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Flatten category tree to list
   */
  flattenCategories(categories: CraftCategoryResponse[]): CraftCategoryResponse[] {
    const result: CraftCategoryResponse[] = [];
    const flatten = (cats: CraftCategoryResponse[]) => {
      for (const cat of cats) {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children);
        }
      }
    };
    flatten(categories);
    return result;
  }

  /**
   * Get category icon class
   */
  getCategoryIcon(iconName: string): string {
    const iconMap: { [key: string]: string } = {
      'textile': 'fas fa-tshirt',
      'pottery': 'fas fa-wine-bottle',
      'jewelry': 'fas fa-gem',
      'food': 'fas fa-utensils',
      'handicraft': 'fas fa-hands',
      'painting': 'fas fa-paint-brush',
      'home-decor': 'fas fa-home',
      'leather': 'fas fa-briefcase',
      'music': 'fas fa-music',
      'beauty': 'fas fa-spa'
    };
    return iconMap[iconName] || 'fas fa-tag';
  }

  /**
   * Generate category URL slug
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

// ==================== Interfaces ====================

export interface CraftCategoryResponse {
  id: string;
  slug: string;
  name: string;
  nameHindi?: string;
  description?: string;
  parentId?: string;
  level: number;
  ancestorPath?: string;
  imageUrl?: string;
  iconName?: string;
  bannerImageUrl?: string;
  themeColor?: string;
  attributes?: CategoryAttributeDto[];
  relatedGiTags?: string[];
  majorStates?: string[];
  productCount: number;
  artisanCount: number;
  featured: boolean;
  displayOrder: number;
  children?: CraftCategoryResponse[];
}

export interface CategoryAttributeDto {
  name: string;
  label: string;
  labelHindi?: string;
  type: string;
  options?: string[];
  unit?: string;
  required: boolean;
  filterable: boolean;
}

export interface CategoryTreeResponse {
  categories: CraftCategoryResponse[];
  totalCategories: number;
  mainCategories: number;
  subCategories: number;
}

export interface CategoryFilterResponse {
  categoryId: string;
  categoryName: string;
  filters: FilterOption[];
}

export interface FilterOption {
  name: string;
  label: string;
  type: string;
  values: FilterValue[];
}

export interface FilterValue {
  value: string;
  label: string;
  count: number;
}

export interface CreateCraftCategoryRequest {
  slug: string;
  name: string;
  nameHindi?: string;
  description?: string;
  descriptionHindi?: string;
  parentId?: string;
  imageUrl?: string;
  iconName?: string;
  bannerImageUrl?: string;
  themeColor?: string;
  relatedGiTags?: string[];
  majorStates?: string[];
  famousDistricts?: string[];
  active: boolean;
  featured: boolean;
  displayOrder: number;
}

export interface CategoryStatistics {
  totalCategories: number;
  rootCategories: number;
  level1Categories: number;
  level2Categories: number;
  categoryByState?: StateCategoryCount[];
}

export interface StateCategoryCount {
  id: string; // state name
  count: number;
  categories: string[];
}
