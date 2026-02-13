import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { GlobalVariable } from '../global/global';
import { Product } from '../models/product';

// Search Request
export interface SearchRequest {
  query?: string;
  categoryId?: string;
  categoryIds?: string[];
  state?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  giTaggedOnly?: boolean;
  inStockOnly?: boolean;
  vendorId?: string;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
  page?: number;
  size?: number;
}

// Search Result Item
export interface SearchResultItem {
  id: string;
  type: 'PRODUCT' | 'VENDOR' | 'CATEGORY';
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  rating?: number;
  district?: string;
  state?: string;
  categoryName?: string;
  giTagCertified?: boolean;
  vendorName?: string;
  vendorId?: string;
  totalSold?: number;
  stockStatus?: string;
  score?: number;
  // Vendor fields
  shoppeeName?: string;
  isVerified?: boolean;
  productCount?: number;
}

// Search Response (matches new backend)
export interface SearchResponse {
  query?: string;
  results: SearchResultItem[];
  totalResults: number;
  page: number;
  size: number;
  totalPages: number;
  searchTimeMs?: number;
  facets?: SearchFacets;
  suggestions?: string[];
  relatedSearches?: string[];
  success: boolean;
  message?: string;
}

// Search Facets (filters)
export interface SearchFacets {
  categories?: FacetItem[];
  states?: FacetItem[];
  districts?: FacetItem[];
  priceRanges?: FacetItem[];
  vendors?: FacetItem[];
}

export interface FacetItem {
  value: string;
  label: string;
  count: number;
  selected?: boolean;
}

// Autocomplete Response (matches new backend)
export interface AutocompleteResponse {
  query: string;
  suggestions: AutocompleteSuggestion[];
  products: ProductSuggestion[];
  vendors: VendorSuggestion[];
  recentSearches?: string[];
  popularSearches?: string[];
}

export interface AutocompleteSuggestion {
  text: string;
  type: string;
  highlight?: string;
  matchCount: number;
}

export interface ProductSuggestion {
  productId: string;
  productName: string;
  imageUrl?: string;
  price?: number;
  rating?: number;
  district?: string;
}

export interface VendorSuggestion {
  vendorId: string;
  shoppeeName: string;
  shopkeeperName?: string;
  district?: string;
  state?: string;
  rating?: number;
  isVerified?: boolean;
}

// Vendor Search Result (updated to match backend)
export interface VendorSearchResult {
  vendorId: string;
  shoppeeName: string;
  shopkeeperName?: string;
  state: string;
  district: string;
  productCount?: number;
  rating?: number;
  profileImage?: string;
  isVerified?: boolean;
}

// Legacy autocomplete (keep for compatibility)
export interface AutocompleteResult {
  type: 'product' | 'category' | 'vendor' | 'location';
  text: string;
  id?: string;
  metadata?: any;
}

// Trending
export interface TrendingSearch {
  query: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'search';
  
  // Search state
  private searchQuerySubject = new BehaviorSubject<string>('');
  public searchQuery$ = this.searchQuerySubject.asObservable();
  
  private searchResultsSubject = new BehaviorSubject<SearchResponse | null>(null);
  public searchResults$ = this.searchResultsSubject.asObservable();
  
  private isSearchingSubject = new BehaviorSubject<boolean>(false);
  public isSearching$ = this.isSearchingSubject.asObservable();
  
  // Recent searches (stored locally)
  private recentSearches: string[] = [];
  private readonly MAX_RECENT_SEARCHES = 10;

  constructor(private http: HttpClient) {
    this.loadRecentSearches();
  }

  // ============== SEARCH PRODUCTS ==============

  /**
   * Search products with query parameters
   */
  searchProducts(request: SearchRequest): Observable<SearchResponse> {
    this.isSearchingSubject.next(true);
    
    let params = new HttpParams();
    if (request.query) params = params.set('q', request.query);
    if (request.categoryId) params = params.set('categoryId', request.categoryId);
    if (request.state) params = params.set('state', request.state);
    if (request.district) params = params.set('district', request.district);
    if (request.minPrice !== undefined) params = params.set('minPrice', request.minPrice.toString());
    if (request.maxPrice !== undefined) params = params.set('maxPrice', request.maxPrice.toString());
    if (request.minRating !== undefined) params = params.set('minRating', request.minRating.toString());
    if (request.giTaggedOnly !== undefined) params = params.set('giTaggedOnly', request.giTaggedOnly.toString());
    if (request.inStockOnly !== undefined) params = params.set('inStockOnly', request.inStockOnly.toString());
    if (request.vendorId) params = params.set('vendorId', request.vendorId);
    if (request.sortBy) params = params.set('sortBy', request.sortBy);
    if (request.page !== undefined) params = params.set('page', request.page.toString());
    if (request.size !== undefined) params = params.set('size', request.size.toString());

    return this.http.get<SearchResponse>(`${this.baseUrl}`, { params }).pipe(
      tap(response => {
        this.searchResultsSubject.next(response);
        this.isSearchingSubject.next(false);
        if (request.query) {
          this.addToRecentSearches(request.query);
        }
      }),
      catchError(error => {
        this.isSearchingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Search products with POST request (for complex filters)
   */
  searchProductsPost(request: SearchRequest): Observable<SearchResponse> {
    this.isSearchingSubject.next(true);
    
    return this.http.post<SearchResponse>(`${this.baseUrl}`, request).pipe(
      tap(response => {
        this.searchResultsSubject.next(response);
        this.isSearchingSubject.next(false);
      }),
      catchError(error => {
        this.isSearchingSubject.next(false);
        throw error;
      })
    );
  }

  // ============== SEARCH VENDORS ==============

  /**
   * Search vendors
   */
  searchVendors(query: string, state?: string, district?: string): Observable<VendorSearchResult[]> {
    let params = new HttpParams().set('q', query);
    if (state) params = params.set('state', state);
    if (district) params = params.set('district', district);

    return this.http.get<VendorSearchResult[]>(`${this.baseUrl}/vendors`, { params });
  }

  // ============== AUTOCOMPLETE ==============

  /**
   * Get autocomplete suggestions (updated for new backend)
   */
  getAutocomplete(query: string, limit: number = 10): Observable<AutocompleteResponse> {
    if (!query || query.length < 2) {
      return of({ query: '', suggestions: [], products: [], vendors: [] });
    }

    const params = new HttpParams()
      .set('q', query)
      .set('limit', limit.toString());

    return this.http.get<AutocompleteResponse>(`${this.baseUrl}/autocomplete`, { params });
  }

  /**
   * Search by location (ODOP feature)
   */
  searchByLocation(district: string, state: string, page: number = 0, size: number = 20): Observable<SearchResponse> {
    const params = new HttpParams()
      .set('district', district)
      .set('state', state)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<SearchResponse>(`${this.baseUrl}/location`, { params });
  }

  /**
   * Search GI-tagged products
   */
  searchGiTagged(query?: string, state?: string, page: number = 0, size: number = 20): Observable<SearchResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (query) params = params.set('q', query);
    if (state) params = params.set('state', state);

    return this.http.get<SearchResponse>(`${this.baseUrl}/gi-tagged`, { params });
  }

  /**
   * Quick search for header search bar
   */
  quickSearch(query: string, limit: number = 10): Observable<SearchResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', limit.toString());

    return this.http.get<SearchResponse>(`${this.baseUrl}/quick`, { params });
  }

  /**
   * Get popular searches
   */
  getPopularSearches(limit: number = 10): Observable<string[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<string[]>(`${this.baseUrl}/popular`, { params });
  }

  /**
   * Setup autocomplete observable for input
   */
  setupAutocomplete(input$: Observable<string>): Observable<AutocompleteResponse> {
    return input$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.getAutocomplete(query))
    );
  }

  // ============== TRENDING ==============

  /**
   * Get trending searches
   */
  getTrendingSearches(limit: number = 10): Observable<TrendingSearch[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TrendingSearch[]>(`${this.baseUrl}/trending`, { params });
  }

  // ============== FILTERS ==============

  /**
   * Get available search filters
   */
  getSearchFilters(): Observable<SearchFacets> {
    return this.http.get<SearchFacets>(`${this.baseUrl}/filters`);
  }

  // ============== SYNC (ADMIN) ==============

  /**
   * Get sync status
   */
  getSyncStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sync/status`);
  }

  /**
   * Sync products to search index
   */
  syncProducts(): Observable<any> {
    return this.http.post(`${this.baseUrl}/sync/products`, {});
  }

  /**
   * Sync vendors to search index
   */
  syncVendors(): Observable<any> {
    return this.http.post(`${this.baseUrl}/sync/vendors`, {});
  }

  /**
   * Sync all data to search index
   */
  syncAll(): Observable<any> {
    return this.http.post(`${this.baseUrl}/sync/all`, {});
  }

  // ============== HEALTH CHECK ==============

  /**
   * Check if search service is healthy
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // ============== RECENT SEARCHES ==============

  /**
   * Get recent searches
   */
  getRecentSearches(): string[] {
    return [...this.recentSearches];
  }

  /**
   * Add to recent searches
   */
  private addToRecentSearches(query: string): void {
    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase());
    
    // Add to beginning
    this.recentSearches.unshift(query);
    
    // Limit size
    if (this.recentSearches.length > this.MAX_RECENT_SEARCHES) {
      this.recentSearches = this.recentSearches.slice(0, this.MAX_RECENT_SEARCHES);
    }
    
    this.saveRecentSearches();
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches(): void {
    this.recentSearches = [];
    localStorage.removeItem('odop_recent_searches');
  }

  /**
   * Remove a specific recent search
   */
  removeRecentSearch(query: string): void {
    this.recentSearches = this.recentSearches.filter(s => s !== query);
    this.saveRecentSearches();
  }

  private loadRecentSearches(): void {
    try {
      const saved = localStorage.getItem('odop_recent_searches');
      if (saved) {
        this.recentSearches = JSON.parse(saved);
      }
    } catch (e) {
      this.recentSearches = [];
    }
  }

  private saveRecentSearches(): void {
    try {
      localStorage.setItem('odop_recent_searches', JSON.stringify(this.recentSearches));
    } catch (e) {
      // Ignore storage errors
    }
  }

  // ============== QUERY STATE ==============

  /**
   * Set current search query
   */
  setSearchQuery(query: string): void {
    this.searchQuerySubject.next(query);
  }

  /**
   * Get current search query
   */
  getCurrentQuery(): string {
    return this.searchQuerySubject.value;
  }

  /**
   * Clear search results
   */
  clearResults(): void {
    this.searchResultsSubject.next(null);
    this.searchQuerySubject.next('');
  }
}
