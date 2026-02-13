import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

interface SelectProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  vendor: string;
  district: string;
  category: string;
  image: string;
  giTagged?: boolean;
}

export interface CompareSelectDialogData {
  products: SelectProduct[];
  selectedIds: string[];
  maxItems: number;
}

@Component({
  selector: 'app-compare-select-dialog',
  templateUrl: './compare-select-dialog.component.html',
  styleUrls: ['./compare-select-dialog.component.css']
})
export class CompareSelectDialogComponent implements OnInit {
  products: SelectProduct[] = [];
  filteredProducts: SelectProduct[] = [];
  selectedIds: Set<string> = new Set();
  maxItems: number = 4;
  
  // Filter state
  searchQuery: string = '';
  selectedCategory: string = '';
  categories: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<CompareSelectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompareSelectDialogData,
    private snackBar: MatSnackBar
  ) {
    this.products = data.products || [];
    this.selectedIds = new Set(data.selectedIds || []);
    this.maxItems = data.maxItems || 4;
  }

  ngOnInit(): void {
    // Extract unique categories
    this.categories = [...new Set(this.products.map(p => p.category).filter(c => c))];
    this.applyFilters();
  }

  close(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    this.dialogRef.close(Array.from(this.selectedIds));
  }

  toggleSelection(productId: string): void {
    if (this.selectedIds.has(productId)) {
      this.selectedIds.delete(productId);
    } else {
      if (this.selectedIds.size >= this.maxItems) {
        this.snackBar.open(`Maximum ${this.maxItems} products can be compared`, 'Close', {
          duration: 2000
        });
        return;
      }
      this.selectedIds.add(productId);
    }
  }

  isSelected(productId: string): boolean {
    return this.selectedIds.has(productId);
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.vendor.toLowerCase().includes(query) ||
        p.district.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    this.filteredProducts = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.applyFilters();
  }

  selectAll(): void {
    const availableSlots = this.maxItems - this.selectedIds.size;
    const toAdd = this.filteredProducts
      .filter(p => !this.selectedIds.has(p.id))
      .slice(0, availableSlots);
    
    toAdd.forEach(p => this.selectedIds.add(p.id));

    if (availableSlots < this.filteredProducts.filter(p => !this.selectedIds.has(p.id)).length) {
      this.snackBar.open(`Selected ${toAdd.length} products. Max ${this.maxItems} allowed.`, 'Close', {
        duration: 2000
      });
    }
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  getSelectedProducts(): SelectProduct[] {
    return this.products.filter(p => this.selectedIds.has(p.id));
  }

  generateStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }
}
