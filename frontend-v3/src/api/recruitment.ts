import apiClient from './client';
import { Job, Candidate, JobApplication, PaginationMeta } from '../types';

export interface JobParams {
  status?: string;
  job_category_id?: number;
  office_location_id?: number;
  paginate?: boolean;
  per_page?: number;
  page?: number;
}

export interface JobCreateData {
  title: string;
  job_category_id?: number;
  office_location_id?: number;
  division_id?: number;
  description?: string;
  requirements?: string;
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
  salary_min?: number;
  salary_max?: number;
  closes_at?: string;
}

export interface CandidateCreateData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
}

export const recruitmentApi = {
  getJobs: async (params?: JobParams) => {
    return apiClient.get<Job[] | { data: Job[]; meta: PaginationMeta }>('/jobs', params as Record<string, unknown>);
  },

  getJob: async (id: number) => {
    return apiClient.get<Job>(`/jobs/${id}`);
  },

  createJob: async (data: JobCreateData) => {
    return apiClient.post<Job>('/jobs', data);
  },

  updateJob: async (id: number, data: Partial<JobCreateData>) => {
    return apiClient.put<Job>(`/jobs/${id}`, data);
  },

  deleteJob: async (id: number) => {
    return apiClient.delete<null>(`/jobs/${id}`);
  },

  publishJob: async (id: number) => {
    return apiClient.post<Job>(`/jobs/${id}/publish`);
  },

  closeJob: async (id: number) => {
    return apiClient.post<Job>(`/jobs/${id}/close`);
  },

  getCandidates: async (params?: { status?: string; search?: string; paginate?: boolean; per_page?: number; page?: number }) => {
    return apiClient.get<Candidate[] | { data: Candidate[]; meta: PaginationMeta }>('/candidates', params as Record<string, unknown>);
  },

  getCandidate: async (id: number) => {
    return apiClient.get<Candidate>(`/candidates/${id}`);
  },

  createCandidate: async (data: CandidateCreateData) => {
    return apiClient.post<Candidate>('/candidates', data);
  },

  updateCandidate: async (id: number, data: Partial<CandidateCreateData>) => {
    return apiClient.put<Candidate>(`/candidates/${id}`, data);
  },

  deleteCandidate: async (id: number) => {
    return apiClient.delete<null>(`/candidates/${id}`);
  },

  archiveCandidate: async (id: number) => {
    return apiClient.post<Candidate>(`/candidates/${id}/archive`);
  },

  convertToEmployee: async (id: number) => {
    return apiClient.post<{ staff_member_id: number }>(`/candidates/${id}/convert-to-employee`);
  },

  getApplications: async (params?: { job_id?: number; status?: string; paginate?: boolean; per_page?: number; page?: number }) => {
    return apiClient.get<JobApplication[] | { data: JobApplication[]; meta: PaginationMeta }>('/job-applications', params as Record<string, unknown>);
  },

  getApplication: async (id: number) => {
    return apiClient.get<JobApplication>(`/job-applications/${id}`);
  },

  createApplication: async (job_id: number, data: { candidate_id: number }) => {
    return apiClient.post<JobApplication>(`/jobs/${job_id}/applications`, data);
  },

  moveStage: async (id: number, job_stage_id: number) => {
    return apiClient.post<JobApplication>(`/job-applications/${id}/move-stage`, { job_stage_id });
  },

  rateApplication: async (id: number, rating: number) => {
    return apiClient.post<JobApplication>(`/job-applications/${id}/rate`, { rating });
  },

  shortlistApplication: async (id: number) => {
    return apiClient.post<JobApplication>(`/job-applications/${id}/shortlist`);
  },

  rejectApplication: async (id: number, reason?: string) => {
    return apiClient.post<JobApplication>(`/job-applications/${id}/reject`, { reason });
  },

  hireApplication: async (id: number) => {
    return apiClient.post<JobApplication>(`/job-applications/${id}/hire`);
  },

  getJobCategories: async () => {
    return apiClient.get<{ id: number; name: string; description: string | null }[]>('/job-categories');
  },

  getJobStages: async () => {
    return apiClient.get<{ id: number; name: string; order: number; color: string | null }[]>('/job-stages');
  },
};

export default recruitmentApi;
