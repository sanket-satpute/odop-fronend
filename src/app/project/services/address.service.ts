import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { GlobalVariable } from '../global/global';
import { UserStateService } from './user-state.service';

export interface Address {
  addressId?: string;
  customerId?: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressCount {
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'customer';
  
  // Cache addresses
  private addressesSubject = new BehaviorSubject<Address[]>([]);
  public addresses$ = this.addressesSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private userStateService: UserStateService
  ) {}

  /**
   * Get customer ID from state
   */
  private getCustomerId(): string {
    const customer = this.userStateService.customer;
    if (!customer?.customerId) {
      throw new Error('No customer logged in');
    }
    return customer.customerId;
  }

  /**
   * Get all addresses for the logged-in customer
   */
  getAddresses(): Observable<Address[]> {
    const customerId = this.getCustomerId();
    this.isLoadingSubject.next(true);
    
    return this.http.get<Address[]>(`${this.baseUrl}/${customerId}/addresses`).pipe(
      tap(addresses => {
        this.addressesSubject.next(addresses);
        this.isLoadingSubject.next(false);
      })
    );
  }

  /**
   * Get a specific address by ID
   */
  getAddressById(addressId: string): Observable<Address> {
    const customerId = this.getCustomerId();
    return this.http.get<Address>(`${this.baseUrl}/${customerId}/addresses/${addressId}`);
  }

  /**
   * Get the default address
   */
  getDefaultAddress(): Observable<Address> {
    const customerId = this.getCustomerId();
    return this.http.get<Address>(`${this.baseUrl}/${customerId}/addresses/default`);
  }

  /**
   * Create a new address
   */
  createAddress(address: Address): Observable<Address> {
    const customerId = this.getCustomerId();
    return this.http.post<Address>(`${this.baseUrl}/${customerId}/addresses`, address).pipe(
      tap(newAddress => {
        const currentAddresses = this.addressesSubject.value;
        
        // If new address is default, update others
        let updatedAddresses: Address[];
        if (newAddress.isDefault) {
          updatedAddresses = currentAddresses.map(a => ({ ...a, isDefault: false }));
          updatedAddresses.push(newAddress);
        } else {
          updatedAddresses = [...currentAddresses, newAddress];
        }
        
        this.addressesSubject.next(updatedAddresses);
      })
    );
  }

  /**
   * Update an existing address
   */
  updateAddress(addressId: string, address: Address): Observable<Address> {
    const customerId = this.getCustomerId();
    return this.http.put<Address>(`${this.baseUrl}/${customerId}/addresses/${addressId}`, address).pipe(
      tap(updatedAddress => {
        let currentAddresses = this.addressesSubject.value;
        
        // If updated address is now default, update others
        if (updatedAddress.isDefault) {
          currentAddresses = currentAddresses.map(a => ({ ...a, isDefault: false }));
        }
        
        // Update the address in the list
        const index = currentAddresses.findIndex(a => a.addressId === addressId);
        if (index !== -1) {
          currentAddresses[index] = updatedAddress;
        }
        
        this.addressesSubject.next([...currentAddresses]);
      })
    );
  }

  /**
   * Delete an address
   */
  deleteAddress(addressId: string): Observable<{ deleted: boolean }> {
    const customerId = this.getCustomerId();
    return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/${customerId}/addresses/${addressId}`).pipe(
      tap(() => {
        const addresses = this.addressesSubject.value.filter(a => a.addressId !== addressId);
        this.addressesSubject.next(addresses);
      })
    );
  }

  /**
   * Set an address as default
   */
  setDefaultAddress(addressId: string): Observable<Address> {
    const customerId = this.getCustomerId();
    return this.http.patch<Address>(`${this.baseUrl}/${customerId}/addresses/${addressId}/default`, {}).pipe(
      tap(defaultAddress => {
        const addresses = this.addressesSubject.value.map(a => ({
          ...a,
          isDefault: a.addressId === addressId
        }));
        this.addressesSubject.next(addresses);
      })
    );
  }

  /**
   * Get addresses by type
   */
  getAddressesByType(type: 'home' | 'work' | 'other'): Observable<Address[]> {
    const customerId = this.getCustomerId();
    return this.http.get<Address[]>(`${this.baseUrl}/${customerId}/addresses/type/${type}`);
  }

  /**
   * Get address count
   */
  getAddressCount(): Observable<AddressCount> {
    const customerId = this.getCustomerId();
    return this.http.get<AddressCount>(`${this.baseUrl}/${customerId}/addresses/count`);
  }

  /**
   * Get cached addresses
   */
  getCachedAddresses(): Address[] {
    return this.addressesSubject.value;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.addressesSubject.next([]);
  }

  /**
   * Indian states list for dropdowns
   */
  getIndianStates(): string[] {
    return [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
      'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
      'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
      'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 
      'Delhi', 'Jammu and Kashmir', 'Ladakh',
      'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
      'Lakshadweep', 'Puducherry'
    ];
  }
}
