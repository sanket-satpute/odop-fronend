import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { GlobalVariable } from '../global/global';

export interface Review {
  reviewId: string;
  productId: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  orderId?: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  vendorReply?: VendorReply;
  createdAt: string;
  updatedAt: string;
}

export interface VendorReply {
  reply: string;
  repliedAt: string;
}

export interface CreateReviewRequest {
  productId: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [rating: number]: number };
  verifiedPurchaseCount: number;
}

export interface ProductRating {
  productId: string;
  averageRating: number;
  reviewCount: number;
  ratingDistribution: { [rating: number]: number };
}

export interface VendorRating {
  vendorId: string;
  averageRating: number;
  reviewCount: number;
  ratingDistribution: { [rating: number]: number };
}

// Image upload response interfaces
export interface ReviewImageUploadResponse {
  success: boolean;
  uploadedCount: number;
  images: string[];
  review: Review;
}

export interface ReviewImageDeleteResponse {
  success: boolean;
  remainingImages: string[];
  review: Review;
}

// Admin review statistics
export interface AdminReviewStats {
  totalReviews: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  flaggedCount: number;
  averageRating: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'review';
  
  // Cache for product ratings
  private productRatingsCache = new Map<string, ProductRating>();

  constructor(private http: HttpClient) { }

  // ============== CREATE ==============

  /**
   * Create a new review
   */
  createReview(review: CreateReviewRequest): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/create`, review).pipe(
      tap(() => {
        // Invalidate cache for this product
        this.productRatingsCache.delete(review.productId);
      })
    );
  }

  // ============== GET REVIEWS ==============

  /**
   * Get review by ID
   */
  getReviewById(reviewId: string): Observable<Review> {
    return this.http.get<Review>(`${this.baseUrl}/get/${reviewId}`);
  }

  /**
   * Get approved reviews for a product
   */
  getProductReviews(productId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/product/${productId}`);
  }

  /**
   * Get all reviews for a product (including pending)
   */
  getAllProductReviews(productId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/product/${productId}/all`);
  }

  /**
   * Get verified purchase reviews only
   */
  getVerifiedReviews(productId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/product/${productId}/verified`);
  }

  /**
   * Get reviews by vendor
   */
  getVendorReviews(vendorId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/vendor/${vendorId}`);
  }

  /**
   * Get reviews by customer
   */
  getCustomerReviews(customerId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  /**
   * Get all reviews (Admin only)
   */
  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/all`);
  }

  // ============== RATINGS ==============

  /**
   * Get product rating statistics
   */
  getProductRating(productId: string): Observable<ProductRating> {
    return this.http.get<ProductRating>(`${this.baseUrl}/product/${productId}/rating`).pipe(
      tap(rating => this.productRatingsCache.set(productId, rating))
    );
  }

  /**
   * Get vendor rating statistics
   */
  getVendorRating(vendorId: string): Observable<VendorRating> {
    return this.http.get<VendorRating>(`${this.baseUrl}/vendor/${vendorId}/rating`);
  }

  // ============== VENDOR ACTIONS ==============

  /**
   * Add vendor reply to a review
   */
  addVendorReply(reviewId: string, reply: string): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/vendor-reply/${reviewId}`, { reply });
  }

  // ============== USER ACTIONS ==============

  /**
   * Mark review as helpful
   */
  markAsHelpful(reviewId: string): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/helpful/${reviewId}`, {});
  }

  /**
   * Mark review as not helpful
   */
  markAsNotHelpful(reviewId: string): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/not-helpful/${reviewId}`, {});
  }

  // ============== IMAGE UPLOADS ==============

  /**
   * Upload images to an existing review
   * @param reviewId - The review to add images to
   * @param images - Array of image files
   * @param customerId - Optional customer ID
   */
  uploadReviewImages(reviewId: string, images: File[], customerId?: string): Observable<ReviewImageUploadResponse> {
    const formData = new FormData();
    images.forEach(image => formData.append('images', image));
    if (customerId) {
      formData.append('customerId', customerId);
    }
    
    return this.http.post<ReviewImageUploadResponse>(`${this.baseUrl}/${reviewId}/images`, formData);
  }

  /**
   * Delete an image from a review
   * @param reviewId - The review ID
   * @param imageIndex - Index of the image to delete
   */
  deleteReviewImage(reviewId: string, imageIndex: number): Observable<ReviewImageDeleteResponse> {
    return this.http.delete<ReviewImageDeleteResponse>(`${this.baseUrl}/${reviewId}/images/${imageIndex}`);
  }

  /**
   * Create a review with images in one request
   * @param review - Review data
   * @param images - Array of image files
   */
  createReviewWithImages(review: CreateReviewRequest, images: File[]): Observable<Review> {
    const formData = new FormData();
    formData.append('review', new Blob([JSON.stringify(review)], { type: 'application/json' }));
    images.forEach(image => formData.append('images', image));
    
    return this.http.post<Review>(`${this.baseUrl}/create-with-images`, formData).pipe(
      tap(() => {
        this.productRatingsCache.delete(review.productId);
      })
    );
  }

  /**
   * Get reviews that have images for a product
   */
  getReviewsWithImages(productId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/product/${productId}/with-images`);
  }

  /**
   * Validate image before upload
   * @param file - File to validate
   * @returns Error message or null if valid
   */
  validateReviewImage(file: File): string | null {
    const maxSizeMB = 5;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP';
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }
    
    return null;
  }

  /**
   * Validate multiple images
   */
  validateReviewImages(files: File[]): { valid: File[]; errors: string[] } {
    const maxImages = 5;
    const valid: File[] = [];
    const errors: string[] = [];
    
    if (files.length > maxImages) {
      errors.push(`Maximum ${maxImages} images allowed`);
      files = files.slice(0, maxImages);
    }
    
    files.forEach((file, index) => {
      const error = this.validateReviewImage(file);
      if (error) {
        errors.push(`Image ${index + 1}: ${error}`);
      } else {
        valid.push(file);
      }
    });
    
    return { valid, errors };
  }

  // ============== DELETE ==============

  /**
   * Delete a review
   */
  deleteReview(reviewId: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/delete/${reviewId}`);
  }

  // ============== ADMIN MODERATION ENDPOINTS ==============

  /**
   * Get all pending reviews for admin moderation
   */
  getPendingReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/admin/pending`);
  }

  /**
   * Get all flagged reviews
   */
  getFlaggedReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/admin/flagged`);
  }

  /**
   * Get reviews by status (PENDING, APPROVED, REJECTED, FLAGGED)
   */
  getReviewsByStatus(status: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/admin/status/${status}`);
  }

  /**
   * Get review statistics for admin dashboard
   */
  getAdminReviewStats(): Observable<AdminReviewStats> {
    return this.http.get<AdminReviewStats>(`${this.baseUrl}/admin/stats`);
  }

  /**
   * Admin approve a review
   */
  approveReview(reviewId: string, adminId: string): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/admin/approve/${reviewId}`, { adminId });
  }

  /**
   * Admin reject a review
   */
  rejectReview(reviewId: string, adminId: string, reason: string): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/admin/reject/${reviewId}`, { adminId, reason });
  }

  /**
   * Admin flag a review
   */
  flagReview(reviewId: string, adminId: string, reason: string): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/admin/flag/${reviewId}`, { adminId, reason });
  }

  /**
   * Admin reply to a review
   */
  addAdminReply(reviewId: string, adminId: string, reply: string): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/admin/reply/${reviewId}`, { adminId, reply });
  }

  // ============== HELPER METHODS ==============

  /**
   * Get cached product rating (if available)
   */
  getCachedProductRating(productId: string): ProductRating | undefined {
    return this.productRatingsCache.get(productId);
  }

  /**
   * Clear ratings cache
   */
  clearCache(): void {
    this.productRatingsCache.clear();
  }

  /**
   * Calculate star display array
   * Returns array like [1, 1, 1, 0.5, 0] for 3.5 stars
   */
  getStarDisplay(rating: number): number[] {
    const stars: number[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(1); // Full star
      } else if (i === fullStars && hasHalfStar) {
        stars.push(0.5); // Half star
      } else {
        stars.push(0); // Empty star
      }
    }
    
    return stars;
  }

  /**
   * Format rating for display
   */
  formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  /**
   * Get rating color class
   */
  getRatingColorClass(rating: number): string {
    if (rating >= 4) return 'rating-excellent';
    if (rating >= 3) return 'rating-good';
    if (rating >= 2) return 'rating-average';
    return 'rating-poor';
  }

  /**
   * Calculate percentage for rating bar
   */
  getRatingPercentage(count: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  /**
   * Sort reviews by criteria
   */
  sortReviews(reviews: Review[], sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'): Review[] {
    const sorted = [...reviews];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      case 'helpful':
        return sorted.sort((a, b) => b.helpfulCount - a.helpfulCount);
      default:
        return sorted;
    }
  }

  /**
   * Filter reviews by rating
   */
  filterByRating(reviews: Review[], rating: number): Review[] {
    return reviews.filter(r => r.rating === rating);
  }

  /**
   * Filter verified purchase reviews
   */
  filterVerifiedPurchases(reviews: Review[]): Review[] {
    return reviews.filter(r => r.isVerifiedPurchase);
  }
}
