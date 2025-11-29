import axios, { AxiosInstance, AxiosError } from 'axios';
import { secureStorage, STORAGE_KEYS } from '../utils/storage';
import config from '../constants/config';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.apiUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - logout user
          await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          // TODO: Navigate to login screen
          // You can emit an event here or use a navigation ref
        }

        // Format error message
        const errorMessage = this.getErrorMessage(error);
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as any;
      return data.message || data.error || 'An error occurred';
    }

    if (error.request) {
      return 'No response from server. Please check your internet connection.';
    }

    return error.message || 'An unexpected error occurred';
  }

  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
