import { Component, Inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { LoginDialogComponent } from './../login-dialog/login-dialog.component';
import { AdminServiceService } from 'src/app/project/services/admin-service.service';
import { VendorServiceService } from 'src/app/project/services/vendor-service.service';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { ErrorHandlingService } from '../../../project/services/error-handling.service';
import { LoadingService } from '../../../project/services/loading.service';
import { OtpService, OtpPurpose } from '../../../project/services/otp.service';
import { EmailService, WelcomeEmailRequest } from '../../../project/services/email.service';
import { SocialAuthService, SocialLoginResponse } from 'src/app/services/social-auth.service';
import { UserStateService } from 'src/app/project/services/user-state.service';


export interface RegistrationData {
  role: string;
  [key: string]: any;
}

@Component({
  selector: 'app-register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./register-dialog.component.css']
})
export class RegisterDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // OTP verification state
  isPhoneVerified: boolean = false;
  showOtpInput: boolean = false;
  otpValue: string = '';
  isOtpLoading: boolean = false;
  resendTimer: number = 0;
  canResend: boolean = true;

  // Social sign-up state
  socialLoginLoading = false;
  googleButtonRendered = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RegisterDialogComponent>,
    private dialog: MatDialog,
    private router: Router,
    private customerService: CustomerServiceService,
    private vendorService: VendorServiceService,
    private adminService: AdminServiceService,
    private errorService: ErrorHandlingService,
    private loadingService: LoadingService,
    private otpService: OtpService,
    private emailService: EmailService,
    private socialAuthService: SocialAuthService,
    private userStateService: UserStateService
  ) {
    this.buildForm(); // Initialize form immediately in constructor
    
    // Subscribe to OTP timer
    this.otpService.resendTimer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(time => this.resendTimer = time);
    
    this.otpService.canResend$
      .pipe(takeUntil(this.destroy$))
      .subscribe(canResend => this.canResend = canResend);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  // vendor
  showSocialSection: boolean = false;

  registerForm!: FormGroup;
  selectedRole: string = 'customer';
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  isLoading: boolean = false;

  productCategories = [
    'Electronics',
    'Fashion & Apparel',
    'Home & Garden',
    'Sports & Outdoors',
    'Books & Media',
    'Food & Beverages',
    'Health & Beauty',
    'Automotive',
    'Toys & Games',
    'Handicrafts'
  ];

  ngOnInit(): void {
    // Default to vendor if passed
    if (this.data?.activeTab === 'vendor') {
      this.selectedRole = 'vendor';  // assuming 0 = Customer, 1 = Vendor
    }
    this.onRoleChange();
  }

  onTermsChange(event: any) {
    const isChecked = event.checked;
    this.registerForm.get('termsAndServiceAgreement')?.setValue(isChecked);
    this.registerForm.get('termsAndServiceAgreement')?.markAsTouched();
  }


  buildForm(): void {
    const baseValidators = {
      emailAddress: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      // Terms acceptance
      termsAndServiceAgreement: [false, [Validators.requiredTrue]]
    };

    switch (this.selectedRole) {
      case 'customer':
        this.registerForm = this.fb.group({
          ...baseValidators,
          fullName: ['', [Validators.required, Validators.minLength(2)]],
          dateOfBirth: [''],
          gender: [''],
          emailAddress: ['', [Validators.required, Validators.email]],
          contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
          password: ['', [Validators.required, Validators.minLength(8)]],
          confirmPassword: ['', [Validators.required]],
          address: ['', [Validators.required, Validators.minLength(10)]],
          city: ['', [Validators.required]],
          state: ['', [Validators.required]],
          pinCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
          preferredLanguage: [''],
          communicationPreference: [''],
          newsletterSubscribed: [false],
          profilePicturePath: [''],
        }, { validators: this.passwordMatchValidator });
        break;

      case 'vendor':
        this.registerForm = this.fb.group({
          // Existing fields
          shoppeeName: ['', [Validators.required, Validators.minLength(2)]],
          shopkeeperName: ['', [Validators.required, Validators.minLength(2)]],
          emailAddress: ['', [Validators.required, Validators.email]],
          contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
          locationDistrict: ['', [Validators.required]],
          productCategories: ['', [Validators.required]],
          taxIdentificationNumber: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
          shopImage: [''],
          
          // New Business Info fields
          password: ['', [Validators.required, Validators.minLength(8)]],
          confirmPassword: ['', [Validators.required]],
          websiteUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
          businessDescription: ['', [Validators.required, Validators.minLength(20)]],
          
          // New Location Info fields
          locationState: ['', [Validators.required]],
          pinCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
          shoppeeAddress: ['', [Validators.required, Validators.minLength(10)]],
          
          // New Operations fields
          operatingHours: ['', [Validators.required]],
          deliveryAvailable: [false],
          deliveryRadiusInKm: [''],
          
          // New Social Media fields (optional)
          facebookUrl: ['', [Validators.pattern(/^https?:\/\/(www\.)?facebook\.com\/.+/)]],
          instagramUrl: ['', [Validators.pattern(/^https?:\/\/(www\.)?instagram\.com\/.+/)]],
          twitterUrl: ['', [Validators.pattern(/^https?:\/\/(www\.)?twitter\.com\/.+/)]],

          termsAndServiceAgreement: [false, [Validators.requiredTrue]],
        }, { validators: this.passwordMatchValidator });
        break;
        
      case 'admin':
        this.registerForm = this.fb.group({
          ...baseValidators,
          fullName: ['', [Validators.required, Validators.minLength(2)]],
          emailAddress: ['', [Validators.required, Validators.email]],
          contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
          positionAndRole: ['', [Validators.required]],
          authorizationKey: ['', [Validators.required, Validators.minLength(6)]],
          password: ['', [Validators.required, Validators.minLength(6)]],
          confirmPassword: ['', [Validators.required]],
          profilePicturePath: [''], // optional file upload
        }, { validators: this.passwordMatchValidator });
        break;

    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      delete confirmPassword.errors?.['passwordMismatch'];
      confirmPassword.updateValueAndValidity();
    }
    
    return null;
  }

  onRoleChange(): void {
    const previousValues = this.registerForm.value;
    this.buildForm();
    this.registerForm.patchValue(previousValues);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (this.selectedRole === 'vendor') {
        this.registerForm.patchValue({ shopImage: file });
      } else if (this.selectedRole === 'admin') {
        this.registerForm.patchValue({ profilePicturePath: file });
      }
    }
  }


  getErrorMessage(fieldName: string): string {
      const field = this.registerForm.get(fieldName);
      
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
      
      if (field?.hasError('pattern')) {
        if (fieldName === 'contactNumber') {
          return 'Please enter a valid 10-digit phone number';
        }
        if (fieldName === 'pinCode') {
          return 'Please enter a valid 6-digit pincode';
        }
        if (fieldName === 'taxIdentificationNumber') {
          return 'Please enter a valid GST number';
        }
        if (fieldName === 'websiteUrl') {
          return 'Please enter a valid website URL (starting with http:// or https://)';
        }
        if (fieldName.includes('Url')) {
          return 'Please enter a valid URL';
        }
      }
      
      if (field?.hasError('min')) {
        return 'Delivery radius must be at least 1 km';
      }
      
      if (field?.hasError('requiredTrue')) {
        return 'You must accept the terms and conditions';
      }
      
      if (field?.hasError('passwordMismatch')) {
        return 'Passwords do not match';
      }
      
      return '';
    }

    getFieldDisplayName(fieldName: string): string {
      const displayNames: { [key: string]: string } = {
      fullName: 'Full Name',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      emailAddress: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      contactNumber: 'Phone Number',
      address: 'Address',
      city: 'City',
      state: 'State',
      pinCode: 'PIN Code',
      preferredLanguage: 'Preferred Language',
      communicationPreference: 'Communication Preference',
      newsletterSubscribed: 'Newsletter Subscription',
      profilePicturePath: 'Profile Picture',
      shoppeeName: 'Shop Name',
      shopkeeperName: 'Owner Name',
      locationDistrict: 'District',
      productCategories: 'Product Category',
      taxIdentificationNumber: 'GST Number',
      adminCode: 'Admin Code',
      websiteUrl: 'Website URL',
      businessDescription: 'Business Description',
      locationState: 'State',
      shoppeeAddress: 'Shop Address',
      operatingHours: 'Operating Hours',
      deliveryRadiusInKm: 'Delivery Radius',
      facebookUrl: 'Facebook URL',
      instagramUrl: 'Instagram URL',
      twitterUrl: 'Twitter URL',
      termsAndServiceAgreement: 'Terms Acceptance',
      authorizationKey: 'Authorization Key',
      positionAndRole: 'Position and Role',
    };

    return displayNames[fieldName] || fieldName;
  }

  customer: any = {};
  vendor: any = {};
  admin: any = {};

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;

      const formData: RegistrationData = {
        role: this.selectedRole,
        ...this.registerForm.value,
      };

      // Remove confirmPassword before submission
      delete formData['confirmPassword'];

      if (this.selectedRole === 'customer') {
        const { emailAddress, contactNumber } = formData;
        const profileImageFile = this.registerForm.get('profilePicturePath')?.value;

        this.loadingService.startLoading('Checking if customer exists...');

        // Step 1: Check if customer already exists
        this.customerService.checkCustomerExists(emailAddress, contactNumber)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (exists: boolean) => {
              if (exists) {
                this.loadingService.stopLoading();
                this.errorService.showErrorNotification("An account already exists with this email or contact number.");
                return;
              }

              // ✅ Step 2: Prepare FormData with all fields
              const formDataToSend = new FormData();
              
              // Required fields from the backend
              const requiredFields = [
                'fullName',
                'emailAddress',
                'contactNumber',
                'address',
                'city',
                'state',
                'pinCode',
                'password'
              ];

              // Add all required fields
              requiredFields.forEach(field => {
                if (formData[field] !== null && formData[field] !== undefined) {
                  // Special handling for contactNumber to ensure it's a number
                  if (field === 'contactNumber') {
                    formDataToSend.append(field, formData[field].toString().replace(/\D/g, ''));
                  } else {
                    formDataToSend.append(field, formData[field]);
                  }
                }
              });

              this.loadingService.startLoading('Creating your account...');

              // Step 3: Register customer
              this.customerService.registerCustomer(this.registerForm.value)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (res) => {
                    this.loadingService.resetLoading();
                    
                    // Send welcome email asynchronously
                    const welcomeRequest: WelcomeEmailRequest = {
                      email: this.registerForm.get('emailAddress')?.value,
                      name: this.registerForm.get('fullName')?.value,
                      userType: 'customer'
                    };
                    this.emailService.sendWelcomeEmailAsync(welcomeRequest).subscribe({
                      next: () => console.log('Welcome email sent'),
                      error: (err) => console.error('Failed to send welcome email', err)
                    });
                    
                    this.errorService.showSuccessNotification("Registration successful! Welcome aboard!");
                    this.dialogRef.close(res);
                  },
                  error: (err) => {
                    this.loadingService.stopLoading();
                    this.errorService.handleError(err);
                  }
                });
            },
            error: (error) => {
              this.loadingService.stopLoading();
              this.errorService.handleError(error);
            }
          });
      } else if (this.selectedRole === 'vendor') {
          const profileImageFile = this.registerForm.get('shopImage')?.value;

          const formDataToSend = new FormData();
          
          Object.entries(this.registerForm.value).forEach(([key, value]) => {
            if (key !== 'confirmPassword' && key !== 'shopImage') {
              if (key === 'productCategories' && Array.isArray(value)) {
                formDataToSend.append(key, value.join(','));
              } else if (typeof value === 'boolean') {
                formDataToSend.append(key, value.toString()); // convert boolean to string
              } else if (value !== null && value !== undefined) {
                formDataToSend.append(key, value.toString());
              }
            }
          });

          // Attach shop image if present
          if (profileImageFile) {
            formDataToSend.append('shopImage', profileImageFile);
          }

          this.loadingService.startLoading('Registering vendor account...');
          
          // Submit form data
          this.vendorService.registerVendor(this.registerForm.value)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (res) => {
                this.loadingService.resetLoading();
                
                // Send welcome email asynchronously to vendor
                const welcomeRequest: WelcomeEmailRequest = {
                  email: this.registerForm.get('emailAddress')?.value,
                  name: this.registerForm.get('shopkeeperName')?.value || this.registerForm.get('shoppeeName')?.value,
                  userType: 'vendor'
                };
                this.emailService.sendWelcomeEmailAsync(welcomeRequest).subscribe({
                  next: () => console.log('Vendor welcome email sent'),
                  error: (err) => console.error('Failed to send vendor welcome email', err)
                });
                
                this.errorService.showSuccessNotification("Vendor registration successful!");
                this.dialogRef.close(res);
              },
              error: (err) => {
                this.loadingService.stopLoading();
                this.errorService.handleError(err);
              }
            });
      } else if (this.selectedRole === 'admin') {
        const { emailAddress, authorizationKey } = formData;
        const profileImageFile = this.registerForm.get('profilePicturePath')?.value;

        this.loadingService.startLoading('Checking authorization...');

        this.adminService.checkAdminExists(emailAddress, authorizationKey)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (exists: boolean) => {
              if (exists) {
                this.loadingService.stopLoading();
                this.errorService.showErrorNotification("An admin account already exists with this email or authorization key.");
                return;
              }

              const formDataToSend = new FormData();

              // Add all fields except sensitive ones
              Object.entries(this.registerForm.value).forEach(([key, value]) => {
                if (key !== 'confirmPassword' && key !== 'profilePicturePath') {
                  if (value !== null && value !== undefined) {
                    formDataToSend.append(key, value.toString());
                  }
                }
              });

              // Append profile picture if provided
              if (profileImageFile) {
                formDataToSend.append('profilePicturePath', profileImageFile);
              }

              this.loadingService.startLoading('Creating admin account...');

              this.adminService.registerAdmin(this.registerForm.value)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
              next: (res) => {
                this.loadingService.resetLoading();
                this.errorService.showSuccessNotification("Admin registration successful!");
                this.dialogRef.close(res);
              },
                  error: (err) => {
                    this.loadingService.stopLoading();
                    this.errorService.handleError(err);
                  }
                });
            },
            error: (error) => {
              this.loadingService.stopLoading();
              this.errorService.handleError(error);
            }
          });
      }


    } else {
      // Mark all fields as touched for validation
      Object.entries(this.registerForm.controls).forEach(([key, control]) => {
        control.markAsTouched();
      });
      this.errorService.showErrorNotification("Please fill out all required fields correctly.");
    }
  }

  // ============== OTP VERIFICATION METHODS ==============

  /**
   * Send OTP to phone number for verification
   */
  sendOtp(): void {
    const contactNumber = this.registerForm.get('contactNumber')?.value;
    
    if (!contactNumber || contactNumber.length !== 10) {
      this.errorService.showErrorNotification('Please enter a valid 10-digit phone number');
      return;
    }

    this.isOtpLoading = true;
    
    const purpose: OtpPurpose = 'REGISTRATION';
    
    this.otpService.sendOtp({
      phoneNumber: contactNumber,
      purpose: purpose
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isOtpLoading = false;
          if (response.success) {
            this.showOtpInput = true;
            this.errorService.showSuccessNotification('OTP sent to your phone number');
          } else {
            this.errorService.showErrorNotification(response.message || 'Failed to send OTP');
          }
        },
        error: (err) => {
          this.isOtpLoading = false;
          this.errorService.showErrorNotification('Failed to send OTP. Please try again.');
        }
      });
  }

  /**
   * Resend OTP after cooldown
   */
  resendOtp(): void {
    if (!this.canResend) return;
    
    const contactNumber = this.registerForm.get('contactNumber')?.value;
    const purpose: OtpPurpose = 'REGISTRATION';
    
    this.isOtpLoading = true;
    
    this.otpService.resendOtp({
      phoneNumber: contactNumber,
      purpose: purpose
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isOtpLoading = false;
          if (response.success) {
            this.errorService.showSuccessNotification('OTP resent successfully');
          } else {
            this.errorService.showErrorNotification(response.message || 'Failed to resend OTP');
          }
        },
        error: (err) => {
          this.isOtpLoading = false;
          this.errorService.showErrorNotification('Failed to resend OTP. Please try again.');
        }
      });
  }

  /**
   * Verify OTP entered by user
   */
  verifyOtp(): void {
    if (!this.otpValue || this.otpValue.length !== 6) {
      this.errorService.showErrorNotification('Please enter a valid 6-digit OTP');
      return;
    }

    const contactNumber = this.registerForm.get('contactNumber')?.value;
    const purpose: OtpPurpose = 'REGISTRATION';
    
    this.isOtpLoading = true;
    
    this.otpService.verifyOtp({
      phoneNumber: contactNumber,
      otp: this.otpValue,
      purpose: purpose
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isOtpLoading = false;
          if (response.success) {
            this.isPhoneVerified = true;
            this.showOtpInput = false;
            this.errorService.showSuccessNotification('Phone number verified successfully!');
          } else {
            this.errorService.showErrorNotification(response.message || 'Invalid OTP. Please try again.');
          }
        },
        error: (err) => {
          this.isOtpLoading = false;
          this.errorService.showErrorNotification('Failed to verify OTP. Please try again.');
        }
      });
  }

  /**
   * Cancel OTP verification and go back
   */
  cancelOtpVerification(): void {
    this.showOtpInput = false;
    this.otpValue = '';
  }

  /**
   * Handle OTP input change
   */
  onOtpChange(value: string): void {
    // Only allow digits
    this.otpValue = value.replace(/\D/g, '').substring(0, 6);
  }

  /**
   * Reset phone verification when contact number changes
   */
  onContactNumberChange(): void {
    this.isPhoneVerified = false;
    this.showOtpInput = false;
    this.otpValue = '';
  }


   openLoginDialog(): void {
      this.dialogRef.close({ openRegister: true });
      this.dialog.open(LoginDialogComponent, {
        width: '500px',
        maxWidth: '95vw',
        disableClose: true
      });
    }


    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
    }

    showAdvancedSection: boolean = false;

    toggleAdvancedSection(): void {
      this.showAdvancedSection = !this.showAdvancedSection;
    }

    onBillingAddressChange(event: any): void {
      const billingControl = this.registerForm.get('billingAddress');
      if (event.checked) {
        billingControl?.clearValidators();
        billingControl?.setValue('');
      } else {
        billingControl?.setValidators([Validators.required, Validators.minLength(10)]);
      }
      billingControl?.updateValueAndValidity();
    }

    onProfilePictureSelected(event: any): void {
      const file = event.target.files[0];
      if (file) {
        this.registerForm.patchValue({ profilePicturePath: file });
        this.registerForm.get('profilePicturePath')?.updateValueAndValidity();
      }
    }



    // vendor related methods
    toggleSocialSection(): void {
      this.showSocialSection = !this.showSocialSection;
    }

    onDeliveryChange(event: any): void {
      const deliveryRadiusControl = this.registerForm.get('deliveryRadiusInKm');
      if (event.checked) {
        deliveryRadiusControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        deliveryRadiusControl?.clearValidators();
        deliveryRadiusControl?.setValue('');
      }
      deliveryRadiusControl?.updateValueAndValidity();
    }

    // ==================== SOCIAL SIGN-UP ====================

    ngAfterViewInit(): void {
      // Render Google Sign-In button for customer role
      setTimeout(() => {
        this.renderSocialButtons();
      }, 500);
    }

    private renderSocialButtons(): void {
      if (this.selectedRole === 'customer' && !this.googleButtonRendered) {
        this.socialAuthService.renderGoogleButton('google-signup-dialog-btn');
        this.googleButtonRendered = true;
      }
    }

    /**
     * Sign up with Google
     */
    signUpWithGoogle(): void {
      this.socialLoginLoading = true;
      this.loadingService.startLoading('Signing up with Google...');
      
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
            this.handleSocialSignUpSuccess(response);
          },
          error: (error: any) => {
            this.errorService.showErrorNotification('Google sign-up failed. Please try again.');
            console.error('Google signup error:', error);
          }
        });
    }

    /**
     * Sign up with Facebook
     */
    signUpWithFacebook(): void {
      this.socialLoginLoading = true;
      this.loadingService.startLoading('Signing up with Facebook...');
      
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
            this.handleSocialSignUpSuccess(response);
          },
          error: (error: any) => {
            this.errorService.showErrorNotification('Facebook sign-up failed. Please try again.');
            console.error('Facebook signup error:', error);
          }
        });
    }

    /**
     * Handle successful social sign-up
     */
    private handleSocialSignUpSuccess(response: SocialLoginResponse): void {
      if (response && response.token) {
        localStorage.setItem('jwt', response.token);
        
        // Set user based on type and close dialog
        if (response.userType === 'CUSTOMER') {
          this.userStateService.customer = response.user;
          this.dialogRef.close({ success: true, role: 'customer', user: response.user, social: true });
          this.errorService.showSuccessNotification(
            response.newUser ? 'Account created successfully! Welcome!' : 'You already have an account. Logged in!'
          );
          this.router.navigate(['/customer-dashboard']);
        } else {
          this.dialogRef.close({ success: true, social: true });
          this.errorService.showSuccessNotification('Account created successfully!');
          this.router.navigate(['/']);
        }
      } else {
        this.errorService.showErrorNotification('Sign-up failed. Please try again.');
      }
    }
}


