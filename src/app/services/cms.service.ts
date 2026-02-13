import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ==================== INTERFACES ====================

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  type: 'Page' | 'Banner' | 'Landing';
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  status: 'Draft' | 'Published' | 'Archived';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author?: string;
}

export interface CmsBanner {
  id: string;
  title: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl: string;
  altText?: string;
  position: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsFaq {
  id: string;
  question: string;
  answer: string;
  category?: string;
  position: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CmsTestimonial {
  id: string;
  name: string;
  avatar?: string;
  designation?: string;
  company?: string;
  rating: number;
  text: string;
  imageUrl?: string;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeoSettings {
  id?: string;
  homepageTitle: string;
  homepageDescription: string;
  homepageKeywords: string;
  blogTitle: string;
  blogDescription: string;
  blogKeywords: string;
  categoryTitleTemplate: string;
  productTitleTemplate: string;
  defaultAuthor: string;
  robotsTxt: string;
  googleAnalyticsId?: string;
  googleSearchConsole?: string;
  facebookPixelId?: string;
  twitterHandle?: string;
  ogDefaultImage?: string;
}

export interface CmsListResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class CmsService {
  private readonly apiUrl = `${environment.apiUrl}/odop/cms`;

  // State management
  private pagesSubject = new BehaviorSubject<CmsPage[]>([]);
  private bannersSubject = new BehaviorSubject<CmsBanner[]>([]);
  private faqsSubject = new BehaviorSubject<CmsFaq[]>([]);
  private testimonialsSubject = new BehaviorSubject<CmsTestimonial[]>([]);
  private seoSettingsSubject = new BehaviorSubject<SeoSettings | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  pages$ = this.pagesSubject.asObservable();
  banners$ = this.bannersSubject.asObservable();
  faqs$ = this.faqsSubject.asObservable();
  testimonials$ = this.testimonialsSubject.asObservable();
  seoSettings$ = this.seoSettingsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== PAGES ====================

  getPages(page: number = 0, size: number = 20, status?: string): Observable<CmsListResponse<CmsPage>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<CmsListResponse<CmsPage>>(`${this.apiUrl}/pages`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.pagesSubject.next(response.data);
        }
      }),
      catchError(err => {
        console.error('Failed to load pages:', err);
        return of({ success: false, data: [], total: 0, page: 0, pageSize: size });
      })
    );
  }

  getPageById(id: string): Observable<CmsPage> {
    return this.http.get<CmsPage>(`${this.apiUrl}/pages/${id}`);
  }

  getPageBySlug(slug: string): Observable<CmsPage> {
    return this.http.get<CmsPage>(`${this.apiUrl}/pages/slug/${slug}`);
  }

  createPage(page: Partial<CmsPage>): Observable<CmsPage> {
    return this.http.post<CmsPage>(`${this.apiUrl}/pages`, page).pipe(
      tap(newPage => {
        const current = this.pagesSubject.value;
        this.pagesSubject.next([newPage, ...current]);
      })
    );
  }

  updatePage(id: string, page: Partial<CmsPage>): Observable<CmsPage> {
    return this.http.put<CmsPage>(`${this.apiUrl}/pages/${id}`, page).pipe(
      tap(updated => {
        const current = this.pagesSubject.value;
        const index = current.findIndex(p => p.id === id);
        if (index !== -1) {
          current[index] = updated;
          this.pagesSubject.next([...current]);
        }
      })
    );
  }

  deletePage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pages/${id}`).pipe(
      tap(() => {
        const current = this.pagesSubject.value;
        this.pagesSubject.next(current.filter(p => p.id !== id));
      })
    );
  }

  publishPage(id: string): Observable<CmsPage> {
    return this.http.post<CmsPage>(`${this.apiUrl}/pages/${id}/publish`, {}).pipe(
      tap(updated => {
        const current = this.pagesSubject.value;
        const index = current.findIndex(p => p.id === id);
        if (index !== -1) {
          current[index] = updated;
          this.pagesSubject.next([...current]);
        }
      })
    );
  }

  // ==================== BANNERS ====================

  getBanners(activeOnly: boolean = false): Observable<CmsListResponse<CmsBanner>> {
    let params = new HttpParams();
    if (activeOnly) {
      params = params.set('active', 'true');
    }

    return this.http.get<CmsListResponse<CmsBanner>>(`${this.apiUrl}/banners`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.bannersSubject.next(response.data);
        }
      }),
      catchError(err => {
        console.error('Failed to load banners:', err);
        return of({ success: false, data: [], total: 0, page: 0, pageSize: 20 });
      })
    );
  }

  createBanner(banner: Partial<CmsBanner>): Observable<CmsBanner> {
    return this.http.post<CmsBanner>(`${this.apiUrl}/banners`, banner).pipe(
      tap(newBanner => {
        const current = this.bannersSubject.value;
        this.bannersSubject.next([...current, newBanner]);
      })
    );
  }

  updateBanner(id: string, banner: Partial<CmsBanner>): Observable<CmsBanner> {
    return this.http.put<CmsBanner>(`${this.apiUrl}/banners/${id}`, banner).pipe(
      tap(updated => {
        const current = this.bannersSubject.value;
        const index = current.findIndex(b => b.id === id);
        if (index !== -1) {
          current[index] = updated;
          this.bannersSubject.next([...current]);
        }
      })
    );
  }

  deleteBanner(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/banners/${id}`).pipe(
      tap(() => {
        const current = this.bannersSubject.value;
        this.bannersSubject.next(current.filter(b => b.id !== id));
      })
    );
  }

  toggleBannerStatus(id: string): Observable<CmsBanner> {
    return this.http.post<CmsBanner>(`${this.apiUrl}/banners/${id}/toggle`, {}).pipe(
      tap(updated => {
        const current = this.bannersSubject.value;
        const index = current.findIndex(b => b.id === id);
        if (index !== -1) {
          current[index] = updated;
          this.bannersSubject.next([...current]);
        }
      })
    );
  }

  // ==================== FAQs ====================

  getFaqs(category?: string): Observable<CmsListResponse<CmsFaq>> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }

    return this.http.get<CmsListResponse<CmsFaq>>(`${this.apiUrl}/faqs`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.faqsSubject.next(response.data);
        }
      }),
      catchError(err => {
        console.error('Failed to load FAQs:', err);
        return of({ success: false, data: [], total: 0, page: 0, pageSize: 20 });
      })
    );
  }

  createFaq(faq: Partial<CmsFaq>): Observable<CmsFaq> {
    return this.http.post<CmsFaq>(`${this.apiUrl}/faqs`, faq).pipe(
      tap(newFaq => {
        const current = this.faqsSubject.value;
        this.faqsSubject.next([...current, newFaq]);
      })
    );
  }

  updateFaq(id: string, faq: Partial<CmsFaq>): Observable<CmsFaq> {
    return this.http.put<CmsFaq>(`${this.apiUrl}/faqs/${id}`, faq).pipe(
      tap(updated => {
        const current = this.faqsSubject.value;
        const index = current.findIndex(f => f.id === id);
        if (index !== -1) {
          current[index] = updated;
          this.faqsSubject.next([...current]);
        }
      })
    );
  }

  deleteFaq(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/faqs/${id}`).pipe(
      tap(() => {
        const current = this.faqsSubject.value;
        this.faqsSubject.next(current.filter(f => f.id !== id));
      })
    );
  }

  toggleFaqStatus(id: string): Observable<CmsFaq> {
    return this.http.post<CmsFaq>(`${this.apiUrl}/faqs/${id}/toggle`, {}).pipe(
      tap(updated => {
        const current = this.faqsSubject.value;
        const index = current.findIndex(f => f.id === id);
        if (index !== -1) {
          current[index] = updated;
          this.faqsSubject.next([...current]);
        }
      })
    );
  }

  // ==================== TESTIMONIALS ====================

  getTestimonials(featuredOnly: boolean = false): Observable<CmsListResponse<CmsTestimonial>> {
    let params = new HttpParams();
    if (featuredOnly) {
      params = params.set('featured', 'true');
    }

    return this.http.get<CmsListResponse<CmsTestimonial>>(`${this.apiUrl}/testimonials`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.testimonialsSubject.next(response.data);
        }
      }),
      catchError(err => {
        console.error('Failed to load testimonials:', err);
        return of({ success: false, data: [], total: 0, page: 0, pageSize: 20 });
      })
    );
  }

  createTestimonial(testimonial: Partial<CmsTestimonial>): Observable<CmsTestimonial> {
    return this.http.post<CmsTestimonial>(`${this.apiUrl}/testimonials`, testimonial).pipe(
      tap(newTestimonial => {
        const current = this.testimonialsSubject.value;
        this.testimonialsSubject.next([...current, newTestimonial]);
      })
    );
  }

  updateTestimonial(id: string, testimonial: Partial<CmsTestimonial>): Observable<CmsTestimonial> {
    return this.http.put<CmsTestimonial>(`${this.apiUrl}/testimonials/${id}`, testimonial).pipe(
      tap(updated => {
        const current = this.testimonialsSubject.value;
        const index = current.findIndex(t => t.id === id);
        if (index !== -1) {
          current[index] = updated;
          this.testimonialsSubject.next([...current]);
        }
      })
    );
  }

  deleteTestimonial(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/testimonials/${id}`).pipe(
      tap(() => {
        const current = this.testimonialsSubject.value;
        this.testimonialsSubject.next(current.filter(t => t.id !== id));
      })
    );
  }

  toggleTestimonialStatus(id: string): Observable<CmsTestimonial> {
    return this.http.post<CmsTestimonial>(`${this.apiUrl}/testimonials/${id}/toggle`, {}).pipe(
      tap(updated => {
        const current = this.testimonialsSubject.value;
        const index = current.findIndex(t => t.id === id);
        if (index !== -1) {
          current[index] = updated;
          this.testimonialsSubject.next([...current]);
        }
      })
    );
  }

  // ==================== SEO SETTINGS ====================

  getSeoSettings(): Observable<SeoSettings> {
    return this.http.get<SeoSettings>(`${this.apiUrl}/seo`).pipe(
      tap(settings => {
        this.seoSettingsSubject.next(settings);
      }),
      catchError(err => {
        console.error('Failed to load SEO settings:', err);
        return of(this.getDefaultSeoSettings());
      })
    );
  }

  updateSeoSettings(settings: Partial<SeoSettings>): Observable<SeoSettings> {
    return this.http.put<SeoSettings>(`${this.apiUrl}/seo`, settings).pipe(
      tap(updated => {
        this.seoSettingsSubject.next(updated);
      })
    );
  }

  private getDefaultSeoSettings(): SeoSettings {
    return {
      homepageTitle: 'ODOP - One District One Product | Authentic Indian Crafts',
      homepageDescription: 'Discover authentic handcrafted products from across India through our One District One Product initiative.',
      homepageKeywords: 'ODOP, Indian crafts, handmade, artisan products, traditional crafts',
      blogTitle: 'ODOP Blog - Stories of Indian Artisans',
      blogDescription: 'Explore stories, insights, and news about Indian artisans and their crafts.',
      blogKeywords: 'artisan stories, Indian crafts blog, ODOP news',
      categoryTitleTemplate: '{category} - ODOP Products',
      productTitleTemplate: '{product} | {category} - ODOP',
      defaultAuthor: 'ODOP Team',
      robotsTxt: 'User-agent: *\nAllow: /\nSitemap: https://odop.in/sitemap.xml'
    };
  }

  // ==================== HELPERS ====================

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
