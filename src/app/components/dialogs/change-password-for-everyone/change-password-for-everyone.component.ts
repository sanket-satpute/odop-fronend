import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

export interface ChangePasswordData {
  role: 'customer' | 'vendor' | 'admin';
  username: string;
}

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  percentage: number;
}

@Component({
  selector: 'app-change-password-for-everyone',
  templateUrl: './change-password-for-everyone.component.html',
  styleUrls: ['./change-password-for-everyone.component.css']
})
export class ChangePasswordForEveryoneComponent implements OnInit, OnDestroy {
  passwordForm: FormGroup;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordStrength: PasswordStrength = {
    score: 0,
    label: 'Weak',
    color: '#FF6B6B',
    percentage: 0
  };
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    public fb: FormBuilder,
    public dialogRef: MatDialogRef<ChangePasswordForEveryoneComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChangePasswordData
  ) {
    // Fallback if data is missing
    this.data = data || { role: 'customer', username: 'Unknown User' };

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Watch for password changes to update strength
    this.passwordForm.get('newPassword')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.calculatePasswordStrength(value);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get roleIcon(): string {
    switch (this.data.role) {
      case 'customer': return 'fa-user-circle';
      case 'vendor': return 'fa-store';
      case 'admin': return 'fa-crown';
      default: return 'fa-user-circle';
    }
  }

  get roleGradient(): string {
    switch (this.data.role) {
      case 'customer': return 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)';
      case 'vendor': return 'linear-gradient(135deg, #FFA500 0%, #FF7F00 100%)';
      case 'admin': return 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)';
      default: return 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)';
    }
  }

  passwordValidator(control: AbstractControl): {[key: string]: any} | null {
    const password = control.value;
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasMinLength = password.length >= 8;

    if (!hasUpperCase || !hasNumber || !hasMinLength) {
      return { 'passwordRequirements': true };
    }
    return null;
  }

  hasUppercase(value: string): boolean {
    return /[A-Z]/.test(value || '');
  }

  hasNumber(value: string): boolean {
    return /\d/.test(value || '');
  }

  passwordMatchValidator(control: AbstractControl): {[key: string]: any} | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    const currentPassword = control.get('currentPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { 'passwordMismatch': true };
    }

    if (newPassword && currentPassword && newPassword === currentPassword) {
      return { 'samePassword': true };
    }

    return null;
  }

  calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = { score: 0, label: 'Weak', color: '#FF6B6B', percentage: 0 };
      return;
    }

    let score = 0;
    let label = 'Weak';
    let color = '#FF6B6B';

    // Length check
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 10;

    // Character variety
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;

    // Determine strength
    if (score >= 80) {
      label = 'Strong';
      color = '#4CAF50';
    } else if (score >= 50) {
      label = 'Medium';
      color = '#FFA500';
    }

    this.passwordStrength = { score, label, color, percentage: Math.min(score, 100) };
  }

  togglePasswordVisibility(field: string): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  async onChangePassword(): Promise<void> {
    if (this.passwordForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Simulate API call
      await this.simulatePasswordChange();
      
      this.successMessage = 'Password changed successfully!';
      setTimeout(() => {
        this.dialogRef.close({ success: true });
      }, 1500);
    } catch (error) {
      this.errorMessage = 'Current password is incorrect. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private simulatePasswordChange(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/failure for demo
        Math.random() > 0.3 ? resolve() : reject(new Error('Invalid password'));
      }, 2000);
    });
  }

  get isFormValid(): boolean {
    return this.passwordForm.valid && this.passwordStrength.score >= 50;
  }
}
