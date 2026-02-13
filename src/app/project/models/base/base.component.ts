import { Directive, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { DataHandlerService } from '../../services/data-handler.service';
import { LoadingState } from '../../models/interfaces/data-states.interface';

@Directive()
export abstract class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();
  protected loadingState: LoadingState = {
    loading: false,
    error: null
  };

  constructor(protected dataHandler: DataHandlerService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected handleError(error: any): void {
    this.loadingState = {
      loading: false,
      error: this.dataHandler.handleError(error),
      success: false
    };
  }

  protected startLoading(): void {
    this.loadingState = {
      loading: true,
      error: null
    };
  }

  protected stopLoading(success: boolean = true): void {
    this.loadingState = {
      loading: false,
      error: null,
      success
    };
  }

  protected clearError(): void {
    if (this.loadingState.error) {
      this.loadingState.error = null;
    }
  }

  // Utility method to safely get values
  protected getValue<T>(value: T | null | undefined, defaultValue: T): T {
    return value !== null && value !== undefined ? value : defaultValue;
  }
}