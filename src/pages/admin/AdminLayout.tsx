import { useEffect, useState, useMemo, useCallback } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminPermissionsProvider, usePermissions } from "@/hooks/useAdminPermissionsContext";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { useQuery } from "@tanstack/react-query";
import {
  Package, ShoppingBag, ClipboardList, Truck, MessageSquare, Settings,
  BarChart3, Gift, LogOut, LayoutDashboard, FileText, Users, Image, Bell,
  Search, X, Menu, ChevronLeft, MessageCircleQuestion, Workflow,
  type LucideIcon,
} from "lucide-react";
import { Tag, Boxes, MapPin, FileText as PageIcon } from "lucide-react";
import logoWhite from "@/assets/logos/BM-LOGO-WHITE.svg";
import iconCoral from "@/assets/logos/BM-ICON-CORAL.svg";

// Map icon name strings from DB to lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Package, Boxes, ShoppingBag, ClipboardList, Users, Tag,
  Gift, Truck, MapPin, MessageSquare, FileText, Image, MessageCircleQuestion,
  Workflow, BarChart3, Settings,
  PageIcon, // alias
};

function getIcon(iconName: string | null): LucideIcon {
  if (!iconName) return Package;
  return ICON_MAP[iconName] || Package;
}

interface NavItemFromDB {
  nav_key: string;
  label: string;
  icon: string | null;
  path: string;
  parent_key: string | null;
  display_order: number;
}

function AdminLayoutInner() {
  const { isAdmin, loading, signOut, user } = useAdmin();
  const { can, adminUser, isSuperAdmin } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  
  useIdleTimeout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch nav items exclusively from get_admin_nav RPC
  const { data: dbNavItems } = useQuery({
    queryKey: ["admin-nav-items", adminUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_nav");
      if (error) throw error;
      return (data as unknown as NavItemFromDB[]) || [];
    },
    enabled: !!adminUser,
  });

  // Build visible nav exclusively from DB results, grouped by parent
  const { topItems, childrenMap } = useMemo(() => {
    if (!dbNavItems) return { topItems: [], childrenMap: {} as Record<string, typeof mapped> };
    const sorted = [...dbNavItems].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const mapped = sorted.map(item => ({
      to: item.path,
      label: item.label,
      icon: getIcon(item.icon),
      exact: item.path === "/admin",
      navKey: item.nav_key,
      parentKey: item.parent_key,
    }));
    const top = mapped.filter(i => !i.parentKey);
    const children: Record<string, typeof mapped> = {};
    for (const item of mapped) {
      if (item.parentKey) {
        if (!children[item.parentKey]) children[item.parentKey] = [];
        children[item.parentKey].push(item);
      }
    }
    return { topItems: top, childrenMap: children };
  }, [dbNavItems]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = useCallback((key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Auto-open group containing the active route
  useEffect(() => {
    for (const [parentKey, kids] of Object.entries(childrenMap)) {
      if (kids.some(k => location.pathname.startsWith(k.to))) {
        setOpenGroups(prev => ({ ...prev, [parentKey]: true }));
      }
    }
  }, [location.pathname, childrenMap]);

  // flat list for search
  const visibleNav = useMemo(() => {
    if (!dbNavItems) return [];
    return [...dbNavItems]
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(item => ({
        to: item.path,
        label: item.label,
        icon: getIcon(item.icon),
        exact: item.path === "/admin",
        navKey: item.nav_key,
      }));
  }, [dbNavItems]);

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1A4A33 100%)" }}>
      <div className="text-center">
        <img src={iconCoral} alt="BundledMum" className="w-12 h-12 mx-auto mb-3 animate-pulse" />
        <div className="text-primary-foreground/70 text-sm font-body">Loading admin...</div>
      </div>
    </div>
  );
  if (!isAdmin) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen flex bg-muted/30">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed h-full z-50 flex flex-col transition-transform lg:translate-x-0 w-60 flex-shrink-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: "linear-gradient(180deg, #2D6A4F 0%, #1A4A33 100%)" }}>
        
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img src={logoWhite} alt="BundledMum" className="h-7 w-auto" />
          </Link>
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setMobileOpen(false)}>
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-4 mb-2">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[2px]">Menu</span>
          </div>
          {topItems.map(item => {
            const kids = childrenMap[item.navKey];
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && item.to !== "/admin";
            const active = item.exact ? location.pathname === item.to : isActive;
            const hasChildren = kids && kids.length > 0;
            const groupOpen = openGroups[item.navKey] ?? false;

            if (!hasChildren) {
              return (
                <Link key={item.to} to={item.to}
                  className={`flex items-center gap-2.5 px-5 py-2 text-[13px] transition-all mx-2 rounded-lg font-body ${
                    active
                      ? "bg-white/15 text-white font-semibold shadow-sm"
                      : "text-white/60 hover:bg-white/8 hover:text-white/90"
                  }`}>
                  <item.icon className={`w-4 h-4 ${active ? "text-coral" : ""}`} />
                  {item.label}
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-coral" />}
                </Link>
              );
            }

            const anyChildActive = kids.some(k => location.pathname.startsWith(k.to));
            return (
              <div key={item.navKey}>
                <button onClick={() => toggleGroup(item.navKey)}
                  className={`flex items-center gap-2.5 px-5 py-2 text-[13px] transition-all mx-2 rounded-lg font-body w-[calc(100%-16px)] ${
                    anyChildActive
                      ? "bg-white/10 text-white font-semibold"
                      : "text-white/60 hover:bg-white/8 hover:text-white/90"
                  }`}>
                  <item.icon className={`w-4 h-4 ${anyChildActive ? "text-coral" : ""}`} />
                  {item.label}
                  <ChevronLeft className={`ml-auto w-3.5 h-3.5 transition-transform ${groupOpen ? "-rotate-90" : "rotate-0"}`} />
                </button>
                {groupOpen && (
                  <div className="ml-4">
                    {kids.map(child => {
                      const childActive = location.pathname.startsWith(child.to);
                      return (
                        <Link key={child.to} to={child.to}
                          className={`flex items-center gap-2.5 px-5 py-1.5 text-[12px] transition-all mx-2 rounded-lg font-body ${
                            childActive
                              ? "bg-white/15 text-white font-semibold shadow-sm"
                              : "text-white/40 hover:bg-white/8 hover:text-white/80"
                          }`}>
                          <child.icon className={`w-3.5 h-3.5 ${childActive ? "text-coral" : ""}`} />
                          {child.label}
                          {childActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-coral" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #F4845F, #D4613C)" }}>
              {adminUser?.display_name?.charAt(0) || user?.email?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{adminUser?.display_name || "Admin"}</div>
              <div className="text-[10px] text-white/40 truncate capitalize">{adminUser?.role?.replace("_", " ") || "admin"}</div>
            </div>
          </div>
          <button onClick={() => { signOut(); navigate("/admin/login"); }}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-coral transition-colors font-body">
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-60 min-h-screen">
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5 text-foreground" />
          </button>

          <button onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-xs text-text-light hover:bg-muted flex-1 max-w-xs transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded hidden sm:inline font-mono">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/" target="_blank" className="hidden sm:flex items-center gap-1 text-[11px] text-text-light hover:text-forest transition-colors font-body">
              <span>View Store</span>
              <span>↗</span>
            </Link>
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[9px] rounded-full flex items-center justify-center font-bold"
                  style={{ background: "#F4845F" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {showNotifications && (
          <div className="fixed top-12 right-4 z-50 w-80 bg-card border border-border rounded-xl shadow-lg max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              <button onClick={markAllRead} className="text-xs text-forest font-semibold hover:underline">Mark all read</button>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-light">No notifications</div>
            ) : (
              notifications.map(n => (
                <Link key={n.id} to={n.link || "#"} onClick={() => setShowNotifications(false)}
                  className={`block p-3 border-b border-border hover:bg-muted/50 transition-colors ${!n.is_read ? "bg-forest/5" : ""}`}>
                  <div className="text-xs font-semibold">{n.title}</div>
                  <div className="text-[10px] text-text-light mt-0.5">{n.message}</div>
                  <div className="text-[9px] text-text-light mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </Link>
              ))
            )}
          </div>
        )}

        {searchOpen && (
          <div className="fixed inset-0 bg-foreground/50 z-[100] flex items-start justify-center pt-20" onClick={() => setSearchOpen(false)}>
            <div className="bg-card border border-border rounded-xl w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <Search className="w-4 h-4 text-text-light" />
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products, orders, blog posts..."
                  className="flex-1 text-sm bg-transparent outline-none" />
                <button onClick={() => setSearchOpen(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 text-xs text-text-light">
                {searchQuery.length < 2 ? "Type at least 2 characters to search..." : (
                  <div className="space-y-1">
                    {visibleNav.filter(item =>
                      item.label.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-2 p-2.5 hover:bg-muted rounded-lg transition-colors">
                        <item.icon className="w-4 h-4 text-forest" />
                        <span className="font-semibold">{item.label}</span>
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

export default function AdminLayout() {
  return (
    <AdminPermissionsProvider>
      <AdminLayoutInner />
    </AdminPermissionsProvider>
  );
}
