import { Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { ShoppingBag } from "lucide-react";

export default function FloatingCartBar() {
  const { totalItems, subtotal } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:w-auto z-[80] animate-slide-up">
      <Link to="/cart"
        className="flex items-center justify-between gap-3 bg-forest text-primary-foreground px-5 py-3 md:rounded-pill shadow-lg hover:bg-forest-deep transition-colors">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          <span className="font-body font-semibold text-sm">Your Bundle: {totalItems} items</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{fmt(subtotal)}</span>
          <span className="text-primary-foreground/70 text-xs">View Cart →</span>
        </div>
      </Link>
    </div>
  );
}
