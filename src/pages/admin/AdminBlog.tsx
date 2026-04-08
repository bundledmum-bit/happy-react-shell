import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X, Copy, Trash2, RotateCcw } from "lucide-react";
import BulkActionsBar from "@/components/admin/BulkActionsBar";
import TrashTabs from "@/components/admin/TrashTabs";
import SEOEditor from "@/components/admin/SEOEditor";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editPost, setEditPost] = useState<any>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [trashTab, setTrashTab] = useState<"active" | "trash">("active");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      if (action === "publish") await supabase.from("blog_posts").update({ is_published: true, published_at: new Date().toISOString() }).in("id", ids);
      else if (action === "unpublish") await supabase.from("blog_posts").update({ is_published: false }).in("id", ids);
      else if (action === "trash") await supabase.from("blog_posts").update({ is_published: false, deleted_at: new Date().toISOString() }).in("id", ids);
      else if (action === "restore") await supabase.from("blog_posts").update({ deleted_at: null }).in("id", ids);
      else if (action === "delete_permanent") await supabase.from("blog_posts").delete().in("id", ids);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog"] }); setSelected(new Set()); toast.success("Done"); },
  });

  const duplicatePost = async (p: any) => {
    const { id, created_at, updated_at, deleted_at, published_at, ...rest } = p;
    await supabase.from("blog_posts").insert({ ...rest, title: `${rest.title} (Copy)`, slug: `${rest.slug}-copy-${Date.now()}`, is_published: false });
    queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
    toast.success("Duplicated");
  };

  const allPosts = posts || [];
  const activePosts = allPosts.filter((p: any) => !p.deleted_at);
  const trashedPosts = allPosts.filter((p: any) => !!p.deleted_at);
  const displayList = trashTab === "active" ? activePosts : trashedPosts;

  const toggleSelect = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const allSelected = displayList.length > 0 && displayList.every((p: any) => selected.has(p.id));

  const bulkActions = trashTab === "active"
    ? [{ label: "Publish", value: "publish" }, { label: "Unpublish", value: "unpublish" }, { label: "Move to Trash", value: "trash", destructive: true }]
    : [{ label: "Restore", value: "restore" }, { label: "Delete Permanently", value: "delete_permanent", destructive: true }];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="pf text-2xl font-bold">Blog Posts</h1>
        <button onClick={() => { setEditPost(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <TrashTabs activeTab={trashTab} onTabChange={t => { setTrashTab(t); setSelected(new Set()); }} activeCount={activePosts.length} trashCount={trashedPosts.length} />

      <BulkActionsBar selectedCount={selected.size} actions={bulkActions}
        onApply={a => { const ids = Array.from(selected); if (a === "delete_permanent" && !confirm("Permanently delete?")) return; bulkMutation.mutate({ ids, action: a }); }}
        onSelectAll={() => setSelected(new Set(displayList.map((p: any) => p.id)))}
        onDeselectAll={() => setSelected(new Set())} totalCount={displayList.length} allSelected={allSelected} />

      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading...</div>
      ) : (
        <div className="space-y-3">
          {displayList.map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-text-light text-xs">{p.slug} · {p.author} · {p.scheduled_for ? `📅 Scheduled: ${new Date(p.scheduled_for).toLocaleDateString()}` : ""}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {trashTab === "active" ? (
                  <>
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${p.is_published ? "bg-green-100 text-green-700" : "bg-muted text-text-light"}`}>
                      {p.is_published ? "Published" : "Draft"}
                    </span>
                    <button onClick={() => { setEditPost(p); setShowForm(true); }} className="px-3 py-1 rounded text-xs font-semibold border border-border hover:bg-muted">Edit</button>
                    <button onClick={() => duplicatePost(p)} className="p-1 rounded hover:bg-muted"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => bulkMutation.mutate({ ids: [p.id], action: "trash" })} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => bulkMutation.mutate({ ids: [p.id], action: "restore" })} className="p-1 rounded hover:bg-forest/10 text-forest"><RotateCcw className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { if (confirm("Permanently delete?")) bulkMutation.mutate({ ids: [p.id], action: "delete_permanent" }); }} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <BlogForm post={editPost} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["admin-blog"] }); }} />}
    </div>
  );
}

function BlogForm({ post, onClose, onSaved }: { post: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!post;
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const [form, setForm] = useState({
    title: post?.title || "", slug: post?.slug || "", excerpt: post?.excerpt || "", body: post?.body || "",
    is_published: post?.is_published || false, scheduled_for: post?.scheduled_for || "",
    meta_title: post?.meta_title || "", meta_description: post?.meta_description || "", og_image_url: post?.og_image_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [publishMode, setPublishMode] = useState<"draft" | "now" | "schedule">(
    post?.scheduled_for ? "schedule" : post?.is_published ? "now" : "draft"
  );

  const handleSave = async () => {
    if (!form.title || !form.body) { toast.error("Title and body required"); return; }
    setSaving(true);
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const data: any = {
      title: form.title, slug, excerpt: form.excerpt, body: form.body,
      meta_title: form.meta_title || null, meta_description: form.meta_description || null, og_image_url: form.og_image_url || null,
      is_published: publishMode === "now", published_at: publishMode === "now" ? new Date().toISOString() : null,
      scheduled_for: publishMode === "schedule" ? form.scheduled_for : null,
    };
    try {
      if (isEdit) { const { error } = await supabase.from("blog_posts").update(data).eq("id", post.id); if (error) throw error; }
      else { const { error } = await supabase.from("blog_posts").insert(data); if (error) throw error; }
      toast.success(isEdit ? "Updated" : "Created");
      onSaved();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-[100] flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl mx-4 mb-10">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="pf text-lg font-bold">{isEdit ? "Edit Post" : "New Post"}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {(["content", "seo"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold capitalize ${activeTab === t ? "bg-background border border-b-0 border-border" : "text-text-light"}`}>
              {t === "seo" ? "SEO" : t}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {activeTab === "content" ? (
            <>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background font-semibold" />
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="slug-goes-here"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Short excerpt..." rows={2}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Full article body (markdown)" rows={12}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background font-mono" />

              <div>
                <label className="text-xs font-semibold text-text-med block mb-2">Publishing</label>
                <div className="flex gap-2">
                  {(["draft", "now", "schedule"] as const).map(m => (
                    <button key={m} onClick={() => setPublishMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize ${publishMode === m ? "border-forest bg-forest-light text-forest" : "border-border text-text-med"}`}>
                      {m === "now" ? "Publish Now" : m === "schedule" ? "📅 Schedule" : "Draft"}
                    </button>
                  ))}
                </div>
                {publishMode === "schedule" && (
                  <input type="datetime-local" value={form.scheduled_for ? form.scheduled_for.slice(0, 16) : ""}
                    onChange={e => setForm(f => ({ ...f, scheduled_for: e.target.value }))}
                    className="mt-2 border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                )}
              </div>
            </>
          ) : (
            <SEOEditor metaTitle={form.meta_title} metaDescription={form.meta_description} ogImageUrl={form.og_image_url}
              onChange={(field, value) => setForm(f => ({ ...f, [field]: value }))}
              contentTitle={form.title} contentDescription={form.excerpt} />
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-forest text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
