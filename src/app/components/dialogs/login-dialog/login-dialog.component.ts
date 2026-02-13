import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { RegisterDialogComponent } from './../register-dialog/register-dialog.component';
import { AdminServiceService } from 'src/app/project/services/admin-service.service';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { VendorServiceService } from 'src/app/project/services/vendor-service.service';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { OtpService } from 'src/app/project/services/otp.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SocialAuthService, SocialLoginResponse } from 'src/app/services/social-auth.service';
import { ErrorHandlingService } from 'src/app/project/services/error-handling.service';
import { LoadingService } from 'src/app/project/services/loading.service';


export interface LoginData {
  role: string;
  email: string;
  password: string;
  adminCode?: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.css']
})
export class LoginDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Social login state
  socialLoginLoading = false;
  googleButtonRendered = false;

  constructor(
      private fb: FormBuilder,
      public dialogRef: MatDialogRef<LoginDialogComponent>,
      private dialog: MatDialog,
      private router: Router,
      private adminService: AdminServiceService,
      private customerService: CustomerServiceService,
      private vendorService: VendorServiceService,
      private userState: UserStateService,
      private otpService: OtpService,
      private snackBar: MatSnackBar,
      private socialAuthService: SocialAuthService,
      private errorHandler: ErrorHandlingService,
      private loadingService: LoadingService
    ) {
      this.loginForm = this.fb.group({});
    }

  closeDialog(): void {
    this.dialogRef.close();
  }

  loginForm: FormGroup;
  selectedRole: string = 'customer';
  hidePassword: boolean = true;
  isLoading: boolean = false;
  loginError: string = '';
  showForgotPassword: boolean = false;

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm(): void {
    const baseForm = {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    };

    if (this.selectedRole === 'admin') {
      this.loginForm = this.fb.group({
        ...baseForm,
        adminCode: ['', [Validators.required, Validators.minLength(6)]]
      });
    } else {
      this.loginForm = this.fb.group(baseForm);
    }

    // Clear any previous errors when switching roles
    this.loginError = '';
  }

  onRoleChange(): void {
    this.buildForm();
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (field?.hasError('minlength')) {
      const requiredLength = field.errors?.['minlength']?.requiredLength;
      return `${this.getFieldDisplayName(fieldName)} must be at least ${requiredLength} characters`;
    }
    
    return '';
  }

  getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      email: 'Email',
      password: 'Password',
      adminCode: 'Admin Code'
    };
    
    return displayNames[fieldName] || fieldName;
  }

  // onSubmit(): void {
  //   if (this.loginForm.valid) {
  //     this.isLoading = true;
  //     this.loginError = '';
      
  //     const loginData: LoginData = {
  //       role: this.selectedRole,
  //       email: this.loginForm.get('email')?.value,
  //       password: this.loginForm.get('password')?.value,
  //       rememberMe: this.loginForm.get('rememberMe')?.value || false
  //     };

  //     if (this.selectedRole === 'admin') {
  //       loginData.adminCode = this.loginForm.get('adminCode')?.value;
  //     }
      
      // Simulate API call - basic
      // setTimeout(() => {
      //   // Simulate different responses based on role
      //   const isSuccess = this.simulateLogin(loginData);
        
      //   if (isSuccess) {
      //     console.log('Login successful:', loginData);
      //     this.dialogRef.close({ success: true, data: loginData });
      //   } else {
      //     this.loginError = this.getLoginErrorMessage();
      //     this.isLoading = false;
      //   }
      // }, 1500);
  //   } else {
  //     // Mark all fields as touched to show validation errors
  //     Object.keys(this.loginForm.controls).forEach(key => {
  //       this.loginForm.get(key)?.markAsTouched();
  //     });
  //   }
  // }

  private simulateLogin(loginData: LoginData): boolean {
    // This is just for demonstration - replace with actual API call
    // Simulate success rate of 80%
    return Math.random() > 0.2;
  }

  private getLoginErrorMessage(): string {
    const errorMessages = {
      customer: 'Invalid email or password. Please check your credentials.',
      vendor: 'Invalid vendor credentials. Please verify your shop email and password.',
      admin: 'Invalid admin credentials or authorization code. Please contact system administrator.'
    };
    
    return errorMessages[this.selectedRole as keyof typeof errorMessages] || 'Login failed. Please try again.';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = '';

      const loginData: LoginData = {
        role: this.selectedRole,
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value,
        rememberMe: this.loginForm.get('rememberMe')?.value || false
      };

      if (this.selectedRole === 'admin') {
        loginData.adminCode = this.loginForm.get('adminCode')?.value;
      }

      // Call appropriate service based on role
      switch (this.selectedRole) {
        case 'customer':
          this.customerService.loginCustomer(loginData.email, loginData.password).subscribe({
            next: (response: any) => {
              if (!response || !response.user) {
                this.loginError = 'Invalid email or password. Please try again.';
                this.isLoading = false;
                return;
              }
              this.userState.customer = response.user;
              localStorage.setItem("jwt", response.jwt);
              this.dialogRef.close({ success: true, role: 'customer', user: response.user });
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('Customer login error:', error);
              this.loginError = error?.error?.message || error?.message || this.getLoginErrorMessage();
              this.isLoading = false;
            }
          });
          break;

        case 'vendor':
          this.vendorService.loginVendor(loginData.email, loginData.password).subscribe({
            next: (response: any) => {
              if (!response || !response.user) {
                this.loginError = 'Invalid vendor credentials. Please try again.';
                this.isLoading = false;
                return;
              }
              this.userState.vendor = response.user;
              localStorage.setItem("jwt", response.jwt);
              this.dialogRef.close({ success: true, role: 'vendor', user: response.user });
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('Vendor login error:', error);
              this.loginError = error?.error?.message || error?.message || this.getLoginErrorMessage();
              this.isLoading = false;
            }
          });
          break;

        case 'admin':
          this.adminService.loginAdmin(loginData.email, loginData.password).subscribe({
            next: (response: any) => {
              if (!response || !response.user) {
                this.loginError = 'Invalid admin credentials. Please try again.';
                this.isLoading = false;
                return;
              }
              this.userState.admin = response.user;
              localStorage.setItem("jwt", response.jwt);
              this.dialogRef.close({ success: true, role: 'admin', user: response.user });
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('Admin login error:', error);
              this.loginError = error?.error?.message || error?.message || this.getLoginErrorMessage();
              this.isLoading = false;
            }
          });
          break;
      }
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  onForgotPassword(): void {
    this.showForgotPassword = true;
  }

  sendPasswordReset(): void {
    const email = this.loginForm.get('email')?.value;
    if (email && this.loginForm.get('email')?.valid) {
      this.isLoading = true;
      
      // Simulate password reset request
      // In production, this would call a backend endpoint
      // that sends a reset link/OTP to the user's email
      setTimeout(() => {
        this.isLoading = false;
        this.showForgotPassword = false;
        this.snackBar.open(
          'If an account exists with this email, a password reset link will be sent.', 
          'OK', 
          { 
            duration: 5000, 
            panelClass: ['info-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          }
        );
      }, 1500);
    } else {
      this.snackBar.open(
        'Please enter a valid email address', 
        'Close', 
        { 
          duration: 3000, 
          panelClass: ['warning-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );
    }
  }

  openRegisterDialog(): void {
    this.dialogRef.close({ openRegister: true });
    const dialogRe = this.dialog.open(RegisterDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true
    });
  }

  // ==================== LIFECYCLE HOOKS ====================

  ngAfterViewInit(): void {
    // Render Google Sign-In button for customer role
    setTimeout(() => {
      this.renderSocialButtons();
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private renderSocialButtons(): void {
    if (this.selectedRole === 'customer' && !this.googleButtonRendered) {
      this.socialAuthService.renderGoogleButton('google-signin-dialog-btn');
      this.googleButtonRendered = true;
    }
  }

  // ==================== SOCIAL LOGIN ====================

  /**
   * Sign in with Google
   */
  loginWithGoogle(): void {
    this.socialLoginLoading = true;
    this.loadingService.startLoading('Signing in with Google...');
    
    this.socialAuthService.signInWithGoogle()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingService.stopLoading();
          this.socialLoginLoading = false;
        })
      )
      .subscribe({
        next: (response: SocialLoginResponse) => {
          this.handleSocialLoginSuccess(response);
        },
        error: (error: any) => {
          this.errorHandler.showErrorNotification('Google sign-in failed. Please try again.');
          console.error('Google login error:', error);
        }
      });
  }

  /**
   * Sign in with Facebook
   */
  loginWithFacebook(): void {
    this.socialLoginLoading = true;
    this.loadingService.startLoading('Signing in with Facebook...');
    
    this.socialAuthService.signInWithFacebook()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingService.stopLoading();
          this.socialLoginLoading = false;
        })
      )
      .subscribe({
        next: (response: SocialLoginResponse) => {
          this.handleSocialLoginSuccess(response);
        },
        error: (error: any) => {
          this.errorHandler.showErrorNotification('Facebook sign-in failed. Please try again.');
          console.error('Facebook login error:', error);
        }
      });
  }

  /**
   * Handle successful social login
   */
  private handleSocialLoginSuccess(response: SocialLoginResponse): void {
    if (response && response.token) {
      localStorage.setItem('jwt', response.token);
      
      // Set user based on type and close dialog
      if (response.userType === 'CUSTOMER') {
        this.userState.customer = response.user;
        this.dialogRef.close({ success: true, role: 'customer', user: response.user, social: true });
        this.snackBar.open(
          response.newUser ? 'Welcome! Account created successfully.' : 'Login successful!',
          'Close',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.router.navigateByUrl('/customer-dashboard');
      } else if (response.userType === 'VENDOR') {
        this.userState.vendor = response.user;
        this.dialogRef.close({ success: true, role: 'vendor', user: response.user, social: true });
        this.snackBar.open('Login successful!', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
        this.router.navigateByUrl('/vendor-dashboard');
      } else {
        this.dialogRef.close({ success: true, social: true });
        this.snackBar.open('Login successful!', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
        this.router.navigateByUrl('/');
      }
    } else {
      this.errorHandler.showErrorNotification('Login failed. Please try again.');
    }
  }

}
