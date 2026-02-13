import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorDashboardAnalyticsComponent } from './vendor-dashboard-analytics.component';

describe('VendorDashboardAnalyticsComponent', () => {
  let component: VendorDashboardAnalyticsComponent;
  let fixture: ComponentFixture<VendorDashboardAnalyticsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VendorDashboardAnalyticsComponent]
    });
    fixture = TestBed.createComponent(VendorDashboardAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
