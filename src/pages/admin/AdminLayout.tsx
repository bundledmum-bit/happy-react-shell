import { useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { Package, ShoppingBag, ClipboardList, Truck, MessageSquare, Settings, BarChart3, Gift, LogOut, LayoutDashboard, FileText } from "lucide-react";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/bundles", label: "Bundles", icon: ShoppingBag },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/delivery", label: "Delivery", icon: Truck },
  { to: "/admin/content", label: "Content", icon: MessageSquare },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/referrals", label: "Referrals", icon: Gift },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { isAdmin, loading, signOut, user } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/admin/login");
  }, [loading, isAdmin, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl">🌿 Loading...</div></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-border flex flex-col flex-shrink-0 fixed h-full z-50">
        <div className="p-4 border-b border-border">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="pf font-bold text-forest text-sm">BundledMum Admin</span>
          </Link>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV.map(item => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors mx-2 rounded-lg ${isActive ? "bg-forest-light text-forest font-semibold" : "text-text-med hover:bg-muted"}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="text-[10px] text-text-light truncate mb-1">{user?.email}</div>
          <button onClick={() => { signOut(); navigate("/admin/login"); }}
            className="flex items-center gap-1.5 text-xs text-text-med hover:text-destructive transition-colors">
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen">
        <div className="p-6 max-w-[1200px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
