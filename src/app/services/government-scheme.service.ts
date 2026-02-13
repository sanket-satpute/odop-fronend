import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ==================== Interfaces ====================

export interface SchemeResponse {
  id: string;
  slug: string;
  name: string;
  nameHindi: string;
  shortName: string;
  description: string;
  descriptionHindi: string;
  tagline: string;
  
  type: string;
  typeDisplayName: string;
  category: string;
  targetBeneficiaries: BeneficiaryDto[];
  level: string;
  
  ministry: string;
  ministryHindi: string;
  implementingAgency: string;
  contactEmail: string;
  contactPhone: string;
  helplineNumber: string;
  
  benefits: BenefitDto[];
  maxFundingAmount: string;
  subsidyPercentage: string;
  interestRate: string;
  collateralRequirement: string;
  
  eligibilitySummary: string;
  eligibilitySummaryHindi: string;
  eligibilityCriteria: EligibilityDto[];
  requiredDocuments: string[];
  
  applicationProcess: string;
  applicationProcessHindi: string;
  applicationSteps: ApplicationStepDto[];
  applicationUrl: string;
  applicationFormUrl: string;
  applicationMode: string;
  onlineApplicationAvailable: boolean;
  
  launchDate: string;
  lastDateToApply: string;
  processingTime: string;
  openForApplications: boolean;
  applicationsClosed: boolean;
  daysUntilDeadline: number;
  
  applicableStates: string[];
  panIndiaScheme: boolean;
  
  logoUrl: string;
  bannerUrl: string;
  thumbnailUrl: string;
  pdfBrochureUrl: string;
  
  successStories: SuccessStoryDto[];
  faqs: FaqDto[];
  
  featured: boolean;
  viewCount: number;
  
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

export interface SchemeListItem {
  id: string;
  slug: string;
  name: string;
  nameHindi: string;
  shortName: string;
  description: string;
  tagline: string;
  
  type: string;
  typeDisplayName: string;
  category: string;
  targetBeneficiaryNames: string[];
  
  ministry: string;
  maxFundingAmount: string;
  collateralFree: boolean;
  
  applicationUrl: string;
  onlineApplicationAvailable: boolean;
  openForApplications: boolean;
  
  logoUrl: string;
  thumbnailUrl: string;
  
  featured: boolean;
  panIndiaScheme: boolean;
}

export interface BenefitDto {
  title: string;
  titleHindi: string;
  description: string;
  descriptionHindi: string;
  iconName: string;
  amount: string;
}

export interface BeneficiaryDto {
  code: string;
  name: string;
  nameHindi: string;
}

export interface EligibilityDto {
  criterion: string;
  criterionHindi: string;
  mandatory: boolean;
}

export interface ApplicationStepDto {
  stepNumber: number;
  title: string;
  titleHindi: string;
  description: string;
  descriptionHindi: string;
  actionUrl: string;
}

export interface SuccessStoryDto {
  beneficiaryName: string;
  location: string;
  craft: string;
  story: string;
  imageUrl: string;
  amountReceived: string;
  year: number;
}

export interface FaqDto {
  question: string;
  questionHindi: string;
  answer: string;
  answerHindi: string;
}

export interface SchemesOverview {
  totalSchemes: number;
  activeSchemes: number;
  centralSchemes: number;
  stateSchemes: number;
  loanSchemes: number;
  grantSchemes: number;
  trainingSchemes: number;
  featuredSchemes: SchemeListItem[];
  schemesByCategory: CategoryCount[];
  schemesByType: TypeCount[];
}

export interface CategoryCount {
  category: string;
  displayName: string;
  count: number;
}

export interface TypeCount {
  type: string;
  displayName: string;
  count: number;
}

export interface SchemeFilters {
  types: FilterOption[];
  categories: FilterOption[];
  beneficiaries: FilterOption[];
  levels: FilterOption[];
  states: FilterOption[];
}

export interface FilterOption {
  value: string;
  label: string;
  labelHindi: string;
  count: number;
}

export interface SchemeFinderRequest {
  beneficiaryTypes?: string[];
  craft?: string;
  state?: string;
  schemeType?: string;
  onlineApplicationPreferred?: boolean;
  collateralFree?: boolean;
  fundingRequirement?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SchemeFinderResponse {
  recommendedSchemes: SchemeListItem[];
  otherSchemes: SchemeListItem[];
  totalMatching: number;
  searchSummary: string;
}

// ==================== Enums as Constants ====================

export const SCHEME_TYPES = {
  LOAN: { code: 'LOAN', name: 'Loan Scheme', nameHindi: 'ऋण योजना', icon: 'account_balance' },
  SUBSIDY: { code: 'SUBSIDY', name: 'Subsidy Scheme', nameHindi: 'सब्सिडी योजना', icon: 'savings' },
  GRANT: { code: 'GRANT', name: 'Grant Scheme', nameHindi: 'अनुदान योजना', icon: 'card_giftcard' },
  TRAINING: { code: 'TRAINING', name: 'Training & Skill Development', nameHindi: 'प्रशिक्षण एवं कौशल विकास', icon: 'school' },
  MARKETING: { code: 'MARKETING', name: 'Marketing Support', nameHindi: 'विपणन सहायता', icon: 'campaign' },
  INFRASTRUCTURE: { code: 'INFRASTRUCTURE', name: 'Infrastructure Support', nameHindi: 'बुनियादी ढांचा सहायता', icon: 'business' },
  INSURANCE: { code: 'INSURANCE', name: 'Insurance Scheme', nameHindi: 'बीमा योजना', icon: 'security' },
  PENSION: { code: 'PENSION', name: 'Pension Scheme', nameHindi: 'पेंशन योजना', icon: 'elderly' },
  CERTIFICATION: { code: 'CERTIFICATION', name: 'Certification & Recognition', nameHindi: 'प्रमाणन और मान्यता', icon: 'verified' },
  CLUSTER: { code: 'CLUSTER', name: 'Cluster Development', nameHindi: 'क्लस्टर विकास', icon: 'hub' },
  EXPORT: { code: 'EXPORT', name: 'Export Promotion', nameHindi: 'निर्यात प्रोत्साहन', icon: 'flight_takeoff' },
  COMPOSITE: { code: 'COMPOSITE', name: 'Composite/Multiple Benefits', nameHindi: 'समग्र/बहुविध लाभ', icon: 'inventory_2' }
};

export const TARGET_BENEFICIARIES = {
  ARTISANS: { code: 'ARTISANS', name: 'Artisans', nameHindi: 'कारीगर', icon: 'handyman' },
  WEAVERS: { code: 'WEAVERS', name: 'Weavers', nameHindi: 'बुनकर', icon: 'tapas' },
  CRAFTSMEN: { code: 'CRAFTSMEN', name: 'Craftsmen', nameHindi: 'शिल्पकार', icon: 'hardware' },
  MSME: { code: 'MSME', name: 'MSMEs', nameHindi: 'एमएसएमई', icon: 'store' },
  WOMEN_ENTREPRENEURS: { code: 'WOMEN_ENTREPRENEURS', name: 'Women Entrepreneurs', nameHindi: 'महिला उद्यमी', icon: 'female' },
  SC_ST: { code: 'SC_ST', name: 'SC/ST Entrepreneurs', nameHindi: 'अनुसूचित जाति/जनजाति उद्यमी', icon: 'diversity_3' },
  RURAL_ENTREPRENEURS: { code: 'RURAL_ENTREPRENEURS', name: 'Rural Entrepreneurs', nameHindi: 'ग्रामीण उद्यमी', icon: 'agriculture' },
  FIRST_GENERATION: { code: 'FIRST_GENERATION', name: 'First Generation Entrepreneurs', nameHindi: 'पहली पीढ़ी के उद्यमी', icon: 'rocket_launch' },
  SHG: { code: 'SHG', name: 'Self Help Groups', nameHindi: 'स्वयं सहायता समूह', icon: 'groups' },
  COOPERATIVES: { code: 'COOPERATIVES', name: 'Cooperatives', nameHindi: 'सहकारी समितियां', icon: 'handshake' },
  EXPORTERS: { code: 'EXPORTERS', name: 'Exporters', nameHindi: 'निर्यातक', icon: 'public' },
  STARTUP: { code: 'STARTUP', name: 'Startups', nameHindi: 'स्टार्टअप', icon: 'lightbulb' }
};

@Injectable({
  providedIn: 'root'
})
export class GovernmentSchemeService {
  
  private baseUrl = `${environment.apiUrl}/odop/schemes`;
  
  // Cached data
  private overviewCache$: Observable<SchemesOverview> | null = null;
  private filtersCache$: Observable<SchemeFilters> | null = null;
  private featuredCache$: Observable<SchemeListItem[]> | null = null;
  
  // Selected scheme state
  private selectedSchemeSubject = new BehaviorSubject<SchemeResponse | null>(null);
  selectedScheme$ = this.selectedSchemeSubject.asObservable();
  
  // Compare list
  private compareListSubject = new BehaviorSubject<SchemeListItem[]>([]);
  compareList$ = this.compareListSubject.asObservable();
  
  // Recently viewed
  private recentlyViewedSubject = new BehaviorSubject<SchemeListItem[]>([]);
  recentlyViewed$ = this.recentlyViewedSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.loadRecentlyViewedFromStorage();
  }
  
  // ==================== Public Query Methods ====================
  
  getAllSchemes(): Observable<SchemeListItem[]> {
    return this.http.get<SchemeListItem[]>(this.baseUrl);
  }
  
  getFeaturedSchemes(): Observable<SchemeListItem[]> {
    if (!this.featuredCache$) {
      this.featuredCache$ = this.http.get<SchemeListItem[]>(`${this.baseUrl}/featured`).pipe(
        shareReplay(1),
        catchError(() => of([]))
      );
    }
    return this.featuredCache$;
  }
  
  getOverview(): Observable<SchemesOverview> {
    if (!this.overviewCache$) {
      this.overviewCache$ = this.http.get<SchemesOverview>(`${this.baseUrl}/overview`).pipe(
        shareReplay(1)
      );
    }
    return this.overviewCache$;
  }
  
  getSchemeById(id: string): Observable<SchemeResponse> {
    return this.http.get<SchemeResponse>(`${this.baseUrl}/${id}`).pipe(
      tap(scheme => {
        this.selectedSchemeSubject.next(scheme);
        this.addToRecentlyViewed(scheme);
      })
    );
  }
  
  getSchemeBySlug(slug: string): Observable<SchemeResponse> {
    return this.http.get<SchemeResponse>(`${this.baseUrl}/slug/${slug}`).pipe(
      tap(scheme => {
        this.selectedSchemeSubject.next(scheme);
        this.addToRecentlyViewed(scheme);
      })
    );
  }
  
  // ==================== Filter Methods ====================
  
  getFilters(): Observable<SchemeFilters> {
    if (!this.filtersCache$) {
      this.filtersCache$ = this.http.get<SchemeFilters>(`${this.baseUrl}/filters`).pipe(
        shareReplay(1)
      );
    }
    return this.filtersCache$;
  }
  
  getSchemesByType(type: string): Observable<SchemeListItem[]> {
    return this.http.get<SchemeListItem[]>(`${this.baseUrl}/type/${type}`);
  }
  
  getSchemesByCategory(category: string): Observable<SchemeListItem[]> {
    return this.http.get<SchemeListItem[]>(`${this.baseUrl}/category/${category}`);
  }
  
  getSchemesByBeneficiary(beneficiary: string): Observable<SchemeListItem[]> {
    return this.http.get<SchemeListItem[]>(`${this.baseUrl}/beneficiary/${beneficiary}`);
  }
  
  getSchemesByLevel(level: string): Observable<SchemeListItem[]> {
    return this.http.get<SchemeListItem[]>(`${this.baseUrl}/level/${level}`);
  }
  
  getSchemesForState(stateCode: string): Observable<SchemeListItem[]> {
    return this.http.get<SchemeListItem[]>(`${this.baseUrl}/state/${stateCode}`);
  }
  
  // ==================== Special Filters ====================
  
  getOpenSchemes(): Observable<SchemeListItem[]> {
    return this.http.get<SchemeListItem[]>(`${this.baseUrl}/open`);
  }
  
  getOnlineSchemes(): Observable<SchemeListItem[]> {
    return this.http.get<SchemeListItem[]>(`${this.baseUrl}/online`);
  }
  
  getCollateralFreeSchemes(): Observable<SchemeListItem[]> {
    return this.http.get<SchemeListItem[]>(`${this.baseUrl}/collateral-free`);
  }
  
  getLoanSchemes(): Observable<SchemeListItem[]> {
    return this.http.get<SchemeListItem[]>(`${this.baseUrl}/loans`);
  }
  
  getGrantSchemes(): Observable<SchemeListItem[]> {
    return this.http.get<SchemeListItem[]>(`${this.baseUrl}/grants`);
  }
  
  // ==================== Search & Finder ====================
  
  searchSchemes(query: string): Observable<SchemeListItem[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<SchemeListItem[]>(`${this.baseUrl}/search`, { params });
  }
  
  findSchemes(request: SchemeFinderRequest): Observable<SchemeFinderResponse> {
    return this.http.post<SchemeFinderResponse>(`${this.baseUrl}/finder`, request);
  }
  
  // ==================== Analytics ====================
  
  trackApplicationClick(schemeId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${schemeId}/track-apply`, {});
  }
  
  // ==================== Compare Functionality ====================
  
  addToCompare(scheme: SchemeListItem): void {
    const current = this.compareListSubject.value;
    if (current.length < 3 && !current.find(s => s.id === scheme.id)) {
      this.compareListSubject.next([...current, scheme]);
    }
  }
  
  removeFromCompare(schemeId: string): void {
    const current = this.compareListSubject.value;
    this.compareListSubject.next(current.filter(s => s.id !== schemeId));
  }
  
  clearCompare(): void {
    this.compareListSubject.next([]);
  }
  
  isInCompare(schemeId: string): boolean {
    return !!this.compareListSubject.value.find(s => s.id === schemeId);
  }
  
  // ==================== Recently Viewed ====================
  
  private addToRecentlyViewed(scheme: SchemeResponse): void {
    const listItem: SchemeListItem = {
      id: scheme.id,
      slug: scheme.slug,
      name: scheme.name,
      nameHindi: scheme.nameHindi,
      shortName: scheme.shortName,
      description: scheme.description,
      tagline: scheme.tagline,
      type: scheme.type,
      typeDisplayName: scheme.typeDisplayName,
      category: scheme.category,
      targetBeneficiaryNames: scheme.targetBeneficiaries?.map(b => b.name) || [],
      ministry: scheme.ministry,
      maxFundingAmount: scheme.maxFundingAmount,
      collateralFree: scheme.collateralRequirement?.toLowerCase().includes('no collateral') || false,
      applicationUrl: scheme.applicationUrl,
      onlineApplicationAvailable: scheme.onlineApplicationAvailable,
      openForApplications: scheme.openForApplications,
      logoUrl: scheme.logoUrl,
      thumbnailUrl: scheme.thumbnailUrl,
      featured: scheme.featured,
      panIndiaScheme: scheme.panIndiaScheme
    };
    
    const current = this.recentlyViewedSubject.value.filter(s => s.id !== scheme.id);
    const updated = [listItem, ...current].slice(0, 10);
    this.recentlyViewedSubject.next(updated);
    this.saveRecentlyViewedToStorage(updated);
  }
  
  private loadRecentlyViewedFromStorage(): void {
    try {
      const stored = localStorage.getItem('recentlyViewedSchemes');
      if (stored) {
        const schemes = JSON.parse(stored);
        this.recentlyViewedSubject.next(schemes);
      }
    } catch (e) {
      console.error('Error loading recently viewed schemes:', e);
    }
  }
  
  private saveRecentlyViewedToStorage(schemes: SchemeListItem[]): void {
    try {
      localStorage.setItem('recentlyViewedSchemes', JSON.stringify(schemes));
    } catch (e) {
      console.error('Error saving recently viewed schemes:', e);
    }
  }
  
  clearRecentlyViewed(): void {
    this.recentlyViewedSubject.next([]);
    localStorage.removeItem('recentlyViewedSchemes');
  }
  
  // ==================== Helper Methods ====================
  
  getSchemeTypeInfo(type: string): { code: string; name: string; nameHindi: string; icon: string } | null {
    return (SCHEME_TYPES as any)[type] || null;
  }
  
  getBeneficiaryInfo(code: string): { code: string; name: string; nameHindi: string; icon: string } | null {
    return (TARGET_BENEFICIARIES as any)[code] || null;
  }
  
  getSchemeTypeIcon(type: string): string {
    const info = this.getSchemeTypeInfo(type);
    return info?.icon || 'description';
  }
  
  getBeneficiaryIcon(code: string): string {
    const info = this.getBeneficiaryInfo(code);
    return info?.icon || 'person';
  }
  
  getApplicationStatusLabel(scheme: SchemeListItem | SchemeResponse): string {
    if (!scheme.openForApplications) {
      return 'Applications Closed';
    }
    if (scheme.onlineApplicationAvailable) {
      return 'Apply Online';
    }
    return 'Apply Now';
  }
  
  getApplicationStatusColor(scheme: SchemeListItem | SchemeResponse): string {
    if (!scheme.openForApplications) {
      return 'warn';
    }
    if (scheme.onlineApplicationAvailable) {
      return 'primary';
    }
    return 'accent';
  }
  
  formatAmount(amount: string | null | undefined): string {
    if (!amount) return 'N/A';
    return amount;
  }
  
  isDeadlineNear(daysUntilDeadline: number): boolean {
    return daysUntilDeadline > 0 && daysUntilDeadline <= 30;
  }
  
  // ==================== Cache Management ====================
  
  clearCache(): void {
    this.overviewCache$ = null;
    this.filtersCache$ = null;
    this.featuredCache$ = null;
  }
  
  refreshOverview(): Observable<SchemesOverview> {
    this.overviewCache$ = null;
    return this.getOverview();
  }
}
