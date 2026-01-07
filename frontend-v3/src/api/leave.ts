import apiClient from './client';
import { TimeOffRequest, TimeOffCategory, PaginationMeta } from '../types';

export interface LeaveRequestParams {
  staff_member_id?: number;
  category_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  month?: number;
  year?: number;
  search?: string;
  paginate?: boolean;
  per_page?: number;
  page?: number;
}

export interface LeaveRequestCreateData {
  staff_member_id: number;
  time_off_category_id: number;
  start_date: string;
  end_date: string;
  reason?: string;
}

export const leaveApi = {
  getCategories: async () => {
    return apiClient.get<TimeOffCategory[]>('/time-off-categories');
  },

  createCategory: async (data: Partial<TimeOffCategory>) => {
    return apiClient.post<TimeOffCategory>('/time-off-categories', data);
  },

  updateCategory: async (id: number, data: Partial<TimeOffCategory>) => {
    return apiClient.put<TimeOffCategory>(`/time-off-categories/${id}`, data);
  },

  deleteCategory: async (id: number) => {
    return apiClient.delete<null>(`/time-off-categories/${id}`);
  },

  getRequests: async (params?: LeaveRequestParams) => {
    return apiClient.get<TimeOffRequest[] | { data: TimeOffRequest[]; meta: PaginationMeta }>('/time-off-requests', params as Record<string, unknown>);
  },

  getRequest: async (id: number) => {
    return apiClient.get<TimeOffRequest>(`/time-off-requests/${id}`);
  },

  createRequest: async (data: LeaveRequestCreateData) => {
    return apiClient.post<TimeOffRequest>('/time-off-requests', data);
  },

  updateRequest: async (id: number, data: Partial<LeaveRequestCreateData>) => {
    return apiClient.put<TimeOffRequest>(`/time-off-requests/${id}`, data);
  },

  deleteRequest: async (id: number) => {
    return apiClient.delete<null>(`/time-off-requests/${id}`);
  },

  processRequest: async (id: number, action: 'approve' | 'decline', remarks?: string) => {
    return apiClient.post<TimeOffRequest>(`/time-off-requests/${id}/process`, {
      action,
      approval_remarks: remarks,
    });
  },

  getBalance: async (staff_member_id: number, year?: number) => {
    return apiClient.get<{
      category: string;
      total: number;
      used: number;
      remaining: number;
    }[]>('/time-off-balance', { staff_member_id, year } as Record<string, unknown>);
  },
};

export default leaveApi;
