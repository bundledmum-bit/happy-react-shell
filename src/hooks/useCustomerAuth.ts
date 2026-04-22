import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

/**
 * Lightweight auth hook for the storefront customer account system.
 * Storefront auth is completely separate from the admin auth flow —
 * this only reacts to Supabase auth sessions (no role gating).
 */
export function useCustomerAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  const user: User | null = session?.user ?? null;
  return { session, user, loading, isLoggedIn: !!session };
}
