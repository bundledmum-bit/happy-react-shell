import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  let sid = sessionStorage.getItem("bm-session-id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("bm-session-id", sid);
  }
  return sid;
}

function getReferralSource(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("utm_source") || null;
  } catch {
    return null;
  }
}

export function trackEvent(eventType: string, eventData?: Record<string, unknown>) {
  const payload = {
    event_type: eventType,
    session_id: getSessionId(),
    page_url: window.location.pathname,
    referral_source: getReferralSource(),
    event_data: (eventData || null) as any,
  };

  // Fire and forget
  supabase.from("analytics_events").insert([payload]).then(({ error }) => {
    if (error) console.error("Analytics error:", error);
  });
}

export { getSessionId, getReferralSource };
