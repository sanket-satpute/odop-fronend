import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorDashboardOrdersComponent } from './vendor-dashboard-orders.component';

describe('VendorDashboardOrdersComponent', () => {
  let component: VendorDashboardOrdersComponent;
  let fixture: ComponentFixture<VendorDashboardOrdersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VendorDashboardOrdersComponent]
    });
    fixture = TestBed.createComponent(VendorDashboardOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
