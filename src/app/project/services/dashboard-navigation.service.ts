import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, pairwise } from 'rxjs/operators';
import { Location } from '@angular/common';

/**
 * Service to manage dashboard navigation behavior.
 * When user enters any dashboard and navigates through sidebar items,
 * pressing browser back button will exit the entire dashboard
 * instead of cycling through child routes.
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardNavigationService {
  
  // The URL to return to when exiting dashboards
  private exitUrl: string = '/';
  
  // Track if we're currently inside a dashboard
  private insideDashboard: boolean = false;
  
  // Dashboard path patterns
  private dashboardPatterns = [
    '/customer-dashboard',
    '/vendor-dashboard',
    '/admin-dashboard'
  ];
  
  // Previous URL tracking
  private previousUrl: string = '/';
  private currentUrl: string = '/';
  
  constructor(
    private router: Router,
    private location: Location
  ) {
    this.initializeNavigationTracking();
  }
  
  /**
   * Initialize navigation tracking to capture the URL before entering dashboards
   */
  private initializeNavigationTracking(): void {
    // Track URL changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.previousUrl = this.currentUrl;
      this.currentUrl = event.urlAfterRedirects || event.url;
      
      const wasInDashboard = this.isDashboardUrl(this.previousUrl);
      const nowInDashboard = this.isDashboardUrl(this.currentUrl);
      
      // User just entered a dashboard from outside
      if (!wasInDashboard && nowInDashboard) {
        this.exitUrl = this.previousUrl || '/';
        this.insideDashboard = true;
      }
      
      // User exited dashboard
      if (wasInDashboard && !nowInDashboard) {
        this.insideDashboard = false;
      }
    });
  }
  
  /**
   * Check if a URL belongs to any dashboard
   */
  private isDashboardUrl(url: string): boolean {
    return this.dashboardPatterns.some(pattern => url.startsWith(pattern));
  }
  
  /**
   * Get the URL to navigate to when exiting the dashboard
   */
  getExitUrl(): string {
    return this.exitUrl || '/';
  }
  
  /**
   * Set custom exit URL (can be called when entering dashboard)
   */
  setExitUrl(url: string): void {
    if (!this.isDashboardUrl(url)) {
      this.exitUrl = url;
    }
  }
  
  /**
   * Check if currently inside any dashboard
   */
  isInsideDashboard(): boolean {
    return this.insideDashboard;
  }
  
  /**
   * Exit the current dashboard and go back to the previous non-dashboard page
   */
  exitDashboard(): void {
    this.router.navigateByUrl(this.exitUrl);
  }
  
  /**
   * Handle browser back button press when inside dashboard.
   * Call this from dashboard component's popstate listener.
   * Returns true if the event was handled (should prevent default).
   */
  handleBackNavigation(): boolean {
    if (this.insideDashboard) {
      // Navigate to exit URL
      this.router.navigateByUrl(this.exitUrl, { replaceUrl: true });
      return true;
    }
    return false;
  }
  
  /**
   * Navigate within dashboard using replaceUrl to prevent history stacking
   */
  navigateWithinDashboard(dashboardBase: string, childRoute: string): void {
    // Use replaceUrl so browser back exits the dashboard entirely
    if (childRoute.startsWith('/')) {
      this.router.navigate([childRoute], { replaceUrl: true });
    } else {
      this.router.navigate([dashboardBase, childRoute], { replaceUrl: true });
    }
  }
  
  /**
   * Get current dashboard type
   */
  getCurrentDashboardType(): 'customer' | 'vendor' | 'admin' | null {
    if (this.currentUrl.startsWith('/customer-dashboard')) return 'customer';
    if (this.currentUrl.startsWith('/vendor-dashboard')) return 'vendor';
    if (this.currentUrl.startsWith('/admin-dashboard')) return 'admin';
    return null;
  }
}
