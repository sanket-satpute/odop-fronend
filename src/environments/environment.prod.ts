// Production environment configuration
export const environment = {
  production: true,
  apiBaseUrl: 'https://odop-backend.onrender.com/odop/',
  apiUrl: 'https://odop-backend.onrender.com',  // Base API URL without path
  authUrl: 'https://odop-backend.onrender.com/authenticate',
  
  // Feature flags
  enableDebugMode: false,
  enableMockData: false,
  
  // ==================== OAuth Configuration ====================
  // IMPORTANT: Replace with PRODUCTION OAuth credentials
  // These should be different from development credentials
  // and configured for the production domain
  //
  // Google OAuth:
  // - Authorized JavaScript origins: https://odop-marketplace.gov.in
  // - Authorized redirect URIs: https://odop-marketplace.gov.in/auth/callback
  //
  // Facebook OAuth:
  // - Valid OAuth Redirect URIs: https://odop-marketplace.gov.in
  // ================================================================
  
  googleClientId: 'YOUR_PROD_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  facebookAppId: 'YOUR_PROD_FACEBOOK_APP_ID',
  
  // Web Push Configuration (Use production VAPID keys)
  vapidPublicKey: 'YOUR_PROD_VAPID_PUBLIC_KEY',
  
  // API Endpoints
  endpoints: {
    customer: 'customer',
    vendor: 'vendor',
    admin: 'admin',
    product: 'product',
    cart: 'cart',
    order: 'order',
    category: 'category',
    contact: 'contact'
  },
  
  // App Configuration
  appName: 'ODOP Marketplace',
  appVersion: '1.0.0',
  
  // Pagination defaults
  defaultPageSize: 10,
  maxPageSize: 100,
  
  // Session timeout (in milliseconds)
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  
  // Image upload limits
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Cache settings
  cacheTimeout: 5 * 60 * 1000 // 5 minutes
};
