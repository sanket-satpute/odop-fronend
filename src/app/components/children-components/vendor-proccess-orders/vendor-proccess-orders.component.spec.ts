import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorProccessOrdersComponent } from './vendor-proccess-orders.component';

describe('VendorProccessOrdersComponent', () => {
  let component: VendorProccessOrdersComponent;
  let fixture: ComponentFixture<VendorProccessOrdersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VendorProccessOrdersComponent]
    });
    fixture = TestBed.createComponent(VendorProccessOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
