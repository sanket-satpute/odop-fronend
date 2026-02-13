import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WishlistDialogComponent } from './wishlist-dialog.component';

describe('WishlistDialogComponent', () => {
  let component: WishlistDialogComponent;
  let fixture: ComponentFixture<WishlistDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WishlistDialogComponent]
    });
    fixture = TestBed.createComponent(WishlistDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
