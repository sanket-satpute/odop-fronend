import { Component, OnInit, OnDestroy } from '@angular/core';

interface SupportArea {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface OnboardingStep {
  title: string;
  description: string;
}

interface SupportChannel {
  type: string;
  icon: string;
  title: string;
  info: string;
  buttonText: string;
}

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

interface Resource {
  icon: string;
  title: string;
  description: string;
  url: string;
}

interface SuccessStory {
  vendorName: string;
  location: string;
  rating: string;
  quote: string;
  product: string;
  hasGtag: boolean;
}

@Component({
  selector: 'app-seller-support-page',
  templateUrl: './seller-support-page.component.html',
  styleUrls: ['./seller-support-page.component.css']
})
export class SellerSupportPageComponent  implements OnInit, OnDestroy {
  
  supportAreas: SupportArea[] = [
    {
      id: 'product-listing',
      icon: '📝',
      title: 'Product Listing Help',
      description: 'Learn how to list new items, G-tag verification process, and image guidelines for maximum visibility.'
    },
    {
      id: 'order-management',
      icon: '📦',
      title: 'Order Management',
      description: 'Master order handling, shipping processes, cancellations, and customer communication tools.'
    },
    {
      id: 'payments',
      icon: '💰',
      title: 'Payments & Payouts',
      description: 'Understand payment cycles, account linking, transaction fees, and dispute resolution procedures.'
    },
    {
      id: 'returns',
      icon: '🧾',
      title: 'Returns & Complaints',
      description: 'Handle returns efficiently, resolve customer complaints, and maintain high seller ratings.'
    }
  ];

  onboardingSteps: OnboardingStep[] = [
    {
      title: 'Register as Vendor',
      description: 'Create your seller account with basic business information'
    },
    {
      title: 'Upload G-tag Documents',
      description: 'Submit required documents for government verification'
    },
    {
      title: 'Add Product Listings',
      description: 'List your products with detailed descriptions and images'
    },
    {
      title: 'Start Selling',
      description: 'Go live and start receiving orders from customers'
    }
  ];

  gtagBenefits: string[] = [
    'Enhanced product visibility in search results',
    'Government credibility badge for customer trust',
    'Priority customer support and faster dispute resolution',
    'Access to exclusive government procurement opportunities',
    'Reduced platform fees and promotional benefits'
  ];

  supportChannels: SupportChannel[] = [
    {
      type: 'phone',
      icon: '📞',
      title: 'Seller Helpline',
      info: '+91-1800-XXX-XXXX (Mon–Sat, 10 AM to 6 PM)',
      buttonText: 'Call Now'
    },
    {
      type: 'email',
      icon: '📧',
      title: 'Email Support',
      info: 'seller.support@yourportal.gov.in',
      buttonText: 'Send Email'
    },
    {
      type: 'chat',
      icon: '💬',
      title: 'Live Chat',
      info: '24x7 instant support for urgent queries',
      buttonText: 'Start Chat'
    },
    {
      type: 'callback',
      icon: '📝',
      title: 'Request Callback',
      info: 'Get a call back from our experts within 2 hours',
      buttonText: 'Request Call'
    }
  ];

  faqs: FAQ[] = [
    {
      question: 'How long does G-tag verification take?',
      answer: 'G-tag verification typically takes 3-5 business days once all required documents are submitted. You will receive email updates throughout the process.',
      isOpen: false
    },
    {
      question: 'What are the fees for selling on the platform?',
      answer: 'Platform fees vary by category, ranging from 2-8% of the sale price. G-tag verified sellers get a 1% discount on all fees.',
      isOpen: false
    },
    {
      question: 'How do I handle returns and refunds?',
      answer: 'Returns are processed through your seller dashboard. You have 24 hours to approve/reject return requests. Refunds are processed automatically upon approval.',
      isOpen: false
    },
    {
      question: 'Can I sell internationally?',
      answer: 'Yes, G-tag verified sellers can participate in our international marketplace program with additional documentation and compliance requirements.',
      isOpen: false
    },
    {
      question: 'What payment methods do you support?',
      answer: 'We support bank transfers, UPI, digital wallets, and integrated payment gateways. Payouts are processed within 24-48 hours.',
      isOpen: false
    },
    {
      question: 'How do I improve my seller rating?',
      answer: 'Maintain high product quality, fast shipping, good customer service, and prompt responses to customer queries to improve your rating.',
      isOpen: false
    }
  ];

  resources: Resource[] = [
    {
      icon: '📄',
      title: 'Seller Guidelines',
      description: 'Complete guide to platform policies and best practices',
      url: '/downloads/seller-guidelines.pdf'
    },
    {
      icon: '✅',
      title: 'G-tag Compliance Checklist',
      description: 'Step-by-step checklist for G-tag verification',
      url: '/downloads/gtag-checklist.pdf'
    },
    {
      icon: '📊',
      title: 'Bulk Upload Template',
      description: 'Excel template for uploading multiple products',
      url: '/downloads/bulk-upload-template.xlsx'
    },
    {
      icon: '🎥',
      title: 'Video Tutorials',
      description: 'Access our complete video tutorial library',
      url: '/help/tutorials'
    }
  ];

  successStories: SuccessStory[] = [
    {
      vendorName: 'Rajesh Kumar',
      location: 'Jaipur, Rajasthan',
      rating: '4.9',
      quote: 'G-tag verification helped me reach customers across India. My sales increased by 300% in just 6 months!',
      product: 'Handcrafted Textiles',
      hasGtag: true
    },
    {
      vendorName: 'Priya Sharma',
      location: 'Bangalore, Karnataka',
      rating: '4.8',
      quote: 'The platform support team guided me through every step. Now I export my products to 15 countries.',
      product: 'Organic Spices',
      hasGtag: true
    },
    {
      vendorName: 'Mohammed Ali',
      location: 'Lucknow, Uttar Pradesh',
      rating: '4.7',
      quote: 'Easy listing process and quick payments. This platform transformed my small business into a thriving enterprise.',
      product: 'Leather Goods',
      hasGtag: false
    },
    {
      vendorName: 'Sunita Devi',
      location: 'Pune, Maharashtra',
      rating: '4.9',
      quote: 'G-tag badge gave my products instant credibility. Customer trust increased significantly.',
      product: 'Handmade Jewelry',
      hasGtag: true
    }
  ];

  // Carousel properties
  currentStoryIndex = 0;
  carouselTransform = 0;
  carouselInterval: any;

  constructor() { }

  ngOnInit(): void {
    this.startCarousel();
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  // Hero section methods
  startSelling(): void {
    // Navigate to vendor onboarding page
    // this.router.navigate(['/vendor/onboarding']);
  }

  // Support area methods
  navigateToSupport(supportId: string): void {
    // this.router.navigate(['/support', supportId]);
  }

  // Onboarding methods
  watchTutorial(): void {
    // Open tutorial modal or navigate to tutorial page
  }

  // G-tag methods
  applyGtag(): void {
    // this.router.navigate(['/gtag/apply']);
  }

  // Support channel methods
  contactSupport(channelType: string): void {
    switch (channelType) {
      case 'phone':
        window.open('tel:+911800XXXXXX');
        break;
      case 'email':
        window.open('mailto:seller.support@yourportal.gov.in');
        break;
      case 'chat':
        // Open chat widget
        break;
      case 'callback':
        // Open callback form modal
        break;
      default:
        break;
    }
  }

  // FAQ methods
  toggleFaq(index: number): void {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }

  // Resource methods
  downloadResource(url: string): void {
    // window.open(url, '_blank');
    
    // Simulate download
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() || 'resource';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Carousel methods
  startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.nextStory();
    }, 5000); // Auto-advance every 5 seconds
  }

  nextStory(): void {
    if (this.currentStoryIndex < this.successStories.length - 1) {
      this.currentStoryIndex++;
    } else {
      this.currentStoryIndex = 0;
    }
    this.updateCarouselTransform();
  }

  previousStory(): void {
    if (this.currentStoryIndex > 0) {
      this.currentStoryIndex--;
    } else {
      this.currentStoryIndex = this.successStories.length - 1;
    }
    this.updateCarouselTransform();
  }

  private updateCarouselTransform(): void {
    // Calculate transform based on card width + gap
    const cardWidth = 350; // min-width of story card
    const gap = 30; // gap between cards
    this.carouselTransform = -(this.currentStoryIndex * (cardWidth + gap));
  }

  // Utility methods
  onMouseEnterCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  onMouseLeaveCarousel(): void {
    this.startCarousel();
  }
}