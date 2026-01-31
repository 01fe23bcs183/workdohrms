import apiClient from './client';
import { WorkLog, AttendanceRegularization, PaginationMeta } from '../types';

export interface WorkLogParams {
  staff_member_id?: number;
  office_location_id?: number;
  date?: string;
  start_date?: string;
  end_date?: string;
  month?: number;
  year?: number;
  paginate?: boolean;
  per_page?: number;
  page?: number;
}

export interface WorkLogCreateData {
  staff_member_id: number;
  log_date: string;
  clock_in?: string;
  clock_out?: string;
  status?: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
  notes?: string;
}

export interface RegularizationCreateData {
  staff_member_id: number;
  work_log_id?: number;
  regularization_date: string;
  original_clock_in?: string;
  original_clock_out?: string;
  requested_clock_in?: string;
  requested_clock_out?: string;
  reason: string;
}

export const attendanceApi = {
  getWorkLogs: async (params?: WorkLogParams) => {
    return apiClient.get<WorkLog[] | { data: WorkLog[]; meta: PaginationMeta }>('/work-logs', params as Record<string, unknown>);
  },

  getWorkLog: async (id: number) => {
    return apiClient.get<WorkLog>(`/work-logs/${id}`);
  },

  createWorkLog: async (data: WorkLogCreateData) => {
    return apiClient.post<WorkLog>('/work-logs', data);
  },

  updateWorkLog: async (id: number, data: Partial<WorkLogCreateData>) => {
    return apiClient.put<WorkLog>(`/work-logs/${id}`, data);
  },

  deleteWorkLog: async (id: number) => {
    return apiClient.delete<null>(`/work-logs/${id}`);
  },

  clockIn: async (staff_member_id?: number, location?: string) => {
    return apiClient.post<WorkLog>('/clock-in', { staff_member_id, location });
  },

  clockOut: async (staff_member_id?: number, location?: string) => {
    return apiClient.post<WorkLog>('/clock-out', { staff_member_id, location });
  },

  bulkStore: async (records: WorkLogCreateData[]) => {
    return apiClient.post<{ recorded: number }>('/work-logs/bulk', { records });
  },

  getSummary: async (params?: { staff_member_id?: number; start_date?: string; end_date?: string }) => {
    return apiClient.get<{
      total_days: number;
      present_days: number;
      absent_days: number;
      late_days: number;
      leave_days: number;
      total_hours: string;
    }>('/attendance-summary', params as Record<string, unknown>);
  },

  getRegularizations: async (params?: { status?: string; paginate?: boolean; per_page?: number; page?: number }) => {
    return apiClient.get<AttendanceRegularization[] | { data: AttendanceRegularization[]; meta: PaginationMeta }>('/attendance-regularizations', params as Record<string, unknown>);
  },

  createRegularization: async (data: RegularizationCreateData) => {
    return apiClient.post<AttendanceRegularization>('/attendance-regularizations', data);
  },

  approveRegularization: async (id: number, remarks?: string) => {
    return apiClient.post<AttendanceRegularization>(`/attendance-regularizations/${id}/approve`, { remarks });
  },

  rejectRegularization: async (id: number, remarks: string) => {
    return apiClient.post<AttendanceRegularization>(`/attendance-regularizations/${id}/reject`, { remarks });
  },

  getPendingRegularizations: async () => {
    return apiClient.get<AttendanceRegularization[]>('/attendance-regularizations-pending');
  },

  getMyRegularizations: async () => {
    return apiClient.get<AttendanceRegularization[]>('/my-regularization-requests');
  },
};

export default attendanceApi;
