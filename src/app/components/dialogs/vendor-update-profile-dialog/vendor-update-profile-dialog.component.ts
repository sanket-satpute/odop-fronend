import { Component, OnInit, Inject, Optional } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserStateService } from '../../../project/services/user-state.service';
import { VendorServiceService } from '../../../project/services/vendor-service.service';
import { ImageUploadService, ImageUploadResponse } from '../../../project/services/image-upload.service';

interface State {
  code: string;
  name: string;
}

interface VendorProfile {
  vendorId: string;
  shoppeeName: string;
  shopkeeperName: string;
  email: string;
  mobile: string;
  businessName: string;
  businessRegistryNumber: string;
  profilePicUrl: string;
  shoppeeAddress: string;
  locationDistrict: string;
  locationState: string;
  returnPolicy: string;
}

@Component({
  selector: 'app-vendor-update-profile-dialog',
  templateUrl: './vendor-update-profile-dialog.component.html',
  styleUrls: ['./vendor-update-profile-dialog.component.css']
})
export class VendorUpdateProfileDialogComponent implements OnInit {
  isSubmitting = false;
  selectedFile: File | null = null;
  isUploadingImage = false;

  vendor: VendorProfile = {
    vendorId: '',
    shoppeeName: '',
    shopkeeperName: '',
    email: '',
    mobile: '',
    businessName: '',
    businessRegistryNumber: '',
    profilePicUrl: '',
    shoppeeAddress: '',
    locationDistrict: '',
    locationState: '',
    returnPolicy: ''
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
    { code: 'DL', name: 'Delhi' }
  ];

  districtsByState: { [key: string]: string[] } = {
    'MH': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'],
    'KA': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
    'UP': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut'],
    'RJ': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner'],
    'GJ': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    'TN': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruppur'],
    'DL': ['Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi']
  };

  filteredDistricts: string[] = [];

  constructor(
    @Optional() private dialogRef: MatDialogRef<VendorUpdateProfileDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private userState: UserStateService,
    private vendorService: VendorServiceService,
    private snackBar: MatSnackBar,
    private imageUploadService: ImageUploadService
  ) {}

  ngOnInit() {
    this.loadVendorProfile();
    this.onStateChange();
  }

  loadVendorProfile() {
    const vendorData = this.userState.vendor;
    if (vendorData) {
      this.vendor = {
        vendorId: vendorData.vendorId || '',
        shoppeeName: vendorData.shoppeeName || '',
        shopkeeperName: vendorData.shopkeeperName || '',
        email: vendorData.emailAddress || '',
        mobile: vendorData.contactNumber?.toString() || '',
        businessName: vendorData.businessName || '',
        businessRegistryNumber: vendorData.businessRegistryNumber || '',
        profilePicUrl: vendorData.profilePictureUrl || '',
        shoppeeAddress: vendorData.shoppeeAddress || '',
        locationDistrict: vendorData.locationDistrict || '',
        locationState: vendorData.locationState || '',
        returnPolicy: vendorData.returnPolicy || ''
      };
    }
  }

  onStateChange() {
    if (this.vendor.locationState) {
      this.filteredDistricts = this.districtsByState[this.vendor.locationState] || [];
      if (this.vendor.locationDistrict && !this.filteredDistricts.includes(this.vendor.locationDistrict)) {
        this.vendor.locationDistrict = '';
      }
    } else {
      this.filteredDistricts = [];
      this.vendor.locationDistrict = '';
    }
  }

  onMobileInput(event: any) {
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.vendor.mobile = value;
    event.target.value = value;
  }

  uploadProfilePic(event: any) {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.snackBar.open('Please select a valid image file (JPEG, PNG, or GIF)', 'Close', { duration: 3000 });
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.snackBar.open('File size should be less than 5MB', 'Close', { duration: 3000 });
        return;
      }

      this.selectedFile = file;
      
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = () => {
        this.vendor.profilePicUrl = reader.result as string;
      };
      reader.readAsDataURL(file);

      // Upload image using ImageUploadService
      if (this.vendor.vendorId) {
        this.isUploadingImage = true;
        this.imageUploadService.uploadVendorImage(file, this.vendor.vendorId)
          .subscribe({
            next: (response: ImageUploadResponse) => {
              this.isUploadingImage = false;
              if (response.success && response.imageMetadata) {
                this.vendor.profilePicUrl = response.imageMetadata.secureUrl || response.imageMetadata.url;
                // Update user state
                if (this.userState.vendor) {
                  this.userState.vendor.profilePictureUrl = this.vendor.profilePicUrl;
                }
                this.snackBar.open('Image uploaded successfully!', 'Close', { duration: 3000 });
              }
            },
            error: (err) => {
              this.isUploadingImage = false;
              console.error('Failed to upload image:', err);
              this.snackBar.open('Failed to upload image. You can try again later.', 'Close', { duration: 3000 });
            }
          });
      }
    }
  }

  submitForm(form: NgForm) {
    if (form.valid) {
      this.isSubmitting = true;

      const updateData = {
        vendorId: this.vendor.vendorId,
        shoppeeName: this.vendor.shoppeeName,
        shopkeeperName: this.vendor.shopkeeperName,
        contactNumber: parseInt(this.vendor.mobile),
        businessName: this.vendor.businessName,
        shoppeeAddress: this.vendor.shoppeeAddress,
        locationDistrict: this.vendor.locationDistrict,
        locationState: this.vendor.locationState,
        returnPolicy: this.vendor.returnPolicy
      };

      // Simulate API call - replace with actual service call
      setTimeout(() => {
        if (this.userState.vendor) {
          this.userState.vendor = {
            ...this.userState.vendor,
            ...updateData
          };
        }
        
        this.showSuccessMessage();
        this.isSubmitting = false;
        
        setTimeout(() => {
          this.closeDialog();
        }, 1500);
      }, 1500);
      
    } else {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
    }
  }

  showSuccessMessage() {
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
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Profile updated successfully!
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
