import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateCustomerProfileDialogComponent } from './update-customer-profile-dialog.component';

describe('UpdateCustomerProfileDialogComponent', () => {
  let component: UpdateCustomerProfileDialogComponent;
  let fixture: ComponentFixture<UpdateCustomerProfileDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateCustomerProfileDialogComponent]
    });
    fixture = TestBed.createComponent(UpdateCustomerProfileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
