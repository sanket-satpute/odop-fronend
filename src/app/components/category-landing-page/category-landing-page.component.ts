import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryServiceService } from '../../project/services/category-service.service';
import { ProductServiceService } from '../../project/services/product-service.service';
import { ProductCategory } from '../../project/models/product-category';
import { Product } from '../../project/models/product';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-category-landing-page',
  templateUrl: './category-landing-page.component.html',
  styleUrls: ['./category-landing-page.component.css']
})
export class CategoryLandingPageComponent implements OnInit {
  categorySlug: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';
  sortBy: string = 'popularity';
  priceRange: number[] = [0, 50000];
  selectedSubcategory: string = 'all';
  viewMode: string = 'grid';

  // Category data from API
  category: ProductCategory | null = null;
  allCategories: ProductCategory[] = [];

  // Products from API
  products: Product[] = [];
  filteredProducts: Product[] = [];

  // Category display mapping for banner images
  categoryBanners: { [key: string]: string } = {
    'textiles-handloom': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600',
    'handicrafts': 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=1600',
    'pottery': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1600',
    'jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600',
    'food-spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600',
    'art-paintings': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1600',
    'wood-craft': 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=1600',
    'metal-work': 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=1600'
  };

  // Category icons
  categoryIcons: { [key: string]: string } = {
    'Textiles & Handloom': 'fas fa-tshirt',
    'Handicrafts': 'fas fa-hands',
    'Pottery': 'fas fa-mortar-pestle',
    'Jewelry': 'fas fa-gem',
    'Food & Spices': 'fas fa-pepper-hot',
    'Art & Paintings': 'fas fa-palette',
    'Wood Craft': 'fas fa-tree',
    'Metal Work': 'fas fa-hammer'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryServiceService,
    private productService: ProductServiceService
  ) {}

  ngOnInit(): void {
    this.loadAllCategories();
    
    this.route.params.subscribe(params => {
      this.categorySlug = params['slug'] || 'textiles-handloom';
      this.loadCategoryData();
    });
  }

  loadAllCategories(): void {
    this.categoryService.getAllCategory().subscribe({
      next: (categories) => {
        this.allCategories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadCategoryData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Convert slug to category name for API lookup
    const categoryName = this.slugToName(this.categorySlug);

    // Load category by name
    this.categoryService.getCategoryByName(categoryName).subscribe({
      next: (categories) => {
        if (categories && categories.length > 0) {
          this.category = categories[0];
          this.loadProductsForCategory(this.category.prodCategoryID!);
        } else {
          // Fallback: try to find in allCategories or use default
          this.loadAllProductsWithFilter();
        }
      },
      error: (error) => {
        console.error('Error loading category:', error);
        this.loadAllProductsWithFilter();
      }
    });
  }

  loadProductsForCategory(categoryId: string): void {
    this.productService.getProductByCategoryId(categoryId).subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = 'Failed to load products. Please try again.';
        this.isLoading = false;
        this.loadFallbackProducts();
      }
    });
  }

  loadAllProductsWithFilter(): void {
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        // Filter products by category name if possible
        const categoryName = this.slugToName(this.categorySlug).toLowerCase();
        this.products = products.filter(p => 
          p.categoryId?.toLowerCase().includes(categoryName) ||
          p.subCategory?.toLowerCase().includes(categoryName) ||
          p.productName?.toLowerCase().includes(categoryName)
        );
        
        if (this.products.length === 0) {
          this.products = products.slice(0, 12); // Show first 12 products as fallback
        }
        
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
        this.loadFallbackProducts();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.products];

    // Apply price filter
    result = result.filter(p => {
      const productPrice = p.price || 0;
      return productPrice >= this.priceRange[0] && productPrice <= this.priceRange[1];
    });

    // Apply sorting
    if (this.sortBy === 'price-low') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (this.sortBy === 'price-high') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (this.sortBy === 'newest') {
      result.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    }

    this.filteredProducts = result;
  }

  filterBySubcategory(subcategorySlug: string): void {
    this.selectedSubcategory = subcategorySlug;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  navigateToProduct(productId: string | undefined): void {
    if (productId) {
      this.router.navigate(['/product_detail', productId]);
    }
  }

  navigateToCategory(slug: string): void {
    this.router.navigate(['/category', slug]);
  }

  getCategoryIcon(categoryName: string): string {
    return this.categoryIcons[categoryName] || 'fas fa-tag';
  }

  getCategoryBanner(): string {
    return this.categoryBanners[this.categorySlug] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600';
  }

  getCategoryName(): string {
    return this.category?.categoryName || this.slugToName(this.categorySlug);
  }

  getCategoryDescription(): string {
    return this.category?.categoryDescription || 
      `Discover authentic ${this.getCategoryName()} products from skilled artisans across India.`;
  }

  getProductImage(product: Product): string {
    return product.productImageURL || 
           product.productImageBase64 || 
           'assets/images/product-placeholder.svg';
  }

  getProductDiscount(product: Product): number {
    // Use discount field directly if available, otherwise calculate from price
    if (product.discount) {
      return product.discount;
    }
    return 0;
  }

  getRatingStars(rating: number): number[] {
    return Array(Math.floor(rating || 0)).fill(0);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  }

  private slugToName(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private nameToSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
  }

  retryLoad(): void {
    this.loadCategoryData();
  }

  // Fallback products for demo
  private loadFallbackProducts(): void {
    this.products = [
      {
        productId: '1',
        productName: 'Banarasi Silk Saree - Royal Blue',
        price: 15999,
        discount: 20,
        productImageURL: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
        categoryId: 'textiles',
        subCategory: 'Textiles & Handloom',
        productDescription: 'Authentic Banarasi silk saree with intricate zari work',
        originState: 'Uttar Pradesh',
        giTagCertified: true
      },
      {
        productId: '2',
        productName: 'Kanchipuram Silk Saree - Golden',
        price: 22999,
        discount: 18,
        productImageURL: 'https://images.unsplash.com/photo-1583391733956-4c0ec67a1f8d?w=400',
        categoryId: 'textiles',
        subCategory: 'Textiles & Handloom',
        productDescription: 'Premium Kanchipuram silk with temple border design',
        originState: 'Tamil Nadu',
        giTagCertified: true
      },
      {
        productId: '3',
        productName: 'Pashmina Shawl - Ivory White',
        price: 8999,
        discount: 25,
        productImageURL: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400',
        categoryId: 'textiles',
        subCategory: 'Textiles & Handloom',
        productDescription: 'Pure Kashmiri Pashmina with hand embroidery',
        originState: 'Jammu & Kashmir',
        giTagCertified: true
      },
      {
        productId: '4',
        productName: 'Chanderi Cotton Saree',
        price: 4999,
        discount: 17,
        productImageURL: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        categoryId: 'textiles',
        subCategory: 'Textiles & Handloom',
        productDescription: 'Lightweight Chanderi cotton with traditional motifs',
        originState: 'Madhya Pradesh'
      }
    ] as Product[];
    this.filteredProducts = this.products;
  }
}
