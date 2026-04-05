import { Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { cart, updateQty, removeFromCart, subtotal, totalItems } = useCart();

  const deliveryFee = subtotal >= 30000 ? 0 : 2500;
  const total = subtotal + deliveryFee;

  if (!totalItems) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center animate-fade-up">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="font-display font-black text-2xl mb-2">Your cart is empty 🛍️</h1>
          <p className="font-body text-muted-foreground mb-6">Start building your perfect hospital bag</p>
          <Link to="/bundles" className="rounded-pill bg-coral px-8 py-3 font-display font-bold text-primary-foreground hover:bg-coral-dark interactive inline-block">
            Browse Bundles →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display font-black text-2xl md:text-3xl mb-8">Your Cart ({totalItems})</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {subtotal >= 30000 && (
              <div className="bg-mint rounded-card p-3 text-center font-body text-sm text-forest font-bold">
                🎉 You qualify for FREE delivery!
              </div>
            )}
            {cart.map(item => (
              <div key={`${item.id}-${item.brand}`} className="bg-card rounded-card shadow-card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-warm-grey flex items-center justify-center text-2xl flex-shrink-0">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-sm truncate">{item.name}</h3>
                  <span className="font-body text-xs text-muted-foreground">{item.brand}</span>
                  <p className="font-display font-bold text-coral text-sm mt-1">{fmt(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, item.brand, item.qty - 1)} className="h-8 w-8 rounded-full bg-warm-grey flex items-center justify-center interactive">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-display font-bold text-sm w-6 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.brand, item.qty + 1)} className="h-8 w-8 rounded-full bg-warm-grey flex items-center justify-center interactive">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="font-display font-bold text-sm w-20 text-right">{fmt(item.price * item.qty)}</p>
                <button onClick={() => removeFromCart(item.id, item.brand)} className="text-muted-foreground hover:text-destructive interactive p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-card rounded-card shadow-card p-6">
              <h2 className="font-display font-bold text-lg mb-4">Order Summary</h2>
              <div className="space-y-2 font-body text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? "text-forest font-bold" : ""}>{deliveryFee === 0 ? "FREE" : fmt(deliveryFee)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-display font-bold text-lg">
                  <span>Total</span>
                  <span className="text-coral">{fmt(total)}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="mt-5 block w-full rounded-pill bg-forest py-3 text-center font-display font-bold text-primary-foreground hover:bg-forest-deep interactive"
              >
                Proceed to Checkout 🔒
              </Link>
              <p className="text-center font-body text-xs text-muted-foreground mt-3">
                Secured by Paystack · All cards accepted
              </p>
              <div className="flex justify-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>💳 Visa</span>
                <span>💳 Mastercard</span>
                <span>🏦 USSD</span>
                <span>📱 Transfer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
