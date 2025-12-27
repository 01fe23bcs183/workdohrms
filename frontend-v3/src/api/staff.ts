import apiClient from './client';
import { StaffMember, PaginationMeta } from '../types';

export interface StaffListParams {
  office_location_id?: number;
  division_id?: number;
  status?: string;
  search?: string;
  paginate?: boolean;
  per_page?: number;
  page?: number;
  order_by?: string;
  order?: 'asc' | 'desc';
}

export interface StaffCreateData {
  full_name: string;
  email: string;
  password?: string;
  personal_email?: string;
  mobile_number?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  home_address?: string;
  nationality?: string;
  passport_number?: string;
  country_code?: string;
  region?: string;
  city_name?: string;
  postal_code?: string;
  biometric_id?: string;
  office_location_id?: number;
  division_id?: number;
  job_title_id?: number;
  hire_date?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  bank_branch?: string;
  compensation_type?: 'monthly' | 'hourly' | 'daily' | 'contract';
  base_salary?: number;
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export const staffApi = {
  getAll: async (params?: StaffListParams) => {
    return apiClient.get<StaffMember[] | { data: StaffMember[]; meta: PaginationMeta }>('/staff-members', params as Record<string, unknown>);
  },

  getById: async (id: number) => {
    return apiClient.get<StaffMember>(`/staff-members/${id}`);
  },

  create: async (data: StaffCreateData) => {
    return apiClient.post<StaffMember>('/staff-members', data);
  },

  update: async (id: number, data: Partial<StaffCreateData>) => {
    return apiClient.put<StaffMember>(`/staff-members/${id}`, data);
  },

  delete: async (id: number) => {
    return apiClient.delete<null>(`/staff-members/${id}`);
  },

  getDropdown: async (params?: { office_location_id?: number; division_id?: number }) => {
    return apiClient.get<{ id: number; full_name: string }[]>('/staff-members-dropdown', params as Record<string, unknown>);
  },
};

export default staffApi;
