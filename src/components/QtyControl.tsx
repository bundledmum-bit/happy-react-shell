import { Minus, Plus } from "lucide-react";

interface QtyControlProps {
  qty: number;
  onUpdate: (newQty: number) => void;
  maxQty?: number;
  size?: "sm" | "md";
  accentColor?: "forest" | "coral";
}

export default function QtyControl({ qty, onUpdate, maxQty, size = "sm", accentColor = "forest" }: QtyControlProps) {
  const isForest = accentColor === "forest";
  const btnBase = size === "sm"
    ? "w-6 h-6 rounded-full flex items-center justify-center transition-colors"
    : "w-8 h-8 rounded-full flex items-center justify-center transition-colors";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  const borderColor = isForest ? "border-forest" : "border-coral";
  const bgLight = isForest ? "bg-forest-light" : "bg-coral/10";
  const textColor = isForest ? "text-forest" : "text-coral";
  const bgSolid = isForest ? "bg-forest hover:bg-forest-deep" : "bg-coral hover:bg-coral-dark";

  const atMax = maxQty != null && qty >= maxQty;

  return (
    <div className={`flex items-center gap-0 rounded-pill border ${borderColor} ${bgLight} overflow-hidden`}>
      <button
        onClick={() => onUpdate(qty - 1)}
        className={`${btnBase} ${textColor} hover:bg-foreground/5`}
        aria-label="Decrease quantity"
      >
        <Minus className={iconSize} />
      </button>
      <span className={`${textSize} font-bold ${textColor} min-w-[20px] text-center select-none`}>{qty}</span>
      <button
        onClick={() => { if (!atMax) onUpdate(qty + 1); }}
        className={`${btnBase} ${atMax ? "bg-border cursor-not-allowed text-muted-foreground" : `${bgSolid} text-primary-foreground`}`}
        aria-label="Increase quantity"
        disabled={atMax}
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
}
