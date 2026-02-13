export interface CartProduct {
    productId?: string;
    productName?: string;
    productPrice?: number;
    product_main_image?: string;
    vendorId?: {
        vendorId?: string;
        shopName?: string;
    } | string;
}

export class Cart {
    cartId?: string;
    customerId?: string;
    vendorId?: string;
    productId?: string | CartProduct;
    approval?: boolean;
    time?: string;
    quantity?: number;
}

