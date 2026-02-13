import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { tap, map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

/**
 * Service for District Map Browse Feature
 * Provides interactive India map with ODOP products by district
 */
@Injectable({
  providedIn: 'root'
})
export class DistrictMapService {
  private baseUrl = `${environment.apiUrl}/district-map`;
  
  // Cache for map data
  private mapDataCache$: Observable<MapDataResponse> | null = null;
  
  // Selected state/district
  private selectedStateSubject = new BehaviorSubject<StateResponse | null>(null);
  selectedState$ = this.selectedStateSubject.asObservable();
  
  private selectedDistrictSubject = new BehaviorSubject<DistrictResponse | null>(null);
  selectedDistrict$ = this.selectedDistrictSubject.asObservable();
  
  // Map view state
  private mapViewSubject = new BehaviorSubject<MapViewState>({
    zoom: 5,
    center: { lat: 20.5937, lng: 78.9629 }, // Center of India
    viewMode: 'country'
  });
  mapView$ = this.mapViewSubject.asObservable();
  
  // Hover state for tooltips
  private hoverSubject = new Subject<HoverState | null>();
  hover$ = this.hoverSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== Map Data ====================

  /**
   * Get complete map data (cached)
   */
  getMapData(forceRefresh: boolean = false): Observable<MapDataResponse> {
    if (!this.mapDataCache$ || forceRefresh) {
      this.mapDataCache$ = this.http.get<MapDataResponse>(`${this.baseUrl}/data`)
        .pipe(shareReplay(1));
    }
    return this.mapDataCache$;
  }

  /**
   * Get map markers for visualization
   */
  getMapMarkers(): Observable<MapMarker[]> {
    return this.http.get<MapMarker[]>(`${this.baseUrl}/markers`);
  }

  /**
   * Get map statistics
   */
  getMapStatistics(): Observable<MapStatistics> {
    return this.http.get<MapStatistics>(`${this.baseUrl}/statistics`);
  }

  // ==================== State Operations ====================

  /**
   * Get all states with summary
   */
  getAllStates(): Observable<StateResponse[]> {
    return this.http.get<StateResponse[]>(`${this.baseUrl}/states`);
  }

  /**
   * Get state by code
   */
  getStateByCode(stateCode: string): Observable<StateResponse> {
    return this.http.get<StateResponse>(`${this.baseUrl}/states/${stateCode}`)
      .pipe(tap(state => this.selectedStateSubject.next(state)));
  }

  /**
   * Get districts of a state
   */
  getDistrictsByState(stateCode: string): Observable<DistrictResponse[]> {
    return this.http.get<DistrictResponse[]>(`${this.baseUrl}/states/${stateCode}/districts`);
  }

  // ==================== Region Operations ====================

  /**
   * Get all regions with summary
   */
  getAllRegions(): Observable<RegionResponse[]> {
    return this.http.get<RegionResponse[]>(`${this.baseUrl}/regions`);
  }

  /**
   * Get districts by region
   */
  getDistrictsByRegion(region: string): Observable<DistrictResponse[]> {
    return this.http.get<DistrictResponse[]>(`${this.baseUrl}/regions/${region}/districts`);
  }

  // ==================== District Operations ====================

  /**
   * Get district by ID
   */
  getDistrictById(id: string): Observable<DistrictResponse> {
    return this.http.get<DistrictResponse>(`${this.baseUrl}/districts/${id}`)
      .pipe(tap(district => this.selectedDistrictSubject.next(district)));
  }

  /**
   * Get district by state and district code
   */
  getDistrictByCode(stateCode: string, districtCode: string): Observable<DistrictResponse> {
    return this.http.get<DistrictResponse>(`${this.baseUrl}/districts/${stateCode}/${districtCode}`)
      .pipe(tap(district => this.selectedDistrictSubject.next(district)));
  }

  /**
   * Get featured districts
   */
  getFeaturedDistricts(): Observable<DistrictResponse[]> {
    return this.http.get<DistrictResponse[]>(`${this.baseUrl}/districts/featured`);
  }

  /**
   * Get GI tagged districts
   */
  getGiTaggedDistricts(): Observable<DistrictResponse[]> {
    return this.http.get<DistrictResponse[]>(`${this.baseUrl}/districts/gi-tagged`);
  }

  /**
   * Get districts by craft
   */
  getDistrictsByCraft(craft: string): Observable<DistrictResponse[]> {
    return this.http.get<DistrictResponse[]>(`${this.baseUrl}/districts/craft/${encodeURIComponent(craft)}`);
  }

  /**
   * Get districts by craft category
   */
  getDistrictsByCraftCategory(categoryId: string): Observable<DistrictResponse[]> {
    return this.http.get<DistrictResponse[]>(`${this.baseUrl}/districts/category/${categoryId}`);
  }

  /**
   * Search districts
   */
  searchDistricts(query: string): Observable<DistrictSearchResponse> {
    const params = new HttpParams().set('q', query);
    return this.http.get<DistrictSearchResponse>(`${this.baseUrl}/districts/search`, { params });
  }

  /**
   * Get districts in bounding box
   */
  getDistrictsInBounds(bounds: MapBounds): Observable<DistrictResponse[]> {
    const params = new HttpParams()
      .set('minLat', bounds.minLat.toString())
      .set('maxLat', bounds.maxLat.toString())
      .set('minLng', bounds.minLng.toString())
      .set('maxLng', bounds.maxLng.toString());
    return this.http.get<DistrictResponse[]>(`${this.baseUrl}/districts/bounds`, { params });
  }

  // ==================== Admin Operations ====================

  /**
   * Create district (Admin)
   */
  createDistrict(request: CreateDistrictRequest): Observable<DistrictResponse> {
    return this.http.post<DistrictResponse>(`${this.baseUrl}/districts`, request)
      .pipe(tap(() => this.refreshMapData()));
  }

  /**
   * Update district (Admin)
   */
  updateDistrict(id: string, request: CreateDistrictRequest): Observable<DistrictResponse> {
    return this.http.put<DistrictResponse>(`${this.baseUrl}/districts/${id}`, request)
      .pipe(tap(() => this.refreshMapData()));
  }

  /**
   * Delete district (Admin)
   */
  deleteDistrict(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/districts/${id}`)
      .pipe(tap(() => this.refreshMapData()));
  }

  /**
   * Add ODOP product to district (Admin)
   */
  addOdopProduct(districtId: string, product: OdopProduct): Observable<DistrictResponse> {
    return this.http.post<DistrictResponse>(`${this.baseUrl}/districts/${districtId}/odop-products`, product);
  }

  // ==================== Map Interaction Methods ====================

  /**
   * Select a state
   */
  selectState(state: StateResponse | null): void {
    this.selectedStateSubject.next(state);
    this.selectedDistrictSubject.next(null);
    
    if (state) {
      // Zoom to state
      this.mapViewSubject.next({
        zoom: 7,
        center: this.getStateCenter(state.stateCode),
        viewMode: 'state'
      });
    }
  }

  /**
   * Select a district
   */
  selectDistrict(district: DistrictResponse | null): void {
    this.selectedDistrictSubject.next(district);
    
    if (district) {
      // Zoom to district
      this.mapViewSubject.next({
        zoom: 10,
        center: { lat: district.latitude, lng: district.longitude },
        viewMode: 'district'
      });
    }
  }

  /**
   * Reset map view to country level
   */
  resetMapView(): void {
    this.selectedStateSubject.next(null);
    this.selectedDistrictSubject.next(null);
    this.mapViewSubject.next({
      zoom: 5,
      center: { lat: 20.5937, lng: 78.9629 },
      viewMode: 'country'
    });
  }

  /**
   * Set hover state for tooltips
   */
  setHover(state: HoverState | null): void {
    this.hoverSubject.next(state);
  }

  /**
   * Update map view
   */
  setMapView(view: Partial<MapViewState>): void {
    const current = this.mapViewSubject.value;
    this.mapViewSubject.next({ ...current, ...view });
  }

  /**
   * Refresh map data cache
   */
  refreshMapData(): void {
    this.mapDataCache$ = null;
  }

  // ==================== Helper Methods ====================

  /**
   * Get approximate center coordinates for a state
   */
  private getStateCenter(stateCode: string): { lat: number; lng: number } {
    const stateCenters: { [key: string]: { lat: number; lng: number } } = {
      'JK': { lat: 33.7782, lng: 76.5762 },
      'HP': { lat: 31.1048, lng: 77.1734 },
      'PB': { lat: 31.1471, lng: 75.3412 },
      'HR': { lat: 29.0588, lng: 76.0856 },
      'RJ': { lat: 27.0238, lng: 74.2179 },
      'UP': { lat: 26.8467, lng: 80.9462 },
      'UK': { lat: 30.0668, lng: 79.0193 },
      'DL': { lat: 28.7041, lng: 77.1025 },
      'KA': { lat: 15.3173, lng: 75.7139 },
      'KL': { lat: 10.8505, lng: 76.2711 },
      'TN': { lat: 11.1271, lng: 78.6569 },
      'AP': { lat: 15.9129, lng: 79.74 },
      'TS': { lat: 18.1124, lng: 79.0193 },
      'WB': { lat: 22.9868, lng: 87.855 },
      'OR': { lat: 20.9517, lng: 85.0985 },
      'BR': { lat: 25.0961, lng: 85.3131 },
      'JH': { lat: 23.6102, lng: 85.2799 },
      'MH': { lat: 19.7515, lng: 75.7139 },
      'GJ': { lat: 22.2587, lng: 71.1924 },
      'GA': { lat: 15.2993, lng: 74.124 },
      'MP': { lat: 22.9734, lng: 78.6569 },
      'CG': { lat: 21.2787, lng: 81.8661 },
      'AS': { lat: 26.2006, lng: 92.9376 },
      'AR': { lat: 28.218, lng: 94.7278 },
      'MN': { lat: 24.6637, lng: 93.9063 },
      'ML': { lat: 25.467, lng: 91.3662 },
      'MZ': { lat: 23.1645, lng: 92.9376 },
      'NL': { lat: 26.1584, lng: 94.5624 },
      'SK': { lat: 27.533, lng: 88.5122 },
      'TR': { lat: 23.9408, lng: 91.9882 }
    };
    return stateCenters[stateCode] || { lat: 20.5937, lng: 78.9629 };
  }

  /**
   * Get region display name
   */
  getRegionDisplayName(region: string): string {
    const regionNames: { [key: string]: string } = {
      'NORTH': 'North India',
      'SOUTH': 'South India',
      'EAST': 'East India',
      'WEST': 'West India',
      'CENTRAL': 'Central India',
      'NORTHEAST': 'Northeast India'
    };
    return regionNames[region] || region;
  }

  /**
   * Get state color for map
   */
  getStateColor(stateCode: string, isSelected: boolean = false): string {
    const defaultColors: { [key: string]: string } = {
      'JK': '#E3735E', 'HP': '#7AA874', 'PB': '#F9B572', 'HR': '#D4A5A5',
      'RJ': '#FFB84C', 'UP': '#F266AB', 'UK': '#A1C298', 'DL': '#FF6969',
      'KA': '#FF9B9B', 'KL': '#94AF9F', 'TN': '#FFD93D', 'AP': '#6BCB77',
      'TS': '#FF8FB1', 'WB': '#FFB562', 'OR': '#F7EC09', 'BR': '#3AB0FF',
      'JH': '#F0A500', 'MH': '#FF6B6B', 'GJ': '#4CACBC', 'GA': '#F9D923',
      'MP': '#A460ED', 'CG': '#62CDFF', 'AS': '#BACDDB', 'AR': '#7EC8E3',
      'MN': '#FF87B2', 'ML': '#98D8AA', 'MZ': '#B6E2A1', 'NL': '#FEBE8C',
      'SK': '#F7C8E0', 'TR': '#DFFFD8'
    };
    const color = defaultColors[stateCode] || '#CCCCCC';
    return isSelected ? this.darkenColor(color, 20) : color;
  }

  /**
   * Darken a hex color
   */
  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
}

// ==================== Interfaces ====================

export interface MapDataResponse {
  states: StateResponse[];
  featuredDistricts: DistrictResponse[];
  statistics: MapStatistics;
}

export interface StateResponse {
  stateCode: string;
  name: string;
  nameHindi?: string;
  region?: string;
  regionDisplayName?: string;
  mapColor?: string;
  districtCount: number;
  totalProducts: number;
  totalArtisans: number;
  topCrafts?: string[];
  featuredDistricts?: DistrictResponse[];
}

export interface RegionResponse {
  region: string;
  displayName: string;
  displayNameHindi?: string;
  states: StateResponse[];
  totalDistricts: number;
  totalProducts: number;
}

export interface DistrictResponse {
  id: string;
  districtCode: string;
  name: string;
  nameHindi?: string;
  stateCode: string;
  stateName: string;
  stateNameHindi?: string;
  region?: string;
  regionDisplayName?: string;
  latitude: number;
  longitude: number;
  primaryCraft?: string;
  odopProducts?: OdopProductResponse[];
  craftTraditions?: CraftTraditionResponse[];
  famousFor?: string[];
  historicalSignificance?: string;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  bannerImageUrl?: string;
  galleryImages?: string[];
  videoUrl?: string;
  registeredArtisans: number;
  activeVendors: number;
  totalProducts: number;
  famousArtisans?: FamousArtisanResponse[];
  featured: boolean;
  mapTileColor?: string;
}

export interface OdopProductResponse {
  name: string;
  nameHindi?: string;
  description?: string;
  imageUrl?: string;
  giTagged: boolean;
  giTagNumber?: string;
  yearRecognized?: number;
}

export interface CraftTraditionResponse {
  name: string;
  nameHindi?: string;
  description?: string;
  history?: string;
  materials?: string[];
  techniques?: string[];
  imageUrl?: string;
  ageInYears?: number;
  unescoStatus?: string;
}

export interface FamousArtisanResponse {
  name: string;
  vendorId?: string;
  craft?: string;
  achievement?: string;
  imageUrl?: string;
  storyUrl?: string;
}

export interface MapStatistics {
  totalStates: number;
  totalDistricts: number;
  totalProducts: number;
  totalArtisans: number;
  giTaggedProducts: number;
  topCrafts?: TopCraftResponse[];
}

export interface TopCraftResponse {
  craftName: string;
  districtCount: number;
  productCount: number;
}

export interface MapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  primaryCraft?: string;
  thumbnailUrl?: string;
  color?: string;
  productCount: number;
  type: 'DISTRICT' | 'ARTISAN_CLUSTER' | 'CRAFT_CENTER' | 'GI_TAG_LOCATION';
}

export interface DistrictSearchResponse {
  districts: DistrictResponse[];
  total: number;
  query: string;
}

export interface CreateDistrictRequest {
  districtCode: string;
  name: string;
  nameHindi?: string;
  nameLocal?: string;
  stateCode: string;
  stateName: string;
  stateNameHindi?: string;
  region?: string;
  division?: string;
  latitude: number;
  longitude: number;
  primaryCraft?: string;
  famousFor?: string[];
  historicalSignificance?: string;
  craftHistory?: string;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  bannerImageUrl?: string;
  videoUrl?: string;
  mapTileColor?: string;
  active: boolean;
  featured: boolean;
  displayPriority: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface OdopProduct {
  name: string;
  nameHindi?: string;
  description?: string;
  imageUrl?: string;
  giTagged: boolean;
  giTagNumber?: string;
  yearRecognized?: number;
  craftCategoryId?: string;
}

export interface MapViewState {
  zoom: number;
  center: { lat: number; lng: number };
  viewMode: 'country' | 'state' | 'district';
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface HoverState {
  type: 'state' | 'district' | 'marker';
  id: string;
  name: string;
  x: number;
  y: number;
  data?: any;
}
