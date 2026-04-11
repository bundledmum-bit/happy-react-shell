import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

export function useIdleTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    toast.info("You've been signed out due to inactivity");
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, IDLE_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    resetTimer();
    EVENTS.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [resetTimer]);
}
