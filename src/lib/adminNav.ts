import type { AdminNavItem } from "@/hooks/useAdminPermissionsContext";

export interface ResolvedAdminNavItem extends AdminNavItem {
  resolvedPath: string;
  accessKey: string;
}

const ADMIN_PATH_ALIASES: Record<string, string> = {
  "/admin/orders/all": "/admin/orders",
  "/admin/orders/paid": "/admin/orders?payment=paid",
  "/admin/orders/pending": "/admin/orders?payment=pending",
  "/admin/orders/returns": "/admin/orders?status=returned",
  "/admin/analytics/orders": "/admin/analytics?tab=orders-report",
  "/admin/analytics/order-lines": "/admin/analytics?tab=order-lines",
  "/admin/analytics/customers": "/admin/analytics?tab=customers",
  "/admin/analytics/quiz": "/admin/analytics?tab=quiz",
  "/admin/content/homepage": "/admin/settings?tab=Homepage",
  "/admin/content/pages": "/admin/pages",
  "/admin/content/faqs": "/admin/content?tab=faqs",
  "/admin/content/testimonials": "/admin/content?tab=testimonials",
  "/admin/content/settings": "/admin/settings",
  "/admin/content/site-settings": "/admin/settings",
};

export function normalizeAdminNavPath(path: string) {
  return ADMIN_PATH_ALIASES[path] ?? path;
}

export function getAdminRouteAccessKey(pathname: string, search = "") {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  switch (pathname) {
    case "/admin/orders": {
      if (params.get("status") === "returned") return "orders_returns";
      if (params.get("payment") === "paid") return "orders_paid";
      if (params.get("payment") === "pending") return "orders_pending";
      return "orders";
    }
    case "/admin/analytics": {
      const tab = params.get("tab");
      if (tab === "orders-report") return "analytics_orders";
      if (tab === "order-lines") return "analytics_order_lines";
      if (tab === "customers") return "analytics_customers";
      if (tab === "quiz") return "analytics_quiz";
      return "analytics";
    }
    case "/admin/content": {
      const tab = params.get("tab");
      if (tab === "faqs") return "content_faqs";
      if (tab === "testimonials") return "content_testimonials";
      return "content";
    }
    case "/admin/pages":
      return "content_pages";
    case "/admin/settings":
      return params.get("tab") === "Homepage" ? "content_homepage" : "settings";
    default:
      return pathname;
  }
}

export function getCurrentAdminAccessKey(pathname: string, search: string) {
  return getAdminRouteAccessKey(pathname, search);
}

export function resolveAdminNavItem(item: AdminNavItem): ResolvedAdminNavItem {
  const resolvedPath = normalizeAdminNavPath(item.path);
  const url = new URL(resolvedPath, "https://admin.local");

  return {
    ...item,
    resolvedPath,
    accessKey: getAdminRouteAccessKey(url.pathname, url.search),
  };
}
