
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-returns-and-refund',
  templateUrl: './returns-and-refund.component.html',
  styleUrls: ['./returns-and-refund.component.css']
})
export class ReturnsAndRefundComponent implements OnInit {

  // Animation and interaction states
  isLoading = false;
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'info' = 'info';

  // Data structures for dynamic content
  eligibilityItems = [
    {
      id: 1,
      title: 'Damaged on Delivery',
      description: 'Items received in damaged condition',
      timeframe: 'Within 3 days',
      eligible: true,
      icon: 'damage'
    },
    {
      id: 2,
      title: 'Wrong Item Received',
      description: 'Different product than ordered',
      timeframe: 'Within 7 days',
      eligible: true,
      icon: 'wrong'
    },
    {
      id: 3,
      title: 'Not as Described',
      description: 'Product doesn\'t match description',
      timeframe: 'Within 5 days',
      eligible: true,
      icon: 'mismatch'
    },
    {
      id: 4,
      title: 'Change of Mind',
      description: 'No longer needed or wanted',
      timeframe: 'Not eligible',
      eligible: false,
      icon: 'mind'
    },
    {
      id: 5,
      title: 'Customized Products',
      description: 'Made-to-order or personalized items',
      timeframe: 'Not eligible',
      eligible: false,
      icon: 'custom'
    },
    {
      id: 6,
      title: 'Perishable Items',
      description: 'Food items and perishables',
      timeframe: 'Not eligible',
      eligible: false,
      icon: 'perishable'
    }
  ];

  processSteps = [
    {
      id: 1,
      title: 'Request Return',
      description: 'Go to "My Orders" and click "Request Return" for the eligible item',
      icon: 'request',
      completed: false
    },
    {
      id: 2,
      title: 'Upload Evidence',
      description: 'Provide photos or documentation if the product is damaged or incorrect',
      icon: 'upload',
      completed: false
    },
    {
      id: 3,
      title: 'Pack & Ship',
      description: 'Pack the item securely and hand over to our delivery partner',
      icon: 'pack',
      completed: false
    },
    {
      id: 4,
      title: 'Refund Processing',
      description: 'Refund will be initiated once seller confirms receipt of the item',
      icon: 'refund',
      completed: false
    }
  ];

  refundInfo = [
    {
      id: 1,
      title: 'Processing Time',
      description: 'Refunds are processed within 5-10 working days after approval',
      icon: 'time',
      highlight: '5-10 working days'
    },
    {
      id: 2,
      title: 'Refund Method',
      description: 'Amount will be refunded to your original payment method',
      icon: 'payment',
      highlight: 'original payment method'
    },
    {
      id: 3,
      title: 'Shipping Charges',
      description: 'Free reverse shipping for damaged/wrong items. ₹50-₹100 deduction for other returns',
      icon: 'shipping',
      highlight: 'Free reverse shipping'
    }
  ];

  // User interaction tracking
  userInteractions = {
    pageViews: 0,
    buttonClicks: 0,
    sectionViews: new Set<string>(),
    timeOnPage: 0
  };

  // Component lifecycle
  ngOnInit(): void {
    this.initializeComponent();
    this.trackPageView();
    this.startTimeTracking();
  }

  ngOnDestroy(): void {
    this.stopTimeTracking();
  }

  // Initialize component with animations
  private initializeComponent(): void {
    this.isLoading = true;
    
    // Simulate loading time for smooth animation
    setTimeout(() => {
      this.isLoading = false;
      this.animateEntrance();
    }, 800);
  }

  // Animate page entrance
  private animateEntrance(): void {
    const elements = document.querySelectorAll('.returns-container > *');
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animate-fade-in');
      }, index * 200);
    });
  }

  // Track user interactions
  private trackPageView(): void {
    this.userInteractions.pageViews++;
    this.trackSectionView('header');
  }

  private trackSectionView(sectionName: string): void {
    this.userInteractions.sectionViews.add(sectionName);
  }

  private startTimeTracking(): void {
    const startTime = Date.now();
    setInterval(() => {
      this.userInteractions.timeOnPage = Date.now() - startTime;
    }, 1000);
  }

  private stopTimeTracking(): void {
    // Analytics could be sent here
  }

  // User action handlers
  onStepClick(stepId: number): void {
    this.userInteractions.buttonClicks++;
    this.trackSectionView('process-step');
    
    const step = this.processSteps.find(s => s.id === stepId);
    if (step) {
      this.showNotification = true;
      this.notificationMessage = `Step ${stepId}: ${step.title} - ${step.description}`;
      this.notificationType = 'info';
      
      // Auto-hide notification
      setTimeout(() => {
        this.showNotification = false;
      }, 5000);
    }
  }

  onEligibilityClick(itemId: number): void {
    this.userInteractions.buttonClicks++;
    this.trackSectionView('eligibility');
    
    const item = this.eligibilityItems.find(i => i.id === itemId);
    if (item) {
      const status = item.eligible ? 'eligible' : 'not eligible';
      this.showNotification = true;
      this.notificationMessage = `${item.title} is ${status} for return - ${item.timeframe}`;
      this.notificationType = item.eligible ? 'success' : 'error';
      
      setTimeout(() => {
        this.showNotification = false;
      }, 4000);
    }
  }

  onRefundInfoClick(infoId: number): void {
    this.userInteractions.buttonClicks++;
    this.trackSectionView('refund-info');
    
    const info = this.refundInfo.find(i => i.id === infoId);
    if (info) {
      this.showNotification = true;
      this.notificationMessage = `${info.title}: ${info.description}`;
      this.notificationType = 'info';
      
      setTimeout(() => {
        this.showNotification = false;
      }, 4000);
    }
  }

  // Support actions
  openLiveChat(): void {
    this.userInteractions.buttonClicks++;
    this.trackSectionView('support');
    
    // Simulate opening live chat
    this.showNotification = true;
    this.notificationMessage = 'Live chat will open shortly. Please wait...';
    this.notificationType = 'info';
    
    setTimeout(() => {
      this.showNotification = false;
      // Here you would integrate with your actual chat service
    }, 2000);
  }

  openEmailSupport(): void {
    this.userInteractions.buttonClicks++;
    this.trackSectionView('support');
    
    // Open email client
    const subject = encodeURIComponent('Returns & Refunds Inquiry');
    const body = encodeURIComponent('Hello, I have a question about returns and refunds...');
    window.location.href = `mailto:support@yourgovstore.in?subject=${subject}&body=${body}`;
  }

  callPhoneSupport(): void {
    this.userInteractions.buttonClicks++;
    this.trackSectionView('support');
    
    // On mobile, this would initiate a phone call
    window.location.href = 'tel:1800-GOV-HELP';
  }

  // Utility methods
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      this.trackSectionView(sectionId);
    }
  }

  // Accessibility helpers
  onKeyPress(event: KeyboardEvent, action: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }

  // Dynamic content helpers
  getEligibilityIcon(iconType: string): string {
    const iconMap: { [key: string]: string } = {
      damage: '🔨',
      wrong: '❌',
      mismatch: '📝',
      mind: '🤔',
      custom: '🎨',
      perishable: '🍎'
    };
    return iconMap[iconType] || '📦';
  }

  getProcessIcon(iconType: string): string {
    const iconMap: { [key: string]: string } = {
      request: '📋',
      upload: '📸',
      pack: '📦',
      refund: '💳'
    };
    return iconMap[iconType] || '⚙️';
  }

  getRefundIcon(iconType: string): string {
    const iconMap: { [key: string]: string } = {
      time: '⏰',
      payment: '💳',
      shipping: '🚚'
    };
    return iconMap[iconType] || '💰';
  }

  // Form validation (if needed for future enhancements)
  validateReturnRequest(formData: any): boolean {
    // Basic validation logic
    return formData.orderId && formData.reason && formData.description;
  }

  // Error handling
  handleError(error: any): void {
    this.showNotification = true;
    this.notificationMessage = 'An error occurred. Please try again or contact support.';
    this.notificationType = 'error';
    
    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  // Analytics (for future implementation)
  sendAnalytics(): void {
    // Send interaction data to analytics service
    const analyticsData = {
      page: 'returns-refunds',
      interactions: this.userInteractions,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    // Example: this.analyticsService.track(analyticsData);
  }
}