import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponentComponent } from './components/home-page-component/home-page-component.component';
import { AuthRedirectComponent } from './components/authentication/auth-redirect/auth-redirect.component';
import { ProductListingPageComponentComponent } from './components/product-listing-page-component/product-listing-page-component.component';
import { CheckoutPageComponent } from './components/checkout-page/checkout-page.component';
import { ShoppingCartPageComponent } from './components/shopping-cart-page/shopping-cart-page.component';
import { OrderConfirmationPageComponentComponent } from './components/order-confirmation-page-component/order-confirmation-page-component.component';
import { AboutUsPageComponentComponent } from './components/about-us-page-component/about-us-page-component.component';
import { ContactUsPageComponentComponent } from './components/contact-us-page-component/contact-us-page-component.component';
import { TermsOfServiceAndPrivecyPolicyPagesComponent } from './components/terms-of-service-and-privecy-policy-pages/terms-of-service-and-privecy-policy-pages.component';
import { Error404PageNotFoundPageComponentComponent } from './components/error-404-page-not-found-page-component/error-404-page-not-found-page-component.component';
import { AdminAccountDashboardComponentComponent } from './components/dashbords/admin-account-dashboard-component/admin-account-dashboard-component.component';
import { VendorAccountDashboardComponentComponent } from './components/dashbords/vendor-account-dashboard-component/vendor-account-dashboard-component.component';
import { CustomerAccountDashboardComponentComponent } from './components/dashbords/customer-account-dashboard-component/customer-account-dashboard-component.component';
import { VendorProductsComponentComponent } from './components/children-components/vendor-products-component/vendor-products-component.component';
import { VendorProductSalesAndMoreComponent } from './components/children-components/vendor-product-sales-and-more/vendor-product-sales-and-more.component';
import { VendorAndShopInfoComponent } from './components/children-components/vendor-and-shop-info/vendor-and-shop-info.component';
import { AddNewProductComponentComponent } from './components/children-components/add-new-product-component/add-new-product-component.component';
import { AdminAddProductCategoryComponent } from './components/children-components/admin-add-product-category/admin-add-product-category.component';
import { AdminVendorsAndCustomersComponent } from './components/children-components/admin-vendors-and-customers/admin-vendors-and-customers.component';
import { ProductDeepDetailsPageComponentComponent } from './components/product-deep-details-page-component/product-deep-details-page-component.component';
import { CustomerInfoComponent } from './components/children-components/customer-info/customer-info.component';
import { CustomerInfoUpdateComponent } from './components/children-components/customer-info-update/customer-info-update.component';
import { CustomerCartComponent } from './components/children-components/customer-cart/customer-cart.component';
import { VendorProccessOrdersComponent } from './components/children-components/vendor-proccess-orders/vendor-proccess-orders.component';
import { ProductsComponentComponent } from './components/products-component/products-component.component';
import { DashboardComponentComponent } from './components/customer-components/dashboard-component/dashboard-component.component';
import { CustUpdateProfileDialComponent } from './components/dialogs/customer-dialogs/cust-update-profile-dial/cust-update-profile-dial.component';
import { WishlistPageComponent } from './components/wishlist-page/wishlist-page.component';
import { MainStarterComponent } from './components/main-starter/main-starter.component';
import { CustomerProfileComponent } from './components/children-components/customer-dashboard-compo/customer-profile/customer-profile.component';
import { CustomerNotificationsComponent } from './components/children-components/customer-dashboard-compo/customer-notifications/customer-notifications.component';
import { CustomerSupportComponent } from './components/children-components/customer-dashboard-compo/customer-support/customer-support.component';
import { CustomerWalletComponent } from './components/children-components/customer-dashboard-compo/customer-wallet/customer-wallet.component';
import { CustomerSettingsComponent } from './components/children-components/customer-dashboard-compo/customer-settings/customer-settings.component';
import { EmailPreferencesComponent } from './components/children-components/customer-dashboard-compo/email-preferences/email-preferences.component';
import { CustomerOrdersComponent } from './components/children-components/customer-dashboard-compo/customer-orders/customer-orders.component';
import { CustomerAddressesComponent } from './components/children-components/customer-dashboard-compo/customer-addresses/customer-addresses.component';
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
import { VendorDashboardDashboardComponent } from './components/children-components/vendor-dashboard-dashboard/vendor-dashboard-dashboard.component';
import { PromotionsAndSpecialOffersComponentComponent } from './components/promotions-and-special-offers-component/promotions-and-special-offers-component.component';
import { OrderTrackingPageComponent } from './components/order-tracking-page/order-tracking-page.component';
import { VendorShopPageComponent } from './components/vendor-shop-page/vendor-shop-page.component';
import { ComparePageComponent } from './components/compare-page/compare-page.component';
import { FaqPageComponent } from './components/faq-page/faq-page.component';
import { BlogPageComponent } from './components/blog-page/blog-page.component';
import { VendorDirectoryPageComponent } from './components/vendor-directory-page/vendor-directory-page.component';
import { CategoryLandingPageComponent } from './components/category-landing-page/category-landing-page.component';
import { OrderReturnsPageComponent } from './components/order-returns-page/order-returns-page.component';

// Import Guards
import { AuthGuard } from './project/guards/auth.guard';
import { RoleGuard } from './project/guards/role.guard';
import { VendorShoppingBlockGuard } from './project/guards/vendor-shopping-block.guard';

const routes: Routes = [
  {
    path:'', component: MainStarterComponent, children: [
      { path: '', component: HomePageComponentComponent },
      { path: 'products', component: ProductsComponentComponent, canActivate: [VendorShoppingBlockGuard] },
      { path: 'product_detail/:id', component: ProductDeepDetailsPageComponentComponent, canActivate: [VendorShoppingBlockGuard] },
      { path: 'contact_us', component: ContactUsPageComponentComponent }
    ]
  },
  {
    path:'home', component: MainStarterComponent
  },
  {
    path:'loadd', component: CustUpdateProfileDialComponent
  },
  {
    path:'customer-dashboard', 
    component: DashboardComponentComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['customer'] },
    children: [
      {
        path: '', component: CustomerProfileComponent
      },
      {
        path: 'cust-profile', component: CustomerProfileComponent
      },
      {
        path: 'cust-orders', component: CustomerOrdersComponent
      },
      {
        path: 'cust-support', component: CustomerSupportComponent
      },
      {
        path: 'cust-wallet', component: CustomerWalletComponent
      },
      {
        path: 'cust-notifications', component: CustomerNotificationsComponent
      },
      {
        path: 'cust-settings', component: CustomerSettingsComponent
      },
      {
        path: 'cust-addresses', component: CustomerAddressesComponent
      },
      {
        path: 'cust-email-preferences', component: EmailPreferencesComponent
      }
    ]
  },
  {
    path: 'vendor-dashboard', 
    component: VendorAccountDashboardComponentComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['vendor'] },
    children: [
      { 
        path: '', component: VendorDashboardDashboardComponent 
      },
      { 
        path: 'home', component: VendorDashboardDashboardComponent 
      },
      {
        path: 'vendor-products', component: VendorProductsComponentComponent
      },
      {
        path: 'add-new-product', component: AddNewProductComponentComponent
      },
      {
        path: 'vendor-and-shop-info', component: VendorAndShopInfoComponent
      },
      {
        path: 'vendor-products-sales', component: VendorProductSalesAndMoreComponent
      },
      {
        path: 'vendor-orders', component: VendorDashboardOrdersComponent
      },
      {
        path: 'vendor-analytics', component: VendorDashboardAnalyticsComponent
      },
      {
        path: 'vendor-feedback-and-review', component: VendorDashboardFeedackAndReviewComponent
      },
      {
        path: 'vendor-shop-settings', component: VendorAndShopInfoComponent
      },
      {
        path: 'vendor-earnings', component: VendorDashboardEarningsComponent
      },
      {
        path: 'vendor-inventory', component: VendorDashboardInventoryComponent
      },
      {
        path: 'vendor-messages', component: VendorDashboardMessagesComponent
      },
      {
        path: 'vendor-promotions', component: VendorDashboardPromotionsComponent
      },
      {
        path: 'vendor-returns', component: VendorDashboardReturnsComponent
      },
      {
        path: 'vendor-certifications', component: VendorDashboardCertificationsComponent
      },
      {
        path: 'vendor-store-settings', component: VendorDashboardStoreSettingsComponent
      },
      {
        path: 'vendor-verification', component: VendorDashboardVerificationComponent
      }
    ]
  },
  {
    path: 'login/:id', component: AuthRedirectComponent
  },
  {
    path: 'login', component: AuthRedirectComponent
  },
  {
    path: 'register/:id', component: AuthRedirectComponent
  },
  {
    path: 'register', component: AuthRedirectComponent
  },
  {
    path: 'product_detail/:id', component: ProductDeepDetailsPageComponentComponent, canActivate: [VendorShoppingBlockGuard]
  },
  {
    path: 'product_detail', component: ProductDeepDetailsPageComponentComponent, canActivate: [VendorShoppingBlockGuard]
  },
  {
    path: 'product_listing/:name', component: ProductListingPageComponentComponent, canActivate: [VendorShoppingBlockGuard]
  },
  {
    path: 'product_listing', component: ProductListingPageComponentComponent, canActivate: [VendorShoppingBlockGuard]
  },
  {
    path: 'checkout', 
    component: CheckoutPageComponent,
    canActivate: [AuthGuard, VendorShoppingBlockGuard]
  },
  {
    path: 'shopping_cart', 
    component: ShoppingCartPageComponent,
    canActivate: [AuthGuard, VendorShoppingBlockGuard]
  },
  {
    path: 'confirm_order/:id', component: OrderConfirmationPageComponentComponent
  },
  {
    path: 'about_us', component: AboutUsPageComponentComponent
  },
  {
    path: 'terms_and_service', component: TermsOfServiceAndPrivecyPolicyPagesComponent
  },
  {
    path: 'admin-dashboard', 
    component: AdminAccountDashboardComponentComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: '', component: AdminDashboardDashboardComponent
      },
      {
        path: 'admin-users', component: AdminDashboardUserManagementComponent
      },
      {
        path: 'admin-products', component: AdminDashboardProductsComponent
      },
      {
        path: 'admin-orders', component: AdminDashboardOrdersComponent
      },
      {
        path: 'admin-feedback', component: AdminDashboardFeedbackAndReviewsComponent
      },
      {
        path: 'admin-analytics', component: AdminDashboardAnalyticsComponent
      },
      {
        path: 'admin-cms', component: AdminDashboardCmsComponent
      },
      {
        path: 'admin-settings', component: AdminDashboardSettingsComponent
      },
      {
        path: 'admin_add_product_category', component: AdminAddProductCategoryComponent
      },
      {
        path: 'admin_vendors_and_customers', component: AdminVendorsAndCustomersComponent
      }
    ]
  },
  // Redirect underscore routes to hyphenated routes for consistency
  {
    path: 'customer_dashboard',
    redirectTo: 'customer-dashboard',
    pathMatch: 'prefix'
  },
  {
    path: 'vendor_dashboard',
    redirectTo: 'vendor-dashboard',
    pathMatch: 'prefix'
  },
  {
    path: 'support', component: MainSupportPageComponent
  },
  {
    path: 'seller-support', component: SellerSupportPageComponent
  },
  {
    path: 'buyer-support', component: BuyerSupportPageComponent
  },
  {
    path: 'shipping-info', component: ShippingInfoComponent
  },
  {
    path: 'returns-and-refunds', component: ReturnsAndRefundComponent
  },
  {
    path: 'privacy-policy', component: PrivacyPolicyComponent
  },
  {
    path: 'faq', component: FaqPageComponent
  },
  {
    path: 'blog', component: BlogPageComponent
  },
  {
    path: 'vendors', component: VendorDirectoryPageComponent
  },
  {
    path: 'category/:slug', component: CategoryLandingPageComponent
  },
  {
    path: 'returns', component: OrderReturnsPageComponent
  },
  {
    path: 'promotions', component: PromotionsAndSpecialOffersComponentComponent
  },  {
    path: 'compare', component: ComparePageComponent
  },
    {
    path: 'shop/:vendorId', component: VendorShopPageComponent
  },
    {
    path: 'track-order', component: OrderTrackingPageComponent
  },
  {
    path: 'track-order/:orderId', component: OrderTrackingPageComponent
  },
  {
    path: 'wishlist',
    component: WishlistPageComponent,
    canActivate: [AuthGuard, VendorShoppingBlockGuard]
  },
  
  // Lazy-loaded feature modules
  {
    path: 'artisan-stories',
    loadChildren: () => import('./components/artisan-stories/artisan-stories.module').then(m => m.ArtisanStoriesModule),
    data: { title: 'Artisan Stories - ODOP' }
  },
  {
    path: 'festivals',
    loadChildren: () => import('./components/festivals/festivals.module').then(m => m.FestivalsModule),
    data: { title: 'Festivals & Celebrations - ODOP' }
  },
  {
    path: 'government-schemes',
    loadChildren: () => import('./components/government-schemes/government-schemes.module').then(m => m.GovernmentSchemesModule),
    data: { title: 'Government Schemes - ODOP' }
  },
  {
    path: 'district-map',
    loadChildren: () => import('./components/district-map/district-map.module').then(m => m.DistrictMapModule),
    data: { title: 'Explore Districts - ODOP' }
  },
  {
    path: 'reports',
    loadChildren: () => import('./components/reports/reports.module').then(m => m.ReportsModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'vendor'], title: 'Reports Dashboard - ODOP' }
  },
  {
    path: 'bulk-upload',
    loadChildren: () => import('./components/bulk-upload/bulk-upload.module').then(m => m.BulkUploadModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'vendor'], title: 'Bulk Upload - ODOP' }
  },
  {
    path: 'craft-categories',
    loadChildren: () => import('./components/craft-categories/craft-categories.module').then(m => m.CraftCategoriesModule),
    data: { title: 'Craft Categories - ODOP' }
  },
  {
    path: 'my-returns',
    loadChildren: () => import('./components/returns/returns.module').then(m => m.ReturnsModule),
    canActivate: [AuthGuard],
    data: { title: 'Returns & Refunds - ODOP' }
  },

  {
    path: '**', component: Error404PageNotFoundPageComponentComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }















