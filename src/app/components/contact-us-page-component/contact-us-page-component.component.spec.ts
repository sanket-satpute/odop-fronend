import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactUsPageComponentComponent } from './contact-us-page-component.component';

describe('ContactUsPageComponentComponent', () => {
  let component: ContactUsPageComponentComponent;
  let fixture: ComponentFixture<ContactUsPageComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ContactUsPageComponentComponent]
    });
    fixture = TestBed.createComponent(ContactUsPageComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
