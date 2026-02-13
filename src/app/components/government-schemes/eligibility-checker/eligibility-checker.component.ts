import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { 
  GovernmentSchemeService, 
  SchemeFinderRequest, 
  SchemeFinderResponse,
  SchemeListItem 
} from '../../../services/government-scheme.service';

interface EligibilityQuestion {
  id: string;
  question: string;
  type: 'radio' | 'checkbox' | 'number' | 'select' | 'text';
  options?: { value: string; label: string }[];
  placeholder?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
  };
  icon: string;
  helpText?: string;
}

interface EligibilityResult {
  isEligible: boolean;
  eligibilityScore: number;
  matchedCriteria: string[];
  unmatchedCriteria: string[];
  matchedSchemes: GovernmentScheme[];
  recommendations: string[];
}

interface GovernmentScheme {
  id: string;
  name: string;
  description: string;
  schemeType: string;
  benefitType: string;
  ministry: string;
  maxBenefit: number;
  deadline: Date;
  eligibilityScore?: number;
}

@Component({
  selector: 'app-eligibility-checker',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './eligibility-checker.component.html',
  styleUrls: ['./eligibility-checker.component.css']
})
export class EligibilityCheckerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentStep = 0;
  totalSteps = 5;
  eligibilityForm: FormGroup;
  isSubmitting = false;
  showResults = false;
  eligibilityResult: EligibilityResult | null = null;
  schemeId: string | null = null;
  schemeName: string | null = null;

  steps = [
    { id: 'personal', title: 'Personal Details', icon: 'fa-user' },
    { id: 'occupation', title: 'Occupation', icon: 'fa-briefcase' },
    { id: 'craft', title: 'Craft & Skills', icon: 'fa-palette' },
    { id: 'location', title: 'Location', icon: 'fa-map-marker-alt' },
    { id: 'financial', title: 'Financial Info', icon: 'fa-rupee-sign' }
  ];

  questions: { [key: string]: EligibilityQuestion[] } = {
    personal: [
      {
        id: 'age',
        question: 'What is your age?',
        type: 'number',
        icon: 'fa-calendar-alt',
        placeholder: 'Enter your age',
        validation: { required: true, min: 18, max: 100 },
        helpText: 'Most schemes require applicants to be between 18-60 years old'
      },
      {
        id: 'gender',
        question: 'What is your gender?',
        type: 'radio',
        icon: 'fa-venus-mars',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' }
        ],
        validation: { required: true }
      },
      {
        id: 'category',
        question: 'Which category do you belong to?',
        type: 'select',
        icon: 'fa-users',
        options: [
          { value: 'general', label: 'General' },
          { value: 'obc', label: 'OBC' },
          { value: 'sc', label: 'SC' },
          { value: 'st', label: 'ST' },
          { value: 'minority', label: 'Minority' }
        ],
        validation: { required: true },
        helpText: 'Some schemes have category-specific benefits'
      }
    ],
    occupation: [
      {
        id: 'occupationType',
        question: 'What is your primary occupation?',
        type: 'select',
        icon: 'fa-briefcase',
        options: [
          { value: 'artisan', label: 'Artisan / Craftsperson' },
          { value: 'weaver', label: 'Weaver' },
          { value: 'potter', label: 'Potter' },
          { value: 'woodworker', label: 'Wood Worker' },
          { value: 'metalworker', label: 'Metal Worker' },
          { value: 'painter', label: 'Traditional Painter' },
          { value: 'sculptor', label: 'Sculptor' },
          { value: 'embroiderer', label: 'Embroiderer' },
          { value: 'other', label: 'Other Traditional Craft' }
        ],
        validation: { required: true }
      },
      {
        id: 'experience',
        question: 'How many years of experience do you have?',
        type: 'number',
        icon: 'fa-history',
        placeholder: 'Years of experience',
        validation: { required: true, min: 0, max: 60 }
      },
      {
        id: 'isRegistered',
        question: 'Are you registered with any artisan organization?',
        type: 'radio',
        icon: 'fa-id-card',
        options: [
          { value: 'yes', label: 'Yes, I am registered' },
          { value: 'no', label: 'No, I am not registered' },
          { value: 'inprogress', label: 'Registration in progress' }
        ],
        validation: { required: true }
      }
    ],
    craft: [
      {
        id: 'craftType',
        question: 'What type of craft do you practice?',
        type: 'checkbox',
        icon: 'fa-palette',
        options: [
          { value: 'textile', label: 'Textile & Handloom' },
          { value: 'pottery', label: 'Pottery & Ceramics' },
          { value: 'metalwork', label: 'Metal Craft' },
          { value: 'woodwork', label: 'Wood Craft' },
          { value: 'bamboo', label: 'Bamboo & Cane' },
          { value: 'leather', label: 'Leather Craft' },
          { value: 'jewelry', label: 'Traditional Jewelry' },
          { value: 'painting', label: 'Folk Painting' }
        ]
      },
      {
        id: 'hasGITag',
        question: 'Does your craft have GI (Geographical Indication) tag?',
        type: 'radio',
        icon: 'fa-award',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'dontknow', label: "I don't know" }
        ],
        helpText: 'GI tagged products get priority in many government schemes'
      },
      {
        id: 'hasTraining',
        question: 'Have you received any formal training in your craft?',
        type: 'radio',
        icon: 'fa-graduation-cap',
        options: [
          { value: 'formal', label: 'Formal institutional training' },
          { value: 'hereditary', label: 'Hereditary / Family tradition' },
          { value: 'apprentice', label: 'Apprenticeship' },
          { value: 'self', label: 'Self-taught' }
        ]
      }
    ],
    location: [
      {
        id: 'state',
        question: 'Which state are you from?',
        type: 'select',
        icon: 'fa-map',
        options: [
          { value: 'UP', label: 'Uttar Pradesh' },
          { value: 'RAJ', label: 'Rajasthan' },
          { value: 'GUJ', label: 'Gujarat' },
          { value: 'WB', label: 'West Bengal' },
          { value: 'TN', label: 'Tamil Nadu' },
          { value: 'KA', label: 'Karnataka' },
          { value: 'AP', label: 'Andhra Pradesh' },
          { value: 'MH', label: 'Maharashtra' },
          { value: 'MP', label: 'Madhya Pradesh' },
          { value: 'OR', label: 'Odisha' },
          { value: 'BH', label: 'Bihar' },
          { value: 'JH', label: 'Jharkhand' },
          { value: 'other', label: 'Other State' }
        ],
        validation: { required: true }
      },
      {
        id: 'areaType',
        question: 'What type of area do you live in?',
        type: 'radio',
        icon: 'fa-home',
        options: [
          { value: 'rural', label: 'Rural Village' },
          { value: 'semiurban', label: 'Semi-Urban / Town' },
          { value: 'urban', label: 'Urban / City' }
        ],
        validation: { required: true }
      },
      {
        id: 'isODOPDistrict',
        question: 'Is your district recognized under ODOP (One District One Product)?',
        type: 'radio',
        icon: 'fa-certificate',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'dontknow', label: "I don't know" }
        ],
        helpText: 'ODOP districts get additional incentives'
      }
    ],
    financial: [
      {
        id: 'annualIncome',
        question: 'What is your approximate annual income from craft?',
        type: 'select',
        icon: 'fa-rupee-sign',
        options: [
          { value: 'below50k', label: 'Below ₹50,000' },
          { value: '50k-1lakh', label: '₹50,000 - ₹1 Lakh' },
          { value: '1lakh-2.5lakh', label: '₹1 Lakh - ₹2.5 Lakh' },
          { value: '2.5lakh-5lakh', label: '₹2.5 Lakh - ₹5 Lakh' },
          { value: 'above5lakh', label: 'Above ₹5 Lakh' }
        ],
        validation: { required: true }
      },
      {
        id: 'hasBankAccount',
        question: 'Do you have a bank account?',
        type: 'radio',
        icon: 'fa-university',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' }
        ],
        validation: { required: true },
        helpText: 'Bank account is mandatory for receiving scheme benefits'
      },
      {
        id: 'hasAadhaar',
        question: 'Do you have Aadhaar card linked with bank account?',
        type: 'radio',
        icon: 'fa-id-badge',
        options: [
          { value: 'yes', label: 'Yes, linked' },
          { value: 'no', label: 'No, not linked' },
          { value: 'noaadhaar', label: "I don't have Aadhaar" }
        ],
        validation: { required: true }
      },
      {
        id: 'existingLoan',
        question: 'Do you have any existing government loan?',
        type: 'radio',
        icon: 'fa-hand-holding-usd',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' }
        ]
      }
    ]
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private governmentSchemeService: GovernmentSchemeService
  ) {
    this.eligibilityForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['schemeId']) {
        this.schemeId = params['schemeId'];
        this.schemeName = params['schemeName'] || 'the scheme';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Personal
      age: ['', [Validators.required, Validators.min(18), Validators.max(100)]],
      gender: ['', Validators.required],
      category: ['', Validators.required],
      // Occupation
      occupationType: ['', Validators.required],
      experience: ['', [Validators.required, Validators.min(0)]],
      isRegistered: ['', Validators.required],
      // Craft
      craftType: [[]],
      hasGITag: [''],
      hasTraining: [''],
      // Location
      state: ['', Validators.required],
      areaType: ['', Validators.required],
      isODOPDistrict: [''],
      // Financial
      annualIncome: ['', Validators.required],
      hasBankAccount: ['', Validators.required],
      hasAadhaar: ['', Validators.required],
      existingLoan: ['']
    });
  }

  get currentStepQuestions(): EligibilityQuestion[] {
    const stepId = this.steps[this.currentStep].id;
    return this.questions[stepId] || [];
  }

  get progress(): number {
    return ((this.currentStep + 1) / this.totalSteps) * 100;
  }

  isStepValid(): boolean {
    const stepQuestions = this.currentStepQuestions;
    return stepQuestions.every(q => {
      if (q.validation?.required) {
        const value = this.eligibilityForm.get(q.id)?.value;
        return value !== '' && value !== null && value !== undefined;
      }
      return true;
    });
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps - 1 && this.isStepValid()) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep) {
      this.currentStep = step;
    }
  }

  toggleCheckbox(questionId: string, value: string): void {
    const currentValues = this.eligibilityForm.get(questionId)?.value || [];
    const index = currentValues.indexOf(value);
    if (index === -1) {
      currentValues.push(value);
    } else {
      currentValues.splice(index, 1);
    }
    this.eligibilityForm.get(questionId)?.setValue([...currentValues]);
  }

  isChecked(questionId: string, value: string): boolean {
    const values = this.eligibilityForm.get(questionId)?.value || [];
    return values.includes(value);
  }

  checkEligibility(): void {
    if (!this.eligibilityForm.valid) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.eligibilityForm.value;

    // Build the scheme finder request from form data
    const finderRequest = this.buildSchemeFinderRequest(formData);

    this.governmentSchemeService.findSchemes(finderRequest)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response: SchemeFinderResponse) => {
          this.eligibilityResult = this.calculateEligibility(formData, response);
          this.showResults = true;
        },
        error: (error) => {
          console.error('Error checking eligibility:', error);
          // Fallback to local calculation without API schemes
          this.eligibilityResult = this.calculateEligibility(formData, null);
          this.showResults = true;
        }
      });
  }

  private calculateEligibility(formData: any, apiResponse: SchemeFinderResponse | null): EligibilityResult {
    const matchedCriteria: string[] = [];
    const unmatchedCriteria: string[] = [];
    let score = 0;

    // Age check
    if (formData.age >= 18 && formData.age <= 60) {
      matchedCriteria.push('Age within eligible range (18-60 years)');
      score += 15;
    } else if (formData.age > 60) {
      unmatchedCriteria.push('Age above 60 years - limited schemes available');
    }

    // Occupation check
    if (['artisan', 'weaver', 'potter', 'woodworker', 'metalworker', 'painter', 'sculptor', 'embroiderer'].includes(formData.occupationType)) {
      matchedCriteria.push('Eligible occupation category');
      score += 20;
    }

    // Experience check
    if (formData.experience >= 3) {
      matchedCriteria.push(`${formData.experience} years of experience`);
      score += 10;
    } else {
      unmatchedCriteria.push('Some schemes require minimum 3 years experience');
    }

    // Registration check
    if (formData.isRegistered === 'yes') {
      matchedCriteria.push('Registered with artisan organization');
      score += 15;
    } else {
      unmatchedCriteria.push('Not registered with artisan organization');
    }

    // GI Tag
    if (formData.hasGITag === 'yes') {
      matchedCriteria.push('Craft has GI Tag certification');
      score += 10;
    }

    // Location check
    if (formData.areaType === 'rural') {
      matchedCriteria.push('Rural area - priority in most schemes');
      score += 10;
    }

    if (formData.isODOPDistrict === 'yes') {
      matchedCriteria.push('From ODOP recognized district');
      score += 10;
    }

    // Financial checks
    if (formData.hasBankAccount === 'yes') {
      matchedCriteria.push('Has bank account');
      score += 5;
    } else {
      unmatchedCriteria.push('Bank account required for benefit transfer');
    }

    if (formData.hasAadhaar === 'yes') {
      matchedCriteria.push('Aadhaar linked with bank account');
      score += 5;
    } else {
      unmatchedCriteria.push('Aadhaar-bank linking required');
    }

    // Convert API response schemes to local GovernmentScheme interface
    const matchedSchemes: GovernmentScheme[] = this.mapApiSchemesToLocal(apiResponse, score);

    const recommendations: string[] = [];
    if (formData.isRegistered !== 'yes') {
      recommendations.push('Register with your local artisan cooperative to unlock more scheme benefits');
    }
    if (formData.hasBankAccount !== 'yes') {
      recommendations.push('Open a bank account to receive direct benefit transfers');
    }
    if (formData.hasAadhaar !== 'yes') {
      recommendations.push('Link your Aadhaar with bank account for DBT eligibility');
    }
    if (formData.hasGITag !== 'yes') {
      recommendations.push('Check if your craft qualifies for GI Tag certification for additional benefits');
    }

    return {
      isEligible: score >= 50,
      eligibilityScore: score,
      matchedCriteria,
      unmatchedCriteria,
      matchedSchemes: score >= 50 ? matchedSchemes : [],
      recommendations
    };
  }

  /**
   * Build the scheme finder request from form data
   */
  private buildSchemeFinderRequest(formData: any): SchemeFinderRequest {
    // Map occupation type to beneficiary types
    const beneficiaryMap: { [key: string]: string } = {
      artisan: 'ARTISANS',
      weaver: 'WEAVERS',
      potter: 'CRAFTSMEN',
      woodworker: 'CRAFTSMEN',
      metalworker: 'CRAFTSMEN',
      painter: 'CRAFTSMEN',
      sculptor: 'CRAFTSMEN',
      embroiderer: 'WEAVERS'
    };

    // Map annual income to funding requirement
    const fundingMap: { [key: string]: 'LOW' | 'MEDIUM' | 'HIGH' } = {
      'below50k': 'LOW',
      '50k-1lakh': 'LOW',
      '1lakh-2.5lakh': 'MEDIUM',
      '2.5lakh-5lakh': 'MEDIUM',
      'above5lakh': 'HIGH'
    };

    const request: SchemeFinderRequest = {
      beneficiaryTypes: formData.occupationType ? [beneficiaryMap[formData.occupationType] || 'ARTISANS'] : ['ARTISANS'],
      state: formData.state || undefined,
      collateralFree: formData.existingLoan !== 'yes',
      fundingRequirement: fundingMap[formData.annualIncome] || 'MEDIUM'
    };

    // Add craft type if selected
    if (formData.craftType && formData.craftType.length > 0) {
      request.craft = formData.craftType[0];
    }

    return request;
  }

  /**
   * Map API scheme response to local GovernmentScheme interface
   */
  private mapApiSchemesToLocal(apiResponse: SchemeFinderResponse | null, score: number): GovernmentScheme[] {
    if (!apiResponse) {
      return [];
    }

    const allSchemes = [...apiResponse.recommendedSchemes, ...apiResponse.otherSchemes];
    
    return allSchemes.slice(0, 5).map((scheme: SchemeListItem, index: number) => ({
      id: scheme.id,
      name: scheme.name,
      description: scheme.description,
      schemeType: scheme.typeDisplayName || scheme.type,
      benefitType: scheme.category || 'Financial',
      ministry: scheme.ministry,
      maxBenefit: this.parseMaxBenefit(scheme.maxFundingAmount),
      deadline: new Date(Date.now() + (180 + index * 30) * 24 * 60 * 60 * 1000), // Approximate deadline
      eligibilityScore: Math.max(70, score - (index * 5)) // Decreasing score for less relevant schemes
    }));
  }

  /**
   * Parse max benefit amount string to number
   */
  private parseMaxBenefit(amountStr: string): number {
    if (!amountStr) return 0;
    // Remove currency symbols and commas, extract number
    const numStr = amountStr.replace(/[₹,\s]/g, '').replace(/lakh|lakhs/gi, '00000').replace(/crore|crores/gi, '0000000');
    const parsed = parseInt(numStr, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  resetChecker(): void {
    this.eligibilityForm.reset();
    this.currentStep = 0;
    this.showResults = false;
    this.eligibilityResult = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateToScheme(schemeId: string): void {
    this.router.navigate(['/government-schemes', schemeId]);
  }

  formatAmount(amount: number): string {
    if (amount >= 100000) {
      return '₹' + (amount / 100000).toFixed(1) + ' Lakh';
    }
    return '₹' + amount.toLocaleString('en-IN');
  }

  goBack(): void {
    if (this.schemeId) {
      this.router.navigate(['/government-schemes', this.schemeId]);
    } else {
      this.router.navigate(['/government-schemes']);
    }
  }
}
