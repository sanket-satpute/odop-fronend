import { Component } from '@angular/core';
import { AdminServiceService } from 'src/app/project/services/admin-service.service';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { VendorServiceService } from 'src/app/project/services/vendor-service.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
// dropdown
import { OnInit, OnDestroy, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

interface Role {
  value: string;
  label: string;
  count: number;
}

interface DateRange {
  from: string;
  to: string;
}

interface FilterOptions {
  searchQuery: string;
  selectedRoles: string[];
  dateRange: DateRange;
  selectedStatus: string[];
}

// natural

export interface User {
  id: number;
  name: string;
  phone: number
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  profilePicture: string;
}

@Component({
  selector: 'app-admin-dashboard-user-management',
  templateUrl: './admin-dashboard-user-management.component.html',
  styleUrls: ['./admin-dashboard-user-management.component.css']
})
export class AdminDashboardUserManagementComponent {


  allUsers: User[] = [];     
  filteredUsers: User[] = [];
  selectedRole: string = 'all';
  searchQuery: string = '';
  totalUsersCount: number = 0;
  totalCustomersCount: number = 0;
  totalAdminsCount: number = 0;
  totalVendorsCount: number = 0;

  activeTab: string = 'all'; // 'all', 'customer', 'vendor', 'admin'

  // pagination
  pageSize = 5;
  currentPage = 1;
  itemsPerPage = 5;
  // Final list shown on current page
  paginatedUsers: User[] = [];

  constructor(
    private customerService: CustomerServiceService,
    private adminService: AdminServiceService,
    private vendorService: VendorServiceService,
    private elementRef: ElementRef
  ) {
    // Initialize with some dummy data
    this.allUsers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: +911234567890,
        role: 'admin',
        status: 'active',
        createdAt: new Date('2023-01-01'),
        profilePicture: 'https://via.placeholder.com/100'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: +911234567890,
        role: 'customer',
        status: 'inactive',
        createdAt: new Date('2023-02-01'),
        profilePicture: 'https://via.placeholder.com/100'
      }
    ];
  }
// https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face
  ngOnInit() {
    this.startFetchingUsers();

    // filter dropdown
    // Setup search debouncing
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery = query;
        this.emitFiltersChanged();
      });
    
    // Load saved filters from session (optional)
    this.loadSavedFilters();
  }

  startFetchingUsers() {
    this.fetchAllUsers();
    this.updateCounts();
    this.filterUsers();
  }

  updateCounts() {
    this.totalUsersCount = this.allUsers.length;
    this.customerService.getAllCustomersCount().subscribe(count => {
      this.totalCustomersCount = count;
      this.updateTotalUsers();
    });
    this.adminService.getAllAdminCount().subscribe(count => {
      this.totalAdminsCount = count;
      this.updateTotalUsers();
    });
    this.vendorService.getAllVendorsCount().subscribe(count => {
      this.totalVendorsCount = count;
      this.updateTotalUsers();
    });
  }

  updateTotalUsers() {
    this.totalUsersCount = 
      (this.totalCustomersCount || 0) +
      (this.totalAdminsCount || 0) +
      (this.totalVendorsCount || 0);
  }

  onTabChange(tab: string) {
    this.selectedRole = tab;
    this.filterUsers();
  }


  filterUsers() {
    const query = this.searchQuery.toLowerCase();

    this.filteredUsers = this.allUsers.filter(user => {
      const matchesRole = this.selectedRole === 'all' || user.role === this.selectedRole;
      const matchesSearch =
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toString().includes(query);

      return matchesRole && matchesSearch;
    });

    this.currentPage = 1; // Reset to first page
    this.updatePaginatedUsers();
  }



  fetchAllUsers() {
    forkJoin({
      customers: this.customerService.getAllCustomers(),
      vendors: this.vendorService.getAllVendors(),
      admins: this.adminService.getAllAdmins()
    }).subscribe(({ customers, vendors, admins }) => {

      const mappedCustomers: User[] = customers.map((cust, i) => ({
        id: i + 1, // or cust.customerId if available and unique
        name: cust.fullName || 'Unnamed Customer',
        email: cust.emailAddress || '',
        role: 'customer',
        phone: cust.contactNumber || 0,
        status: cust.status || 'inactive',
        createdAt: new Date(cust.createdAt || new Date()),
        profilePicture: cust.profilePicturePath || 'assets/images/avatar-placeholder.svg'
      }));

      const mappedVendors: User[] = vendors.map((vendor, i) => ({
        id: i + 1000, // offset ID to avoid conflicts
        name: vendor.shopkeeperName || 'Unnamed Vendor',
        email: vendor.emailAddress || '',
        role: 'vendor',
        phone: vendor.contactNumber || 0,
        status: vendor.status || 'inactive',
        createdAt: new Date(vendor.createdAt || new Date()),
        profilePicture: vendor.profilePictureUrl || 'assets/images/avatar-placeholder.svg'
      }));

      const mappedAdmins: User[] = admins.map((admin, i) => ({
        id: i + 2000,
        name: admin.fullName || 'Unnamed Admin',
        email: admin.emailAddress || '',
        role: 'admin',
        phone: admin.contactNumber || 0,
        status: (admin.active) ? 'active' : 'inactive',
        createdAt: new Date(admin.createdAt || new Date()),
        profilePicture: admin.profilePicturePath || 'assets/images/avatar-placeholder.svg'
      }));

      // 🔀 Combine and shuffle all users
      const combinedUsers = [...mappedCustomers, ...mappedVendors, ...mappedAdmins];
      this.allUsers = this.shuffleArray(combinedUsers);
      this.filteredUsers = [...this.allUsers]; // Initially show all
      this.filterUsers(); // Apply any existing filters
    });
  }

  shuffleArray<T>(array: T[]): T[] {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }


  openModal(user: User) {
      console.log('View user:', user);
      // Trigger modal here
    }

    editUser(user: User) {
      console.log('Edit user:', user);
      // Navigate or open edit form/modal
    }

    deleteUser(user: User) {
      console.log('Delete user:', user);
      // Confirm and delete logic
    }

    // pagination logic
    updatePaginatedUsers(): void {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
    }

    get totalPages(): number {
      return Math.ceil(this.filteredUsers.length / this.pageSize);
    }

    goToPage(page: number) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.updatePaginatedUsers();
      }
    }
    

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.updatePaginatedUsers();
      }
    }

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.updatePaginatedUsers();
      }
    }

    getLastUserIndex(): number {
      return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
    }








    // filter dropdown
    // Component state
  isDropdownOpen: boolean = false;
  
  // Filter data
  // searchQuery: string = '';
  selectedRoles: string[] = [];
  selectedStatus: string[] = [];
  dateRange: DateRange = {
    from: '',
    to: ''
  };
  
  // Role options with counts
  roles: Role[] = [
    { value: 'admin', label: 'Administrator', count: 12 },
    { value: 'vendor', label: 'Vendor', count: 148 },
    { value: 'customer', label: 'Customer', count: 2847 }
  ];





  // dropdown methods
  // Computed properties
  get activeFiltersCount(): number {
    let count = 0;
    
    if (this.searchQuery.trim()) count++;
    if (this.selectedRoles.length > 0) count++;
    if (this.dateRange.from || this.dateRange.to) count++;
    if (this.selectedStatus.length > 0) count++;
    
    return count;
  }
  
  // Event emitters
  @Output() filtersChanged = new EventEmitter<FilterOptions>();
  @Output() dropdownToggled = new EventEmitter<boolean>();
  
  // RxJS subjects for cleanup and debouncing
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Dropdown control methods
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.dropdownToggled.emit(this.isDropdownOpen);
    
    if (this.isDropdownOpen) {
      // Focus first input when opened
      setTimeout(() => {
        const searchInput = this.elementRef.nativeElement.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  }
  
  closeDropdown(): void {
    this.isDropdownOpen = false;
    this.dropdownToggled.emit(false);
  }
  
  // Search methods
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }
  
  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
    
    // Focus back to search input
    const searchInput = this.elementRef.nativeElement.querySelector('.search-input');
    if (searchInput) {
      searchInput.focus();
    }
  }
  
  // Role selection methods
  onRoleChange(roleValue: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    
    if (target.checked) {
      if (!this.selectedRoles.includes(roleValue)) {
        this.selectedRoles.push(roleValue);
      }
    } else {
      this.selectedRoles = this.selectedRoles.filter(role => role !== roleValue);
    }
    
    this.emitFiltersChanged();
    this.addHapticFeedback();
  }
  
  // Date range methods
  onDateChange(): void {
    // Validate date range
    if (this.dateRange.from && this.dateRange.to) {
      const fromDate = new Date(this.dateRange.from);
      const toDate = new Date(this.dateRange.to);
      
      if (fromDate > toDate) {
        // Swap dates if from is greater than to
        const temp = this.dateRange.from;
        this.dateRange.from = this.dateRange.to;
        this.dateRange.to = temp;
      }
    }
    
    this.emitFiltersChanged();
  }
  
  // Status selection methods
  toggleStatus(statusValue: string): void {
    const index = this.selectedStatus.indexOf(statusValue);
    
    if (index > -1) {
      this.selectedStatus.splice(index, 1);
    } else {
      this.selectedStatus.push(statusValue);
    }
    
    this.emitFiltersChanged();
    this.addHapticFeedback();
  }
  
  // Filter management methods
  applyFilters(): void {
    this.emitFiltersChanged();
    this.closeDropdown();
    this.saveFiltersToSession();
    this.showToast('Filters applied successfully!', 'success');
  }
  
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedRoles = [];
    this.selectedStatus = [];
    this.dateRange = {
      from: '',
      to: ''
    };
    
    this.emitFiltersChanged();
    this.clearSavedFilters();
    this.showToast('Filters reset', 'info');
    this.addHapticFeedback();
  }
  
  // Private helper methods
  private emitFiltersChanged(): void {
    // const filters: FilterOptions = {
    //   searchQuery: this.searchQuery,
    //   selectedRoles: [...this.selectedRoles],
    //   dateRange: { ...this.dateRange },
    //   selectedStatus: [...this.selectedStatus]
    // };
    
    // this.filtersChanged.emit(filters);

    this.applyAllFilters(); 
  }
  
  private loadSavedFilters(): void {
    try {
      const savedFilters = sessionStorage.getItem('filterDropdownState');
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        
        this.searchQuery = parsedFilters.searchQuery || '';
        this.selectedRoles = parsedFilters.selectedRoles || [];
        this.selectedStatus = parsedFilters.selectedStatus || [];
        this.dateRange = parsedFilters.dateRange || { from: '', to: '' };
        
        // Emit initial filters if any are set
        if (this.activeFiltersCount > 0) {
          this.emitFiltersChanged();
        }
      }
    } catch (error) {
      console.warn('Could not load saved filters:', error);
    }
  }
  
  private saveFiltersToSession(): void {
    try {
      const filtersToSave: FilterOptions = {
        searchQuery: this.searchQuery,
        selectedRoles: this.selectedRoles,
        dateRange: this.dateRange,
        selectedStatus: this.selectedStatus
      };
      
      sessionStorage.setItem('filterDropdownState', JSON.stringify(filtersToSave));
    } catch (error) {
      console.warn('Could not save filters:', error);
    }
  }
  
  private clearSavedFilters(): void {
    try {
      sessionStorage.removeItem('filterDropdownState');
    } catch (error) {
      console.warn('Could not clear saved filters:', error);
    }
  }
  
  private addHapticFeedback(): void {
    // Add subtle haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }
  
  private showToast(message: string, type: 'success' | 'info' | 'warning' | 'error'): void {
    // Create and show a temporary toast notification
    const toast = document.createElement('div');
    toast.className = `filter-toast filter-toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'success' ? '#10b981' : 
                  type === 'info' ? '#3b82f6' :
                  type === 'warning' ? '#f59e0b' : '#ef4444',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: '9999',
      opacity: '0',
      transform: 'translateY(-20px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: 'Inter, sans-serif'
    });
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
  
  // Keyboard navigation and accessibility
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvents(event: KeyboardEvent): void {
    if (!this.isDropdownOpen) return;
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
        
      case 'Enter':
        if (event.target && (event.target as HTMLElement).classList.contains('search-input')) {
          event.preventDefault();
          // Focus first checkbox or button
          const firstCheckbox = this.elementRef.nativeElement.querySelector('.custom-checkbox');
          if (firstCheckbox) {
            firstCheckbox.focus();
          }
        }
        break;
        
      case 'Tab':
        // Let default tab behavior work, but ensure it stays within dropdown
        const focusableElements = this.elementRef.nativeElement.querySelectorAll(
          'input, button, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey && event.target === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && event.target === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
        break;
    }
  }
  
  // Click outside to close dropdown
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = this.elementRef.nativeElement;
    
    if (this.isDropdownOpen && !dropdown.contains(target)) {
      this.closeDropdown();
    }
  }
  
  // Utility methods for template
  getRoleLabel(roleValue: string): string {
    const role = this.roles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }
  
  getRoleCount(roleValue: string): number {
    const role = this.roles.find(r => r.value === roleValue);
    return role ? role.count : 0;
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
  
  // Validation methods
  isDateRangeValid(): boolean {
    if (!this.dateRange.from || !this.dateRange.to) return true;
    
    const fromDate = new Date(this.dateRange.from);
    const toDate = new Date(this.dateRange.to);
    
    return fromDate <= toDate;
  }
  
  // Animation triggers (can be used with Angular Animations)
  getDropdownAnimationState(): string {
    return this.isDropdownOpen ? 'open' : 'closed';
  }
  
  // Performance optimization - track by functions
  trackByRole(index: number, role: Role): string {
    return role.value;
  }
  
  trackByStatus(index: number, status: string): string {
    return status;
  }




  applyAllFilters(): void {
    const { searchQuery, selectedRoles, selectedStatus, dateRange } = this;

    let filtered = [...this.allUsers];

    // 🔍 Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.id.toString().includes(query) || 
        user.email.toLocaleLowerCase().includes(query) || 
        user.phone.toString().includes(query)
      );
    }

    // 🧑‍💼 Role filter
    if (selectedRoles.length > 0) {
      filtered = filtered.filter(user => selectedRoles.includes(user.role));
    }

    // ✅ Status filter
    if (selectedStatus.length > 0) {
      filtered = filtered.filter(user => selectedStatus.includes(user.status));
    }

    // 📅 Date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(user => {
        const loginDate = new Date(user.createdAt);
        const from = dateRange.from ? new Date(dateRange.from) : null;
        const to = dateRange.to ? new Date(dateRange.to) : null;

        return (!from || loginDate >= from) && (!to || loginDate <= to);
      });
    }

    this.filteredUsers = filtered;

    this.currentPage = 1; // reset page to 1
    this.updatePaginatedUsers();
  }



  headers = ['name', 'email', 'role'];
  rows = this.filteredUsers.map(user => [user.name, user.email, user.role]);

  // download csv
  exportToCSV() {
    const csvRows = [];

    // 1. Extract headers
    const headers = Object.keys(this.filteredUsers[0] || {}).join(',');
    csvRows.push(headers);

    // 2. Extract rows
    this.filteredUsers.forEach(user => {
      const values = Object.values(user).map(value =>
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      );
      csvRows.push(values.join(','));
    });

    // 3. Create CSV string
    const csvContent = csvRows.join('\n');

    // 4. Download as CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'fusers_data.csv');
    a.click();
    window.URL.revokeObjectURL(url);
  }


  // change status of the user
  onStatusChange(user: any, event: Event) {
    const target = event.target as HTMLInputElement;
    const isChecked = target.checked;
    const status = isChecked ? 'active' : 'inactive';
    const role = user.role.toLowerCase(); // "admin", "customer", "vendor"
    const id = user.id;

    let service;
    switch (role) {
      case 'admin':
        service = this.adminService;
        break;
      case 'customer':
        service = this.customerService;
        break;
      case 'vendor':
        service = this.vendorService;
        break;
      default:
        console.error('Unknown role');
        return;
    }

    (service.updateStatus(id, status === 'active') as any).subscribe({
      next: () => {
        alert(`${role} status updated.`);
        this.startFetchingUsers(); // Refresh users after status change
      },
      error: (err: any) => alert(err)
    });
  }

}
