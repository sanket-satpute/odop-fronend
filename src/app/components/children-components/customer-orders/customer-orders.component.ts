import { Component, OnInit } from '@angular/core';
import { OrderService } from 'src/app/project/services/order.service';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { Order } from 'src/app/project/models/order';

@Component({
  selector: 'app-customer-orders',
  templateUrl: './customer-orders.component.html',
  styleUrls: ['./customer-orders.component.css']
})
export class CustomerOrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private orderService: OrderService,
    private userStateService: UserStateService
  ) {}

  ngOnInit(): void {
    const customer = this.userStateService.customer;
    if (customer && customer.customerId) {
      this.fetchOrders(customer.customerId);
    } else {
      this.error = 'No customer is logged in.';
    }
  }

  fetchOrders(customerId: string): void {
    this.isLoading = true;
    this.error = null;
    this.orderService.getOrdersByCustomerId(customerId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load orders.';
        this.isLoading = false;
      }
    });
  }
}
