import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "./useAdmin";

export type PermissionsMap = Record<string, Record<string, boolean>>;

interface AdminPermissionsContextType {
  permissions: PermissionsMap;
  loading: boolean;
  adminUser: any | null;
  can: (module: string, action: string) => boolean;
  isSuperAdmin: boolean;
  refresh: () => void;
}

const AdminPermissionsContext = createContext<AdminPermissionsContextType>({
  permissions: {},
  loading: true,
  adminUser: null,
  can: () => false,
  isSuperAdmin: false,
  refresh: () => {},
});

export function AdminPermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAdmin();
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      // 1. Get admin user profile
      const { data: au } = await supabase
        .from("admin_users")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      setAdminUser(au);
      if (!au || !au.is_active) { setPermissions({}); setLoading(false); return; }

      // Super admin gets everything
      if (au.role === "super_admin") {
        // Build a full permissions map with everything true
        const { data: defs } = await supabase
          .from("admin_permission_definitions")
          .select("module, action")
          .eq("is_active", true);

        const map: PermissionsMap = {};
        (defs || []).forEach((d: any) => {
          if (!map[d.module]) map[d.module] = {};
          map[d.module][d.action] = true;
        });
        setPermissions(map);
        setLoading(false);
        return;
      }

      // 2. Get all permission definitions
      const { data: defs } = await supabase
        .from("admin_permission_definitions")
        .select("module, action")
        .eq("is_active", true);

      // 3. Get role defaults
      const { data: roleDefaults } = await supabase
        .from("admin_role_defaults")
        .select("module, action, granted")
        .eq("role", au.role);

      // 4. Get per-user overrides
      const { data: userPerms } = await supabase
        .from("admin_user_permissions")
        .select("module, action, granted")
        .eq("admin_user_id", au.id);

      // Build map: start with all false, apply role defaults, then user overrides
      const map: PermissionsMap = {};
      (defs || []).forEach((d: any) => {
        if (!map[d.module]) map[d.module] = {};
        map[d.module][d.action] = false;
      });

      (roleDefaults || []).forEach((rd: any) => {
        if (!map[rd.module]) map[rd.module] = {};
        map[rd.module][rd.action] = rd.granted;
      });

      (userPerms || []).forEach((up: any) => {
        if (!map[up.module]) map[up.module] = {};
        map[up.module][up.action] = up.granted;
      });

      setPermissions(map);
    } catch (e) {
      console.error("Failed to load permissions", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const can = useCallback((module: string, action: string): boolean => {
    if (!adminUser || !adminUser.is_active) return false;
    if (adminUser.role === "super_admin") return true;
    return permissions[module]?.[action] === true;
  }, [permissions, adminUser]);

  const isSuperAdmin = adminUser?.role === "super_admin";

  return (
    <AdminPermissionsContext.Provider value={{ permissions, loading, adminUser, can, isSuperAdmin, refresh: fetchPermissions }}>
      {children}
    </AdminPermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(AdminPermissionsContext);
}
