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
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = Cookies.get('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
                refresh: refreshToken,
              });

              const { access } = response.data;
              Cookies.set('access_token', access);
              originalRequest.headers.Authorization = `Bearer ${access}`;

              return this.client(originalRequest);
            }
          } catch (refreshError) {
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

  async approveAccessRequest(id: number, role?: string, unitId?: number) {
    const data: any = {};
    if (role) data.role = role;
    if (unitId) data.unit_id = unitId;
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
    return this.client.post('/alerts/send/', data);
  }

  // Units
  async listUnits() {
    return this.client.get('/units/');
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

