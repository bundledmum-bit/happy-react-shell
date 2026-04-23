import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Package, Coins, Repeat, Minus, Plus, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import {
  useSubscriptionSettings, writeDraft, fmtN, prettySubcategory,
  type SubscriptionDraftItem,
} from "@/hooks/useSubscription";
import bmLogoCoral from "@/assets/logos/BM-LOGO-CORAL.svg";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

interface Brand {
  id: string;
  brand_name: string;
  price: number;            // NAIRA
  size_variant: string | null;
  in_stock: boolean | null;
  image_url: string | null;
  images?: string[] | null;
}

interface SubProduct {
  id: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  reorder_days: number | null;
  reorder_label: string | null;
  why_included: string | null;
  is_consumable: boolean | null;
  brands: Brand[];
}

interface Selection {
  brand_id: string;
  size_variant: string | null;
  quantity: number;
  frequency: "weekly" | "monthly";
}

// -------------------------------------------------------------------------
// Page
// -------------------------------------------------------------------------

export default function SubscriptionPage() {
  const { data: settings } = useSubscriptionSettings();
  const { user } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoProductId = searchParams.get("product");
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["subscribable-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, category, subcategory, reorder_days, reorder_label,
          why_included, is_consumable,
          brands(id, brand_name, price, size_variant, in_stock, image_url, images)
        `)
        .eq("is_subscribable", true)
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("subcategory", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as SubProduct[];
    },
    staleTime: 60_000,
  });

  // Per-product selection map — only products that are ticked appear here.
  const [selected, setSelected] = useState<Record<string, Selection>>({});

  const defaultFrequency = (settings?.monthly_enabled ?? true) ? "monthly" : "weekly";

  // Auto-tick ?product= on first load once we know it exists.
  useEffect(() => {
    if (!autoProductId || products.length === 0) return;
    const target = products.find(p => p.id === autoProductId);
    if (!target) return;
    const inStock = target.brands.filter(b => b.in_stock !== false);
    if (inStock.length === 0) return;
    const first = inStock[0];
    setSelected(prev => prev[target.id] ? prev : {
      ...prev,
      [target.id]: {
        brand_id: first.id,
        size_variant: first.size_variant,
        quantity: 1,
        frequency: defaultFrequency,
      },
    });
    // Scroll into view on next frame.
    requestAnimationFrame(() => {
      const el = cardRefs.current[target.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoProductId, products.length]);

  const toggle = (p: SubProduct) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[p.id]) {
        delete next[p.id];
        return next;
      }
      const inStock = p.brands.filter(b => b.in_stock !== false);
      if (inStock.length === 0) return prev;
      const first = inStock[0];
      next[p.id] = {
        brand_id: first.id,
        size_variant: first.size_variant,
        quantity: 1,
        frequency: defaultFrequency,
      };
      return next;
    });
  };

  const patch = (productId: string, update: Partial<Selection>) => {
    setSelected(prev => prev[productId] ? { ...prev, [productId]: { ...prev[productId], ...update } } : prev);
  };

  // Grouped products by category → subcategory for rendering.
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, SubProduct[]>>();
    for (const p of products) {
      const cat = (p.category || "other").toLowerCase();
      const sub = p.subcategory || "other";
      if (!map.has(cat)) map.set(cat, new Map());
      const inner = map.get(cat)!;
      if (!inner.has(sub)) inner.set(sub, []);
      inner.get(sub)!.push(p);
    }
    return map;
  }, [products]);

  const summary = useMemo(() => {
    let itemCount = 0;
    let gross = 0;
    for (const [pid, sel] of Object.entries(selected)) {
      const product = products.find(p => p.id === pid);
      const brand = product?.brands.find(b => b.id === sel.brand_id);
      if (!brand) continue;
      itemCount += sel.quantity;
      gross += Number(brand.price) * sel.quantity;
    }
    const discount = (settings?.discount_pct ?? 0) / 100;
    const net = gross * (1 - discount);
    return { itemCount, net };
  }, [selected, products, settings]);

  const continueCheckout = () => {
    const items: SubscriptionDraftItem[] = [];
    for (const [pid, sel] of Object.entries(selected)) {
      const product = products.find(p => p.id === pid);
      const brand = product?.brands.find(b => b.id === sel.brand_id);
      if (!product || !brand) continue;
      items.push({
        product_id: product.id,
        brand_id: brand.id,
        quantity: sel.quantity,
        frequency: sel.frequency,
        unit_price: Number(brand.price),
        product_name: product.name,
        brand_name: brand.brand_name,
        image_url: brand.image_url || (brand.images?.[0] ?? null),
        size_variant: brand.size_variant,
      });
    }
    writeDraft({ items });

    if (!user) {
      navigate("/account/login?redirect=/account/subscriptions/new", { replace: false });
    } else {
      navigate("/account/subscriptions/new");
    }
  };

  if (!settings) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-text-light">Loading…</div>;
  }
  if (!settings.subscription_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center bg-[#FFF8F4]">
        <div className="max-w-md">
          <h1 className="pf text-2xl font-bold mb-2">Subscriptions — Coming Soon</h1>
          <p className="text-text-med text-sm">We're putting the final touches on BundledMum subscriptions. Check back shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F4] pb-[120px]">
      {/* Hero */}
      <header className="relative px-4 md:px-8 py-8 md:py-12 text-primary-foreground" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 100%)" }}>
        <div className="max-w-[880px] mx-auto text-center space-y-3">
          <img src={bmLogoCoral} alt="BundledMum" className="h-8 mx-auto" />
          <h1 className="pf text-2xl md:text-4xl font-bold leading-tight">{settings.subscription_page_heading}</h1>
          <p className="text-sm md:text-base text-primary-foreground/80 max-w-xl mx-auto">{settings.subscription_page_subtext}</p>

          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <Pill icon={<Package className="w-3.5 h-3.5" />}>Free delivery every time</Pill>
            <Pill icon={<Coins className="w-3.5 h-3.5" />}>Save {settings.discount_pct}% on every order</Pill>
            <Pill icon={<Repeat className="w-3.5 h-3.5" />}>Edit your box anytime</Pill>
          </div>
        </div>
      </header>

      {/* Product list */}
      <main className="max-w-[880px] mx-auto px-4 md:px-8 py-6 space-y-8">
        {isLoading && <p className="text-sm text-text-light text-center py-12">Loading products…</p>}
        {!isLoading && products.length === 0 && (
          <p className="text-sm text-text-light text-center py-12">No subscribable products available right now.</p>
        )}

        {Array.from(grouped.entries()).map(([cat, subs]) => (
          <section key={cat} className="space-y-4">
            <h2 className="pf text-xl font-bold">{cat === "mum" ? "For Mum" : cat === "baby" ? "For Baby" : prettySubcategory(cat)}</h2>
            {Array.from(subs.entries()).map(([sub, items]) => (
              <div key={sub} className="space-y-3">
                <h3 className="text-xs uppercase tracking-widest font-semibold text-text-med">{prettySubcategory(sub)}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      settings={settings}
                      selection={selected[p.id]}
                      onToggle={() => toggle(p)}
                      onPatch={update => patch(p.id, update)}
                      cardRef={el => { cardRefs.current[p.id] = el; }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </main>

      {/* Sticky summary bar */}
      {summary.itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div className="max-w-[880px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-semibold"><span className="tabular-nums">{summary.itemCount}</span> item{summary.itemCount === 1 ? "" : "s"} selected</div>
              <div className="text-text-light">{fmtN(summary.net)} <span className="text-text-light">/ order · free delivery</span></div>
            </div>
            <button
              onClick={continueCheckout}
              className="inline-flex items-center gap-1.5 rounded-pill px-5 py-3 text-sm font-semibold text-primary-foreground min-h-[44px]"
              style={{ backgroundColor: "#2D6A4F" }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      )}
    </div>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 rounded-pill px-3 py-1.5 text-xs font-semibold">
      {icon} {children}
    </span>
  );
}

// -------------------------------------------------------------------------
// Product card
// -------------------------------------------------------------------------

function ProductCard({
  product, settings, selection, onToggle, onPatch, cardRef,
}: {
  product: SubProduct;
  settings: NonNullable<ReturnType<typeof useSubscriptionSettings>["data"]>;
  selection: Selection | undefined;
  onToggle: () => void;
  onPatch: (u: Partial<Selection>) => void;
  cardRef: (el: HTMLElement | null) => void;
}) {
  const isSelected = !!selection;
  const inStockBrands = product.brands.filter(b => b.in_stock !== false);
  const selectedBrand = inStockBrands.find(b => b.id === selection?.brand_id) || inStockBrands[0];

  // Size options for the selected brand (if multiple brands share the
  // same brand_name but differ by size, we'd ideally group. For now, we
  // treat brands as distinct SKUs and only show size picker when more
  // than one size_variant exists across brands).
  const sizeVariants = useMemo(() => {
    const set = new Set<string>();
    for (const b of inStockBrands) if (b.size_variant) set.add(b.size_variant);
    return Array.from(set);
  }, [inStockBrands]);

  const priceDisplay = selectedBrand ? selectedBrand.price : 0;
  const qty = selection?.quantity ?? 1;

  const changeBrand = (brandId: string) => onPatch({ brand_id: brandId });
  const changeSize = (size: string) => {
    const match = inStockBrands.find(b => b.size_variant === size);
    if (match) onPatch({ brand_id: match.id, size_variant: size });
  };

  const reorderText = product.reorder_label
    || (product.reorder_days ? `Restocks every ${product.reorder_days} days` : null);

  return (
    <article
      ref={cardRef as any}
      className={`bg-card border rounded-card p-3 transition-colors ${isSelected ? "border-l-4 border-l-forest border-border" : "border-border opacity-85"}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          aria-label={isSelected ? "Remove from subscription" : "Add to subscription"}
          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5 ${isSelected ? "bg-forest border-forest text-primary-foreground" : "bg-background border-input"}`}
        >
          {isSelected && <Check className="w-3.5 h-3.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-sm leading-tight">{product.name}</h4>
          {reorderText && <p className="text-[11px] text-text-light mt-0.5">{reorderText}</p>}
        </div>

        {selectedBrand && (selectedBrand.image_url || selectedBrand.images?.[0]) && (
          <img
            src={selectedBrand.image_url || selectedBrand.images?.[0] || ""}
            alt={product.name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        )}
      </div>

      <fieldset disabled={!isSelected} className={`grid grid-cols-2 gap-2 mt-3 ${isSelected ? "" : "opacity-40"}`}>
        <div>
          <label className="text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-0.5">Brand</label>
          <select
            value={selection?.brand_id || inStockBrands[0]?.id || ""}
            onChange={e => changeBrand(e.target.value)}
            className="w-full rounded-lg border border-input px-2 py-1.5 text-xs bg-background"
          >
            {inStockBrands.map(b => (
              <option key={b.id} value={b.id}>{b.brand_name} — {fmtN(Number(b.price))}</option>
            ))}
          </select>
        </div>

        {sizeVariants.length > 1 && (
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-0.5">Size</label>
            <select
              value={selectedBrand?.size_variant || ""}
              onChange={e => changeSize(e.target.value)}
              className="w-full rounded-lg border border-input px-2 py-1.5 text-xs bg-background"
            >
              {sizeVariants.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-0.5">Quantity</label>
          <div className="inline-flex items-center gap-1 rounded-lg border border-input px-1 py-0.5 bg-background">
            <button onClick={() => onPatch({ quantity: Math.max(1, qty - 1) })} className="w-7 h-7 inline-flex items-center justify-center text-text-med hover:text-foreground disabled:opacity-40" disabled={!isSelected || qty <= 1}><Minus className="w-3 h-3" /></button>
            <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums">{qty}</span>
            <button onClick={() => onPatch({ quantity: Math.min(10, qty + 1) })} className="w-7 h-7 inline-flex items-center justify-center text-text-med hover:text-foreground disabled:opacity-40" disabled={!isSelected || qty >= 10}><Plus className="w-3 h-3" /></button>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-0.5">Frequency</label>
          <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs w-full">
            {settings.weekly_enabled && (
              <button onClick={() => onPatch({ frequency: "weekly" })} className={`flex-1 px-2 py-1 rounded-md font-semibold ${selection?.frequency === "weekly" ? "bg-card" : "text-text-med"}`}>Weekly</button>
            )}
            {settings.monthly_enabled && (
              <button onClick={() => onPatch({ frequency: "monthly" })} className={`flex-1 px-2 py-1 rounded-md font-semibold ${selection?.frequency === "monthly" ? "bg-card" : "text-text-med"}`}>Monthly</button>
            )}
          </div>
        </div>
      </fieldset>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/60">
        <div>
          <div className="text-[10px] text-text-light uppercase tracking-widest">Price</div>
          <div className="font-bold tabular-nums">{fmtN(priceDisplay)}</div>
        </div>
        <button
          onClick={onToggle}
          className={`rounded-pill px-4 py-2 text-xs font-semibold min-h-[38px] ${isSelected ? "bg-forest text-primary-foreground" : "border border-forest text-forest hover:bg-forest/5"}`}
          style={isSelected ? undefined : {}}
        >
          {isSelected ? "Added ✓" : settings.subscription_badge_label}
        </button>
      </div>

      {product.why_included && isSelected && (
        <p className="text-[11px] text-text-light mt-2 italic">"{product.why_included}"</p>
      )}
    </article>
  );
}
