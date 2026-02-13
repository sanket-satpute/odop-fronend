import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoutDialogForEveryoneComponent } from './logout-dialog-for-everyone.component';

describe('LogoutDialogForEveryoneComponent', () => {
  let component: LogoutDialogForEveryoneComponent;
  let fixture: ComponentFixture<LogoutDialogForEveryoneComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LogoutDialogForEveryoneComponent]
    });
    fixture = TestBed.createComponent(LogoutDialogForEveryoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
