import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReviewService, Review as ApiReview, VendorRating } from 'src/app/project/services/review.service';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Customer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isVerified: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
}

interface SentimentTag {
  label: string;
  type: 'positive' | 'negative' | 'neutral';
  icon: string;
}

interface Reply {
  id: string;
  text: string;
  createdAt: Date;
  author: string;
}

interface Review {
  id: string;
  customer: Customer;
  product: Product;
  rating: number;
  text: string;
  createdAt: Date;
  purchaseDate: Date;
  sentimentTags: SentimentTag[];
  status: 'pending' | 'replied' | 'addressed';
  reply?: Reply;
  replies?: Reply[];
  expanded?: boolean;
  isAddressed: boolean;
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  pendingReplies: number;
  satisfactionRate: number;
}

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

@Component({
  selector: 'app-vendor-dashboard-feedack-and-review',
  templateUrl: './vendor-dashboard-feedack-and-review.component.html',
  styleUrls: ['./vendor-dashboard-feedack-and-review.component.css']
})
export class VendorDashboardFeedackAndReviewComponent  implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Loading states
  isLoadingReviews = true;
  isSubmittingReply = false;
  loadError = '';
  
  // Vendor info
  vendorId = '';
  vendorRating: VendorRating | null = null;

  // Component properties
  reviews: Review[] = [];
  apiReviews: ApiReview[] = []; // Raw reviews from API
  filteredReviews: Review[] = [];
  stats: Stats = {
    totalReviews: 0,
    averageRating: 0,
    pendingReplies: 0,
    satisfactionRate: 0
  };
  sentimentData: SentimentData = {
    positive: 68,
    neutral: 22,
    negative: 10
  };

  // Filter properties
  searchTerm: string = '';
  selectedRating: string = '';
  selectedDateRange: string = '';
  selectedStatus: string = '';

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;
  totalReviews: number = 0;
  totalPages: number = 0;
  Math = Math;

  // Modal properties
  showReplyDialog: boolean = false;
  selectedReview: Review | null = null;
  replyText: string = '';

  constructor(
    private reviewService: ReviewService,
    private userStateService: UserStateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeVendor();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Initialize vendor and load reviews
  initializeVendor(): void {
    const currentUser = this.userStateService.getCurrentUser() as any;
    if (currentUser?.vendorId) {
      this.vendorId = currentUser.vendorId;
      this.loadReviewsFromApi();
      this.loadVendorRating();
    } else {
      this.loadError = 'Vendor not found. Please login again.';
      this.isLoadingReviews = false;
    }
  }

  // Load reviews from API
  loadReviewsFromApi(): void {
    if (!this.vendorId) return;

    this.isLoadingReviews = true;
    this.loadError = '';

    this.reviewService.getVendorReviews(this.vendorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apiReviews) => {
          this.apiReviews = apiReviews;
          this.reviews = this.mapApiReviewsToLocal(apiReviews);
          this.filteredReviews = [...this.reviews];
          this.totalReviews = this.reviews.length;
          this.totalPages = Math.ceil(this.totalReviews / this.pageSize);
          this.calculateStats();
          this.updatePaginatedReviews();
          this.isLoadingReviews = false;
        },
        error: (error) => {
          console.error('Error loading reviews:', error);
          this.loadError = 'Failed to load reviews. Please try again.';
          this.isLoadingReviews = false;
          // Fall back to empty array
          this.reviews = [];
          this.filteredReviews = [];
        }
      });
  }

  // Load vendor rating
  loadVendorRating(): void {
    if (!this.vendorId) return;

    this.reviewService.getVendorRating(this.vendorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rating) => {
          this.vendorRating = rating;
        },
        error: (error) => {
          console.error('Error loading vendor rating:', error);
        }
      });
  }

  // Map API reviews to local Review interface
  mapApiReviewsToLocal(apiReviews: ApiReview[]): Review[] {
    return apiReviews.map(apiReview => ({
      id: apiReview.reviewId,
      customer: {
        id: apiReview.customerId,
        name: apiReview.customerName,
        email: '',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        isVerified: apiReview.isVerifiedPurchase
      },
      product: {
        id: apiReview.productId,
        name: apiReview.title || 'Product',
        category: 'ODOP Product',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop'
      },
      rating: apiReview.rating,
      text: apiReview.comment,
      createdAt: new Date(apiReview.createdAt),
      purchaseDate: new Date(apiReview.createdAt),
      sentimentTags: this.generateSentimentTags(apiReview.rating),
      status: apiReview.vendorReply ? 'replied' : 'pending',
      reply: apiReview.vendorReply ? {
        id: '1',
        text: apiReview.vendorReply.reply,
        createdAt: new Date(apiReview.vendorReply.repliedAt),
        author: 'Vendor Team'
      } : undefined,
      replies: apiReview.vendorReply ? [{
        id: '1',
        text: apiReview.vendorReply.reply,
        createdAt: new Date(apiReview.vendorReply.repliedAt),
        author: 'Vendor Team'
      }] : [],
      isAddressed: !!apiReview.vendorReply,
      apiReviewId: apiReview.reviewId // Keep reference to API review
    }));
  }

  // Generate sentiment tags based on rating
  generateSentimentTags(rating: number): SentimentTag[] {
    if (rating >= 4) {
      return [
        { label: 'Positive', type: 'positive', icon: '👍' },
        { label: 'Satisfied', type: 'positive', icon: '😊' }
      ];
    } else if (rating >= 3) {
      return [
        { label: 'Average', type: 'neutral', icon: '🤷' }
      ];
    } else {
      return [
        { label: 'Needs Attention', type: 'negative', icon: '⚠️' }
      ];
    }
  }

  // Calculate statistics
  calculateStats(): void {
    const totalReviews = this.reviews.length;
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews) : 0;
    const pendingReplies = this.reviews.filter(review => review.status === 'pending').length;
    const positiveReviews = this.reviews.filter(review => review.rating >= 4).length;
    const satisfactionRate = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 0;

    this.stats = {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      pendingReplies,
      satisfactionRate
    };
  }

  // Filter methods
  onSearch(): void {
    this.applyFilters();
  }

  onRatingFilter(): void {
    this.applyFilters();
  }
  onDateRangeFilter(): void {
    this.applyFilters();
  }
  onStatusFilter(): void {
    this.applyFilters();
  }
  applyFilters(): void {
    this.filteredReviews = this.reviews.filter(review => {
      const matchesSearch = review.text.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRating = this.selectedRating ? review.rating === parseInt(this.selectedRating) : true;
      const matchesDateRange = this.selectedDateRange ? this.isWithinDateRange(review.createdAt, this.selectedDateRange) : true;
      const matchesStatus = this.selectedStatus ? review.status === this.selectedStatus : true;

      return matchesSearch && matchesRating && matchesDateRange && matchesStatus;
    });

    this.totalReviews = this.filteredReviews.length;
    this.totalPages = Math.ceil(this.totalReviews / this.pageSize);
    this.currentPage = 1; // Reset to first page after filtering
    this.updatePaginatedReviews();
  }
  isWithinDateRange(date: Date, range: string): boolean {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (range) {
      case 'last7days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = today;
        break;
      case 'last30days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = today;
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        return true; // No date range selected
    }

    return date >= startDate && date <= endDate;
  }
  // Pagination methods
  updatePaginatedReviews(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredReviews = this.filteredReviews.slice(startIndex, endIndex);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePaginatedReviews();
  }

  // Submit reply to review via API
  submitReply(): void {
    if (!this.selectedReview || !this.replyText.trim()) {
      this.snackBar.open('Please enter a reply', 'Close', { duration: 3000 });
      return;
    }

    const reviewId = (this.selectedReview as any).apiReviewId || this.selectedReview.id;
    this.isSubmittingReply = true;

    this.reviewService.addVendorReply(reviewId, this.replyText.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedReview) => {
          // Update the local review with the reply
          const reply: Reply = {
            id: (Math.random() * 10000).toFixed(0),
            text: this.replyText.trim(),
            createdAt: new Date(),
            author: 'Vendor Team'
          };
          
          if (!this.selectedReview!.replies) {
            this.selectedReview!.replies = [];
          }
          this.selectedReview!.replies.push(reply);
          this.selectedReview!.reply = reply;
          this.selectedReview!.status = 'replied';
          this.selectedReview!.isAddressed = true;
          
          this.isSubmittingReply = false;
          this.snackBar.open('Reply submitted successfully!', 'Close', { duration: 3000 });
          this.closeReplyDialog();
          this.calculateStats();
        },
        error: (error) => {
          console.error('Error submitting reply:', error);
          this.isSubmittingReply = false;
          this.snackBar.open(error.error?.message || 'Failed to submit reply. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  closeReplyDialog(): void {
    this.showReplyDialog = false;
    this.selectedReview = null;
    this.replyText = '';
  }
  toggleReviewExpansion(review: Review): void {
    review.expanded = !review.expanded;
  }
  getActivityIcon(activityType: string): string {
    switch (activityType) {
      case 'order':
        return 'fa-shopping-cart';
      case 'review':
        return 'fa-star';
      case 'stock':
        return 'fa-box';
      default:
        return 'fa-info-circle';
    }
  }
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'replied':
        return 'blue';
      case 'addressed':
        return 'green';
      default:
        return 'gray';
    }
  }
  getSentimentIcon(sentiment: 'positive' | 'negative' | 'neutral'): string {
    switch (sentiment) {
      case 'positive':
        return 'fa-thumbs-up';
      case 'negative':
        return 'fa-thumbs-down';
      case 'neutral':
        return 'fa-meh';
      default:
        return 'fa-question';
    }
  }

  trackByReviewId(index: number, review: any): any {
    return review && review.id ? review.id : index;
  }

  getStarArray(rating: number): number[] {
  return [1, 2, 3, 4, 5];
}
openReplyDialog(review: any): void {
  this.selectedReview = review;
  this.replyText = '';
  this.showReplyDialog = true;
}

viewFullReview(review: any): void {
  // You can implement your logic here, e.g., open a modal or navigate to a detail page
  // For now, we'll just log the review to the console
  console.log('View full review:', review);
}

markAsAddressed(review: any): void {
  review.isAddressed = true;
  review.status = 'addressed';
  // Optionally, update the backend or emit an event here
}

// Add this method to handle previous page navigation
previousPage(): void {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.updateReviewsPage();
  }
}

getPageNumbers(): number[] {
  const pages: number[] = [];
  for (let i = 1; i <= this.totalPages; i++) {
    pages.push(i);
  }
  return pages;
}

// Navigates to the selected page number
goToPage(page: number): void {
  if (page >= 1 && page <= this.totalPages) {
    this.currentPage = page;
    this.updatePaginatedReviews(); // Update the displayed reviews for the current page
  }
}

// Add this method to handle pagination
nextPage(): void {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.updateReviewsPage();
  }
}

// Make sure you have a method to update the displayed reviews when the page changes
updateReviewsPage(): void {
  // Implement logic to update filteredReviews based on currentPage and pageSize
  // Example:
  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;
  this.filteredReviews = this.reviews.slice(start, end);
}
}