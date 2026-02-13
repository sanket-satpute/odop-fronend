import { Component, OnInit, Inject, Optional } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserStateService } from '../../../project/services/user-state.service';
import { AdminServiceService } from '../../../project/services/admin-service.service';
import { ImageUploadService, ImageUploadResponse } from '../../../project/services/image-upload.service';

interface AdminProfile {
  adminId: string;
  fullName: string;
  email: string;
  mobile: string;
  positionAndRole: string;
  profilePicUrl: string;
  active: boolean;
}

@Component({
  selector: 'app-admin-update-profile-dialog',
  templateUrl: './admin-update-profile-dialog.component.html',
  styleUrls: ['./admin-update-profile-dialog.component.css']
})
export class AdminUpdateProfileDialogComponent implements OnInit {
  isSubmitting = false;
  selectedFile: File | null = null;
  isUploadingImage = false;

  admin: AdminProfile = {
    adminId: '',
    fullName: '',
    email: '',
    mobile: '',
    positionAndRole: '',
    profilePicUrl: '',
    active: true
  };

  roles: string[] = [
    'Super Admin',
    'System Administrator',
    'Content Manager',
    'Product Manager',
    'Customer Support Lead',
    'Analytics Manager',
    'Order Manager',
    'Vendor Manager'
  ];

  constructor(
    @Optional() private dialogRef: MatDialogRef<AdminUpdateProfileDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private userState: UserStateService,
    private adminService: AdminServiceService,
    private snackBar: MatSnackBar,
    private imageUploadService: ImageUploadService
  ) {}

  ngOnInit() {
    this.loadAdminProfile();
  }

  loadAdminProfile() {
    const adminData = this.userState.admin;
    if (adminData) {
      this.admin = {
        adminId: adminData.adminId || '',
        fullName: adminData.fullName || '',
        email: adminData.emailAddress || '',
        mobile: adminData.contactNumber?.toString() || '',
        positionAndRole: adminData.positionAndRole || '',
        profilePicUrl: adminData.profilePicturePath || '',
        active: adminData.active ?? true
      };
    }
  }

  onMobileInput(event: any) {
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.admin.mobile = value;
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
        this.admin.profilePicUrl = reader.result as string;
      };
      reader.readAsDataURL(file);

      // Upload image using ImageUploadService (using generic upload for admin)
      if (this.admin.adminId) {
        this.isUploadingImage = true;
        // Use generic uploadImage with 'customer' type as a workaround (admin type not available)
        this.imageUploadService.uploadImage(file, 'customer', this.admin.adminId, true)
          .subscribe({
            next: (response: ImageUploadResponse) => {
              this.isUploadingImage = false;
              if (response.success && response.imageMetadata) {
                this.admin.profilePicUrl = response.imageMetadata.secureUrl || response.imageMetadata.url;
                // Update user state
                if (this.userState.admin) {
                  this.userState.admin.profilePicturePath = this.admin.profilePicUrl;
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
        adminId: this.admin.adminId,
        fullName: this.admin.fullName,
        contactNumber: parseInt(this.admin.mobile),
        positionAndRole: this.admin.positionAndRole,
        active: this.admin.active
      };

      // Simulate API call - replace with actual service call
      setTimeout(() => {
        if (this.userState.admin) {
          this.userState.admin = {
            ...this.userState.admin,
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
