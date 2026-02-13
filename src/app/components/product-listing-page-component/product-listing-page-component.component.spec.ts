import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductListingPageComponentComponent } from './product-listing-page-component.component';

describe('ProductListingPageComponentComponent', () => {
  let component: ProductListingPageComponentComponent;
  let fixture: ComponentFixture<ProductListingPageComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProductListingPageComponentComponent]
    });
    fixture = TestBed.createComponent(ProductListingPageComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
