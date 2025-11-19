export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
}

export interface RegisterResponse {
  success: boolean;
  token: string;
  user: User;
  customer: Customer;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'operator' | 'viewer' | 'customer';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  meterNumber?: string;
  tariffPlan?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkMeterRequest {
  meterNumber: string;
}

export interface LoadTokenRequest {
  meterId: string;
  token?: string;
  amount?: number;
}

export interface ConsumptionTrendRequest {
  period?: '24h' | '7d' | '30d' | '90d';
}

export interface NotificationQuery {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}
