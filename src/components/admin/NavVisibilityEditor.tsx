import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/useAdminPermissionsContext";
import { Eye, EyeOff, Save, Loader2 } from "lucide-react";

interface NavVisibilityEditorProps {
  userId: string;
  userRole: string;
  userName: string;
}

interface NavItemRow {
  nav_key: string;
  label: string;
  icon: string | null;
  path: string;
  parent_key: string | null;
  display_order: number;
}

export default function NavVisibilityEditor({ userId, userRole, userName }: NavVisibilityEditorProps) {
  const { adminUser: currentAdmin } = usePermissions();
  const [allNavItems, setAllNavItems] = useState<NavItemRow[]>([]);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [roleNavKeys, setRoleNavKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isCustom = userRole === "custom";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Fetch all active nav items
      const { data: items } = await supabase
        .from("admin_nav_items")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      setAllNavItems(items || []);

      if (isCustom) {
        // Fetch user's current visibility
        const { data: userNav } = await supabase
          .from("admin_user_nav_visibility")
          .select("*")
          .eq("admin_user_id", userId);

        const vis: Record<string, boolean> = {};
        (items || []).forEach(i => { vis[i.nav_key] = false; });
        (userNav || []).forEach((uv: any) => { vis[uv.nav_key] = uv.visible; });
        setVisibility(vis);
      } else {
        // For non-custom roles, compute what get_admin_nav would return
        // We simulate by checking which nav items require permissions the role has
        // Simplest: just call get_admin_nav impersonating... but we can't.
        // Instead show all items and mark which ones the role grants via role defaults
        const { data: roleDefaults } = await supabase
          .from("admin_role_defaults")
          .select("module, action, granted")
          .eq("role", userRole);

        const grantedPerms = new Set<string>();
        (roleDefaults || []).forEach((rd: any) => {
          if (rd.granted) grantedPerms.add(`${rd.module}.${rd.action}`);
        });

        // Match nav items to their required permissions
        const { data: navWithPerms } = await supabase
          .from("admin_nav_items")
          .select("nav_key, requires_permission_module, requires_permission_action")
          .eq("is_active", true);

        const keys: string[] = [];
        (navWithPerms || []).forEach((n: any) => {
          if (!n.requires_permission_module) {
            keys.push(n.nav_key); // No permission needed (dashboard)
          } else if (grantedPerms.has(`${n.requires_permission_module}.${n.requires_permission_action}`)) {
            keys.push(n.nav_key);
          }
        });
        setRoleNavKeys(keys);
      }
      setLoading(false);
    };
    load();
  }, [userId, userRole, isCustom]);

  // Group nav items: parents first, then children under parents
  const grouped = useMemo(() => {
    const parents = allNavItems.filter(i => !i.parent_key).sort((a, b) => a.display_order - b.display_order);
    return parents.map(p => ({
      ...p,
      children: allNavItems.filter(i => i.parent_key === p.nav_key).sort((a, b) => a.display_order - b.display_order),
    }));
  }, [allNavItems]);

  const toggleVisibility = (navKey: string, parentKey: string | null) => {
    setVisibility(prev => {
      const next = { ...prev, [navKey]: !prev[navKey] };
      // If turning OFF a parent, turn off all children
      if (prev[navKey] && !parentKey) {
        const children = allNavItems.filter(i => i.parent_key === navKey);
        children.forEach(c => { next[c.nav_key] = false; });
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const upsertData = allNavItems.map(item => ({
        admin_user_id: userId,
        nav_key: item.nav_key,
        visible: visibility[item.nav_key] ?? false,
        set_by: currentAdmin?.id || null,
        set_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("admin_user_nav_visibility")
        .upsert(upsertData, { onConflict: "admin_user_id,nav_key" });

      if (error) throw error;
      toast.success(`Nav menu updated for ${userName}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-xs text-text-light py-4">Loading nav items...</div>;

  // Non-custom role: read-only view
  if (!isCustom) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-text-light bg-muted/50 p-3 rounded-lg">
          <Eye className="w-4 h-4 text-forest" />
          <span>Nav access is controlled by the <strong className="capitalize">{userRole.replace("_", " ")}</strong> role. Change the role to Custom to customise access.</span>
        </div>
        <div className="space-y-1">
          {grouped.map(parent => {
            const hasAccess = roleNavKeys.includes(parent.nav_key);
            return (
              <div key={parent.nav_key}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${hasAccess ? "text-foreground" : "text-text-light line-through opacity-50"}`}>
                  {hasAccess ? <Eye className="w-3.5 h-3.5 text-forest" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="font-medium">{parent.label}</span>
                  <span className="text-[10px] text-text-light ml-auto">{parent.path}</span>
                </div>
                {parent.children.map(child => {
                  const childAccess = roleNavKeys.includes(child.nav_key);
                  return (
                    <div key={child.nav_key} className={`flex items-center gap-2 px-3 py-1 ml-5 rounded text-xs ${childAccess ? "text-foreground" : "text-text-light line-through opacity-50"}`}>
                      {childAccess ? <Eye className="w-3 h-3 text-forest" /> : <EyeOff className="w-3 h-3" />}
                      <span>{child.label}</span>
                      <span className="text-[10px] text-text-light ml-auto">{child.path}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Custom role: editable toggles
  return (
    <div className="space-y-3">
      <div className="text-xs text-text-light bg-muted/50 p-3 rounded-lg">
        Toggle which nav items this user can see. Parents control children — disabling a parent hides all sub-pages.
      </div>
      <div className="space-y-0.5">
        {grouped.map(parent => {
          const parentVisible = visibility[parent.nav_key] ?? false;
          return (
            <div key={parent.nav_key}>
              <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={parentVisible}
                  onChange={() => toggleVisibility(parent.nav_key, null)}
                  className="w-4 h-4 rounded border-border text-forest focus:ring-forest accent-forest"
                />
                <span className="text-sm font-medium flex-1">{parent.label}</span>
                <span className="text-[10px] text-text-light">{parent.path}</span>
              </label>
              {parent.children.length > 0 && (
                <div className="ml-6 space-y-0.5">
                  {parent.children.map(child => {
                    const childVisible = visibility[child.nav_key] ?? false;
                    return (
                      <label key={child.nav_key}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${parentVisible ? "hover:bg-muted/50 cursor-pointer" : "opacity-40 cursor-not-allowed"}`}>
                        <input
                          type="checkbox"
                          checked={childVisible && parentVisible}
                          onChange={() => parentVisible && toggleVisibility(child.nav_key, parent.nav_key)}
                          disabled={!parentVisible}
                          className="w-3.5 h-3.5 rounded border-border text-forest focus:ring-forest accent-forest disabled:opacity-50"
                        />
                        <span className="text-xs flex-1">{child.label}</span>
                        <span className="text-[10px] text-text-light">{child.path}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-forest text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-forest-deep transition-colors">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving..." : "Save Nav Access"}
      </button>
    </div>
  );
}
