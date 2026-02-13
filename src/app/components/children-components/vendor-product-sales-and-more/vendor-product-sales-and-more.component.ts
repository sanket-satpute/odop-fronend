import { Component } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
import { Cart } from 'src/app/project/models/cart';
import { CartObj } from 'src/app/project/models/cart_obj';
import { Product } from 'src/app/project/models/product';
import { CartServiceService } from 'src/app/project/services/cart-service.service';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { ProductServiceService } from 'src/app/project/services/product-service.service';

@Component({
  selector: 'app-vendor-product-sales-and-more',
  templateUrl: './vendor-product-sales-and-more.component.html',
  styleUrls: ['./vendor-product-sales-and-more.component.css']
})
export class VendorProductSalesAndMoreComponent {

  constructor(
    private cart_service: CartServiceService,
    private ap: AppComponent,
    private prod_service: ProductServiceService,
    private cust_service: CustomerServiceService
    ) {}

    carts?: Cart[];
  
    objs: CartObj[] = [];

  ngOnInit(): void {
    this.cart_service.getCartByIdVendor("this.ap.GLOBAL_VENDOR?.vendorId").subscribe(
      (response) => {
        this.carts = response;
        for(let item of this.carts) {
          const productId = typeof item.productId === 'string' ? item.productId : item.productId?.productId;
          if (!productId) continue;
          this.prod_service.getProductById(productId).subscribe(
            (response) => {
              const prod = response
              if (item.customerId) { // Ensure customerId is defined
                this.cust_service.getCustomerById(item.customerId).subscribe(
                  (response) => {
                    if(!item.approval) {
                      const obj = new CartObj();
                      obj.cartId = item.cartId;
                      obj.cutomerId = item.customerId
                      obj.approval = item.approval;
                      obj.vendorId = item.vendorId
                      obj.time = item.time;
                      obj.pPri = prod.price
                      obj.pName = prod.productName;
                      obj.pImgUrl = prod.productImageURL
                      obj.pDescr = prod.productDescription;
                      obj.pImgUrl = response.fullName

                    this.objs.push(obj);
                  }
                },
                (error) => {
                  alert("Failed to load order's")
                }
              );
            } else {
              // Customer ID is undefined for this item
            }
            },
            (error) => {
            }
          )
        }
      },
      (error) => {
        alert("Failed to load cart : " + error);
      }
    )
  }

  getImage(url: string | undefined | null) {
    if(url === null)
      return 'https://www.freshone.com.pk/content/images/thumbs/default-image_550.png'
    if(url != null) {
      return url;
    } else {
      return 'https://www.freshone.com.pk/content/images/thumbs/default-image_550.png'
    }
  }

  approveCart(cartId: string | undefined) {

    this.cart_service.deleteCartById(cartId).subscribe(
      (response) => {
        if(response) {
          this.objs = this.objs.filter(item => item.cartId !== cartId);
        } else {
          alert("Failed to remove item from cart")
        }
      }, 
      (error) => {
        alert("Failed to remove item from cart " + error)
      }
    )
  }
}
