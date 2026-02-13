import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface ApplyVoucherDialogData {
  currentBalance: number;
  appliedVouchers: string[];
}

export interface ApplyVoucherDialogResult {
  voucherCode: string;
  discountAmount: number;
}

interface Voucher {
  code: string;
  discount: number;
  description: string;
  minPurchase: number;
  expiryDate: string;
  type: 'flat' | 'percentage';
}

@Component({
  selector: 'app-apply-voucher-dialog',
  templateUrl: './apply-voucher-dialog.component.html',
  styleUrls: ['./apply-voucher-dialog.component.css']
})
export class ApplyVoucherDialogComponent implements OnInit {
  voucherForm: FormGroup;
  isVerifying = false;
  verificationStatus: 'idle' | 'valid' | 'invalid' | 'used' = 'idle';
  verifiedVoucher: Voucher | null = null;

  // Valid voucher codes (in real app, this would come from backend)
  private validVouchers: { [key: string]: Voucher } = {
    'WELCOME50': { 
      code: 'WELCOME50', 
      discount: 50, 
      description: 'Welcome bonus for new users', 
      minPurchase: 0, 
      expiryDate: '2025-12-31',
      type: 'flat'
    },
    'SAVE100': { 
      code: 'SAVE100', 
      discount: 100, 
      description: 'Flat ₹100 off on wallet top-up', 
      minPurchase: 500, 
      expiryDate: '2025-06-30',
      type: 'flat'
    },
    'ODOP200': { 
      code: 'ODOP200', 
      discount: 200, 
      description: 'ODOP Special Discount', 
      minPurchase: 1000, 
      expiryDate: '2025-08-15',
      type: 'flat'
    },
    'FESTIVE500': { 
      code: 'FESTIVE500', 
      discount: 500, 
      description: 'Festive season mega bonus!', 
      minPurchase: 2000, 
      expiryDate: '2025-03-31',
      type: 'flat'
    },
    'PERCENT10': { 
      code: 'PERCENT10', 
      discount: 10, 
      description: '10% cashback on next purchase', 
      minPurchase: 0, 
      expiryDate: '2025-09-30',
      type: 'percentage'
    }
  };

  // Featured vouchers to display
  featuredVouchers: Voucher[] = [];

  constructor(
    public dialogRef: MatDialogRef<ApplyVoucherDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ApplyVoucherDialogData,
    private fb: FormBuilder
  ) {
    this.voucherForm = this.fb.group({
      voucherCode: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  ngOnInit(): void {
    // Filter out already applied vouchers for featured list
    this.featuredVouchers = Object.values(this.validVouchers)
      .filter(v => !this.data.appliedVouchers.includes(v.code))
      .slice(0, 3);
  }

  onCodeInput(): void {
    // Reset verification when code changes
    this.verificationStatus = 'idle';
    this.verifiedVoucher = null;
  }

  applyFeaturedVoucher(voucher: Voucher): void {
    this.voucherForm.patchValue({ voucherCode: voucher.code });
    this.verifyVoucher();
  }

  verifyVoucher(): void {
    const code = this.voucherForm.value.voucherCode?.trim().toUpperCase();
    if (!code || code.length < 4) return;

    this.isVerifying = true;
    this.verificationStatus = 'idle';

    // Simulate API call
    setTimeout(() => {
      this.isVerifying = false;

      // Check if already used
      if (this.data.appliedVouchers.includes(code)) {
        this.verificationStatus = 'used';
        this.verifiedVoucher = null;
        return;
      }

      // Check if valid
      const voucher = this.validVouchers[code];
      if (voucher) {
        this.verificationStatus = 'valid';
        this.verifiedVoucher = voucher;
      } else {
        this.verificationStatus = 'invalid';
        this.verifiedVoucher = null;
      }
    }, 1000);
  }

  getStatusMessage(): string {
    switch (this.verificationStatus) {
      case 'valid':
        return `✅ Valid! You'll get ₹${this.verifiedVoucher?.discount} ${this.verifiedVoucher?.type === 'percentage' ? 'cashback' : 'bonus'}`;
      case 'invalid':
        return '❌ Invalid voucher code. Please check and try again.';
      case 'used':
        return '⚠️ This voucher has already been applied.';
      default:
        return '';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApply(): void {
    if (this.verificationStatus !== 'valid' || !this.verifiedVoucher) return;

    const result: ApplyVoucherDialogResult = {
      voucherCode: this.verifiedVoucher.code,
      discountAmount: this.verifiedVoucher.discount
    };
    this.dialogRef.close(result);
  }
}
