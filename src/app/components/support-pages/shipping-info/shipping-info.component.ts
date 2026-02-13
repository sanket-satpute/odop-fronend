import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

interface DeliveryStats {
  citiesCovered: number;
  countriesServed: number;
  deliverySuccess: number;
}

interface ShippingPolicy {
  region: string;
  timeframe: string;
  tracking: boolean;
  insurance: string;
  icon: string;
}

@Component({
  selector: 'app-shipping-info',
  templateUrl: './shipping-info.component.html',
  styleUrls: ['./shipping-info.component.css']
})
export class ShippingInfoComponent  implements OnInit, OnDestroy {
  showStickyHelp = false;
  private scrollThreshold = 500;
  private animationInterval: any;

  // Delivery statistics
  deliveryStats: DeliveryStats = {
    citiesCovered: 500,
    countriesServed: 50,
    deliverySuccess: 99.8
  };

  // Shipping policies data
  shippingPolicies: ShippingPolicy[] = [
    {
      region: 'Local Delivery',
      timeframe: '1-3 Days',
      tracking: true,
      insurance: 'Standard',
      icon: '📍'
    },
    {
      region: 'National Delivery',
      timeframe: '3-7 Days',
      tracking: true,
      insurance: 'Standard',
      icon: '🇮🇳'
    },
    {
      region: 'International',
      timeframe: '7-15 Days',
      tracking: true,
      insurance: 'Premium',
      icon: '🌍'
    }
  ];

  // FAQ data
  faqs: FAQ[] = [
    {
      question: 'Can I update my shipping address after placing an order?',
      answer: 'Yes, you can update your shipping address within 2 hours of placing the order. After that, please contact our customer support team for assistance. Address changes may not be possible once the order is dispatched.',
      isOpen: false
    },
    {
      question: 'Do you deliver to remote villages and rural areas?',
      answer: 'Absolutely! We are committed to reaching every corner of India. We partner with India Post and local delivery networks to ensure even the most remote villages receive their G-tag verified products. Delivery may take 1-2 additional days for remote locations.',
      isOpen: false
    },
    {
      question: 'How can I change my delivery time slot?',
      answer: 'You can modify your delivery time slot through your account dashboard or by contacting customer support. We offer flexible delivery slots including morning (9 AM - 1 PM), afternoon (2 PM - 6 PM), and evening (6 PM - 9 PM) options.',
      isOpen: false
    },
    {
      question: 'Is international shipping insured?',
      answer: 'Yes, all international shipments are automatically insured up to the product value. We also handle customs documentation and duties (where applicable) to ensure smooth delivery to your doorstep.',
      isOpen: false
    },
    {
      question: 'What happens if my package is damaged during shipping?',
      answer: 'We take full responsibility for shipping damage. If you receive a damaged package, please report it within 24 hours with photos. We will arrange for a replacement or full refund immediately.',
      isOpen: false
    },
    {
      question: 'Can I track my order in real-time?',
      answer: 'Yes! Once your order is dispatched, you will receive a tracking link via SMS and email. You can also track your order in real-time through your account dashboard with live location updates.',
      isOpen: false
    }
  ];

  // Delivery partners data
  deliveryPartners = [
    { name: 'India Post', description: 'Nationwide reach', icon: '📮' },
    { name: 'Delhivery', description: 'Express delivery', icon: '🚚' },
    { name: 'Blue Dart', description: 'Premium service', icon: '✈️' },
    { name: 'Ekart', description: 'E-commerce specialist', icon: '📦' },
    { name: 'DHL', description: 'International expert', icon: '🌍' },
    { name: 'FedEx', description: 'Global network', icon: '⚡' }
  ];

  constructor() { }

  ngOnInit(): void {
    this.startAnimation();
  }
  ngOnDestroy(): void {
    this.stopAnimation();
  }
  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event): void {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    this.showStickyHelp = scrollPosition > this.scrollThreshold;
  }
  startAnimation(): void {
    this.animationInterval = setInterval(() => {
      this.deliveryStats.citiesCovered += Math.floor(Math.random() * 10);
      this.deliveryStats.countriesServed += Math.floor(Math.random() * 2);
      this.deliveryStats.deliverySuccess = parseFloat((this.deliveryStats.deliverySuccess + (Math.random() * 0.1 - 0.05)).toFixed(1));
    }, 5000);
  }
  stopAnimation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }
  toggleFAQ(faqIndex: number): void {
    this.faqs[faqIndex].isOpen = !this.faqs[faqIndex].isOpen;
  }
  getIconForRegion(region: string): string {
    switch (region) {
      case 'Local Delivery':
        return '📍';
      case 'National Delivery':
        return '🇮🇳';
      case 'International':
        return '🌍';
      default:
        return '';
    }
  }
  getIconForPartner(partner: { name: string, description: string, icon: string }): string {
    return partner.icon || '📦'; // Default icon if none provided
  }
  getIconForPolicy(policy: ShippingPolicy): string {
    switch (policy.region) {
      case 'Local Delivery':
        return '📍';
      case 'National Delivery':
        return '🇮🇳';
      case 'International':
        return '🌍';
      default:
        return '';
    }
  }
  getIconForInsurance(insurance: string): string {
    switch (insurance) {
      case 'Standard':
        return '✅'; // Checkmark for standard insurance
      case 'Premium':
        return '💎'; // Diamond for premium insurance
      default:
        return '❓'; // Question mark for unknown
    }
  }
  getIconForTracking(tracking: boolean): string {
    return tracking ? '📦' : '❌'; // Box icon for tracking, cross for no tracking
  }
  getIconForTimeframe(timeframe: string): string {
    switch (timeframe) {
      case '1-3 Days':
        return '⏱️'; // Stopwatch for quick delivery
      case '3-7 Days':
        return '📅'; // Calendar for standard delivery
      case '7-15 Days':
        return '🌐'; // Globe for international delivery
      default:
        return '❓'; // Question mark for unknown timeframe
    }
  }
  getIconForRegionPolicy(region: string): string {
    switch (region) {
      case 'Local Delivery':
        return '📍'; // Pin icon for local delivery
      case 'National Delivery':
        return '🇮🇳'; // Flag icon for national delivery
      case 'International':
        return '🌍'; // Globe icon for international delivery
      default:
        return ''; // Default case if region is unknown
    }
  }
  getIconForInsurancePolicy(insurance: string): string {
    switch (insurance) {
      case 'Standard':
        return '✅'; // Checkmark for standard insurance
      case 'Premium':
        return '💎'; // Diamond for premium insurance
      default:
        return '❓'; // Question mark for unknown insurance type
    }
  }
  getIconForTrackingPolicy(tracking: boolean): string {
    return tracking ? '📦' : '❌'; // Box icon for tracking, cross for no tracking
  }
  getIconForTimeframePolicy(timeframe: string): string {
    switch (timeframe) {
      case '1-3 Days':
        return '⏱️'; // Stopwatch for quick delivery
      case '3-7 Days':
        return '📅'; // Calendar for standard delivery
      case '7-15 Days':
        return '🌐'; // Globe for international delivery
      default:
        return '❓'; // Question mark for unknown timeframe
    }
  }
}
// Note: The icons used in this component are simple text representations. In a real application,
// you would likely use an icon library like FontAwesome or Material Icons for better visuals.
// The icons can be replaced with actual SVG or font icons as per the design requirements.
