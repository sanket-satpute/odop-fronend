import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';

interface Promotion {
  id: string;
  title: string;
  description: string;
  discountPercentage: number;
  discountType: 'percentage' | 'flat' | 'bogo';
  originalPrice?: number;
  salePrice?: number;
  imageUrl: string;
  category: string;
  validFrom: Date;
  validUntil: Date;
  couponCode?: string;
  usageLimit?: number;
  usedCount: number;
  terms: string[];
  featured: boolean;
  products?: number;
}

interface CouponCode {
  code: string;
  discountPercentage: number;
  minOrderValue: number;
  maxDiscount: number;
  validUntil: Date;
  description: string;
  copied: boolean;
}

@Component({
  selector: 'app-promotions-and-special-offers-component',
  templateUrl: './promotions-and-special-offers-component.component.html',
  styleUrls: ['./promotions-and-special-offers-component.component.css']
})
export class PromotionsAndSpecialOffersComponentComponent implements OnInit, OnDestroy {
  activeTab: string = 'all';
  isLoading: boolean = true;
  
  // Countdown for featured deal
  featuredDealCountdown = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };
  
  private countdownSubscription?: Subscription;

  // Filter options
  categories = [
    { id: 'all', label: 'All Offers', icon: 'fa-tags' },
    { id: 'flash-sale', label: 'Flash Sale', icon: 'fa-bolt' },
    { id: 'seasonal', label: 'Seasonal', icon: 'fa-sun' },
    { id: 'clearance', label: 'Clearance', icon: 'fa-percentage' },
    { id: 'new-arrivals', label: 'New Arrivals', icon: 'fa-star' },
    { id: 'festival', label: 'Festival Special', icon: 'fa-gift' }
  ];

  // Featured promotion (hero banner)
  featuredPromotion: Promotion = {
    id: 'feat-1',
    title: 'Grand ODOP Festival Sale',
    description: 'Celebrate the spirit of Indian craftsmanship with up to 50% off on handcrafted products from across India. Limited time offer!',
    discountPercentage: 50,
    discountType: 'percentage',
    imageUrl: 'assets/images/promotions/festival-banner.jpg',
    category: 'festival',
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    couponCode: 'ODOP50',
    usedCount: 1245,
    terms: ['Valid on select products', 'Maximum discount ₹2000', 'Cannot be combined with other offers'],
    featured: true,
    products: 500
  };

  // All promotions
  promotions: Promotion[] = [
    {
      id: 'promo-1',
      title: 'Handloom Sarees Collection',
      description: 'Authentic handloom sarees from Varanasi, Kanchipuram, and Chanderi',
      discountPercentage: 40,
      discountType: 'percentage',
      originalPrice: 5999,
      salePrice: 3599,
      imageUrl: 'assets/images/products/saree.jpg',
      category: 'flash-sale',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      usedCount: 324,
      terms: ['While stocks last'],
      featured: false,
      products: 120
    },
    {
      id: 'promo-2',
      title: 'Brass & Copper Artware',
      description: 'Traditional brass and copper items from Moradabad',
      discountPercentage: 35,
      discountType: 'percentage',
      originalPrice: 2499,
      salePrice: 1624,
      imageUrl: 'assets/images/products/brass.jpg',
      category: 'seasonal',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      usedCount: 156,
      terms: ['Minimum order ₹1000'],
      featured: false,
      products: 85
    },
    {
      id: 'promo-3',
      title: 'Organic Spices Bundle',
      description: 'Farm-fresh organic spices from Kerala',
      discountPercentage: 25,
      discountType: 'percentage',
      originalPrice: 999,
      salePrice: 749,
      imageUrl: 'assets/images/products/spices.jpg',
      category: 'new-arrivals',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      usedCount: 567,
      terms: ['Free shipping included'],
      featured: false,
      products: 45
    },
    {
      id: 'promo-4',
      title: 'Blue Pottery Clearance',
      description: 'Jaipur Blue Pottery at unbelievable prices',
      discountPercentage: 60,
      discountType: 'percentage',
      originalPrice: 1999,
      salePrice: 799,
      imageUrl: 'assets/images/products/pottery.jpg',
      category: 'clearance',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      usedCount: 89,
      terms: ['Limited stock', 'No returns'],
      featured: false,
      products: 30
    },
    {
      id: 'promo-5',
      title: 'Pashmina Shawls',
      description: 'Authentic Kashmiri Pashmina with GI tag',
      discountPercentage: 30,
      discountType: 'percentage',
      originalPrice: 8999,
      salePrice: 6299,
      imageUrl: 'assets/images/products/pashmina.jpg',
      category: 'festival',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      usedCount: 203,
      terms: ['Authenticity certificate included'],
      featured: false,
      products: 50
    },
    {
      id: 'promo-6',
      title: 'Buy 1 Get 1 Free',
      description: 'On all handmade soaps and cosmetics',
      discountPercentage: 50,
      discountType: 'bogo',
      imageUrl: 'assets/images/products/soap.jpg',
      category: 'flash-sale',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      usedCount: 445,
      terms: ['Equal or lesser value free', 'Max 2 per order'],
      featured: false,
      products: 75
    },
    {
      id: 'promo-7',
      title: 'Madhubani Paintings',
      description: 'Original Bihar Madhubani art',
      discountPercentage: 20,
      discountType: 'percentage',
      originalPrice: 3499,
      salePrice: 2799,
      imageUrl: 'assets/images/products/madhubani.jpg',
      category: 'new-arrivals',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      usedCount: 78,
      terms: ['Framing available'],
      featured: false,
      products: 40
    },
    {
      id: 'promo-8',
      title: 'Terracotta Home Decor',
      description: 'Eco-friendly terracotta items',
      discountPercentage: 45,
      discountType: 'percentage',
      originalPrice: 1299,
      salePrice: 714,
      imageUrl: 'assets/images/products/terracotta.jpg',
      category: 'clearance',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      usedCount: 167,
      terms: ['Fragile items, handle with care'],
      featured: false,
      products: 60
    }
  ];

  // Coupon codes
  couponCodes: CouponCode[] = [
    {
      code: 'FIRST100',
      discountPercentage: 15,
      minOrderValue: 500,
      maxDiscount: 100,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      description: 'New user discount',
      copied: false
    },
    {
      code: 'ODOP25',
      discountPercentage: 25,
      minOrderValue: 1500,
      maxDiscount: 500,
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      description: 'Flat 25% off on orders above ₹1500',
      copied: false
    },
    {
      code: 'FREESHIP',
      discountPercentage: 0,
      minOrderValue: 999,
      maxDiscount: 150,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      description: 'Free shipping on all orders',
      copied: false
    },
    {
      code: 'CRAFT500',
      discountPercentage: 10,
      minOrderValue: 2000,
      maxDiscount: 500,
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      description: 'Save ₹500 on handicrafts',
      copied: false
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadPromotions();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  loadPromotions(): void {
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
    }, 800);
  }

  startCountdown(): void {
    this.updateCountdown();
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.updateCountdown();
    });
  }

  updateCountdown(): void {
    const now = new Date().getTime();
    const end = this.featuredPromotion.validUntil.getTime();
    const diff = end - now;

    if (diff > 0) {
      this.featuredDealCountdown.days = Math.floor(diff / (1000 * 60 * 60 * 24));
      this.featuredDealCountdown.hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.featuredDealCountdown.minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      this.featuredDealCountdown.seconds = Math.floor((diff % (1000 * 60)) / 1000);
    }
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  get filteredPromotions(): Promotion[] {
    if (this.activeTab === 'all') {
      return this.promotions;
    }
    return this.promotions.filter(p => p.category === this.activeTab);
  }

  getDaysRemaining(date: Date): number {
    const now = new Date().getTime();
    const end = new Date(date).getTime();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getProgressWidth(promo: Promotion): number {
    if (promo.usageLimit) {
      return Math.min(100, (promo.usedCount / promo.usageLimit) * 100);
    }
    return Math.min(100, promo.usedCount / 10);
  }

  copyCoupon(coupon: CouponCode): void {
    navigator.clipboard.writeText(coupon.code).then(() => {
      coupon.copied = true;
      setTimeout(() => {
        coupon.copied = false;
      }, 2000);
    });
  }

  viewPromotion(promo: Promotion): void {
    this.router.navigate(['/products'], { 
      queryParams: { 
        promotion: promo.id,
        discount: promo.discountPercentage
      }
    });
  }

  shopNow(promo: Promotion): void {
    this.router.navigate(['/products'], { 
      queryParams: { 
        category: promo.category,
        sale: true
      }
    });
  }

  viewAllDeals(): void {
    this.router.navigate(['/products'], { 
      queryParams: { sale: true }
    });
  }
}

