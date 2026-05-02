import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// merch_* tables aren't in the generated supabase types yet; cast to any.
const supabase = supabaseTyped as any;
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, ArrowUp, ArrowDown, Trash2, Plus, X, Search, GripVertical,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useShopSections,
  useAdminSectionProducts,
  useCategoryPagePinsAdmin,
  useAddCategoryPagePin,
  useRemoveCategoryPagePin,
  useToggleCategoryPagePin,
  useReorderCategoryPagePins,
  type ShopVariant,
  type MerchSection,
} from "@/hooks/useMerchandising";
import { useProductCategories, type ProductCategory } from "@/hooks/useProductCategories";

type TopTab = ShopVariant | "categories";

const SHOPS: { key: ShopVariant; label: string }[] = [
  { key: "all", label: "All Shop" },
  { key: "baby", label: "Baby Shop" },
  { key: "mum", label: "Mum Shop" },
];

export default function AdminMerchandising() {
  const [tab, setTab] = useState<TopTab>("all");

  return (
    <div>
      <div className="mb-6">
        <h1 className="pf text-2xl font-bold">Merchandising</h1>
        <p className="text-text-med text-sm mt-1">
          Curate what shows on the Shop pages — choose categories, reorder them, and pick the products to feature.
        </p>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as TopTab)}>
        <TabsList>
          {SHOPS.map(s => (
            <TabsTrigger key={s.key} value={s.key}>{s.label}</TabsTrigger>
          ))}
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        {SHOPS.map(s => (
          <TabsContent key={s.key} value={s.key} className="mt-4">
            <ShopMerchPanel shop={s.key} />
          </TabsContent>
        ))}
        <TabsContent value="categories" className="mt-4">
          <CategoriesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ShopMerchPanel({ shop }: { shop: ShopVariant }) {
  const qc = useQueryClient();
  const { data: sections = [], isLoading } = useShopSections(shop, true);
  const { data: categories = [] } = useProductCategories();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => (a.section_order || 0) - (b.section_order || 0)),
    [sections],
  );
  const usedSlugs = new Set(sortedSections.map(s => s.category_slug));
  const availableCategories = categories.filter(c => !usedSlugs.has(c.slug));

  const updateSection = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<MerchSection> }) => {
      const { error } = await supabase.from("merch_shop_sections").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["merch_shop_sections", shop] }),
  });

  const removeSection = useMutation({
    mutationFn: async (id: string) => {
      // Remove section_products children first, then the section row.
      const section = sections.find(s => s.id === id);
      if (section) {
        await supabase
          .from("merch_section_products")
          .delete()
          .eq("shop", shop)
          .eq("category_slug", section.category_slug);
      }
      const { error } = await supabase.from("merch_shop_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merch_shop_sections", shop] });
      toast.success("Section removed");
    },
  });

  const addSection = useMutation({
    mutationFn: async (slug: string) => {
      const nextOrder = (sortedSections[sortedSections.length - 1]?.section_order || 0) + 1;
      const { error } = await supabase.from("merch_shop_sections").insert({
        shop,
        category_slug: slug,
        section_order: nextOrder,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merch_shop_sections", shop] });
      toast.success("Section added");
      setAddCategoryOpen(false);
    },
  });

  const swapOrder = useMutation({
    mutationFn: async ({ a, b }: { a: MerchSection; b: MerchSection }) => {
      // Two-step swap to satisfy the unique constraint.
      const { error: e1 } = await supabase.from("merch_shop_sections").update({ section_order: -1 }).eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("merch_shop_sections").update({ section_order: a.section_order }).eq("id", b.id);
      if (e2) throw e2;
      const { error: e3 } = await supabase.from("merch_shop_sections").update({ section_order: b.section_order }).eq("id", a.id);
      if (e3) throw e3;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["merch_shop_sections", shop] }),
  });

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = sortedSections[idx + dir];
    const me = sortedSections[idx];
    if (!me || !target) return;
    swapOrder.mutate({ a: me, b: target });
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="text-sm text-text-med">Loading…</div>
      ) : sortedSections.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-text-med mb-4">No sections yet. Add a category to get started.</p>
        </div>
      ) : (
        sortedSections.map((section, i) => (
          <SectionRow
            key={section.id}
            shop={shop}
            section={section}
            isFirst={i === 0}
            isLast={i === sortedSections.length - 1}
            expanded={expandedId === section.id}
            onToggle={() => setExpandedId(expandedId === section.id ? null : section.id)}
            onMoveUp={() => moveSection(i, -1)}
            onMoveDown={() => moveSection(i, 1)}
            onToggleActive={(v) => updateSection.mutate({ id: section.id, patch: { is_active: v } })}
            onLabelChange={(label) => updateSection.mutate({ id: section.id, patch: { section_label: label || null } })}
            onRemove={() => {
              if (confirm("Remove this section and all of its product picks?")) removeSection.mutate(section.id);
            }}
          />
        ))
      )}

      <div>
        <Button
          variant="outline"
          onClick={() => setAddCategoryOpen(true)}
          disabled={availableCategories.length === 0}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add category
        </Button>
        {availableCategories.length === 0 && (
          <span className="ml-3 text-xs text-text-light">All categories already added.</span>
        )}
      </div>

      <AddCategoryDialog
        open={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
        categories={availableCategories}
        onPick={(slug) => addSection.mutate(slug)}
      />
    </div>
  );
}

function SectionRow({
  shop, section, isFirst, isLast, expanded,
  onToggle, onMoveUp, onMoveDown, onToggleActive, onLabelChange, onRemove,
}: {
  shop: ShopVariant;
  section: MerchSection;
  isFirst: boolean;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleActive: (v: boolean) => void;
  onLabelChange: (label: string) => void;
  onRemove: () => void;
}) {
  const [labelDraft, setLabelDraft] = useState(section.section_label || "");
  const { data: products = [] } = useAdminSectionProducts(shop, section.category_slug, expanded);
  const productCount = products.length;

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="flex items-center gap-2 p-3">
        <button onClick={onToggle} className="p-1 text-text-med hover:text-foreground">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <GripVertical className="w-4 h-4 text-text-light" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {section.category?.icon && <span className="text-lg">{section.category.icon}</span>}
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{section.category?.name || section.category_slug}</div>
            <div className="text-[11px] text-text-light">order #{section.section_order}</div>
          </div>
        </div>

        <Input
          value={labelDraft}
          onChange={e => setLabelDraft(e.target.value)}
          onBlur={() => {
            if ((section.section_label || "") !== labelDraft) onLabelChange(labelDraft);
          }}
          placeholder="Custom label (optional)"
          className="h-8 text-xs w-40"
        />

        <span className="text-[11px] bg-muted px-2 py-0.5 rounded font-semibold text-text-med">
          {expanded ? `${productCount} pinned` : "—"}
        </span>

        <div className="flex items-center gap-1">
          <Switch checked={section.is_active} onCheckedChange={onToggleActive} />
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-30"
            title="Move up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-30"
            title="Move down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRemove} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Remove">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-4 bg-muted/20">
          <SectionProductsEditor shop={shop} section={section} />
        </div>
      )}
    </div>
  );
}

function SectionProductsEditor({ shop, section }: { shop: ShopVariant; section: MerchSection }) {
  const qc = useQueryClient();
  const slug = section.category_slug;
  const { data: rows = [], isLoading } = useAdminSectionProducts(shop, slug);
  const sorted = useMemo(
    () => [...rows].sort((a: any, b: any) => (a.product_order || 0) - (b.product_order || 0)),
    [rows],
  );
  const [addOpen, setAddOpen] = useState(false);

  const removeRow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("merch_section_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_merch_section_products", shop, slug] }),
  });

  const swap = useMutation({
    mutationFn: async ({ a, b }: { a: any; b: any }) => {
      // Two-step swap to avoid the unique constraint conflict.
      const { error: e1 } = await supabase.from("merch_section_products").update({ product_order: -1 }).eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("merch_section_products").update({ product_order: a.product_order }).eq("id", b.id);
      if (e2) throw e2;
      const { error: e3 } = await supabase.from("merch_section_products").update({ product_order: b.product_order }).eq("id", a.id);
      if (e3) throw e3;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_merch_section_products", shop, slug] }),
  });

  const addProduct = useMutation({
    mutationFn: async (productId: string) => {
      const next = (sorted[sorted.length - 1]?.product_order || 0) + 1;
      const { error } = await supabase.from("merch_section_products").insert({
        shop,
        category_slug: slug,
        product_id: productId,
        product_order: next,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_merch_section_products", shop, slug] });
      toast.success("Product added");
    },
  });

  const move = (idx: number, dir: -1 | 1) => {
    const target = sorted[idx + dir];
    const me = sorted[idx];
    if (!me || !target) return;
    swap.mutate({ a: me, b: target });
  };

  const pinnedIds = new Set(sorted.map((r: any) => r.product_id));

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="text-xs text-text-med">Loading products…</div>
      ) : sorted.length === 0 ? (
        <div className="text-xs text-text-med">
          No products pinned yet — the storefront will fall back to recent products in this category.
        </div>
      ) : (
        <div className="space-y-1">
          {sorted.map((row: any, i: number) => (
            <div key={row.id} className="flex items-center gap-2 bg-card border border-border rounded-lg p-2">
              <GripVertical className="w-4 h-4 text-text-light" />
              <span className="text-xl">{row.products?.emoji || "📦"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{row.products?.name || "Unknown product"}</div>
                <div className="text-[10px] text-text-light">order #{row.product_order}</div>
              </div>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
                title="Move up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === sorted.length - 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
                title="Move down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => removeRow.mutate(row.id)}
                className="p-1 rounded hover:bg-destructive/10 text-destructive"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="pt-1">
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add product
        </Button>
      </div>

      <AddProductDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        slug={slug}
        excludeIds={pinnedIds}
        onPick={(productId) => {
          addProduct.mutate(productId);
          setAddOpen(false);
        }}
      />
    </div>
  );
}

function AddCategoryDialog({
  open, onClose, categories, onPick,
}: {
  open: boolean;
  onClose: () => void;
  categories: Array<{ slug: string; name: string; icon: string | null }>;
  onPick: (slug: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = categories.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a category</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search categories…" className="pl-9" />
        </div>
        <div className="max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="text-xs text-text-med text-center py-6">No matches.</div>
          ) : (
            filtered.map(c => (
              <button
                key={c.slug}
                onClick={() => onPick(c.slug)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-left"
              >
                {c.icon && <span className="text-lg">{c.icon}</span>}
                <span className="text-sm font-semibold">{c.name}</span>
                <span className="text-[10px] text-text-light ml-auto">{c.slug}</span>
              </button>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------------
// Categories tab — pins per category page (drives /shop/[slug])
// ----------------------------------------------------------------------------

function CategoriesPanel() {
  const { data: categories = [], isLoading } = useProductCategories();
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const parentRank = (p: string | null) => {
      if (p === "baby") return 0;
      if (p === "mum") return 1;
      return 2;
    };
    return [...categories].sort((a, b) => {
      const pa = parentRank(a.parent_category);
      const pb = parentRank(b.parent_category);
      if (pa !== pb) return pa - pb;
      const sa = a.stage_order ?? Number.POSITIVE_INFINITY;
      const sb = b.stage_order ?? Number.POSITIVE_INFINITY;
      if (sa !== sb) return sa - sb;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [categories]);

  if (isLoading) {
    return <div className="text-sm text-text-med">Loading…</div>;
  }
  if (sorted.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-sm text-text-med">No categories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-med">
        Pin products to surface at the top of each <code>/shop/[category]</code> page. Pinned products appear first in the order set here; other products in the category appear below them, in their normal order.
      </p>
      {sorted.map(cat => (
        <CategoryRow
          key={cat.slug}
          category={cat}
          expanded={expandedSlug === cat.slug}
          onToggle={() => setExpandedSlug(expandedSlug === cat.slug ? null : cat.slug)}
        />
      ))}
    </div>
  );
}

function CategoryRow({
  category, expanded, onToggle,
}: {
  category: ProductCategory;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data: pins = [] } = useCategoryPagePinsAdmin(category.slug, expanded);
  const pinnedCount = pins.length;

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="flex items-center gap-2 p-3">
        <button onClick={onToggle} className="p-1 text-text-med hover:text-foreground">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {category.icon && <span className="text-lg">{category.icon}</span>}
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{category.name}</div>
            <div className="text-[11px] text-text-light">{category.slug}</div>
          </div>
        </div>
        <span className="text-[11px] bg-muted px-2 py-0.5 rounded font-semibold text-text-med">
          {expanded ? `${pinnedCount} pinned` : "—"}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-border p-4 bg-muted/20">
          <CategoryPinsEditor categorySlug={category.slug} />
        </div>
      )}
    </div>
  );
}

function CategoryPinsEditor({ categorySlug }: { categorySlug: string }) {
  const { data: rows = [], isLoading } = useCategoryPagePinsAdmin(categorySlug);
  const sorted = useMemo(
    () => [...rows].sort((a: any, b: any) => (a.product_order || 0) - (b.product_order || 0)),
    [rows],
  );
  const [addOpen, setAddOpen] = useState(false);

  const addPin = useAddCategoryPagePin();
  const removePin = useRemoveCategoryPagePin();
  const togglePin = useToggleCategoryPagePin();
  const reorderPins = useReorderCategoryPagePins();

  const move = (idx: number, dir: -1 | 1) => {
    const me = sorted[idx] as any;
    const target = sorted[idx + dir] as any;
    if (!me || !target) return;
    reorderPins.mutate({
      a: { id: me.id, product_order: me.product_order },
      b: { id: target.id, product_order: target.product_order },
      categorySlug,
    });
  };

  const pinnedIds = new Set(sorted.map((r: any) => r.product_id));

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="text-xs text-text-med">Loading products…</div>
      ) : sorted.length === 0 ? (
        <div className="text-xs text-text-med">
          No products pinned. The category page will show all products in normal order.
        </div>
      ) : (
        <div className="space-y-1">
          {sorted.map((row: any, i: number) => (
            <div key={row.id} className="flex items-center gap-2 bg-card border border-border rounded-lg p-2">
              <GripVertical className="w-4 h-4 text-text-light" />
              <span className="text-xl">{row.products?.emoji || "📦"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{row.products?.name || "Unknown product"}</div>
                <div className="text-[10px] text-text-light">order #{row.product_order}</div>
              </div>
              <Switch
                checked={!!row.is_active}
                onCheckedChange={(v) => togglePin.mutate({ id: row.id, isActive: v, categorySlug })}
              />
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
                title="Move up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === sorted.length - 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
                title="Move down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => removePin.mutate({ id: row.id, categorySlug })}
                className="p-1 rounded hover:bg-destructive/10 text-destructive"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="pt-1">
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add product
        </Button>
      </div>

      <AddProductDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        slug={categorySlug}
        excludeIds={pinnedIds}
        onPick={(productId) => {
          const next = ((sorted[sorted.length - 1] as any)?.product_order || 0) + 1;
          addPin.mutate({ categorySlug, productId, productOrder: next });
          setAddOpen(false);
        }}
      />
    </div>
  );
}

function AddProductDialog({
  open, onClose, slug, excludeIds, onPick,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  excludeIds: Set<string>;
  onPick: (productId: string) => void;
}) {
  const [q, setQ] = useState("");
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin_merch_pickable", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, emoji")
        .eq("subcategory", slug)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!slug,
    staleTime: 30 * 1000,
  });

  const filtered = (products || []).filter((p: any) =>
    !excludeIds.has(p.id) && (q.trim() === "" || p.name.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a product to this section</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-text-med">
          Showing products in <b>{slug}</b>. Already-pinned products are hidden.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" className="pl-9" />
        </div>
        <div className="max-h-80 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="text-xs text-text-med text-center py-6">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-xs text-text-med text-center py-6">No products to add.</div>
          ) : (
            filtered.map((p: any) => (
              <button
                key={p.id}
                onClick={() => onPick(p.id)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-left"
              >
                <span className="text-lg">{p.emoji || "📦"}</span>
                <span className="text-sm font-semibold">{p.name}</span>
              </button>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
