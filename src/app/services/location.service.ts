import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface LocationInfo {
  district: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isLoading: boolean;
  hasPermission: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  
  private readonly STORAGE_KEY = 'odop_user_location';
  private readonly GEOCODE_API = 'https://nominatim.openstreetmap.org/reverse';
  
  private locationSubject = new BehaviorSubject<LocationInfo>({
    district: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
    isLoading: false,
    hasPermission: false,
    error: null
  });
  
  public location$ = this.locationSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSavedLocation();
    this.initializeLocation();
  }

  /**
   * Load previously saved location from localStorage
   */
  private loadSavedLocation(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const location = JSON.parse(saved);
        this.locationSubject.next({
          ...location,
          isLoading: false,
          hasPermission: true,
          error: null
        });
      }
    } catch (e) {
      console.error('Error loading saved location:', e);
    }
  }

  /**
   * Initialize location detection
   */
  private initializeLocation(): void {
    if ('geolocation' in navigator) {
      this.requestLocation();
    } else {
      this.locationSubject.next({
        ...this.locationSubject.value,
        error: 'Geolocation not supported',
        hasPermission: false
      });
    }
  }

  /**
   * Request user's current location
   */
  requestLocation(): void {
    this.locationSubject.next({
      ...this.locationSubject.value,
      isLoading: true,
      error: null
    });

    navigator.geolocation.getCurrentPosition(
      (position) => this.handlePositionSuccess(position),
      (error) => this.handlePositionError(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  }

  /**
   * Handle successful geolocation
   */
  private handlePositionSuccess(position: GeolocationPosition): void {
    const { latitude, longitude } = position.coords;
    this.reverseGeocode(latitude, longitude);
  }

  /**
   * Handle geolocation error
   */
  private handlePositionError(error: GeolocationPositionError): void {
    let errorMessage = 'Unable to get location';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }

    this.locationSubject.next({
      ...this.locationSubject.value,
      isLoading: false,
      hasPermission: false,
      error: errorMessage
    });
  }

  /**
   * Reverse geocode coordinates to get district/city name
   */
  private reverseGeocode(latitude: number, longitude: number): void {
    const url = `${this.GEOCODE_API}?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;

    this.http.get<any>(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'ODOP-Application'
      }
    }).pipe(
      map(response => this.parseGeocodeResponse(response, latitude, longitude)),
      tap(location => this.saveLocation(location)),
      catchError(error => {
        console.error('Geocoding error:', error);
        return of(this.createFallbackLocation(latitude, longitude));
      })
    ).subscribe(location => {
      this.locationSubject.next(location);
    });
  }

  /**
   * Parse geocode API response
   */
  private parseGeocodeResponse(response: any, latitude: number, longitude: number): LocationInfo {
    const address = response.address || {};
    
    // Get district - try multiple fields as API response varies
    const district = address.county || 
                    address.state_district || 
                    address.district || 
                    address.city_district ||
                    address.city ||
                    address.town ||
                    address.village ||
                    '';

    // Get city
    const city = address.city || 
                address.town || 
                address.village || 
                address.municipality ||
                district;

    // Get state
    const state = address.state || '';

    // Get pincode
    const pincode = address.postcode || '';

    return {
      district: this.formatLocationName(district),
      city: this.formatLocationName(city),
      state: this.formatLocationName(state),
      country: address.country || 'India',
      pincode,
      latitude,
      longitude,
      isLoading: false,
      hasPermission: true,
      error: null
    };
  }

  /**
   * Format location name (capitalize, clean up)
   */
  private formatLocationName(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Create fallback location when geocoding fails
   */
  private createFallbackLocation(latitude: number, longitude: number): LocationInfo {
    return {
      district: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      latitude,
      longitude,
      isLoading: false,
      hasPermission: true,
      error: 'Could not determine location name'
    };
  }

  /**
   * Save location to localStorage
   */
  private saveLocation(location: LocationInfo): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        district: location.district,
        city: location.city,
        state: location.state,
        country: location.country,
        pincode: location.pincode,
        latitude: location.latitude,
        longitude: location.longitude
      }));
    } catch (e) {
      console.error('Error saving location:', e);
    }
  }

  /**
   * Get current location synchronously
   */
  getCurrentLocation(): LocationInfo {
    return this.locationSubject.value;
  }

  /**
   * Get display name for navbar (district or city)
   */
  getDisplayName(): string {
    const location = this.locationSubject.value;
    return location.district || location.city || '';
  }

  /**
   * Manually set location (for dropdown selection)
   */
  setManualLocation(district: string, state: string): void {
    const location: LocationInfo = {
      ...this.locationSubject.value,
      district,
      state,
      city: district,
      isLoading: false,
      hasPermission: true,
      error: null
    };
    this.locationSubject.next(location);
    this.saveLocation(location);
  }

  /**
   * Clear saved location
   */
  clearLocation(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.locationSubject.next({
      district: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      latitude: 0,
      longitude: 0,
      isLoading: false,
      hasPermission: false,
      error: null
    });
  }
}
