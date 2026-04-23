import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Repeat, Plus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { fmtN } from "@/hooks/useSubscription";

interface SubscriptionRow {
  id: string;
  status: string;
  frequency: string;
  next_charge_date: string | null;
  total_per_cycle_naira: number | null;
  created_at: string;
}

export default function AccountSubscriptions() {
  const { user } = useCustomerAuth();

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["my-subscriptions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Best-effort fetch against a `subscriptions` table; if the table
      // doesn't exist yet the query just returns empty (caught below).
      try {
        const { data, error } = await (supabase as any)
          .from("subscriptions")
          .select("id, status, frequency, next_charge_date, total_per_cycle_naira, created_at")
          .eq("customer_id", user?.id)
          .order("created_at", { ascending: false });
        if (error) return [];
        return (data || []) as SubscriptionRow[];
      } catch { return []; }
    },
  });

  const empty = useMemo(() => !isLoading && subs.length === 0, [isLoading, subs]);

  return (
    <div className="min-h-screen bg-[#FFF8F4]">
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
        {row.total_per_cycle_naira != null && (
          <div className="flex items-center justify-between"><dt className="text-text-light">Total per cycle</dt><dd className="font-semibold tabular-nums">{fmtN(row.total_per_cycle_naira)}</dd></div>
        )}
      </dl>
    </article>
  );
}
