import { useEffect, useState, useMemo } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminPermissionsProvider, usePermissions } from "@/hooks/useAdminPermissionsContext";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { getCurrentAdminAccessKey, resolveAdminNavItem } from "@/lib/adminNav";
import {
  Package, ShoppingBag, ClipboardList, Truck, MessageSquare, Settings,
  BarChart3, Gift, LogOut, LayoutDashboard, FileText, Users, Image, Bell,
  Search, X, Menu, ChevronLeft, MessageCircleQuestion, Workflow,
  ChevronDown, ChevronRight, LucideIcon, Boxes, MapPin, Tag, Activity,
  Home, HelpCircle, Star, Globe,
} from "lucide-react";
import { toast } from "sonner";
import logoWhite from "@/assets/logos/BM-LOGO-WHITE.svg";
import iconCoral from "@/assets/logos/BM-ICON-CORAL.svg";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Package, ShoppingBag, ClipboardList, Truck, MessageSquare,
  Settings, BarChart3, Gift, FileText, Users, Image, MessageCircleQuestion,
  Workflow, Tag, Boxes, MapPin, Activity, Home, HelpCircle, Star, Globe,
  Search, Bell, LogOut, Menu, ChevronLeft, ChevronDown, ChevronRight,
};

function getIcon(iconName: string | null): LucideIcon {
  if (!iconName) return LayoutDashboard;
  return ICON_MAP[iconName] || LayoutDashboard;
}

function AdminLayoutInner() {
  const { isAdmin, loading, signOut, user } = useAdmin();
  const { adminUser, navItems, navLoading } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  useIdleTimeout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const resolvedNavItems = useMemo(() => navItems.map(resolveAdminNavItem), [navItems]);
  const currentAccessKey = useMemo(
    () => getCurrentAdminAccessKey(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const navTree = useMemo(() => {
    const topLevel = resolvedNavItems.filter(i => !i.parent_key).sort((a, b) => a.display_order - b.display_order);
    return topLevel.map(parent => ({
      ...parent,
      children: resolvedNavItems
        .filter(i => i.parent_key === parent.nav_key)
        .sort((a, b) => a.display_order - b.display_order),
    }));
  }, [resolvedNavItems]);

  useEffect(() => {
    if (loading || navLoading || !isAdmin || !adminUser) return;
    if (adminUser.role !== "custom") return;
    if (location.pathname === "/admin") return;

    const allowedAccessKeys = new Set(resolvedNavItems.map(item => item.accessKey));
    if (allowedAccessKeys.size > 0 && !allowedAccessKeys.has(currentAccessKey)) {
      toast.error("You don't have access to that page");
      navigate("/admin", { replace: true });
    }
  }, [currentAccessKey, resolvedNavItems, loading, navLoading, isAdmin, adminUser, navigate, location.pathname]);

  useEffect(() => {
    setExpandedGroups(prev => {
      const next = { ...prev };
      navTree.forEach(group => {
        if (group.children.some(child => child.accessKey === currentAccessKey)) {
          next[group.nav_key] = true;
        }
      });
      return next;
    });
  }, [currentAccessKey, navTree]);

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

  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.search]);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await supabase.from("admin_notifications").update({ is_read: true }).eq("id", n.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (loading || navLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1A4A33 100%)" }}>
      <div className="text-center">
        <img src={iconCoral} alt="BundledMum" className="w-12 h-12 mx-auto mb-3 animate-pulse" />
        <div className="text-primary-foreground/70 text-sm font-body">Loading admin...</div>
      </div>
    </div>
  );
  if (!isAdmin) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const allNavFlat = resolvedNavItems;

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
          {navTree.map(item => {
            const Icon = getIcon(item.icon);
            const hasChildren = item.children.length > 0;
            const isExpanded = expandedGroups[item.nav_key] ?? false;
            const isActive = currentAccessKey === item.accessKey || item.children.some(child => child.accessKey === currentAccessKey);

            if (hasChildren) {
              return (
                <div key={item.nav_key} className="mb-0.5">
                  <div className={`mx-2 flex items-center rounded-lg transition-all ${
                    isActive
                      ? "bg-white/15 text-white font-semibold shadow-sm"
                      : "text-white/60 hover:bg-white/8 hover:text-white/90"
                  }`}>
                    <Link to={item.resolvedPath} className="flex min-w-0 flex-1 items-center gap-2.5 px-5 py-2 text-[13px] font-body">
                      <Icon className={`w-4 h-4 ${isActive ? "text-coral" : ""}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.nav_key)}
                      className="px-3 py-2 text-white/70 hover:text-white"
                      aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {item.children.map(child => {
                        const ChildIcon = getIcon(child.icon);
                        const childActive = currentAccessKey === child.accessKey;
                        return (
                          <Link key={child.nav_key} to={child.resolvedPath}
                            className={`flex items-center gap-2 px-4 py-1.5 text-[12px] transition-all mx-2 rounded-lg font-body ${
                              childActive
                                ? "bg-white/10 text-white font-semibold"
                                : "text-white/50 hover:bg-white/5 hover:text-white/80"
                            }`}>
                            <ChildIcon className={`w-3.5 h-3.5 ${childActive ? "text-coral" : ""}`} />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.nav_key} to={item.resolvedPath}
                className={`flex items-center gap-2.5 px-5 py-2 text-[13px] transition-all mx-2 rounded-lg font-body ${
                  isActive
                    ? "bg-white/15 text-white font-semibold shadow-sm"
                    : "text-white/60 hover:bg-white/8 hover:text-white/90"
                }`}>
                <Icon className={`w-4 h-4 ${isActive ? "text-coral" : ""}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-coral" />}
              </Link>
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
                  placeholder="Search admin pages..."
                  className="flex-1 text-sm bg-transparent outline-none" />
                <button onClick={() => setSearchOpen(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 text-xs text-text-light">
                {searchQuery.length < 2 ? "Type at least 2 characters to search..." : (
                  <div className="space-y-1">
                    {allNavFlat.filter(item =>
                      item.label.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(item => {
                      const NavIcon = getIcon(item.icon);
                      return (
                        <Link key={item.nav_key} to={item.resolvedPath} onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-2 p-2.5 hover:bg-muted rounded-lg transition-colors">
                          <NavIcon className="w-4 h-4 text-forest" />
                          <span className="font-semibold">{item.label}</span>
                        </Link>
                      );
                    })}
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
