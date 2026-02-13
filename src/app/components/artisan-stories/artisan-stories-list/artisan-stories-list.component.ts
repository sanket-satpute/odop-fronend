import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  ArtisanStoryService, 
  ArtisanListItem, 
  ArtisanFilters 
} from '../../../services/artisan-story.service';

interface ArtisanStoryFiltersLocal {
  state?: string;
  craft?: string;
  searchQuery?: string;
}

@Component({
  selector: 'app-artisan-stories-list',
  templateUrl: './artisan-stories-list.component.html',
  styleUrls: ['./artisan-stories-list.component.css']
})
export class ArtisanStoriesListComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  // Data
  artisans: ArtisanListItem[] = [];
  featuredArtisans: ArtisanListItem[] = [];
  
  // Loading states
  isLoading = true;
  isLoadingMore = false;
  hasMore = true;
  
  // Pagination
  currentPage = 0;
  pageSize = 12;
  totalArtisans = 0;
  
  // Filters
  filters: ArtisanStoryFiltersLocal = {};
  searchQuery = '';
  selectedState = '';
  selectedCraft = '';
  selectedSort = 'featured';
  
  // Filter options
  states: string[] = [];
  crafts: string[] = [];
  sortOptions = [
    { value: 'featured', label: 'Featured First' },
    { value: 'newest', label: 'Newest Stories' },
    { value: 'experience', label: 'Most Experienced' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'popular', label: 'Most Viewed' }
  ];
  
  // View state
  viewMode: 'grid' | 'list' = 'grid';
  showFilters = false;
  
  constructor(
    private artisanService: ArtisanStoryService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadFeaturedArtisans();
    this.loadArtisans();
    this.loadFilterOptions();
    this.setupSearchDebounce();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ==================== DATA LOADING ====================
  
  private loadFeaturedArtisans(): void {
    this.artisanService.getFeaturedStories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (artisans: ArtisanListItem[]) => {
          this.featuredArtisans = artisans.slice(0, 6);
        },
        error: (err: Error) => console.error('Error loading featured artisans:', err)
      });
  }
  
  private loadArtisans(append = false): void {
    if (!append) {
      this.isLoading = true;
      this.currentPage = 0;
    } else {
      this.isLoadingMore = true;
    }
    
    // Use appropriate service methods based on filters
    let observable;
    
    if (this.selectedState) {
      observable = this.artisanService.getStoriesByState(this.selectedState);
    } else if (this.selectedCraft) {
      observable = this.artisanService.getStoriesByCraft(this.selectedCraft);
    } else if (this.searchQuery) {
      observable = this.artisanService.searchStories(this.searchQuery);
    } else {
      observable = this.artisanService.getAllStories();
    }
    
    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ArtisanListItem[]) => {
          if (append) {
            this.artisans = [...this.artisans, ...response];
          } else {
            this.artisans = response;
          }
          this.totalArtisans = response.length;
          this.hasMore = false; // Simple list doesn't have pagination
          this.isLoading = false;
          this.isLoadingMore = false;
        },
        error: (err: Error) => {
          console.error('Error loading artisans:', err);
          this.isLoading = false;
          this.isLoadingMore = false;
        }
      });
  }
  
  private loadFilterOptions(): void {
    // Load filters from the service
    this.artisanService.getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: ArtisanFilters) => {
        this.states = filters.states.map(s => s.label);
        this.crafts = filters.crafts.map(c => c.label);
      });
  }
  
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((query: string) => {
        this.searchQuery = query;
        this.loadArtisans();
      });
  }
  
  // ==================== USER ACTIONS ====================
  
  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }
  
  onFilterChange(): void {
    this.loadArtisans();
  }
  
  onSortChange(): void {
    this.loadArtisans();
  }
  
  loadMore(): void {
    if (this.hasMore && !this.isLoadingMore) {
      this.currentPage++;
      this.loadArtisans(true);
    }
  }
  
  viewArtisan(artisan: ArtisanListItem): void {
    this.router.navigate(['/artisan-stories', artisan.slug]);
  }
  
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters(): void {
    this.selectedState = '';
    this.selectedCraft = '';
    this.searchQuery = '';
    this.selectedSort = 'featured';
    this.loadArtisans();
  }
  
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }
  
  // ==================== INFINITE SCROLL ====================
  
  @HostListener('window:scroll', [])
  onScroll(): void {
    const threshold = 300;
    const position = window.innerHeight + window.scrollY;
    const height = document.body.offsetHeight;
    
    if (position > height - threshold && this.hasMore && !this.isLoadingMore && !this.isLoading) {
      this.loadMore();
    }
  }
  
  // ==================== HELPERS ====================
  
  getExperienceText(years: number): string {
    if (years === 1) return '1 year experience';
    if (years < 5) return `${years} years experience`;
    if (years < 10) return `${years}+ years of mastery`;
    if (years < 20) return `${years}+ years legacy`;
    return `${years}+ years of heritage`;
  }
  
  getGenerationText(generations: number): string {
    if (generations === 1) return '1st Generation';
    if (generations === 2) return '2nd Generation';
    if (generations === 3) return '3rd Generation';
    return `${generations}th Generation`;
  }
  
  trackByArtisan(index: number, artisan: ArtisanListItem): string {
    return artisan.id;
  }
}
