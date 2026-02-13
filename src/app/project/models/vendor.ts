// Vendor/Shop type classification
export type VendorType = 'small' | 'medium' | 'large';  // hat-gaadi, small shop, big shop

// Delivery options vendor supports
export type DeliveryOption = 'post' | 'courier' | 'local' | 'pickup_only';

export interface VendorDto {
  vendorId?: string;
  fullName?: string;
  emailAddress?: string;
  contactNumber?: number;
  address?: string;
  city?: string;
  state?: string;
  district?: string;  // Added for AuthController compatibility
  pinCode?: string;
  businessName?: string;
  businessRegistryNumber?: string;
  status?: string;
  shoppeeName?: string;
  shopkeeperName?: string;
  password?: string;
  shoppeeAddress?: string;
  returnPolicy?: string;
  termsAndServiceAgreement?: string;
  locationDistrict?: string;
  locationState?: string;
  lastLogin?: Date;
  createdAt?: Date;
  profilePictureUrl?: string;
  deliveryAvailable?: boolean;
  deliveryCharge?: number;  // Added for AuthController compatibility

  // ========== ODOP Shop Details ==========
  vendorType?: VendorType;           // small (hat-gaadi), medium, large
  shopDescription?: string;          // About the shop
  shopImages?: string[];             // Shop photo URLs
  specializations?: string[];        // What products they specialize in

  // ========== Location & Map ==========
  shopLatitude?: number;             // For map display
  shopLongitude?: number;            // For map display
  googleMapsLink?: string;           // Direct Google Maps link

  // ========== Physical Visit ==========
  isPhysicalVisitAllowed?: boolean;  // Can customer visit shop?
  shopTimings?: string;              // e.g., "9 AM - 8 PM"
  shopClosedDays?: string;           // e.g., "Sunday"

  // ========== Delivery Options ==========
  deliveryOptions?: DeliveryOption[]; // post, courier, local, pickup
  deliveryAreas?: string[];           // Districts/states they deliver to
  deliveryCharges?: number;           // Base delivery charge
  freeDeliveryAbove?: number;         // Free delivery above this amount

  // ========== Verification ==========
  isVerified?: boolean;              // Admin verified vendor
  giTagCertified?: boolean;          // Has GI tag certification
}

export interface VendorRegistrationDto {
  // Core fields - matching backend VendorRegistrationDto
  shopkeeperName?: string;
  shoppeeName?: string;
  emailAddress?: string;
  password?: string;
  contactNumber?: number;
  shoppeeAddress?: string;
  locationDistrict?: string;
  locationState?: string;
  pinCode?: string;
  businessRegistryNumber?: string;
  taxIdentificationNumber?: string;
  businessLicenseNumber?: string;
  completeAddress?: string;
  returnPolicy?: string;
  termsAndServiceAgreement?: string;
  businessDescription?: string;
  profilePictureUrl?: string;
  websiteUrl?: string;
  operatingHours?: string;
  deliveryAvailable?: boolean;
  deliveryRadiusInKm?: number;
  deliveryCharges?: number;
  freeDeliveryAbove?: number;
  vendorType?: string;
  shopDescription?: string;
  productCategories?: string;
}

export type Vendor = VendorDto;
