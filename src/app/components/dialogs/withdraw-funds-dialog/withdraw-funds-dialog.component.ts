import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface WithdrawFundsDialogData {
  currentBalance: number;
}

export interface WithdrawFundsDialogResult {
  amount: number;
  withdrawMethod: string;
  accountDetails: string;
}

@Component({
  selector: 'app-withdraw-funds-dialog',
  templateUrl: './withdraw-funds-dialog.component.html',
  styleUrls: ['./withdraw-funds-dialog.component.css']
})
export class WithdrawFundsDialogComponent implements OnInit {
  withdrawForm: FormGroup;
  isProcessing = false;
  selectedMethod: string = 'bank';

  withdrawMethods = [
    { id: 'bank', name: 'Bank Transfer', desc: 'Direct to your bank account', icon: '🏦', processingTime: '2-3 business days' },
    { id: 'upi', name: 'UPI', desc: 'Instant transfer to UPI ID', icon: '📲', processingTime: 'Within 24 hours' },
    { id: 'paytm', name: 'Paytm Wallet', desc: 'Transfer to Paytm wallet', icon: '💳', processingTime: 'Instant' }
  ];

  quickAmounts: number[] = [100, 250, 500, 1000];

  constructor(
    public dialogRef: MatDialogRef<WithdrawFundsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WithdrawFundsDialogData,
    private fb: FormBuilder
  ) {
    const maxWithdraw = Math.min(this.data.currentBalance, 10000);
    this.withdrawForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(100), Validators.max(maxWithdraw)]],
      accountDetails: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    // Update quick amounts based on balance
    this.quickAmounts = this.quickAmounts.filter(amt => amt <= this.data.currentBalance);
  }

  selectQuickAmount(amount: number): void {
    this.withdrawForm.patchValue({ amount });
  }

  selectWithdrawMethod(methodId: string): void {
    this.selectedMethod = methodId;
    // Reset account details when method changes
    this.withdrawForm.patchValue({ accountDetails: '' });
  }

  getSelectedMethod() {
    return this.withdrawMethods.find(m => m.id === this.selectedMethod);
  }

  getAccountLabel(): string {
    switch (this.selectedMethod) {
      case 'bank': return 'Account Number';
      case 'upi': return 'UPI ID';
      case 'paytm': return 'Paytm Mobile Number';
      default: return 'Account Details';
    }
  }

  getAccountPlaceholder(): string {
    switch (this.selectedMethod) {
      case 'bank': return 'Enter your bank account number';
      case 'upi': return 'example@upi';
      case 'paytm': return 'Enter Paytm registered mobile';
      default: return 'Enter account details';
    }
  }

  get remainingBalance(): number {
    const amount = this.withdrawForm.get('amount')?.value || 0;
    return Math.max(0, this.data.currentBalance - amount);
  }

  get isFormValid(): boolean {
    return this.withdrawForm.valid && !!this.selectedMethod;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.isFormValid) return;

    this.isProcessing = true;

    // Simulate processing
    setTimeout(() => {
      const result: WithdrawFundsDialogResult = {
        amount: this.withdrawForm.value.amount,
        withdrawMethod: this.selectedMethod,
        accountDetails: this.withdrawForm.value.accountDetails
      };
      this.dialogRef.close(result);
    }, 1500);
  }
}
