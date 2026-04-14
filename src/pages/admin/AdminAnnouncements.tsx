import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  link_text: string | null;
  bg_color: string;
  text_color: string;
  emoji: string | null;
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  target_pages: string[] | null;
  display_order: number;
  created_at: string;
}

const EMPTY: Omit<Announcement, "id" | "created_at"> = {
  title: "",
  message: "",
  link_url: "",
  link_text: "",
  bg_color: "#2D6A4F",
  text_color: "#FFFFFF",
  emoji: "",
  is_active: true,
  priority: 0,
  starts_at: null,
  ends_at: null,
  target_pages: [],
  display_order: 0,
};

export default function AdminAnnouncements() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<Announcement> | null>(null);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("announcements")
        .select("*")
        .order("priority", { ascending: false })
        .order("display_order");
      if (error) throw error;
      return (data || []) as Announcement[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (ann: Partial<Announcement>) => {
      const payload = {
        title: ann.title,
        message: ann.message,
        link_url: ann.link_url || null,
        link_text: ann.link_text || null,
        bg_color: ann.bg_color,
        text_color: ann.text_color,
        emoji: ann.emoji || null,
        is_active: ann.is_active,
        priority: ann.priority || 0,
        starts_at: ann.starts_at || null,
        ends_at: ann.ends_at || null,
        target_pages: ann.target_pages?.length ? ann.target_pages : null,
        display_order: ann.display_order || 0,
      };

      if (ann.id) {
        const { error } = await (supabase.from as any)("announcements").update(payload).eq("id", ann.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from as any)("announcements").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setEditing(null);
      toast.success("Announcement saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase.from as any)("announcements").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isScheduleActive = (ann: Announcement) => {
    const now = new Date();
    if (ann.starts_at && new Date(ann.starts_at) > now) return false;
    if (ann.ends_at && new Date(ann.ends_at) < now) return false;
    return ann.is_active;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="pf text-2xl font-bold">Announcements</h1>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white"
          style={{ backgroundColor: "#F4845F" }}
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing.id ? "Edit" : "New"} Announcement</h2>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Title (internal)</label>
              <input value={editing.title || ""} onChange={e => setEditing({ ...editing, title: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" placeholder="e.g. Summer Sale" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Message *</label>
              <input value={editing.message || ""} onChange={e => setEditing({ ...editing, message: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" placeholder="Free delivery on all orders above ₦50,000!" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Emoji</label>
                <input value={editing.emoji || ""} onChange={e => setEditing({ ...editing, emoji: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" placeholder="🎉" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Priority</label>
                <input type="number" value={editing.priority ?? 0} onChange={e => setEditing({ ...editing, priority: parseInt(e.target.value) || 0 })}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Link URL</label>
                <input value={editing.link_url || ""} onChange={e => setEditing({ ...editing, link_url: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" placeholder="/bundles" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Link Text</label>
                <input value={editing.link_text || ""} onChange={e => setEditing({ ...editing, link_text: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" placeholder="Shop now" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={editing.bg_color || "#2D6A4F"}
                    onChange={e => setEditing({ ...editing, bg_color: e.target.value })}
                    className="w-10 h-8 rounded border border-input cursor-pointer" />
                  <input value={editing.bg_color || "#2D6A4F"} onChange={e => setEditing({ ...editing, bg_color: e.target.value })}
                    className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background font-mono" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={editing.text_color || "#FFFFFF"}
                    onChange={e => setEditing({ ...editing, text_color: e.target.value })}
                    className="w-10 h-8 rounded border border-input cursor-pointer" />
                  <input value={editing.text_color || "#FFFFFF"} onChange={e => setEditing({ ...editing, text_color: e.target.value })}
                    className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background font-mono" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Starts At</label>
                <input type="datetime-local" value={editing.starts_at ? editing.starts_at.slice(0, 16) : ""}
                  onChange={e => setEditing({ ...editing, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Ends At</label>
                <input type="datetime-local" value={editing.ends_at ? editing.ends_at.slice(0, 16) : ""}
                  onChange={e => setEditing({ ...editing, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Pages (comma-separated, leave empty for all)</label>
              <input value={(editing.target_pages || []).join(", ")}
                onChange={e => setEditing({ ...editing, target_pages: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" placeholder="/, /bundles, /shop" />
            </div>

            {/* Preview */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Preview</label>
              <div className="rounded-lg px-4 py-2 text-center text-[13px] font-semibold"
                style={{ backgroundColor: editing.bg_color || "#2D6A4F", color: editing.text_color || "#FFFFFF" }}>
                {editing.emoji && <span className="mr-1.5">{editing.emoji}</span>}
                {editing.message || "Your announcement message"}
                {editing.link_text && <span className="underline ml-1.5">{editing.link_text}</span>}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditing(null)}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold border border-border">
                Cancel
              </button>
              <button onClick={() => saveMutation.mutate(editing)}
                disabled={!editing.message}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#2D6A4F" }}>
                <Save className="w-3 h-3 inline mr-1" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>
      ) : !announcements?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm mb-2">No announcements yet</p>
          <p className="text-xs">Create your first announcement to display a banner across your storefront.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => {
            const live = isScheduleActive(ann);
            return (
              <div key={ann.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: ann.bg_color, color: ann.text_color }}>
                    {ann.emoji || "📢"}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold truncate">{ann.title || ann.message}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${live ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {live ? "Live" : ann.is_active ? "Scheduled" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{ann.message}</p>
                  {(ann.starts_at || ann.ends_at) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {ann.starts_at && `From: ${new Date(ann.starts_at).toLocaleDateString()}`}
                      {ann.starts_at && ann.ends_at && " · "}
                      {ann.ends_at && `Until: ${new Date(ann.ends_at).toLocaleDateString()}`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleActive.mutate({ id: ann.id, is_active: !ann.is_active })}
                    className="p-2 rounded-lg hover:bg-muted transition-colors" title={ann.is_active ? "Deactivate" : "Activate"}>
                    {ann.is_active ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => setEditing(ann)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors">
                    Edit
                  </button>
                  <button onClick={() => { if (confirm("Delete this announcement?")) deleteMutation.mutate(ann.id); }}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
