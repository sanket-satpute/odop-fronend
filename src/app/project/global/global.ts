import { environment } from '../../../environments/environment';

export const GlobalVariable = Object.freeze({
    BASE_API_URL: environment.apiBaseUrl,
    AUTH_URL: environment.authUrl,
    IS_PRODUCTION: environment.production,
    APP_NAME: environment.appName,
    APP_VERSION: environment.appVersion
});

// Legacy support - keeping old comment for reference
// http://localhost:50982/odop/customer/create_account