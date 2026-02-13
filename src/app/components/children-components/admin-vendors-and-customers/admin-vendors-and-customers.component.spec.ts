import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminVendorsAndCustomersComponent } from './admin-vendors-and-customers.component';

describe('AdminVendorsAndCustomersComponent', () => {
  let component: AdminVendorsAndCustomersComponent;
  let fixture: ComponentFixture<AdminVendorsAndCustomersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminVendorsAndCustomersComponent]
    });
    fixture = TestBed.createComponent(AdminVendorsAndCustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
