import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product } from 'src/app/project/models/product';
import { WishlistService } from 'src/app/project/services/wishlist.service';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface QuickViewDialogData {
  product: Product;
}

@Component({
  selector: 'app-quick-view-dialog',
  templateUrl: './quick-view-dialog.component.html',
  styleUrls: ['./quick-view-dialog.component.css']
})
export class QuickViewDialogComponent implements OnInit {
  product: Product;
  selectedImage: string = '';
  quantity: number = 1;
  isInWishlist: boolean = false;
  isWishlistLoading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<QuickViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuickViewDialogData,
    private wishlistService: WishlistService,
    private userState: UserStateService,
    private snackBar: MatSnackBar
  ) {
    this.product = data.product;
  }

  ngOnInit(): void {
    this.selectedImage = this.product.productImageURL || 'assets/images/product-placeholder.svg';
    
    // Check wishlist status
    if (this.product.productId) {
      this.isInWishlist = this.wishlistService.isInWishlist(this.product.productId);
    }
  }

  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  incrementQuantity(): void {
    if (this.quantity < (this.product.productQuantity || 10)) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  toggleWishlist(): void {
    if (!this.userState.customer) {
      this.snackBar.open('Please login to add to wishlist', 'Close', { duration: 3000 });
      return;
    }

    const productId = this.product.productId;
    if (!productId) return;

    this.isWishlistLoading = true;

    if (this.isInWishlist) {
      this.wishlistService.removeFromWishlist(productId).subscribe({
        next: () => {
          this.isInWishlist = false;
          this.isWishlistLoading = false;
          this.snackBar.open('Removed from wishlist', 'Close', { duration: 2000 });
        },
        error: () => {
          this.isWishlistLoading = false;
          this.snackBar.open('Failed to update wishlist', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.wishlistService.addToWishlist(productId).subscribe({
        next: () => {
          this.isInWishlist = true;
          this.isWishlistLoading = false;
          this.snackBar.open('Added to wishlist!', 'Close', { duration: 2000 });
        },
        error: () => {
          this.isWishlistLoading = false;
          this.snackBar.open('Failed to add to wishlist', 'Close', { duration: 3000 });
        }
      });
    }
  }

  addToCart(): void {
    this.dialogRef.close('add-to-cart');
  }

  viewDetails(): void {
    this.dialogRef.close('view-details');
  }

  close(): void {
    this.dialogRef.close();
  }

  getDiscountPercent(): number {
    if (this.product.discount && this.product.price) {
      return Math.round(this.product.discount);
    }
    return 0;
  }

  isOutOfStock(): boolean {
    return (this.product.productQuantity || 0) <= 0;
  }
}
