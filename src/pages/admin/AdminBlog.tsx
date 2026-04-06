import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editPost, setEditPost] = useState<any>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("blog_posts").update({
        is_published,
        published_at: is_published ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog"] }); toast.success("Updated"); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="pf text-2xl font-bold">Blog Posts</h1>
        <button onClick={() => { setEditPost(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading...</div>
      ) : (
        <div className="space-y-3">
          {(posts || []).map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{p.title}</div>
                <div className="text-text-light text-xs">{p.slug} · {p.author}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => togglePublish.mutate({ id: p.id, is_published: !p.is_published })}
                  className={`px-3 py-1 rounded text-xs font-semibold ${p.is_published ? "bg-green-100 text-green-700" : "bg-muted text-text-light"}`}>
                  {p.is_published ? "Published" : "Draft"}
                </button>
                <button onClick={() => { setEditPost(p); setShowForm(true); }}
                  className="px-3 py-1 rounded text-xs font-semibold border border-border hover:bg-muted">Edit</button>
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
  const [form, setForm] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    excerpt: post?.excerpt || "",
    body: post?.body || "",
    is_published: post?.is_published || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title || !form.body) { toast.error("Title and body required"); return; }
    setSaving(true);
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const data = { ...form, slug, published_at: form.is_published ? new Date().toISOString() : null };
    try {
      if (isEdit) {
        const { error } = await supabase.from("blog_posts").update(data).eq("id", post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(data);
        if (error) throw error;
      }
      toast.success(isEdit ? "Post updated" : "Post created");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-[100] flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl mx-4 mb-10">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="pf text-lg font-bold">{isEdit ? "Edit Post" : "New Post"}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title"
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background font-semibold" />
          <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="slug-goes-here"
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Short excerpt..."
            rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Full article body (markdown)"
            rows={12} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background font-mono" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
            Publish immediately
          </label>
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
