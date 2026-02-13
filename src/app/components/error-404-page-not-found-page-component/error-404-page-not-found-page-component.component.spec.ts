import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Error404PageNotFoundPageComponentComponent } from './error-404-page-not-found-page-component.component';

describe('Error404PageNotFoundPageComponentComponent', () => {
  let component: Error404PageNotFoundPageComponentComponent;
  let fixture: ComponentFixture<Error404PageNotFoundPageComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [Error404PageNotFoundPageComponentComponent]
    });
    fixture = TestBed.createComponent(Error404PageNotFoundPageComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
