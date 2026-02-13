import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';

import { HttpErrorInterceptor } from './project/interceptors/http-error.interceptor';
import { AuthInterceptor } from './project/interceptors/auth.interceptor';
import { ErrorHandlingService } from './project/services/error-handling.service';
import { LoadingService } from './project/services/loading.service';
import { DataHandlerService } from './project/services/data-handler.service';

// Angular Material Modules
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomePageComponentComponent } from './components/home-page-component/home-page-component.component';
import { ProductListingPageComponentComponent } from './components/product-listing-page-component/product-listing-page-component.component';
import { ShoppingCartPageComponent } from './components/shopping-cart-page/shopping-cart-page.component';
import { CheckoutPageComponent } from './components/checkout-page/checkout-page.component';
import { OrderConfirmationPageComponentComponent } from './components/order-confirmation-page-component/order-confirmation-page-component.component';
import { CustomerAccountDashboardComponentComponent } from './components/dashbords/customer-account-dashboard-component/customer-account-dashboard-component.component';
import { VendorAccountDashboardComponentComponent } from './components/dashbords/vendor-account-dashboard-component/vendor-account-dashboard-component.component';
import { AdminAccountDashboardComponentComponent } from './components/dashbords/admin-account-dashboard-component/admin-account-dashboard-component.component';
import { AuthRedirectComponent } from './components/authentication/auth-redirect/auth-redirect.component';
import { AboutUsPageComponentComponent } from './components/about-us-page-component/about-us-page-component.component';
import { ContactUsPageComponentComponent } from './components/contact-us-page-component/contact-us-page-component.component';
import { TermsOfServiceAndPrivecyPolicyPagesComponent } from './components/terms-of-service-and-privecy-policy-pages/terms-of-service-and-privecy-policy-pages.component';
import { Error404PageNotFoundPageComponentComponent } from './components/error-404-page-not-found-page-component/error-404-page-not-found-page-component.component';
import { PromotionsAndSpecialOffersComponentComponent } from './components/promotions-and-special-offers-component/promotions-and-special-offers-component.component';
import { AccountSettingsPageComponentComponent } from './components/account-settings-page-component/account-settings-page-component.component';
import { VendorProductsComponentComponent } from './components/children-components/vendor-products-component/vendor-products-component.component';
import { AddNewProductComponentComponent } from './components/children-components/add-new-product-component/add-new-product-component.component';
import { VendorProductSalesAndMoreComponent } from './components/children-components/vendor-product-sales-and-more/vendor-product-sales-and-more.component';
import { VendorAndShopInfoComponent } from './components/children-components/vendor-and-shop-info/vendor-and-shop-info.component';
import { AdminAddProductCategoryComponent } from './components/children-components/admin-add-product-category/admin-add-product-category.component';
import { AdminVendorsAndCustomersComponent } from './components/children-components/admin-vendors-and-customers/admin-vendors-and-customers.component';
import { ProductDeepDetailsPageComponentComponent } from './components/product-deep-details-page-component/product-deep-details-page-component.component';
import { CustomerInfoComponent } from './components/children-components/customer-info/customer-info.component';
import { CustomerInfoUpdateComponent } from './components/children-components/customer-info-update/customer-info-update.component';
import { CustomerCartComponent } from './components/children-components/customer-cart/customer-cart.component';
import { CustomerOrdersComponent } from './components/children-components/customer-dashboard-compo/customer-orders/customer-orders.component';
import { VendorProccessOrdersComponent } from './components/children-components/vendor-proccess-orders/vendor-proccess-orders.component';
import { FooterComponentComponent } from './components/footer-component/footer-component.component';
import { RegisterDialogComponent } from './components/dialogs/register-dialog/register-dialog.component';
import { LoginDialogComponent } from './components/dialogs/login-dialog/login-dialog.component';
import { ProductsComponentComponent } from './components/products-component/products-component.component';
import { DashboardComponentComponent } from './components/customer-components/dashboard-component/dashboard-component.component';
import { CustUpdateProfileDialComponent } from './components/dialogs/customer-dialogs/cust-update-profile-dial/cust-update-profile-dial.component';
import { MainStarterComponent } from './components/main-starter/main-starter.component';
import { CustomerProfileComponent } from './components/children-components/customer-dashboard-compo/customer-profile/customer-profile.component';
import { CustomerSupportComponent } from './components/children-components/customer-dashboard-compo/customer-support/customer-support.component';
import { CustomerWalletComponent } from './components/children-components/customer-dashboard-compo/customer-wallet/customer-wallet.component';
import { CustomerNotificationsComponent } from './components/children-components/customer-dashboard-compo/customer-notifications/customer-notifications.component';
import { CustomerSettingsComponent } from './components/children-components/customer-dashboard-compo/customer-settings/customer-settings.component';
import { LogoutDialogForEveryoneComponent } from './components/dialogs/logout-dialog-for-everyone/logout-dialog-for-everyone.component';
import { ChangePasswordForEveryoneComponent } from './components/dialogs/change-password-for-everyone/change-password-for-everyone.component';
import { VendorDashboardManageProductsComponent } from './components/children-components/vendor-dashboard-manage-products/vendor-dashboard-manage-products.component';
import { VendorDashboardOrdersComponent } from './components/children-components/vendor-dashboard-orders/vendor-dashboard-orders.component';
import { VendorDashboardAnalyticsComponent } from './components/children-components/vendor-dashboard-analytics/vendor-dashboard-analytics.component';
import { VendorDashboardFeedackAndReviewComponent } from './components/children-components/vendor-dashboard-feedack-and-review/vendor-dashboard-feedack-and-review.component';
import { VendorDashboardEarningsComponent } from './components/children-components/vendor-dashboard-earnings/vendor-dashboard-earnings.component';
import { VendorDashboardInventoryComponent } from './components/children-components/vendor-dashboard-inventory/vendor-dashboard-inventory.component';
import { VendorDashboardMessagesComponent } from './components/children-components/vendor-dashboard-messages/vendor-dashboard-messages.component';
import { VendorDashboardPromotionsComponent } from './components/children-components/vendor-dashboard-promotions/vendor-dashboard-promotions.component';
import { VendorDashboardReturnsComponent } from './components/children-components/vendor-dashboard-returns/vendor-dashboard-returns.component';
import { VendorDashboardCertificationsComponent } from './components/children-components/vendor-dashboard-certifications/vendor-dashboard-certifications.component';
import { VendorDashboardStoreSettingsComponent } from './components/children-components/vendor-dashboard-store-settings/vendor-dashboard-store-settings.component';
import { VendorDashboardVerificationComponent } from './components/children-components/vendor-dashboard-verification/vendor-dashboard-verification.component';
import { VendorOnboardingComponent } from './components/children-components/vendor-onboarding/vendor-onboarding.component';
import { AdminDashboardUserManagementComponent } from './components/children-components/admin-dashboard-user-management/admin-dashboard-user-management.component';
import { AdminDashboardProductsComponent } from './components/children-components/admin-dashboard-products/admin-dashboard-products.component';
import { AdminDashboardOrdersComponent } from './components/children-components/admin-dashboard-orders/admin-dashboard-orders.component';
import { AdminDashboardFeedbackAndReviewsComponent } from './components/children-components/admin-dashboard-feedback-and-reviews/admin-dashboard-feedback-and-reviews.component';
import { AdminDashboardAnalyticsComponent } from './components/children-components/admin-dashboard-analytics/admin-dashboard-analytics.component';
import { AdminDashboardCmsComponent } from './components/children-components/admin-dashboard-cms/admin-dashboard-cms.component';
import { AdminDashboardSettingsComponent } from './components/children-components/admin-dashboard-settings/admin-dashboard-settings.component';
import { MainSupportPageComponent } from './components/support-pages/main-support-page/main-support-page.component';
import { SellerSupportPageComponent } from './components/support-pages/seller-support-page/seller-support-page.component';
import { BuyerSupportPageComponent } from './components/support-pages/buyer-support-page/buyer-support-page.component';
import { ShippingInfoComponent } from './components/support-pages/shipping-info/shipping-info.component';
import { ReturnsAndRefundComponent } from './components/support-pages/returns-and-refund/returns-and-refund.component';
import { PrivacyPolicyComponent } from './components/support-pages/privacy-policy/privacy-policy.component';
import { AdminDashboardDashboardComponent } from './components/children-components/admin-dashboard-dashboard/admin-dashboard-dashboard.component';
import { WishlistDialogComponent } from './components/dialogs/wishlist-dialog/wishlist-dialog.component';
import { CartDialogComponent } from './components/dialogs/cart-dialog/cart-dialog.component';
import { UpdateCustomerProfileDialogComponent } from './components/dialogs/update-customer-profile-dialog/update-customer-profile-dialog.component';
import { VendorDashboardDashboardComponent } from './components/children-components/vendor-dashboard-dashboard/vendor-dashboard-dashboard.component';
import { VendorUpdateProfileDialogComponent } from './components/dialogs/vendor-update-profile-dialog/vendor-update-profile-dialog.component';
import { AdminUpdateProfileDialogComponent } from './components/dialogs/admin-update-profile-dialog/admin-update-profile-dialog.component';
import { PremiumMembershipDialogComponent } from './components/dialogs/premium-membership-dialog/premium-membership-dialog.component';
import { CustomerAnalyticsDialogComponent } from './components/dialogs/customer-analytics-dialog/customer-analytics-dialog.component';
import { OrderDetailsDialogComponent } from './components/dialogs/order-details-dialog/order-details-dialog.component';
import { CancelOrderDialogComponent } from './components/dialogs/cancel-order-dialog/cancel-order-dialog.component';
import { AddMoneyDialogComponent } from './components/dialogs/add-money-dialog/add-money-dialog.component';
import { WithdrawFundsDialogComponent } from './components/dialogs/withdraw-funds-dialog/withdraw-funds-dialog.component';
import { ApplyVoucherDialogComponent } from './components/dialogs/apply-voucher-dialog/apply-voucher-dialog.component';
import { ViewOffersDialogComponent } from './components/dialogs/view-offers-dialog/view-offers-dialog.component';
import { WishlistPageComponent } from './components/wishlist-page/wishlist-page.component';
import { OrderTrackingPageComponent } from './components/order-tracking-page/order-tracking-page.component';
import { VendorShopPageComponent } from './components/vendor-shop-page/vendor-shop-page.component';
import { ComparePageComponent } from './components/compare-page/compare-page.component';
import { RecentlyViewedComponent } from './components/recently-viewed/recently-viewed.component';
import { SkeletonLoaderComponent } from './components/shared/skeleton-loader/skeleton-loader.component';
import { FaqPageComponent } from './components/faq-page/faq-page.component';
import { BlogPageComponent } from './components/blog-page/blog-page.component';
import { VendorDirectoryPageComponent } from './components/vendor-directory-page/vendor-directory-page.component';
import { CategoryLandingPageComponent } from './components/category-landing-page/category-landing-page.component';
import { OrderReturnsPageComponent } from './components/order-returns-page/order-returns-page.component';
import { SessionWarningDialogComponent } from './components/dialogs/session-warning-dialog/session-warning-dialog.component';
import { CustomerAddressesComponent } from './components/children-components/customer-dashboard-compo/customer-addresses/customer-addresses.component';
import { LiveChatWidgetComponent } from './components/live-chat-widget/live-chat-widget.component';
import { EmailPreferencesComponent } from './components/children-components/customer-dashboard-compo/email-preferences/email-preferences.component';
import { VendorReviewsComponent } from './components/vendor-reviews/vendor-reviews.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { QuickViewDialogComponent } from './components/dialogs/quick-view-dialog/quick-view-dialog.component';
import { VendorDiscoveryCardComponent } from './components/shared/vendor-discovery-card/vendor-discovery-card.component';
import { CompareDialogComponent } from './components/dialogs/compare-dialog/compare-dialog.component';
import { CompareSelectDialogComponent } from './components/dialogs/compare-select-dialog/compare-select-dialog.component';
import { SafeUrlPipe } from './project/pipes/safe-url.pipe';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    HttpClientModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDividerModule,
    MatProgressBarModule,
    BrowserAnimationsModule,
    LiveChatWidgetComponent,
    SafeUrlPipe,
    AppComponent,
    HomePageComponentComponent,
    ProductListingPageComponentComponent,
    ShoppingCartPageComponent,
    CheckoutPageComponent,
    OrderConfirmationPageComponentComponent,
    CustomerAccountDashboardComponentComponent,
    VendorAccountDashboardComponentComponent,
    AdminAccountDashboardComponentComponent,
    AuthRedirectComponent,
    AboutUsPageComponentComponent,
    ContactUsPageComponentComponent,
    TermsOfServiceAndPrivecyPolicyPagesComponent,
    Error404PageNotFoundPageComponentComponent,
    PromotionsAndSpecialOffersComponentComponent,
    AccountSettingsPageComponentComponent,
    VendorProductsComponentComponent,
    AddNewProductComponentComponent,
    VendorProductSalesAndMoreComponent,
    VendorAndShopInfoComponent,
    AdminAddProductCategoryComponent,
    AdminVendorsAndCustomersComponent,
    ProductDeepDetailsPageComponentComponent,
    CustomerInfoComponent,
    CustomerInfoUpdateComponent,
    CustomerCartComponent,
    CustomerOrdersComponent,
    VendorProccessOrdersComponent,
    FooterComponentComponent,
    RegisterDialogComponent,
    LoginDialogComponent,
    ProductsComponentComponent,
    DashboardComponentComponent,
    CustUpdateProfileDialComponent,
    MainStarterComponent,
    CustomerProfileComponent,
    CustomerSupportComponent,
    CustomerWalletComponent,
    CustomerNotificationsComponent,
    CustomerSettingsComponent,
    LogoutDialogForEveryoneComponent,
    ChangePasswordForEveryoneComponent,
    VendorDashboardManageProductsComponent,
    VendorDashboardOrdersComponent,
    VendorDashboardAnalyticsComponent,
    VendorDashboardFeedackAndReviewComponent,
    VendorDashboardEarningsComponent,
    VendorDashboardInventoryComponent,
    VendorDashboardMessagesComponent,
    VendorDashboardPromotionsComponent,
    VendorDashboardReturnsComponent,
    VendorDashboardCertificationsComponent,
    VendorDashboardStoreSettingsComponent,
    VendorDashboardVerificationComponent,
    VendorOnboardingComponent,
    AdminDashboardUserManagementComponent,
    AdminDashboardProductsComponent,
    AdminDashboardOrdersComponent,
    AdminDashboardFeedbackAndReviewsComponent,
    AdminDashboardAnalyticsComponent,
    AdminDashboardCmsComponent,
    AdminDashboardSettingsComponent,
    MainSupportPageComponent,
    SellerSupportPageComponent,
    BuyerSupportPageComponent,
    ShippingInfoComponent,
    ReturnsAndRefundComponent,
    PrivacyPolicyComponent,
    AdminDashboardDashboardComponent,
    WishlistDialogComponent,
    CartDialogComponent,
    UpdateCustomerProfileDialogComponent,
    VendorDashboardDashboardComponent,
    VendorUpdateProfileDialogComponent,
    AdminUpdateProfileDialogComponent,
    PremiumMembershipDialogComponent,
    CustomerAnalyticsDialogComponent,
    OrderDetailsDialogComponent,
    CancelOrderDialogComponent,
    AddMoneyDialogComponent,
    WithdrawFundsDialogComponent,
    ApplyVoucherDialogComponent,
    ViewOffersDialogComponent,
    WishlistPageComponent,
    OrderTrackingPageComponent,
    VendorShopPageComponent,
    ComparePageComponent,
    RecentlyViewedComponent,
    SkeletonLoaderComponent,
    FaqPageComponent,
    BlogPageComponent,
    VendorDirectoryPageComponent,
    CategoryLandingPageComponent,
    OrderReturnsPageComponent,
    SessionWarningDialogComponent,
    CustomerAddressesComponent,
    EmailPreferencesComponent,
    VendorReviewsComponent,
    ThemeToggleComponent,
    QuickViewDialogComponent,
    VendorDiscoveryCardComponent,
    CompareDialogComponent,
    CompareSelectDialogComponent
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },
    ErrorHandlingService,
    LoadingService,
    DataHandlerService
  ],
  // No bootstrap array for standalone components
})
export class AppModule { }
