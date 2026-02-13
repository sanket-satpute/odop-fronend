export interface CustomerDto {
  customerId?: string;
  fullName?: string;
  emailAddress?: string;
  contactNumber?: number;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  district?: string;
  pinCode?: string;
  status?: string;
  password?: string;
  dateOfBirth?: string;
  profilePicturePath?: string;
  gender?: string;
  preferredLanguage?: string;
  shippingAddress?: string;
  billingAddress?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  communicationPreference?: string;
  newsletterSubscribed?: boolean;
  orders?: any[];
  wishlistProductIds?: string[];
  cartProductIds?: string[];
  lastLogin?: Date;
  createdAt?: Date;
  
  // Wallet & Rewards fields
  walletBalance?: number;
  rewardCredits?: number;
  referralCode?: string;
  totalSpending?: number;
  walletTransactions?: WalletTransaction[];
  appliedVouchers?: string[];
  membershipTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface WalletTransaction {
  transactionId: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: 'wallet_topup' | 'wallet_payment' | 'reward' | 'refund' | 'referral' | 'voucher' | 'cashback';
  orderId?: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface CustomerRegistrationDto {
  fullName?: string;
  emailAddress?: string;
  password?: string;
  contactNumber?: number;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
}

export type Customer = CustomerDto;
