import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AddressService, Address } from 'src/app/project/services/address.service';

@Component({
  selector: 'app-customer-addresses',
  templateUrl: './customer-addresses.component.html',
  styleUrls: ['./customer-addresses.component.css']
})
export class CustomerAddressesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  addresses: Address[] = [];
  showAddressForm: boolean = false;
  editingAddress: Address | null = null;
  isLoading: boolean = false;
  isSaving: boolean = false;
  loadError: string = '';

  // Form fields
  formData: Partial<Address> = {
    type: 'home',
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false
  };

  states: string[] = [];

  constructor(
    private addressService: AddressService,
    private snackBar: MatSnackBar
  ) {
    this.states = this.addressService.getIndianStates();
  }

  ngOnInit(): void {
    this.loadAddresses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAddresses(): void {
    this.isLoading = true;
    this.loadError = '';
    
    this.addressService.getAddresses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses) => {
          this.addresses = addresses;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading addresses:', error);
          this.loadError = 'Failed to load addresses. Please try again.';
          this.isLoading = false;
          this.snackBar.open('Failed to load addresses', 'Retry', {
            duration: 4000
          }).onAction().subscribe(() => this.loadAddresses());
        }
      });
  }

  openAddForm(): void {
    this.editingAddress = null;
    this.resetForm();
    this.showAddressForm = true;
  }

  openEditForm(address: Address): void {
    this.editingAddress = address;
    this.formData = { 
      type: address.type,
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      district: address.district || '',
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || '',
      isDefault: address.isDefault
    };
    this.showAddressForm = true;
  }

  closeForm(): void {
    this.showAddressForm = false;
    this.editingAddress = null;
    this.resetForm();
  }

  resetForm(): void {
    this.formData = {
      type: 'home',
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: false
    };
  }

  saveAddress(): void {
    if (!this.validateForm()) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving = true;

    const addressData: Address = {
      type: this.formData.type as 'home' | 'work' | 'other',
      name: this.formData.name!,
      phone: this.formData.phone!,
      addressLine1: this.formData.addressLine1!,
      addressLine2: this.formData.addressLine2,
      city: this.formData.city!,
      district: this.formData.district,
      state: this.formData.state!,
      pincode: this.formData.pincode!,
      landmark: this.formData.landmark,
      isDefault: this.formData.isDefault || false
    };

    if (this.editingAddress?.addressId) {
      // Update existing address
      this.addressService.updateAddress(this.editingAddress.addressId, addressData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedAddress) => {
            const index = this.addresses.findIndex(a => a.addressId === this.editingAddress?.addressId);
            if (index !== -1) {
              if (updatedAddress.isDefault) {
                this.addresses = this.addresses.map(a => ({ ...a, isDefault: false }));
              }
              this.addresses[index] = updatedAddress;
            }
            this.isSaving = false;
            this.closeForm();
            this.snackBar.open('Address updated successfully', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error updating address:', error);
            this.isSaving = false;
            this.snackBar.open('Failed to update address. Please try again.', 'Close', { duration: 3000 });
          }
        });
    } else {
      // Create new address
      this.addressService.createAddress(addressData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newAddress) => {
            if (newAddress.isDefault) {
              this.addresses = this.addresses.map(a => ({ ...a, isDefault: false }));
            }
            this.addresses.push(newAddress);
            this.isSaving = false;
            this.closeForm();
            this.snackBar.open('Address added successfully', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error creating address:', error);
            this.isSaving = false;
            this.snackBar.open('Failed to add address. Please try again.', 'Close', { duration: 3000 });
          }
        });
    }
  }

  validateForm(): boolean {
    return !!(
      this.formData.name &&
      this.formData.phone &&
      this.formData.addressLine1 &&
      this.formData.city &&
      this.formData.state &&
      this.formData.pincode
    );
  }

  deleteAddress(address: Address): void {
    if (!address.addressId) return;
    
    if (confirm('Are you sure you want to delete this address?')) {
      this.addressService.deleteAddress(address.addressId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.addresses = this.addresses.filter(a => a.addressId !== address.addressId);
            this.snackBar.open('Address deleted successfully', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting address:', error);
            this.snackBar.open('Failed to delete address. Please try again.', 'Close', { duration: 3000 });
          }
        });
    }
  }

  setAsDefault(address: Address): void {
    if (!address.addressId || address.isDefault) return;
    
    this.addressService.setDefaultAddress(address.addressId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.addresses = this.addresses.map(a => ({
            ...a,
            isDefault: a.addressId === address.addressId
          }));
          this.snackBar.open('Default address updated', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error setting default address:', error);
          this.snackBar.open('Failed to set default address. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  getAddressTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'home': 'fa-home',
      'work': 'fa-building',
      'other': 'fa-map-marker-alt'
    };
    return icons[type] || 'fa-map-marker-alt';
  }

  getAddressTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'home': 'Home',
      'work': 'Work',
      'other': 'Other'
    };
    return labels[type] || 'Other';
  }

  formatAddress(address: Address): string {
    let parts = [address.addressLine1];
    if (address.addressLine2) parts.push(address.addressLine2);
    if (address.landmark) parts.push(address.landmark);
    parts.push(`${address.city}, ${address.state} - ${address.pincode}`);
    return parts.join(', ');
  }
}

