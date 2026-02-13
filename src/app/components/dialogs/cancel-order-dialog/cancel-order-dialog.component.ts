import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface CancelOrderDialogData {
  orderId: string;
  orderNumber?: string;
  orderStatus: string;
  totalAmount: number;
  productCount: number;
}

export interface CancelOrderResult {
  confirmed: boolean;
  reason: string;
  customReason?: string;
}

interface CancellationReason {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-cancel-order-dialog',
  templateUrl: './cancel-order-dialog.component.html',
  styleUrls: ['./cancel-order-dialog.component.css']
})
export class CancelOrderDialogComponent implements OnInit {

  selectedReason: string = '';
  customReason: string = '';
  isSubmitting: boolean = false;

  cancellationReasons: CancellationReason[] = [
    { value: 'changed_mind', label: 'Changed my mind', icon: 'fas fa-lightbulb' },
    { value: 'found_better_price', label: 'Found better price elsewhere', icon: 'fas fa-tag' },
    { value: 'ordered_by_mistake', label: 'Order placed by mistake', icon: 'fas fa-exclamation-circle' },
    { value: 'delivery_too_slow', label: 'Delivery time too long', icon: 'fas fa-clock' },
    { value: 'wrong_item', label: 'Ordered wrong item/size/color', icon: 'fas fa-exchange-alt' },
    { value: 'no_longer_needed', label: 'Item no longer needed', icon: 'fas fa-times-circle' },
    { value: 'other', label: 'Other reason', icon: 'fas fa-pencil-alt' }
  ];

  constructor(
    public dialogRef: MatDialogRef<CancelOrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CancelOrderDialogData
  ) {}

  ngOnInit(): void {}

  selectReason(reason: string): void {
    this.selectedReason = reason;
    if (reason !== 'other') {
      this.customReason = '';
    }
  }

  isValidForm(): boolean {
    if (!this.selectedReason) {
      return false;
    }
    if (this.selectedReason === 'other' && !this.customReason.trim()) {
      return false;
    }
    return true;
  }

  getReasonLabel(): string {
    if (this.selectedReason === 'other') {
      return this.customReason.trim();
    }
    const reason = this.cancellationReasons.find(r => r.value === this.selectedReason);
    return reason ? reason.label : '';
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false } as CancelOrderResult);
  }

  onConfirm(): void {
    if (!this.isValidForm()) {
      return;
    }

    const result: CancelOrderResult = {
      confirmed: true,
      reason: this.selectedReason,
      customReason: this.selectedReason === 'other' ? this.customReason.trim() : undefined
    };

    this.dialogRef.close(result);
  }
}
