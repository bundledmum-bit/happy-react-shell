import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface HRDepartment {
  id: string;
  name: string;
  description: string | null;
  head_employee_id: string | null;
  is_active: boolean | null;
}

export interface HREmployee {
  id: string;
  employee_id: string;
  auth_user_id: string | null;
  full_name: string;
  personal_email: string;
  work_email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  state_of_origin: string | null;
  national_id_number: string | null;
  department_id: string | null;
  job_title: string;
  employment_type: string;
  line_manager_id: string | null;
  start_date: string;
  end_date: string | null;
  probation_end_date: string | null;
  status: "active" | "on_leave" | "suspended" | "terminated" | string;
  termination_reason: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  basic_salary: number;          // kobo
  housing_allowance: number;     // kobo
  transport_allowance: number;   // kobo
  other_allowances: number;      // kobo
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  notes: string | null;
  hr_departments?: { name: string } | null;
}

export interface HRLeaveType {
  id: string;
  name: string;
  description: string | null;
  default_days_per_year: number;
  is_paid: boolean | null;
  requires_approval: boolean | null;
  gender_specific: string | null;
  is_active: boolean | null;
}

export interface HRLeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: "pending_manager" | "pending_hr" | "approved" | "rejected" | "cancelled" | string;
  manager_status: string;
  manager_id: string | null;
  manager_action_by: string | null;
  manager_action_at: string | null;
  manager_notes: string | null;
  hr_status: string;
  hr_action_by: string | null;
  hr_action_at: string | null;
  hr_notes: string | null;
  rejection_reason: string | null;
  created_at?: string;
  hr_employees?: { full_name: string; employee_id: string } | null;
  hr_leave_types?: { name: string; is_paid: boolean | null } | null;
}

export interface HRLeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  entitled_days: number;
  used_days: number;
  pending_days: number;
  hr_leave_types?: { name: string } | null;
  hr_employees?: { full_name: string; employee_id: string } | null;
}

export interface HRPayrollRun {
  id: string;
  employee_id: string;
  pay_month: number;
  pay_year: number;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  bonus: number;
  gross_salary: number;
  employee_pension: number;
  nhf_deduction: number;
  paye_tax: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  employer_pension: number;
  nsitf: number;
  itf: number;
  total_employer_cost: number;
  status: "draft" | "approved" | "paid" | string;
  approved_by: string | null;
  approved_at: string | null;
  payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  paid_by: string | null;
  notification_sent: boolean;
  notes: string | null;
  hr_employees?: { full_name: string; employee_id: string; department_id: string | null; hr_departments?: { name: string } | null } | null;
}

export interface HRDocument {
  id: string;
  employee_id: string;
  document_type: string;
  title: string;
  file_url: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at?: string;
  hr_employees?: { full_name: string } | null;
}

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

export const fromKobo = (v: number | null | undefined) => Math.round((v || 0) / 100);
export const toKobo = (ngn: number | string) => Math.round((Number(ngn) || 0) * 100);
export const fmtN = (kobo: number | null | undefined) => `₦${fromKobo(kobo).toLocaleString()}`;

/** Count Mon–Fri days inclusive between two ISO dates. */
export function businessDaysBetween(startIso: string, endIso: string): number {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso + "T00:00:00");
  const end = new Date(endIso + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count += 1;
  }
  return count;
}

const NAIRA_INCOME: Array<keyof HRPayrollRun> = ["basic_salary","housing_allowance","transport_allowance","other_allowances","bonus"];
const NAIRA_DED: Array<keyof HRPayrollRun> = ["employee_pension","nhf_deduction","paye_tax","other_deductions"];

/** Compute totals for a payroll run from its raw line items (all kobo). */
export function rollupPayroll(input: Partial<HRPayrollRun>): Partial<HRPayrollRun> {
  const num = (k: keyof HRPayrollRun) => Number(input[k]) || 0;
  const gross = NAIRA_INCOME.reduce((s, k) => s + num(k), 0);
  const totalDeductions = NAIRA_DED.reduce((s, k) => s + num(k), 0);
  const net = gross - totalDeductions;
  const employerCost =
    gross
    + (Number(input.employer_pension) || 0)
    + (Number(input.nsitf) || 0)
    + (Number(input.itf) || 0);
  return {
    ...input,
    gross_salary: gross,
    total_deductions: totalDeductions,
    net_salary: net,
    total_employer_cost: employerCost,
  };
}

// -----------------------------------------------------------------------------
// Departments
// -----------------------------------------------------------------------------

export function useHRDepartments() {
  return useQuery({
    queryKey: ["hr-departments"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("hr_departments").select("*").order("name");
      if (error) throw error;
      return (data || []) as HRDepartment[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpsertDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<HRDepartment>) => {
      if ((payload as any).id) {
        const { error } = await (supabase as any).from("hr_departments").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", (payload as any).id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("hr_departments").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-departments"] }),
  });
}

// -----------------------------------------------------------------------------
// Employees
// -----------------------------------------------------------------------------

export function useHREmployees() {
  return useQuery({
    queryKey: ["hr-employees"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_employees")
        .select(`
          id,
          employee_id,
          full_name,
          personal_email,
          work_email,
          phone,
          job_title,
          employment_type,
          status,
          start_date,
          auth_user_id,
          hr_departments (
            id,
            name
          )
        `)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("hr_employees query failed:", error);
        throw error;
      }
      return (data || []) as HREmployee[];
    },
    staleTime: 60_000,
  });
}

export function useHREmployee(id: string | null) {
  return useQuery({
    queryKey: ["hr-employee", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_employees")
        .select("*, hr_departments(name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as HREmployee | null;
    },
  });
}

export function useUpsertEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<HREmployee>) => {
      const body = { ...payload } as any;
      delete body.hr_departments;
      if (body.id) {
        body.updated_at = new Date().toISOString();
        const { error } = await (supabase as any).from("hr_employees").update(body).eq("id", body.id);
        if (error) throw error;
      } else {
        // employee_id is DB-generated (trigger); omit.
        delete body.employee_id;
        const { error } = await (supabase as any).from("hr_employees").insert(body);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-employees"] }),
  });
}

/** Current logged-in employee (single row, scoped by RLS via auth_user_id). */
export function useMyEmployee() {
  return useQuery({
    queryKey: ["my-hr-employee"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_employees")
        .select("*, hr_departments(name)")
        .maybeSingle();
      if (error) throw error;
      return data as HREmployee | null;
    },
    staleTime: 30_000,
  });
}

// -----------------------------------------------------------------------------
// Leave
// -----------------------------------------------------------------------------

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["hr-leave-types"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_leave_types")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as HRLeaveType[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["hr-leave-requests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_leave_requests")
        .select("*, hr_employees(full_name, employee_id), hr_leave_types(name, is_paid)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as HRLeaveRequest[];
    },
    staleTime: 30_000,
  });
}

export function useMyLeaveRequests(employeeId: string | null) {
  return useQuery({
    queryKey: ["my-leave-requests", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_leave_requests")
        .select("*, hr_leave_types(name, is_paid)")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as HRLeaveRequest[];
    },
    staleTime: 30_000,
  });
}

export function useLeaveBalances(year: number) {
  return useQuery({
    queryKey: ["hr-leave-balances", year],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_leave_balances")
        .select("*, hr_employees(full_name, employee_id), hr_leave_types(name)")
        .eq("year", year);
      if (error) throw error;
      return (data || []) as HRLeaveBalance[];
    },
    staleTime: 30_000,
  });
}

export function useMyLeaveBalances(employeeId: string | null, year: number) {
  return useQuery({
    queryKey: ["my-leave-balances", employeeId, year],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_leave_balances")
        .select("*, hr_leave_types(name)")
        .eq("employee_id", employeeId)
        .eq("year", year);
      if (error) throw error;
      return (data || []) as HRLeaveBalance[];
    },
  });
}

export function useUpdateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<HRLeaveRequest> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("hr_leave_requests")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", payload.id);
      if (error) throw error;
      try {
        await (supabase.functions as any).invoke("send-hr-notification", {
          body: { notification_type: "leave_status", leave_request_id: payload.id },
        });
      } catch (e) { /* non-blocking */ }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-leave-requests"] });
      qc.invalidateQueries({ queryKey: ["my-leave-requests"] });
    },
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<HRLeaveRequest>) => {
      const { data, error } = await (supabase as any)
        .from("hr_leave_requests")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      try {
        await (supabase.functions as any).invoke("send-hr-notification", {
          body: { notification_type: "leave_manager_alert", leave_request_id: data.id },
        });
      } catch (e) { /* non-blocking */ }
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-leave-requests"] }),
  });
}

// -----------------------------------------------------------------------------
// Payroll
// -----------------------------------------------------------------------------

export function usePayrollRuns(year?: number, month?: number) {
  return useQuery({
    queryKey: ["hr-payroll", year ?? "all", month ?? "all"],
    queryFn: async () => {
      let q = (supabase as any)
        .from("hr_payroll_runs")
        .select("*, hr_employees(full_name, employee_id, department_id, hr_departments(name))");
      if (year) q = q.eq("pay_year", year);
      if (month) q = q.eq("pay_month", month);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as HRPayrollRun[];
    },
    staleTime: 30_000,
  });
}

export function useMyPayrollRuns(employeeId: string | null) {
  return useQuery({
    queryKey: ["my-payroll", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_payroll_runs")
        .select("*")
        .eq("employee_id", employeeId)
        .order("pay_year", { ascending: false })
        .order("pay_month", { ascending: false });
      if (error) throw error;
      return (data || []) as HRPayrollRun[];
    },
  });
}

export function useUpsertPayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<HRPayrollRun>) => {
      const rolled = rollupPayroll(payload);
      const body: any = { ...rolled, updated_at: new Date().toISOString() };
      delete body.hr_employees;
      if ((payload as any).id) {
        const { error } = await (supabase as any).from("hr_payroll_runs").update(body).eq("id", (payload as any).id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("hr_payroll_runs").insert(body);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-payroll"] }),
  });
}

export function useMarkPayrollPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; paidBy: string | null; paymentMethod: string; paymentReference: string | null }) => {
      const { error } = await (supabase as any).from("hr_payroll_runs").update({
        status: "paid",
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: payload.paymentMethod,
        payment_reference: payload.paymentReference,
        paid_by: payload.paidBy,
        updated_at: new Date().toISOString(),
      }).eq("id", payload.id);
      if (error) throw error;
      try {
        await (supabase.functions as any).invoke("send-hr-notification", {
          body: { notification_type: "payslip", payroll_run_id: payload.id },
        });
      } catch (e) { /* non-blocking */ }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-payroll"] }),
  });
}

export function useApprovePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; approvedBy: string | null }) => {
      const { error } = await (supabase as any).from("hr_payroll_runs").update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: payload.approvedBy,
        updated_at: new Date().toISOString(),
      }).eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-payroll"] }),
  });
}

// -----------------------------------------------------------------------------
// Documents
// -----------------------------------------------------------------------------

export function useHRDocuments(employeeId?: string | null) {
  return useQuery({
    queryKey: ["hr-documents", employeeId ?? "all"],
    queryFn: async () => {
      let q = (supabase as any).from("hr_documents").select("*, hr_employees(full_name)");
      if (employeeId) q = q.eq("employee_id", employeeId);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as HRDocument[];
    },
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<HRDocument>) => {
      const { error } = await (supabase as any).from("hr_documents").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-documents"] }),
  });
}

export const STATUS_COLORS: Record<string, string> = {
  active:     "bg-emerald-100 text-emerald-700",
  on_leave:   "bg-amber-100 text-amber-700",
  suspended:  "bg-red-100 text-red-700",
  terminated: "bg-gray-100 text-gray-600",
  pending_manager: "bg-amber-100 text-amber-800",
  pending_hr:      "bg-blue-100 text-blue-700",
  approved:   "bg-emerald-100 text-emerald-700",
  rejected:   "bg-red-100 text-red-700",
  cancelled:  "bg-gray-100 text-gray-600",
  draft:      "bg-gray-100 text-gray-600",
  paid:       "bg-emerald-100 text-emerald-700",
};

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
