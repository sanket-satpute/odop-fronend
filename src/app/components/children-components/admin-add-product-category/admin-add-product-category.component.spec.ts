import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAddProductCategoryComponent } from './admin-add-product-category.component';

describe('AdminAddProductCategoryComponent', () => {
  let component: AdminAddProductCategoryComponent;
  let fixture: ComponentFixture<AdminAddProductCategoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminAddProductCategoryComponent]
    });
    fixture = TestBed.createComponent(AdminAddProductCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
