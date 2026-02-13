import { Component } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
import { Cart } from 'src/app/project/models/cart';
import { CartObj } from 'src/app/project/models/cart_obj';
import { Product } from 'src/app/project/models/product';
import { CartServiceService } from 'src/app/project/services/cart-service.service';
import { ProductServiceService } from 'src/app/project/services/product-service.service';

@Component({
  selector: 'app-customer-cart',
  templateUrl: './customer-cart.component.html',
  styleUrls: ['./customer-cart.component.css']
})
export class CustomerCartComponent {

  constructor(
    private prod_service: ProductServiceService,
    private cart_service: CartServiceService,
    private ap: AppComponent
  ) {}



  carts?: Cart[];
  products?: Product[];

  objs: CartObj[] = [];

  ngOnInit(): void {
    this.cart_service.getCartByIdCustomer("this.ap.GLOBAL_CUSTOMER?.customerId").subscribe(
      (response) => {
        console.log(response);
        this.carts = response;
        for(let item of this.carts) {
          const productId = typeof item.productId === 'string' ? item.productId : item.productId?.productId;
          if (!productId) continue;
          this.prod_service.getProductById(productId).subscribe(
            (response) => {
              console.log(response);
              this.products?.push(response);
              const obj = new CartObj();
              obj.cartId = item.cartId;
              obj.cutomerId = item.customerId
              obj.approval = item.approval;
              obj.vendorId = item.vendorId
              obj.time = item.time;
              obj.pPri = response.price
              obj.pName = response.productName;
              obj.pImgUrl = response.productImageURL
              obj.pDescr = response.productDescription;

              this.objs.push(obj);
            },
            (error) => {
              console.log(error);
            }
          )
        }
      },
      (error) => {
        console.log(error);
        alert("Failed to load cart : " + error);
      }
    )
  }

  getImage(url: string | undefined | null) {
    if(url === null)
      return 'https://www.freshone.com.pk/content/images/thumbs/default-image_550.png'
    if(url != null) {
      console.log("hhh")
      return url;
    } else {
      return 'https://www.freshone.com.pk/content/images/thumbs/default-image_550.png'
    }
  }

  removeFromCart(cartId: string | undefined) {
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

  showProductStatus(cartId: string | undefined) {
    console.log("Not implemented")
    alert("Not implemented")
  }
}
