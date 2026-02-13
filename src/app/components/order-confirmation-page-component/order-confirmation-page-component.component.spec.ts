import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderConfirmationPageComponentComponent } from './order-confirmation-page-component.component';

describe('OrderConfirmationPageComponentComponent', () => {
  let component: OrderConfirmationPageComponentComponent;
  let fixture: ComponentFixture<OrderConfirmationPageComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderConfirmationPageComponentComponent]
    });
    fixture = TestBed.createComponent(OrderConfirmationPageComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
