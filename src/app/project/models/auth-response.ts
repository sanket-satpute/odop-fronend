export interface AuthResponse {
  jwt: string;
  user: any; // CustomerDto, VendorDto, or AdminDto
}
