import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardCmsComponent } from './admin-dashboard-cms.component';

describe('AdminDashboardCmsComponent', () => {
  let component: AdminDashboardCmsComponent;
  let fixture: ComponentFixture<AdminDashboardCmsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminDashboardCmsComponent]
    });
    fixture = TestBed.createComponent(AdminDashboardCmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
