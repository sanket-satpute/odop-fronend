import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  CraftCategoryService, 
  CraftCategoryResponse, 
  CategoryTreeResponse,
  CategoryStatistics 
} from '../../../services/craft-category.service';

@Component({
  selector: 'app-craft-categories-browser',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './craft-categories-browser.component.html',
  styleUrls: ['./craft-categories-browser.component.css']
})
export class CraftCategoriesBrowserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data
  categoryTree: CategoryTreeResponse | null = null;
  rootCategories: CraftCategoryResponse[] = [];
  featuredCategories: CraftCategoryResponse[] = [];
  selectedCategory: CraftCategoryResponse | null = null;
  breadcrumb: CraftCategoryResponse[] = [];
  statistics: CategoryStatistics | null = null;
  searchResults: CraftCategoryResponse[] = [];

  // UI State
  isLoading = true;
  isSearching = false;
  searchQuery = '';
  viewMode: 'grid' | 'tree' = 'grid';
  expandedCategories: Set<string> = new Set();
  selectedState = '';
  showFilters = false;

  // Filter Options
  states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  constructor(
    private categoryService: CraftCategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.setupSubscriptions();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.isLoading = true;

    // Load featured categories
    this.categoryService.getFeaturedCategories().subscribe({
      next: (categories) => this.featuredCategories = categories,
      error: (err) => console.error('Error loading featured categories:', err)
    });

    // Load category tree
    this.categoryService.getCategoryTree().subscribe({
      next: (tree) => {
        this.categoryTree = tree;
        this.rootCategories = tree.categories || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading category tree:', err);
        this.isLoading = false;
      }
    });

    // Load statistics
    this.categoryService.getCategoryStatistics().subscribe({
      next: (stats) => this.statistics = stats,
      error: (err) => console.error('Error loading statistics:', err)
    });
  }

  private setupSubscriptions(): void {
    this.categoryService.selectedCategory$
      .pipe(takeUntil(this.destroy$))
      .subscribe(category => this.selectedCategory = category);

    this.categoryService.breadcrumb$
      .pipe(takeUntil(this.destroy$))
      .subscribe(breadcrumb => this.breadcrumb = breadcrumb);
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query.length >= 2) {
        this.performSearch(query);
      } else {
        this.searchResults = [];
        this.isSearching = false;
      }
    });
  }

  // ==================== Search ====================

  onSearchInput(): void {
    this.isSearching = this.searchQuery.length >= 2;
    this.searchSubject.next(this.searchQuery);
  }

  private performSearch(query: string): void {
    this.categoryService.searchCategories(query).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isSearching = false;
      },
      error: () => this.isSearching = false
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearching = false;
  }

  // ==================== Navigation ====================

  selectCategory(category: CraftCategoryResponse): void {
    this.categoryService.selectCategory(category);
    
    // If category has children, expand it in tree view
    if (category.children && category.children.length > 0) {
      this.toggleExpand(category);
    }
    
    // Navigate to product listing with this category
    this.router.navigate(['/product_listing'], {
      queryParams: { category: category.slug }
    });
  }

  navigateToBreadcrumb(category: CraftCategoryResponse, index: number): void {
    this.categoryService.selectCategory(category);
    // Update breadcrumb to only include up to clicked item
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
  }

  goHome(): void {
    this.categoryService.selectCategory(null);
    this.breadcrumb = [];
    this.selectedCategory = null;
  }

  // ==================== Tree View ====================

  toggleExpand(category: CraftCategoryResponse): void {
    if (this.expandedCategories.has(category.id)) {
      this.expandedCategories.delete(category.id);
    } else {
      this.expandedCategories.add(category.id);
    }
  }

  isExpanded(category: CraftCategoryResponse): boolean {
    return this.expandedCategories.has(category.id);
  }

  hasChildren(category: CraftCategoryResponse): boolean {
    return !!(category.children && category.children.length > 0);
  }

  // ==================== Filtering ====================

  filterByState(state: string): void {
    this.selectedState = state;
    if (state) {
      this.categoryService.getCategoriesByState(state).subscribe({
        next: (categories) => {
          this.rootCategories = categories;
        }
      });
    } else {
      // Reset to full tree
      if (this.categoryTree) {
        this.rootCategories = this.categoryTree.categories;
      }
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // ==================== View Mode ====================

  setViewMode(mode: 'grid' | 'tree'): void {
    this.viewMode = mode;
  }

  // ==================== Helpers ====================

  getCategoryIcon(category: CraftCategoryResponse): string {
    return this.categoryService.getCategoryIcon(category.iconName || 'default');
  }

  getProductCountText(count: number): string {
    if (count === 0) return 'No products';
    if (count === 1) return '1 product';
    return `${count.toLocaleString()} products`;
  }

  getArtisanCountText(count: number): string {
    if (count === 0) return 'No artisans';
    if (count === 1) return '1 artisan';
    return `${count.toLocaleString()} artisans`;
  }

  trackByCategoryId(index: number, category: CraftCategoryResponse): string {
    return category.id;
  }

  getCategoryGradient(category: CraftCategoryResponse): string {
    const color = category.themeColor || '#FF6B35';
    return `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`;
  }
}
