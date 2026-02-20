import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { VendorServiceService } from 'src/app/project/services/vendor-service.service';
import { AdminServiceService } from 'src/app/project/services/admin-service.service';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { Router } from '@angular/router';

/**
 * Data passed to this dialog when opening it.
 * - email: the last logged-in user's email (pre-filled, read-only)
 * - role: 'customer' | 'vendor' | 'admin' — determines which login API to call
 */
export interface ReLoginDialogData {
    email: string;
    role: 'customer' | 'vendor' | 'admin';
}

/**
 * ReLoginDialogComponent
 * 
 * PURPOSE: When a user returns after a long time and their JWT token has expired,
 * this dialog appears instead of silently logging them out. It shows a compact
 * re-login form with the user's email pre-filled (read-only) and asks only for
 * the password.
 * 
 * CANCEL BEHAVIOR: If the user clicks "Cancel", we call logoutAll() to clear all
 * stored user data from localStorage, and redirect to the home page. The backend
 * doesn't need a separate "logout" API call since JWT is stateless — clearing the 
 * token on the client side is sufficient.
 * 
 * RE-LOGIN BEHAVIOR: If the user enters the correct password, we call the /authenticate
 * endpoint, store the new JWT and user data, and close the dialog so the user can
 * continue where they left off.
 */
@Component({
    selector: 'app-re-login-dialog',
    templateUrl: './re-login-dialog.component.html',
    styleUrls: ['./re-login-dialog.component.css']
})
export class ReLoginDialogComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    reLoginForm!: FormGroup;
    hidePassword = true;
    isLoading = false;
    loginError = '';

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<ReLoginDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ReLoginDialogData,
        private customerService: CustomerServiceService,
        private vendorService: VendorServiceService,
        private adminService: AdminServiceService,
        private userState: UserStateService,
        private router: Router,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        // Build the form with the email pre-filled and read-only
        this.reLoginForm = this.fb.group({
            email: [{ value: this.data.email, disabled: true }],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    /**
     * CANCEL BUTTON HANDLER
     * 
     * What happens: 
     * 1. Calls userState.logoutAll() — this clears customer/vendor/admin data from
     *    localStorage AND broadcasts a logout event to other open tabs
     * 2. Closes the dialog with { cancelled: true } result
     * 3. Redirects to the home page
     * 
     * Why we don't call a backend "logout" API:
     * JWT is stateless — the server doesn't store sessions. Clearing the token
     * from the client is enough. The token is already expired anyway.
     */
    onCancel(): void {
        this.userState.logoutAll();
        this.dialogRef.close({ cancelled: true });
        this.router.navigate(['/']);
        this.snackBar.open('You have been logged out.', 'OK', {
            duration: 3000,
            panelClass: ['info-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });
    }

    /**
     * RE-LOGIN SUBMIT HANDLER
     * 
     * What happens:
     * 1. Takes the pre-filled email and the newly typed password
     * 2. Calls the appropriate login API based on the user's role
     * 3. On success: stores the new JWT + user data, closes dialog with success result
     * 4. On error: shows an error message in the dialog
     * 
     * The login API call is the same /authenticate endpoint used in the normal
     * LoginDialogComponent. The role is passed so the backend knows which
     * collection (admin/customer/vendor) to search in.
     */
    onSubmit(): void {
        if (this.reLoginForm.invalid) {
            this.reLoginForm.get('password')?.markAsTouched();
            return;
        }

        this.isLoading = true;
        this.loginError = '';

        const email = this.data.email;
        const password = this.reLoginForm.get('password')?.value;

        switch (this.data.role) {
            case 'customer':
                this.customerService.loginCustomer(email, password)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: (response: any) => this.handleLoginSuccess(response, 'customer'),
                        error: (error: any) => this.handleLoginError(error)
                    });
                break;

            case 'vendor':
                this.vendorService.loginVendor(email, password)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: (response: any) => this.handleLoginSuccess(response, 'vendor'),
                        error: (error: any) => this.handleLoginError(error)
                    });
                break;

            case 'admin':
                this.adminService.loginAdmin(email, password)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: (response: any) => this.handleLoginSuccess(response, 'admin'),
                        error: (error: any) => this.handleLoginError(error)
                    });
                break;
        }
    }

    /**
     * Handles a successful re-login response.
     * 
     * What happens:
     * 1. Validates the response has a user object and JWT
     * 2. Stores the NEW JWT in localStorage (replaces the expired one)
     * 3. Updates the UserStateService with the fresh user data
     * 4. Closes the dialog with { success: true, jwt: newToken } so the
     *    interceptor can retry the failed request with the new token
     */
    private handleLoginSuccess(response: any, role: string): void {
        this.isLoading = false;

        if (!response || !response.user) {
            this.loginError = 'Invalid credentials. Please try again.';
            return;
        }

        // Store new JWT token
        localStorage.setItem('jwt', response.jwt);

        // Update user state based on role
        switch (role) {
            case 'customer':
                this.userState.customer = response.user;
                break;
            case 'vendor':
                this.userState.vendor = response.user;
                break;
            case 'admin':
                this.userState.admin = response.user;
                break;
        }

        this.dialogRef.close({ success: true, jwt: response.jwt });
        this.snackBar.open('Welcome back! Session restored.', 'OK', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });
    }

    /**
     * Handles a failed re-login attempt.
     * Shows the error message in the dialog without closing it,
     * so the user can try again or choose to cancel.
     */
    private handleLoginError(error: any): void {
        this.isLoading = false;
        this.loginError = error?.error?.message || error?.message || 'Incorrect password. Please try again.';
    }

    getPasswordError(): string {
        const field = this.reLoginForm.get('password');
        if (field?.hasError('required')) return 'Password is required';
        if (field?.hasError('minlength')) return 'Password must be at least 6 characters';
        return '';
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
