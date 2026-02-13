import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerSettingsComponent } from './customer-settings.component';

describe('CustomerSettingsComponent', () => {
  let component: CustomerSettingsComponent;
  let fixture: ComponentFixture<CustomerSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomerSettingsComponent]
    });
    fixture = TestBed.createComponent(CustomerSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
