import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds timeout for large responses
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // Log warning if no token for protected endpoints
          const protectedEndpoints = ['/alerts/', '/users/', '/reports/', '/access-requests/'];
          if (protectedEndpoints.some(endpoint => config.url?.includes(endpoint))) {
            console.warn('API: Request to protected endpoint without token:', config.url);
          }
        }
        // Log request for debugging
        if (config.url?.includes('/locations/')) {
          console.log('API: Request to /locations/', { url: config.url, hasToken: !!token });
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => {
        // Log response for debugging
        if (response.config.url?.includes('/locations/')) {
          console.log('API: Response from /locations/', { status: response.status, dataLength: Array.isArray(response.data) ? response.data.length : 'N/A' });
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        // Log error for debugging
        if (originalRequest?.url?.includes('/locations/')) {
          console.log('API: Error from /locations/', { status: error.response?.status, message: error.message });
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          // For AllowAny endpoints (like /locations/, /units/by-parent/), retry without token
          const url = originalRequest.url || '';
          const allowAnyEndpoints = ['/locations/', '/units/by-parent/', '/health/', '/auth/'];
          const isAllowAnyEndpoint = allowAnyEndpoints.some(endpoint => url.includes(endpoint));
          
          if (isAllowAnyEndpoint) {
            // Remove authorization header and retry
            originalRequest._retry = true;
            delete originalRequest.headers.Authorization;
            return this.client(originalRequest);
          }

          originalRequest._retry = true;

          try {
            const refreshToken = Cookies.get('refresh_token');
            if (refreshToken) {
              console.log('API: Attempting to refresh token...');
              const response = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
                refresh: refreshToken,
              });

              const { access } = response.data;
              Cookies.set('access_token', access);
              originalRequest.headers.Authorization = `Bearer ${access}`;
              console.log('API: Token refreshed successfully');

              return this.client(originalRequest);
            } else {
              console.error('API: No refresh token available');
              // No refresh token, clear tokens and redirect to login
              Cookies.remove('access_token');
              Cookies.remove('refresh_token');
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
              return Promise.reject(new Error('No refresh token available'));
            }
          } catch (refreshError) {
            console.error('API: Token refresh failed:', refreshError);
            // Refresh failed, clear tokens and redirect to login
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: any) {
    return this.client.post('/auth/register/', data);
  }

  async login(data: { email: string; password: string }) {
    return this.client.post('/auth/login/', data);
  }

  async requestOTP(data: { email: string }) {
    return this.client.post('/auth/request-otp/', data);
  }

  async verifyOTP(data: { email: string; token: string }) {
    const response = await this.client.post('/auth/verify-otp/', data);
    if (response.data.access && response.data.refresh) {
      Cookies.set('access_token', response.data.access);
      Cookies.set('refresh_token', response.data.refresh);
    }
    return response;
  }

  async refreshToken() {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');
    const response = await this.client.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    if (response.data.access) {
      Cookies.set('access_token', response.data.access);
    }
    return response;
  }

  // Access Requests
  async listAccessRequests(params?: any) {
    return this.client.get('/access-requests/', { params });
  }

  async approveAccessRequest(id: number, role?: string, unitId?: number, profileData?: any) {
    const data: any = {};
    if (role) data.role = role;
    if (unitId) data.unit_id = unitId;
    if (profileData) {
      if (profileData.address !== undefined) data.address = profileData.address;
      if (profileData.city_id !== undefined) data.city_id = profileData.city_id;
    }
    return this.client.post(`/access-requests/${id}/approve/`, data);
  }

  async rejectAccessRequest(id: number, reason?: string) {
    return this.client.post(`/access-requests/${id}/reject/`, { reason });
  }

  // Reports
  async listReports(params?: any) {
    return this.client.get('/reports/', { params });
  }

  async createReport(data: any) {
    return this.client.post('/reports/create/', data);
  }

  async exportReports(params?: any) {
    return this.client.get('/reports/export/', {
      params,
      responseType: 'blob',
    });
  }

  // Alerts
  async sendAlert(data: any) {
    // Ensure we have a valid token before sending
    const token = Cookies.get('access_token');
    if (!token) {
      throw new Error('No access token found. Please login again.');
    }
    return this.client.post('/alerts/send/', data);
  }

  // Units
  async listUnits(params?: { parent_id?: number | null; unit_type?: string; id?: number; page?: number; page_size?: number }) {
    return this.client.get('/units/', { params });
  }

  async getUnit(id: number) {
    return this.client.get(`/units/${id}/`);
  }

  async getUnitsByParent(parentId?: number | null, unitType?: string) {
    const params: any = {};
    if (parentId !== undefined && parentId !== null) {
      params.parent_id = parentId;
    } else if (parentId === null) {
      // Explicitly set parent_id to empty string to get root units
      params.parent_id = '';
    }
    if (unitType) {
      params.unit_type = unitType;
    }
    return this.client.get('/units/by-parent/', { params });
  }

  // Locations (Cities, Towns, Settlements)
  async listLocations(params?: any) {
    return this.client.get('/locations/', { params });
  }

  // Users
  async getProfile() {
    return this.client.get('/users/me/');
  }

  async updateProfile(profileId: number, data: any) {
    return this.client.patch(`/profiles/${profileId}/`, data);
  }

  async listApprovedUsers() {
    return this.client.get('/users/approved/');
  }

  async updateUserPermissions(userId: number, data: { role?: string; unit_id?: number | null }) {
    return this.client.patch(`/users/${userId}/update-permissions/`, data);
  }

  async updateUser(userId: number, profileId: number, data: any) {
    // Update user profile with all fields
    return this.client.patch(`/profiles/${profileId}/`, data);
  }

  async deleteUser(userId: number) {
    return this.client.delete(`/users/${userId}/`);
  }

  // Health
  async healthCheck() {
    return this.client.get('/health/');
  }

  // Units Management
  async createUnit(data: any) {
    return this.client.post('/units/', data);
  }

  async updateUnit(id: number, data: any) {
    return this.client.patch(`/units/${id}/`, data);
  }

  async deleteUnit(id: number) {
    return this.client.delete(`/units/${id}/`);
  }

  // Reserves Management
  async listReserves(params?: any) {
    return this.client.get('/reserves/', { params });
  }

  async createReserve(data: any) {
    return this.client.post('/reserves/', data);
  }

  async deleteReserve(id: number) {
    return this.client.delete(`/reserves/${id}/`);
  }

  logout() {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
}

export const api = new ApiClient();
export default api;

