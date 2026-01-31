import apiClient from './client';
import { SalarySlip, PaginationMeta } from '../types';

export interface SalarySlipParams {
  staff_member_id?: number;
  status?: string;
  month?: number;
  year?: number;
  paginate?: boolean;
  per_page?: number;
  page?: number;
}

export const payrollApi = {
  getSalarySlips: async (params?: SalarySlipParams) => {
    return apiClient.get<SalarySlip[] | { data: SalarySlip[]; meta: PaginationMeta }>('/salary-slips', params as Record<string, unknown>);
  },

  getSalarySlip: async (id: number) => {
    return apiClient.get<SalarySlip>(`/salary-slips/${id}`);
  },

  generateSalarySlip: async (staff_member_id: number, month: number, year: number) => {
    return apiClient.post<SalarySlip>('/salary-slips/generate', { staff_member_id, month, year });
  },

  bulkGenerate: async (month: number, year: number, employee_ids?: number[]) => {
    return apiClient.post<{ generated: number; slips: SalarySlip[] }>('/salary-slips/bulk-generate', {
      month,
      year,
      employee_ids,
    });
  },

  markPaid: async (id: number, payment_method?: string, payment_reference?: string) => {
    return apiClient.post<SalarySlip>(`/salary-slips/${id}/mark-paid`, {
      payment_method,
      payment_reference,
    });
  },

  deleteSalarySlip: async (id: number) => {
    return apiClient.delete<null>(`/salary-slips/${id}`);
  },

  getBenefitTypes: async () => {
    return apiClient.get<{ id: number; name: string; description: string | null; is_taxable: boolean }[]>('/benefit-types');
  },

  createBenefitType: async (data: { name: string; description?: string; is_taxable?: boolean }) => {
    return apiClient.post<{ id: number; name: string }>('/benefit-types', data);
  },

  updateBenefitType: async (id: number, data: { name?: string; description?: string; is_taxable?: boolean }) => {
    return apiClient.put<{ id: number; name: string }>(`/benefit-types/${id}`, data);
  },

  deleteBenefitType: async (id: number) => {
    return apiClient.delete<null>(`/benefit-types/${id}`);
  },

  getTaxSlabs: async () => {
    return apiClient.get<{ id: number; from_amount: string; to_amount: string; percentage: string }[]>('/tax-slabs');
  },

  createTaxSlab: async (data: { from_amount: number; to_amount: number; percentage: number }) => {
    return apiClient.post<{ id: number }>('/tax-slabs', data);
  },

  updateTaxSlab: async (id: number, data: { from_amount?: number; to_amount?: number; percentage?: number }) => {
    return apiClient.put<{ id: number }>(`/tax-slabs/${id}`, data);
  },

  deleteTaxSlab: async (id: number) => {
    return apiClient.delete<null>(`/tax-slabs/${id}`);
  },

  getCompensationCategories: async () => {
    return apiClient.get<{ id: number; name: string; description: string | null }[]>('/compensation-categories');
  },

  getAdvanceTypes: async () => {
    return apiClient.get<{ id: number; name: string; description: string | null }[]>('/advance-types');
  },

  getWithholdingTypes: async () => {
    return apiClient.get<{ id: number; name: string; description: string | null }[]>('/withholding-types');
  },
};

export default payrollApi;
