import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardDashboardComponent } from './admin-dashboard-dashboard.component';

describe('AdminDashboardDashboardComponent', () => {
  let component: AdminDashboardDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminDashboardDashboardComponent]
    });
    fixture = TestBed.createComponent(AdminDashboardDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
