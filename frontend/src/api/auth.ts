import api from './axios';
import type { ApiResponse, AuthResponse } from '../types';

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'sales';
  }) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<AuthResponse['user']>>('/auth/me');
    return response.data;
  },
};
