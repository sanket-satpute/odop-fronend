import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorAccountDashboardComponentComponent } from './vendor-account-dashboard-component.component';

describe('VendorAccountDashboardComponentComponent', () => {
  let component: VendorAccountDashboardComponentComponent;
  let fixture: ComponentFixture<VendorAccountDashboardComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VendorAccountDashboardComponentComponent]
    });
    fixture = TestBed.createComponent(VendorAccountDashboardComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
