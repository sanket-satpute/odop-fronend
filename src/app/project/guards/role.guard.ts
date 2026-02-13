import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UserStateService } from '../services/user-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export type UserRole = 'customer' | 'vendor' | 'admin';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private userState: UserStateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Get required roles from route data
    const requiredRoles = route.data['roles'] as UserRole[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      // No roles specified, allow access
      return true;
    }
    
    // Determine current user's role
    const currentRole = this.getCurrentUserRole();
    
    if (!currentRole) {
      // Not logged in
      this.snackBar.open('Please login to access this page', 'Login', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      localStorage.setItem('redirectUrl', state.url);
      return this.router.createUrlTree(['/login']);
    }
    
    // Check if user has required role
    if (requiredRoles.includes(currentRole)) {
      return true;
    }
    
    // User doesn't have required role
    this.snackBar.open('You do not have permission to access this page', 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
    
    // Redirect to appropriate dashboard based on role
    return this.router.createUrlTree([this.getDefaultRouteForRole(currentRole)]);
  }
  
  private getCurrentUserRole(): UserRole | null {
    if (this.userState.customer) {
      return 'customer';
    }
    if (this.userState.vendor) {
      return 'vendor';
    }
    if (this.userState.admin) {
      return 'admin';
    }
    return null;
  }
  
  private getDefaultRouteForRole(role: UserRole): string {
    switch (role) {
      case 'customer':
        return '/customer-dashboard';
      case 'vendor':
        return '/vendor-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/';
    }
  }
}
