import { Injectable } from '@angular/core';
import { GlobalVariable } from '../global/global';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cart } from '../models/cart';

@Injectable({
  providedIn: 'root'
})
export class CartServiceService {

  mainUrl = GlobalVariable.BASE_API_URL + "cart";


  constructor(private http: HttpClient) { }

  registerCart(cartData?: Cart): Observable<Cart> {
    return this.http.post<Cart>(`${this.mainUrl}/save_cart`, cartData);
  }  

  getAllCarts(): Observable<Cart[]> {
    return this.http.get<Cart[]>(`${this.mainUrl}/get_all_carts`);
  }

  getCartById(id: any): Observable<Cart> {
    return this.http.get<Cart>(`${this.mainUrl}/get_cart_id/${id}`)
  }

  getCartByIdVendor(id: any): Observable<Cart[]> {
    return this.http.get<Cart[]>(`${this.mainUrl}/get_cart_vendor_id/${id}`)
  }

  getCartByIdProduct(id: any): Observable<Cart[]> {
    return this.http.get<Cart[]>(`${this.mainUrl}/get_cart_product_id/${id}`)
  }

  getCartByIdCustomer(id: any): Observable<Cart[]> {
    return this.http.get<Cart[]>(`${this.mainUrl}/get_cart_customer_id/${id}`)
  }

  getCartByIdApproval(approval: boolean): Observable<Cart[]> {
    return this.http.get<Cart[]>(`${this.mainUrl}/get_cart_approval/${approval}`)
  }

  deleteCartById(id: string | undefined): Observable<boolean> {
    return this.http.delete<boolean>(`${this.mainUrl}/delete_by_id/${id}`);
  }
}
