import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface AddMoneyDialogData {
  currentBalance: number;
}

export interface AddMoneyDialogResult {
  amount: number;
  paymentMethod: string;
}

@Component({
  selector: 'app-add-money-dialog',
  templateUrl: './add-money-dialog.component.html',
  styleUrls: ['./add-money-dialog.component.css']
})
export class AddMoneyDialogComponent implements OnInit {

  addMoneyForm!: FormGroup;
  isProcessing: boolean = false;
  
  // Quick amount options
  quickAmounts: number[] = [100, 250, 500, 1000, 2000, 5000];
  
  // Payment methods
  paymentMethods = [
    { id: 'upi', name: 'UPI', icon: 'fas fa-mobile-alt', description: 'Pay using any UPI app' },
    { id: 'card', name: 'Debit/Credit Card', icon: 'fas fa-credit-card', description: 'Visa, Mastercard, RuPay' },
    { id: 'netbanking', name: 'Net Banking', icon: 'fas fa-university', description: 'All major banks supported' }
  ];
  
  selectedPaymentMethod: string = 'upi';

  constructor(
    public dialogRef: MatDialogRef<AddMoneyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddMoneyDialogData,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.addMoneyForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(100), Validators.max(10000)]],
      paymentMethod: ['upi', Validators.required]
    });
  }

  selectQuickAmount(amount: number): void {
    this.addMoneyForm.patchValue({ amount: amount });
  }

  selectPaymentMethod(methodId: string): void {
    this.selectedPaymentMethod = methodId;
    this.addMoneyForm.patchValue({ paymentMethod: methodId });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.addMoneyForm.valid) {
      this.isProcessing = true;
      
      // Simulate payment processing
      setTimeout(() => {
        this.isProcessing = false;
        const result: AddMoneyDialogResult = {
          amount: this.addMoneyForm.value.amount,
          paymentMethod: this.addMoneyForm.value.paymentMethod
        };
        this.dialogRef.close(result);
      }, 1500);
    }
  }

  get amountControl() {
    return this.addMoneyForm.get('amount');
  }

  get isAmountValid(): boolean {
    const amount = this.amountControl?.value;
    return amount >= 100 && amount <= 10000;
  }
}
