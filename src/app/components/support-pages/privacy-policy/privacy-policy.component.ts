import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent  implements OnInit, OnDestroy {
  
  private observer: IntersectionObserver | null = null;
  
  constructor(
    private router: Router,
    private meta: Meta,
    private titleService: Title,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setMetaTags();
    this.initializeScrollSpy();
    this.scrollToTop();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Set meta tags for SEO and social sharing
   */
  private setMetaTags(): void {
    this.titleService.setTitle('Privacy Policy - Government E-commerce Portal');
    
    this.meta.updateTag({
      name: 'description',
      content: 'Learn how we protect your privacy and data on our government-backed e-commerce platform for G-tagged products and local vendors.'
    });
    
    this.meta.updateTag({
      name: 'keywords',
      content: 'privacy policy, data protection, government e-commerce, G-tagged products, local vendors, DPDP compliance'
    });
    
    this.meta.updateTag({
      property: 'og:title',
      content: 'Privacy Policy - Government E-commerce Portal'
    });
    
    this.meta.updateTag({
      property: 'og:description',
      content: 'Comprehensive privacy policy for our government-supported platform empowering local vendors globally.'
    });
    
    this.meta.updateTag({
      property: 'og:type',
      content: 'website'
    });
    
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });
    
    this.meta.updateTag({
      name: 'twitter:title',
      content: 'Privacy Policy - Government E-commerce Portal'
    });
    
    this.meta.updateTag({
      name: 'twitter:description',
      content: 'Learn how we protect your privacy and data on our government-backed e-commerce platform.'
    });
  }

  /**
   * Initialize intersection observer for scroll spy functionality
   */
  private initializeScrollSpy(): void {
    const options = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const tocLink = document.querySelector(`a[href="#${entry.target.id}"]`);
        if (tocLink) {
          if (entry.isIntersecting) {
            tocLink.classList.add('active');
          } else {
            tocLink.classList.remove('active');
          }
        }
      });
    }, options);

    // Observe all sections with IDs
    setTimeout(() => {
      const sections = document.querySelectorAll('section[id]');
      sections.forEach(section => {
        if (this.observer) {
          this.observer.observe(section);
        }
      });
    }, 100);
  }

  /**
   * Smooth scroll to a specific section
   * @param sectionId - The ID of the section to scroll to
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Account for fixed header if any
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Update active state
      this.updateActiveLink(sectionId);
    }
  }

  /**
   * Update active state of table of contents links
   * @param activeSection - The currently active section ID
   */
  private updateActiveLink(activeSection: string): void {
    // Remove active class from all links
    const tocLinks = document.querySelectorAll('.toc-item');
    tocLinks.forEach(link => link.classList.remove('active'));

    // Add active class to current link
    const currentLink = document.querySelector(`a[href="#${activeSection}"]`);
    if (currentLink) {
      currentLink.classList.add('active');
    }
  }

  /**
   * Scroll to top of the page
   */
  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Navigate to contact page
   */
  navigateToContact(): void {
    this.router.navigate(['/contact']);
  }

  /**
   * Navigate to terms of service
   */
  navigateToTerms(): void {
    this.router.navigate(['/terms']);
  }

  /**
   * Handle email click - opens email client
   * @param email - Email address to send to
   */
  openEmail(email: string): void {
    window.location.href = `mailto:${email}`;
  }

  /**
   * Handle phone click - opens phone dialer on mobile
   * @param phone - Phone number to call
   */
  openPhone(phone: string): void {
    window.location.href = `tel:${phone}`;
  }

  /**
   * Download privacy policy as PDF
   */
  downloadPDF(): void {
    // Implementation for PDF download
    // This would typically call a service to generate and download PDF
    
    // For now, show a message
    this.snackBar.open('PDF download functionality coming soon!', 'Close', { duration: 3000 });
  }

  /**
   * Print the privacy policy
   */
  printPolicy(): void {
    window.print();
  }

  /**
   * Share privacy policy URL
   */
  sharePolicy(): void {
    if (navigator.share) {
      navigator.share({
        title: 'Privacy Policy - Government E-commerce Portal',
        text: 'Check out our comprehensive privacy policy',
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.snackBar.open('Privacy policy URL copied to clipboard!', 'Close', { duration: 2000 });
      }).catch(() => {
        this.snackBar.open('Unable to copy URL. Please copy manually from address bar.', 'Close', { duration: 3000 });
      });
    }
  }

  /**
   * Handle accessibility - keyboard navigation for TOC
   * @param event - Keyboard event
   * @param sectionId - Target section ID
   */
  onKeyPress(event: KeyboardEvent, sectionId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.scrollToSection(sectionId);
    }
  }

  /**
   * Check if user prefers reduced motion
   */
  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get current date for last updated display
   */
  getCurrentDate(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return now.toLocaleDateString('en-IN', options);
  }

  /**
   * Track user interactions for analytics
   * @param action - The action performed
   * @param section - The section involved
   */
  trackInteraction(action: string, section: string): void {
    // Implementation for analytics tracking
    // This would typically call Google Analytics or similar service
    
    // Example: gtag('event', action, { section: section });
  }

  /**
   * Handle external link clicks
   * @param url - External URL to open
   */
  openExternalLink(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
    this.trackInteraction('external_link_click', url);
  }

  /**
   * Toggle section expansion (if implementing collapsible sections)
   * @param sectionId - Section to toggle
   */
  toggleSection(sectionId: string): void {
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.toggle('expanded');
      this.trackInteraction('section_toggle', sectionId);
    }
  }

  /**
   * Initialize lazy loading for images (if any)
   */
  private initializeLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset['src']) {
              img.src = img.dataset['src'];
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      const lazyImages = document.querySelectorAll('img.lazy');
      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }

  /**
   * Handle dark mode toggle (if implementing)
   */
  toggleDarkMode(): void {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode.toString());
    this.trackInteraction('dark_mode_toggle', isDarkMode ? 'enabled' : 'disabled');
  }

  /**
   * Initialize language selector (if implementing multi-language support)
   */
  changeLanguage(langCode: string): void {
    // Implementation for language change
    localStorage.setItem('preferredLanguage', langCode);
    this.trackInteraction('language_change', langCode);
    
    // This would typically call a translation service
    // and reload the component with new language content
  }

  /**
   * Handle cookie consent (if implementing cookie banner)
   */
  acceptCookies(): void {
    localStorage.setItem('cookieConsent', 'accepted');
    const cookieBanner = document.getElementById('cookie-banner');
    if (cookieBanner) {
      cookieBanner.style.display = 'none';
    }
    this.trackInteraction('cookie_consent', 'accepted');
  }

  /**
   * Handle feedback submission
   * @param feedback - User feedback object
   */
  submitFeedback(feedback: any): void {
    // Implementation for feedback submission
    this.trackInteraction('feedback_submit', 'privacy_policy');
    
    // This would typically call a feedback service
    this.snackBar.open('Thank you for your feedback! We appreciate your input.', 'Close', { duration: 3000 });
  }
}