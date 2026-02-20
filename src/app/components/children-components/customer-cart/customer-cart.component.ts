import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Cart } from 'src/app/project/models/cart';
import { CartObj } from 'src/app/project/models/cart_obj';
import { Product } from 'src/app/project/models/product';
import { CartServiceService } from 'src/app/project/services/cart-service.service';
import { ProductServiceService } from 'src/app/project/services/product-service.service';
import { UserStateService } from 'src/app/project/services/user-state.service';

@Component({
  selector: 'app-customer-cart',
  templateUrl: './customer-cart.component.html',
  styleUrls: ['./customer-cart.component.css']
})
export class CustomerCartComponent implements OnInit {

  constructor(
    private prod_service: ProductServiceService,
    private cart_service: CartServiceService,
    private userState: UserStateService,
    private snackBar: MatSnackBar
  ) {}



  carts?: Cart[];
  products: Product[] = [];

  objs: CartObj[] = [];

  ngOnInit(): void {
    const customerId = this.userState.customer?.customerId;
    if (!customerId) {
      this.objs = [];
      return;
    }

    this.cart_service.getCartByIdCustomer(customerId).subscribe(
      (response) => {
        this.carts = response;
        for(let item of this.carts) {
          const productId = typeof item.productId === 'string' ? item.productId : item.productId?.productId;
          if (!productId) continue;
          this.prod_service.getProductById(productId).subscribe(
            (response) => {
              this.products.push(response);
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
        this.snackBar.open('Failed to load cart', 'Close', { duration: 2500 });
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

  removeFromCart(cartId: string | undefined) {
    this.cart_service.deleteCartById(cartId).subscribe(
      (response) => {
        if(response) {
          this.objs = this.objs.filter(item => item.cartId !== cartId);
        } else {
          this.snackBar.open('Failed to remove item from cart', 'Close', { duration: 2500 });
        }
      }, 
      (error) => {
        this.snackBar.open('Failed to remove item from cart', 'Close', { duration: 2500 });
      }
    )
  }

  showProductStatus(cartId: string | undefined) {
    this.snackBar.open('Product status is not available for this view', 'Close', { duration: 2500 });
  }
}
