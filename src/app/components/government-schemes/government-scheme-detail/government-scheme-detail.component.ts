import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { 
  GovernmentSchemeService, 
  SchemeResponse,
  BenefitDto,
  ApplicationStepDto,
  FaqDto,
  SuccessStoryDto
} from '../../../services/government-scheme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-government-scheme-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './government-scheme-detail.component.html',
  styleUrls: ['./government-scheme-detail.component.css']
})
export class GovernmentSchemeDetailComponent implements OnInit, OnDestroy {
  scheme: SchemeResponse | null = null;
  isLoading = true;
  error: string | null = null;
  
  // Active tab
  activeTab: 'overview' | 'eligibility' | 'benefits' | 'how-to-apply' | 'documents' | 'faqs' = 'overview';
  
  // FAQs
  expandedFaqIndex: number = -1;
  
  // Success stories
  activeStoryIndex = 0;
  
  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private schemeService: GovernmentSchemeService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadScheme(slug);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  loadScheme(slug: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.schemeService.getSchemeBySlug(slug).subscribe({
      next: (scheme) => {
        this.scheme = scheme;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading scheme:', err);
        this.error = 'Failed to load scheme details';
        this.isLoading = false;
      }
    });
  }

  switchTab(tab: 'overview' | 'eligibility' | 'benefits' | 'how-to-apply' | 'documents' | 'faqs'): void {
    this.activeTab = tab;
  }

  toggleFaq(index: number): void {
    this.expandedFaqIndex = this.expandedFaqIndex === index ? -1 : index;
  }

  nextStory(): void {
    if (this.scheme && this.scheme.successStories) {
      this.activeStoryIndex = (this.activeStoryIndex + 1) % this.scheme.successStories.length;
    }
  }

  prevStory(): void {
    if (this.scheme && this.scheme.successStories) {
      this.activeStoryIndex = this.activeStoryIndex === 0 
        ? this.scheme.successStories.length - 1 
        : this.activeStoryIndex - 1;
    }
  }

  goToStory(index: number): void {
    this.activeStoryIndex = index;
  }

  applyNow(): void {
    if (this.scheme?.applicationUrl) {
      window.open(this.scheme.applicationUrl, '_blank');
    }
  }

  checkEligibility(): void {
    this.router.navigate(['/government-schemes', 'eligibility-checker'], {
      queryParams: { schemeId: this.scheme?.id }
    });
  }

  shareScheme(): void {
    if (navigator.share) {
      navigator.share({
        title: this.scheme?.name,
        text: this.scheme?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  downloadBrochure(): void {
    if (this.scheme?.pdfBrochureUrl) {
      window.open(this.scheme.pdfBrochureUrl, '_blank');
    }
  }

  viewRelatedScheme(schemeSlug: string): void {
    this.router.navigate(['/government-schemes', schemeSlug]);
  }

  formatAmount(amount: string): string {
    return amount || 'N/A';
  }

  getDaysRemaining(): number | null {
    if (!this.scheme?.lastDateToApply) return null;
    return this.scheme.daysUntilDeadline;
  }

  goBack(): void {
    this.router.navigate(['/government-schemes']);
  }

  trackByBenefit(index: number, benefit: BenefitDto): string {
    return benefit.title;
  }

  trackByStep(index: number, step: ApplicationStepDto): number {
    return step.stepNumber;
  }

  trackByDocument(index: number, doc: string): string {
    return doc;
  }

  trackByFaq(index: number, faq: FaqDto): string {
    return faq.question;
  }
}
