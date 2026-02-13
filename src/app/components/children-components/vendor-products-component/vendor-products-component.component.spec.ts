import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorProductsComponentComponent } from './vendor-products-component.component';

describe('VendorProductsComponentComponent', () => {
  let component: VendorProductsComponentComponent;
  let fixture: ComponentFixture<VendorProductsComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VendorProductsComponentComponent]
    });
    fixture = TestBed.createComponent(VendorProductsComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
