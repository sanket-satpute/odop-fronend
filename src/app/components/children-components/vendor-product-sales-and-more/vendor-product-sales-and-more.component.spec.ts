import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorProductSalesAndMoreComponent } from './vendor-product-sales-and-more.component';

describe('VendorProductSalesAndMoreComponent', () => {
  let component: VendorProductSalesAndMoreComponent;
  let fixture: ComponentFixture<VendorProductSalesAndMoreComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VendorProductSalesAndMoreComponent]
    });
    fixture = TestBed.createComponent(VendorProductSalesAndMoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
