import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X, Shield } from "lucide-react";
import { useAdminUser, hasPermission } from "@/hooks/useAdminPermissions";

const ROLES = ["super_admin", "admin", "editor", "order_manager", "viewer", "custom"];
const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", admin: "Admin", editor: "Editor",
  order_manager: "Order Manager", viewer: "Viewer", custom: "Custom",
};
const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700", admin: "bg-blue-100 text-blue-700",
  editor: "bg-green-100 text-green-700", order_manager: "bg-yellow-100 text-yellow-700",
  viewer: "bg-gray-100 text-gray-700", custom: "bg-orange-100 text-orange-700",
};

const SECTIONS = [
  "dashboard", "products", "bundles", "orders", "delivery",
  "content", "blog", "referrals", "analytics", "settings",
  "users", "media", "activity_log",
];
const ACTIONS = ["view", "create", "edit", "delete"];

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { data: currentAdmin } = useAdminUser();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_users").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("admin_users").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Updated"); },
  });

  if (!hasPermission(currentAdmin, "users", "view")) {
    return <div className="text-center py-20 text-text-med">You don't have permission to access this page.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="pf text-2xl font-bold">Admin Users</h1>
        {hasPermission(currentAdmin, "users", "create") && (
          <button onClick={() => { setEditUser(null); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep">
            <Plus className="w-4 h-4" /> Invite Admin
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-med">User</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Role</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Active</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Last Login</th>
                <th className="px-4 py-3 text-right font-semibold text-text-med">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((u: any) => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-sm font-bold text-forest">
                        {u.display_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div className="font-semibold">{u.display_name}</div>
                        <div className="text-text-light text-xs">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ROLE_COLORS[u.role] || ""}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => {
                      if (u.auth_user_id === currentAdmin?.auth_user_id) return;
                      toggleActive.mutate({ id: u.id, is_active: !u.is_active });
                    }}
                      className={`w-10 h-5 rounded-full relative transition-colors ${u.is_active ? "bg-forest" : "bg-border"} ${u.auth_user_id === currentAdmin?.auth_user_id ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground shadow transition-transform ${u.is_active ? "left-5" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-light">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {hasPermission(currentAdmin, "users", "edit") && u.auth_user_id !== currentAdmin?.auth_user_id && (
                      <button onClick={() => { setEditUser(u); setShowForm(true); }}
                        className="px-3 py-1 rounded text-xs font-semibold border border-border hover:bg-muted">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <UserForm user={editUser} onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); }} />
      )}
    </div>
  );
}

function UserForm({ user, onClose, onSaved }: { user: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    email: user?.email || "",
    display_name: user?.display_name || "",
    role: user?.role || "viewer",
    custom_permissions: user?.custom_permissions || {},
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.email || !form.display_name) { toast.error("Email and name required"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const { error } = await supabase.from("admin_users").update({
          display_name: form.display_name,
          role: form.role,
          custom_permissions: form.role === "custom" ? form.custom_permissions : {},
        }).eq("id", user.id);
        if (error) throw error;
        toast.success("User updated");
      } else {
        // For new users, we need to create the auth user first via signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: crypto.randomUUID().slice(0, 16) + "Aa1!",
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create auth user");

        const { error } = await supabase.from("admin_users").insert({
          auth_user_id: authData.user.id,
          email: form.email,
          display_name: form.display_name,
          role: form.role,
          custom_permissions: form.role === "custom" ? form.custom_permissions : {},
        });
        if (error) throw error;
        toast.success("Admin invited! They'll receive an email to set their password.");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-[100] flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg mx-4 mb-10">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="pf text-lg font-bold flex items-center gap-2"><Shield className="w-5 h-5" />{isEdit ? "Edit Admin" : "Invite Admin"}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-med block mb-1">Email</label>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              disabled={isEdit} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background disabled:opacity-50" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-med block mb-1">Display Name</label>
            <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-med block mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          {form.role === "custom" && (
            <div>
              <label className="text-xs font-semibold text-text-med block mb-2">Custom Permissions</label>
              <div className="max-h-60 overflow-y-auto border border-border rounded-lg p-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left pb-2">Section</th>
                      {ACTIONS.map(a => <th key={a} className="text-center pb-2 capitalize">{a}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {SECTIONS.map(sec => (
                      <tr key={sec} className="border-t border-border">
                        <td className="py-1.5 capitalize">{sec.replace("_", " ")}</td>
                        {ACTIONS.map(act => (
                          <td key={act} className="text-center py-1.5">
                            <input type="checkbox"
                              checked={!!(form.custom_permissions[sec]?.[act])}
                              onChange={e => {
                                const cp = { ...form.custom_permissions };
                                cp[sec] = { ...cp[sec], [act]: e.target.checked };
                                setForm(f => ({ ...f, custom_permissions: cp }));
                              }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-forest text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving..." : isEdit ? "Update" : "Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
