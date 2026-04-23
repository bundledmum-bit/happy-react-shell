import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, CreditCard, Calendar, Package, Mail } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import {
  fmtN, WEEKDAY_LABEL, RESULT_KEY,
  type SubscriptionDraftItem,
} from "@/hooks/useSubscription";

interface ResultPayload {
  success: boolean;
  subscription_id?: string;
  customer_email?: string;
  next_charge_date?: string | null;
  delivery_day?: string | null;
  card_brand?: string | null;
  card_last4?: string | null;

  items?: SubscriptionDraftItem[];
  cycle_size?: number;
  total_per_delivery?: number;
  total_paid?: number;
  first_delivery_date?: string | null;
  last_delivery_date?: string | null;
}

function fmtLong(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return iso; }
}

export default function SubscriptionThankYou() {
  const navigate = useNavigate();
  const { user } = useCustomerAuth();
  const [data, setData] = useState<ResultPayload | null>(null);
  const [dismissAcctPrompt, setDismissAcctPrompt] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read once on mount and clear. If nothing's there, back to /subscriptions.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RESULT_KEY);
      if (raw) {
        setData(JSON.parse(raw));
        sessionStorage.removeItem(RESULT_KEY);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !data) navigate("/subscriptions", { replace: true });
  }, [hydrated, data, navigate]);

  if (!hydrated || !data) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-text-light">Loading…</div>;
  }

  const firstDelivery = data.first_delivery_date || data.next_charge_date;
  const deliveryDayLabel = data.delivery_day ? (WEEKDAY_LABEL[data.delivery_day] || data.delivery_day) : "—";

  return (
    <div className="min-h-screen bg-[#FFF8F4] pt-20 md:pt-24 pb-16">
      <div className="max-w-[640px] mx-auto px-4 py-6 space-y-4">
        <section className="bg-card border border-border rounded-card p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="pf text-2xl font-bold">You're subscribed!</h1>
          {data.customer_email && <p className="text-xs text-text-med">Confirmation sent to <b>{data.customer_email}</b>.</p>}
        </section>

        <section className="bg-card border border-border rounded-card p-4 space-y-2 text-sm">
          <dl className="space-y-1">
            <Row label="Delivery day" v={<span className="font-semibold">{deliveryDayLabel} · starting {fmtLong(firstDelivery)}</span>} />
            {data.cycle_size != null && <Row label="Deliveries per cycle" v={<b>{data.cycle_size}</b>} />}
            <Row label="First cycle ends" v={fmtLong(data.last_delivery_date)} />
            <p className="text-[11px] text-text-light">Renews automatically — cancel any time from your account.</p>
            {data.card_brand && data.card_last4 && (
              <Row label="Card" v={<span className="inline-flex items-center gap-1 font-semibold"><CreditCard className="w-3 h-3" /> {data.card_brand} ending {data.card_last4}</span>} />
            )}
          </dl>
          <div className="border-t border-border pt-2 space-y-0.5">
            {data.total_per_delivery != null && (
              <p className="text-xs"><b className="text-forest">Price this cycle:</b> {fmtN(data.total_per_delivery)} per delivery <span className="text-text-light">(locked)</span></p>
            )}
            <p className="text-xs"><b>Future cycles:</b> charged at current prices at renewal.</p>
            {data.total_paid != null && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs uppercase tracking-widest font-semibold text-text-med">Total paid today</span>
                <span className="font-bold tabular-nums text-forest">{fmtN(data.total_paid)} · <span className="text-emerald-700">FREE delivery</span></span>
              </div>
            )}
          </div>
        </section>

        <section className="bg-card border border-border rounded-card p-4 text-xs space-y-2">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-med">Next steps</h3>
          <ul className="space-y-1">
            <li className="flex items-start gap-2"><Package className="w-3.5 h-3.5 mt-0.5 text-forest" /> First delivery arrives on <b className="ml-1">{fmtLong(firstDelivery)}</b></li>
            {data.customer_email && <li className="flex items-start gap-2"><Mail className="w-3.5 h-3.5 mt-0.5 text-forest" /> Email confirmation sent to {data.customer_email}</li>}
            <li className="flex items-start gap-2"><Calendar className="w-3.5 h-3.5 mt-0.5 text-forest" /> We'll email you the day before each delivery</li>
            {data.cycle_size != null && (
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-forest" /> After {data.cycle_size} deliveries your subscription auto-renews</li>
            )}
          </ul>
        </section>

        {user ? (
          <Link
            to="/account/subscriptions"
            className="w-full rounded-pill bg-forest text-primary-foreground py-3 text-sm font-semibold text-center hover:bg-forest-deep"
          >
            View my subscription →
          </Link>
        ) : (
          !dismissAcctPrompt && (
            <section className="bg-emerald-50 border-2 border-emerald-600 rounded-card p-4 space-y-2">
              <h3 className="font-bold text-sm text-emerald-800">Create a free account to manage your subscription</h3>
              <ul className="text-xs text-emerald-900/80 space-y-0.5 pl-4 list-disc">
                <li>Change your delivery day</li>
                <li>View all deliveries</li>
                <li>Cancel or pause your subscription</li>
              </ul>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  to="/account/login?redirect=/account/subscriptions"
                  className="inline-flex items-center gap-1.5 rounded-pill bg-forest text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-forest-deep"
                >
                  Create account →
                </Link>
                <button onClick={() => setDismissAcctPrompt(true)} className="text-xs text-text-med hover:text-foreground px-2 py-1">Maybe later</button>
              </div>
            </section>
          )
        )}
      </div>
    </div>
  );
}

function Row({ label, v }: { label: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-text-light text-xs">{label}</dt>
      <dd className="text-xs text-right">{v}</dd>
    </div>
  );
}
