/**
 * Meta Pixel helper — thin, type-safe wrapper around the global `fbq`
 * function injected by the base code in index.html. Every call is
 * guarded so ad-blockers, SSR, or a blocked network never break the
 * app. No PII in any params — ids, counts, and amounts only.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type StandardEvent =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Subscribe"
  | "StartTrial"
  | "Schedule"
  | "CustomizeProduct"
  | "Lead"
  | "CompleteRegistration"
  | "Contact";

function safeFbq(...args: unknown[]): void {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq(...args);
    }
  } catch {
    /* ad-blocker or SSR — silently ignore */
  }
}

export function track(event: StandardEvent, params?: Record<string, unknown>): void {
  if (params) safeFbq("track", event, params);
  else safeFbq("track", event);
}

export function trackCustom(name: string, params?: Record<string, unknown>): void {
  if (params) safeFbq("trackCustom", name, params);
  else safeFbq("trackCustom", name);
}

/**
 * Fire an event only once per browser session for a given key. Guards
 * against double-counting moments-of-truth (Purchase, Subscribe,
 * CompleteRegistration) when the user refreshes or back-navigates.
 */
const FIRE_ONCE_NAMESPACE = "bm_meta_pixel_fired_";
export function trackOnce(
  storageKey: string,
  event: StandardEvent,
  params?: Record<string, unknown>,
): void {
  try {
    if (typeof window === "undefined") return;
    const k = FIRE_ONCE_NAMESPACE + storageKey;
    if (window.sessionStorage.getItem(k)) return;
    window.sessionStorage.setItem(k, "1");
  } catch {
    /* private-browsing or quota — still fire, just without idempotency */
  }
  track(event, params);
}

/** Convenience: naira money payload with the defaults Meta expects. */
export function moneyPayload(valueNaira: number, extra: Record<string, unknown> = {}) {
  return { value: Math.round(Number(valueNaira) || 0), currency: "NGN", ...extra };
}
