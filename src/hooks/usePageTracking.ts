import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, initSession } from "@/lib/analytics";

/**
 * Hook to track page views on route changes.
 * Place this in the root App component or layout.
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    initSession();
    trackPageView();
  }, [location.pathname]);
}
