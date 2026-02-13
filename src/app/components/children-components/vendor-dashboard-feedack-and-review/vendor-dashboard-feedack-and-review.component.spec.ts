import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorDashboardFeedackAndReviewComponent } from './vendor-dashboard-feedack-and-review.component';

describe('VendorDashboardFeedackAndReviewComponent', () => {
  let component: VendorDashboardFeedackAndReviewComponent;
  let fixture: ComponentFixture<VendorDashboardFeedackAndReviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VendorDashboardFeedackAndReviewComponent]
    });
    fixture = TestBed.createComponent(VendorDashboardFeedackAndReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
