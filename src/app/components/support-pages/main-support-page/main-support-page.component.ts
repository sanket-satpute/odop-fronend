import { Component, OnInit } from '@angular/core';

interface FAQ {
  question: string;
  answer: string;
  category: string;
  expanded?: boolean;
}

interface VendorStory {
  name: string;
  location: string;
  quote: string;
  image: string;
  salesIncrease: number;
}

@Component({
  selector: 'app-main-support-page',
  templateUrl: './main-support-page.component.html',
  styleUrls: ['./main-support-page.component.css']
})
export class MainSupportPageComponent  implements OnInit {
  
  // Search functionality
  searchQuery: string = '';
  
  // FAQ categories
  faqCategories: string[] = [
    'All',
    'Orders & Shipping',
    'Vendor Onboarding',
    'G-tag Products',
    'Technical Help',
    'Payment Issues'
  ];
  
  activeCategory: string = 'All';
  
  // FAQ data
  faqs: FAQ[] = [
    {
      question: 'How do I track my order?',
      answer: 'You can track your order by logging into your account and visiting the "My Orders" section. You will receive a tracking number via email once your order is shipped.',
      category: 'Orders & Shipping'
    },
    {
      question: 'What is the return policy?',
      answer: 'We offer a 30-day return policy for most items. Products must be in original condition with tags attached. G-tag products have special return conditions due to their perishable nature.',
      category: 'Orders & Shipping'
    },
    {
      question: 'How do I become a vendor on this platform?',
      answer: 'To become a vendor, click on "Become a Seller" in the main menu. You\'ll need to provide business registration documents, tax information, and product details for verification.',
      category: 'Vendor Onboarding'
    },
    {
      question: 'What documents are required for vendor registration?',
      answer: 'Required documents include: Business registration certificate, PAN card, GST registration, bank account details, and address proof. Additional documents may be needed for G-tag products.',
      category: 'Vendor Onboarding'
    },
    {
      question: 'What is a G-tag product?',
      answer: 'G-tag (Geographical-tagged) products are region-specific items that have been certified for their authentic origin and quality. These products represent the heritage and specialties of specific geographical areas.',
      category: 'G-tag Products'
    },
    {
      question: 'How do I apply for G-tag certification?',
      answer: 'To apply for G-tag certification, submit your product details along with origin certificates, quality documentation, and regional authenticity proofs through the G-tag application form.',
      category: 'G-tag Products'
    },
    {
      question: 'I forgot my password. How do I reset it?',
      answer: 'Click on "Forgot Password" on the login page. Enter your registered email address, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.',
      category: 'Technical Help'
    },
    {
      question: 'The website is loading slowly. What should I do?',
      answer: 'Try clearing your browser cache and cookies. If the issue persists, check your internet connection or try accessing the site from a different browser or device.',
      category: 'Technical Help'
    },
    {
      question: 'How do I process refunds for my customers?',
      answer: 'As a vendor, you can process refunds through your vendor dashboard. Navigate to "Orders" > "Refund Requests" and follow the provided steps. Refunds are typically processed within 5-7 business days.',
      category: 'Payment Issues'
    },
    {
      question: 'When will I receive my vendor payments?',
      answer: 'Vendor payments are processed weekly every Friday. You\'ll receive payment for orders delivered and confirmed by customers, minus platform fees and applicable taxes.',
      category: 'Payment Issues'
    }
  ];
  
  // Filtered FAQs based on search and category
  filteredFAQs: FAQ[] = [];
  
  // Vendor success stories
  vendorStories: VendorStory[] = [
    {
      name: 'Rajesh Kumar',
      location: 'Varanasi, Uttar Pradesh',
      quote: 'G-tag certification helped my silk products reach international customers. My sales increased by 300% in just 6 months!',
      image: 'assets/images/vendor-1.jpg',
      salesIncrease: 300
    },
    {
      name: 'Priya Sharma',
      location: 'Jodhpur, Rajasthan',
      quote: 'The platform\'s support team guided me through every step. Now my handicrafts are sold across 15 states.',
      image: 'assets/images/vendor-2.jpg',
      salesIncrease: 250
    },
    {
      name: 'Amit Patel',
      location: 'Kutch, Gujarat',
      quote: 'From local markets to global reach - this platform transformed my textile business completely.',
      image: 'assets/images/vendor-3.jpg',
      salesIncrease: 180
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.filteredFAQs = [...this.faqs];
    this.initializeAnimations();
  }

  /**
   * Filter FAQs based on search query and active category
   */
  filterFAQs(): void {
    let filtered = this.faqs;

    // Filter by category
    if (this.activeCategory !== 'All') {
      filtered = filtered.filter(faq => faq.category === this.activeCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query)
      );
    }

    this.filteredFAQs = filtered;
  }

  /**
   * Set active FAQ category
   */
  setActiveCategory(category: string): void {
    this.activeCategory = category;
    this.filterFAQs();
  }

  /**
   * Toggle FAQ expansion
   */
  toggleFAQ(index: number): void {
    if (this.filteredFAQs[index]) {
      this.filteredFAQs[index].expanded = !this.filteredFAQs[index].expanded;
    }
  }

  /**
   * Navigate to specific support section
   */
  navigateToSection(section: string): void {
    // Implementation depends on your routing setup
    switch (section) {
      case 'buyer':
        // Navigate to buyer support page or scroll to section
        this.scrollToSection('buyer-support');
        break;
      case 'vendor':
        // Navigate to vendor support page or scroll to section
        this.scrollToSection('vendor-support');
        break;
      case 'shipping':
        // Navigate to shipping info page or scroll to section
        this.scrollToSection('shipping-info');
        break;
      case 'returns':
        // Navigate to returns page or scroll to section
        this.scrollToSection('returns-info');
        break;
      default:
        break;
    }
  }

  /**
   * Scroll to specific section (helper method)
   */
  private scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Open live chat functionality
   */
  openLiveChat(): void {
    // Implementation depends on your chat service (e.g., Intercom, Zendesk, custom solution)
    
    // Example: Open chat widget
    // if (window.Intercom) {
    //   window.Intercom('show');
    // }
    
    // Or show a custom chat modal
    this.showChatModal();
  }

  /**
   * Open G-tag application form
   */
  openGtagApplication(): void {
    // Navigate to G-tag application form or open modal
    
    // Example implementation:
    // this.router.navigate(['/gtag-application']);
    // Or open modal with form
    this.showGtagModal();
  }

  /**
   * Call support functionality
   */
  callSupport(): void {
    // Open phone dialer or show call instructions
    const phoneNumber = '18001234567';
    if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      this.showCallInstructions(phoneNumber);
    }
  }

  /**
   * Send email to support
   */
  sendEmail(): void {
    const email = 'support@yourplatform.gov.in';
    const subject = 'Support Request';
    const body = 'Hello Support Team,\n\nI need assistance with:\n\n[Please describe your issue here]\n\nThank you.';
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  /**
   * Open feedback form
   */
  openFeedbackForm(): void {
    // Navigate to feedback form or open modal
    this.showFeedbackModal();
  }

  /**
   * Open contact form
   */
  openContactForm(): void {
    // Navigate to contact form or open modal
    this.showContactModal();
  }

  /**
   * Initialize animations and interactions
   */
  private initializeAnimations(): void {
    // Add intersection observer for scroll animations
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-in');
            }
          });
        },
        { threshold: 0.1 }
      );

      // Observe all sections for animations
      setTimeout(() => {
        const sections = document.querySelectorAll('.hero-section, .quick-access-section, .gtag-section, .faq-section, .contact-section, .success-stories-section');
        sections.forEach(section => observer.observe(section));
      }, 100);
    }
  }

  /**
   * Show chat modal (custom implementation)
   */
  private showChatModal(): void {
    // Create and show chat modal
    const modalHtml = `
      <div class="chat-modal-overlay" id="chatModal">
        <div class="chat-modal">
          <div class="chat-header">
            <h3>Live Chat Support</h3>
            <button onclick="this.closest('.chat-modal-overlay').remove()">×</button>
          </div>
          <div class="chat-body">
            <p>Chat feature is temporarily unavailable. Please use email or phone support.</p>
            <div class="chat-actions">
              <button onclick="window.location.href='mailto:support@yourplatform.gov.in'">Send Email</button>
              <button onclick="window.location.href='tel:18001234567'">Call Now</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  /**
   * Show G-tag application modal
   */
  private showGtagModal(): void {
    const modalHtml = `
      <div class="gtag-modal-overlay" id="gtagModal">
        <div class="gtag-modal">
          <div class="modal-header">
            <h3>G-Tag Application</h3>
            <button onclick="this.closest('.gtag-modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <p>G-tag application process will be available soon. For immediate assistance, please contact our support team.</p>
            <div class="modal-actions">
              <button onclick="window.location.href='mailto:gtag@yourplatform.gov.in'">Contact G-Tag Team</button>
              <button onclick="this.closest('.gtag-modal-overlay').remove()">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  /**
   * Show call instructions
   */
  private showCallInstructions(phoneNumber: string): void {
    const modalHtml = `
      <div class="call-modal-overlay" id="callModal">
        <div class="call-modal">
          <div class="modal-header">
            <h3>Call Support</h3>
            <button onclick="this.closest('.call-modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <p>Please call us at:</p>
            <div class="phone-number">${phoneNumber}</div>
            <p>Available: Monday to Saturday, 10 AM - 6 PM</p>
            <button onclick="this.closest('.call-modal-overlay').remove()">Close</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  /**
   * Show feedback modal
   */
  private showFeedbackModal(): void {
    const modalHtml = `
      <div class="feedback-modal-overlay" id="feedbackModal">
        <div class="feedback-modal">
          <div class="modal-header">
            <h3>Send Feedback</h3>
            <button onclick="this.closest('.feedback-modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <form id="feedbackForm">
              <div class="form-group">
                <label for="feedbackType">Feedback Type:</label>
                <select id="feedbackType" required>
                  <option value="">Select Type</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="general">General Feedback</option>
                </select>
              </div>
              <div class="form-group">
                <label for="feedbackMessage">Message:</label>
                <textarea id="feedbackMessage" rows="4" required placeholder="Please share your feedback..."></textarea>
              </div>
              <div class="form-actions">
                <button type="submit">Send Feedback</button>
                <button type="button" onclick="this.closest('.feedback-modal-overlay').remove()">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  /**
   * Show contact modal
   */
  private showContactModal(): void {
    const modalHtml = `
      <div class="contact-modal-overlay" id="contactModal">
        <div class="contact-modal">
          <div class="modal-header">
            <h3>Contact Support</h3>
            <button onclick="this.closest('.contact-modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <form id="contactForm">
              <div class="form-group">
                <label for="contactName">Full Name:</label>
                <input type="text" id="contactName" required>
              </div>
              <div class="form-group">
                <label for="contactEmail">Email:</label>
                <input type="email" id="contactEmail" required>
              </div>
              <div class="form-group">
                <label for="contactSubject">Subject:</label>
                <input type="text" id="contactSubject" required>
              </div>
              <div class="form-group">
                <label for="contactMessage">Message:</label>
                <textarea id="contactMessage" rows="4" required placeholder="Describe your issue or question..."></textarea>
              </div>
              <div class="form-actions">
                <button type="submit">Send Message</button>
                <button type="button" onclick="this.closest('.contact-modal-overlay').remove()">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  /**
   * Handle form submissions (placeholder implementations)
   */
  onFeedbackSubmit(event: Event): void {
    event.preventDefault();
    // Implement feedback submission logic
  }

  onContactSubmit(event: Event): void {
    event.preventDefault();
    // Implement contact form submission logic
  }

  /**
   * Utility method to format phone numbers
   */
  formatPhoneNumber(phone: string): string {
    // Format phone number for display
    if (phone.length === 10) {
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phone;
  }

  /**
   * Check if feature is available
   */
  isFeatureAvailable(feature: string): boolean {
    // Check feature availability based on configuration
    const availableFeatures = ['email', 'phone', 'feedback'];
    return availableFeatures.includes(feature);
  }

  /**
   * Track user interactions for analytics
   */
  trackInteraction(action: string, category: string): void {
    // Implement analytics tracking
    
    // Example: Google Analytics event tracking
    // if (gtag) {
    //   gtag('event', action, {
    //     event_category: category,
    //     event_label: 'Support Page'
    //   });
    // }
  }
}