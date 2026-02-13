import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardSettingsComponent } from './admin-dashboard-settings.component';

describe('AdminDashboardSettingsComponent', () => {
  let component: AdminDashboardSettingsComponent;
  let fixture: ComponentFixture<AdminDashboardSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminDashboardSettingsComponent]
    });
    fixture = TestBed.createComponent(AdminDashboardSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
