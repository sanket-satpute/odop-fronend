import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

/**
 * Service for Festival Collections
 * Manages festival-based product collections with countdown, gift guides, and sections
 */
@Injectable({
  providedIn: 'root'
})
export class FestivalService {
  private baseUrl = `${environment.apiUrl}/festivals`;
  
  // Cache for featured festivals
  private featuredCache$: Observable<FestivalCollectionResponse[]> | null = null;
  
  // Currently selected festival
  private selectedFestivalSubject = new BehaviorSubject<FestivalCollectionResponse | null>(null);
  selectedFestival$ = this.selectedFestivalSubject.asObservable();
  
  // Countdown timer subjects for active festivals
  private countdownSubjects = new Map<string, BehaviorSubject<CountdownTime>>();

  constructor(private http: HttpClient) {}

  // ==================== Read Operations ====================

  /**
   * Get all active festivals
   */
  getAllFestivals(): Observable<FestivalListResponse> {
    return this.http.get<FestivalListResponse>(this.baseUrl);
  }

  /**
   * Get featured festivals for homepage (cached)
   */
  getFeaturedFestivals(forceRefresh: boolean = false): Observable<FestivalCollectionResponse[]> {
    if (!this.featuredCache$ || forceRefresh) {
      this.featuredCache$ = this.http.get<FestivalCollectionResponse[]>(`${this.baseUrl}/featured`)
        .pipe(shareReplay(1));
    }
    return this.featuredCache$;
  }

  /**
   * Get live festivals (currently active)
   */
  getLiveFestivals(): Observable<FestivalCollectionResponse[]> {
    return this.http.get<FestivalCollectionResponse[]>(`${this.baseUrl}/live`);
  }

  /**
   * Get upcoming festivals
   */
  getUpcomingFestivals(): Observable<FestivalCollectionResponse[]> {
    return this.http.get<FestivalCollectionResponse[]>(`${this.baseUrl}/upcoming`);
  }

  /**
   * Get festival by ID
   */
  getFestivalById(id: string): Observable<FestivalCollectionResponse> {
    return this.http.get<FestivalCollectionResponse>(`${this.baseUrl}/${id}`)
      .pipe(tap(festival => this.selectedFestivalSubject.next(festival)));
  }

  /**
   * Get festival by slug
   */
  getFestivalBySlug(slug: string): Observable<FestivalCollectionResponse> {
    return this.http.get<FestivalCollectionResponse>(`${this.baseUrl}/slug/${slug}`)
      .pipe(tap(festival => this.selectedFestivalSubject.next(festival)));
  }

  /**
   * Get festivals by type
   */
  getFestivalsByType(type: string): Observable<FestivalCollectionResponse[]> {
    return this.http.get<FestivalCollectionResponse[]>(`${this.baseUrl}/type/${type}`);
  }

  /**
   * Get festivals by category
   */
  getFestivalsByCategory(category: string): Observable<FestivalCollectionResponse[]> {
    return this.http.get<FestivalCollectionResponse[]>(`${this.baseUrl}/category/${category}`);
  }

  /**
   * Get festivals by state
   */
  getFestivalsByState(state: string): Observable<FestivalCollectionResponse[]> {
    return this.http.get<FestivalCollectionResponse[]>(`${this.baseUrl}/state/${encodeURIComponent(state)}`);
  }

  /**
   * Get festivals by year
   */
  getFestivalsByYear(year: number): Observable<FestivalCollectionResponse[]> {
    return this.http.get<FestivalCollectionResponse[]>(`${this.baseUrl}/year/${year}`);
  }

  /**
   * Search festivals
   */
  searchFestivals(query: string): Observable<FestivalCollectionResponse[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<FestivalCollectionResponse[]>(`${this.baseUrl}/search`, { params });
  }

  /**
   * Get festival calendar
   */
  getFestivalCalendar(): Observable<FestivalCalendar> {
    return this.http.get<FestivalCalendar>(`${this.baseUrl}/calendar`);
  }

  /**
   * Get gift guide for a festival
   */
  getGiftGuide(festivalId: string): Observable<GiftSuggestionResponse[]> {
    return this.http.get<GiftSuggestionResponse[]>(`${this.baseUrl}/${festivalId}/gift-guide`);
  }

  /**
   * Get sections for a festival
   */
  getFestivalSections(festivalId: string): Observable<CollectionSectionResponse[]> {
    return this.http.get<CollectionSectionResponse[]>(`${this.baseUrl}/${festivalId}/sections`);
  }

  /**
   * Get festival statistics
   */
  getFestivalStatistics(): Observable<FestivalStatistics> {
    return this.http.get<FestivalStatistics>(`${this.baseUrl}/statistics`);
  }

  // ==================== Admin Operations ====================

  /**
   * Create new festival (Admin)
   */
  createFestival(request: CreateFestivalRequest): Observable<FestivalCollectionResponse> {
    return this.http.post<FestivalCollectionResponse>(this.baseUrl, request)
      .pipe(tap(() => this.refreshFeaturedCache()));
  }

  /**
   * Update festival (Admin)
   */
  updateFestival(id: string, request: CreateFestivalRequest): Observable<FestivalCollectionResponse> {
    return this.http.put<FestivalCollectionResponse>(`${this.baseUrl}/${id}`, request)
      .pipe(tap(() => this.refreshFeaturedCache()));
  }

  /**
   * Delete festival (Admin)
   */
  deleteFestival(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this.refreshFeaturedCache()));
  }

  /**
   * Update featured products (Admin)
   */
  updateFeaturedProducts(id: string, productIds: string[]): Observable<FestivalCollectionResponse> {
    return this.http.patch<FestivalCollectionResponse>(`${this.baseUrl}/${id}/products`, productIds);
  }

  /**
   * Add section to festival (Admin)
   */
  addSection(id: string, section: CollectionSection): Observable<FestivalCollectionResponse> {
    return this.http.post<FestivalCollectionResponse>(`${this.baseUrl}/${id}/sections`, section);
  }

  /**
   * Update discount info (Admin)
   */
  updateDiscount(id: string, discount: DiscountInfo): Observable<FestivalCollectionResponse> {
    return this.http.patch<FestivalCollectionResponse>(`${this.baseUrl}/${id}/discount`, discount);
  }

  // ==================== Countdown Timer ====================

  /**
   * Start countdown timer for a festival
   */
  startCountdown(festivalId: string, festivalDate: Date): Observable<CountdownTime> {
    if (!this.countdownSubjects.has(festivalId)) {
      const subject = new BehaviorSubject<CountdownTime>(this.calculateCountdown(festivalDate));
      this.countdownSubjects.set(festivalId, subject);
      
      // Update every second
      setInterval(() => {
        const countdown = this.calculateCountdown(festivalDate);
        subject.next(countdown);
        
        // Stop when countdown reaches zero
        if (countdown.total <= 0) {
          subject.complete();
          this.countdownSubjects.delete(festivalId);
        }
      }, 1000);
    }
    
    return this.countdownSubjects.get(festivalId)!.asObservable();
  }

  /**
   * Calculate countdown time
   */
  private calculateCountdown(targetDate: Date): CountdownTime {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const total = target - now;
    
    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }
    
    return {
      days: Math.floor(total / (1000 * 60 * 60 * 24)),
      hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((total % (1000 * 60)) / 1000),
      total
    };
  }

  /**
   * Stop countdown timer
   */
  stopCountdown(festivalId: string): void {
    const subject = this.countdownSubjects.get(festivalId);
    if (subject) {
      subject.complete();
      this.countdownSubjects.delete(festivalId);
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Select a festival
   */
  selectFestival(festival: FestivalCollectionResponse | null): void {
    this.selectedFestivalSubject.next(festival);
  }

  /**
   * Refresh featured cache
   */
  refreshFeaturedCache(): void {
    this.featuredCache$ = null;
  }

  /**
   * Get festival type display name
   */
  getTypeDisplayName(type: string): string {
    const typeNames: { [key: string]: string } = {
      'NATIONAL': 'National Festival',
      'REGIONAL': 'Regional Festival',
      'RELIGIOUS': 'Religious Festival',
      'SEASONAL': 'Seasonal Collection',
      'CRAFT_FAIR': 'Craft Fair',
      'SPECIAL_OCCASION': 'Special Occasion'
    };
    return typeNames[type] || type;
  }

  /**
   * Get festival category display name
   */
  getCategoryDisplayName(category: string): string {
    const categoryNames: { [key: string]: string } = {
      'DIWALI': 'Diwali',
      'HOLI': 'Holi',
      'DURGA_PUJA': 'Durga Puja',
      'NAVRATRI': 'Navratri',
      'GANESH_CHATURTHI': 'Ganesh Chaturthi',
      'ONAM': 'Onam',
      'PONGAL': 'Pongal',
      'BAISAKHI': 'Baisakhi',
      'BIHU': 'Bihu',
      'MAKAR_SANKRANTI': 'Makar Sankranti',
      'EID': 'Eid',
      'CHRISTMAS': 'Christmas',
      'RAKSHA_BANDHAN': 'Raksha Bandhan',
      'KARWA_CHAUTH': 'Karwa Chauth',
      'WEDDING_SEASON': 'Wedding Season',
      'SUMMER_COLLECTION': 'Summer Collection',
      'MONSOON_COLLECTION': 'Monsoon Collection',
      'WINTER_COLLECTION': 'Winter Collection',
      'NEW_YEAR': 'New Year',
      'INDEPENDENCE_DAY': 'Independence Day',
      'REPUBLIC_DAY': 'Republic Day',
      'CRAFT_MELA': 'Craft Mela'
    };
    return categoryNames[category] || category;
  }

  /**
   * Generate festival URL
   */
  getFestivalUrl(festival: FestivalCollectionResponse): string {
    return `/festivals/${festival.slug}`;
  }

  /**
   * Check if festival is active now
   */
  isFestivalLive(festival: FestivalCollectionResponse): boolean {
    const now = new Date();
    const start = festival.startDate ? new Date(festival.startDate) : null;
    const end = festival.endDate ? new Date(festival.endDate) : null;
    
    return festival.active && 
           (!start || now >= start) && 
           (!end || now <= end);
  }

  /**
   * Format days until festival
   */
  formatDaysUntil(days: number): string {
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow!';
    if (days <= 7) return `${days} days away`;
    if (days <= 30) return `${Math.ceil(days / 7)} weeks away`;
    return `${Math.ceil(days / 30)} months away`;
  }
}

// ==================== Interfaces ====================

export interface FestivalCollectionResponse {
  id: string;
  slug: string;
  name: string;
  nameHindi?: string;
  description?: string;
  descriptionHindi?: string;
  tagline?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  festivalDate?: string;
  heroImageUrl?: string;
  bannerImageUrl?: string;
  thumbnailUrl?: string;
  mobileHeroUrl?: string;
  videoUrl?: string;
  themeColor?: string;
  accentColor?: string;
  primaryStates?: string[];
  regionalRelevance?: string;
  sections?: CollectionSectionResponse[];
  giftGuide?: GiftSuggestionResponse[];
  giftGuideTitle?: string;
  discountInfo?: DiscountInfoResponse;
  hasCountdownTimer: boolean;
  hasEarlyBirdOffers: boolean;
  active: boolean;
  featured: boolean;
  displayOrder: number;
  year: number;
  viewCount: number;
  productCount: number;
  daysUntilFestival: number;
  isLive: boolean;
}

export interface CollectionSectionResponse {
  sectionId: string;
  title: string;
  titleHindi?: string;
  description?: string;
  imageUrl?: string;
  type?: string;
  productIds?: string[];
  displayOrder: number;
}

export interface GiftSuggestionResponse {
  title: string;
  description?: string;
  imageUrl?: string;
  priceRange?: string;
  productIds?: string[];
  targetAudience?: string;
}

export interface DiscountInfoResponse {
  code: string;
  percentage: number;
  maxDiscount: number;
  minOrderValue: number;
  validFrom?: string;
  validUntil?: string;
  terms?: string;
  isActive: boolean;
}

export interface FestivalListResponse {
  festivals: FestivalCollectionResponse[];
  total: number;
  activeCount: number;
  upcomingCount: number;
}

export interface FestivalCalendar {
  [monthYear: string]: FestivalCollectionResponse[];
}

export interface FestivalStatistics {
  totalFestivals: number;
  featuredFestivals: number;
  upcomingFestivals: number;
  liveFestivals: number;
  mostViewedFestival?: FestivalCollectionResponse;
}

export interface CreateFestivalRequest {
  slug: string;
  name: string;
  nameHindi?: string;
  description?: string;
  descriptionHindi?: string;
  tagline?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  festivalDate?: string;
  heroImageUrl?: string;
  bannerImageUrl?: string;
  thumbnailUrl?: string;
  mobileHeroUrl?: string;
  videoUrl?: string;
  themeColor?: string;
  accentColor?: string;
  primaryStates?: string[];
  secondaryStates?: string[];
  regionalRelevance?: string;
  hasCountdownTimer: boolean;
  hasEarlyBirdOffers: boolean;
  active: boolean;
  featured: boolean;
  displayOrder: number;
  year: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface CollectionSection {
  sectionId: string;
  title: string;
  titleHindi?: string;
  description?: string;
  imageUrl?: string;
  type: string;
  productIds?: string[];
  filterQuery?: string;
  displayOrder: number;
}

export interface DiscountInfo {
  code: string;
  percentage: number;
  maxDiscount: number;
  minOrderValue: number;
  validFrom?: string;
  validUntil?: string;
  terms?: string;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}
