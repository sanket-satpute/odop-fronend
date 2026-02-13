import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface LoadingState {
  loading: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({ loading: false });
  loading$ = this.loadingSubject.asObservable();

  private loadingCounter = 0;

  startLoading(message?: string): void {
    this.loadingCounter++;
    if (this.loadingCounter === 1) {
      this.loadingSubject.next({ loading: true, message });
    }
  }

  stopLoading(): void {
    this.loadingCounter--;
    if (this.loadingCounter <= 0) {
      this.loadingCounter = 0;
      this.loadingSubject.next({ loading: false });
    }
  }

  resetLoading(): void {
    this.loadingCounter = 0;
    this.loadingSubject.next({ loading: false });
  }
}
