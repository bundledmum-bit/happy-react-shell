import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useBulkApplyMargin,
  useBulkApplyMarginByCategory,
  useBulkApplyMarginByBundleTier,
  type BundleTier,
} from "@/hooks/useBrandMargins";

export type BulkApplyScope = "selected" | "category" | "tier";

export function BulkApplyModal({
  open, onOpenChange, scope, selectedBrandIds, categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scope: BulkApplyScope;
  selectedBrandIds?: string[];
  categories: string[];
}) {
  const [marginPct, setMarginPct] = useState<string>("30");
  const [category, setCategory] = useState<string>(categories[0] || "");
  const [tier, setTier] = useState<BundleTier>("starter");

  const bulk = useBulkApplyMargin();
  const byCat = useBulkApplyMarginByCategory();
  const byTier = useBulkApplyMarginByBundleTier();

  const isBusy = bulk.isPending || byCat.isPending || byTier.isPending;

  const onApply = async () => {
    const pct = Number(marginPct);
    if (!Number.isFinite(pct)) {
      toast.error("Enter a valid margin %");
      return;
    }
    try {
      let result: { updated: number; skipped: number };
      if (scope === "selected") {
        result = await bulk.mutateAsync({ brandIds: selectedBrandIds || [], marginPct: pct });
      } else if (scope === "category") {
        if (!category) { toast.error("Pick a category"); return; }
        result = await byCat.mutateAsync({ category, marginPct: pct });
      } else {
        result = await byTier.mutateAsync({ tier, marginPct: pct });
      }
      toast.success(
        `Applied ${pct}% margin to ${result.updated} brands. Skipped ${result.skipped} brands without cost price.`,
      );
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Bulk apply failed");
    }
  };

  const title =
    scope === "selected" ? "Apply margin to selected brands"
    : scope === "category" ? "Apply margin to a category"
    : "Apply margin to a bundle tier";

  const description =
    scope === "selected"
      ? `Recompute retail prices for ${selectedBrandIds?.length || 0} selected brands using cost × (1 + margin%).`
      : scope === "category"
      ? "Recompute retail prices for every in-stock brand of active products in this category."
      : "Recompute retail prices for every in-stock brand whose product appears in any active bundle of this tier.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {scope === "category" && (
            <div className="space-y-1.5">
              <Label htmlFor="bulk-cat">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="bulk-cat"><SelectValue placeholder="Pick a category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {scope === "tier" && (
            <div className="space-y-1.5">
              <Label htmlFor="bulk-tier">Bundle tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as BundleTier)}>
                <SelectTrigger id="bulk-tier"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="bulk-pct">Target margin %</Label>
            <Input
              id="bulk-pct"
              type="number"
              step="0.1"
              value={marginPct}
              onChange={(e) => setMarginPct(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              New retail = cost × (1 + margin / 100), truncated to whole naira.
              Brands without a cost price are skipped.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>Cancel</Button>
          <Button onClick={onApply} disabled={isBusy}>
            {isBusy ? "Applying…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkApplyModal;
