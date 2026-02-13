import { Component, Inject, OnInit, OnDestroy, HostListener, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Interface for dialog data
export interface LogoutDialogData {
  role: 'customer' | 'vendor' | 'admin';
  username: string;
  userAvatar?: string;
}

// Interface for dialog result
export interface LogoutDialogResult {
  confirmed: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-logout-dialog-for-everyone',
  templateUrl: './logout-dialog-for-everyone.component.html',
  styleUrls: ['./logout-dialog-for-everyone.component.css'],
  animations: [
    trigger('dialogAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.9) translateY(-20px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'scale(1) translateY(0)'
      })),
      transition('void => *', [
        animate('300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)')
      ]),
      transition('* => void', [
        animate('200ms ease-in-out')
      ])
    ])
  ],
  // encapsulation: ViewEncapsulation.None
  encapsulation: ViewEncapsulation.None
})
export class LogoutDialogForEveryoneComponent implements OnInit, OnDestroy {
  
  // Public properties
  public role: 'customer' | 'vendor' | 'admin';
  public username: string;
  public userAvatar: string = '';
  
  // Private properties
  private keydownListener?: (event: KeyboardEvent) => void;
  
  constructor(
    public dialogRef: MatDialogRef<LogoutDialogForEveryoneComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LogoutDialogData
  ) {
    // Initialize component data
    this.role = data.role;
    this.username = data.username;
    this.initializeData();
  }
  
  ngOnInit(): void {
    // Set up keyboard event listeners
    this.setupKeyboardListeners();
    
    // Disable scrolling on body when dialog is open
    document.body.style.overflow = 'hidden';
    
    // Focus management
    this.setupFocusManagement();
  }
  
  ngOnDestroy(): void {
    // Clean up event listeners
    this.cleanupKeyboardListeners();
    
    // Re-enable scrolling
    document.body.style.overflow = 'auto';
  }
  
  /**
   * Initialize component data from dialog input
   */
  private initializeData(): void {
    if (this.data) {
      this.userAvatar = this.data.userAvatar || '';
    }
  }
  
  /**
   * Set up keyboard event listeners
   */
  private setupKeyboardListeners(): void {
    this.keydownListener = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          this.onCancel();
          break;
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.onConfirm();
          }
          break;
      }
    };
    
    document.addEventListener('keydown', this.keydownListener);
  }
  
  /**
   * Clean up keyboard event listeners
   */
  private cleanupKeyboardListeners(): void {
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
    }
  }
  
  /**
   * Set up focus management for accessibility
   */
  private setupFocusManagement(): void {
    setTimeout(() => {
      const primaryButton = document.querySelector('.btn-primary') as HTMLElement;
      if (primaryButton) {
        primaryButton.focus();
      }
    }, 100);
  }
  
  /**
   * Handle confirm action (logout)
   */
  public onConfirm(): void {
    const result: LogoutDialogResult = {
      confirmed: true,
      timestamp: new Date()
    };
    
    this.dialogRef.close(result);
  }
  
  /**
   * Handle cancel action
   */
  public onCancel(): void {
    const result: LogoutDialogResult = {
      confirmed: false,
      timestamp: new Date()
    };
    
    this.dialogRef.close(result);
  }
  
  /**
   * Handle backdrop click
   */
  public onBackdropClick(): void {
    // Only close if configured to allow backdrop close
    // For logout dialog, we typically want to prevent accidental closure
    // this.onCancel();
  }
  
  /**
   * Get role-specific icon class
   */
  public getRoleIconClass(): string {
    return this.role;
  }
  
  /**
   * Get role-specific icon
   */
  public getRoleIcon(): string {
    const iconMap = {
      customer: 'fas fa-user-circle',
      vendor: 'fas fa-store',
      admin: 'fas fa-crown'
    };
    
    return iconMap[this.role] || 'fas fa-user-circle';
  }
  
  /**
   * Get display name for role
   */
  public getRoleDisplayName(): string {
    const roleNames = {
      customer: 'Customer account',
      vendor: 'Vendor dashboard',
      admin: 'Admin panel'
    };
    
    return roleNames[this.role] || 'account';
  }
  
  /**
   * Get user initials for avatar
   */
  public getInitials(): string {
    if (!this.username) {
      return this.role.charAt(0).toUpperCase();
    }
    
    return this.username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  /**
   * Check if user info should be displayed
   */
  public shouldShowUserInfo(): boolean {
    return !!(this.username || this.userAvatar);
  }
  
  /**
   * Get role-specific gradient colors
   */
  public getRoleGradient(): string {
    const gradients = {
      customer: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      vendor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      admin: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    };
    
    return gradients[this.role] || gradients.customer;
  }
  
  /**
   * Handle keyboard navigation
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Tab key navigation
    if (event.key === 'Tab') {
      this.handleTabNavigation(event);
    }
  }
  
  /**
   * Handle tab navigation within dialog
   */
  private handleTabNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }
  
  /**
   * Get all focusable elements in the dialog
   */
  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    const elements = document.querySelectorAll(focusableSelectors.join(', '));
    return Array.from(elements) as HTMLElement[];
  }
  
  /**
   * Public method to programmatically trigger logout
   */
  public logout(): void {
    this.onConfirm();
  }
  
  /**
   * Public method to programmatically cancel
   */
  public cancel(): void {
    this.onCancel();
  }
}