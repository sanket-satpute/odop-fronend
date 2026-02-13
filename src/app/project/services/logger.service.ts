import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Logger Service
 * Centralized logging service that can be controlled via environment configuration.
 * In production, logs are disabled. In development, they are enabled.
 * 
 * Usage:
 * - this.logger.debug('message') - For debugging information (dev only)
 * - this.logger.info('message') - For informational messages
 * - this.logger.warn('message') - For warning messages
 * - this.logger.error('message', error) - For error messages (always logged)
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  
  private isProduction = environment.production;

  /**
   * Debug level logging - only shown in development
   */
  debug(...args: any[]): void {
    if (!this.isProduction) {
      console.log('[DEBUG]', ...args);
    }
  }

  /**
   * Info level logging - only shown in development
   */
  info(...args: any[]): void {
    if (!this.isProduction) {
      console.info('[INFO]', ...args);
    }
  }

  /**
   * Warning level logging - only shown in development
   */
  warn(...args: any[]): void {
    if (!this.isProduction) {
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * Error level logging - always shown (important for debugging production issues)
   * Consider integrating with external error tracking services in production
   */
  error(message: string, error?: any): void {
    console.error('[ERROR]', message, error || '');
    
    // In production, you could send errors to an error tracking service
    // if (this.isProduction) {
    //   this.sendToErrorTracking(message, error);
    // }
  }

  /**
   * Table logging for objects/arrays - only shown in development
   */
  table(data: any): void {
    if (!this.isProduction) {
      console.table(data);
    }
  }

  /**
   * Group logging - only shown in development
   */
  group(label: string): void {
    if (!this.isProduction) {
      console.group(label);
    }
  }

  /**
   * End group logging - only shown in development
   */
  groupEnd(): void {
    if (!this.isProduction) {
      console.groupEnd();
    }
  }

  /**
   * Time tracking start - only shown in development
   */
  time(label: string): void {
    if (!this.isProduction) {
      console.time(label);
    }
  }

  /**
   * Time tracking end - only shown in development
   */
  timeEnd(label: string): void {
    if (!this.isProduction) {
      console.timeEnd(label);
    }
  }
}
