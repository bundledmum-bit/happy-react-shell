import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Track the Supabase auth user id reactively. Returns `undefined` while the
 * initial session check is in flight, then the user id (or null) and keeps
 * updating on SIGNED_IN / SIGNED_OUT. Used to gate RLS-scoped queries so they
 * don't fire before auth.uid() is available (e.g. while a magic-link hash is
 * still being exchanged for a session).
 */
function useAuthUserId(): { userId: string | null; ready: boolean } {
  const [state, setState] = useState<{ userId: string | null; ready: boolean }>({ userId: null, ready: false });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({ userId: data.session?.user?.id ?? null, ready: true });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState({ userId: session?.user?.id ?? null, ready: true });
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return state;
}

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
          hr_departments!hr_employees_department_id_fkey (
            id,
            name
          )
        `)
        .order("full_name", { ascending: true });
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
        .select("*, hr_departments!hr_employees_department_id_fkey(name)")
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

/**
 * Current logged-in employee (single row, scoped by RLS via auth_user_id).
 *
 * Waits for the Supabase auth session to be confirmed before firing the
 * query. Without this gate, a magic-link arrival fires the query before the
 * URL hash has been exchanged for a session, so auth.uid() is NULL and RLS
 * returns no rows → user sees "Account not yet linked" incorrectly.
 *
 * Consumers use `{ data, isLoading }`. `isLoading` stays true until the
 * session check completes AND the query resolves.
 */
export function useMyEmployee() {
  const { userId, ready } = useAuthUserId();

  const q = useQuery({
    queryKey: ["my-hr-employee", userId ?? "anon"],
    enabled: ready && !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_employees")
        .select("*, hr_departments!hr_employees_department_id_fkey(name)")
        .eq("auth_user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as HREmployee | null;
    },
    staleTime: 30_000,
  });

  // Treat "auth not yet ready" and "signed in but query hasn't resolved" as
  // loading so the UI can show a spinner instead of the not-linked fallback.
  const isLoading = !ready || (!!userId && (q.isLoading || q.isFetching) && q.data === undefined);
  // Signed out → nothing to fetch, nothing to show.
  const data = (ready && !userId) ? null : (q.data as HREmployee | null | undefined);

  return { ...q, data, isLoading } as typeof q;
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
        .select("*, hr_employees(full_name, employee_id, department_id, hr_departments!hr_employees_department_id_fkey(name))");
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
    mutationFn: async (payload: { id: string; paidBy: string | null; paymentMethod: string; paymentReference: string | null; paymentDate?: string }) => {
      const { error } = await (supabase as any).from("hr_payroll_runs").update({
        status: "paid",
        payment_date: payload.paymentDate || new Date().toISOString().slice(0, 10),
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

export function useRejectPayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string }) => {
      const { error } = await (supabase as any).from("hr_payroll_runs").update({
        status: "draft",
        approved_at: null,
        approved_by: null,
        updated_at: new Date().toISOString(),
      }).eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-payroll"] }),
  });
}

export function useDeletePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("hr_payroll_runs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-payroll"] }),
  });
}

// ---------------------------------------------------------------------------
// DB calculators (Nigerian payroll + working days)
// ---------------------------------------------------------------------------

export interface PayrollCalculation {
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  bonus: number;
  gross_salary: number;
  employee_pension: number;
  nhf_deduction: number;
  paye_tax: number;
  total_deductions: number;
  net_salary: number;
  employer_pension: number;
  nsitf: number;
  itf: number;
  total_employer_cost: number;
  annual_gross: number;
  cra: number;
  annual_taxable_income: number;
  annual_paye: number;
  effective_tax_rate_pct: number;
}

/** Calls the DB-side Nigerian payroll calculator. All returned values are in NAIRA. */
export async function calculateEmployeePayroll(employeeId: string, bonusKobo = 0): Promise<PayrollCalculation> {
  const { data, error } = await (supabase as any).rpc("calculate_employee_payroll", {
    p_employee_id: employeeId,
    p_bonus: bonusKobo,
  });
  if (error) throw error;
  return data as PayrollCalculation;
}

/** Counts working days (excludes weekends AND Nigerian public holidays) via DB function. */
export async function countWorkingDays(startDate: string, endDate: string): Promise<number> {
  const { data, error } = await (supabase as any).rpc("count_working_days", {
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return Number(data) || 0;
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

// -----------------------------------------------------------------------------
// Job / salary history
// -----------------------------------------------------------------------------

export type JobHistoryChangeType =
  | "hire" | "salary_review" | "title_change" | "promotion"
  | "department_change" | "status_change" | "contract_change";

export interface HRJobHistory {
  id: string;
  employee_id: string;
  change_type: JobHistoryChangeType | string;
  effective_date: string;
  previous_job_title: string | null;
  new_job_title: string | null;
  previous_department_id: string | null;
  new_department_id: string | null;
  previous_employment_type: string | null;
  new_employment_type: string | null;
  previous_status: string | null;
  new_status: string | null;
  previous_basic: number | null;   // kobo
  new_basic: number | null;        // kobo
  previous_housing: number | null;
  new_housing: number | null;
  previous_transport: number | null;
  new_transport: number | null;
  previous_other: number | null;
  new_other: number | null;
  reason: string | null;
  recorded_by: string | null;
  created_at: string;
  prev_department?: { name: string } | null;
  new_department?: { name: string } | null;
}

export function useJobHistory(employeeId: string | null | undefined) {
  return useQuery({
    queryKey: ["hr-job-history", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_job_history")
        .select("*, new_department:hr_departments!new_department_id(name), prev_department:hr_departments!previous_department_id(name)")
        .eq("employee_id", employeeId)
        .order("effective_date", { ascending: false });
      if (error) throw error;
      return (data || []) as HRJobHistory[];
    },
  });
}

export function useInsertJobHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<HRJobHistory>) => {
      const body: any = { ...payload };
      delete body.prev_department;
      delete body.new_department;
      const { error } = await (supabase as any).from("hr_job_history").insert(body);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["hr-job-history", vars.employee_id] });
    },
  });
}

// -----------------------------------------------------------------------------
// Leave calendar — approved leaves within a month + public holidays
// -----------------------------------------------------------------------------

export function useApprovedLeavesInRange(startIso: string, endIso: string) {
  return useQuery({
    queryKey: ["hr-leave-calendar", startIso, endIso],
    enabled: !!startIso && !!endIso,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_leave_requests")
        .select("*, hr_employees!hr_leave_requests_employee_id_fkey(full_name, employee_id, department_id), hr_leave_types(name)")
        .eq("status", "approved")
        .gte("end_date", startIso)
        .lte("start_date", endIso);
      if (error) throw error;
      return (data || []) as HRLeaveRequest[];
    },
  });
}

export interface HRPublicHoliday { holiday_date: string; name: string }
export function usePublicHolidays(startIso: string, endIso: string) {
  return useQuery({
    queryKey: ["hr-public-holidays", startIso, endIso],
    enabled: !!startIso && !!endIso,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_public_holidays")
        .select("holiday_date, name")
        .gte("holiday_date", startIso)
        .lte("holiday_date", endIso);
      if (error) throw error;
      return (data || []) as HRPublicHoliday[];
    },
  });
}

// -----------------------------------------------------------------------------
// Employment letter (DB RPC)
// -----------------------------------------------------------------------------

export interface EmploymentLetterData {
  full_name: string;
  employee_id: string;
  job_title: string;
  department: string | null;
  employment_type: string;
  start_date: string;
  letter_date: string;
  years_of_service: string; // e.g. "2 years 3 months"
}

export async function generateEmploymentLetterData(employeeId: string): Promise<EmploymentLetterData> {
  const { data, error } = await (supabase as any).rpc("generate_employment_letter_data", {
    p_employee_id: employeeId,
  });
  if (error) throw error;
  return data as EmploymentLetterData;
}

// -----------------------------------------------------------------------------
// HR analytics dashboard
// -----------------------------------------------------------------------------

export interface HRAnalytics {
  active_headcount: number;
  on_leave_count: number;
  terminated_count: number;
  pending_leave_requests: number;
  current_month_net_payroll: number; // kobo
  current_month_employer_cost: number;
}

export function useHRAnalytics() {
  return useQuery({
    queryKey: ["hr-analytics"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("hr_analytics").select("*").single();
      if (error) throw error;
      return data as HRAnalytics;
    },
    staleTime: 60_000,
  });
}

export interface HRHeadcountByDept {
  department_id: string | null;
  department_name: string | null;
  active_count: number;
  on_leave_count: number;
  monthly_gross: number; // kobo
}

export function useHeadcountByDept() {
  return useQuery({
    queryKey: ["hr-headcount-by-department"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("hr_headcount_by_department").select("*");
      if (error) throw error;
      return (data || []) as HRHeadcountByDept[];
    },
    staleTime: 60_000,
  });
}

/** Last N months of paid payroll rows, minimal columns, for charts. */
export function useRecentPaidPayroll(limit = 50) {
  return useQuery({
    queryKey: ["hr-recent-paid-payroll", limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_payroll_runs")
        .select("pay_month, pay_year, net_salary, total_employer_cost, status, employee_id")
        .eq("status", "paid")
        .order("pay_year", { ascending: false })
        .order("pay_month", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as Array<{ pay_month: number; pay_year: number; net_salary: number; total_employer_cost: number; status: string; employee_id: string }>;
    },
    staleTime: 60_000,
  });
}

// -----------------------------------------------------------------------------
// Carry-over
// -----------------------------------------------------------------------------

export interface HRLeaveCarryover {
  id: string;
  employee_id: string;
  leave_type_id: string;
  from_year: number;
  to_year: number;
  carried_days: number;
  expiry_date: string | null;
  hr_employees?: { full_name: string } | null;
  hr_leave_types?: { name: string } | null;
}

export function useLeaveCarryover(toYear: number) {
  return useQuery({
    queryKey: ["hr-leave-carryover", toYear],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_leave_carryover")
        .select("*, hr_employees(full_name), hr_leave_types(name)")
        .eq("to_year", toYear);
      if (error) throw error;
      return (data || []) as HRLeaveCarryover[];
    },
  });
}

export function useProcessCarryover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { fromYear: number; maxCarryover: number }) => {
      const { data, error } = await (supabase as any).rpc("process_annual_leave_carryover", {
        p_from_year: payload.fromYear,
        p_max_carryover: payload.maxCarryover,
      });
      if (error) throw error;
      return data as { employees_processed: number; to_year: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-leave-carryover"] });
      qc.invalidateQueries({ queryKey: ["hr-leave-balances"] });
    },
  });
}

// -----------------------------------------------------------------------------
// Tasks
// -----------------------------------------------------------------------------

export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface HRTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus | string;
  priority: TaskPriority | string;
  due_date: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at?: string;
  assigned_to: string;
  assigned_by_admin: string | null;
  assigned_by_employee: string | null;
  assignee?: { id: string; full_name: string; employee_id: string } | null;
  assigner_emp?: { id?: string; full_name: string } | null;
  assigner_admin?: { id?: string; display_name: string } | null;
}

export interface HRTaskComment {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  author_admin_id: string | null;
  author_employee_id: string | null;
  author_emp?: { full_name: string } | null;
  author_admin?: { display_name: string } | null;
}

const TASK_SELECT = `
  id, title, description, status, priority, due_date,
  completed_at, completion_notes, created_at, updated_at,
  assigned_to, assigned_by_admin, assigned_by_employee,
  assignee:hr_employees!assigned_to(id, full_name, employee_id),
  assigner_emp:hr_employees!assigned_by_employee(id, full_name),
  assigner_admin:admin_users!assigned_by_admin(id, display_name)
`;

/** All non-cancelled tasks, for admin board / list views. */
export function useHRTasks() {
  return useQuery({
    queryKey: ["hr-tasks"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_tasks")
        .select(TASK_SELECT)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as HRTask[];
    },
    staleTime: 30_000,
  });
}

/** Tasks assigned TO the logged-in employee (portal "My Tasks"). */
export function useMyTasks(employeeId: string | null | undefined) {
  return useQuery({
    queryKey: ["my-hr-tasks", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_tasks")
        .select(TASK_SELECT)
        .eq("assigned_to", employeeId)
        .neq("status", "cancelled")
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as HRTask[];
    },
  });
}

/** Tasks the logged-in employee has assigned to their direct reports. */
export function useTasksAssignedByMe(employeeId: string | null | undefined) {
  return useQuery({
    queryKey: ["my-assigned-hr-tasks", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_tasks")
        .select(TASK_SELECT)
        .eq("assigned_by_employee", employeeId)
        .neq("status", "cancelled")
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as HRTask[];
    },
  });
}

export function useTaskComments(taskId: string | null | undefined) {
  return useQuery({
    queryKey: ["hr-task-comments", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_task_comments")
        .select("*, author_emp:hr_employees!author_employee_id(full_name), author_admin:admin_users!author_admin_id(display_name)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as HRTaskComment[];
    },
  });
}

/** Fire-and-forget notification helper. Never blocks or surfaces errors. */
async function notifyTask(notification_type: "task_assigned" | "task_completed", task_id: string) {
  try {
    await (supabase.functions as any).invoke("send-hr-notification", {
      body: { notification_type, task_id },
    });
  } catch { /* non-blocking */ }
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<HRTask>) => {
      const body: any = { ...payload };
      delete body.assignee;
      delete body.assigner_emp;
      delete body.assigner_admin;
      if (!body.status) body.status = "todo";
      if (!body.priority) body.priority = "medium";
      const { data, error } = await (supabase as any).from("hr_tasks").insert(body).select("id").single();
      if (error) throw error;
      const newId = data.id as string;

      // Notify assignee if this is an assignment from someone else:
      //   - any admin-created task, OR
      //   - a manager-created task where assigner != assignee
      // Self-created tasks (employee assigning to themselves) are skipped.
      const isAdminAssigned = !!body.assigned_by_admin;
      const isManagerAssignedToOther =
        !!body.assigned_by_employee && body.assigned_by_employee !== body.assigned_to;
      if (isAdminAssigned || isManagerAssignedToOther) {
        await notifyTask("task_assigned", newId);
      }
      return newId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-hr-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-assigned-hr-tasks"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<HRTask> & { id: string }) => {
      const body: any = { ...payload, updated_at: new Date().toISOString() };
      delete body.assignee;
      delete body.assigner_emp;
      delete body.assigner_admin;
      const { error } = await (supabase as any).from("hr_tasks").update(body).eq("id", payload.id);
      if (error) throw error;

      // Notify when the task is just marked done so HR / the assigner gets
      // a heads-up. Only fire on status transitions into 'done'.
      if (payload.status === "done") {
        await notifyTask("task_completed", payload.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-hr-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-assigned-hr-tasks"] });
    },
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { task_id: string; content: string; author_admin_id?: string | null; author_employee_id?: string | null }) => {
      const { error } = await (supabase as any).from("hr_task_comments").insert({
        task_id: payload.task_id,
        content: payload.content,
        author_admin_id: payload.author_admin_id ?? null,
        author_employee_id: payload.author_employee_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["hr-task-comments", vars.task_id] }),
  });
}

/** Employees whose line_manager_id = the given employee id. */
export function useDirectReports(managerEmployeeId: string | null | undefined) {
  return useQuery({
    queryKey: ["hr-direct-reports", managerEmployeeId],
    enabled: !!managerEmployeeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hr_employees")
        .select("id, full_name, employee_id, status, job_title")
        .eq("line_manager_id", managerEmployeeId)
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return (data || []) as Array<{ id: string; full_name: string; employee_id: string; status: string; job_title: string }>;
    },
  });
}

// -----------------------------------------------------------------------------
// Performance
// -----------------------------------------------------------------------------

export interface HREmployeePerformance {
  employee_id: string;
  full_name: string;
  job_title: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  on_time_tasks: number;
  completion_rate_pct: number;
  on_time_rate_pct: number;
  performance_score: number; // 0–100
  tasks_this_month: number;
  completed_this_month: number;
}

export function useEmployeePerformance() {
  return useQuery({
    queryKey: ["hr-employee-performance"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("hr_employee_performance").select("*");
      if (error) throw error;
      return (data || []) as HREmployeePerformance[];
    },
    staleTime: 60_000,
  });
}

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-300",
  high:   "bg-orange-100 text-orange-700 border-orange-300",
  medium: "bg-blue-100 text-blue-700 border-blue-300",
  low:    "bg-gray-100 text-gray-600 border-gray-300",
};
export const TASK_STATUS_COLORS: Record<string, string> = {
  todo:        "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  done:        "bg-emerald-100 text-emerald-700",
  cancelled:   "bg-gray-100 text-gray-500",
};
export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "To Do", in_progress: "In Progress", done: "Done", cancelled: "Cancelled",
};
