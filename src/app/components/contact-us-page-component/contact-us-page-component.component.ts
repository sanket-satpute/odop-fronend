import { Component, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactMessage } from 'src/app/project/models/ContactMessage';
import { ContactUsServiceService } from 'src/app/project/services/contact-us-service.service';

@Component({
  selector: 'app-contact-us-page-component',
  templateUrl: './contact-us-page-component.component.html',
  styleUrls: ['./contact-us-page-component.component.css']
})
export class ContactUsPageComponentComponent {

  contactForm!: FormGroup;
  isSubmitting = false;
  formStatusMessage = '';

  constructor(
    private fb: FormBuilder,
    private contactService: ContactUsServiceService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      emailAddress: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(2)]],
      message: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngAfterViewInit(): void {
    this.initializeIntersectionAnimations();
    this.addHoverAnimations();
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.formStatusMessage = '❌ Please fill all fields correctly.';
      return;
    }

    this.isSubmitting = true;
    this.formStatusMessage = '';

    const message: ContactMessage = this.contactForm.value;

    this.contactService.sendMessage(message).subscribe({
      next: (response) => {
        this.formStatusMessage = '✅ Message sent successfully!';
        this.contactForm.reset();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error(err);
        this.formStatusMessage = '❌ Something went wrong. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  private initializeIntersectionAnimations(): void {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderer.setStyle(entry.target, 'animationPlayState', 'running');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.contact-info, .contact-form, .map-section');
    animatedElements.forEach(el => {
      this.renderer.setStyle(el, 'animationPlayState', 'paused');
      observer.observe(el);
    });
  }

  private addHoverAnimations(): void {
    const infoItems = document.querySelectorAll('.info-item');
    infoItems.forEach(item => {
      this.renderer.listen(item, 'mouseenter', () => {
        this.renderer.setStyle(item, 'transform', 'translateX(8px)');
      });
      this.renderer.listen(item, 'mouseleave', () => {
        this.renderer.setStyle(item, 'transform', 'translateX(0)');
      });
    });
  }
}

