import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserStateService } from '../services/user-state.service';

@Injectable({
  providedIn: 'root'
})
export class VendorShoppingBlockGuard implements CanActivate {

  constructor(
    private userState: UserStateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.userState.vendor && !this.userState.customer && !this.userState.admin) {
      this.snackBar.open('Vendor account uses dashboard tools instead of customer shopping pages.', 'Go to Dashboard', {
        duration: 3500,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }).onAction().subscribe(() => {
        this.router.navigate(['/vendor-dashboard']);
      });

      return this.router.createUrlTree(['/vendor-dashboard']);
    }

    return true;
  }
}
