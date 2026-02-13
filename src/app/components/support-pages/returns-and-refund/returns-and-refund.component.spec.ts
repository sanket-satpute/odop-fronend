import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnsAndRefundComponent } from './returns-and-refund.component';

describe('ReturnsAndRefundComponent', () => {
  let component: ReturnsAndRefundComponent;
  let fixture: ComponentFixture<ReturnsAndRefundComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReturnsAndRefundComponent]
    });
    fixture = TestBed.createComponent(ReturnsAndRefundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
