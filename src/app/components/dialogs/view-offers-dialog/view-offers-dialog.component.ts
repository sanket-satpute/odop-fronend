import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: string;
  minPurchase: number;
  maxDiscount: number;
  validTill: string;
  category: 'cashback' | 'discount' | 'freebie' | 'combo';
  icon: string;
  color: string;
  isNew: boolean;
  usageLimit: string;
}

@Component({
  selector: 'app-view-offers-dialog',
  templateUrl: './view-offers-dialog.component.html',
  styleUrls: ['./view-offers-dialog.component.css']
})
export class ViewOffersDialogComponent implements OnInit {
  activeTab: 'all' | 'cashback' | 'discount' | 'freebie' = 'all';
  
  allOffers: Offer[] = [
    {
      id: '1',
      title: 'Welcome Bonus',
      description: 'Get flat ₹50 off on your first wallet top-up of ₹500 or more',
      code: 'WELCOME50',
      discount: '₹50 OFF',
      minPurchase: 500,
      maxDiscount: 50,
      validTill: '2025-12-31',
      category: 'discount',
      icon: '🎉',
      color: '#FFA500',
      isNew: true,
      usageLimit: 'One time per user'
    },
    {
      id: '2',
      title: 'Flat ₹100 Savings',
      description: 'Save ₹100 on orders above ₹1000. Limited time offer!',
      code: 'SAVE100',
      discount: '₹100 OFF',
      minPurchase: 1000,
      maxDiscount: 100,
      validTill: '2025-06-30',
      category: 'discount',
      icon: '💰',
      color: '#10b981',
      isNew: false,
      usageLimit: 'Once per month'
    },
    {
      id: '3',
      title: 'ODOP Special',
      description: 'Exclusive ₹200 discount for ODOP members on purchases above ₹2000',
      code: 'ODOP200',
      discount: '₹200 OFF',
      minPurchase: 2000,
      maxDiscount: 200,
      validTill: '2025-08-15',
      category: 'discount',
      icon: '⭐',
      color: '#7c3aed',
      isNew: true,
      usageLimit: 'Unlimited'
    },
    {
      id: '4',
      title: 'Festive Bonanza',
      description: 'Mega savings of ₹500 on orders above ₹5000. Celebrate with ODOP!',
      code: 'FESTIVE500',
      discount: '₹500 OFF',
      minPurchase: 5000,
      maxDiscount: 500,
      validTill: '2025-03-31',
      category: 'discount',
      icon: '🎊',
      color: '#ef4444',
      isNew: false,
      usageLimit: 'Once per user'
    },
    {
      id: '5',
      title: '10% Cashback',
      description: 'Get 10% cashback on all orders. Max cashback ₹250',
      code: 'PERCENT10',
      discount: '10% Cashback',
      minPurchase: 0,
      maxDiscount: 250,
      validTill: '2025-09-30',
      category: 'cashback',
      icon: '💸',
      color: '#0ea5e9',
      isNew: true,
      usageLimit: 'Twice per week'
    },
    {
      id: '6',
      title: 'First Order Cashback',
      description: '15% cashback on your first order. Maximum cashback ₹500',
      code: 'FIRST15',
      discount: '15% Cashback',
      minPurchase: 500,
      maxDiscount: 500,
      validTill: '2025-12-31',
      category: 'cashback',
      icon: '🌟',
      color: '#f59e0b',
      isNew: false,
      usageLimit: 'One time only'
    },
    {
      id: '7',
      title: 'Free Delivery',
      description: 'Get free delivery on all orders above ₹299',
      code: 'FREEDELIVERY',
      discount: 'Free Shipping',
      minPurchase: 299,
      maxDiscount: 50,
      validTill: '2025-12-31',
      category: 'freebie',
      icon: '🚚',
      color: '#22c55e',
      isNew: false,
      usageLimit: 'Unlimited'
    },
    {
      id: '8',
      title: 'Weekend Special',
      description: 'Extra 5% off on all weekend orders. Valid Sat-Sun only',
      code: 'WEEKEND5',
      discount: '5% Extra OFF',
      minPurchase: 0,
      maxDiscount: 150,
      validTill: '2025-12-31',
      category: 'discount',
      icon: '🎯',
      color: '#ec4899',
      isNew: true,
      usageLimit: 'Every weekend'
    }
  ];

  filteredOffers: Offer[] = [];
  copiedCode: string = '';

  constructor(
    public dialogRef: MatDialogRef<ViewOffersDialogComponent>,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.filterOffers('all');
  }

  filterOffers(category: 'all' | 'cashback' | 'discount' | 'freebie'): void {
    this.activeTab = category;
    if (category === 'all') {
      this.filteredOffers = this.allOffers;
    } else {
      this.filteredOffers = this.allOffers.filter(o => o.category === category);
    }
  }

  copyCode(code: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.copiedCode = code;
        this.snackBar.open(`Code "${code}" copied to clipboard!`, 'Close', {
          duration: 2000,
          panelClass: ['success-snackbar']
        });
        
        // Reset copied state after 2 seconds
        setTimeout(() => {
          this.copiedCode = '';
        }, 2000);
      });
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      this.copiedCode = code;
      this.snackBar.open(`Code "${code}" copied!`, 'Close', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });
      
      setTimeout(() => {
        this.copiedCode = '';
      }, 2000);
    }
  }

  getOfferCount(category: string): number {
    if (category === 'all') return this.allOffers.length;
    return this.allOffers.filter(o => o.category === category).length;
  }

  isExpiringSoon(validTill: string): boolean {
    const expiryDate = new Date(validTill);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  }

  getDaysRemaining(validTill: string): number {
    const expiryDate = new Date(validTill);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
