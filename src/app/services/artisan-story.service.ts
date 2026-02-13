import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ==================== Interfaces ====================

export interface ArtisanStoryResponse {
  id: string;
  slug: string;
  
  // Artisan Info
  artisanName: string;
  artisanNameHindi: string;
  title: string;
  titleHindi: string;
  profileImageUrl: string;
  coverImageUrl: string;
  
  // Location
  village: string;
  district: string;
  state: string;
  stateCode: string;
  coordinates: LocationCoordinates | null;
  
  // Craft Info
  primaryCraft: string;
  primaryCraftHindi: string;
  craftCategoryId: string;
  additionalCrafts: string[];
  yearsOfExperience: number;
  generationsInCraft: number;
  craftOriginStory: string;
  craftOriginStoryHindi: string;
  
  // Story Content
  shortBio: string;
  shortBioHindi: string;
  fullStory: string;
  fullStoryHindi: string;
  quote: string;
  quoteHindi: string;
  storySections: StorySectionDto[];
  
  // Family
  familyBackground: FamilyBackgroundDto | null;
  teachingPhilosophy: string;
  apprenticesTrained: number;
  familyMembersInCraft: string[];
  
  // Media
  gallery: MediaItemDto[];
  videos: VideoItemDto[];
  primaryVideoUrl: string;
  primaryVideoThumbnail: string;
  
  // Products
  featuredProductIds: string[];
  signatureWorks: SignatureDto[];
  workshopDescription: string;
  workshopImageUrl: string;
  
  // Recognition
  awards: AwardDto[];
  certifications: string[];
  giTagHolder: boolean;
  giTagDetails: string;
  nationalAwardee: boolean;
  stateAwardee: boolean;
  
  // Contact & Social
  contactInfo: ContactInfoDto | null;
  socialLinks: SocialLinksDto | null;
  vendorId: string;
  
  // Events
  exhibitions: ExhibitionDto[];
  availableForWorkshops: boolean;
  availableForCommissions: boolean;
  workshopDetails: string;
  
  // Status
  featured: boolean;
  verified: boolean;
  viewCount: number;
  shareCount: number;
  
  tags: string[];
}

export interface ArtisanListItem {
  id: string;
  slug: string;
  artisanName: string;
  artisanNameHindi: string;
  title: string;
  titleHindi: string;
  profileImageUrl: string;
  
  village: string;
  district: string;
  state: string;
  
  primaryCraft: string;
  primaryCraftHindi: string;
  yearsOfExperience: number;
  generationsInCraft: number;
  
  shortBio: string;
  quote: string;
  
  nationalAwardee: boolean;
  stateAwardee: boolean;
  giTagHolder: boolean;
  
  featured: boolean;
  verified: boolean;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface StorySectionDto {
  title: string;
  titleHindi: string;
  content: string;
  contentHindi: string;
  imageUrl: string;
  imageCaption: string;
  orderIndex: number;
}

export interface FamilyBackgroundDto {
  fatherName: string;
  fatherCraft: string;
  grandfatherName: string;
  grandfatherCraft: string;
  familyHistory: string;
  familyHistoryHindi: string;
  generationCount: number;
  familyPhotoUrl: string;
}

export interface MediaItemDto {
  url: string;
  thumbnailUrl: string;
  caption: string;
  captionHindi: string;
  type: string;
  orderIndex: number;
}

export interface VideoItemDto {
  title: string;
  titleHindi: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  type: string;
  featured: boolean;
}

export interface SignatureDto {
  name: string;
  nameHindi: string;
  description: string;
  descriptionHindi: string;
  imageUrl: string;
  price: string;
  available: boolean;
}

export interface AwardDto {
  name: string;
  nameHindi: string;
  organization: string;
  year: number;
  description: string;
  imageUrl: string;
  level: string;
}

export interface ContactInfoDto {
  phone: string;
  email: string;
  address: string;
  workshopAddress: string;
  bestTimeToContact: string;
}

export interface SocialLinksDto {
  facebook: string;
  instagram: string;
  youtube: string;
  twitter: string;
  website: string;
}

export interface ExhibitionDto {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  upcoming: boolean;
}

export interface ArtisanStoriesOverview {
  totalStories: number;
  featuredStories: number;
  nationalAwardees: number;
  giTagHolders: number;
  featuredArtisans: ArtisanListItem[];
  artisansByCraft: CraftCount[];
  artisansByState: StateCount[];
}

export interface CraftCount {
  craft: string;
  craftHindi: string;
  count: number;
}

export interface StateCount {
  state: string;
  stateCode: string;
  count: number;
}

export interface ArtisanFilters {
  crafts: FilterOption[];
  states: FilterOption[];
  awardLevels: FilterOption[];
}

export interface FilterOption {
  value: string;
  label: string;
  labelHindi: string;
  count: number;
}

export interface ArtisanMapMarker {
  id: string;
  slug: string;
  artisanName: string;
  craft: string;
  profileImageUrl: string;
  village: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  featured: boolean;
  nationalAwardee: boolean;
}

// ==================== Award Level Constants ====================

export const AWARD_LEVELS = {
  NATIONAL: { code: 'NATIONAL', name: 'National Award', icon: 'emoji_events', color: '#FFD700' },
  STATE: { code: 'STATE', name: 'State Award', icon: 'military_tech', color: '#C0C0C0' },
  DISTRICT: { code: 'DISTRICT', name: 'District Award', icon: 'workspace_premium', color: '#CD7F32' },
  INTERNATIONAL: { code: 'INTERNATIONAL', name: 'International Award', icon: 'public', color: '#4CAF50' },
  PRIVATE: { code: 'PRIVATE', name: 'Private Recognition', icon: 'star', color: '#2196F3' }
};

export const VIDEO_TYPES = {
  TESTIMONIAL: { code: 'TESTIMONIAL', name: 'Testimonial', icon: 'mic' },
  WORK_PROCESS: { code: 'WORK_PROCESS', name: 'Work Process', icon: 'construction' },
  DOCUMENTARY: { code: 'DOCUMENTARY', name: 'Documentary', icon: 'movie' },
  INTERVIEW: { code: 'INTERVIEW', name: 'Interview', icon: 'record_voice_over' },
  WORKSHOP: { code: 'WORKSHOP', name: 'Workshop', icon: 'school' }
};

@Injectable({
  providedIn: 'root'
})
export class ArtisanStoryService {
  
  private baseUrl = `${environment.apiUrl}/odop/artisans`;
  
  // Cached data
  private overviewCache$: Observable<ArtisanStoriesOverview> | null = null;
  private filtersCache$: Observable<ArtisanFilters> | null = null;
  private featuredCache$: Observable<ArtisanListItem[]> | null = null;
  
  // Selected artisan state
  private selectedArtisanSubject = new BehaviorSubject<ArtisanStoryResponse | null>(null);
  selectedArtisan$ = this.selectedArtisanSubject.asObservable();
  
  // Recently viewed
  private recentlyViewedSubject = new BehaviorSubject<ArtisanListItem[]>([]);
  recentlyViewed$ = this.recentlyViewedSubject.asObservable();
  
  // Favorites (saved locally)
  private favoritesSubject = new BehaviorSubject<string[]>([]);
  favorites$ = this.favoritesSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.loadRecentlyViewedFromStorage();
    this.loadFavoritesFromStorage();
  }
  
  // ==================== Public Query Methods ====================
  
  getAllStories(): Observable<ArtisanListItem[]> {
    return this.http.get<ArtisanListItem[]>(this.baseUrl);
  }
  
  getFeaturedStories(): Observable<ArtisanListItem[]> {
    if (!this.featuredCache$) {
      this.featuredCache$ = this.http.get<ArtisanListItem[]>(`${this.baseUrl}/featured`).pipe(
        shareReplay(1),
        catchError(() => of([]))
      );
    }
    return this.featuredCache$;
  }
  
  getOverview(): Observable<ArtisanStoriesOverview> {
    if (!this.overviewCache$) {
      this.overviewCache$ = this.http.get<ArtisanStoriesOverview>(`${this.baseUrl}/overview`).pipe(
        shareReplay(1)
      );
    }
    return this.overviewCache$;
  }
  
  getStoryById(id: string): Observable<ArtisanStoryResponse> {
    return this.http.get<ArtisanStoryResponse>(`${this.baseUrl}/${id}`).pipe(
      tap(story => {
        this.selectedArtisanSubject.next(story);
        this.addToRecentlyViewed(story);
      })
    );
  }
  
  getStoryBySlug(slug: string): Observable<ArtisanStoryResponse> {
    return this.http.get<ArtisanStoryResponse>(`${this.baseUrl}/slug/${slug}`).pipe(
      tap(story => {
        this.selectedArtisanSubject.next(story);
        this.addToRecentlyViewed(story);
      })
    );
  }
  
  // ==================== Filter Methods ====================
  
  getFilters(): Observable<ArtisanFilters> {
    if (!this.filtersCache$) {
      this.filtersCache$ = this.http.get<ArtisanFilters>(`${this.baseUrl}/filters`).pipe(
        shareReplay(1)
      );
    }
    return this.filtersCache$;
  }
  
  getStoriesByState(stateCode: string): Observable<ArtisanListItem[]> {
    return this.http.get<ArtisanListItem[]>(`${this.baseUrl}/state/${stateCode}`);
  }
  
  getStoriesByCraft(craft: string): Observable<ArtisanListItem[]> {
    return this.http.get<ArtisanListItem[]>(`${this.baseUrl}/craft/${encodeURIComponent(craft)}`);
  }
  
  getNationalAwardees(): Observable<ArtisanListItem[]> {
    return this.http.get<ArtisanListItem[]>(`${this.baseUrl}/national-awardees`);
  }
  
  getStateAwardees(): Observable<ArtisanListItem[]> {
    return this.http.get<ArtisanListItem[]>(`${this.baseUrl}/state-awardees`);
  }
  
  getGiTagHolders(): Observable<ArtisanListItem[]> {
    return this.http.get<ArtisanListItem[]>(`${this.baseUrl}/gi-tag-holders`);
  }
  
  getAvailableForWorkshops(): Observable<ArtisanListItem[]> {
    return this.http.get<ArtisanListItem[]>(`${this.baseUrl}/workshops-available`);
  }
  
  getAvailableForCommissions(): Observable<ArtisanListItem[]> {
    return this.http.get<ArtisanListItem[]>(`${this.baseUrl}/commissions-available`);
  }
  
  getExperiencedArtisans(minYears: number = 20): Observable<ArtisanListItem[]> {
    const params = new HttpParams().set('minYears', minYears.toString());
    return this.http.get<ArtisanListItem[]>(`${this.baseUrl}/experienced`, { params });
  }
  
  getMultiGenerationArtisans(minGenerations: number = 3): Observable<ArtisanListItem[]> {
    const params = new HttpParams().set('minGenerations', minGenerations.toString());
    return this.http.get<ArtisanListItem[]>(`${this.baseUrl}/multi-generation`, { params });
  }
  
  // ==================== Search ====================
  
  searchStories(query: string): Observable<ArtisanListItem[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ArtisanListItem[]>(`${this.baseUrl}/search`, { params });
  }
  
  // ==================== Map Data ====================
  
  getMapMarkers(): Observable<ArtisanMapMarker[]> {
    return this.http.get<ArtisanMapMarker[]>(`${this.baseUrl}/map/markers`);
  }
  
  getMapMarkersInBounds(minLat: number, minLng: number, maxLat: number, maxLng: number): Observable<ArtisanMapMarker[]> {
    const params = new HttpParams()
      .set('minLat', minLat.toString())
      .set('minLng', minLng.toString())
      .set('maxLat', maxLat.toString())
      .set('maxLng', maxLng.toString());
    return this.http.get<ArtisanMapMarker[]>(`${this.baseUrl}/map/markers/bounds`, { params });
  }
  
  // ==================== Share Tracking ====================
  
  trackShare(storyId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${storyId}/share`, {});
  }
  
  // ==================== Recently Viewed ====================
  
  private addToRecentlyViewed(story: ArtisanStoryResponse): void {
    const listItem: ArtisanListItem = {
      id: story.id,
      slug: story.slug,
      artisanName: story.artisanName,
      artisanNameHindi: story.artisanNameHindi,
      title: story.title,
      titleHindi: story.titleHindi,
      profileImageUrl: story.profileImageUrl,
      village: story.village,
      district: story.district,
      state: story.state,
      primaryCraft: story.primaryCraft,
      primaryCraftHindi: story.primaryCraftHindi,
      yearsOfExperience: story.yearsOfExperience,
      generationsInCraft: story.generationsInCraft,
      shortBio: story.shortBio,
      quote: story.quote,
      nationalAwardee: story.nationalAwardee,
      stateAwardee: story.stateAwardee,
      giTagHolder: story.giTagHolder,
      featured: story.featured,
      verified: story.verified
    };
    
    const current = this.recentlyViewedSubject.value.filter(a => a.id !== story.id);
    const updated = [listItem, ...current].slice(0, 10);
    this.recentlyViewedSubject.next(updated);
    this.saveRecentlyViewedToStorage(updated);
  }
  
  private loadRecentlyViewedFromStorage(): void {
    try {
      const stored = localStorage.getItem('recentlyViewedArtisans');
      if (stored) {
        const artisans = JSON.parse(stored);
        this.recentlyViewedSubject.next(artisans);
      }
    } catch (e) {
      console.error('Error loading recently viewed artisans:', e);
    }
  }
  
  private saveRecentlyViewedToStorage(artisans: ArtisanListItem[]): void {
    try {
      localStorage.setItem('recentlyViewedArtisans', JSON.stringify(artisans));
    } catch (e) {
      console.error('Error saving recently viewed artisans:', e);
    }
  }
  
  clearRecentlyViewed(): void {
    this.recentlyViewedSubject.next([]);
    localStorage.removeItem('recentlyViewedArtisans');
  }
  
  // ==================== Favorites ====================
  
  private loadFavoritesFromStorage(): void {
    try {
      const stored = localStorage.getItem('favoriteArtisans');
      if (stored) {
        const favorites = JSON.parse(stored);
        this.favoritesSubject.next(favorites);
      }
    } catch (e) {
      console.error('Error loading favorite artisans:', e);
    }
  }
  
  private saveFavoritesToStorage(favorites: string[]): void {
    try {
      localStorage.setItem('favoriteArtisans', JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorite artisans:', e);
    }
  }
  
  toggleFavorite(artisanId: string): void {
    const current = this.favoritesSubject.value;
    const updated = current.includes(artisanId)
      ? current.filter(id => id !== artisanId)
      : [...current, artisanId];
    this.favoritesSubject.next(updated);
    this.saveFavoritesToStorage(updated);
  }
  
  isFavorite(artisanId: string): boolean {
    return this.favoritesSubject.value.includes(artisanId);
  }
  
  clearFavorites(): void {
    this.favoritesSubject.next([]);
    localStorage.removeItem('favoriteArtisans');
  }
  
  // ==================== Helper Methods ====================
  
  getAwardLevelInfo(level: string): { code: string; name: string; icon: string; color: string } | null {
    return (AWARD_LEVELS as any)[level] || null;
  }
  
  getVideoTypeInfo(type: string): { code: string; name: string; icon: string } | null {
    return (VIDEO_TYPES as any)[type] || null;
  }
  
  getAwardIcon(level: string): string {
    const info = this.getAwardLevelInfo(level);
    return info?.icon || 'emoji_events';
  }
  
  getAwardColor(level: string): string {
    const info = this.getAwardLevelInfo(level);
    return info?.color || '#9E9E9E';
  }
  
  formatExperience(years: number): string {
    if (years >= 50) return '50+ years';
    if (years >= 40) return '40+ years';
    if (years >= 30) return '30+ years';
    if (years >= 20) return '20+ years';
    if (years >= 10) return '10+ years';
    return `${years} years`;
  }
  
  formatGenerations(count: number): string {
    if (count === 1) return '1st generation';
    if (count === 2) return '2nd generation';
    if (count === 3) return '3rd generation';
    return `${count}th generation`;
  }
  
  getLocationDisplay(artisan: ArtisanListItem | ArtisanStoryResponse): string {
    const parts = [artisan.village, artisan.district, artisan.state].filter(Boolean);
    return parts.join(', ');
  }
  
  getBadges(artisan: ArtisanListItem | ArtisanStoryResponse): { label: string; icon: string; color: string }[] {
    const badges: { label: string; icon: string; color: string }[] = [];
    
    if (artisan.nationalAwardee) {
      badges.push({ label: 'National Awardee', icon: 'emoji_events', color: '#FFD700' });
    }
    if (artisan.stateAwardee) {
      badges.push({ label: 'State Awardee', icon: 'military_tech', color: '#C0C0C0' });
    }
    if (artisan.giTagHolder) {
      badges.push({ label: 'GI Tag Holder', icon: 'verified', color: '#4CAF50' });
    }
    if (artisan.verified) {
      badges.push({ label: 'Verified', icon: 'check_circle', color: '#2196F3' });
    }
    
    return badges;
  }
  
  // ==================== Social Sharing ====================
  
  getShareUrl(story: ArtisanStoryResponse): string {
    return `${window.location.origin}/artisan/${story.slug}`;
  }
  
  shareOnFacebook(story: ArtisanStoryResponse): void {
    const url = encodeURIComponent(this.getShareUrl(story));
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    this.trackShare(story.id).subscribe({
      error: (err) => console.error('Failed to track share:', err)
    });
  }
  
  shareOnTwitter(story: ArtisanStoryResponse): void {
    const url = encodeURIComponent(this.getShareUrl(story));
    const text = encodeURIComponent(`Discover the amazing story of ${story.artisanName}, a ${story.title} from ${story.state}.`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    this.trackShare(story.id).subscribe({
      error: (err) => console.error('Failed to track share:', err)
    });
  }
  
  shareOnWhatsApp(story: ArtisanStoryResponse): void {
    const url = encodeURIComponent(this.getShareUrl(story));
    const text = encodeURIComponent(`Check out the story of ${story.artisanName}, a ${story.title}: ${this.getShareUrl(story)}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    this.trackShare(story.id).subscribe({
      error: (err) => console.error('Failed to track share:', err)
    });
  }
  
  copyShareLink(story: ArtisanStoryResponse): void {
    navigator.clipboard.writeText(this.getShareUrl(story));
    this.trackShare(story.id).subscribe({
      error: (err) => console.error('Failed to track share:', err)
    });
  }
  
  // ==================== Cache Management ====================
  
  clearCache(): void {
    this.overviewCache$ = null;
    this.filtersCache$ = null;
    this.featuredCache$ = null;
  }
  
  refreshOverview(): Observable<ArtisanStoriesOverview> {
    this.overviewCache$ = null;
    return this.getOverview();
  }
}
