import apiClient from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  signIn: async (email: string, password: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/sign-in', { email, password });
    if (response.success && response.data.token) {
      apiClient.setToken(response.data.token);
    }
    return response;
  },

  signUp: async (name: string, email: string, password: string, password_confirmation: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/sign-up', {
      name,
      email,
      password,
      password_confirmation,
    });
    if (response.success && response.data.token) {
      apiClient.setToken(response.data.token);
    }
    return response;
  },

  signOut: async () => {
    const response = await apiClient.post<null>('/auth/sign-out');
    apiClient.removeToken();
    return response;
  },

  getProfile: async () => {
    return apiClient.get<{ user: User }>('/auth/profile');
  },

  forgotPassword: async (email: string) => {
    return apiClient.post<null>('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, email: string, password: string, password_confirmation: string) => {
    return apiClient.post<null>('/auth/reset-password', {
      token,
      email,
      password,
      password_confirmation,
    });
  },
};

export default authApi;
