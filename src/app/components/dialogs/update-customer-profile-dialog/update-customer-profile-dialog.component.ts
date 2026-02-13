import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { ImageUploadService } from 'src/app/project/services/image-upload.service';

interface ProfileData {
  profilePicture?: string;
  fullName: string;
  email: string;
  contactNumber: string;
  dateOfBirth: string;
  gender: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  district: string;
  pincode: string;
}

interface State {
  code: string;
  name: string;
}

interface District {
  code: string;
  name: string;
}

@Component({
  selector: 'app-update-customer-profile-dialog',
  templateUrl: './update-customer-profile-dialog.component.html',
  styleUrls: ['./update-customer-profile-dialog.component.css'],
  // animations: [
  //   trigger('slideInScale', [
  //     transition(':enter', [
  //       style({ transform: 'scale(0.9) translateY(32px)', opacity: 0 }),
  //       animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', 
  //         style({ transform: 'scale(1) translateY(0)', opacity: 1 }))
  //     ]),
  //     transition(':leave', [
  //       animate('200ms ease-out', 
  //         style({ transform: 'scale(0.9) translateY(32px)', opacity: 0 }))
  //     ])
  //   ])
  // ]
})
export class UpdateCustomerProfileDialogComponent  implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Dialog states
  isLoading = false;

  // Image upload states
  isUploadingImage = false;
  uploadProgress = 0;

  // Focus tracking for premium input styling
  fullNameFocused = false;
  phoneFocused = false;
  dobFocused = false;
  genderFocused = false;
  address1Focused = false;
  address2Focused = false;
  stateFocused = false;
  districtFocused = false;
  pincodeFocused = false;

  // Forms
  profileForm!: FormGroup;

  // Profile data
  profileData: ProfileData = {
    profilePicture: '',
    fullName: '',
    email: '',
    contactNumber: '',
    dateOfBirth: '',
    gender: '',
    addressLine1: '',
    addressLine2: '',
    state: '',
    district: '',
    pincode: ''
  };

  // States and Districts data
  states: State[] = [
    { code: 'MH', name: 'Maharashtra' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'AP', name: 'Andhra Pradesh' },
    { code: 'TS', name: 'Telangana' },
    { code: 'KL', name: 'Kerala' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'WB', name: 'West Bengal' },
    { code: 'BR', name: 'Bihar' },
    { code: 'PB', name: 'Punjab' },
    { code: 'HR', name: 'Haryana' },
    { code: 'DL', name: 'Delhi' },
    { code: 'JK', name: 'Jammu & Kashmir' },
    { code: 'GA', name: 'Goa' },
    { code: 'OR', name: 'Odisha' },
    { code: 'CG', name: 'Chhattisgarh' },
    { code: 'JH', name: 'Jharkhand' },
    { code: 'UK', name: 'Uttarakhand' },
    { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'AS', name: 'Assam' }
  ];

  districts: District[] = [];

  // District data by state
  districtsByState: { [key: string]: District[] } = {
    'MH': [
      { code: 'MUM', name: 'Mumbai' },
      { code: 'PUN', name: 'Pune' },
      { code: 'NAG', name: 'Nagpur' },
      { code: 'THA', name: 'Thane' },
      { code: 'NAS', name: 'Nashik' },
      { code: 'AUR', name: 'Aurangabad' },
      { code: 'SOL', name: 'Solapur' },
      { code: 'KOL', name: 'Kolhapur' },
      { code: 'SAT', name: 'Satara' },
      { code: 'SAN', name: 'Sangli' },
      { code: 'AMR', name: 'Amravati' },
      { code: 'CHA', name: 'Chandrapur' },
      { code: 'RAT', name: 'Ratnagiri' },
      { code: 'JLG', name: 'Jalgaon' },
      { code: 'AHM', name: 'Ahmednagar' }
    ],
    'GJ': [
      { code: 'AHM', name: 'Ahmedabad' },
      { code: 'SUR', name: 'Surat' },
      { code: 'VAD', name: 'Vadodara' },
      { code: 'RAJ', name: 'Rajkot' },
      { code: 'GAN', name: 'Gandhinagar' }
    ],
    'KA': [
      { code: 'BLR', name: 'Bengaluru' },
      { code: 'MYS', name: 'Mysuru' },
      { code: 'HUB', name: 'Hubli-Dharwad' },
      { code: 'MNG', name: 'Mangaluru' },
      { code: 'BEL', name: 'Belagavi' }
    ],
    'TN': [
      { code: 'CHN', name: 'Chennai' },
      { code: 'COI', name: 'Coimbatore' },
      { code: 'MAD', name: 'Madurai' },
      { code: 'TIR', name: 'Tiruchirappalli' },
      { code: 'SAL', name: 'Salem' }
    ],
    'DL': [
      { code: 'NDL', name: 'New Delhi' },
      { code: 'CDL', name: 'Central Delhi' },
      { code: 'SDL', name: 'South Delhi' },
      { code: 'EDL', name: 'East Delhi' },
      { code: 'WDL', name: 'West Delhi' }
    ]
  };

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UpdateCustomerProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private userState: UserStateService,
    private customerService: CustomerServiceService,
    private imageUploadService: ImageUploadService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      contactNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      dateOfBirth: [''],
      gender: [''],
      addressLine1: ['', [Validators.required, Validators.minLength(5)]],
      addressLine2: [''],
      state: ['', Validators.required],
      district: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  private loadProfileData(): void {
    // Load customer data from UserStateService
    const customer = this.userState.customer;
    if (customer) {
      this.profileData = {
        profilePicture: customer.profilePicturePath || '',
        fullName: customer.fullName || '',
        email: customer.emailAddress || '',
        contactNumber: customer.contactNumber?.toString() || '',
        dateOfBirth: customer.dateOfBirth || '',
        gender: customer.gender || '',
        addressLine1: customer.addressLine1 || customer.address || '',
        addressLine2: customer.addressLine2 || '',
        state: customer.state || '',
        district: customer.district || '',
        pincode: customer.pinCode?.toString() || ''
      };

      // Load districts for selected state
      if (this.profileData.state) {
        this.onStateChange();
      }
    }
    
    // Load existing profile data into form
    this.profileForm.patchValue({
      fullName: this.profileData.fullName,
      contactNumber: this.profileData.contactNumber,
      dateOfBirth: this.profileData.dateOfBirth,
      gender: this.profileData.gender,
      addressLine1: this.profileData.addressLine1,
      addressLine2: this.profileData.addressLine2,
      state: this.profileData.state,
      district: this.profileData.district,
      pincode: this.profileData.pincode
    });
  }

  // State change handler
  onStateChange(): void {
    const selectedState = this.profileForm.get('state')?.value || this.profileData.state;
    this.districts = this.districtsByState[selectedState] || [];
    if (!this.districts.find(d => d.code === this.profileForm.get('district')?.value)) {
      this.profileForm.patchValue({ district: '' });
    }
  }

  // Dialog controls
  closeDialog(): void {
    this.dialogRef.close();
    this.resetForms();
  }

  // Profile picture handling
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showNotification('Please select a valid image file.', 'error');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.showNotification('File size should be less than 5MB.', 'error');
        return;
      }

      // Upload image to server
      const customer = this.userState.customer;
      if (customer?.customerId) {
        this.isUploadingImage = true;
        this.uploadProgress = 0;
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          if (this.uploadProgress < 90) {
            this.uploadProgress += 10;
          }
        }, 100);
        
        this.imageUploadService.uploadCustomerImage(file, customer.customerId).subscribe({
          next: (response: any) => {
            clearInterval(progressInterval);
            this.uploadProgress = 100;
            
            // Update profile picture with returned URL
            if (response && response.imageUrl) {
              this.profileData.profilePicture = response.imageUrl;
            } else {
              // Fallback to local preview
              const reader = new FileReader();
              reader.onload = (e) => {
                this.profileData.profilePicture = e.target?.result as string;
              };
              reader.readAsDataURL(file);
            }
            
            this.isUploadingImage = false;
            this.showNotification('Profile picture updated successfully!', 'success');
          },
          error: (error) => {
            clearInterval(progressInterval);
            this.isUploadingImage = false;
            this.uploadProgress = 0;
            this.showNotification('Failed to upload image. Please try again.', 'error');
            console.error('Image upload error:', error);
          }
        });
      } else {
        // Just preview locally if no customer ID
        const reader = new FileReader();
        reader.onload = (e) => {
          this.profileData.profilePicture = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  // Handle image load errors
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png';
  }

  // Form submission
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      this.showNotification('Please fill in all required fields correctly.', 'error');
      return;
    }

    this.isLoading = true;
    
    const formData = this.profileForm.value;
    const customer = this.userState.customer;
    
    // Build full address from address fields
    const fullAddress = [
      formData.addressLine1,
      formData.addressLine2,
      this.districts.find(d => d.code === formData.district)?.name || formData.district,
      this.states.find(s => s.code === formData.state)?.name || formData.state,
      formData.pincode
    ].filter(Boolean).join(', ');
    
    // Prepare update data for API
    const updateData = {
      customerId: customer?.customerId || '',
      fullName: formData.fullName,
      contactNumber: parseInt(formData.contactNumber.replace(/\D/g, '')),
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      address: fullAddress,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      state: formData.state,
      district: formData.district,
      pinCode: formData.pincode
    };
    
    // Call real API
    this.customerService.updateCustomerProfile(updateData).subscribe({
      next: (response: any) => {
        // Update local state
        if (this.userState.customer) {
          this.userState.customer = {
            ...this.userState.customer,
            ...updateData
          };
        }
        
        // Update profile data
        this.profileData = {
          ...this.profileData,
          ...formData
        };

        this.isLoading = false;
        this.showNotification('Profile updated successfully!', 'success');
        
        // Close dialog after short delay
        setTimeout(() => {
          this.closeDialog();
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        this.showNotification('Failed to update profile. Please try again.', 'error');
      }
    });
  }

  // Utility methods
  private resetForms(): void {
    this.profileForm.reset();
    this.loadProfileData();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control && typeof control.value === 'object' && control.value !== null) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  private simulateApiCall(callback: () => void, delay: number): void {
    setTimeout(callback, delay);
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    const panelClass = type === 'success' ? 'snackbar-success' : 
                       type === 'error' ? 'snackbar-error' : 'snackbar-info';
    
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
  }

  // Getters for form validation
  get fullName() { return this.profileForm.get('fullName'); }
  get contactNumber() { return this.profileForm.get('contactNumber'); }
  get dateOfBirth() { return this.profileForm.get('dateOfBirth'); }
  get gender() { return this.profileForm.get('gender'); }
  get addressLine1() { return this.profileForm.get('addressLine1'); }
  get addressLine2() { return this.profileForm.get('addressLine2'); }
  get state() { return this.profileForm.get('state'); }
  get district() { return this.profileForm.get('district'); }
  get pincode() { return this.profileForm.get('pincode'); }

  // Validation helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required.`;
      if (field.errors['email']) return 'Please enter a valid email address.';
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} is too short.`;
      if (field.errors['pattern']) return `${this.getFieldLabel(fieldName)} format is invalid.`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      fullName: 'Full Name',
      contactNumber: 'Mobile Number',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      addressLine1: 'Address Line 1',
      addressLine2: 'Address Line 2',
      state: 'State',
      district: 'District',
      pincode: 'Pincode'
    };
    return labels[fieldName] || fieldName;
  }

  // Keyboard navigation support
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDialog();
    }
  }

  // Click outside to close (optional)
  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }
}
