import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus, Trash2, Repeat, ShoppingBag } from "lucide-react";
import {
  useSubscriptionSettings, readDraft, clearDraft, fmtN,
  type SubscriptionDraftItem,
} from "@/hooks/useSubscription";

export default function NewSubscription() {
  const { data: settings } = useSubscriptionSettings();
  const [items, setItems] = useState<SubscriptionDraftItem[]>([]);
  const navigate = useNavigate();

  // Load draft from sessionStorage once on mount and clear it so a
  // browser refresh doesn't re-seed the form.
  useEffect(() => {
    const draft = readDraft();
    if (draft?.items) setItems(draft.items);
    clearDraft();
  }, []);

  const summary = useMemo(() => {
    const gross = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const discount = (settings?.discount_pct ?? 0) / 100;
    return { gross, net: gross * (1 - discount) };
  }, [items, settings]);

  const patch = (index: number, update: Partial<SubscriptionDraftItem>) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, ...update } : it));
  };
  const remove = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const placeSubscription = async () => {
    // Full subscription creation requires a dedicated edge function
    // (Paystack authorization + schedule setup). Surface a helpful toast
    // for now — this button wires into that function once it ships.
    toast.message("Subscription checkout is almost ready — we'll drop you an email as soon as it's live.");
  };

  if (!settings) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-text-light">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFF8F4] pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-[720px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/subscriptions" className="w-9 h-9 rounded-full hover:bg-muted inline-flex items-center justify-center" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-bold text-sm">Review your subscription</h1>
            <p className="text-[10px] text-text-light">{items.length} item{items.length === 1 ? "" : "s"} · {fmtN(summary.net)} / order · free delivery</p>
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

            {/* Summary */}
            <section className="bg-card border border-border rounded-card p-4 text-sm space-y-1.5">
              <Row label="Subtotal" v={fmtN(summary.gross)} />
              {settings.discount_pct > 0 && (
                <Row label={`Subscription discount (${settings.discount_pct}%)`} v={`−${fmtN(summary.gross - summary.net)}`} muted />
              )}
              <Row label="Delivery" v={<span className="text-emerald-700">Free</span>} />
              <div className="pt-1.5 border-t border-border flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest font-semibold text-text-med">Total per order</span>
                <span className="text-lg font-black tabular-nums text-forest">{fmtN(summary.net)}</span>
              </div>
            </section>

            <div className="bg-forest/5 border border-forest/20 rounded-card p-3 text-xs text-text-med leading-relaxed">
              <Repeat className="w-3.5 h-3.5 text-forest inline mr-1" /> You can pause, edit, or cancel anytime up to {settings.edit_window_days} day{settings.edit_window_days === 1 ? "" : "s"} before your next delivery.
            </div>

            <div className="space-y-2">
              <button onClick={() => navigate("/account/profile")} className="w-full text-left bg-card border border-border rounded-card p-3 text-xs hover:border-forest/40">
                <div className="font-semibold">Delivery address</div>
                <div className="text-text-light">Manage in profile →</div>
              </button>
              <button onClick={() => toast.message("Paystack integration arriving with the subscription launch.")} className="w-full text-left bg-card border border-border rounded-card p-3 text-xs hover:border-forest/40">
                <div className="font-semibold">Payment method</div>
                <div className="text-text-light">Paystack card — will prompt at checkout</div>
              </button>
            </div>

            <button
              onClick={placeSubscription}
              className="w-full rounded-pill py-3 text-sm font-semibold text-primary-foreground min-h-[48px]"
              style={{ backgroundColor: "#2D6A4F" }}
            >
              Start subscription · {fmtN(summary.net)}/order
            </button>
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
