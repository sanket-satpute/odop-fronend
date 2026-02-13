import { Component, OnInit } from '@angular/core';
import { VendorServiceService } from '../../project/services/vendor-service.service';
import { VendorDto } from '../../project/models/vendor';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vendor-directory-page',
  templateUrl: './vendor-directory-page.component.html',
  styleUrls: ['./vendor-directory-page.component.css']
})
export class VendorDirectoryPageComponent implements OnInit {
  searchQuery: string = '';
  selectedState: string = 'all';
  selectedCategory: string = 'all';
  sortBy: string = 'rating';
  viewMode: string = 'grid';
  isLoading: boolean = true;
  errorMessage: string = '';

  states: string[] = [
    'All States', 'Uttar Pradesh', 'Maharashtra', 'Gujarat', 'Rajasthan',
    'Tamil Nadu', 'Karnataka', 'West Bengal', 'Madhya Pradesh', 'Kerala',
    'Bihar', 'Odisha', 'Jammu & Kashmir', 'Punjab', 'Haryana'
  ];

  categories: string[] = [
    'All Categories', 'Textiles & Handloom', 'Handicrafts', 'Pottery',
    'Jewelry', 'Food & Spices', 'Art & Paintings', 'Wood Craft', 'Metal Work'
  ];

  // All vendors from API
  allVendors: VendorDto[] = [];

  get filteredVendors(): VendorDto[] {
    let result = this.allVendors.filter(vendor => {
      const searchLower = this.searchQuery.toLowerCase();
      const matchesSearch = !this.searchQuery || 
        (vendor.shoppeeName?.toLowerCase().includes(searchLower)) ||
        (vendor.businessName?.toLowerCase().includes(searchLower)) ||
        (vendor.locationDistrict?.toLowerCase().includes(searchLower)) ||
        (vendor.city?.toLowerCase().includes(searchLower)) ||
        (vendor.specializations?.some(s => s.toLowerCase().includes(searchLower)));
      
      const matchesState = this.selectedState === 'all' || 
        vendor.locationState === this.selectedState || 
        vendor.state === this.selectedState;
      
      const matchesCategory = this.selectedCategory === 'all' || 
        vendor.specializations?.some(s => 
          s.toLowerCase().includes(this.selectedCategory.toLowerCase())
        );
      
      return matchesSearch && matchesState && matchesCategory;
    });

    // Sort results
    if (this.sortBy === 'name') {
      result.sort((a, b) => (a.shoppeeName || a.businessName || '').localeCompare(b.shoppeeName || b.businessName || ''));
    } else if (this.sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (this.sortBy === 'verified') {
      result.sort((a, b) => (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0));
    }

    return result;
  }

  constructor(private vendorService: VendorServiceService, private router: Router) {}

  ngOnInit(): void {
    this.loadVendors();
  }

  loadVendors(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.vendorService.getAllVendors().subscribe({
      next: (vendors) => {
        this.allVendors = vendors;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading vendors:', error);
        this.errorMessage = 'Failed to load vendors. Please try again.';
        this.isLoading = false;
        // Load fallback data for demo
        this.loadFallbackData();
      }
    });
  }

  loadVendorsByState(state: string): void {
    if (state === 'all' || state === 'All States') {
      this.loadVendors();
      return;
    }

    this.isLoading = true;
    this.vendorService.getVendorsByState(state).subscribe({
      next: (vendors) => {
        this.allVendors = vendors;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading vendors by state:', error);
        this.isLoading = false;
      }
    });
  }

  onStateChange(): void {
    if (this.selectedState !== 'all' && this.selectedState !== 'All States') {
      this.loadVendorsByState(this.selectedState);
    } else {
      // Reset to all vendors
      this.loadVendors();
    }
  }

  visitShop(vendorId: string | undefined): void {
    if (vendorId) {
      this.router.navigate(['/shop', vendorId]);
    }
  }

  getVendorImage(vendor: VendorDto): string {
    return vendor.profilePictureUrl || 
           (vendor.shopImages && vendor.shopImages[0]) || 
           'assets/images/vendor-placeholder.jpg';
  }

  getVendorCoverImage(vendor: VendorDto): string {
    return (vendor.shopImages && vendor.shopImages[0]) || 
           'assets/images/shop-cover-placeholder.jpg';
  }

  getVendorLocation(vendor: VendorDto): string {
    const parts = [];
    if (vendor.locationDistrict || vendor.city) {
      parts.push(vendor.locationDistrict || vendor.city);
    }
    if (vendor.locationState || vendor.state) {
      parts.push(vendor.locationState || vendor.state);
    }
    return parts.join(', ') || 'Location not specified';
  }

  getVendorCategory(vendor: VendorDto): string {
    if (vendor.specializations && vendor.specializations.length > 0) {
      return vendor.specializations[0];
    }
    return 'General';
  }

  getSpecialties(vendor: VendorDto): string[] {
    return vendor.specializations || [];
  }

  retryLoad(): void {
    this.loadVendors();
  }

  // Fallback data for demo/development
  private loadFallbackData(): void {
    this.allVendors = [
      {
        vendorId: '1',
        shoppeeName: 'Banarasi Silk House',
        shopkeeperName: 'Ramesh Kumar',
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/41.jpg',
        shopImages: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'],
        locationDistrict: 'Varanasi',
        locationState: 'Uttar Pradesh',
        specializations: ['Banarasi Silk', 'Brocade', 'Zari Work'],
        shopDescription: 'Authentic Banarasi silk sarees and fabrics crafted using traditional weaving techniques.',
        isVerified: true,
        giTagCertified: true,
        createdAt: new Date()
      },
      {
        vendorId: '2',
        shoppeeName: 'Kashmir Pashmina Store',
        shopkeeperName: 'Faisal Ahmed',
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/62.jpg',
        shopImages: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600'],
        locationDistrict: 'Srinagar',
        locationState: 'Jammu & Kashmir',
        specializations: ['Pashmina Shawls', 'Cashmere', 'Hand Embroidery'],
        shopDescription: 'Premium quality Pashmina shawls and scarves made from the finest cashmere wool.',
        isVerified: true,
        giTagCertified: true,
        createdAt: new Date()
      },
      {
        vendorId: '3',
        shoppeeName: 'Jaipur Blue Pottery',
        shopkeeperName: 'Arjun Sharma',
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
        shopImages: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600'],
        locationDistrict: 'Jaipur',
        locationState: 'Rajasthan',
        specializations: ['Blue Pottery', 'Decorative Items', 'Tiles'],
        shopDescription: 'Traditional Jaipur blue pottery with unique Persian-influenced designs.',
        isVerified: true,
        giTagCertified: true,
        createdAt: new Date()
      },
      {
        vendorId: '4',
        shoppeeName: 'Madhubani Art Gallery',
        shopkeeperName: 'Anjali Devi',
        profilePictureUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
        shopImages: ['https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=600'],
        locationDistrict: 'Madhubani',
        locationState: 'Bihar',
        specializations: ['Madhubani Paintings', 'Natural Dyes', 'Canvas Art'],
        shopDescription: 'Original Madhubani paintings created by skilled local artists.',
        isVerified: true,
        giTagCertified: true,
        createdAt: new Date()
      }
    ];
  }
}

