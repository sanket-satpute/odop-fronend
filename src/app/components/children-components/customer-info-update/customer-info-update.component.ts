import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AppComponent } from 'src/app/app.component';
import { Customer } from 'src/app/project/models/customer';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';

@Component({
  selector: 'app-customer-info-update',
  templateUrl: './customer-info-update.component.html',
  styleUrls: ['./customer-info-update.component.css']
})
export class CustomerInfoUpdateComponent {

  customerRegistrationForm!: FormGroup;

  customer: Customer = {};

  password: any = "";
  passwordMismatch: boolean= true;

  constructor(
    private ap: AppComponent,
    private cust_service: CustomerServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // this.customer.customerId = this.ap.GLOBAL_CUSTOMER?.customerId
    // this.customer.password = this.ap.GLOBAL_CUSTOMER?.password
    // this.customer.fullName = this.ap.GLOBAL_CUSTOMER?.fullName
    // this.customer.emailAddress = this.ap.GLOBAL_CUSTOMER?.emailAddress
    // this.customer.contactNumber = this.ap.GLOBAL_CUSTOMER?.contactNumber
    // this.customer.dateOfBirth = this.ap.GLOBAL_CUSTOMER?.dateOfBirth
    // this.customer.profilePicturePath = this.ap.GLOBAL_CUSTOMER?.profilePicturePath
    // this.customer.shippingAddress = this.ap.GLOBAL_CUSTOMER?.shippingAddress
    // this.customer.billingAddress = this.ap.GLOBAL_CUSTOMER?.billingAddress
  }


  onCustomerSubmit() {
    if (this.customer.customerId) {
      this.cust_service.updateCustomerById(this.customer.customerId, this.customer).subscribe({
        next: (response) => {
          if(response == null) {
            alert("Failed to update");
          } else if(this.customer.customerId === response.customerId) {
            alert("Updated Succesefull");
            this.router.navigate(['customer-dashboard']);
          }
        },
        error: (error) => {
          alert("Failed to update " + error);
        }
      });
    } else {
      alert("Customer ID is missing. Cannot update.");
    }
  }

}
