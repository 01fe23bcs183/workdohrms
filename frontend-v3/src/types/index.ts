export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  from: number | null;
  to: number | null;
  has_more_pages: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  role_display: string;
  permissions: string[];
  staff_member_id: number | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  access_token: string;
  token_type: string;
}

export interface StaffMember {
  id: number;
  user_id: number | null;
  full_name: string;
  personal_email: string | null;
  mobile_number: string | null;
  birth_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  home_address: string | null;
  nationality: string | null;
  passport_number: string | null;
  country_code: string | null;
  region: string | null;
  city_name: string | null;
  postal_code: string | null;
  staff_code: string;
  biometric_id: string | null;
  office_location_id: number | null;
  division_id: number | null;
  job_title_id: number | null;
  hire_date: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  compensation_type: 'monthly' | 'hourly' | 'daily' | 'contract' | null;
  base_salary: string | null;
  employment_status: 'active' | 'on_leave' | 'suspended' | 'terminated' | 'resigned' | null;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern' | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  office_location?: OfficeLocation;
  division?: Division;
  job_title?: JobTitle;
}

export interface OfficeLocation {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Division {
  id: number;
  name: string;
  office_location_id: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  office_location?: OfficeLocation;
}

export interface JobTitle {
  id: number;
  name: string;
  division_id: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  division?: Division;
}

export interface WorkLog {
  id: number;
  staff_member_id: number;
  log_date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
  late_minutes: number;
  overtime_minutes: number;
  total_hours: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  staff_member?: StaffMember;
}

export interface TimeOffCategory {
  id: number;
  name: string;
  description: string | null;
  days_allowed: number;
  is_paid: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeOffRequest {
  id: number;
  staff_member_id: number;
  time_off_category_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  approved_by: number | null;
  approval_remarks: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  staff_member?: StaffMember;
  category?: TimeOffCategory;
}

export interface SalarySlip {
  id: number;
  staff_member_id: number;
  month: number;
  year: number;
  basic_salary: string;
  gross_salary: string;
  total_deductions: string;
  net_salary: string;
  benefits_breakdown: Record<string, number> | null;
  deductions_breakdown: Record<string, number> | null;
  status: 'draft' | 'generated' | 'paid';
  payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
  staff_member?: StaffMember;
}

export interface Job {
  id: number;
  title: string;
  job_category_id: number | null;
  office_location_id: number | null;
  division_id: number | null;
  description: string | null;
  requirements: string | null;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern' | null;
  salary_min: string | null;
  salary_max: string | null;
  is_active: boolean;
  status: 'draft' | 'published' | 'closed';
  published_at: string | null;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  candidate_id: number;
  job_stage_id: number | null;
  rating: number | null;
  status: 'new' | 'shortlisted' | 'rejected' | 'hired';
  created_at: string;
  updated_at: string;
  job?: Job;
  candidate?: Candidate;
}

export interface DashboardData {
  employees: {
    total: number;
    active: number;
    on_leave: number;
    new_this_month: number;
  };
  attendance: {
    present_today: number;
    absent_today: number;
    late_today: number;
    on_leave_today: number;
  };
  leave: {
    pending_requests: number;
    approved_this_month: number;
  };
  payroll: {
    total_this_month: number;
    pending_slips: number;
  };
}

export interface CompanyHoliday {
  id: number;
  name: string;
  date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRegularization {
  id: number;
  staff_member_id: number;
  work_log_id: number | null;
  regularization_date: string;
  original_clock_in: string | null;
  original_clock_out: string | null;
  requested_clock_in: string | null;
  requested_clock_out: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: number | null;
  review_remarks: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  staff_member?: StaffMember;
}
