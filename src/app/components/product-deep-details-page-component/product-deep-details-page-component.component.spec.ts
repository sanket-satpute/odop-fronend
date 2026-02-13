import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductDeepDetailsPageComponentComponent } from './product-deep-details-page-component.component';

describe('ProductDeepDetailsPageComponentComponent', () => {
  let component: ProductDeepDetailsPageComponentComponent;
  let fixture: ComponentFixture<ProductDeepDetailsPageComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProductDeepDetailsPageComponentComponent]
    });
    fixture = TestBed.createComponent(ProductDeepDetailsPageComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
