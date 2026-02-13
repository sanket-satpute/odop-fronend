import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorDashboardManageProductsComponent } from './vendor-dashboard-manage-products.component';

describe('VendorDashboardManageProductsComponent', () => {
  let component: VendorDashboardManageProductsComponent;
  let fixture: ComponentFixture<VendorDashboardManageProductsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VendorDashboardManageProductsComponent]
    });
    fixture = TestBed.createComponent(VendorDashboardManageProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
