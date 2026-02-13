import { ProdOrder } from './prod-order';

export interface OrderItem {
  productId?: string;
  productName?: string;
  productImageURL?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  totalPrice?: number;
}

export class Order {
  orderId?: string; // Example: "#ORD-2024-003"
  orderDateTime?: Date;
  orderStatus?: string; // e.g. "Processing", "Shipped", etc.
  productList?: ProdOrder[];  // Legacy field
  orderItems?: OrderItem[];   // New field matching backend
  totalAmount?: number;
  finalAmount?: number;
  deliveryCharges?: number;
  couponApplied?: boolean;
  couponCode?: string;
  discountAmount?: number;
  paymentMethod?: string; // e.g. razorpay, COD
  paymentId?: string; // Razorpay payment ID
  paymentStatus?: string;
  paymentTransactionId?: string;
  shippingAddress?: string;
  shippingDistrict?: string;
  shippingState?: string;
  shippingPinCode?: string;
  shippingContactNumber?: number;
  customerNotes?: string;
  customerId?: string;
  vendorId?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(init?: Partial<Order>) {
    Object.assign(this, init);
  }
}
