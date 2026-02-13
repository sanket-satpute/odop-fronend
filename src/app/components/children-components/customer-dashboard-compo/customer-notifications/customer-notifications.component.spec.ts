import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerNotificationsComponent } from './customer-notifications.component';

describe('CustomerNotificationsComponent', () => {
  let component: CustomerNotificationsComponent;
  let fixture: ComponentFixture<CustomerNotificationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomerNotificationsComponent]
    });
    fixture = TestBed.createComponent(CustomerNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
