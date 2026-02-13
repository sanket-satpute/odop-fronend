import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Review {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  date: Date;
  productId?: string;
  productName?: string;
  productImage?: string;
  helpful: number;
  images?: string[];
  vendorReply?: {
    message: string;
    date: Date;
  };
  verified: boolean;
}

interface RatingBreakdown {
  star: number;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-vendor-reviews',
  templateUrl: './vendor-reviews.component.html',
  styleUrls: ['./vendor-reviews.component.css']
})
export class VendorReviewsComponent implements OnInit {

  @Input() vendorId: string = '';
  @Input() vendorName: string = 'ODOP Artisan Store';

  isLoading = true;
  
  // Rating Stats
  averageRating = 4.5;
  totalReviews = 247;
  ratingBreakdown: RatingBreakdown[] = [
    { star: 5, count: 156, percentage: 63 },
    { star: 4, count: 52, percentage: 21 },
    { star: 3, count: 22, percentage: 9 },
    { star: 2, count: 10, percentage: 4 },
    { star: 1, count: 7, percentage: 3 }
  ];

  // Filters
  selectedRating: number | null = null;
  selectedSort: string = 'recent';
  searchQuery: string = '';

  // Reviews
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  displayedReviews: Review[] = [];
  currentPage = 1;
  reviewsPerPage = 5;

  // Write Review
  showWriteReview = false;
  newReview = {
    rating: 0,
    title: '',
    comment: '',
    images: [] as string[]
  };
  hoverRating = 0;

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    
    // Sample reviews data
    this.reviews = [
      {
        id: '1',
        customerId: 'c1',
        customerName: 'Priya Sharma',
        customerAvatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=FFA500&color=fff',
        rating: 5,
        title: 'Absolutely Beautiful Craftsmanship!',
        comment: 'I ordered a Banarasi silk saree and it exceeded all expectations. The intricate zari work is stunning and the quality of the silk is exceptional. The vendor shipped it carefully with beautiful packaging. Will definitely order again!',
        date: new Date('2024-01-10'),
        productName: 'Banarasi Silk Saree',
        productImage: 'assets/images/product-placeholder.svg',
        helpful: 24,
        images: ['assets/images/product-placeholder.svg'],
        verified: true
      },
      {
        id: '2',
        customerId: 'c2',
        customerName: 'Rajesh Kumar',
        rating: 4,
        title: 'Great Quality, Slight Delay in Shipping',
        comment: 'The brass lamp I ordered is beautifully crafted with amazing attention to detail. However, shipping took a week longer than expected. The vendor was communicative about the delay though.',
        date: new Date('2024-01-05'),
        productName: 'Brass Handicraft Lamp',
        helpful: 12,
        vendorReply: {
          message: 'Thank you for your feedback, Rajesh! We apologize for the delay - we were sourcing the best materials for your order. We\'re glad you love the lamp!',
          date: new Date('2024-01-06')
        },
        verified: true
      },
      {
        id: '3',
        customerId: 'c3',
        customerName: 'Anita Desai',
        customerAvatar: 'https://ui-avatars.com/api/?name=Anita+Desai&background=10b981&color=fff',
        rating: 5,
        title: 'Supporting Local Artisans Never Felt Better',
        comment: 'Ordered a set of Madhubani paintings. The artwork is authentic and the colors are vibrant. What I loved most is knowing my purchase directly supports traditional artists. The packaging was eco-friendly too!',
        date: new Date('2024-01-02'),
        productName: 'Madhubani Painting Set',
        helpful: 31,
        images: ['assets/images/product-placeholder.svg', 'assets/images/product-placeholder.svg'],
        verified: true
      },
      {
        id: '4',
        customerId: 'c4',
        customerName: 'Mohammed Ali',
        rating: 3,
        title: 'Good Product, Average Service',
        comment: 'The Pashmina shawl quality is decent but not as soft as I expected. Customer service response was slow when I had queries.',
        date: new Date('2023-12-28'),
        productName: 'Pashmina Shawl',
        helpful: 5,
        verified: false
      },
      {
        id: '5',
        customerId: 'c5',
        customerName: 'Sneha Patel',
        customerAvatar: 'https://ui-avatars.com/api/?name=Sneha+Patel&background=8b5cf6&color=fff',
        rating: 5,
        title: 'Perfect Gift for My Mother',
        comment: 'Bought a beautiful Kanjivaram saree for my mother\'s birthday. She absolutely loved it! The gold work is intricate and the silk is pure. Worth every rupee spent. Thank you for preserving our heritage!',
        date: new Date('2023-12-20'),
        productName: 'Kanjivaram Silk Saree',
        helpful: 18,
        verified: true
      },
      {
        id: '6',
        customerId: 'c6',
        customerName: 'Vikram Singh',
        rating: 2,
        title: 'Color Different from Photos',
        comment: 'The terracotta pot I received was a different shade than shown in the pictures. Disappointing as I had specific color requirements.',
        date: new Date('2023-12-15'),
        productName: 'Terracotta Planter',
        helpful: 8,
        vendorReply: {
          message: 'We apologize for the color mismatch, Vikram. Handmade products may have slight variations. We\'d like to offer you a replacement or refund. Please contact our support team.',
          date: new Date('2023-12-16')
        },
        verified: true
      }
    ];

    this.applyFilters();
    this.isLoading = false;
  }

  applyFilters(): void {
    let filtered = [...this.reviews];

    // Filter by rating
    if (this.selectedRating !== null) {
      filtered = filtered.filter(r => r.rating === this.selectedRating);
    }

    // Filter by search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.comment.toLowerCase().includes(query) ||
        r.customerName.toLowerCase().includes(query) ||
        (r.productName && r.productName.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (this.selectedSort) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        filtered.sort((a, b) => b.helpful - a.helpful);
        break;
    }

    this.filteredReviews = filtered;
    this.currentPage = 1;
    this.updateDisplayedReviews();
  }

  updateDisplayedReviews(): void {
    const endIndex = this.currentPage * this.reviewsPerPage;
    this.displayedReviews = this.filteredReviews.slice(0, endIndex);
  }

  filterByRating(star: number | null): void {
    this.selectedRating = this.selectedRating === star ? null : star;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  loadMoreReviews(): void {
    this.currentPage++;
    this.updateDisplayedReviews();
  }

  get canLoadMore(): boolean {
    return this.displayedReviews.length < this.filteredReviews.length;
  }

  // Star rating helpers
  getStarArray(rating: number): number[] {
    return [1, 2, 3, 4, 5].map(star => {
      if (star <= Math.floor(rating)) return 1;
      if (star - rating < 1 && star - rating > 0) return 0.5;
      return 0;
    });
  }

  setNewRating(rating: number): void {
    this.newReview.rating = rating;
  }

  setHoverRating(rating: number): void {
    this.hoverRating = rating;
  }

  markHelpful(review: Review): void {
    review.helpful++;
    this.snackBar.open('Thanks for your feedback!', 'Close', { duration: 2000 });
  }

  reportReview(review: Review): void {
    this.snackBar.open('Review reported. We\'ll look into it.', 'Close', { duration: 3000 });
  }

  toggleWriteReview(): void {
    this.showWriteReview = !this.showWriteReview;
    if (this.showWriteReview) {
      this.resetNewReview();
    }
  }

  resetNewReview(): void {
    this.newReview = {
      rating: 0,
      title: '',
      comment: '',
      images: []
    };
    this.hoverRating = 0;
  }

  submitReview(): void {
    if (this.newReview.rating === 0) {
      this.snackBar.open('Please select a rating', 'Close', { duration: 2000 });
      return;
    }
    if (!this.newReview.title.trim() || !this.newReview.comment.trim()) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 2000 });
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      customerId: 'current-user',
      customerName: 'You',
      rating: this.newReview.rating,
      title: this.newReview.title,
      comment: this.newReview.comment,
      date: new Date(),
      helpful: 0,
      images: this.newReview.images,
      verified: true
    };

    this.reviews.unshift(review);
    this.applyFilters();
    this.showWriteReview = false;
    this.resetNewReview();
    
    // Update stats
    this.totalReviews++;
    this.recalculateStats();

    this.snackBar.open('Thank you for your review!', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  recalculateStats(): void {
    const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.averageRating = Math.round((totalRating / this.reviews.length) * 10) / 10;
    
    // Recalculate breakdown
    this.ratingBreakdown = [5, 4, 3, 2, 1].map(star => {
      const count = this.reviews.filter(r => r.rating === star).length;
      return {
        star,
        count,
        percentage: Math.round((count / this.reviews.length) * 100)
      };
    });
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }
}
