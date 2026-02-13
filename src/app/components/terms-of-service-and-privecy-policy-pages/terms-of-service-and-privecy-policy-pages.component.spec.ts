import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsOfServiceAndPrivecyPolicyPagesComponent } from './terms-of-service-and-privecy-policy-pages.component';

describe('TermsOfServiceAndPrivecyPolicyPagesComponent', () => {
  let component: TermsOfServiceAndPrivecyPolicyPagesComponent;
  let fixture: ComponentFixture<TermsOfServiceAndPrivecyPolicyPagesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TermsOfServiceAndPrivecyPolicyPagesComponent]
    });
    fixture = TestBed.createComponent(TermsOfServiceAndPrivecyPolicyPagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
