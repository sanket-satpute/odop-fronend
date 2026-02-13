import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UserStateService } from '../services/user-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private userState: UserStateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Check if any user is logged in
    const isLoggedIn = this.userState.customer !== null || 
                       this.userState.vendor !== null || 
                       this.userState.admin !== null;
    
    if (isLoggedIn) {
      return true;
    }
    
    // Not logged in - show message and redirect to login
    this.snackBar.open('Please login to access this page', 'Login', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.router.navigate(['/login']);
    });
    
    // Store the attempted URL for redirecting after login
    localStorage.setItem('redirectUrl', state.url);
    
    return this.router.createUrlTree(['/login']);
  }
}
