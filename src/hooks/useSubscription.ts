import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionSettings {
  subscription_enabled: boolean;
  discount_pct: number;
  free_delivery_enabled: boolean;
  weekly_enabled: boolean;
  biweekly_enabled: boolean;
  monthly_enabled: boolean;
  subscription_page_heading: string;
  subscription_page_subtext: string;
  subscription_badge_label: string;
  min_order_value_naira: number;
  edit_window_days: number;
  min_deliveries: number;
  delivery_day_changeable: boolean;
}

export type Frequency = "weekly" | "biweekly" | "monthly";

export const FREQUENCY_DAYS: Record<Frequency, number> = {
  weekly: 7, biweekly: 14, monthly: 30,
};

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export const WEEKDAYS: Array<{ v: string; short: string; long: string }> = [
  { v: "monday",    short: "Mon", long: "Monday" },
  { v: "tuesday",   short: "Tue", long: "Tuesday" },
  { v: "wednesday", short: "Wed", long: "Wednesday" },
  { v: "thursday",  short: "Thu", long: "Thursday" },
  { v: "friday",    short: "Fri", long: "Friday" },
  { v: "saturday",  short: "Sat", long: "Saturday" },
  { v: "sunday",    short: "Sun", long: "Sunday" },
];

export const WEEKDAY_LABEL: Record<string, string> = Object.fromEntries(
  WEEKDAYS.map(d => [d.v, d.long])
);

/**
 * Subscription settings come from the `subscription_settings` table as
 * string values ({setting_key, setting_value, value_type, ...}). The
 * get_subscription_settings RPC returns them as a flat JSON object. All
 * values still arrive as strings, so cast by key on the client.
 */
function parseSettings(raw: any): SubscriptionSettings {
  const s = raw || {};
  const b = (k: string, d: boolean) => {
    const v = s[k];
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v === "true";
    return d;
  };
  const num = (k: string, d: number) => {
    const v = s[k];
    const p = typeof v === "number" ? v : parseFloat(v);
    return isFinite(p) ? p : d;
  };
  const str = (k: string, d: string) => {
    const v = s[k];
    return typeof v === "string" ? v : (v == null ? d : String(v));
  };
  return {
    subscription_enabled: b("subscription_enabled", false),
    discount_pct:         num("discount_pct", 0),
    free_delivery_enabled: b("free_delivery_enabled", true),
    weekly_enabled:        b("weekly_enabled", true),
    biweekly_enabled:      b("biweekly_enabled", true),
    monthly_enabled:       b("monthly_enabled", true),
    subscription_page_heading: str("subscription_page_heading", "Never run out of the essentials."),
    subscription_page_subtext: str("subscription_page_subtext", "Subscribe to the products you use every week and we'll deliver them on a schedule that works for you."),
    subscription_badge_label: str("subscription_badge_label", "Subscribe & Save"),
    min_order_value_naira:  num("min_order_value_naira", 0),
    edit_window_days:       num("edit_window_days", 2),
    min_deliveries:         num("min_deliveries", 3),
    delivery_day_changeable: b("delivery_day_changeable", true),
  };
}

export function useSubscriptionSettings() {
  return useQuery({
    queryKey: ["subscription-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_subscription_settings");
      if (error) throw error;
      return parseSettings(data);
    },
    staleTime: 60_000,
  });
}

export interface SubscriptionDraftItem {
  product_id: string;
  brand_id: string;
  quantity: number;
  frequency: Frequency;
  unit_price: number;       // NAIRA
  product_name: string;
  brand_name: string;
  image_url?: string | null;
  size_variant?: string | null;
}

export interface SubscriptionDraft {
  items: SubscriptionDraftItem[];
  frequency: Frequency;
  delivery_day: string;
  subtotal_per_delivery: number;
  discount_pct: number;
  total_per_delivery: number;
}

export const DRAFT_KEY = "bm_subscription_draft";
export const RESULT_KEY = "bm_subscription_result";

export function readDraft(): SubscriptionDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function writeDraft(payload: SubscriptionDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

export function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

export const fmtN = (naira: number): string => `₦${Math.round(naira || 0).toLocaleString("en-NG")}`;

/** Min/max deliveries per cycle by frequency. */
export const DELIVERY_COUNT_LIMITS: Record<Frequency, { min: number; max: number }> = {
  weekly:   { min: 4, max: 13 },
  biweekly: { min: 4, max: 7 },
  monthly:  { min: 4, max: 6 },
};

/** Next occurrence of the given weekday (monday..sunday) strictly AFTER today. */
export function nextDeliveryDate(weekday: string, from: Date = new Date()): Date {
  const map: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  const target = map[weekday.toLowerCase()];
  if (target == null) {
    const d = new Date(from); d.setDate(d.getDate() + 1); return d;
  }
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const diff = (target - d.getDay() + 7) % 7 || 7; // never same-day — always next occurrence
  d.setDate(d.getDate() + diff);
  return d;
}

/** Date of the Nth delivery (1-indexed) counting from `firstDeliveryDate`. */
export function projectCycleEnd(firstDeliveryDate: Date, frequency: Frequency, count: number): Date {
  const d = new Date(firstDeliveryDate);
  d.setDate(d.getDate() + FREQUENCY_DAYS[frequency] * Math.max(0, count - 1));
  return d;
}

/** "nappies-wipes" → "Nappies & Wipes". */
export function prettySubcategory(s: string | null | undefined): string {
  if (!s) return "Other";
  return s
    .split(/[-_]/g)
    .map(p => p.length ? p[0].toUpperCase() + p.slice(1) : p)
    .join(" ")
    .replace(/\band\b/gi, "&");
}
