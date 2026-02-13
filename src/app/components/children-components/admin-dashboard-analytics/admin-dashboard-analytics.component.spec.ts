import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardAnalyticsComponent } from './admin-dashboard-analytics.component';

describe('AdminDashboardAnalyticsComponent', () => {
  let component: AdminDashboardAnalyticsComponent;
  let fixture: ComponentFixture<AdminDashboardAnalyticsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminDashboardAnalyticsComponent]
    });
    fixture = TestBed.createComponent(AdminDashboardAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
