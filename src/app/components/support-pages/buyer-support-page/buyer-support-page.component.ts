import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OrderService } from '../../../project/services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface SupportCard {
  icon: string;
  title: string;
  description: string;
  action: string;
}

export interface ShippingInfo {
  icon: string;
  title: string;
  timeline: string;
  features: string[];
}

export interface PaymentMethod {
  icon: string;
  name: string;
}

export interface ContactChannel {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  action: string;
}

export interface FAQ {
  question: string;
  answer: string;
  category: string;
  expanded?: boolean;
}


@Component({
  selector: 'app-buyer-support-page',
  templateUrl: './buyer-support-page.component.html',
  styleUrls: ['./buyer-support-page.component.css']
})
export class BuyerSupportPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  orderTrackingId: string = '';
  selectedCategory: string = 'Orders';
  isLoading: boolean = false;
  isChatOpen: boolean = false;

  constructor(
    private router: Router,
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {}
  
  supportCards: SupportCard[] = [
    {
      icon: 'fas fa-shopping-cart',
      title: 'Order Help',
      description: 'Track, modify, or cancel your orders with ease',
      action: 'order-help'
    },
    {
      icon: 'fas fa-truck',
      title: 'Shipping & Delivery',
      description: 'Get updates on delivery status and timelines',
      action: 'shipping-help'
    },
    {
      icon: 'fas fa-credit-card',
      title: 'Payment Issues',
      description: 'Resolve payment problems and process refunds',
      action: 'payment-help'
    },
    {
      icon: 'fas fa-undo-alt',
      title: 'Returns & Disputes',
      description: 'Easy returns for damaged or incorrect items',
      action: 'returns-help'
    }
  ];

  shippingInfo: ShippingInfo[] = [
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Local Delivery',
      timeline: '1-2 business days',
      features: [
        'Same-day delivery available',
        'Local vendor priority',
        'Minimal shipping cost'
      ]
    },
    {
      icon: 'fas fa-truck',
      title: 'National Shipping',
      timeline: '3-7 business days',
      features: [
        'Free shipping above ₹500',
        'Express delivery options',
        'Real-time tracking'
      ]
    },
    {
      icon: 'fas fa-globe',
      title: 'International',
      timeline: '7-14 business days',
      features: [
        'Worldwide delivery',
        'Customs support',
        'Insurance included'
      ]
    }
  ];

  paymentMethods: PaymentMethod[] = [
    { icon: 'fas fa-mobile-alt', name: 'UPI' },
    { icon: 'fas fa-credit-card', name: 'Cards' },
    { icon: 'fas fa-university', name: 'Net Banking' },
    { icon: 'fas fa-wallet', name: 'Wallets' },
    { icon: 'fas fa-money-bill-wave', name: 'Cash on Delivery' }
  ];

  contactChannels: ContactChannel[] = [
    {
      icon: 'fas fa-phone',
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      buttonText: 'Call Now',
      action: 'phone-support'
    },
    {
      icon: 'fas fa-comments',
      title: 'Live Chat',
      description: 'Get instant help through live chat',
      buttonText: 'Chat Now',
      action: 'live-chat'
    },
    {
      icon: 'fas fa-envelope',
      title: 'Email Support',
      description: 'Send us detailed queries via email',
      buttonText: 'Email Us',
      action: 'email-support'
    },
    {
      icon: 'fas fa-phone-alt',
      title: 'Request Callback',
      description: 'We will call you back at your convenience',
      buttonText: 'Request Call',
      action: 'callback-request'
    }
  ];

  faqCategories: string[] = ['Orders', 'Returns', 'Payments', 'Shipping', 'G-Tag Products'];

  allFAQs: FAQ[] = [
    // Orders Category
    {
      question: 'How do I track my order?',
      answer: 'You can track your order by entering your Order ID in the tracking section above or by logging into your account to view all your orders.',
      category: 'Orders'
    },
    {
      question: 'Can I modify or cancel my order?',
      answer: 'Yes, you can modify or cancel your order within 1 hour of placing it. After that, the order moves to processing and cannot be changed.',
      category: 'Orders'
    },
    {
      question: 'How long does order processing take?',
      answer: 'Order processing typically takes 1-2 business days. G-Tag certified products may take slightly longer as they undergo additional quality checks.',
      category: 'Orders'
    },
    
    // Returns Category
    {
      question: 'What is your return policy?',
      answer: 'We offer a 7-day return window for most products. Items must be unused and in original packaging. G-Tag products have the same return policy.',
      category: 'Returns'
    },
    {
      question: 'How do I initiate a return?',
      answer: 'Click the "Request a Return" button above or log into your account and select the order you want to return. Follow the simple step-by-step process.',
      category: 'Returns'
    },
    {
      question: 'When will I receive my refund?',
      answer: 'Refunds are processed within 5-7 business days after we receive the returned item. The amount will be credited to your original payment method.',
      category: 'Returns'
    },
    
    // Payments Category
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept UPI, credit/debit cards, net banking, digital wallets, and cash on delivery for eligible orders.',
      category: 'Payments'
    },
    {
      question: 'Is my payment information secure?',
      answer: 'Yes, all payments are processed through government-approved secure gateways with SSL encryption and comply with RBI guidelines.',
      category: 'Payments'
    },
    {
      question: 'What if my payment failed?',
      answer: 'If your payment fails, you can retry with the same or different payment method. Any deducted amount will be refunded within 3-5 business days.',
      category: 'Payments'
    },
    
    // Shipping Category
    {
      question: 'Do you offer free shipping?',
      answer: 'Yes, we offer free shipping on orders above ₹500 for national delivery. Local delivery charges vary by location.',
      category: 'Shipping'
    },
    {
      question: 'Can I change my delivery address?',
      answer: 'You can change your delivery address before the order is shipped. Contact our support team or update it in your account.',
      category: 'Shipping'
    },
    {
      question: 'Do you deliver internationally?',
      answer: 'Yes, we deliver G-Tag certified products internationally to promote Indian local products globally. Shipping costs and delivery times vary by destination.',
      category: 'Shipping'
    },
    
    // G-Tag Products Category
    {
      question: 'What does G-Tag certification mean?',
      answer: 'G-Tag certification ensures that products are authentic, locally sourced, and meet government quality standards. It supports local artisans and businesses.',
      category: 'G-Tag Products'
    },
    {
      question: 'Are G-Tag products more expensive?',
      answer: 'G-Tag products are competitively priced. While some may have premium pricing due to quality and authenticity, they offer excellent value for money.',
      category: 'G-Tag Products'
    },
    {
      question: 'How can I verify G-Tag authenticity?',
      answer: 'Each G-Tag product comes with a unique certification number that can be verified on our platform. Look for the official G-Tag badge on product pages.',
      category: 'G-Tag Products'
    }
  ];

  filteredFAQs: FAQ[] = [];

  ngOnInit(): void {
    this.filteredFAQs = this.allFAQs.filter(faq => faq.category === this.selectedCategory);
  }

  // Navigation and UI Methods
  scrollToFAQ(): void {
    const faqElement = document.getElementById('faq');
    if (faqElement) {
      faqElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Support Card Actions
  handleCardClick(action: string): void {
    switch (action) {
      case 'order-help':
        this.redirectToOrderHelp();
        break;
      case 'shipping-help':
        this.redirectToShippingHelp();
        break;
      case 'payment-help':
        this.redirectToPaymentHelp();
        break;
      case 'returns-help':
        this.redirectToReturnsHelp();
        break;
      default:
        break;
    }
  }

  private redirectToOrderHelp(): void {
    this.router.navigate(['/order-tracking']);
  }

  private redirectToShippingHelp(): void {
    this.router.navigate(['/support/shipping-info']);
  }

  private redirectToPaymentHelp(): void {
    this.router.navigate(['/support/payments']);
  }

  private redirectToReturnsHelp(): void {
    this.router.navigate(['/returns']);
  }

  // Order Tracking
  trackOrder(): void {
    if (this.orderTrackingId.trim()) {
      if (!this.validateOrderId(this.orderTrackingId.trim())) {
        this.snackBar.open('Please enter a valid Order ID format (e.g., ORD123456)', 'Close', { 
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      this.isLoading = true;
      this.orderService.getOrderById(this.orderTrackingId.trim())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (order) => {
            this.isLoading = false;
            // Navigate to order tracking page with order details
            this.router.navigate(['/order-tracking', this.orderTrackingId]);
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open('Order not found. Please check the Order ID and try again.', 'Close', {
              duration: 4000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      this.snackBar.open('Please enter a valid Order ID', 'Close', { 
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  // Returns
  requestReturn(): void {
    this.router.navigate(['/returns'], { queryParams: { tab: 'create' } });
  }

  // FAQ Management
  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.filteredFAQs = this.allFAQs.filter(faq => faq.category === category);
    
    // Reset all expanded states
    this.filteredFAQs.forEach(faq => faq.expanded = false);
  }

  toggleFAQ(faq: FAQ): void {
    faq.expanded = !faq.expanded;
  }

  // Contact Support Actions
  handleContactClick(action: string): void {
    switch (action) {
      case 'phone-support':
        this.initiatePhoneCall();
        break;
      case 'live-chat':
        this.startLiveChat();
        break;
      case 'email-support':
        this.openEmailSupport();
        break;
      case 'callback-request':
        this.requestCallback();
        break;
      default:
        break;
    }
  }

  private initiatePhoneCall(): void {
    window.open('tel:+911234567890', '_self');
  }

  private startLiveChat(): void {
    // Toggle live chat widget visibility
    this.isChatOpen = true;
    this.snackBar.open('Live chat is opening...', '', { duration: 2000 });
    // The actual chat widget will be handled by the live-chat-widget component
  }

  private openEmailSupport(): void {
    window.open('mailto:support@gtag-marketplace.gov.in?subject=Support Request', '_self');
  }

  private requestCallback(): void {
    // Navigate to contact page with callback intent
    this.router.navigate(['/contact-us'], { queryParams: { type: 'callback' } });
  }

  // Utility Methods
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.orderTrackingId = target.value;
  }

  // Animation and UX Enhancement Methods
  onCardHover(event: Event): void {
    // Add any hover effects if needed
    const card = event.target as HTMLElement;
    // Example: Add additional hover animations
  }

  onCardLeave(event: Event): void {
    // Remove hover effects if needed
    const card = event.target as HTMLElement;
    // Example: Remove hover animations
  }

  // Accessibility Methods
  onKeyPress(event: KeyboardEvent, action: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }

  // Form Validation
  validateOrderId(orderId: string): boolean {
    // Implement order ID validation logic
    const orderIdPattern = /^ORD\d{6}$/;
    return orderIdPattern.test(orderId);
  }

  // Error Handling
  handleError(error: any): void {
    console.error('Support page error:', error);
    this.snackBar.open('An error occurred. Please try again later.', 'Close', {
      duration: 4000,
      panelClass: ['error-snackbar']
    });
  }

  setLoadingState(loading: boolean): void {
    this.isLoading = loading;
  }

  // Analytics and Tracking
  trackUserInteraction(action: string, category: string): void {
    // Implement analytics tracking
    // Example: Google Analytics or other tracking service
  }
}