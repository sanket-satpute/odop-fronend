export class ProdOrder {
  productId?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  pricePerUnit?: number;
  discountApplied?: boolean;
  discountAmount?: number;
  vendorId?: string;
  totalAmount?: number;
  returnEligibleUntil?: Date;

  constructor(init?: Partial<ProdOrder>) {
    Object.assign(this, init);
  }
}
