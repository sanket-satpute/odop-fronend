import { Component } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
import { Customer } from 'src/app/project/models/customer';

@Component({
  selector: 'app-customer-info',
  templateUrl: './customer-info.component.html',
  styleUrls: ['./customer-info.component.css']
})
export class CustomerInfoComponent {

  customer: Customer = {};

  constructor(private ap: AppComponent) {}

  ngOnInit(): void {
    // this.customer.customerId = this.ap.GLOBAL_CUSTOMER?.customerId;
    // this.customer.fullName = this.ap.GLOBAL_CUSTOMER?.fullName;
    // this.customer.emailAddress = this.ap.GLOBAL_CUSTOMER?.emailAddress;
    // this.customer.password = this.ap.GLOBAL_CUSTOMER?.password;
    // this.customer.shippingAddress = this.ap.GLOBAL_CUSTOMER?.shippingAddress;
    // this.customer.billingAddress = this.ap.GLOBAL_CUSTOMER?.billingAddress;
    // this.customer.contactNumber = this.ap.GLOBAL_CUSTOMER?.contactNumber;
    // this.customer.dateOfBirth = this.ap.GLOBAL_CUSTOMER?.dateOfBirth;
    // this.customer.profilePicturePath = this.ap.GLOBAL_CUSTOMER?.profilePicturePath;
  }
}
