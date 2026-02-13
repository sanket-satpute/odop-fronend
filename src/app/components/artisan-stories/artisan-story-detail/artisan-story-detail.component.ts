import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { 
  ArtisanStoryService, 
  ArtisanStoryResponse,
  ArtisanListItem 
} from '../../../services/artisan-story.service';
import { CartServiceService } from '../../../project/services/cart-service.service';

@Component({
  selector: 'app-artisan-story-detail',
  templateUrl: './artisan-story-detail.component.html',
  styleUrls: ['./artisan-story-detail.component.css']
})
export class ArtisanStoryDetailComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  // Data
  artisan: ArtisanStoryResponse | null = null;
  relatedArtisans: ArtisanListItem[] = [];
  featuredProducts: any[] = [];
  
  // States
  isLoading = true;
  error: string | null = null;
  activeTab = 'story';
  selectedGalleryIndex = 0;
  showGalleryModal = false;
  showVideoModal = false;
  selectedVideoUrl = '';
  
  // Share
  shareUrl = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private artisanService: ArtisanStoryService,
    private cartService: CartServiceService,
    private sanitizer: DomSanitizer
  ) {}
  
  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const slug = params['slug'];
        if (slug) {
          this.loadArtisanStory(slug);
        }
      });
    
    this.shareUrl = window.location.href;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ==================== DATA LOADING ====================
  
  private loadArtisanStory(slug: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.artisanService.getStoryBySlug(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (artisan: ArtisanStoryResponse) => {
          this.artisan = artisan;
          this.isLoading = false;
          this.loadRelatedContent();
        },
        error: (err: Error) => {
          console.error('Error loading artisan:', err);
          this.error = 'Could not load artisan story. Please try again.';
          this.isLoading = false;
        }
      });
  }
  
  private loadRelatedContent(): void {
    if (!this.artisan) return;
    
    // Load related artisans from same state
    this.artisanService.getStoriesByState(this.artisan.stateCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe((artisans: ArtisanListItem[]) => {
        this.relatedArtisans = artisans.filter(a => a.id !== this.artisan?.id).slice(0, 4);
      });
  }
  
  // ==================== NAVIGATION ====================
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  
  viewProduct(productId: string): void {
    this.router.navigate(['/product_detail', productId]);
  }
  
  viewArtisan(artisan: ArtisanListItem): void {
    this.router.navigate(['/artisan-stories', artisan.slug]);
  }
  
  contactArtisan(): void {
    if (this.artisan?.vendorId) {
      this.router.navigate(['/vendor', this.artisan.vendorId], { fragment: 'contact' });
    }
  }
  
  viewVendorShop(): void {
    if (this.artisan?.vendorId) {
      this.router.navigate(['/vendor', this.artisan.vendorId]);
    }
  }
  
  // ==================== GALLERY ====================
  
  openGallery(index: number): void {
    this.selectedGalleryIndex = index;
    this.showGalleryModal = true;
    document.body.style.overflow = 'hidden';
  }
  
  closeGallery(): void {
    this.showGalleryModal = false;
    document.body.style.overflow = '';
  }
  
  nextImage(): void {
    if (this.artisan?.gallery) {
      this.selectedGalleryIndex = (this.selectedGalleryIndex + 1) % this.artisan.gallery.length;
    }
  }
  
  prevImage(): void {
    if (this.artisan?.gallery) {
      this.selectedGalleryIndex = this.selectedGalleryIndex === 0 
        ? this.artisan.gallery.length - 1 
        : this.selectedGalleryIndex - 1;
    }
  }
  
  // ==================== VIDEO ====================
  
  playVideo(url: string): void {
    this.selectedVideoUrl = url;
    this.showVideoModal = true;
    document.body.style.overflow = 'hidden';
  }
  
  closeVideo(): void {
    this.showVideoModal = false;
    this.selectedVideoUrl = '';
    document.body.style.overflow = '';
  }
  
  // ==================== SHARE ====================
  
  shareOnFacebook(): void {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareUrl)}`,
      '_blank',
      'width=600,height=400'
    );
    this.incrementShareCount();
  }
  
  shareOnTwitter(): void {
    const text = `Discover the story of ${this.artisan?.artisanName}, a master ${this.artisan?.primaryCraft} artisan from ${this.artisan?.district}, ${this.artisan?.state}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.shareUrl)}`,
      '_blank',
      'width=600,height=400'
    );
    this.incrementShareCount();
  }
  
  shareOnWhatsApp(): void {
    const text = `Check out this inspiring artisan story: ${this.artisan?.artisanName} - ${this.shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    this.incrementShareCount();
  }
  
  copyLink(): void {
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      // Show toast notification
      alert('Link copied to clipboard!');
    });
  }
  
  private incrementShareCount(): void {
    if (this.artisan) {
      this.artisanService.trackShare(this.artisan.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => console.error('Failed to track share:', err)
        });
    }
  }
  
  // ==================== HELPERS ====================
  
  getYoutubeEmbedUrl(url: string): string {
    const videoId = this.extractYoutubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  
  getSafeVideoUrl(url: string): SafeResourceUrl {
    const embedUrl = this.getYoutubeEmbedUrl(url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
  
  private extractYoutubeId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
  
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long'
    });
  }
  
  getLocationString(): string {
    if (!this.artisan) return '';
    const parts = [this.artisan.village, this.artisan.district, this.artisan.state];
    return parts.filter(p => p).join(', ');
  }
}
