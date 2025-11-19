import apiService from './api';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  ApiResponse,
} from '../types/api.types';

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return await apiService.post<LoginResponse>('/mobile/login', credentials);
  }

  /**
   * Register new customer
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return await apiService.post<RegisterResponse>('/mobile/register', userData);
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return await apiService.get<ApiResponse<User>>('/mobile/profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return await apiService.put<ApiResponse<User>>('/mobile/profile', userData);
  }

  /**
   * Logout user (client-side only)
   */
  async logout(): Promise<void> {
    // Clear local storage is handled by the Redux action
    return Promise.resolve();
  }
}

export const authService = new AuthService();
export default authService;
