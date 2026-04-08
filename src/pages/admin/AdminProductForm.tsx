import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Plus, Trash2 } from "lucide-react";
import ProductImageManager from "@/components/admin/ProductImageManager";
import SEOEditor from "@/components/admin/SEOEditor";

interface Props {
  product: any | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ["baby", "mum", "both"];
const PRIORITIES = ["essential", "recommended", "nice-to-have"];
const BADGES = ["bestseller", "essential", "new", "popular", "mum-pick"];
const TIERS = ["starter", "standard", "premium"];

export default function AdminProductForm({ product, onClose, onSaved }: Props) {
  const isEdit = !!product;
  const [activeTab, setActiveTab] = useState<"details" | "brands" | "seo">("details");
  const [form, setForm] = useState({
    name: product?.name || "", slug: product?.slug || "", emoji: product?.emoji || "",
    description: product?.description || "", category: product?.category || "baby",
    priority: product?.priority || "essential", badge: product?.badge || "",
    display_order: product?.display_order || 0, is_active: product?.is_active ?? true,
    pack_count: product?.pack_count || "", material: product?.material || "",
    contents: product?.contents || "", allergen_info: product?.allergen_info || "",
    safety_info: product?.safety_info || "", rating: product?.rating || 4.5,
    review_count: product?.review_count || 0, gender_relevant: product?.gender_relevant || false,
    multiples_bump: product?.multiples_bump || 1.0, first_baby: product?.first_baby,
    why_included: product?.why_included || "",
    meta_title: product?.meta_title || "", meta_description: product?.meta_description || "", og_image_url: product?.og_image_url || "",
    scheduled_for: product?.scheduled_for || "",
  });

  const [brands, setBrands] = useState<any[]>(product?.brands?.map((b: any) => ({ ...b })) || []);
  const [saving, setSaving] = useState(false);
  const [publishMode, setPublishMode] = useState<"active" | "inactive" | "schedule">(
    product?.scheduled_for ? "schedule" : product?.is_active ? "active" : "inactive"
  );

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    if (!form.name || !form.description) { toast.error("Name and description are required"); return; }
    setSaving(true);
    try {
      const slug = form.slug || autoSlug(form.name);
      const productData = {
        name: form.name, slug, emoji: form.emoji || null, description: form.description,
        category: form.category, priority: form.priority, badge: form.badge || null,
        display_order: form.display_order, pack_count: form.pack_count || null,
        material: form.material || null, contents: form.contents || null,
        allergen_info: form.allergen_info || null, safety_info: form.safety_info || null,
        rating: form.rating, review_count: form.review_count, gender_relevant: form.gender_relevant,
        multiples_bump: form.multiples_bump, first_baby: form.first_baby,
        why_included: form.why_included || null,
        meta_title: form.meta_title || null, meta_description: form.meta_description || null, og_image_url: form.og_image_url || null,
        is_active: publishMode === "active",
        scheduled_for: publishMode === "schedule" ? form.scheduled_for : null,
      };

      let productId: string;
      if (isEdit) {
        const { error } = await supabase.from("products").update(productData).eq("id", product.id);
        if (error) throw error;
        productId = product.id;
      } else {
        const { data, error } = await supabase.from("products").insert(productData).select("id").single();
        if (error) throw error;
        productId = data.id;
      }

      if (isEdit) await supabase.from("brands").delete().eq("product_id", productId);
      if (brands.length > 0) {
        const brandRows = brands.map((b, i) => ({
          product_id: productId, brand_name: b.brand_name, price: b.price, tier: b.tier,
          is_default_for_tier: b.is_default_for_tier || false, size_variant: b.size_variant || null, display_order: i,
        }));
        const { error } = await supabase.from("brands").insert(brandRows);
        if (error) throw error;
      }

      toast.success(isEdit ? "Product updated!" : "Product created!");
      onSaved();
    } catch (e: any) { toast.error(e.message || "Failed to save"); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-[100] flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl mx-4 mb-10">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="pf text-lg font-bold">{isEdit ? "Edit Product" : "New Product"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {(["details", "brands", "seo"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold capitalize ${activeTab === t ? "bg-background border border-b-0 border-border" : "text-text-light"}`}>
              {t === "seo" ? "SEO" : t}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === "details" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: f.slug || autoSlug(e.target.value) }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Slug</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Emoji (fallback)</label>
                  <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-med block mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Badge</label>
                  <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                    <option value="">None</option>
                    {BADGES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Rating</label>
                  <input type="number" step="0.1" min="1" max="5" value={form.rating}
                    onChange={e => setForm(f => ({ ...f, rating: parseFloat(e.target.value) }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Order</label>
                  <input type="number" value={form.display_order}
                    onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>

              {/* Publishing */}
              <div>
                <label className="text-xs font-semibold text-text-med block mb-2">Publishing</label>
                <div className="flex gap-2">
                  {(["active", "inactive", "schedule"] as const).map(m => (
                    <button key={m} type="button" onClick={() => setPublishMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize ${publishMode === m ? "border-forest bg-forest-light text-forest" : "border-border text-text-med"}`}>
                      {m === "active" ? "Active Now" : m === "schedule" ? "📅 Schedule" : "Inactive"}
                    </button>
                  ))}
                </div>
                {publishMode === "schedule" && (
                  <input type="datetime-local" value={form.scheduled_for ? form.scheduled_for.slice(0, 16) : ""}
                    onChange={e => setForm(f => ({ ...f, scheduled_for: e.target.value }))}
                    className="mt-2 border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                )}
              </div>

              {isEdit ? (
                <ProductImageManager productId={product.id} />
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">💡 Save the product first, then you can upload images when editing it.</p>
                </div>
              )}
            </>
          )}

          {activeTab === "brands" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold">Brands</label>
                <button type="button" onClick={() => setBrands(b => [...b, { brand_name: "", price: 0, tier: "standard", is_default_for_tier: false }])}
                  className="flex items-center gap-1 text-xs text-forest font-semibold"><Plus className="w-3 h-3" /> Add Brand</button>
              </div>
              {brands.map((b, i) => (
                <div key={i} className="flex gap-2 mb-2 items-end">
                  <input placeholder="Brand name" value={b.brand_name}
                    onChange={e => setBrands(bs => bs.map((br, idx) => idx === i ? { ...br, brand_name: e.target.value } : br))}
                    className="flex-1 border border-input rounded-lg px-2 py-1.5 text-xs bg-background" />
                  <input type="number" placeholder="Price" value={b.price}
                    onChange={e => setBrands(bs => bs.map((br, idx) => idx === i ? { ...br, price: parseInt(e.target.value) || 0 } : br))}
                    className="w-24 border border-input rounded-lg px-2 py-1.5 text-xs bg-background" />
                  <select value={b.tier}
                    onChange={e => setBrands(bs => bs.map((br, idx) => idx === i ? { ...br, tier: e.target.value } : br))}
                    className="w-24 border border-input rounded-lg px-2 py-1.5 text-xs bg-background">
                    {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button type="button" onClick={() => setBrands(bs => bs.filter((_, idx) => idx !== i))}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              {brands.length === 0 && <p className="text-xs text-text-light">No brands added yet.</p>}
            </div>
          )}

          {activeTab === "seo" && (
            <SEOEditor metaTitle={form.meta_title} metaDescription={form.meta_description} ogImageUrl={form.og_image_url}
              onChange={(field, value) => setForm(f => ({ ...f, [field]: value }))}
              contentTitle={form.name} contentDescription={form.description} />
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-forest text-primary-foreground rounded-lg text-sm font-semibold hover:bg-forest-deep disabled:opacity-50">
            {saving ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
