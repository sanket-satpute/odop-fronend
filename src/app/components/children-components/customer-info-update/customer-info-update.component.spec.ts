import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerInfoUpdateComponent } from './customer-info-update.component';

describe('CustomerInfoUpdateComponent', () => {
  let component: CustomerInfoUpdateComponent;
  let fixture: ComponentFixture<CustomerInfoUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomerInfoUpdateComponent]
    });
    fixture = TestBed.createComponent(CustomerInfoUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
