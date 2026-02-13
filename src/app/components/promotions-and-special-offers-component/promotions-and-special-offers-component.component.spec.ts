import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromotionsAndSpecialOffersComponentComponent } from './promotions-and-special-offers-component.component';

describe('PromotionsAndSpecialOffersComponentComponent', () => {
  let component: PromotionsAndSpecialOffersComponentComponent;
  let fixture: ComponentFixture<PromotionsAndSpecialOffersComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PromotionsAndSpecialOffersComponentComponent]
    });
    fixture = TestBed.createComponent(PromotionsAndSpecialOffersComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
