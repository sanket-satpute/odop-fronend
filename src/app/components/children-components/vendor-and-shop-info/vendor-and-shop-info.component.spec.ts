import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorAndShopInfoComponent } from './vendor-and-shop-info.component';

describe('VendorAndShopInfoComponent', () => {
  let component: VendorAndShopInfoComponent;
  let fixture: ComponentFixture<VendorAndShopInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VendorAndShopInfoComponent]
    });
    fixture = TestBed.createComponent(VendorAndShopInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
