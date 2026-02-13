import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReviewService, Review as ApiReview, AdminReviewStats } from 'src/app/project/services/review.service';
import { VendorServiceService } from 'src/app/project/services/vendor-service.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface AdminReply {
  message: string;
  date: Date;
  adminName: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  date: Date;
  customer: Customer;
  product: Product;
  vendor: Vendor;
  flagged: boolean;
  adminReply?: AdminReply;
  status: 'positive' | 'negative' | 'neutral' | 'flagged';
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
}

interface SummaryStats {
  label: string;
  count: number;
  icon: string;
  iconClass: string;
  accentClass: string;
}

@Component({
  selector: 'app-admin-dashboard-feedback-and-reviews',
  templateUrl: './admin-dashboard-feedback-and-reviews.component.html',
  styleUrls: ['./admin-dashboard-feedback-and-reviews.component.css']
})
export class AdminDashboardFeedbackAndReviewsComponent  implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading states
  isLoadingReviews = true;
  isSubmittingReply = false;
  loadError = '';

  // API reviews storage
  apiReviews: ApiReview[] = [];
  adminStats: AdminReviewStats | null = null;

  // Current admin id (should come from auth service in real implementation)
  private currentAdminId = 'admin-001';

  // Data Properties
  reviews: Review[] = [];
  allReviews: Review[] = []; // Store all reviews for filtering
  filteredReviews: Review[] = [];
  vendors: Vendor[] = [];
  summaryStats: SummaryStats[] = [];
  
  // Filter Properties
  searchQuery: string = '';
  ratingFilter: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  vendorFilter: string = '';
  showFlaggedOnly: boolean = false;
  
  // Pagination Properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  
  // Modal Properties
  showModal: boolean = false;
  selectedReview: Review | null = null;
  replyMessage: string = '';
  
  // Utility Properties
  Math = Math;

  constructor(
    private reviewService: ReviewService,
    private vendorService: VendorServiceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadReviewsFromApi();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load reviews from API
  loadReviewsFromApi(): void {
    this.isLoadingReviews = true;
    this.loadError = '';

    // Load all reviews, vendors, and admin stats in parallel
    forkJoin({
      reviews: this.reviewService.getAllReviews(),
      vendors: this.vendorService.getAllVendors(),
      stats: this.reviewService.getAdminReviewStats()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ reviews, vendors, stats }) => {
        this.apiReviews = reviews;
        this.adminStats = stats;
        
        // Map vendors for the dropdown
        this.vendors = vendors.map((v: any) => ({
          id: v.vendorId,
          name: v.businessName || v.fullName || 'Vendor'
        }));

        // Map API reviews to local format
        this.reviews = this.mapApiReviewsToLocal(reviews, this.vendors);
        this.allReviews = [...this.reviews];
        
        this.calculateSummaryStats();
        this.applyFilters();
        this.isLoadingReviews = false;
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.loadError = 'Failed to load reviews. Please try again.';
        this.isLoadingReviews = false;
        // Initialize with empty data
        this.reviews = [];
        this.allReviews = [];
        this.calculateSummaryStats();
      }
    });
  }

  // Map API reviews to local Review interface
  mapApiReviewsToLocal(apiReviews: ApiReview[], vendors: Vendor[]): Review[] {
    return apiReviews.map(apiReview => {
      const vendor = vendors.find(v => v.id === apiReview.vendorId) || { id: apiReview.vendorId, name: 'Unknown Vendor' };
      
      return {
        id: apiReview.reviewId,
        apiReviewId: apiReview.reviewId,
        rating: apiReview.rating,
        comment: apiReview.comment,
        date: new Date(apiReview.createdAt),
        customer: {
          id: apiReview.customerId,
          name: apiReview.customerName,
          email: '',
          phone: '',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        },
        product: {
          id: apiReview.productId,
          name: apiReview.title || 'Product',
          category: 'ODOP Product',
          image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop'
        },
        vendor: vendor,
        flagged: false, // API doesn't have flagged status, could be added
        status: apiReview.rating >= 4 ? 'positive' : apiReview.rating <= 2 ? 'negative' : 'neutral',
        adminReply: undefined // Admin replies could be added to the API
      } as Review;
    });
  }

  calculateSummaryStats(): void {
    // Use stats from API if available, otherwise calculate locally
    if (this.adminStats) {
      this.summaryStats = [
        {
          label: 'Total Reviews',
          count: this.adminStats.totalReviews,
          icon: 'fas fa-comments',
          iconClass: 'total',
          accentClass: 'total'
        },
        {
          label: 'Pending Reviews',
          count: this.adminStats.pendingCount,
          icon: 'fas fa-clock',
          iconClass: 'positive',
          accentClass: 'positive'
        },
        {
          label: 'Approved Reviews',
          count: this.adminStats.approvedCount,
          icon: 'fas fa-check-circle',
          iconClass: 'positive',
          accentClass: 'positive'
        },
        {
          label: 'Flagged Reviews',
          count: this.adminStats.flaggedCount,
          icon: 'fas fa-flag',
          iconClass: 'flagged',
          accentClass: 'flagged'
        }
      ];
    } else {
      // Fallback: calculate from local data
      const reviewsToCount = this.allReviews.length > 0 ? this.allReviews : this.reviews;
      const totalReviews = reviewsToCount.length;
      const positiveReviews = reviewsToCount.filter(r => r.rating >= 4).length;
      const negativeReviews = reviewsToCount.filter(r => r.rating <= 2).length;
      const flaggedReviews = reviewsToCount.filter(r => r.flagged).length;

      this.summaryStats = [
        {
          label: 'Total Reviews',
          count: totalReviews,
          icon: 'fas fa-comments',
          iconClass: 'total',
          accentClass: 'total'
        },
        {
          label: 'Positive Feedback',
          count: positiveReviews,
          icon: 'fas fa-thumbs-up',
          iconClass: 'positive',
          accentClass: 'positive'
        },
        {
          label: 'Negative Feedback',
          count: negativeReviews,
          icon: 'fas fa-thumbs-down',
          iconClass: 'negative',
          accentClass: 'negative'
        },
        {
          label: 'Reported Reviews',
          count: flaggedReviews,
          icon: 'fas fa-flag',
          iconClass: 'flagged',
          accentClass: 'flagged'
        }
      ];
    }
  }

  // Filter Methods
  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allReviews]; // Use allReviews as source

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(review => 
        review.customer.name.toLowerCase().includes(query) ||
        review.product.name.toLowerCase().includes(query) ||
        review.vendor.name.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query)
      );
    }

    // Rating filter
    if (this.ratingFilter) {
      filtered = filtered.filter(review => review.rating === parseInt(this.ratingFilter));
    }

    // Date range filter
    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(review => review.date >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(review => review.date <= toDate);
    }

    // Vendor filter
    if (this.vendorFilter) {
      filtered = filtered.filter(review => review.vendor.id === this.vendorFilter);
    }

    // Flagged only filter
    if (this.showFlaggedOnly) {
      filtered = filtered.filter(review => review.flagged);
    }

    this.filteredReviews = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.updatePaginatedData();
  }

  // Pagination Methods
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredReviews = this.filteredReviews.slice(startIndex, endIndex);
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Star Rating Methods
  getStars(rating: number): string[] {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push('fas fa-star');
      } else {
        stars.push('far fa-star');
      }
    }
    return stars;
  }

  getStarClass(rating: number): string {
    if (rating >= 4) return 'excellent';
    if (rating >= 3) return 'good';
    if (rating >= 2) return 'average';
    return 'poor';
  }

  // Status Methods
  getStatusClass(review: Review): string {
    if (review.flagged) return 'flagged';
    if (review.rating >= 4) return 'positive';
    if (review.rating <= 2) return 'negative';
    return 'neutral';
  }

  getStatusText(review: Review): string {
    if (review.flagged) return 'Flagged';
    if (review.rating >= 4) return 'Positive';
    if (review.rating <= 2) return 'Negative';
    return 'Neutral';
  }

  // Action Methods
  viewReview(review: Review): void {
    this.selectedReview = review;
    this.showModal = true;
    this.replyMessage = '';
  }

  openReviewModal(review: Review): void {
    this.viewReview(review);
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedReview = null;
    this.replyMessage = '';
  }

  replyToReview(review: Review): void {
    this.viewReview(review);
  }

  sendReply(): void {
    if (this.replyMessage.trim() && this.selectedReview) {
      this.isSubmittingReply = true;
      
      this.reviewService.addAdminReply(
        this.selectedReview.id,
        this.currentAdminId,
        this.replyMessage.trim()
      ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedReview) => {
          const reply: AdminReply = {
            message: this.replyMessage.trim(),
            date: new Date(),
            adminName: 'Admin Team'
          };

          // Find the review in the original array and update it
          const reviewIndex = this.reviews.findIndex(r => r.id === this.selectedReview!.id);
          if (reviewIndex !== -1) {
            this.reviews[reviewIndex].adminReply = reply;
          }
          
          const allReviewIndex = this.allReviews.findIndex(r => r.id === this.selectedReview!.id);
          if (allReviewIndex !== -1) {
            this.allReviews[allReviewIndex].adminReply = reply;
          }

          this.replyMessage = '';
          this.showModal = false;
          this.isSubmittingReply = false;
          this.applyFilters();
          
          this.snackBar.open('Reply sent successfully!', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error sending reply:', error);
          this.isSubmittingReply = false;
          this.snackBar.open('Failed to send reply. Please try again.', 'Close', { duration: 3000 });
        }
      });
    }
  }

  flagReview(review: Review | null): void {
    if (!review) return;
    
    const reason = 'Flagged by admin for review';
    
    this.reviewService.flagReview(review.id, this.currentAdminId, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Toggle flagged status locally
          review.flagged = !review.flagged;
          review.status = review.flagged ? 'flagged' :
            (review.rating >= 4 ? 'positive' :
             review.rating <= 2 ? 'negative' : 'neutral');
          
          const reviewIndex = this.allReviews.findIndex(r => r.id === review.id);
          if (reviewIndex !== -1) {
            this.allReviews[reviewIndex].flagged = review.flagged;
            this.allReviews[reviewIndex].status = review.status;
          }
          
          // Refresh stats from API
          this.reviewService.getAdminReviewStats()
            .pipe(takeUntil(this.destroy$))
            .subscribe(stats => {
              this.adminStats = stats;
              this.calculateSummaryStats();
            });
          
          this.applyFilters();
          this.snackBar.open(`Review ${review.flagged ? 'flagged' : 'unflagged'} successfully!`, 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error flagging review:', error);
          this.snackBar.open('Failed to flag review. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  // deleteReview(review: Review): void {
  //   if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
  //     this.reviews = this.reviews.filter(r => r.id !== review.id);
  //     this.calculateSummaryStats();
  //     this.applyFilters();
  //     this.closeModal();
      
  //     console.log('Review deleted successfully!');
  //   }
  // }

  approveReview(review: Review | null): void {
    if (!review) return;
    
    this.reviewService.approveReview(review.id, this.currentAdminId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          review.moderationStatus = 'APPROVED';
          
          const reviewIndex = this.allReviews.findIndex(r => r.id === review.id);
          if (reviewIndex !== -1) {
            this.allReviews[reviewIndex].moderationStatus = 'APPROVED';
          }
          
          // Refresh stats from API
          this.reviewService.getAdminReviewStats()
            .pipe(takeUntil(this.destroy$))
            .subscribe(stats => {
              this.adminStats = stats;
              this.calculateSummaryStats();
            });
          
          this.applyFilters();
          this.snackBar.open('Review approved successfully!', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error approving review:', error);
          this.snackBar.open('Failed to approve review. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  rejectReview(review: Review | null, reason?: string): void {
    if (!review) return;
    
    const rejectReason = reason || 'Rejected by admin';
    
    this.reviewService.rejectReview(review.id, this.currentAdminId, rejectReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          review.moderationStatus = 'REJECTED';
          
          const reviewIndex = this.allReviews.findIndex(r => r.id === review.id);
          if (reviewIndex !== -1) {
            this.allReviews[reviewIndex].moderationStatus = 'REJECTED';
          }
          
          // Refresh stats from API
          this.reviewService.getAdminReviewStats()
            .pipe(takeUntil(this.destroy$))
            .subscribe(stats => {
              this.adminStats = stats;
              this.calculateSummaryStats();
            });
          
          this.applyFilters();
          this.snackBar.open('Review rejected successfully!', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error rejecting review:', error);
          this.snackBar.open('Failed to reject review. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  exportData(): void {
    // Implement export functionality
    const dataToExport = this.filteredReviews.map(review => ({
      'Review ID': review.id,
      'Customer Name': review.customer.name,
      'Customer Email': review.customer.email,
      'Product Name': review.product.name,
      'Vendor Name': review.vendor.name,
      'Rating': review.rating,
      'Comment': review.comment,
      'Date': review.date.toISOString().split('T')[0],
      'Status': this.getStatusText(review),
      'Flagged': review.flagged ? 'Yes' : 'No'
    }));

    // Convert to CSV format
    const csv = this.convertToCSV(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reviews_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    console.log('Data exported successfully!');
  }
  convertToCSV(data: any[]): string {
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // header row
      ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)).join(','))
    ];
    return csvRows.join('\n');
  }

  deleteReview(review: Review | null): void {
    if (!review) return;
    
    if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      this.reviewService.deleteReview(review.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.reviews = this.reviews.filter(r => r.id !== review.id);
            this.allReviews = this.allReviews.filter(r => r.id !== review.id);
            
            // Refresh stats from API
            this.reviewService.getAdminReviewStats()
              .pipe(takeUntil(this.destroy$))
              .subscribe(stats => {
                this.adminStats = stats;
                this.calculateSummaryStats();
              });
            
            this.applyFilters();
            this.closeModal();
            
            this.snackBar.open('Review deleted successfully!', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting review:', error);
            this.snackBar.open('Failed to delete review. Please try again.', 'Close', { duration: 3000 });
          }
        });
    }
  }
  // Chart Data
  chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Weekly Sales Overview'
      }
    }
  };
  chartType = 'line';
  selectedTimeRange: string = 'last7days';
  sidebarCollapsed: boolean = false;
  recentActivities = [
    {
      action: 'New customer registration completed',
      user: 'Auto-Process',
      timestamp: '10:15 AM',
      type: 'success'
    },
    {
      action: 'Payment gateway timeout detected',
      user: 'System Monitor',
      timestamp: '09:45 AM',
      type: 'warning'
    },
    {
      action: 'Database backup completed successfully',
      user: 'Auto-Process',
      timestamp: '09:30 AM',
      type: 'success'
    },
    {
      action: 'New product added to inventory',
      user: 'System',
      timestamp: '09:00 AM',
      type: 'info'
    },
  ];
  chartData = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [
      {
        label: 'Sales',
        data: [120, 150, 170, 200, 180, 220, 250],
        fill: false,
        borderColor: '#42A5F5',
        tension: 0.1
      }
    ]
  };
  chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  chartDataset = [{
    label: 'Sales',
    data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
    borderColor: '#FFA500',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    tension: 0.4
  }];
}