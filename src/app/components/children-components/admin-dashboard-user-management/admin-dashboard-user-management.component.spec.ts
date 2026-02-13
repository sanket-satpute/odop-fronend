import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardUserManagementComponent } from './admin-dashboard-user-management.component';

describe('AdminDashboardUserManagementComponent', () => {
  let component: AdminDashboardUserManagementComponent;
  let fixture: ComponentFixture<AdminDashboardUserManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminDashboardUserManagementComponent]
    });
    fixture = TestBed.createComponent(AdminDashboardUserManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
