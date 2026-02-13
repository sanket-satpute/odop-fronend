import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangePasswordForEveryoneComponent } from './change-password-for-everyone.component';

describe('ChangePasswordForEveryoneComponent', () => {
  let component: ChangePasswordForEveryoneComponent;
  let fixture: ComponentFixture<ChangePasswordForEveryoneComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChangePasswordForEveryoneComponent]
    });
    fixture = TestBed.createComponent(ChangePasswordForEveryoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
