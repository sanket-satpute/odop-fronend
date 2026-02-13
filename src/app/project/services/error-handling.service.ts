import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  constructor(private snackBar: MatSnackBar) {}

  handleError(error: any): string {
    let errorMessage: string;

    if (error instanceof HttpErrorResponse) {
      // Server or connection error
      if (!navigator.onLine) {
        errorMessage = 'Please check your internet connection.';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please try again later.';
      } else if (error.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 401) {
        errorMessage = 'Please login to continue.';
      } else if (error.status >= 500) {
        errorMessage = 'An internal server error occurred. Please try again later.';
      } else {
        errorMessage = error.error?.message || 'An unexpected error occurred.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = 'An unexpected error occurred.';
    }

    this.showErrorNotification(errorMessage);
    return errorMessage;
  }

  showErrorNotification(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showSuccessNotification(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  handleConnectionError(): string {
    const message = 'Could not connect to the server. Please check your internet connection or try again later.';
    this.showErrorNotification(message);
    return message;
  }

  handleValidationError(errors: { [key: string]: string[] }): string {
    const messages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    this.showErrorNotification(messages);
    return messages;
  }

  handleAuthenticationError(): string {
    const message = 'Your session has expired. Please login again.';
    this.showErrorNotification(message);
    return message;
  }
}