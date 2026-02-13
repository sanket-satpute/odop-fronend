import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerSupportPageComponent } from './seller-support-page.component';

describe('SellerSupportPageComponent', () => {
  let component: SellerSupportPageComponent;
  let fixture: ComponentFixture<SellerSupportPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SellerSupportPageComponent]
    });
    fixture = TestBed.createComponent(SellerSupportPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
