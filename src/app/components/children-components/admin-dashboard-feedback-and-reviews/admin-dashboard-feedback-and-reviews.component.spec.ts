import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardFeedbackAndReviewsComponent } from './admin-dashboard-feedback-and-reviews.component';

describe('AdminDashboardFeedbackAndReviewsComponent', () => {
  let component: AdminDashboardFeedbackAndReviewsComponent;
  let fixture: ComponentFixture<AdminDashboardFeedbackAndReviewsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminDashboardFeedbackAndReviewsComponent]
    });
    fixture = TestBed.createComponent(AdminDashboardFeedbackAndReviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
