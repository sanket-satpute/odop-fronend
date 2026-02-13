import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAccountDashboardComponentComponent } from './admin-account-dashboard-component.component';

describe('AdminAccountDashboardComponentComponent', () => {
  let component: AdminAccountDashboardComponentComponent;
  let fixture: ComponentFixture<AdminAccountDashboardComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminAccountDashboardComponentComponent]
    });
    fixture = TestBed.createComponent(AdminAccountDashboardComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
