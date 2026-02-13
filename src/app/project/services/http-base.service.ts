import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse } from '../models/interfaces/data-states.interface';

@Injectable({
  providedIn: 'root'
})
export class HttpBaseService {
  constructor(private http: HttpClient) {}

  protected handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  protected get<T>(url: string): Observable<T> {
    return this.http.get<ApiResponse<T>>(url).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'API request failed');
        }
        return response.data as T;
      }),
      catchError(error => this.handleError(error))
    );
  }

  protected post<T>(url: string, data: any): Observable<T> {
    return this.http.post<ApiResponse<T>>(url, data).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'API request failed');
        }
        return response.data as T;
      }),
      catchError(error => this.handleError(error))
    );
  }

  protected put<T>(url: string, data: any): Observable<T> {
    return this.http.put<ApiResponse<T>>(url, data).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'API request failed');
        }
        return response.data as T;
      }),
      catchError(error => this.handleError(error))
    );
  }

  protected delete<T>(url: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(url).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'API request failed');
        }
        return response.data as T;
      }),
      catchError(error => this.handleError(error))
    );
  }
}