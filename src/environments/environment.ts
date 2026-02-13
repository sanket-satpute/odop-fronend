// Development environment configuration
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:50982/odop/',
  apiUrl: 'http://localhost:50982',  // Base API URL without path
  authUrl: 'http://localhost:50982/authenticate',
  
  // Feature flags
  enableDebugMode: true,
  enableMockData: false,
  
  // ==================== OAuth Configuration ====================
  // INSTRUCTIONS: Replace these values with your actual OAuth credentials
  //
  // Google OAuth:
  // 1. Go to https://console.cloud.google.com/apis/credentials
  // 2. Create a new OAuth 2.0 Client ID (Web application)
  // 3. Add authorized JavaScript origins: http://localhost:4200
  // 4. Add authorized redirect URIs: http://localhost:4200/auth/callback
  // 5. Copy the Client ID below
  //
  // Facebook OAuth:
  // 1. Go to https://developers.facebook.com/apps
  // 2. Create a new app or use existing
  // 3. Add Facebook Login product
  // 4. Add http://localhost:4200 to Valid OAuth Redirect URIs
  // 5. Copy the App ID below
  //
  // VAPID Keys (for Push Notifications):
  // 1. Generate using: npx web-push generate-vapid-keys
  // 2. Or use online generator at https://vapidkeys.com/
  // 3. Copy the Public Key below (Private key goes to backend)
  // ================================================================
  
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  facebookAppId: 'YOUR_FACEBOOK_APP_ID',
  
  // Web Push Configuration
  vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY',
  
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
  appVersion: '1.0.0-dev',
  
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
