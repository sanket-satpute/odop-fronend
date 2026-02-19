import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { CustomerDto, CustomerRegistrationDto } from '../models/customer';
import { AuthResponse } from '../models/auth-response';
import { GlobalVariable } from '../global/global';

@Injectable({
  providedIn: 'root'
})
export class CustomerServiceService {

  private mainUrl = GlobalVariable.BASE_API_URL + "customer";
  private authUrl = GlobalVariable.BASE_API_URL.replace('/odop/', '') + "/authenticate"; // Global authenticate endpoint

  // Subject to store current customer data globally
  private currentCustomerSubject = new BehaviorSubject<CustomerDto | null>(null);
  public currentCustomer$ = this.currentCustomerSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize with empty state, no dummy data
    this.currentCustomerSubject.next(null);
  }

  /** Register a new customer */
  registerCustomer(registrationDto: CustomerRegistrationDto): Observable<CustomerDto> {
    return this.http.post<CustomerDto>(`${this.mainUrl}/create_account`, registrationDto).pipe(
      tap({
        error: (error) => console.error('Registration failed:', error)
      })
    );
  }

  // ** Check if customer exists by email or phone number */
  checkCustomerExists(email: string, contactNumber: number): Observable<boolean> {
    const url = `${this.mainUrl}/check_customer_exists/${email}/${contactNumber}`;
    return this.http.get<boolean>(url);
  }

  /** Get all customers */
  getAllCustomers(): Observable<CustomerDto[]> {
    return this.http.get<CustomerDto[]>(`${this.mainUrl}/get_all_customers`);
  }

  /** Fetch a customer by ID and update the subject */
  getCustomerById(id: string): Observable<CustomerDto> {
    return this.http.get<CustomerDto>(`${this.mainUrl}/get_customer_id/${id}`).pipe(
      tap(customer => this.currentCustomerSubject.next(customer))
    );
  }

  /** Get customer by credentials (login) and update the subject */
  loginCustomer(emailAddress: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.authUrl, { username: emailAddress, password: password, role: 'customer' });
  }

  /** Delete customer by ID */
  deleteCustomerById(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.mainUrl}/delete_by_id/${id}`);
  }

  /** Update customer and update the subject */
  updateCustomerById(id: string, customerDto: CustomerDto): Observable<CustomerDto> {
    return this.http.put<CustomerDto>(`${this.mainUrl}/update_customer_by_id/${id}`, customerDto).pipe(
      tap(updated => {
        if (updated) this.currentCustomerSubject.next(updated);
      })
    );
  }

  /** Manual update to the subject (if needed from other parts) */
  setCustomer(customer: CustomerDto): void {
    this.currentCustomerSubject.next(customer);
  }

  /** Clear subject on logout */
  clearCustomer(): void {
    this.currentCustomerSubject.next(null);
  }


  // read profile picture from fileId
  getCustomerProfilePicture(fileId: string): Observable<Blob> {
    const url = `${this.mainUrl}/download/${fileId}`;
    return this.http.get(url, { responseType: 'blob' });
  }
// /odop/customer/download/{fileId}

  getAllCustomersCount(): Observable<number> {
    return this.getAllCustomers().pipe(
      map(customers => customers.length)
    );
  }

  updateStatus(id: string, status: boolean): Observable<CustomerDto> {
    return this.http.patch<CustomerDto>(`${this.mainUrl}/update_status/${id}`, { status });
  }

  /** Update customer profile */
  updateCustomerProfile(profileData: any): Observable<CustomerDto> {
    const customerId = profileData.customerId;
    return this.http.put<CustomerDto>(`${this.mainUrl}/update_customer_by_id/${customerId}`, profileData).pipe(
      tap(updated => {
        if (updated) this.currentCustomerSubject.next(updated);
      })
    );
  }
}
