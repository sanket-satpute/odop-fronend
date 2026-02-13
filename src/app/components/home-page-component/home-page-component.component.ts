import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { ProductServiceService } from 'src/app/project/services/product-service.service';
import { Product } from 'src/app/project/models/product';
import { RegisterDialogComponent } from '../dialogs/register-dialog/register-dialog.component';
import { UserStateService } from 'src/app/project/services/user-state.service';

import { CommonModule } from '@angular/common';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { RecentlyViewedComponent } from '../recently-viewed/recently-viewed.component';
import { VendorDiscoveryCardComponent } from '../vendor-discovery-card/vendor-discovery-card.component';

@Component({
  selector: 'app-home-page-component',
  templateUrl: './home-page-component.component.html',
  styleUrls: ['./home-page-component.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    SkeletonLoaderComponent,
    RecentlyViewedComponent,
    VendorDiscoveryCardComponent
  ]
})
export class HomePageComponentComponent implements OnInit, AfterViewInit {

  products: any;
  
  // Featured products from backend
  featuredProducts: Product[] = [];
  isLoadingFeatured: boolean = true;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private uservice: CustomerServiceService,
    private productService: ProductServiceService,
    public userState: UserStateService
  ) {}

  ngOnInit(): void {
    // Load featured products dynamically
    this.loadFeaturedProducts();
  }

  loadFeaturedProducts(): void {
    this.isLoadingFeatured = true;
    this.productService.getFeaturedProducts(6).subscribe({
      next: (products) => {
        this.featuredProducts = products;
        this.isLoadingFeatured = false;
        // Re-initialize animations for dynamically loaded products (or static fallback)
        setTimeout(() => this.initAnimations(), 200);
      },
      error: (err) => {
        console.error('Error loading featured products:', err);
        this.isLoadingFeatured = false;
        // Re-initialize animations for static fallback cards
        setTimeout(() => this.initAnimations(), 200);
      }
    });
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/product_detail', productId]);
  }

  ngAfterViewInit(): void {
    this.initLoadingAnimation();
    this.initScrollProgress();
    this.initNavbarScrollEffect();
    this.initAnimations();
    this.initSmoothScroll();
    this.initCounterAnimation();
    this.initProductHoverEffects();
    this.initGalleryClickEffect();
    this.initParallaxEffect();
  }

  private initLoadingAnimation(): void {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }, 1000);
    }
  }

  private initScrollProgress(): void {
    window.addEventListener('scroll', () => {
      const scrollProgress = document.getElementById('scrollProgress');
      if (!scrollProgress) return;
      const scrollTop = window.pageYOffset;
      const docHeight = document.body.offsetHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      scrollProgress.style.width = scrollPercent + '%';
    });
  }

  private initNavbarScrollEffect(): void {
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (!navbar) return;
      if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  private animationObserver: IntersectionObserver | null = null;

  private initAnimations(): void {
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    // Create observer only once
    if (!this.animationObserver) {
      this.animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, observerOptions);
    }

    // Observe all animation elements that haven't been observed yet
    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
      if (!el.classList.contains('visible') && !el.classList.contains('animation-observed')) {
        el.classList.add('animation-observed');
        this.animationObserver!.observe(el);
      }
    });
  }

  private initSmoothScroll(): void {
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(anchor => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      anchor.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  private initCounterAnimation(): void {
    const statsSection = document.querySelector('.stats');
    if (!statsSection) return;

    const statsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounters();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statsObserver.observe(statsSection);
  }

  private animateCounters(): void {
    const counters = document.querySelectorAll<HTMLElement>('.stat-number');
    counters.forEach(counter => {
      const target = counter.innerText;
      const numericTarget = parseInt(target.replace(/[^\d]/g, ''));
      const increment = numericTarget / 100;
      let current = 0;

      const updateCounter = () => {
        if (current < numericTarget) {
          current += increment;
          if (target.includes('₹')) {
            counter.innerText = '₹' + Math.ceil(current) + (target.includes('Cr') ? 'Cr+' : 'K+');
          } else {
            counter.innerText = Math.ceil(current) + '+';
          }
          requestAnimationFrame(updateCounter);
        } else {
          counter.innerText = target;
        }
      };

      updateCounter();
    });
  }

  private initProductHoverEffects(): void {
    document.querySelectorAll<HTMLElement>('.product-card').forEach(card => {
      card.addEventListener('mouseenter', function () {
        (this as HTMLElement).style.transform = 'translateY(-15px) scale(1.02)';
      });
      card.addEventListener('mouseleave', function () {
        (this as HTMLElement).style.transform = 'translateY(0) scale(1)';
      });
    });
  }

  private initGalleryClickEffect(): void {
    document.querySelectorAll<HTMLElement>('.gallery-item').forEach(item => {
      item.addEventListener('click', function () {
        (this as HTMLElement).style.transform = 'scale(0.95)';
        setTimeout(() => {
          (this as HTMLElement).style.transform = 'scale(1)';
        }, 150);
      });
    });
  }

  private initParallaxEffect(): void {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const parallax = document.querySelector<HTMLElement>('.hero');
      if (parallax) {
        const speed = scrolled * 0.5;
        parallax.style.backgroundPosition = `center ${speed}px`;
      }
    });
  }

  becomeASeller(): void {
    if (this.userState.vendor && !this.userState.customer && !this.userState.admin) {
      this.router.navigate(['/vendor-dashboard']);
      return;
    }

    const dialogRef = this.dialog.open(RegisterDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      disableClose: true,
      data: { activeTab: 'vendor' }
    });
  }

  startPrimaryJourney(): void {
    if (this.userState.vendor && !this.userState.customer && !this.userState.admin) {
      this.router.navigate(['/vendor-dashboard']);
      return;
    }

    this.router.navigate(['/products']);
  }
}
