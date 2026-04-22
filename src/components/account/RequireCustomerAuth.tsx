import { Navigate, useLocation } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

/**
 * Gate for all /account/* routes except /account/login.
 * - While the session is being resolved, render a small loading
 *   state rather than flashing to the login page.
 * - Once resolved, either show children or redirect to
 *   /account/login?returnTo=<current path>.
 */
export default function RequireCustomerAuth({ children }: { children: React.ReactNode }) {
  const { loading, isLoggedIn } = useCustomerAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen pt-[68px] flex items-center justify-center">
        <div className="text-xs text-text-light">Checking your session…</div>
      </div>
    );
  }
  if (!isLoggedIn) {
    const returnTo = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/account/login?returnTo=${returnTo}`} replace />;
  }
  return <>{children}</>;
}
