import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/**
 * Hook to track page views on route changes.
 * Place this in the root App component or layout.
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);
}
