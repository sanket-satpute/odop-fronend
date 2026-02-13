import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer-component',
  templateUrl: './footer-component.component.html',
  styleUrls: ['./footer-component.component.css']
})
export class FooterComponentComponent {
  currentYear: number = new Date().getFullYear();

  constructor(private router: Router) {}

  scrollToSection(sectionId: string): void {
    // If we're on home page, scroll to section
    if (this.router.url === '/' || this.router.url.startsWith('/?')) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to home page with fragment
      this.router.navigate(['/'], { fragment: sectionId });
    }
  }

  navigateToCategory(category: string): void {
    this.router.navigate(['/products'], { queryParams: { category: category } });
  }
}
