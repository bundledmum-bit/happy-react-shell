import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Repeat, Plus, Calendar, CheckCircle2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { fmtN } from "@/hooks/useSubscription";

interface SubscriptionItemRow {
  id: string;
  quantity: number;
  unit_price: number;       // NAIRA
  frequency: string;
  is_active: boolean;
  products?: { name: string; category: string | null } | null;
  brands?: { brand_name: string; image_url: string | null } | null;
}
interface SubscriptionRow {
  id: string;
  status: string;
  frequency: string;
  next_charge_date: string | null;
  discount_pct: number | null;
  free_delivery: boolean | null;
  created_at: string;
  total_cycles: number | null;
  paystack_card_brand: string | null;
  paystack_card_last4: string | null;
  subscription_items: SubscriptionItemRow[];
}

/** Compute per-cycle total from active items + discount_pct. Values are
 *  already in naira; no kobo division anywhere. */
function totalPerCycle(row: SubscriptionRow): number {
  const items = row.subscription_items || [];
  const subtotal = items
    .filter(i => i.is_active !== false)
    .reduce((sum, i) => sum + Number(i.unit_price) * Number(i.quantity), 0);
  const pct = Number(row.discount_pct) || 0;
  return Math.round(subtotal * (1 - pct / 100));
}

export default function AccountSubscriptions() {
  const { user } = useCustomerAuth();
  const [params] = useSearchParams();
  const showSuccess = params.get("new") === "true";

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["my-subscriptions", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("subscriptions")
          .select(`
            id, status, frequency, next_charge_date, discount_pct,
            free_delivery, created_at, total_cycles,
            paystack_card_brand, paystack_card_last4,
            subscription_items(
              id, quantity, unit_price, frequency, is_active,
              products(name, category),
              brands(brand_name, image_url)
            )
          `)
          .eq("customer_email", user?.email)
          .order("created_at", { ascending: false });
        if (error) return [];
        return (data || []) as SubscriptionRow[];
      } catch { return []; }
    },
  });

  // The success banner uses the most recent subscription — items and
  // card info are already embedded on the row, so no second query.
  const latest = subs[0];
  const latestItems: SubscriptionItemRow[] = latest?.subscription_items || [];

  const empty = useMemo(() => !isLoading && subs.length === 0, [isLoading, subs]);

  return (
    <div className="min-h-screen bg-[#FFF8F4] pt-20 md:pt-24">
      <div className="max-w-[720px] mx-auto px-4 py-6 space-y-4">
        <header className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="pf text-2xl font-bold flex items-center gap-2"><Repeat className="w-5 h-5 text-forest" /> My subscriptions</h1>
            <p className="text-xs text-text-med mt-0.5">Manage your recurring BundledMum deliveries.</p>
          </div>
          <Link
            to="/subscriptions"
            className="inline-flex items-center gap-1.5 rounded-pill bg-forest text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-forest-deep"
          >
            <Plus className="w-3.5 h-3.5" /> New subscription
          </Link>
        </header>

        {showSuccess && latest && (
          <section className="bg-emerald-50 border-2 border-emerald-600 rounded-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <h2 className="pf text-lg font-bold text-emerald-800">Your subscription is active!</h2>
            </div>
            <dl className="text-xs space-y-1">
              <div className="flex items-center justify-between"><dt className="text-emerald-900/70">Frequency</dt><dd className="capitalize font-semibold">{latest.frequency}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-emerald-900/70">First delivery</dt><dd className="font-semibold">{latest.next_charge_date ? new Date(latest.next_charge_date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "—"}</dd></div>
              {latest.paystack_card_brand && latest.paystack_card_last4 && (
                <div className="flex items-center justify-between"><dt className="text-emerald-900/70">Card</dt><dd className="font-semibold inline-flex items-center gap-1"><CreditCard className="w-3 h-3" /> {latest.paystack_card_brand} ending in {latest.paystack_card_last4}</dd></div>
              )}
            </dl>
            {latestItems.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-900/70 mb-1">Items in your box</div>
                <ul className="text-xs space-y-0.5">
                  {latestItems.map((it, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span>{it.products?.name || "Product"}{it.brands?.brand_name ? ` · ${it.brands.brand_name}` : ""} × {it.quantity}</span>
                      <span className="tabular-nums">{fmtN(it.unit_price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs font-semibold">
              Total per cycle: <span className="tabular-nums">₦{totalPerCycle(latest).toLocaleString("en-NG")}</span> <span className="text-emerald-900/70 font-normal">(delivery always free)</span>
            </p>
            <Link
              to="/account/subscriptions"
              className="inline-flex items-center gap-1.5 rounded-pill bg-forest text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-forest-deep"
            >
              Manage my subscription →
            </Link>
          </section>
        )}

        {isLoading && (
          <p className="text-sm text-text-light text-center py-8">Loading your subscriptions…</p>
        )}

        {empty && (
          <section className="bg-card border border-border rounded-card p-6 text-center space-y-2">
            <Repeat className="w-10 h-10 text-forest/50 mx-auto" />
            <h2 className="pf text-lg font-bold">No active subscriptions</h2>
            <p className="text-xs text-text-med max-w-sm mx-auto">
              Subscribe to the products you use every week or month and we'll deliver them on a schedule that works for you — with a standing discount and free delivery.
            </p>
            <Link
              to="/subscriptions"
              className="inline-flex items-center gap-1.5 rounded-pill bg-forest text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-forest-deep mt-2"
            >
              Browse subscribable products →
            </Link>
          </section>
        )}

        {!isLoading && subs.length > 0 && (
          <div className="space-y-3">
            {subs.map(s => <SubscriptionCard key={s.id} row={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function SubscriptionCard({ row }: { row: SubscriptionRow }) {
  const statusColor = row.status === "active" ? "bg-emerald-100 text-emerald-700"
    : row.status === "paused" ? "bg-amber-100 text-amber-700"
    : "bg-gray-100 text-gray-600";
  return (
    <article className="bg-card border border-border rounded-card p-4 space-y-2">
      <header className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-sm capitalize">{row.frequency} subscription</div>
          <div className="text-[11px] text-text-light">Started {new Date(row.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</div>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-semibold capitalize ${statusColor}`}>{row.status}</span>
      </header>

      <dl className="text-xs space-y-0.5">
        <div className="flex items-center justify-between"><dt className="text-text-light">Next charge</dt><dd className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {row.next_charge_date || "—"}</dd></div>
        <div className="flex items-center justify-between"><dt className="text-text-light">Total per cycle</dt><dd className="font-semibold tabular-nums">₦{totalPerCycle(row).toLocaleString("en-NG")}</dd></div>
        {row.paystack_card_brand && row.paystack_card_last4 && (
          <div className="flex items-center justify-between"><dt className="text-text-light">Card</dt><dd className="inline-flex items-center gap-1"><CreditCard className="w-3 h-3" /> {row.paystack_card_brand} ending in {row.paystack_card_last4}</dd></div>
        )}
      </dl>
    </article>
  );
}
