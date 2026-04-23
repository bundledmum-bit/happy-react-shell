import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus, Trash2, Repeat, ShoppingBag, MessageCircle, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import {
  useSubscriptionSettings, readDraft, clearDraft, fmtN,
  type SubscriptionDraftItem,
} from "@/hooks/useSubscription";
import { useSiteSettings } from "@/hooks/useSupabaseData";

const inputCls = "w-full border border-input rounded-lg px-3 py-2 text-sm bg-background";
const labelCls = "text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-1";

interface AddressForm {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

/** today + 7 (weekly) or + 30 (monthly), ISO yyyy-mm-dd */
function calculateFirstChargeDate(frequency: "weekly" | "monthly"): string {
  const d = new Date();
  d.setDate(d.getDate() + (frequency === "weekly" ? 7 : 30));
  return d.toISOString().split("T")[0];
}
/** 2 days before next charge date */
function calculateEditDeadline(nextChargeDate: string): string {
  const d = new Date(nextChargeDate);
  d.setDate(d.getDate() - 2);
  return d.toISOString().split("T")[0];
}

/** Take the most common frequency across items as the subscription-level frequency. */
function dominantFrequency(items: SubscriptionDraftItem[]): "weekly" | "monthly" {
  let w = 0, m = 0;
  for (const it of items) (it.frequency === "weekly" ? w++ : m++);
  return w > m ? "weekly" : "monthly";
}

export default function NewSubscription() {
  const { data: settings } = useSubscriptionSettings();
  const { data: siteSettings } = useSiteSettings();
  const { user } = useCustomerAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<SubscriptionDraftItem[]>([]);
  const [form, setForm] = useState<AddressForm>({ full_name: "", phone: "", address: "", city: "", state: "Lagos" });
  const [processing, setProcessing] = useState(false);

  // Load draft from sessionStorage on mount and clear it so a browser
  // refresh doesn't re-seed the form.
  useEffect(() => {
    const draft = readDraft();
    if (draft?.items) setItems(draft.items);
    clearDraft();
  }, []);

  // Pre-fill address from customer_account_view (RLS-gated to caller).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("customer_account_view")
        .select("full_name, phone, delivery_address, delivery_area, delivery_state")
        .maybeSingle();
      if (cancelled || !data) return;
      setForm(prev => ({
        full_name: prev.full_name || data.full_name || "",
        phone:     prev.phone     || data.phone     || "",
        address:   prev.address   || data.delivery_address || "",
        city:      prev.city      || data.delivery_area    || "",
        state:     prev.state     || data.delivery_state   || prev.state,
      }));
    })();
    return () => { cancelled = true; };
  }, [user]);

  const summary = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const discountPct = settings?.discount_pct ?? 0;
    const discount = Math.round(subtotal * (discountPct / 100));
    const total = subtotal - discount;
    return { subtotal, discountPct, discount, total };
  }, [items, settings]);

  const patch = (index: number, update: Partial<SubscriptionDraftItem>) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, ...update } : it));
  };
  const remove = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // WhatsApp fallback when Paystack is unavailable or the post-payment
  // setup fails. Pre-fills the message with the box contents.
  const whatsapp = (siteSettings as any)?.whatsapp_number || "";
  const waUrl = useMemo(() => {
    if (!whatsapp) return "";
    const lines = items.map(it => {
      const freq = it.frequency === "weekly" ? "weekly" : "monthly";
      return `• ${it.product_name} (${it.brand_name})${it.size_variant ? ` – ${it.size_variant}` : ""} × ${it.quantity} — ${freq}`;
    });
    const body = [
      "Hi BundledMum! I'd like to set up a subscription for:",
      "",
      ...lines,
      "",
      `Total per cycle: ₦${summary.total.toLocaleString()} (free delivery)`,
    ].join("\n");
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(body)}`;
  }, [whatsapp, items, summary.total]);

  const canPay = items.length > 0
    && !!user?.email
    && !!form.address.trim()
    && !!form.city.trim()
    && !!form.state.trim()
    && !processing;

  const handlePay = async () => {
    if (!user?.email) { toast.error("You must be signed in."); return; }
    if (!form.address.trim() || !form.city.trim() || !form.state.trim()) {
      toast.error("Please complete your delivery address.");
      return;
    }
    if (items.length === 0) { toast.error("Your subscription box is empty."); return; }

    setProcessing(true);

    // ----- 1. Look up the customer id (by user_id) so FK resolves. -----
    let customerId: string | null = null;
    try {
      const { data: acct } = await (supabase as any)
        .from("customer_account_view")
        .select("customer_id")
        .maybeSingle();
      customerId = acct?.customer_id ?? null;
    } catch { /* non-blocking — table may be null for fresh accounts */ }

    // ----- 2. Insert the pending subscription. -----
    const freq = dominantFrequency(items);
    const firstCharge = calculateFirstChargeDate(freq);
    const editDeadline = calculateEditDeadline(firstCharge);

    const { data: sub, error: subErr } = await (supabase as any)
      .from("subscriptions")
      .insert({
        customer_email:   user.email,
        customer_id:      customerId,
        frequency:        freq,
        next_charge_date: firstCharge,
        edit_deadline:    editDeadline,
        discount_pct:     settings?.discount_pct ?? 0,
        free_delivery:    settings?.free_delivery_enabled ?? true,
        delivery_address: form.address.trim(),
        delivery_city:    form.city.trim(),
        delivery_state:   form.state.trim(),
        status:           "pending",
      })
      .select("id")
      .single();

    if (subErr || !sub?.id) {
      setProcessing(false);
      toast.error(subErr?.message || "Couldn't create subscription. Please try again.");
      return;
    }

    // ----- 3. Insert subscription_items. -----
    const { error: itemsErr } = await (supabase as any)
      .from("subscription_items")
      .insert(items.map(it => ({
        subscription_id: sub.id,
        product_id: it.product_id,
        brand_id:   it.brand_id,
        quantity:   it.quantity,
        unit_price: it.unit_price,
        frequency:  it.frequency,
        is_active:  true,
      })));

    if (itemsErr) {
      // Roll back the subscription row so we don't leave orphan rows.
      await (supabase as any).from("subscriptions").delete().eq("id", sub.id);
      setProcessing(false);
      toast.error(itemsErr.message || "Couldn't save your box. Please try again.");
      return;
    }

    // ----- 4. Open Paystack inline checkout. -----
    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop();
      const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_ee6db593cdee9f92b4114a9b15f4a2a72e71ee20";
      const reference = `sub_${sub.id}_${Date.now()}`;
      const amountKobo = Math.max(0, summary.total) * 100;

      popup.newTransaction({
        key: paystackKey,
        email: user.email,
        amount: amountKobo,
        currency: "NGN",
        ref: reference,
        channels: ["card"],
        metadata: {
          subscription_id: sub.id,
          custom_fields: [
            { display_name: "Subscription ID", variable_name: "subscription_id", value: sub.id },
          ],
        } as any,
        onSuccess: async (tx: { reference: string; status: string }) => {
          try {
            const { data: initData, error: initErr } = await supabase.functions.invoke("init-subscription", {
              body: { reference: tx.reference, subscription_id: sub.id },
            });
            if (initErr || !(initData as any)?.success) {
              toast.error("Payment received but subscription setup failed. Please contact us via WhatsApp.");
              setProcessing(false);
              return;
            }
            sessionStorage.removeItem("bm_subscription_draft");
            toast.success("Subscription active! 🎉");
            navigate("/account/subscriptions?new=true");
          } catch (e: any) {
            toast.error(e?.message || "Subscription setup failed.");
            setProcessing(false);
          }
        },
        onCancel: async () => {
          // Roll back the pending subscription + items so the user can try again cleanly.
          try { await (supabase as any).from("subscription_items").delete().eq("subscription_id", sub.id); } catch {}
          await (supabase as any).from("subscriptions").delete().eq("id", sub.id);
          setProcessing(false);
          toast.message("Payment cancelled. Your subscription was not created.");
        },
      } as any);
    } catch (e: any) {
      // Rollback if Paystack failed to open at all.
      try { await (supabase as any).from("subscription_items").delete().eq("subscription_id", sub.id); } catch {}
      await (supabase as any).from("subscriptions").delete().eq("id", sub.id);
      setProcessing(false);
      toast.error(e?.message || "Couldn't open payment. Please try again.");
    }
  };

  if (!settings) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-text-light">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFF8F4] pb-24 pt-20 md:pt-24">
      <header className="bg-card border-b border-border">
        <div className="max-w-[720px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/subscriptions" className="w-9 h-9 rounded-full hover:bg-muted inline-flex items-center justify-center" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-bold text-sm">Review your subscription</h1>
            <p className="text-[10px] text-text-light">{items.length} item{items.length === 1 ? "" : "s"} · {fmtN(summary.total)} / order · free delivery</p>
          </div>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-4 py-4 space-y-4">
        {items.length === 0 && (
          <div className="bg-card border border-border rounded-card p-6 text-center">
            <ShoppingBag className="w-8 h-8 mx-auto text-text-light mb-2" />
            <p className="text-sm text-text-med mb-3">Your subscription box is empty.</p>
            <Link to="/subscriptions" className="inline-flex items-center gap-1 bg-forest text-primary-foreground rounded-pill px-4 py-2 text-xs font-semibold hover:bg-forest-deep">
              Add products →
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <>
            {/* Items */}
            <section className="bg-card border border-border rounded-card divide-y divide-border">
              {items.map((it, idx) => (
                <article key={`${it.product_id}-${it.brand_id}-${idx}`} className="p-3 flex gap-3">
                  {it.image_url && (
                    <img src={it.image_url} alt={it.product_name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-tight truncate">{it.product_name}</h3>
                        <p className="text-[11px] text-text-light">{it.brand_name}{it.size_variant ? ` · ${it.size_variant}` : ""}</p>
                      </div>
                      <button onClick={() => remove(idx)} aria-label="Remove" className="text-destructive hover:bg-destructive/10 rounded p-1 -m-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-input px-1 py-0.5 bg-background">
                        <button onClick={() => patch(idx, { quantity: Math.max(1, it.quantity - 1) })} className="w-6 h-6 inline-flex items-center justify-center text-text-med disabled:opacity-40" disabled={it.quantity <= 1}><Minus className="w-3 h-3" /></button>
                        <span className="min-w-[1.25rem] text-center text-xs font-semibold tabular-nums">{it.quantity}</span>
                        <button onClick={() => patch(idx, { quantity: Math.min(10, it.quantity + 1) })} className="w-6 h-6 inline-flex items-center justify-center text-text-med disabled:opacity-40" disabled={it.quantity >= 10}><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="inline-flex rounded-lg bg-muted p-0.5 text-[11px]">
                        {settings.weekly_enabled && (
                          <button onClick={() => patch(idx, { frequency: "weekly" })} className={`px-2 py-0.5 rounded-md font-semibold ${it.frequency === "weekly" ? "bg-card" : "text-text-med"}`}>Weekly</button>
                        )}
                        {settings.monthly_enabled && (
                          <button onClick={() => patch(idx, { frequency: "monthly" })} className={`px-2 py-0.5 rounded-md font-semibold ${it.frequency === "monthly" ? "bg-card" : "text-text-med"}`}>Monthly</button>
                        )}
                      </div>
                      <span className="ml-auto text-xs font-bold tabular-nums">{fmtN(it.unit_price * it.quantity)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <Link to="/subscriptions" className="block text-center text-xs font-semibold text-forest hover:underline py-1">+ Add more items</Link>

            {/* Delivery address */}
            <section className="bg-card border border-border rounded-card p-4 space-y-2">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-text-med">Delivery address</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className={labelCls}>Full name</label>
                  <input className={inputCls} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Street address</label>
                  <input className={inputCls} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Area / city</label>
                  <input className={inputCls} value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input className={inputCls} value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} />
                </div>
              </div>
            </section>

            {/* Summary */}
            <section className="bg-card border border-border rounded-card p-4 text-sm space-y-1.5">
              <Row label="Subtotal" v={fmtN(summary.subtotal)} />
              {settings.discount_pct > 0 && (
                <Row label={`Subscription discount (${settings.discount_pct}%)`} v={`−${fmtN(summary.discount)}`} muted />
              )}
              <Row label="Delivery" v={<span className="text-emerald-700">Free</span>} />
              <div className="pt-1.5 border-t border-border flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest font-semibold text-text-med">Total per cycle</span>
                <span className="text-lg font-black tabular-nums text-forest">{fmtN(summary.total)}</span>
              </div>
            </section>

            <div className="bg-forest/5 border border-forest/20 rounded-card p-3 text-xs text-text-med leading-relaxed">
              <Repeat className="w-3.5 h-3.5 text-forest inline mr-1" /> We'll charge your card {dominantFrequency(items) === "weekly" ? "every week" : "every month"} for this box. Pause or cancel anytime up to {settings.edit_window_days} day{settings.edit_window_days === 1 ? "" : "s"} before your next delivery.
            </div>

            {/* Primary CTA — Paystack inline */}
            <button
              onClick={handlePay}
              disabled={!canPay}
              className="w-full rounded-pill py-3 text-sm font-semibold text-primary-foreground min-h-[48px] inline-flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ backgroundColor: "#2D6A4F" }}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {processing ? "Processing…" : `Pay & Subscribe · ${fmtN(summary.total)}`}
            </button>

            {/* WhatsApp fallback */}
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full rounded-pill border border-border bg-background py-2.5 text-xs font-semibold min-h-[40px] flex items-center justify-center gap-2 hover:bg-muted"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Or complete via WhatsApp
              </a>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Row({ label, v, muted }: { label: string; v: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${muted ? "text-text-light" : "text-text-med"}`}>{label}</span>
      <span className="text-xs font-semibold tabular-nums">{v}</span>
    </div>
  );
}
