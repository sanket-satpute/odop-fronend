import { Component, OnInit, Output, EventEmitter, Inject, Optional } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserStateService } from '../../../../project/services/user-state.service';
import { CustomerServiceService } from '../../../../project/services/customer-service.service';
import { ImageUploadService, ImageUploadResponse } from '../../../../project/services/image-upload.service';

interface State {
  code: string;
  name: string;
}

interface UserProfile {
  customerId: string;
  name: string;
  email: string;
  mobile: string;
  gender: string;
  dob: string;
  profilePicUrl: string;
  address1: string;
  address2: string;
  district: string;
  state: string;
  pincode: string;
}

@Component({
  selector: 'app-cust-update-profile-dial',
  templateUrl: './cust-update-profile-dial.component.html',
  styleUrls: ['./cust-update-profile-dial.component.css']
})
export class CustUpdateProfileDialComponent  implements OnInit {
  @Output() closeModalEvent = new EventEmitter<boolean>();
  @Output() profileUpdatedEvent = new EventEmitter<UserProfile>();

  isSubmitting = false;
  maxDate: string = '';
  selectedFile: File | null = null;
  isUploadingImage = false;

  user: UserProfile = {
    customerId: '',
    name: '',
    email: '',
    mobile: '',
    gender: '',
    dob: '',
    profilePicUrl: '',
    address1: '',
    address2: '',
    district: '',
    state: '',
    pincode: ''
  };

  states: State[] = [
    { code: 'AP', name: 'Andhra Pradesh' },
    { code: 'AR', name: 'Arunachal Pradesh' },
    { code: 'AS', name: 'Assam' },
    { code: 'BR', name: 'Bihar' },
    { code: 'CT', name: 'Chhattisgarh' },
    { code: 'GA', name: 'Goa' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'HR', name: 'Haryana' },
    { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'JH', name: 'Jharkhand' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'KL', name: 'Kerala' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'MH', name: 'Maharashtra' },
    { code: 'MN', name: 'Manipur' },
    { code: 'ML', name: 'Meghalaya' },
    { code: 'MZ', name: 'Mizoram' },
    { code: 'NL', name: 'Nagaland' },
    { code: 'OR', name: 'Odisha' },
    { code: 'PB', name: 'Punjab' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'SK', name: 'Sikkim' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'TG', name: 'Telangana' },
    { code: 'TR', name: 'Tripura' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'UT', name: 'Uttarakhand' },
    { code: 'WB', name: 'West Bengal' },
    { code: 'AN', name: 'Andaman and Nicobar Islands' },
    { code: 'CH', name: 'Chandigarh' },
    { code: 'DN', name: 'Dadra and Nagar Haveli' },
    { code: 'DD', name: 'Daman and Diu' },
    { code: 'DL', name: 'Delhi' },
    { code: 'JK', name: 'Jammu and Kashmir' },
    { code: 'LA', name: 'Ladakh' },
    { code: 'LD', name: 'Lakshadweep' },
    { code: 'PY', name: 'Puducherry' }
  ];

  // District mapping based on states (sample data)
  districtsByState: { [key: string]: string[] } = {
    'MH': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli', 'Dhule'],
    'KA': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davangere', 'Bellary', 'Bijapur', 'Shimoga'],
    'UP': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Moradabad', 'Aligarh', 'Gorakhpur'],
    'RJ': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bharatpur', 'Alwar', 'Sikar', 'Pali'],
    'GJ': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Bharuch'],
    'TN': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi'],
    'DL': ['Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'North West Delhi', 'North East Delhi', 'South West Delhi', 'South East Delhi', 'New Delhi'],
    'WB': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Bardhaman', 'Haldia', 'Kharagpur', 'Medinipur']
  };

  filteredDistricts: string[] = [];

  constructor(
    @Optional() private dialogRef: MatDialogRef<CustUpdateProfileDialComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private userState: UserStateService,
    private customerService: CustomerServiceService,
    private imageUploadService: ImageUploadService
  ) {}

  ngOnInit() {
    // Set max date to today for DOB
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
    
    // Load existing user data from UserStateService
    this.loadUserProfile();
    
    // Initialize districts based on current state
    this.onStateChange();
  }

  loadUserProfile() {
    const customer = this.userState.customer;
    if (customer) {
      this.user = {
        customerId: customer.customerId || '',
        name: customer.fullName || '',
        email: customer.emailAddress || '',
        mobile: customer.contactNumber?.toString() || '',
        gender: customer.gender || '',
        dob: customer.dateOfBirth || '',
        profilePicUrl: customer.profilePicturePath || '',
        address1: customer.address || '',
        address2: customer.shippingAddress || '',
        district: customer.city || '',
        state: customer.state || '',
        pincode: customer.pinCode || ''
      };
    }
  }

  onStateChange() {
    if (this.user.state) {
      this.filteredDistricts = this.districtsByState[this.user.state] || [];
      // Reset district if it's not in the new state's districts
      if (this.user.district && !this.filteredDistricts.includes(this.user.district)) {
        this.user.district = '';
      }
    } else {
      this.filteredDistricts = [];
      this.user.district = '';
    }
  }

  onMobileInput(event: any) {
    // Allow only numbers
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.user.mobile = value;
    event.target.value = value;
  }

  onPincodeInput(event: any) {
    // Allow only numbers
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.user.pincode = value;
    event.target.value = value;
  }

  uploadProfilePic(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, or GIF)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size should be less than 5MB');
        return;
      }

      this.selectedFile = file;
      
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = () => {
        this.user.profilePicUrl = reader.result as string;
      };
      reader.readAsDataURL(file);

      // Upload image using ImageUploadService
      if (this.user.customerId) {
        this.isUploadingImage = true;
        this.imageUploadService.uploadCustomerImage(file, this.user.customerId)
          .subscribe({
            next: (response: ImageUploadResponse) => {
              this.isUploadingImage = false;
              if (response.success && response.imageMetadata) {
                this.user.profilePicUrl = response.imageMetadata.secureUrl || response.imageMetadata.url;
                // Update user state
                if (this.userState.customer) {
                  this.userState.customer.profilePicturePath = this.user.profilePicUrl;
                }
              }
            },
            error: (err) => {
              this.isUploadingImage = false;
              console.error('Failed to upload image:', err);
              // Keep the local preview but notify user
              alert('Failed to upload image. You can try again later.');
            }
          });
      }
    }
  }

  submitForm(form: NgForm) {
    if (form.valid) {
      this.isSubmitting = true;

      // Prepare update data
      const updateData = {
        customerId: this.user.customerId,
        fullName: this.user.name,
        contactNumber: parseInt(this.user.mobile),
        gender: this.user.gender,
        dateOfBirth: this.user.dob,
        address: this.user.address1,
        shippingAddress: this.user.address2,
        city: this.user.district,
        state: this.user.state,
        pinCode: this.user.pincode
      };

      // Call service to update profile
      this.customerService.updateCustomerProfile(updateData).subscribe({
        next: (response: any) => {
          // Update local state
          if (this.userState.customer) {
            this.userState.customer = {
              ...this.userState.customer,
              ...updateData
            };
          }
          
          // Emit the updated profile data
          this.profileUpdatedEvent.emit(this.user);
          
          // Show success message
          this.showSuccessMessage();
          
          this.isSubmitting = false;
          
          // Close dialog after successful update
          setTimeout(() => {
            this.closeDialog();
          }, 1500);
        },
        error: (error) => {
          this.isSubmitting = false;
          alert('Failed to update profile. Please try again.');
        }
      });
      
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      
      // Scroll to first error
      const firstErrorElement = document.querySelector('.error');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  showSuccessMessage() {
    // Create and show success notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideInRight 0.3s ease-out;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Profile updated successfully!
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  closeDialog() {
    this.closeModalEvent.emit(true);
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  // Utility method to get state name by code
  getStateName(stateCode: string): string {
    const state = this.states.find(s => s.code === stateCode);
    return state ? state.name : stateCode;
  }

  // Method to validate form before submission
  private validateForm(form: NgForm): boolean {
    const errors: string[] = [];

    if (!this.user.name.trim()) {
      errors.push('Full name is required');
    }

    if (!this.user.mobile || this.user.mobile.length !== 10) {
      errors.push('Please enter a valid 10-digit mobile number');
    }

    if (!this.user.address1.trim()) {
      errors.push('Address Line 1 is required');
    }

    if (!this.user.state) {
      errors.push('Please select a state');
    }

    if (!this.user.district) {
      errors.push('Please select a district');
    }

    if (!this.user.pincode || this.user.pincode.length !== 6) {
      errors.push('Please enter a valid 6-digit pincode');
    }

    if (errors.length > 0) {
      return false;
    }

    return true;
  }

  // Method to reset form to original values
  resetForm() {
    this.loadUserProfile();
  }

  // Method to check if form has unsaved changes
  hasUnsavedChanges(): boolean {
    // In a real application, you would compare current form values 
    // with the original loaded values
    return true;
  }

  // Method to handle escape key press
  onEscapePress(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeDialog();
    }
  }
}