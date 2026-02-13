import { Component, OnInit } from '@angular/core';
import { Admin } from './project/models/admin';
import { Customer } from './project/models/customer';
import { Vendor } from './project/models/vendor';
import { LoadingService, LoadingState } from './project/services/loading.service';
import { UserStateService } from './project/services/user-state.service';
import { LoggerService } from './project/services/logger.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  GLOBAL_CUSTOMER: Customer | null = null;
  GLOBAL_VENDOR: Vendor | null = null;
  GLOBAL_ADMIN: Admin | null = null;
  
  loading$: Observable<LoadingState>;

  constructor(
    private loadingService: LoadingService,
    private userStateService: UserStateService,
    private logger: LoggerService
  ) {
    this.loading$ = this.loadingService.loading$;
  }

  ngOnInit(): void {
    // Load user data from localStorage on app initialization
    this.userStateService.loadUserFromStorage();
    this.logger.info('App initialized, user data loaded from storage');
  }
}