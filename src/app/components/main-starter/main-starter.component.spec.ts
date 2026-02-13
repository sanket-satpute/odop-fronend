import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainStarterComponent } from './main-starter.component';

describe('MainStarterComponent', () => {
  let component: MainStarterComponent;
  let fixture: ComponentFixture<MainStarterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MainStarterComponent]
    });
    fixture = TestBed.createComponent(MainStarterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
