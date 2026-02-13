import { Component } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq-page',
  templateUrl: './faq-page.component.html',
  styleUrls: ['./faq-page.component.css']
})
export class FaqPageComponent {
  searchTerm: string = '';
  selectedCategory: string = 'all';

  categories = [
    { id: 'all', name: 'All Questions', icon: 'fa-list' },
    { id: 'shopping', name: 'Shopping', icon: 'fa-shopping-cart' },
    { id: 'orders', name: 'Orders & Delivery', icon: 'fa-truck' },
    { id: 'payment', name: 'Payment', icon: 'fa-credit-card' },
    { id: 'vendor', name: 'For Vendors', icon: 'fa-store' },
    { id: 'returns', name: 'Returns & Refunds', icon: 'fa-undo' },
    { id: 'account', name: 'Account', icon: 'fa-user' }
  ];

  faqs: FaqItem[] = [
    {
      question: 'What is ODOP (One District One Product)?',
      answer: 'ODOP is a flagship initiative by the Government of India to promote unique products from each district. Our platform connects artisans and producers directly with customers, ensuring authentic products while supporting local economies and preserving traditional craftsmanship.',
      category: 'shopping',
      isOpen: false
    },
    {
      question: 'How can I verify if a product is genuinely GI-tagged?',
      answer: 'All GI-tagged products on our platform display a verified GI certification badge. You can click on this badge to view the certificate details. We work directly with authorized vendors and verify all GI certifications before listing products.',
      category: 'shopping',
      isOpen: false
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept multiple payment methods including Credit/Debit Cards (Visa, MasterCard, Rupay), Net Banking, UPI (Google Pay, PhonePe, Paytm), and Cash on Delivery for eligible orders. All online payments are secured with 256-bit SSL encryption.',
      category: 'payment',
      isOpen: false
    },
    {
      question: 'How long does delivery take?',
      answer: 'Delivery times vary based on your location and the product. Standard delivery takes 5-7 business days for metro cities and 7-10 days for other areas. Handcrafted items may take longer as they are often made-to-order. You can track your order in real-time from your dashboard.',
      category: 'orders',
      isOpen: false
    },
    {
      question: 'Can I track my order?',
      answer: 'Yes! Once your order is shipped, you will receive a tracking number via email and SMS. You can also track your order from the "My Orders" section in your customer dashboard. Our tracking system provides real-time updates including pickup, transit, and delivery status.',
      category: 'orders',
      isOpen: false
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 7-day return policy for most products. If you receive a damaged or defective item, you can initiate a return from your dashboard. Please note that customized products and perishable items like food products are non-returnable. Full refund will be processed within 5-7 business days.',
      category: 'returns',
      isOpen: false
    },
    {
      question: 'How do I become a vendor on ODOP?',
      answer: 'To become a vendor: 1) Click on Register and select Vendor option, 2) Fill in your business details and product information, 3) Upload required documents including business registration, 4) Our team will verify your application within 3-5 business days, 5) Once approved, you can start listing your products.',
      category: 'vendor',
      isOpen: false
    },
    {
      question: 'What are the fees for selling on ODOP?',
      answer: 'We charge a small commission (5-15% depending on category) only when you make a sale. There are no listing fees or monthly charges. We also provide free training on product photography, description writing, and order management.',
      category: 'vendor',
      isOpen: false
    },
    {
      question: 'How do I reset my password?',
      answer: 'Click on "Login" and then "Forgot Password". Enter your registered email address and you will receive a password reset link. The link is valid for 24 hours. If you don\'t receive the email, check your spam folder or contact our support team.',
      category: 'account',
      isOpen: false
    },
    {
      question: 'Is my personal information secure?',
      answer: 'Yes, we take data security very seriously. All personal information is encrypted using industry-standard protocols. We never share your data with third parties without your consent. Our platform is regularly audited for security compliance.',
      category: 'account',
      isOpen: false
    },
    {
      question: 'How can I contact customer support?',
      answer: 'You can reach our support team through: Email (support@odop.gov.in), Phone (1800-XXX-XXXX - toll free), Live Chat (available 9 AM - 9 PM IST), or through our Contact Us page. We typically respond within 24 hours.',
      category: 'shopping',
      isOpen: false
    },
    {
      question: 'Do you deliver internationally?',
      answer: 'Currently, we only deliver within India. We are working on enabling international shipping to bring authentic Indian products to customers worldwide. Stay tuned for updates!',
      category: 'orders',
      isOpen: false
    }
  ];

  get filteredFaqs(): FaqItem[] {
    return this.faqs.filter(faq => {
      const matchesCategory = this.selectedCategory === 'all' || faq.category === this.selectedCategory;
      const matchesSearch = !this.searchTerm || 
        faq.question.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  toggleFaq(faq: FaqItem): void {
    faq.isOpen = !faq.isOpen;
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
  }
}
