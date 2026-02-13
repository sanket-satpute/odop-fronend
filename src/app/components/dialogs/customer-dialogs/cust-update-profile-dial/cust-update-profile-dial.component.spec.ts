import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustUpdateProfileDialComponent } from './cust-update-profile-dial.component';

describe('CustUpdateProfileDialComponent', () => {
  let component: CustUpdateProfileDialComponent;
  let fixture: ComponentFixture<CustUpdateProfileDialComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustUpdateProfileDialComponent]
    });
    fixture = TestBed.createComponent(CustUpdateProfileDialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
