import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class RecentlyViewedService {
  private readonly MAX_ITEMS = 10;
  private readonly STORAGE_KEY = 'recentlyViewed';

  private recentlyViewedSubject = new BehaviorSubject<Product[]>([]);
  public recentlyViewed$ = this.recentlyViewedSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const products = JSON.parse(stored);
        this.recentlyViewedSubject.next(products);
      }
    } catch (e) {
      console.error('Error loading recently viewed:', e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.recentlyViewedSubject.value));
    } catch (e) {
      console.error('Error saving recently viewed:', e);
    }
  }

  getRecentlyViewed(): Product[] {
    return this.recentlyViewedSubject.value;
  }

  addProduct(product: Product): void {
    if (!product || !product.productId) return;

    let currentList = this.recentlyViewedSubject.value;
    
    // Remove if already exists (to move to front)
    currentList = currentList.filter(p => p.productId !== product.productId);
    
    // Add to front
    currentList.unshift(product);
    
    // Limit to MAX_ITEMS
    if (currentList.length > this.MAX_ITEMS) {
      currentList = currentList.slice(0, this.MAX_ITEMS);
    }
    
    this.recentlyViewedSubject.next(currentList);
    this.saveToStorage();
  }

  clearHistory(): void {
    this.recentlyViewedSubject.next([]);
    this.saveToStorage();
  }

  removeProduct(productId: string): void {
    const newList = this.recentlyViewedSubject.value.filter(p => p.productId !== productId);
    this.recentlyViewedSubject.next(newList);
    this.saveToStorage();
  }
}
