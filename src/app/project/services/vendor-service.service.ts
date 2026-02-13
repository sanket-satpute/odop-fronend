import { Injectable } from '@angular/core';
import { GlobalVariable } from '../global/global';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { VendorDto, VendorRegistrationDto } from '../models/vendor';
import { AuthResponse } from '../models/auth-response';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VendorServiceService {
  private mainUrl = GlobalVariable.BASE_API_URL + "vendor";
  private authUrl = GlobalVariable.BASE_API_URL.replace('/odop/', '') + "/authenticate"; // Global authenticate endpoint

  private currentVendorSubject = new BehaviorSubject<VendorDto | null>(null);
  public currentVendor$ = this.currentVendorSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get vendors by state only (location-based discovery)
   */
  getVendorsByState(state: string): Observable<VendorDto[]> {
    return this.http.get<VendorDto[]>(`${this.mainUrl}/search_by_state?state=${encodeURIComponent(state)}`);
  }

  // SET current vendor manually (useful for login)
  setCurrentVendor(vendor: VendorDto) {
    this.currentVendorSubject.next(vendor);
  }

  // GET current vendor synchronously (for guards or quick access)
  getCurrentVendor(): VendorDto | null {
    return this.currentVendorSubject.value;
  }

  // REGISTER
  registerVendor(registrationDto: VendorRegistrationDto): Observable<VendorDto> {
    return this.http.post<VendorDto>(`${this.mainUrl}/create_account`, registrationDto);
  }
  // ✅ GET ALL
  getAllVendors(): Observable<VendorDto[]> {
    return this.http.get<VendorDto[]>(`${this.mainUrl}/get_all_vendors`);
  }

  // ✅ GET BY ID + auto-set currentVendor
  getVendorById(id: string): Observable<VendorDto> {
    return this.http.get<VendorDto>(`${this.mainUrl}/get_vendor_id/${id}`).pipe(
      tap(vendor => this.currentVendorSubject.next(vendor))
    );
  }

  // ✅ LOGIN
  loginVendor(emailAddress: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.authUrl, { username: emailAddress, password: password, role: 'vendor' });
  }

  // ✅ DELETE
  deleteVendorById(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.mainUrl}/delete_by_id/${id}`);
  }

  // ✅ UPDATE
  updateVendorById(id: string, vendorDto: VendorDto): Observable<VendorDto> {
    return this.http.put<VendorDto>(`${this.mainUrl}/update_vendor_by_id/${id}`, vendorDto).pipe(
      tap(updated => {
        if (updated) {
          this.currentVendorSubject.next(updated);  // update local state
        }
      })
    );
  }

  getAllVendorsCount(): Observable<number> {
    return this.getAllVendors().pipe(
      map((vendors: VendorDto[]) => vendors.length)
    );
  }

  updateStatus(id: string, status: boolean): Observable<VendorDto> {
    return this.http.patch<VendorDto>(`${this.mainUrl}/update_status/${id}`, { status });
  }

  getVendorsByLocation(district: string, state: string): Observable<VendorDto[]> {
    return this.http.get<VendorDto[]>(`${this.mainUrl}/search_by_location?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`);
  }

  getVendorsWithDelivery(district: string, state: string): Observable<VendorDto[]> {
    return this.http.get<VendorDto[]>(`${this.mainUrl}/search_with_delivery?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`);
  }
}
