import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ProductServiceService } from './product-service.service';
import { GlobalVariable } from '../global/global';
import { Product } from '../models/product';

describe('ProductServiceService', () => {
  let service: ProductServiceService;
  let httpMock: HttpTestingController;

  const BASE_URL = GlobalVariable.BASE_API_URL + 'product';

  // Mock product data
  const mockProduct: Product = {
    productId: 'prod-001',
    productName: 'Banarasi Silk Saree',
    productDescription: 'Handwoven authentic Banarasi silk saree',
    categoryId: 'cat-001',
    price: 25000,
    productQuantity: 10,
    vendorId: 'vendor-001',
    giTagCertified: true,
    originDistrict: 'Varanasi',
    originState: 'Uttar Pradesh',
    rating: 4.5
  };

  const mockProducts: Product[] = [
    mockProduct,
    {
      productId: 'prod-002',
      productName: 'Pashmina Shawl',
      productDescription: 'Authentic Kashmiri Pashmina',
      categoryId: 'cat-002',
      price: 15000,
      productQuantity: 5,
      vendorId: 'vendor-002',
      giTagCertified: true,
      originDistrict: 'Srinagar',
      originState: 'Jammu and Kashmir',
      rating: 4.8
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductServiceService]
    });
    service = TestBed.inject(ProductServiceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // GET All Products Tests
  describe('getAllProducts', () => {
    it('should return all products', () => {
      service.getAllProducts().subscribe(products => {
        expect(products.length).toBe(2);
        expect(products).toEqual(mockProducts);
      });

      const req = httpMock.expectOne(`${BASE_URL}/get_all_products`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });

    it('should return empty array when no products exist', () => {
      service.getAllProducts().subscribe(products => {
        expect(products.length).toBe(0);
      });

      const req = httpMock.expectOne(`${BASE_URL}/get_all_products`);
      req.flush([]);
    });
  });

  // GET Product by ID Tests
  describe('getProductById', () => {
    it('should return a product by ID', () => {
      service.getProductById('prod-001').subscribe(product => {
        expect(product).toEqual(mockProduct);
        expect(product.productName).toBe('Banarasi Silk Saree');
      });

      const req = httpMock.expectOne(`${BASE_URL}/get_product_id/prod-001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });
  });

  // GI Tagged Products Tests
  describe('GI Tagged Products', () => {
    it('should return all GI-tagged products', () => {
      const giProducts = mockProducts.filter(p => p.giTagCertified);
      
      service.getGiTaggedProducts().subscribe(products => {
        expect(products.length).toBe(2);
        products.forEach(p => expect(p.giTagCertified).toBeTruthy());
      });

      const req = httpMock.expectOne(`${BASE_URL}/gi_tagged`);
      expect(req.request.method).toBe('GET');
      req.flush(giProducts);
    });

    it('should return GI-tagged products by state', () => {
      const state = 'Uttar Pradesh';
      
      service.getGiTaggedProductsByState(state).subscribe(products => {
        expect(products.length).toBe(1);
        expect(products[0].originState).toBe(state);
      });

      const req = httpMock.expectOne(`${BASE_URL}/gi_tagged_by_state?state=Uttar%20Pradesh`);
      expect(req.request.method).toBe('GET');
      req.flush([mockProduct]);
    });

    it('should return GI-tagged products by location', () => {
      const district = 'Varanasi';
      const state = 'Uttar Pradesh';
      
      service.getGiTaggedProductsByLocation(district, state).subscribe(products => {
        expect(products.length).toBe(1);
        expect(products[0].originDistrict).toBe(district);
        expect(products[0].originState).toBe(state);
      });

      const req = httpMock.expectOne(
        `${BASE_URL}/gi_tagged_by_location?district=Varanasi&state=Uttar%20Pradesh`
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockProduct]);
    });
  });

  // Location-based Discovery Tests
  describe('Location-based Discovery', () => {
    it('should return products by state', () => {
      const state = 'Jammu and Kashmir';
      
      service.getProductsByState(state).subscribe(products => {
        expect(products[0].originState).toBe(state);
      });

      const req = httpMock.expectOne(
        `${BASE_URL}/search_by_state?state=Jammu%20and%20Kashmir`
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockProducts[1]]);
    });

    it('should return products by location (district and state)', () => {
      service.getProductsByLocation('Varanasi', 'Uttar Pradesh').subscribe(products => {
        expect(products[0].originDistrict).toBe('Varanasi');
      });

      const req = httpMock.expectOne(
        `${BASE_URL}/search_by_location?district=Varanasi&state=Uttar%20Pradesh`
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockProduct]);
    });
  });

  // Vendor Products Tests
  describe('getProductByVendorId', () => {
    it('should return products for a vendor', () => {
      const vendorId = 'vendor-001';
      
      service.getProductByVendorId(vendorId).subscribe(products => {
        products.forEach(p => expect(p.vendorId).toBe(vendorId));
      });

      const req = httpMock.expectOne(`${BASE_URL}/get_product_by_vendor_id/${vendorId}`);
      expect(req.request.method).toBe('GET');
      req.flush([mockProduct]);
    });
  });

  // Category Products Tests
  describe('getProductByCategoryId', () => {
    it('should return products for a category', () => {
      const categoryId = 'cat-001';
      
      service.getProductByCategoryId(categoryId).subscribe(products => {
        products.forEach(p => expect(p.categoryId).toBe(categoryId));
      });

      const req = httpMock.expectOne(`${BASE_URL}/get_product_by_category_id/${categoryId}`);
      expect(req.request.method).toBe('GET');
      req.flush([mockProduct]);
    });
  });

  // Featured & Latest Products Tests
  describe('Featured and Latest Products', () => {
    it('should return featured products with default limit', () => {
      service.getFeaturedProducts().subscribe(products => {
        expect(products.length).toBeLessThanOrEqual(6);
      });

      const req = httpMock.expectOne(`${BASE_URL}/featured?limit=6`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });

    it('should return featured products with custom limit', () => {
      service.getFeaturedProducts(3).subscribe(products => {
        expect(products.length).toBeLessThanOrEqual(3);
      });

      const req = httpMock.expectOne(`${BASE_URL}/featured?limit=3`);
      expect(req.request.method).toBe('GET');
      req.flush([mockProduct]);
    });

    it('should return latest products', () => {
      service.getLatestProducts(4).subscribe(products => {
        expect(products.length).toBeLessThanOrEqual(4);
      });

      const req = httpMock.expectOne(`${BASE_URL}/latest?limit=4`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });
  });

  // Multiple Products by IDs Tests
  describe('getProductsByIds', () => {
    it('should return empty array for empty ids', () => {
      service.getProductsByIds([]).subscribe(products => {
        expect(products).toEqual([]);
      });
      // No HTTP request should be made
    });

    it('should return multiple products by IDs', () => {
      const ids = ['prod-001', 'prod-002'];
      
      service.getProductsByIds(ids).subscribe(products => {
        expect(products.length).toBe(2);
      });

      // Two requests should be made
      const req1 = httpMock.expectOne(`${BASE_URL}/get_product_id/prod-001`);
      const req2 = httpMock.expectOne(`${BASE_URL}/get_product_id/prod-002`);
      
      req1.flush(mockProducts[0]);
      req2.flush(mockProducts[1]);
    });
  });

  // Delete Product Tests
  describe('deleteProductById', () => {
    it('should delete a product', () => {
      service.deleteProductById('prod-001').subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(`${BASE_URL}/delete_by_id/prod-001`);
      expect(req.request.method).toBe('DELETE');
      req.flush(true);
    });
  });
});
