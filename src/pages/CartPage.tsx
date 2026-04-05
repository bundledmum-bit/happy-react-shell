import { Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { cart, setCart, subtotal, totalItems } = useCart();

  const delivery = subtotal >= 30000 ? 0 : 2500;
  const total = subtotal + delivery;

  const updateQty = (key: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i._key !== key));
    } else {
      setCart(prev => prev.map(i => i._key === key ? { ...i, qty: newQty } : i));
    }
  };

  const removeItem = (key: string) => {
    setCart(prev => prev.filter(i => i._key !== key));
  };

  if (!totalItems) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center animate-fade-up">
          <ShoppingBag className="mx-auto h-16 w-16 text-text-light mb-4" />
          <h1 className="pf text-2xl mb-2">Your cart is empty 🛍️</h1>
          <p className="font-body text-text-med mb-6">Start building your perfect hospital bag</p>
          <Link to="/bundles" className="rounded-pill bg-coral px-8 py-3 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive inline-block">
            Browse Bundles →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8">
        <h1 className="pf text-2xl md:text-3xl mb-8">Your Cart ({totalItems})</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {subtotal >= 30000 && (
              <div className="bg-forest-light rounded-card p-3 text-center font-body text-sm text-forest font-semibold">
                🎉 You qualify for FREE delivery!
              </div>
            )}
            {cart.map(item => (
              <div key={item._key} className="bg-card rounded-card shadow-card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-warm-cream flex items-center justify-center text-2xl flex-shrink-0">
                  {item.img || item.baseImg}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-body font-semibold text-sm truncate">{item.name}</h3>
                  {item.selectedBrand && <span className="font-body text-xs text-forest">{item.selectedBrand.label}</span>}
                  <p className="font-body font-bold text-coral text-sm mt-1">{fmt(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item._key, item.qty - 1)} className="h-8 w-8 rounded-full bg-warm-cream flex items-center justify-center interactive">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-body font-bold text-sm w-6 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item._key, item.qty + 1)} className="h-8 w-8 rounded-full bg-warm-cream flex items-center justify-center interactive">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="font-body font-bold text-sm w-20 text-right">{fmt(item.price * item.qty)}</p>
                <button onClick={() => removeItem(item._key)} className="text-text-light hover:text-destructive interactive p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-card rounded-card shadow-card p-6">
              <h2 className="pf text-lg mb-4">Order Summary</h2>
              <div className="space-y-2 font-body text-sm">
                <div className="flex justify-between"><span className="text-text-med">Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between">
                  <span className="text-text-med">Delivery</span>
                  <span className={delivery === 0 ? "text-forest font-bold" : ""}>{delivery === 0 ? "FREE 🎉" : fmt(delivery)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between pf font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-forest">{fmt(total)}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="mt-5 block w-full rounded-pill bg-forest py-3 text-center font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive"
              >
                Proceed to Checkout 🔒
              </Link>
              <p className="text-center font-body text-xs text-text-light mt-3">
                Secured by Paystack · All cards accepted
              </p>
              <div className="flex justify-center gap-3 mt-2 text-xs text-text-light">
                <span>💳 Visa</span><span>💳 Mastercard</span><span>🏦 USSD</span><span>📱 Transfer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
