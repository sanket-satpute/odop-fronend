import { Component } from '@angular/core';
import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'app-customer-account-dashboard-component',
  templateUrl: './customer-account-dashboard-component.component.html',
  styleUrls: ['./customer-account-dashboard-component.component.css']
})
export class CustomerAccountDashboardComponentComponent {

  constructor(
    private ap: AppComponent
  ) {}

  ngOnInit(): void {
    
  }
}
