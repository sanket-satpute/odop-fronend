export interface AdminDto {
  adminId?: string;
  fullName?: string;
  emailAddress?: string;
  contactNumber?: number;
  positionAndRole?: string;
  active?: boolean;
  authorizationKey?: string;
  password?: string;
  createdAt?: Date;
  profilePicturePath?: string;
}

export interface AdminRegistrationDto {
  fullName?: string;
  emailAddress?: string;
  password?: string;
  contactNumber?: number;
  positionAndRole?: string;
  authorizationKey?: string;
}

export type Admin = AdminDto;
