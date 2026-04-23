import { Navigate } from "react-router-dom";

/**
 * Legacy route: the new subscription flow happens entirely on
 * /subscriptions (public, no login required). Redirect any old
 * bookmarks / draft links there.
 */
export default function NewSubscription() {
  return <Navigate to="/subscriptions" replace />;
}
