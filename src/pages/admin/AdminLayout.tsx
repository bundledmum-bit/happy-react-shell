import { useEffect, useState, useCallback } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminUser, canViewSection } from "@/hooks/useAdminPermissions";
import { subscribeToAllChanges } from "@/lib/realtime";
import {
  Package, ShoppingBag, ClipboardList, Truck, MessageSquare, Settings,
  BarChart3, Gift, LogOut, LayoutDashboard, FileText, Users, Image, Bell,
  Search, X, Menu, ChevronLeft,
} from "lucide-react";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, section: "dashboard", exact: true },
  { to: "/admin/products", label: "Products", icon: Package, section: "products" },
  { to: "/admin/bundles", label: "Bundles", icon: ShoppingBag, section: "bundles" },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList, section: "orders" },
  { to: "/admin/delivery", label: "Delivery", icon: Truck, section: "delivery" },
  { to: "/admin/content", label: "Content", icon: MessageSquare, section: "content" },
  { to: "/admin/blog", label: "Blog", icon: FileText, section: "blog" },
  { to: "/admin/media", label: "Media", icon: Image, section: "media" },
  { to: "/admin/referrals", label: "Referrals", icon: Gift, section: "referrals" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, section: "analytics" },
  { to: "/admin/users", label: "Users", icon: Users, section: "users" },
  { to: "/admin/settings", label: "Settings", icon: Settings, section: "settings" },
];

export default function AdminLayout() {
  const { isAdmin, loading, signOut, user } = useAdmin();
  const { data: adminUser } = useAdminUser();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Realtime sync
  useEffect(() => {
    const unsub = subscribeToAllChanges((_table, keys) => {
      keys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
    });
    return unsub;
  }, [queryClient]);

  // Notifications
  useEffect(() => {
    if (!adminUser) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(data || []);
    };
    fetchNotifications();

    const channel = supabase.channel("admin-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, () => {
        fetchNotifications();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [adminUser]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/admin/login");
  }, [loading, isAdmin, navigate]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await supabase.from("admin_notifications").update({ is_read: true }).eq("id", n.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-2xl text-white">🌿 Loading...</div></div>;
  if (!isAdmin) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const visibleNav = NAV.filter(item => canViewSection(adminUser, item.section));

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed h-full z-50 flex flex-col bg-slate-900 text-white transition-transform lg:translate-x-0 w-56 flex-shrink-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-bold text-sm text-coral">BundledMum</span>
          </Link>
          <button className="lg:hidden text-slate-400" onClick={() => setMobileOpen(false)}>
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {visibleNav.map(item => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && item.to !== "/admin";
            const activeExact = item.exact && location.pathname === item.to;
            const active = item.exact ? activeExact : isActive;
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors mx-2 rounded-lg ${active ? "bg-coral/20 text-coral font-semibold" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-coral/20 flex items-center justify-center text-xs font-bold text-coral">
              {adminUser?.display_name?.charAt(0) || user?.email?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{adminUser?.display_name || "Admin"}</div>
              <div className="text-[10px] text-slate-400 truncate">{adminUser?.role?.replace("_", " ") || "admin"}</div>
            </div>
          </div>
          <button onClick={() => { signOut(); navigate("/admin/login"); }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-56 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <button onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-xs text-text-light hover:bg-muted flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5" />
            <span>Search... </span>
            <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded hidden sm:inline">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-muted rounded-lg">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-coral text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Notifications dropdown */}
        {showNotifications && (
          <div className="fixed top-12 right-4 z-50 w-80 bg-card border border-border rounded-xl shadow-lg max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              <button onClick={markAllRead} className="text-xs text-forest font-semibold">Mark all read</button>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-light">No notifications</div>
            ) : (
              notifications.map(n => (
                <Link key={n.id} to={n.link || "#"} onClick={() => setShowNotifications(false)}
                  className={`block p-3 border-b border-border hover:bg-muted/50 ${!n.is_read ? "bg-forest/5" : ""}`}>
                  <div className="text-xs font-semibold">{n.title}</div>
                  <div className="text-[10px] text-text-light mt-0.5">{n.message}</div>
                  <div className="text-[9px] text-text-light mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Global search modal */}
        {searchOpen && (
          <div className="fixed inset-0 bg-foreground/50 z-[100] flex items-start justify-center pt-20" onClick={() => setSearchOpen(false)}>
            <div className="bg-card border border-border rounded-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <Search className="w-4 h-4 text-text-light" />
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products, orders, blog posts..."
                  className="flex-1 text-sm bg-transparent outline-none" />
                <button onClick={() => setSearchOpen(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 text-xs text-text-light">
                {searchQuery.length < 2 ? "Type at least 2 characters to search..." : (
                  <div className="space-y-2">
                    {visibleNav.map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg">
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-6 max-w-[1200px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
