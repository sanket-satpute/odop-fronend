import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  icon: string;
  price: number;
  originalPrice?: number;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  color: string;
  gradient: string;
}

@Component({
  selector: 'app-premium-membership-dialog',
  templateUrl: './premium-membership-dialog.component.html',
  styleUrls: ['./premium-membership-dialog.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(40px) scale(0.95)' }),
          stagger(100, [
            animate('500ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('pulse', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('600ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class PremiumMembershipDialogComponent implements OnInit {
  
  selectedPlan: string = 'plus';
  isProcessing: boolean = false;
  billingCycle: 'monthly' | 'yearly' = 'yearly';

  plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      icon: 'fas fa-leaf',
      price: 0,
      period: 'forever',
      description: 'Perfect for getting started',
      color: '#64748b',
      gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      features: [
        { text: 'Browse unlimited products', included: true },
        { text: 'Basic search filters', included: true },
        { text: 'Standard delivery (5-7 days)', included: true },
        { text: 'Email support', included: true },
        { text: 'Order tracking', included: true },
        { text: 'Priority support', included: false },
        { text: 'Exclusive discounts', included: false },
        { text: 'Early access to sales', included: false },
        { text: 'Free express delivery', included: false },
        { text: 'Cashback rewards', included: false }
      ]
    },
    {
      id: 'plus',
      name: 'Plus',
      icon: 'fas fa-bolt',
      price: 99,
      originalPrice: 149,
      period: 'month',
      description: 'Best for regular shoppers',
      color: '#FFA500',
      gradient: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
      popular: true,
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'Advanced search & filters', included: true },
        { text: 'Priority delivery (2-3 days)', included: true, highlight: true },
        { text: '5% cashback on all orders', included: true, highlight: true },
        { text: 'Priority customer support', included: true },
        { text: 'Exclusive member discounts', included: true, highlight: true },
        { text: 'Early access to flash sales', included: true },
        { text: 'Free returns (30 days)', included: true },
        { text: 'Birthday special offers', included: true },
        { text: 'Dedicated account manager', included: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: 'fas fa-crown',
      price: 249,
      originalPrice: 399,
      period: 'month',
      description: 'Ultimate shopping experience',
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      features: [
        { text: 'Everything in Plus', included: true },
        { text: 'Free express delivery', included: true, highlight: true },
        { text: '10% cashback on all orders', included: true, highlight: true },
        { text: 'VIP customer support 24/7', included: true, highlight: true },
        { text: 'Exclusive VIP-only products', included: true },
        { text: 'First access to new arrivals', included: true },
        { text: 'Free gift wrapping', included: true },
        { text: 'Dedicated account manager', included: true, highlight: true },
        { text: 'Quarterly surprise gifts', included: true },
        { text: 'Invite to exclusive events', included: true }
      ]
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<PremiumMembershipDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Pre-select recommended plan
    this.selectedPlan = 'plus';
  }

  selectPlan(planId: string): void {
    this.selectedPlan = planId;
  }

  getDisplayPrice(plan: PricingPlan): number {
    if (plan.price === 0) return 0;
    return this.billingCycle === 'yearly' 
      ? Math.round(plan.price * 0.8) // 20% discount for yearly
      : plan.price;
  }

  getYearlySavings(plan: PricingPlan): number {
    if (plan.price === 0) return 0;
    const monthlyTotal = plan.price * 12;
    const yearlyTotal = Math.round(plan.price * 0.8) * 12;
    return monthlyTotal - yearlyTotal;
  }

  toggleBillingCycle(): void {
    this.billingCycle = this.billingCycle === 'monthly' ? 'yearly' : 'monthly';
  }

  subscribeToPlan(): void {
    if (this.selectedPlan === 'free') {
      this.snackBar.open('You are already on the Free plan!', 'OK', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    this.isProcessing = true;
    const selectedPlanDetails = this.plans.find(p => p.id === this.selectedPlan);
    
    // Simulate payment processing
    setTimeout(() => {
      this.isProcessing = false;
      this.snackBar.open(
        `🎉 Welcome to ${selectedPlanDetails?.name}! Your premium journey begins now.`, 
        'Awesome!', 
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        }
      );
      this.dialogRef.close({ subscribed: true, plan: this.selectedPlan });
    }, 2000);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getSelectedPlan(): PricingPlan | undefined {
    return this.plans.find(p => p.id === this.selectedPlan);
  }
}
