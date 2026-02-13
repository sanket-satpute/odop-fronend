import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { 
  FestivalService, 
  FestivalCollectionResponse,
  CountdownTime 
} from '../../../services/festival.service';

@Component({
  selector: 'app-festivals-page',
  templateUrl: './festivals-page.component.html',
  styleUrls: ['./festivals-page.component.css']
})
export class FestivalsPageComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  // Data
  liveFestivals: FestivalCollectionResponse[] = [];
  upcomingFestivals: FestivalCollectionResponse[] = [];
  allFestivals: FestivalCollectionResponse[] = [];
  featuredFestival: FestivalCollectionResponse | null = null;
  
  // States
  isLoading = true;
  activeFilter = 'all';
  
  // Filter options
  festivalTypes = [
    { value: 'all', label: 'All Festivals' },
    { value: 'RELIGIOUS', label: 'Religious' },
    { value: 'SEASONAL', label: 'Seasonal' },
    { value: 'CULTURAL', label: 'Cultural' },
    { value: 'REGIONAL', label: 'Regional' },
    { value: 'NATIONAL', label: 'National' }
  ];
  
  // Countdown timers
  countdowns = new Map<string, CountdownTime>();
  
  constructor(
    private festivalService: FestivalService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadFestivals();
    this.startCountdownTimers();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ==================== DATA LOADING ====================
  
  private loadFestivals(): void {
    this.isLoading = true;
    
    // Load live festivals
    this.festivalService.getLiveFestivals()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (festivals) => {
          this.liveFestivals = festivals;
          if (festivals.length > 0) {
            this.featuredFestival = festivals[0];
          }
        },
        error: (err) => console.error('Error loading live festivals:', err)
      });
    
    // Load upcoming festivals
    this.festivalService.getUpcomingFestivals()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (festivals) => {
          this.upcomingFestivals = festivals;
        },
        error: (err) => console.error('Error loading upcoming festivals:', err)
      });
    
    // Load all festivals
    this.festivalService.getAllFestivals()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allFestivals = response.festivals;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading festivals:', err);
          this.isLoading = false;
        }
      });
  }
  
  private startCountdownTimers(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateCountdowns();
      });
  }
  
  private updateCountdowns(): void {
    const allFests = [...this.liveFestivals, ...this.upcomingFestivals];
    allFests.forEach(festival => {
      if (!festival.endDate) return;
      const endDate = new Date(festival.endDate);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      
      if (diff > 0) {
        this.countdowns.set(festival.id, {
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
          total: diff
        });
      }
    });
  }
  
  // ==================== NAVIGATION ====================
  
  viewFestival(festival: FestivalCollectionResponse): void {
    this.router.navigate(['/festivals', festival.slug]);
  }
  
  filterByType(type: string): void {
    this.activeFilter = type;
  }
  
  getFilteredFestivals(): FestivalCollectionResponse[] {
    if (this.activeFilter === 'all') {
      return this.allFestivals;
    }
    return this.allFestivals.filter(f => f.type === this.activeFilter);
  }
  
  // ==================== HELPERS ====================
  
  getCountdown(festivalId: string): CountdownTime {
    return this.countdowns.get(festivalId) || { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  isLive(festival: FestivalCollectionResponse): boolean {
    if (!festival.startDate || !festival.endDate) return festival.isLive || false;
    const now = new Date();
    const start = new Date(festival.startDate);
    const end = new Date(festival.endDate);
    return now >= start && now <= end;
  }
  
  getDaysUntil(festival: FestivalCollectionResponse): number {
    if (!festival.startDate) return festival.daysUntilFestival || 0;
    const now = new Date();
    const start = new Date(festival.startDate);
    const diff = start.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  
  getDiscountBadge(festival: FestivalCollectionResponse): string {
    if (festival.discountInfo?.percentage) {
      return `Up to ${festival.discountInfo.percentage}% OFF`;
    }
    return '';
  }
  
  trackByFestival(index: number, festival: FestivalCollectionResponse): string {
    return festival.id;
  }
}
