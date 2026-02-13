import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RecentlyViewedService } from '../../project/services/recently-viewed.service';
import { Product } from '../../project/models/product';

@Component({
  selector: 'app-recently-viewed',
  templateUrl: './recently-viewed.component.html',
  styleUrls: ['./recently-viewed.component.css']
})
export class RecentlyViewedComponent implements OnInit, OnDestroy {
  @Input() maxItems: number = 6;
  @Input() title: string = 'Recently Viewed';
  @Input() showClearButton: boolean = true;

  recentlyViewed: Product[] = [];
  private subscription!: Subscription;

  constructor(
    private recentlyViewedService: RecentlyViewedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.recentlyViewedService.recentlyViewed$.subscribe(products => {
      this.recentlyViewed = products.slice(0, this.maxItems);
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  viewProduct(productId: string | undefined): void {
    if (productId) {
      this.router.navigate(['/product_detail', productId]);
    }
  }

  clearHistory(): void {
    this.recentlyViewedService.clearHistory();
  }

  removeItem(event: Event, productId: string): void {
    event.stopPropagation();
    this.recentlyViewedService.removeProduct(productId);
  }
}
