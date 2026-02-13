import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { 
  CmsService, 
  CmsPage, 
  CmsBanner, 
  CmsFaq, 
  CmsTestimonial, 
  SeoSettings 
} from '../../../services/cms.service';

@Component({
  selector: 'app-admin-dashboard-cms',
  templateUrl: './admin-dashboard-cms.component.html',
  styleUrls: ['./admin-dashboard-cms.component.css']
})
export class AdminDashboardCmsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activeTab: string = 'pages';
  searchTerm: string = '';
  filterType: string = 'all';
  isLoading: boolean = false;
  
  // Data from CMS Service
  pages: CmsPage[] = [];
  banners: CmsBanner[] = [];
  faqs: CmsFaq[] = [];
  testimonials: CmsTestimonial[] = [];
  seoSettings: SeoSettings | null = null;

  constructor(private cmsService: CmsService) { }

  ngOnInit(): void {
    this.loadAllCmsData();
    this.subscribeToServiceObservables();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToServiceObservables(): void {
    this.cmsService.pages$.pipe(takeUntil(this.destroy$)).subscribe(pages => this.pages = pages);
    this.cmsService.banners$.pipe(takeUntil(this.destroy$)).subscribe(banners => this.banners = banners);
    this.cmsService.faqs$.pipe(takeUntil(this.destroy$)).subscribe(faqs => this.faqs = faqs);
    this.cmsService.testimonials$.pipe(takeUntil(this.destroy$)).subscribe(testimonials => this.testimonials = testimonials);
    this.cmsService.seoSettings$.pipe(takeUntil(this.destroy$)).subscribe(settings => {
      if (settings) this.seoSettings = settings;
    });
    this.cmsService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => this.isLoading = loading);
  }

  private loadAllCmsData(): void {
    this.isLoading = true;
    
    forkJoin({
      pages: this.cmsService.getPages(),
      banners: this.cmsService.getBanners(),
      faqs: this.cmsService.getFaqs(),
      testimonials: this.cmsService.getTestimonials(),
      seoSettings: this.cmsService.getSeoSettings()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load CMS data:', err);
        this.isLoading = false;
      }
    });
  }

  showTab(tabName: string): void {
    this.activeTab = tabName;
  }

  toggleBanner(banner: CmsBanner): void {
    this.cmsService.toggleBannerStatus(banner.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Failed to toggle banner:', err)
      });
  }

  toggleFaq(faq: CmsFaq): void {
    this.cmsService.toggleFaqStatus(faq.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Failed to toggle FAQ:', err)
      });
  }

  toggleTestimonial(testimonial: CmsTestimonial): void {
    this.cmsService.toggleTestimonialStatus(testimonial.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Failed to toggle testimonial:', err)
      });
  }

  editItem(item: any): void {
    // TODO: Open edit modal or navigate to edit page
    console.log('Edit item:', item);
  }

  deletePage(page: CmsPage): void {
    if (confirm('Are you sure you want to delete this page?')) {
      this.cmsService.deletePage(page.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => console.error('Failed to delete page:', err)
        });
    }
  }

  deleteBanner(banner: CmsBanner): void {
    if (confirm('Are you sure you want to delete this banner?')) {
      this.cmsService.deleteBanner(banner.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => console.error('Failed to delete banner:', err)
        });
    }
  }

  deleteFaq(faq: CmsFaq): void {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      this.cmsService.deleteFaq(faq.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => console.error('Failed to delete FAQ:', err)
        });
    }
  }

  deleteTestimonial(testimonial: CmsTestimonial): void {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      this.cmsService.deleteTestimonial(testimonial.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => console.error('Failed to delete testimonial:', err)
        });
    }
  }

  publishPage(page: CmsPage): void {
    this.cmsService.publishPage(page.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Failed to publish page:', err)
      });
  }

  addNewContent(): void {
    // TODO: Open add content modal based on active tab
    console.log('Add new content for tab:', this.activeTab);
  }

  saveSeoSettings(): void {
    if (this.seoSettings) {
      this.cmsService.updateSeoSettings(this.seoSettings)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => alert('SEO settings saved successfully!'),
          error: (err) => {
            console.error('Failed to save SEO settings:', err);
            alert('Failed to save SEO settings. Please try again.');
          }
        });
    }
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value;
  }

  onFilter(event: any): void {
    this.filterType = event.target.value;
  }

  getFilteredPages(): CmsPage[] {
    return this.pages.filter(page => {
      const matchesSearch = page.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           page.type.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesFilter = this.filterType === 'all' || 
                           page.type.toLowerCase().includes(this.filterType.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  getAvatarInitials(name: string): string {
    return this.cmsService.getInitials(name);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}