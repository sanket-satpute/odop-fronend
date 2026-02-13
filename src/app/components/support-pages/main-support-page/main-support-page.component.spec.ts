import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainSupportPageComponent } from './main-support-page.component';

describe('MainSupportPageComponent', () => {
  let component: MainSupportPageComponent;
  let fixture: ComponentFixture<MainSupportPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MainSupportPageComponent]
    });
    fixture = TestBed.createComponent(MainSupportPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
