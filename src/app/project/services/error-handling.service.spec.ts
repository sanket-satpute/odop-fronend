import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ErrorHandlingService } from './error-handling.service';

describe('ErrorHandlingService', () => {
  let service: ErrorHandlingService;
  let snackBar: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule, NoopAnimationsModule],
      providers: [ErrorHandlingService]
    });
    service = TestBed.inject(ErrorHandlingService);
    snackBar = TestBed.inject(MatSnackBar);
    spyOn(snackBar, 'open');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handleError', () => {
    it('should handle string error messages', () => {
      const message = 'Test error message';
      const result = service.handleError(message);
      
      expect(result).toBe(message);
      expect(snackBar.open).toHaveBeenCalledWith(
        message, 
        'Close', 
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should handle Error objects', () => {
      const error = new Error('Custom error');
      const result = service.handleError(error);
      
      expect(result).toBe('Custom error');
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle HttpErrorResponse with status 404', () => {
      const error = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found'
      });
      
      const result = service.handleError(error);
      
      expect(result).toBe('The requested resource was not found.');
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle HttpErrorResponse with status 401', () => {
      const error = new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized'
      });
      
      const result = service.handleError(error);
      
      expect(result).toBe('Please login to continue.');
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle HttpErrorResponse with status 403', () => {
      const error = new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden'
      });
      
      const result = service.handleError(error);
      
      expect(result).toBe('You do not have permission to perform this action.');
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle HttpErrorResponse with status 500', () => {
      const error = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      const result = service.handleError(error);
      
      expect(result).toBe('An internal server error occurred. Please try again later.');
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle HttpErrorResponse with custom error message', () => {
      const error = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: { message: 'Invalid input data' }
      });
      
      const result = service.handleError(error);
      
      expect(result).toBe('Invalid input data');
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle connection error (status 0)', () => {
      const error = new HttpErrorResponse({
        status: 0,
        statusText: 'Unknown Error'
      });
      
      const result = service.handleError(error);
      
      expect(result).toBe('Unable to connect to the server. Please try again later.');
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle unknown error types', () => {
      const unknownError = { weird: 'object' };
      const result = service.handleError(unknownError);
      
      expect(result).toBe('An unexpected error occurred.');
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('showSuccessNotification', () => {
    it('should display success message with default duration', () => {
      service.showSuccessNotification('Operation successful');
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Operation successful',
        'Close',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should display success message with custom duration', () => {
      service.showSuccessNotification('Saved!', 5000);
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Saved!',
        'Close',
        jasmine.objectContaining({ duration: 5000 })
      );
    });
  });

  describe('showErrorNotification', () => {
    it('should display error message with default duration', () => {
      service.showErrorNotification('Something went wrong');
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Something went wrong',
        'Close',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['error-snackbar']
        })
      );
    });
  });

  describe('handleConnectionError', () => {
    it('should display connection error message', () => {
      const result = service.handleConnectionError();
      
      expect(result).toContain('Could not connect to the server');
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('handleValidationError', () => {
    it('should format validation errors', () => {
      const errors = {
        email: ['Email is required', 'Email format is invalid'],
        password: ['Password must be at least 8 characters']
      };
      
      const result = service.handleValidationError(errors);
      
      expect(result).toContain('email');
      expect(result).toContain('password');
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('handleAuthenticationError', () => {
    it('should display session expired message', () => {
      const result = service.handleAuthenticationError();
      
      expect(result).toContain('session has expired');
      expect(snackBar.open).toHaveBeenCalled();
    });
  });
});
