import apiClient from './client';
import { DashboardData } from '../types';

export const dashboardApi = {
  getDashboard: async () => {
    return apiClient.get<DashboardData>('/dashboard');
  },

  getEmployeeStats: async () => {
    return apiClient.get<DashboardData['employees']>('/dashboard/employee-stats');
  },

  getAttendanceSummary: async () => {
    return apiClient.get<DashboardData['attendance']>('/dashboard/attendance-summary');
  },

  getEmployeeGrowth: async () => {
    return apiClient.get<{ month: string; count: number }[]>('/dashboard/employee-growth');
  },

  getDepartmentDistribution: async () => {
    return apiClient.get<{ name: string; count: number }[]>('/dashboard/department-distribution');
  },
};

export default dashboardApi;
