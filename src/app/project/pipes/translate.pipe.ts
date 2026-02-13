import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';

/**
 * Translate pipe for templates
 * Usage: {{ 'key.path' | translate }}
 * With params: {{ 'key.path' | translate: { param: value } }}
 */
@Pipe({
  name: 'translate',
  pure: false // Impure to react to language changes
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  
  private currentLang: string = '';
  private lastKey: string = '';
  private lastParams: any;
  private lastValue: string = '';
  private subscription: Subscription;

  constructor(
    private translationService: TranslationService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    // Subscribe to language changes
    this.subscription = this.translationService.currentLang$.subscribe(lang => {
      if (lang !== this.currentLang) {
        this.currentLang = lang;
        // Force update when language changes
        if (this.lastKey) {
          this.lastValue = this.translationService.translate(this.lastKey, this.lastParams);
          this.changeDetectorRef.markForCheck();
        }
      }
    });
  }

  transform(key: string, params?: { [key: string]: any }): string {
    if (!key) {
      return '';
    }

    // Return cached value if key and params haven't changed
    if (key === this.lastKey && this.paramsEqual(params, this.lastParams)) {
      return this.lastValue;
    }

    // Get new translation
    this.lastKey = key;
    this.lastParams = params;
    this.lastValue = this.translationService.translate(key, params);

    return this.lastValue;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Check if params are equal
   */
  private paramsEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => a[key] === b[key]);
  }
}
