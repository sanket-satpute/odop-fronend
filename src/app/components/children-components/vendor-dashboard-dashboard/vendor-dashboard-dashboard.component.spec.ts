import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorDashboardDashboardComponent } from './vendor-dashboard-dashboard.component';

describe('VendorDashboardDashboardComponent', () => {
  let component: VendorDashboardDashboardComponent;
  let fixture: ComponentFixture<VendorDashboardDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VendorDashboardDashboardComponent]
    });
    fixture = TestBed.createComponent(VendorDashboardDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
