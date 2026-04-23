import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check, Package, Coins, Repeat, Minus, Plus, Lock, Loader2, X,
  CalendarDays, ShieldCheck, Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useSubscriptionSettings, prettySubcategory,
  WEEKDAYS, WEEKDAY_LABEL, FREQUENCY_LABEL,
  type Frequency,
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
  brand_name: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  frequency: Frequency;
}
interface SuccessPayload {
  subscription_id: string;
  customer_email: string;
  next_charge_date: string;
  delivery_day: string;
  card_last4: string | null;
  card_brand: string | null;
  items: Array<{ product_name: string; brand_name: string; quantity: number; unit_price: number }>;
  total_per_cycle: number;
}

const fmtN = (naira: number) => `₦${Math.round(naira || 0).toLocaleString("en-NG")}`;

// -------------------------------------------------------------------------
// Page
// -------------------------------------------------------------------------

export default function SubscriptionPage() {
  const { data: settings } = useSubscriptionSettings();
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

  // Which frequencies are enabled this session.
  const enabledFreqs: Frequency[] = useMemo(() => {
    if (!settings) return ["monthly"];
    const list: Frequency[] = [];
    if (settings.weekly_enabled)   list.push("weekly");
    if (settings.biweekly_enabled) list.push("biweekly");
    if (settings.monthly_enabled)  list.push("monthly");
    return list.length ? list : ["monthly"];
  }, [settings]);

  const [globalFrequency, setGlobalFrequency] = useState<Frequency>("monthly");
  useEffect(() => {
    if (!enabledFreqs.includes(globalFrequency)) setGlobalFrequency(enabledFreqs[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledFreqs.join(",")]);

  const [deliveryDay, setDeliveryDay] = useState<string>("monday");
  const [selected, setSelected] = useState<Record<string, Selection>>({});

  // Flows: collecting | paying | success
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [success, setSuccess] = useState<SuccessPayload | null>(null);
  const [dismissAcctPrompt, setDismissAcctPrompt] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Auto-tick ?product=ID once products arrive.
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
        brand_name: first.brand_name,
        image_url: first.image_url || first.images?.[0] || null,
        unit_price: Number(first.price) || 0,
        quantity: 1,
        frequency: globalFrequency,
      },
    });
    requestAnimationFrame(() => {
      const el = cardRefs.current[target.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoProductId, products.length]);

  const toggle = (p: SubProduct) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[p.id]) { delete next[p.id]; return next; }
      const inStock = p.brands.filter(b => b.in_stock !== false);
      if (inStock.length === 0) return prev;
      const first = inStock[0];
      next[p.id] = {
        brand_id: first.id,
        brand_name: first.brand_name,
        image_url: first.image_url || first.images?.[0] || null,
        unit_price: Number(first.price) || 0,
        quantity: 1,
        frequency: globalFrequency,
      };
      return next;
    });
  };

  const patch = (productId: string, update: Partial<Selection>) => {
    setSelected(prev => prev[productId] ? { ...prev, [productId]: { ...prev[productId], ...update } } : prev);
  };

  // Grouped products for rendering.
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
    const entries = Object.values(selected);
    const count = entries.reduce((s, x) => s + x.quantity, 0);
    const subtotal = entries.reduce((s, x) => s + x.unit_price * x.quantity, 0);
    const pct = settings?.discount_pct ?? 0;
    const discount = Math.round(subtotal * pct / 100);
    const total = subtotal - discount;
    return { count, subtotal, discount, total };
  }, [selected, settings]);

  const canPay = summary.count > 0 && !!deliveryDay && !processing;

  const triggerPay = () => {
    if (summary.count === 0) { toast.error("Tick at least one product."); return; }
    if (!deliveryDay) { toast.error("Choose a delivery day."); return; }
    setEmailModalOpen(true);
  };

  const runPaystack = async (email: string) => {
    setEmailModalOpen(false);
    setProcessing(true);
    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop();
      const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_ee6db593cdee9f92b4114a9b15f4a2a72e71ee20";
      const reference = `sub_${Date.now()}`;
      const amountKobo = Math.max(0, summary.total) * 100;

      popup.newTransaction({
        key: paystackKey,
        email,
        amount: amountKobo,
        currency: "NGN",
        ref: reference,
        channels: ["card"],
        metadata: { type: "subscription" } as any,
        onSuccess: async (tx: { reference: string; status: string }) => {
          try {
            const items = Object.entries(selected).map(([product_id, sel]) => {
              const product = products.find(p => p.id === product_id);
              return {
                product_id,
                brand_id: sel.brand_id,
                product_name: product?.name || "",
                brand_name: sel.brand_name,
                quantity: sel.quantity,
                unit_price: sel.unit_price,
                frequency: sel.frequency,
              };
            });

            const { data, error } = await supabase.functions.invoke("create-subscription", {
              body: {
                reference: tx.reference,
                items,
                frequency: globalFrequency,
                delivery_day: deliveryDay,
                delivery_address: "",
                delivery_city: "Lagos",
                delivery_state: "Lagos",
              },
            });

            if (error || !(data as any)?.success) {
              toast.error("Payment received but subscription setup failed. Please contact support with reference: " + tx.reference);
              setProcessing(false);
              return;
            }

            const result = data as any;
            setSuccess({
              subscription_id: result.subscription_id,
              customer_email: result.customer_email || email,
              next_charge_date: result.next_charge_date,
              delivery_day: result.delivery_day || deliveryDay,
              card_brand: result.card_brand ?? null,
              card_last4: result.card_last4 ?? null,
              items: items.map(i => ({ product_name: i.product_name, brand_name: i.brand_name, quantity: i.quantity, unit_price: i.unit_price })),
              total_per_cycle: summary.total,
            });
            setProcessing(false);
          } catch (e: any) {
            toast.error(e?.message || "Subscription setup failed.");
            setProcessing(false);
          }
        },
        onCancel: () => { setProcessing(false); },
      } as any);
    } catch (e: any) {
      setProcessing(false);
      toast.error(e?.message || "Couldn't open payment. Please try again.");
    }
  };

  if (!settings) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-text-light">Loading…</div>;
  }
  if (!settings.subscription_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center bg-[#FFF8F4] pt-20 md:pt-24">
        <div className="max-w-md">
          <h1 className="pf text-2xl font-bold mb-2">Subscriptions — Coming Soon</h1>
          <p className="text-text-med text-sm">We're putting the final touches on BundledMum subscriptions. Check back shortly.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return <SuccessScreen data={success} settings={settings} dismissAcctPrompt={dismissAcctPrompt} onDismiss={() => setDismissAcctPrompt(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#FFF8F4] pb-[140px] pt-20 md:pt-24">
      {/* Hero */}
      <header className="relative px-4 md:px-8 py-8 md:py-12 text-primary-foreground" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 100%)" }}>
        <div className="max-w-[880px] mx-auto text-center space-y-3">
          <img src={bmLogoCoral} alt="BundledMum" className="h-8 mx-auto" />
          <h1 className="pf text-2xl md:text-4xl font-bold leading-tight">{settings.subscription_page_heading}</h1>
          <p className="text-sm md:text-base text-primary-foreground/80 max-w-xl mx-auto">{settings.subscription_page_subtext}</p>

          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <Pill icon={<Package className="w-3.5 h-3.5" />}>Free delivery every time</Pill>
            <Pill icon={<Coins className="w-3.5 h-3.5" />}>Save {settings.discount_pct}% on every order</Pill>
            <Pill icon={<ShieldCheck className="w-3.5 h-3.5" />}>Minimum {settings.min_deliveries} deliveries</Pill>
            <Pill icon={<Repeat className="w-3.5 h-3.5" />}>Cancel anytime after that</Pill>
          </div>
        </div>
      </header>

      <main className="max-w-[880px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Delivery day */}
        <section className="bg-card border border-border rounded-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-forest" />
            <h2 className="font-bold text-sm">Choose your delivery day</h2>
          </div>
          <p className="text-[11px] text-text-light mb-2">Applies to every delivery in this subscription.</p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map(d => (
              <button
                key={d.v}
                onClick={() => setDeliveryDay(d.v)}
                className={`px-3 py-2 rounded-pill text-xs font-semibold border min-w-[52px] ${
                  deliveryDay === d.v
                    ? "bg-forest text-primary-foreground border-forest"
                    : "bg-background text-text-med border-input hover:border-forest/60"
                }`}
              >
                {d.short}
              </button>
            ))}
          </div>
        </section>

        {/* Product list */}
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
                      enabledFreqs={enabledFreqs}
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
      {summary.count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div className="max-w-[880px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-semibold"><span className="tabular-nums">{summary.count}</span> item{summary.count === 1 ? "" : "s"} · {fmtN(summary.total)} / delivery</div>
              <div className="text-emerald-700 font-semibold">Delivery: FREE</div>
            </div>
            <button
              onClick={triggerPay}
              disabled={!canPay}
              className="inline-flex items-center gap-1.5 rounded-pill px-5 py-3 text-sm font-semibold text-primary-foreground min-h-[44px] disabled:opacity-40"
              style={{ backgroundColor: "#2D6A4F" }}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {processing ? "Processing…" : "Pay with Card →"}
            </button>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      )}

      {emailModalOpen && (
        <EmailModal
          onClose={() => setEmailModalOpen(false)}
          onConfirm={runPaystack}
        />
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
  product, enabledFreqs, selection, onToggle, onPatch, cardRef,
}: {
  product: SubProduct;
  enabledFreqs: Frequency[];
  selection: Selection | undefined;
  onToggle: () => void;
  onPatch: (u: Partial<Selection>) => void;
  cardRef: (el: HTMLElement | null) => void;
}) {
  const isSelected = !!selection;
  const inStockBrands = product.brands.filter(b => b.in_stock !== false);
  const selectedBrand = inStockBrands.find(b => b.id === selection?.brand_id) || inStockBrands[0];
  const qty = selection?.quantity ?? 1;

  const reorderText = product.reorder_label
    || (product.reorder_days ? `Restocks every ${product.reorder_days} days` : null);

  const changeBrand = (brandId: string) => {
    const b = inStockBrands.find(x => x.id === brandId);
    if (!b) return;
    onPatch({
      brand_id: b.id,
      brand_name: b.brand_name,
      image_url: b.image_url || b.images?.[0] || null,
      unit_price: Number(b.price) || 0,
    });
  };

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

      <fieldset disabled={!isSelected} className={`space-y-2 mt-3 ${isSelected ? "" : "opacity-40"}`}>
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

        <div>
          <label className="text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-0.5">Frequency</label>
          <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs w-full">
            {enabledFreqs.map(f => (
              <button
                key={f}
                onClick={() => onPatch({ frequency: f })}
                className={`flex-1 px-2 py-1 rounded-md font-semibold ${selection?.frequency === f ? "bg-card" : "text-text-med"}`}
              >
                {FREQUENCY_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-0.5">Quantity</label>
            <div className="inline-flex items-center gap-1 rounded-lg border border-input px-1 py-0.5 bg-background">
              <button onClick={() => onPatch({ quantity: Math.max(1, qty - 1) })} className="w-7 h-7 inline-flex items-center justify-center text-text-med hover:text-foreground disabled:opacity-40" disabled={!isSelected || qty <= 1}><Minus className="w-3 h-3" /></button>
              <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums">{qty}</span>
              <button onClick={() => onPatch({ quantity: Math.min(10, qty + 1) })} className="w-7 h-7 inline-flex items-center justify-center text-text-med hover:text-foreground disabled:opacity-40" disabled={!isSelected || qty >= 10}><Plus className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-text-light uppercase tracking-widest">Price</div>
            <div className="font-bold tabular-nums">{fmtN((selection?.unit_price ?? Number(selectedBrand?.price) ?? 0) * qty)}</div>
          </div>
        </div>
      </fieldset>
    </article>
  );
}

// -------------------------------------------------------------------------
// Email modal (collects Paystack email only — NOT an account signup)
// -------------------------------------------------------------------------

function EmailModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm inline-flex items-center gap-2"><Mail className="w-4 h-4 text-forest" /> Your email address</h3>
          <button onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-text-med">We'll send your subscription confirmation here.</p>
          <input
            autoFocus
            type="email"
            inputMode="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && valid) onConfirm(email.trim().toLowerCase()); }}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-input px-3 py-2 text-sm bg-background"
          />
          <button
            onClick={() => onConfirm(email.trim().toLowerCase())}
            disabled={!valid}
            className="w-full rounded-pill py-3 text-sm font-semibold text-primary-foreground min-h-[48px] inline-flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ backgroundColor: "#2D6A4F" }}
          >
            <Lock className="w-4 h-4" /> Continue to secure payment
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// Success screen
// -------------------------------------------------------------------------

function SuccessScreen({
  data, settings, dismissAcctPrompt, onDismiss,
}: {
  data: SuccessPayload;
  settings: NonNullable<ReturnType<typeof useSubscriptionSettings>["data"]>;
  dismissAcctPrompt: boolean;
  onDismiss: () => void;
}) {
  const firstDeliveryLabel = data.next_charge_date
    ? new Date(data.next_charge_date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  return (
    <div className="min-h-screen bg-[#FFF8F4] pt-20 md:pt-24 pb-16">
      <div className="max-w-[640px] mx-auto px-4 py-6 space-y-4">
        <section className="bg-card border border-border rounded-card p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center text-3xl">✅</div>
          <h1 className="pf text-2xl font-bold">You're subscribed!</h1>
          <p className="text-xs text-text-med">Confirmation sent to <b>{data.customer_email}</b>.</p>
        </section>

        <section className="bg-card border border-border rounded-card p-4 space-y-2 text-sm">
          <dl className="space-y-1">
            <div className="flex items-center justify-between"><dt className="text-text-light">Delivery day</dt><dd className="font-semibold">{WEEKDAY_LABEL[data.delivery_day] || data.delivery_day}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-text-light">First delivery</dt><dd className="font-semibold">{firstDeliveryLabel}</dd></div>
            {data.card_brand && data.card_last4 && (
              <div className="flex items-center justify-between"><dt className="text-text-light">Card</dt><dd className="font-semibold">{data.card_brand} ending {data.card_last4}</dd></div>
            )}
          </dl>
          <div className="border-t border-border pt-2">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-med mb-1">Items confirmed</h3>
            <ul className="text-xs space-y-0.5">
              {data.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{it.product_name}{it.brand_name ? ` · ${it.brand_name}` : ""} × {it.quantity}</span>
                  <span className="tabular-nums">{fmtN(it.unit_price * it.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-semibold text-text-med">Total per delivery</span>
            <span className="font-bold tabular-nums text-forest">{fmtN(data.total_per_cycle)} · <span className="text-emerald-700">FREE delivery</span></span>
          </div>
          <p className="text-[11px] text-text-light">Minimum {settings.min_deliveries} deliveries — cancel any time after that from your account.</p>
        </section>

        {!dismissAcctPrompt && (
          <section className="bg-emerald-50 border-2 border-emerald-600 rounded-card p-4 space-y-2">
            <h3 className="font-bold text-sm text-emerald-800">Create a free account to manage your subscription</h3>
            <ul className="text-xs text-emerald-900/80 space-y-0.5 pl-4 list-disc">
              <li>Change your delivery day</li>
              <li>Skip a delivery</li>
              <li>Swap products before each cycle</li>
              <li>View your delivery history</li>
            </ul>
            <div className="flex items-center gap-2 pt-1">
              <Link
                to="/account/login?redirect=/account/subscriptions"
                className="inline-flex items-center gap-1.5 rounded-pill bg-forest text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-forest-deep"
              >
                Create account →
              </Link>
              <button onClick={onDismiss} className="text-xs text-text-med hover:text-foreground px-2 py-1">Maybe later</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
