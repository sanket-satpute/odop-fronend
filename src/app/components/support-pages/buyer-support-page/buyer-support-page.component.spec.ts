import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyerSupportPageComponent } from './buyer-support-page.component';

describe('BuyerSupportPageComponent', () => {
  let component: BuyerSupportPageComponent;
  let fixture: ComponentFixture<BuyerSupportPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BuyerSupportPageComponent]
    });
    fixture = TestBed.createComponent(BuyerSupportPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
