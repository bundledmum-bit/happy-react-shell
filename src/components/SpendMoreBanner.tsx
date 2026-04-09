import { useCart, fmt } from "@/lib/cart";
import { useSpendThresholds, getSpendPrompt } from "@/hooks/useSpendThresholds";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

interface Props {
  variant?: "shop" | "cart";
}

export default function SpendMoreBanner({ variant = "shop" }: Props) {
  const { subtotal, totalItems } = useCart();
  const { data: thresholds } = useSpendThresholds();

  if (!thresholds?.length || totalItems === 0) return null;

  const prompt = getSpendPrompt(subtotal, thresholds);
  if (!prompt) return null;

  const { currentDiscount, appliedDiscount, nextThreshold, amountNeeded, nextSavings, progress } = prompt;

  // Already at highest tier
  if (currentDiscount && !nextThreshold) {
    return (
      <div className="bg-forest-light border border-forest/20 rounded-card p-4 text-center">
        <p className="text-forest font-semibold text-sm">
          🎉 You unlocked {currentDiscount.discount_percent}% off! Saving {fmt(appliedDiscount)} on this order!
        </p>
      </div>
    );
  }

  // Show next threshold prompt
  if (!nextThreshold) return null;

  return (
    <div className="bg-warm-cream border border-coral/20 rounded-card p-4">
      <p className="font-semibold text-sm mb-1">
        {currentDiscount
          ? `🎉 ${currentDiscount.discount_percent}% off applied! Spend ${fmt(amountNeeded)} more to unlock ${nextThreshold.discount_percent}% off (save ${fmt(nextSavings)}!)`
          : `🎁 Spend ${fmt(amountNeeded)} more and get ${nextThreshold.discount_percent}% off (save ${fmt(nextSavings)}!)`}
      </p>
      <div className="flex items-center gap-3 mt-2">
        <Progress value={progress} className="h-2 flex-1" />
        <span className="text-text-light text-xs whitespace-nowrap">{fmt(subtotal)} / {fmt(nextThreshold.threshold_amount)}</span>
      </div>
      {variant === "cart" && (
        <Link to="/shop" className="text-forest text-xs font-semibold mt-2 inline-block hover:underline">Keep Shopping →</Link>
      )}
    </div>
  );
}
