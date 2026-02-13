import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DistrictMapService, DistrictResponse, StateResponse, MapStatistics } from '../../../services/district-map.service';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface District {
  id: string;
  name: string;
  state: string;
  stateCode: string;
  odopProduct: string;
  productCategory: string;
  artisanCount: number;
  productCount: number;
  description: string;
  imageUrl: string;
  giTagged: boolean;
  exportReady: boolean;
  coordinates: { lat: number; lng: number };
}

interface State {
  code: string;
  name: string;
  districtCount: number;
  productCount: number;
  topProducts: string[];
  isHighlighted?: boolean;
}

interface MapStats {
  totalDistricts: number;
  totalProducts: number;
  totalArtisans: number;
  giTaggedProducts: number;
  exportReadyProducts: number;
}

@Component({
  selector: 'app-district-map-browser',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './district-map-browser.component.html',
  styleUrls: ['./district-map-browser.component.css']
})
export class DistrictMapBrowserComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  private destroy$ = new Subject<void>();
  
  isLoading = true;
  loadError: string | null = null;
  selectedState: State | null = null;
  selectedDistrict: District | null = null;
  searchQuery = '';
  viewMode: 'map' | 'list' = 'map';

  mapStats: MapStats = {
    totalDistricts: 761,
    totalProducts: 1024,
    totalArtisans: 5000000,
    giTaggedProducts: 417,
    exportReadyProducts: 312
  };

  filterOptions = {
    productCategory: '',
    giTagged: false,
    exportReady: false
  };

  productCategories = [
    'All Categories',
    'Textiles & Handloom',
    'Handicrafts',
    'Food Products',
    'Metal Craft',
    'Wood Craft',
    'Pottery & Ceramics',
    'Leather Goods',
    'Natural Products'
  ];

  states: State[] = [
    { code: 'UP', name: 'Uttar Pradesh', districtCount: 75, productCount: 75, topProducts: ['Bhadohi Carpet', 'Varanasi Silk', 'Lucknow Chikan'] },
    { code: 'RAJ', name: 'Rajasthan', districtCount: 33, productCount: 45, topProducts: ['Blue Pottery', 'Bandhani', 'Mojari'] },
    { code: 'GUJ', name: 'Gujarat', districtCount: 33, productCount: 38, topProducts: ['Patola Silk', 'Rogan Art', 'Kutch Embroidery'] },
    { code: 'WB', name: 'West Bengal', districtCount: 23, productCount: 30, topProducts: ['Baluchari Saree', 'Dokra Art', 'Terracotta'] },
    { code: 'TN', name: 'Tamil Nadu', districtCount: 38, productCount: 42, topProducts: ['Kanchipuram Silk', 'Tanjore Painting', 'Bronze Craft'] },
    { code: 'KA', name: 'Karnataka', districtCount: 31, productCount: 35, topProducts: ['Mysore Silk', 'Bidriware', 'Channapatna Toys'] },
    { code: 'AP', name: 'Andhra Pradesh', districtCount: 26, productCount: 28, topProducts: ['Kalamkari', 'Kondapalli Toys', 'Mangalagiri Cotton'] },
    { code: 'MH', name: 'Maharashtra', districtCount: 36, productCount: 40, topProducts: ['Paithani', 'Kolhapuri Chappal', 'Warli Painting'] },
    { code: 'MP', name: 'Madhya Pradesh', districtCount: 52, productCount: 55, topProducts: ['Chanderi Silk', 'Gond Art', 'Bagh Print'] },
    { code: 'OR', name: 'Odisha', districtCount: 30, productCount: 35, topProducts: ['Sambalpuri Saree', 'Pattachitra', 'Silver Filigree'] },
    { code: 'BH', name: 'Bihar', districtCount: 38, productCount: 40, topProducts: ['Madhubani Painting', 'Sikki Craft', 'Bhagalpuri Silk'] },
    { code: 'JH', name: 'Jharkhand', districtCount: 24, productCount: 26, topProducts: ['Sohrai Painting', 'Bamboo Craft', 'Terracotta'] },
    { code: 'KL', name: 'Kerala', districtCount: 14, productCount: 20, topProducts: ['Kasavu Saree', 'Aranmula Mirror', 'Coir Products'] },
    { code: 'AS', name: 'Assam', districtCount: 35, productCount: 38, topProducts: ['Muga Silk', 'Gamcha', 'Bell Metal Craft'] },
    { code: 'HP', name: 'Himachal Pradesh', districtCount: 12, productCount: 15, topProducts: ['Kullu Shawl', 'Chamba Rumal', 'Kangra Painting'] },
    { code: 'JK', name: 'Jammu & Kashmir', districtCount: 20, productCount: 25, topProducts: ['Pashmina', 'Paper Mache', 'Walnut Wood'] },
    { code: 'HR', name: 'Haryana', districtCount: 22, productCount: 25, topProducts: ['Phulkari', 'Durry Weaving', 'Saras Dairy'] },
    { code: 'PB', name: 'Punjab', districtCount: 23, productCount: 28, topProducts: ['Phulkari', 'Jutti', 'Patiala Salwar'] },
    { code: 'UK', name: 'Uttarakhand', districtCount: 13, productCount: 18, topProducts: ['Ringal Craft', 'Aipan', 'Thulma Weaving'] },
    { code: 'TS', name: 'Telangana', districtCount: 33, productCount: 35, topProducts: ['Pochampally Ikat', 'Nirmal Toys', 'Pembarthi Metal'] }
  ];

  districts: District[] = [];
  filteredDistricts: District[] = [];

  constructor(
    private districtMapService: DistrictMapService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDistricts();
  }

  ngAfterViewInit(): void {
    // Initialize map visualization if needed
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDistricts(): void {
    this.isLoading = true;
    this.loadError = null;
    
    // Load data from actual service
    forkJoin({
      featured: this.districtMapService.getFeaturedDistricts().pipe(
        catchError(() => of([]))
      ),
      statistics: this.districtMapService.getMapStatistics().pipe(
        catchError(() => of(null))
      ),
      states: this.districtMapService.getAllStates().pipe(
        catchError(() => of([]))
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        // Map featured districts to component interface
        if (result.featured && result.featured.length > 0) {
          this.districts = result.featured.map(d => this.mapDistrictResponse(d));
        } else {
          // Use fallback data if API returns empty
          this.districts = this.getFallbackDistricts();
        }
        this.filteredDistricts = [...this.districts];
        
        // Update statistics if available
        if (result.statistics) {
          this.mapStats = {
            totalDistricts: result.statistics.totalDistricts || this.mapStats.totalDistricts,
            totalProducts: result.statistics.totalProducts || this.mapStats.totalProducts,
            totalArtisans: result.statistics.totalArtisans || this.mapStats.totalArtisans,
            giTaggedProducts: result.statistics.giTaggedProducts || this.mapStats.giTaggedProducts,
            exportReadyProducts: this.mapStats.exportReadyProducts // Not available in API, keep default
          };
        }
        
        // Update states if available
        if (result.states && result.states.length > 0) {
          this.states = result.states.map(s => ({
            code: s.stateCode || '',
            name: s.name || '',
            districtCount: s.districtCount || 0,
            productCount: s.totalProducts || 0,
            topProducts: s.topCrafts || []
          }));
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading district map data:', error);
        // Use fallback data on error
        this.districts = this.getFallbackDistricts();
        this.filteredDistricts = [...this.districts];
        this.loadError = 'Failed to load live data. Showing cached information.';
        this.isLoading = false;
      }
    });
  }
  
  private mapDistrictResponse(d: DistrictResponse): District {
    // Check if any ODOP product is GI tagged
    const hasGiTagged = d.odopProducts?.some(p => p.giTagged) || false;
    // Get primary ODOP product name
    const primaryProduct = d.primaryCraft || d.odopProducts?.[0]?.name || '';
    
    return {
      id: d.id || '',
      name: d.name || '',
      state: d.stateName || '',
      stateCode: d.stateCode || '',
      odopProduct: primaryProduct,
      productCategory: d.primaryCraft || '',
      artisanCount: d.registeredArtisans || 0,
      productCount: d.totalProducts || 0,
      description: d.historicalSignificance || d.famousFor?.join(', ') || '',
      imageUrl: d.thumbnailUrl || d.heroImageUrl || 'assets/images/category-placeholder.svg',
      giTagged: hasGiTagged,
      exportReady: false, // Not available in API response
      coordinates: { lat: d.latitude || 0, lng: d.longitude || 0 }
    };
  }
  
  private getFallbackDistricts(): District[] {
    // Fallback data for when API is unavailable
    return [
      {
        id: '1', name: 'Bhadohi', state: 'Uttar Pradesh', stateCode: 'UP',
        odopProduct: 'Hand-knotted Carpets', productCategory: 'Textiles & Handloom',
        artisanCount: 25000, productCount: 150, description: 'Known worldwide for premium hand-knotted carpets',
        imageUrl: 'assets/images/category-placeholder.svg', giTagged: true, exportReady: true,
        coordinates: { lat: 25.4, lng: 82.6 }
      },
      {
        id: '2', name: 'Varanasi', state: 'Uttar Pradesh', stateCode: 'UP',
        odopProduct: 'Banarasi Silk Sarees', productCategory: 'Textiles & Handloom',
        artisanCount: 50000, productCount: 200, description: 'Heritage silk sarees with intricate zari work',
        imageUrl: 'assets/images/category-placeholder.svg', giTagged: true, exportReady: true,
        coordinates: { lat: 25.3, lng: 83.0 }
      },
      {
        id: '3', name: 'Jaipur', state: 'Rajasthan', stateCode: 'RAJ',
        odopProduct: 'Blue Pottery', productCategory: 'Pottery & Ceramics',
        artisanCount: 15000, productCount: 80, description: 'Traditional Persian-influenced blue pottery',
        imageUrl: 'assets/images/category-placeholder.svg', giTagged: true, exportReady: true,
        coordinates: { lat: 26.9, lng: 75.8 }
      }
    ];
  }

  selectState(state: State): void {
    this.selectedState = state;
    this.selectedDistrict = null;
    this.filterDistrictsByState(state.code);
  }

  selectDistrict(district: District): void {
    this.selectedDistrict = district;
  }

  filterDistrictsByState(stateCode: string): void {
    this.filteredDistricts = this.districts.filter(d => d.stateCode === stateCode);
  }

  clearStateSelection(): void {
    this.selectedState = null;
    this.selectedDistrict = null;
    this.filteredDistricts = [...this.districts];
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredDistricts = this.selectedState
        ? this.districts.filter(d => d.stateCode === this.selectedState!.code)
        : [...this.districts];
      return;
    }

    this.filteredDistricts = this.districts.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.odopProduct.toLowerCase().includes(query) ||
      d.state.toLowerCase().includes(query) ||
      d.productCategory.toLowerCase().includes(query)
    );
  }

  applyFilters(): void {
    let filtered = this.selectedState
      ? this.districts.filter(d => d.stateCode === this.selectedState!.code)
      : [...this.districts];

    if (this.filterOptions.productCategory && this.filterOptions.productCategory !== 'All Categories') {
      filtered = filtered.filter(d => d.productCategory === this.filterOptions.productCategory);
    }

    if (this.filterOptions.giTagged) {
      filtered = filtered.filter(d => d.giTagged);
    }

    if (this.filterOptions.exportReady) {
      filtered = filtered.filter(d => d.exportReady);
    }

    this.filteredDistricts = filtered;
  }

  toggleView(mode: 'map' | 'list'): void {
    this.viewMode = mode;
  }

  viewDistrictProducts(district: District): void {
    this.router.navigate(['/products'], {
      queryParams: { district: district.name, category: district.productCategory }
    });
  }

  formatNumber(num: number): string {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + ' L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  getStateClass(stateCode: string): string {
    const state = this.states.find(s => s.code === stateCode);
    if (!state) return '';
    if (state.productCount > 40) return 'high-density';
    if (state.productCount > 25) return 'medium-density';
    return 'low-density';
  }

  highlightState(state: State, highlight: boolean): void {
    state.isHighlighted = highlight;
  }

  onMapLoaded(event: Event): void {
    // SVG map loaded successfully
    console.log('India ODOP map loaded successfully');
    this.initializeSvgMapInteractions();
  }

  private initializeSvgMapInteractions(): void {
    // Add click handlers to SVG state paths
    setTimeout(() => {
      const svgObject = this.mapContainer?.nativeElement?.querySelector('.india-svg-map');
      if (svgObject?.contentDocument) {
        const svgDoc = svgObject.contentDocument;
        const statePaths = svgDoc.querySelectorAll('.state-path');
        
        statePaths.forEach((path: Element) => {
          const stateCode = path.getAttribute('data-state');
          if (stateCode) {
            path.addEventListener('click', () => {
              const state = this.states.find(s => s.code === stateCode);
              if (state) this.selectState(state);
            });
            
            path.addEventListener('mouseenter', () => {
              const state = this.states.find(s => s.code === stateCode);
              if (state) this.highlightState(state, true);
            });
            
            path.addEventListener('mouseleave', () => {
              const state = this.states.find(s => s.code === stateCode);
              if (state) this.highlightState(state, false);
            });
          }
        });
      }
    }, 500);
  }

  getStateMarkerPosition(stateCode: string): { [key: string]: string } {
    // Approximate positions for state markers on the map (percentage-based)
    const positions: { [key: string]: { top: string; left: string } } = {
      'JK': { top: '12%', left: '35%' },
      'HP': { top: '18%', left: '38%' },
      'PB': { top: '23%', left: '32%' },
      'UK': { top: '20%', left: '45%' },
      'HR': { top: '28%', left: '35%' },
      'DL': { top: '30%', left: '37%' },
      'RAJ': { top: '42%', left: '22%' },
      'UP': { top: '35%', left: '52%' },
      'BH': { top: '40%', left: '70%' },
      'WB': { top: '50%', left: '78%' },
      'JH': { top: '48%', left: '68%' },
      'OR': { top: '58%', left: '68%' },
      'CG': { top: '55%', left: '55%' },
      'MP': { top: '50%', left: '40%' },
      'GUJ': { top: '52%', left: '14%' },
      'MH': { top: '65%', left: '32%' },
      'TS': { top: '68%', left: '52%' },
      'AP': { top: '78%', left: '58%' },
      'KA': { top: '80%', left: '36%' },
      'GA': { top: '73%', left: '24%' },
      'KL': { top: '90%', left: '32%' },
      'TN': { top: '88%', left: '48%' },
      'AS': { top: '32%', left: '88%' }
    };
    return positions[stateCode] || { top: '50%', left: '50%' };
  }
}
