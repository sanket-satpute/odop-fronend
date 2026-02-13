import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerAccountDashboardComponentComponent } from './customer-account-dashboard-component.component';

describe('CustomerAccountDashboardComponentComponent', () => {
  let component: CustomerAccountDashboardComponentComponent;
  let fixture: ComponentFixture<CustomerAccountDashboardComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomerAccountDashboardComponentComponent]
    });
    fixture = TestBed.createComponent(CustomerAccountDashboardComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
