import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize, forkJoin } from 'rxjs';
import { ReturnService, ReturnRequest as APIReturnRequest, ReturnSummary } from '../../../services/return.service';
import { UserStateService } from '../../../project/services/user-state.service';

interface ReturnRequest {
  id: string;
  returnId: string;
  orderId: string;
  productName: string;
  productImage: string;
  customerName: string;
  requestDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'in-transit' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'IN_TRANSIT';
  refundAmount: number;
  refundMethod: string;
}

interface ReturnReason {
  reason: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-vendor-dashboard-returns',
  templateUrl: './vendor-dashboard-returns.component.html',
  styleUrls: ['./vendor-dashboard-returns.component.css']
})
export class VendorDashboardReturnsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private vendorId: string = '';

  returnRequests: ReturnRequest[] = [];
  returnReasons: ReturnReason[] = [];

  // Stats from API
  totalReturns: number = 0;
  pendingReturns: number = 0;
  returnRate: number = 0;
  avgProcessingTime: string = 'N/A';

  // Loading and error states
  isLoading: boolean = false;
  loadError: string | null = null;

  filterStatus: string = 'all';
  searchQuery: string = '';

  constructor(
    private returnService: ReturnService,
    private userStateService: UserStateService
  ) { }

  ngOnInit(): void {
    // Get vendor ID from user state
    const currentVendor = this.userStateService.vendor;
    if (currentVendor?.vendorId) {
      this.vendorId = currentVendor.vendorId;
    } else {
      // Fallback to localStorage
      const storedVendor = localStorage.getItem('vendor');
      if (storedVendor) {
        try {
          const vendor = JSON.parse(storedVendor);
          this.vendorId = vendor.vendorId || '';
        } catch (e) {
          this.vendorId = localStorage.getItem('vendorId') || '';
        }
      }
    }

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    if (!this.vendorId) {
      this.loadError = 'No vendor ID found. Please login again.';
      return;
    }

    this.isLoading = true;
    this.loadError = null;

    // Load returns and summary in parallel
    forkJoin({
      returns: this.returnService.getVendorReturns(0, 100),
      summary: this.returnService.getVendorSummary()
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ returns, summary }) => {
        // Map API returns to component format
        if (returns.success && returns.returns) {
          this.returnRequests = this.mapReturnsFromAPI(returns.returns);
          this.calculateReturnReasons();
        }

        // Map summary stats
        if (summary.success && summary.summary) {
          this.mapSummaryFromAPI(summary.summary);
        }
      },
      error: (error) => {
        console.error('Error loading returns:', error);
        this.loadError = error.error?.message || 'Failed to load return requests. Please try again.';
      }
    });
  }

  private mapReturnsFromAPI(apiReturns: APIReturnRequest[]): ReturnRequest[] {
    return apiReturns.map(r => ({
      id: r.returnId || r.id,
      returnId: r.returnId,
      orderId: r.orderId,
      productName: r.productName || 'Unknown Product',
      productImage: r.productImage || 'assets/products/placeholder.jpg',
      customerName: r.customerName || 'Unknown Customer',
      requestDate: new Date(r.createdAt),
      reason: r.reason || r.reasonDetails || 'No reason provided',
      status: this.normalizeStatus(r.status) as any,
      refundAmount: r.returnAmount || r.itemPrice || 0,
      refundMethod: r.refundDetails?.refundMethod || 'Original Payment Method'
    }));
  }

  private normalizeStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'pending',
      'APPROVED': 'approved',
      'REJECTED': 'rejected',
      'COMPLETED': 'completed',
      'IN_TRANSIT': 'in-transit',
      'PROCESSING': 'approved',
      'REFUNDED': 'completed'
    };
    return statusMap[status?.toUpperCase()] || status?.toLowerCase() || 'pending';
  }

  private mapSummaryFromAPI(summary: ReturnSummary): void {
    this.totalReturns = summary.totalReturns || 0;
    this.pendingReturns = summary.pendingReturns || 0;
    // Calculate return rate if we have order data
    // For now, we'll keep the calculation simple
    this.returnRate = this.totalReturns > 0 ? Math.round((summary.pendingReturns / this.totalReturns) * 100 * 10) / 10 : 0;
    this.avgProcessingTime = this.totalReturns > 0 ? '2-3 days' : 'N/A';
  }

  private calculateReturnReasons(): void {
    const reasonCounts: { [key: string]: number } = {};
    
    this.returnRequests.forEach(r => {
      const reason = r.reason;
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    const total = this.returnRequests.length;
    this.returnReasons = Object.entries(reasonCounts).map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  }

  refreshData(): void {
    this.loadData();
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'pending': return 'fa-clock';
      case 'approved': return 'fa-check-circle';
      case 'rejected': return 'fa-times-circle';
      case 'completed': return 'fa-check-double';
      case 'in-transit': return 'fa-truck';
      default: return 'fa-circle';
    }
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getDaysAgo(date: Date): number {
    const diff = Date.now() - date.getTime();
    return Math.floor(diff / (24 * 3600000));
  }

  get filteredReturns(): ReturnRequest[] {
    let result = this.returnRequests;
    
    if (this.filterStatus !== 'all') {
      result = result.filter(r => r.status === this.filterStatus);
    }
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(r => 
        r.id.toLowerCase().includes(query) ||
        r.orderId.toLowerCase().includes(query) ||
        r.productName.toLowerCase().includes(query) ||
        r.customerName.toLowerCase().includes(query)
      );
    }
    
    return result;
  }

  approveReturn(request: ReturnRequest): void {
    const returnId = request.returnId || request.id;
    this.returnService.approveReturn(returnId, 'Approved by vendor').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          request.status = 'approved';
        }
      },
      error: (error) => {
        console.error('Error approving return:', error);
        alert('Failed to approve return. Please try again.');
      }
    });
  }

  rejectReturn(request: ReturnRequest): void {
    const returnId = request.returnId || request.id;
    const reason = prompt('Please provide a reason for rejection:');
    
    if (!reason) {
      return;
    }

    this.returnService.rejectReturn(returnId, reason).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          request.status = 'rejected';
        }
      },
      error: (error) => {
        console.error('Error rejecting return:', error);
        alert('Failed to reject return. Please try again.');
      }
    });
  }

  viewDetails(request: ReturnRequest): void {
    const returnId = request.returnId || request.id;
    this.returnService.getReturn(returnId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (returnData) => {
        console.log('Return details:', returnData);
        // You can open a modal here to show details
      },
      error: (error) => {
        console.error('Error fetching return details:', error);
      }
    });
  }

  processRefund(request: ReturnRequest): void {
    const returnId = request.returnId || request.id;
    console.log('Process refund for:', returnId);
    // Refund processing would typically be handled by admin
    // This could open a modal for vendor to confirm refund details
  }
}
