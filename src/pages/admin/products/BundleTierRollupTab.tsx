import { useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBundleTierRollup, useBundleStaleness, type BundleTier, type TierRollup, type TierStaleness } from "@/hooks/useBrandMargins";
import { fmt } from "@/lib/cart";

const TIER_LABEL: Record<BundleTier, string> = {
  starter: "Starter",
  standard: "Standard",
  premium: "Premium",
};

export default function BundleTierRollupTab() {
  const rollupQuery = useBundleTierRollup();
  const staleQuery = useBundleStaleness();

  // Estimator state.
  const [counts, setCounts] = useState<Record<BundleTier, string>>({
    starter: "0",
    standard: "0",
    premium: "0",
  });

  const tiers: BundleTier[] = ["starter", "standard", "premium"];

  if (rollupQuery.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const data = rollupQuery.data;
  const stale = staleQuery.data;
  if (!data) return <div className="text-sm text-muted-foreground">No data.</div>;

  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="space-y-2">
        {tiers.map(t => (
          <TierSection
            key={t}
            tier={t}
            rollup={data[t]}
            staleness={stale?.[t]}
          />
        ))}
      </Accordion>

      <Estimator
        counts={counts}
        setCounts={setCounts}
        rollup={data}
        stale={stale}
      />
    </div>
  );
}

function TierSection({
  tier, rollup, staleness,
}: {
  tier: BundleTier;
  rollup: TierRollup;
  staleness: TierStaleness | undefined;
}) {
  const headerStats = (
    <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
      <span>cost <b className="text-foreground">{fmt(rollup.totalCost)}</b></span>
      <span>retail <b className="text-foreground">{fmt(rollup.totalRetail)}</b></span>
      <span>margin <b className="text-foreground">{fmt(rollup.marginNaira)}</b></span>
      <span>{rollup.marginPct.toFixed(1)}%</span>
    </div>
  );

  return (
    <AccordionItem value={tier} className="bg-card border border-border rounded-xl">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex flex-1 items-center gap-3">
          <span className="font-semibold text-sm">{TIER_LABEL[tier]}</span>
          <span className="text-[11px] bg-muted px-2 py-0.5 rounded font-semibold text-muted-foreground">
            {rollup.productCount} products
          </span>
          {!rollup.bundleId && (
            <span className="text-[11px] text-muted-foreground italic">no active bundle</span>
          )}
          <div className="ml-auto pr-2">{headerStats}</div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 space-y-3">
        {rollup.productsWithoutCost > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 text-red-900 px-3 py-2 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{rollup.productsWithoutCost} products in this tier have no cost price recorded.</span>
          </div>
        )}
        {staleness?.isStale && (
          <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-900 px-3 py-2 text-xs">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Bundle SKU price ({fmt(staleness.bundlePrice ?? 0)}) differs from member item total ({fmt(staleness.computedTotal)}).
              Update bundle price or item prices to align.
            </span>
          </div>
        )}

        {rollup.expandedItems.length === 0 ? (
          <div className="text-xs text-muted-foreground">No items in this tier.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-16">Qty</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Retail</TableHead>
                <TableHead>Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rollup.expandedItems.map((it, i) => (
                <TableRow key={`${it.productId}-${i}`}>
                  <TableCell className="text-sm font-medium">{it.productName}</TableCell>
                  <TableCell className="text-sm">{it.qty}</TableCell>
                  <TableCell className="text-sm">{it.brandName}</TableCell>
                  <TableCell className="text-sm">{it.costPrice == null ? "—" : fmt(it.costPrice)}</TableCell>
                  <TableCell className="text-sm">{fmt(it.retailPrice)}</TableCell>
                  <TableCell className="text-sm">
                    {it.costPrice == null ? "—" : `${it.marginPct.toFixed(1)}%`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border">
          <span>Total cost: <b className="text-foreground">{fmt(rollup.totalCost)}</b></span>
          <span>Total retail: <b className="text-foreground">{fmt(rollup.totalRetail)}</b></span>
          <span>Margin: <b className="text-foreground">{fmt(rollup.marginNaira)}</b> ({rollup.marginPct.toFixed(1)}%)</span>
          {rollup.bundlePrice != null && (
            <span>Bundle SKU price: <b className="text-foreground">{fmt(rollup.bundlePrice)}</b></span>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function Estimator({
  counts, setCounts, rollup, stale,
}: {
  counts: Record<BundleTier, string>;
  setCounts: (v: Record<BundleTier, string>) => void;
  rollup: { starter: TierRollup; standard: TierRollup; premium: TierRollup };
  stale: { starter: TierStaleness; standard: TierStaleness; premium: TierStaleness } | undefined;
}) {
  const parsed = {
    starter: Math.max(0, Math.trunc(Number(counts.starter) || 0)),
    standard: Math.max(0, Math.trunc(Number(counts.standard) || 0)),
    premium: Math.max(0, Math.trunc(Number(counts.premium) || 0)),
  };

  const tierRevenue = (t: BundleTier) => {
    const price = stale?.[t]?.bundlePrice ?? rollup[t].bundlePrice ?? 0;
    return price * parsed[t];
  };
  const tierCost = (t: BundleTier) => rollup[t].totalCost * parsed[t];

  const totalRevenue = tierRevenue("starter") + tierRevenue("standard") + tierRevenue("premium");
  const totalCost = tierCost("starter") + tierCost("standard") + tierCost("premium");
  const profit = totalRevenue - totalCost;
  const pct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  const allZero = parsed.starter === 0 && parsed.standard === 0 && parsed.premium === 0;

  const sentence = allZero
    ? "Enter bundle counts to estimate revenue."
    : `If you sell ${parsed.starter} starter, ${parsed.standard} standard, ${parsed.premium} premium bundles, you'll make ${fmt(totalRevenue)} revenue, ${fmt(profit)} profit (${pct.toFixed(1)}%).`;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Estimator</h3>
        <p className="text-xs text-muted-foreground">Project revenue and profit for a planned mix of bundles.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {(["starter", "standard", "premium"] as const).map(t => (
          <div key={t} className="space-y-1">
            <Label htmlFor={`est-${t}`} className="capitalize text-xs">{t}</Label>
            <Input
              id={`est-${t}`}
              type="number"
              min="0"
              value={counts[t]}
              onChange={(e) => setCounts({ ...counts, [t]: e.target.value })}
              className="h-9 w-28"
            />
          </div>
        ))}
      </div>
      <p className="text-sm">{sentence}</p>
    </div>
  );
}
