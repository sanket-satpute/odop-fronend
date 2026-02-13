import { Injectable } from '@angular/core';
import { GlobalVariable } from '../global/global';
import { HttpClient } from '@angular/common/http';
import { AdminDto, AdminRegistrationDto } from '../models/admin';
import { AuthResponse } from '../models/auth-response';
import { Observable, map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminServiceService {

  mainUrl = GlobalVariable.BASE_API_URL + "admin";
  authUrl = GlobalVariable.BASE_API_URL.replace('/odop/', '') + "/authenticate"; // Global authenticate endpoint

  constructor(protected http: HttpClient) { }

  registerAdmin(registrationDto: AdminRegistrationDto): Observable<AdminDto> {
    return this.http.post<AdminDto>(`${this.mainUrl}/create_account`, registrationDto);
  }

  // check admin already exists by email
  checkAdminExists(emailAddress: string, authorizationKey: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.mainUrl}/check_admin_exists?emailAddress=${encodeURIComponent(emailAddress)}&authorizationKey=${authorizationKey}`);
  }

  getAllAdmins(): Observable<AdminDto[]> {
    return this.http.get<AdminDto[]>(`${this.mainUrl}/findAll_admin`);
  }

  getAdminById(id: string): Observable<AdminDto> {
    return this.http.get<AdminDto>(`${this.mainUrl}/find_admin/${id}`)
  }

  loginAdmin(emailAddress: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.authUrl, { username: emailAddress, password: password, role: 'admin' });
  }

  deleteAdminById(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.mainUrl}/delete_by_id/${id}`);
  }

  updateAdmin(adminId: string, adminDto: AdminDto): Observable<AdminDto> {
    return this.http.put<AdminDto>(`${this.mainUrl}/update_admin/${adminId}`, adminDto);
  }

  getAllAdminCount(): Observable<number> {
    return this.getAllAdmins().pipe(
      map(admins => admins.length)
    );
  }

  updateStatus(id: string, status: boolean): Observable<AdminDto> {
    return this.http.patch<AdminDto>(`${this.mainUrl}/update_status/${id}`, { status });
  }
}
