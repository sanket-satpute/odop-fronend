import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardOrdersComponent } from './admin-dashboard-orders.component';

describe('AdminDashboardOrdersComponent', () => {
  let component: AdminDashboardOrdersComponent;
  let fixture: ComponentFixture<AdminDashboardOrdersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminDashboardOrdersComponent]
    });
    fixture = TestBed.createComponent(AdminDashboardOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
