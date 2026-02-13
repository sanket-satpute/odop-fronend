import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { VendorServiceService } from 'src/app/project/services/vendor-service.service';
import { VendorDto } from 'src/app/project/models/vendor';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface FeaturedVendor {
  id: string;
  name: string;
  shopName: string;
  location: string;
  state: string;
  specialty: string;
  image: string;
  rating: number;
  verified: boolean;
}

@Component({
  selector: 'app-vendor-discovery-card',
  templateUrl: './vendor-discovery-card.component.html',
  styleUrls: ['./vendor-discovery-card.component.css']
})
export class VendorDiscoveryCardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Featured vendors to showcase
  featuredVendors: FeaturedVendor[] = [];
  
  // Stats
  totalVendors: number = 0;
  totalStates: number = 0;
  isLoading: boolean = true;
  
  // Popular states for quick filters
  popularStates: string[] = ['Maharashtra', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Tamil Nadu'];
  
  // Selected quick filter
  selectedState: string = '';

  constructor(
    public router: Router,
    private vendorService: VendorServiceService
  ) {}

  ngOnInit(): void {
    this.loadVendorStats();
    this.loadFeaturedVendors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVendorStats(): void {
    this.vendorService.getAllVendors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vendors) => {
          this.totalVendors = vendors.length;
          // Count unique states
          const states = new Set(vendors.map(v => v.locationState).filter(s => s));
          this.totalStates = states.size;
        },
        error: (err) => {
          console.error('Error loading vendor stats:', err);
        }
      });
  }

  loadFeaturedVendors(): void {
    this.isLoading = true;
    this.vendorService.getAllVendors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vendors: VendorDto[]) => {
          // Get up to 4 featured vendors
          this.featuredVendors = vendors.slice(0, 4).map(v => this.mapToFeaturedVendor(v));
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading featured vendors:', err);
          this.isLoading = false;
        }
      });
  }

  private mapToFeaturedVendor(vendor: VendorDto): FeaturedVendor {
    return {
      id: vendor.vendorId || '',
      name: vendor.shopkeeperName || vendor.fullName || 'Artisan',
      shopName: vendor.shoppeeName || vendor.businessName || 'Traditional Crafts',
      location: vendor.locationDistrict || vendor.city || 'India',
      state: vendor.locationState || vendor.state || 'India',
      specialty: vendor.specializations?.[0] || this.getRandomSpecialty(),
      image: this.getVendorImage(vendor),
      rating: this.getRandomRating(),
      verified: vendor.isVerified || false
    };
  }

  private getVendorImage(vendor: VendorDto): string {
    // Use vendor profile picture or shop images if available
    if (vendor.profilePictureUrl) {
      return vendor.profilePictureUrl;
    }
    if (vendor.shopImages && vendor.shopImages.length > 0) {
      return vendor.shopImages[0];
    }
    // Craft-themed placeholder images
    const placeholders = [
      'assets/images/vendors/artisan-1.jpg',
      'assets/images/vendors/artisan-2.jpg',
      'assets/images/vendors/artisan-3.jpg',
      'assets/images/vendors/artisan-4.jpg'
    ];
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  }

  private getRandomSpecialty(): string {
    const specialties = [
      'Handloom Textiles', 'Pottery & Ceramics', 'Wood Carving', 
      'Metal Crafts', 'Traditional Jewelry', 'Leather Goods',
      'Bamboo Crafts', 'Embroidery', 'Stone Carving'
    ];
    return specialties[Math.floor(Math.random() * specialties.length)];
  }

  private getRandomRating(): number {
    return Math.round((4 + Math.random()) * 10) / 10; // 4.0 - 5.0
  }

  onQuickFilter(state: string): void {
    this.selectedState = state;
    // Navigate to vendor directory with state filter
    this.router.navigate(['/vendors'], { queryParams: { state: state } });
  }

  exploreAllVendors(): void {
    this.router.navigate(['/vendors']);
  }

  viewVendorShop(vendorId: string): void {
    this.router.navigate(['/vendor-shop', vendorId]);
  }
}
