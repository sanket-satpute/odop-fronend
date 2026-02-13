import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountSettingsPageComponentComponent } from './account-settings-page-component.component';

describe('AccountSettingsPageComponentComponent', () => {
  let component: AccountSettingsPageComponentComponent;
  let fixture: ComponentFixture<AccountSettingsPageComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountSettingsPageComponentComponent]
    });
    fixture = TestBed.createComponent(AccountSettingsPageComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
