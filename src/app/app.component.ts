import { Component, OnInit } from '@angular/core';
import { Admin } from './project/models/admin';
import { Customer } from './project/models/customer';
import { Vendor } from './project/models/vendor';
import { LoadingService, LoadingState } from './project/services/loading.service';
import { UserStateService } from './project/services/user-state.service';
import { LoggerService } from './project/services/logger.service';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ReLoginDialogComponent, ReLoginDialogData } from './components/dialogs/re-login-dialog/re-login-dialog.component';

/**
 * Root application component.
 * 
 * KEY CHANGE: After loading user data from localStorage on app startup,
 * we now proactively check if the JWT token is expired. If yes AND there's
 * a stored user, we immediately show the ReLoginDialog.
 * 
 * WHY PROACTIVE CHECK:
 * Without this, the expired token would only be caught when the user makes
 * their first API call (e.g., navigating to dashboard). That creates a confusing
 * experience — the page starts loading, then suddenly a dialog pops up.
 * 
 * With proactive checking, the dialog appears immediately when the user opens
 * the app — before any page content tries to load. Much cleaner UX.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  GLOBAL_CUSTOMER: Customer | null = null;
  GLOBAL_VENDOR: Vendor | null = null;
  GLOBAL_ADMIN: Admin | null = null;

  loading$: Observable<LoadingState>;

  constructor(
    private loadingService: LoadingService,
    private userStateService: UserStateService,
    private logger: LoggerService,
    private dialog: MatDialog
  ) {
    this.loading$ = this.loadingService.loading$;
  }

  ngOnInit(): void {
    // Load user data from localStorage on app initialization
    this.userStateService.loadUserFromStorage();
    this.logger.info('App initialized, user data loaded from storage');

    // PROACTIVE TOKEN EXPIRY CHECK
    // After loading user from storage, check if the JWT token is expired.
    // If yes → show the re-login dialog immediately so the user can re-authenticate
    // before they try to use any feature that requires authentication.
    this.checkTokenExpiry();
  }

  /**
   * Check if the JWT token is expired and show re-login dialog if needed.
   * 
   * WHAT HAPPENS:
   * 1. UserStateService.isTokenExpired() decodes the JWT and checks the exp claim
   * 2. If expired, we get the stored email and role from localStorage
   * 3. We open the ReLoginDialog with this data
   * 4. If user re-logs in → new JWT is stored, they continue normally
   * 5. If user cancels → logoutAll() is called (by the dialog), user becomes guest
   */
  private checkTokenExpiry(): void {
    if (this.userStateService.isTokenExpired()) {
      const email = this.userStateService.getStoredEmail();
      const role = this.userStateService.getStoredRole();

      if (email && role) {
        this.logger.info('JWT token expired on app load, showing re-login dialog');

        // Small delay to let the app fully render before showing the dialog
        setTimeout(() => {
          this.dialog.open(ReLoginDialogComponent, {
            width: '440px',
            maxWidth: '95vw',
            disableClose: true,
            data: { email, role } as ReLoginDialogData
          });
        }, 500);
      } else {
        // No stored user info → just clean up the expired token
        this.logger.info('JWT token expired but no stored user info, clearing data');
        this.userStateService.logoutAll();
      }
    }
  }
}