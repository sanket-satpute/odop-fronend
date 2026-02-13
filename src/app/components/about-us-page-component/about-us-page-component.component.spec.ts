import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutUsPageComponentComponent } from './about-us-page-component.component';

describe('AboutUsPageComponentComponent', () => {
  let component: AboutUsPageComponentComponent;
  let fixture: ComponentFixture<AboutUsPageComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AboutUsPageComponentComponent]
    });
    fixture = TestBed.createComponent(AboutUsPageComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
