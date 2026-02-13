import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GovernmentSchemeService, SchemeListItem, SchemesOverview, SchemeFilters } from '../../../services/government-scheme.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

interface GovernmentScheme {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  ministry: string;
  department: string;
  schemeType: string;
  benefitType: string;
  thumbnailUrl: string;
  bannerUrl: string;
  eligibilityCriteria: EligibilityCriteria;
  benefits: Benefit[];
  applicationProcess: string[];
  documents: string[];
  deadline: Date | null;
  isActive: boolean;
  regions: string[];
  targetAudience: string[];
  maxBenefitAmount: number;
  successStories: number;
  applicationsReceived: number;
  launchDate: Date;
}

interface EligibilityCriteria {
  minAge: number;
  maxAge: number;
  gender: string[];
  artisanTypes: string[];
  incomeLimit: number;
  regions: string[];
  experience: number;
  otherCriteria: string[];
}

interface Benefit {
  title: string;
  description: string;
  amount: number;
  type: string;
}

@Component({
  selector: 'app-government-schemes-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './government-schemes-list.component.html',
  styleUrls: ['./government-schemes-list.component.css']
})
export class GovernmentSchemesListComponent implements OnInit, OnDestroy {
  schemes: GovernmentScheme[] = [];
  filteredSchemes: GovernmentScheme[] = [];
  featuredSchemes: GovernmentScheme[] = [];
  isLoading = true;
  
  // Search
  searchQuery = '';
  private searchSubject = new Subject<string>();
  
  // Filters
  selectedSchemeType: string = '';
  selectedBenefitType: string = '';
  selectedMinistry: string = '';
  selectedRegion: string = '';
  showActiveOnly = true;
  
  schemeTypes = [
    { value: '', label: 'All Scheme Types' },
    { value: 'FINANCIAL', label: 'Financial Assistance' },
    { value: 'TRAINING', label: 'Training & Skill Development' },
    { value: 'MARKETING', label: 'Marketing Support' },
    { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
    { value: 'CREDIT', label: 'Credit & Loan' },
    { value: 'INSURANCE', label: 'Insurance & Welfare' },
    { value: 'RECOGNITION', label: 'Recognition & Awards' }
  ];
  
  benefitTypes = [
    { value: '', label: 'All Benefit Types' },
    { value: 'SUBSIDY', label: 'Subsidy' },
    { value: 'GRANT', label: 'Grant' },
    { value: 'LOAN', label: 'Loan' },
    { value: 'INTEREST_SUBVENTION', label: 'Interest Subvention' },
    { value: 'TRAINING', label: 'Free Training' },
    { value: 'EQUIPMENT', label: 'Equipment Support' },
    { value: 'MARKET_ACCESS', label: 'Market Access' }
  ];
  
  ministries: string[] = [];
  regions: string[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 9;
  totalSchemes = 0;
  
  // Stats
  stats = {
    totalSchemes: 0,
    activeSchemes: 0,
    totalBeneficiaries: 0,
    totalDisbursed: 0
  };
  
  private destroy$ = new Subject<void>();

  constructor(
    private schemeService: GovernmentSchemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSchemes();
    this.loadFeaturedSchemes();
    this.loadStats();
    this.loadFiltersData();
    
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery = query;
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSchemes(): void {
    this.isLoading = true;
    
    this.schemeService.getAllSchemes().subscribe({
      next: (schemes: SchemeListItem[]) => {
        this.schemes = schemes.map(s => this.mapToLocalScheme(s));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Error loading schemes:', err);
        this.isLoading = false;
      }
    });
  }

  private mapToLocalScheme(s: SchemeListItem): GovernmentScheme {
    return {
      id: parseInt(s.id) || 0,
      name: s.name,
      slug: s.slug,
      description: s.description || '',
      shortDescription: s.tagline || '',
      ministry: s.ministry || '',
      department: '',
      schemeType: s.type || '',
      benefitType: s.type || '',
      thumbnailUrl: s.thumbnailUrl || '',
      bannerUrl: s.logoUrl || '',
      eligibilityCriteria: {
        minAge: 0,
        maxAge: 100,
        gender: [],
        artisanTypes: s.targetBeneficiaryNames || [],
        incomeLimit: 0,
        regions: [],
        experience: 0,
        otherCriteria: []
      },
      benefits: [],
      applicationProcess: [],
      documents: [],
      deadline: null,
      isActive: s.openForApplications || false,
      regions: s.panIndiaScheme ? ['All India'] : [],
      targetAudience: s.targetBeneficiaryNames || [],
      maxBenefitAmount: parseFloat(s.maxFundingAmount?.replace(/[^0-9.]/g, '') || '0') || 0,
      successStories: 0,
      applicationsReceived: 0,
      launchDate: new Date()
    };
  }

  loadFeaturedSchemes(): void {
    this.schemeService.getFeaturedSchemes().subscribe({
      next: (schemes: SchemeListItem[]) => {
        this.featuredSchemes = schemes.slice(0, 3).map(s => this.mapToLocalScheme(s));
      },
      error: (err: Error) => {
        console.error('Error loading featured schemes:', err);
      }
    });
  }

  loadStats(): void {
    this.schemeService.getOverview().subscribe({
      next: (overview: SchemesOverview) => {
        this.stats = {
          totalSchemes: overview.totalSchemes,
          activeSchemes: overview.activeSchemes,
          totalBeneficiaries: 0,
          totalDisbursed: 0
        };
      },
      error: (err: Error) => {
        console.error('Error loading stats:', err);
      }
    });
  }

  loadFiltersData(): void {
    // Load filters from service
    this.schemeService.getFilters().subscribe({
      next: (filters: SchemeFilters) => {
        this.ministries = filters.categories?.map(c => c.label) || [];
        this.regions = filters.states?.map(s => s.label) || [];
      }
    });
  }

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  applyFilters(): void {
    let filtered = [...this.schemes];
    
    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(scheme =>
        scheme.name.toLowerCase().includes(query) ||
        scheme.description.toLowerCase().includes(query) ||
        scheme.ministry.toLowerCase().includes(query) ||
        scheme.department.toLowerCase().includes(query)
      );
    }
    
    // Scheme type filter
    if (this.selectedSchemeType) {
      filtered = filtered.filter(s => s.schemeType === this.selectedSchemeType);
    }
    
    // Benefit type filter
    if (this.selectedBenefitType) {
      filtered = filtered.filter(s => s.benefitType === this.selectedBenefitType);
    }
    
    // Ministry filter
    if (this.selectedMinistry) {
      filtered = filtered.filter(s => s.ministry === this.selectedMinistry);
    }
    
    // Region filter
    if (this.selectedRegion) {
      filtered = filtered.filter(s => 
        s.regions.includes(this.selectedRegion) || s.regions.includes('All India')
      );
    }
    
    // Active only filter
    if (this.showActiveOnly) {
      filtered = filtered.filter(s => s.isActive);
    }
    
    this.totalSchemes = filtered.length;
    this.filteredSchemes = filtered;
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedSchemeType = '';
    this.selectedBenefitType = '';
    this.selectedMinistry = '';
    this.selectedRegion = '';
    this.showActiveOnly = true;
    this.applyFilters();
  }

  getPagedSchemes(): GovernmentScheme[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredSchemes.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalSchemes / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      window.scrollTo({ top: 500, behavior: 'smooth' });
    }
  }

  getPages(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(total, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewScheme(scheme: GovernmentScheme): void {
    this.router.navigate(['/government-schemes', scheme.slug]);
  }

  checkEligibility(): void {
    this.router.navigate(['/government-schemes', 'eligibility-checker']);
  }

  getSchemeTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'FINANCIAL': 'fas fa-rupee-sign',
      'TRAINING': 'fas fa-graduation-cap',
      'MARKETING': 'fas fa-bullhorn',
      'INFRASTRUCTURE': 'fas fa-industry',
      'CREDIT': 'fas fa-credit-card',
      'INSURANCE': 'fas fa-shield-alt',
      'RECOGNITION': 'fas fa-award'
    };
    return icons[type] || 'fas fa-file-alt';
  }

  getSchemeTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'FINANCIAL': 'badge-financial',
      'TRAINING': 'badge-training',
      'MARKETING': 'badge-marketing',
      'INFRASTRUCTURE': 'badge-infrastructure',
      'CREDIT': 'badge-credit',
      'INSURANCE': 'badge-insurance',
      'RECOGNITION': 'badge-recognition'
    };
    return classes[type] || 'badge-default';
  }

  getDaysRemaining(deadline: Date | null): number | null {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  formatAmount(amount: number): string {
    if (amount >= 10000000) {
      return '₹' + (amount / 10000000).toFixed(1) + ' Cr';
    } else if (amount >= 100000) {
      return '₹' + (amount / 100000).toFixed(1) + ' Lakh';
    } else if (amount >= 1000) {
      return '₹' + (amount / 1000).toFixed(0) + 'K';
    }
    return '₹' + amount.toLocaleString();
  }

  trackByScheme(index: number, scheme: GovernmentScheme): number {
    return scheme.id;
  }
}
