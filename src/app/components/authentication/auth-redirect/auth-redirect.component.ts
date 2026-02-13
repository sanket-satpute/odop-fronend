import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from '../../dialogs/login-dialog/login-dialog.component';
import { RegisterDialogComponent } from '../../dialogs/register-dialog/register-dialog.component';

/**
 * AuthRedirectComponent
 * 
 * This component handles legacy /login and /register routes by:
 * 1. Redirecting to the home page
 * 2. Opening the appropriate dialog (login or register)
 * 
 * This provides backward compatibility while consolidating auth into dialogs.
 */
@Component({
  selector: 'app-auth-redirect',
  template: `
    <div class="redirect-container">
      <div class="loading-spinner">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Redirecting...</p>
      </div>
    </div>
  `,
  styles: [`
    .redirect-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    .loading-spinner {
      text-align: center;
    }
    .loading-spinner p {
      margin-top: 1rem;
      color: #6c757d;
      font-size: 0.95rem;
    }
  `]
})
export class AuthRedirectComponent implements OnInit {
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Get the current route to determine which dialog to open
    const currentUrl = this.router.url;
    const isLoginRoute = currentUrl.includes('/login');
    const isRegisterRoute = currentUrl.includes('/register');
    
    // Get any route params (for tab selection like /login/1 for vendor)
    const tabId = this.route.snapshot.paramMap.get('id');
    
    // Navigate to home first
    this.router.navigate(['/']).then(() => {
      // Small delay to ensure navigation completes
      setTimeout(() => {
        if (isLoginRoute) {
          this.openLoginDialog(tabId);
        } else if (isRegisterRoute) {
          this.openRegisterDialog(tabId);
        }
      }, 100);
    });
  }

  private openLoginDialog(tabId: string | null): void {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: false,
      panelClass: 'auth-dialog',
      data: {
        activeTab: this.getTabName(tabId)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.openRegister) {
        this.openRegisterDialog(null);
      }
    });
  }

  private openRegisterDialog(tabId: string | null): void {
    this.dialog.open(RegisterDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      disableClose: false,
      panelClass: 'auth-dialog',
      data: {
        activeTab: this.getTabName(tabId)
      }
    });
  }

  private getTabName(tabId: string | null): string {
    switch (tabId) {
      case '1':
        return 'vendor';
      case '2':
        return 'admin';
      default:
        return 'customer';
    }
  }
}
