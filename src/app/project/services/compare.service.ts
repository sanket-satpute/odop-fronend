import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class CompareService {
  private readonly MAX_ITEMS = 4; // Maximum products to compare
  private readonly STORAGE_KEY = 'compareProducts';
  
  private compareListSubject = new BehaviorSubject<Product[]>([]);
  public compareList$ = this.compareListSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const products = JSON.parse(stored);
        this.compareListSubject.next(products);
      }
    } catch (e) {
      console.error('Error loading compare list:', e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.compareListSubject.value));
    } catch (e) {
      console.error('Error saving compare list:', e);
    }
  }

  getCompareList(): Product[] {
    return this.compareListSubject.value;
  }

  getCompareCount(): number {
    return this.compareListSubject.value.length;
  }

  isInCompare(productId: string): boolean {
    return this.compareListSubject.value.some(p => p.productId === productId);
  }

  addToCompare(product: Product): { success: boolean; message: string } {
    const currentList = this.compareListSubject.value;
    
    if (this.isInCompare(product.productId!)) {
      return { success: false, message: 'Product is already in comparison list' };
    }
    
    if (currentList.length >= this.MAX_ITEMS) {
      return { success: false, message: `Maximum ${this.MAX_ITEMS} products can be compared` };
    }
    
    const newList = [...currentList, product];
    this.compareListSubject.next(newList);
    this.saveToStorage();
    
    return { success: true, message: 'Product added to comparison' };
  }

  removeFromCompare(productId: string): void {
    const newList = this.compareListSubject.value.filter(p => p.productId !== productId);
    this.compareListSubject.next(newList);
    this.saveToStorage();
  }

  clearCompare(): void {
    this.compareListSubject.next([]);
    this.saveToStorage();
  }

  toggleCompare(product: Product): { success: boolean; message: string; action: 'added' | 'removed' } {
    if (this.isInCompare(product.productId!)) {
      this.removeFromCompare(product.productId!);
      return { success: true, message: 'Product removed from comparison', action: 'removed' };
    } else {
      const result = this.addToCompare(product);
      return { ...result, action: 'added' };
    }
  }
}
