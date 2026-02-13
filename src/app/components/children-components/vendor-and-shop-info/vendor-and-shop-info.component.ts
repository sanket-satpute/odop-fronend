import { Component } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
import { Vendor } from 'src/app/project/models/vendor';

@Component({
  selector: 'app-vendor-and-shop-info',
  templateUrl: './vendor-and-shop-info.component.html',
  styleUrls: ['./vendor-and-shop-info.component.css']
})
export class VendorAndShopInfoComponent {

  vendor: Vendor | undefined | null = {};

  constructor(private ap: AppComponent) {
    // this.vendor = ap.GLOBAL_VENDOR;
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
  
}
