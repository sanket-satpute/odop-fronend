import { Component } from '@angular/core';
import { Customer } from 'src/app/project/models/customer';
import { Vendor } from 'src/app/project/models/vendor';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { VendorServiceService } from 'src/app/project/services/vendor-service.service';

@Component({
  selector: 'app-admin-vendors-and-customers',
  templateUrl: './admin-vendors-and-customers.component.html',
  styleUrls: ['./admin-vendors-and-customers.component.css']
})
export class AdminVendorsAndCustomersComponent {
  isLoadingVendors = false;
  isLoadingCustomers = false;
  errorVendors: string | null = null;
  errorCustomers: string | null = null;
  filterDistrict: string = '';
  filterState: string = '';

  constructor(private cust_service: CustomerServiceService, private vendor_service: VendorServiceService) {}

  customers: Customer[] = [];
  vendors: Vendor[] = [];
  vendor:Vendor = {};

  ngOnInit(): void {
    this.isLoadingCustomers = true;
    this.isLoadingVendors = true;
    this.errorCustomers = null;
    this.errorVendors = null;
    this.cust_service.getAllCustomers().subscribe(
      (response) => {
        this.customers = response;
        this.isLoadingCustomers = false;
      },
      (error) => {
        this.errorCustomers = 'Failed to load customers.';
        this.isLoadingCustomers = false;
      }
    );
    this.vendor_service.getAllVendors().subscribe(
      (response) => {
        this.vendors = response;
        this.isLoadingVendors = false;
      },
      (error) => {
        this.errorVendors = 'Failed to load vendors.';
        this.isLoadingVendors = false;
      }
    );
  }

  filterVendorsByLocation(): void {
    if (!this.filterDistrict || !this.filterState) {
      alert('Please enter both district and state.');
      return;
    }
    this.vendor_service.getVendorsByLocation(this.filterDistrict, this.filterState).subscribe(
      (response) => {
        this.vendors = response;
      },
      (error) => {
        alert(error);
      }
    );
  }

  filterVendorsByState(): void {
    if (!this.filterState) {
      alert('Please enter a state.');
      return;
    }
    this.vendor_service.getVendorsByState(this.filterState).subscribe(
      (response) => {
        this.vendors = response;
      },
      (error) => {
        alert(error);
      }
    );
  }

  resetVendorFilter(): void {
    this.filterDistrict = '';
    this.filterState = '';
    this.vendor_service.getAllVendors().subscribe(
      (response) => {
        this.vendors = response;
      },
      (error) => {
        alert(error);
      }
    );
  }

  seeVendor(vendor: any) {
    // Handle logic to see vendor details
  }

  deleteVendor(id: string | undefined) {
    if (typeof id === "string") {
      if (!confirm('Are you sure you want to delete this vendor?')) return;
      this.vendor_service.deleteVendorById(id).subscribe(
        (response) => {
          if (response === true) {
            // Optionally refresh list here
            console.log("deleted");
          } else {
            alert("Vendor not deleted");
          }
        },
        (error) => {
          alert("Error deleting vendor");
        }
      );
    } else {
      alert("Can't delete");
    }
  }

  seeCustomer(customer: any) {
    // Handle logic to see customer details
  }

  deleteCustomer(customer: Customer) {
    if (!customer || !customer.customerId) {
      alert("Can't delete");
      return;
    }
    if (!confirm('Are you sure you want to delete this customer?')) return;
    this.cust_service.deleteCustomerById(customer.customerId).subscribe(
      (response) => {
        if (response === true) {
          // Optionally refresh list here
          console.log("deleted");
        } else {
          alert("Customer not deleted");
        }
      },
      (error) => {
        alert("Error deleting customer");
      }
    );
  }
}
