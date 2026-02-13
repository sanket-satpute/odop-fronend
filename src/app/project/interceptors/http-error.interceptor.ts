import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ErrorHandlingService } from '../services/error-handling.service';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private errorService: ErrorHandlingService,
    private loadingService: LoadingService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loadingService.startLoading();

    // Note: Token is already added by AuthInterceptor, no need to add it here again

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Network or client-side error
        if (error.error instanceof ErrorEvent) {
          this.errorService.handleError('Network error occurred. Please check your connection.');
        } 
        // Backend error
        else {
          switch (error.status) {
            case 0:
              this.errorService.handleConnectionError();
              break;
            case 401:
              this.errorService.handleAuthenticationError();
              break;
            case 403:
              this.errorService.handleError('You do not have permission to perform this action');
              break;
            case 404:
              this.errorService.handleError('The requested resource was not found');
              break;
            case 422:
              if (error.error?.errors) {
                this.errorService.handleValidationError(error.error.errors);
              } else {
                this.errorService.handleError('Validation error occurred');
              }
              break;
            case 500:
              this.errorService.handleError('An internal server error occurred. Please try again later.');
              break;
            default:
              this.errorService.handleError(error.error?.message || 'An unexpected error occurred');
          }
        }
        return throwError(() => error);
      }),
      finalize(() => {
        this.loadingService.stopLoading();
      })
    );
  }
}
