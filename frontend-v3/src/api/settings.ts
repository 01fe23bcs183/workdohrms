import apiClient from './client';
import { OfficeLocation, Division, JobTitle, CompanyHoliday, Shift } from '../types';

export const settingsApi = {
  getOfficeLocations: async () => {
    return apiClient.get<OfficeLocation[]>('/office-locations');
  },

  createOfficeLocation: async (data: Partial<OfficeLocation>) => {
    return apiClient.post<OfficeLocation>('/office-locations', data);
  },

  updateOfficeLocation: async (id: number, data: Partial<OfficeLocation>) => {
    return apiClient.put<OfficeLocation>(`/office-locations/${id}`, data);
  },

  deleteOfficeLocation: async (id: number) => {
    return apiClient.delete<null>(`/office-locations/${id}`);
  },

  getDivisions: async () => {
    return apiClient.get<Division[]>('/divisions');
  },

  fetchDivisionsByLocation: async (office_location_id: number) => {
    return apiClient.post<Division[]>('/fetch-divisions', { office_location_id });
  },

  createDivision: async (data: Partial<Division>) => {
    return apiClient.post<Division>('/divisions', data);
  },

  updateDivision: async (id: number, data: Partial<Division>) => {
    return apiClient.put<Division>(`/divisions/${id}`, data);
  },

  deleteDivision: async (id: number) => {
    return apiClient.delete<null>(`/divisions/${id}`);
  },

  getJobTitles: async () => {
    return apiClient.get<JobTitle[]>('/job-titles');
  },

  fetchJobTitlesByDivision: async (division_id: number) => {
    return apiClient.post<JobTitle[]>('/fetch-job-titles', { division_id });
  },

  createJobTitle: async (data: Partial<JobTitle>) => {
    return apiClient.post<JobTitle>('/job-titles', data);
  },

  updateJobTitle: async (id: number, data: Partial<JobTitle>) => {
    return apiClient.put<JobTitle>(`/job-titles/${id}`, data);
  },

  deleteJobTitle: async (id: number) => {
    return apiClient.delete<null>(`/job-titles/${id}`);
  },

  getHolidays: async () => {
    return apiClient.get<CompanyHoliday[]>('/company-holidays');
  },

  createHoliday: async (data: Partial<CompanyHoliday>) => {
    return apiClient.post<CompanyHoliday>('/company-holidays', data);
  },

  updateHoliday: async (id: number, data: Partial<CompanyHoliday>) => {
    return apiClient.put<CompanyHoliday>(`/company-holidays/${id}`, data);
  },

  deleteHoliday: async (id: number) => {
    return apiClient.delete<null>(`/company-holidays/${id}`);
  },

  getShifts: async () => {
    return apiClient.get<Shift[]>('/shifts');
  },

  createShift: async (data: Partial<Shift>) => {
    return apiClient.post<Shift>('/shifts', data);
  },

  updateShift: async (id: number, data: Partial<Shift>) => {
    return apiClient.put<Shift>(`/shifts/${id}`, data);
  },

  deleteShift: async (id: number) => {
    return apiClient.delete<null>(`/shifts/${id}`);
  },
};

export default settingsApi;
