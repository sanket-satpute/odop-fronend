import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewProductComponentComponent } from './add-new-product-component.component';

describe('AddNewProductComponentComponent', () => {
  let component: AddNewProductComponentComponent;
  let fixture: ComponentFixture<AddNewProductComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddNewProductComponentComponent]
    });
    fixture = TestBed.createComponent(AddNewProductComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
