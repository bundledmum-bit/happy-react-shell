import { Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { useAllProducts, useSiteSettings } from "@/hooks/useSupabaseData";
import { useSpendThresholds, getSpendPrompt } from "@/hooks/useSpendThresholds";
import ProductImage from "@/components/ProductImage";
import SpendMoreBanner from "@/components/SpendMoreBanner";
import { Minus, Plus, X, ShoppingBag, ArrowLeft, Bookmark, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Coerce a cart item's `img` value to a usable <img src>. Accepts:
 *   - absolute URLs: http://… / https://…
 *   - protocol-relative URLs: //…  (Jumia CDN uses these)
 *   - paths:        /images/…  (app-local)
 * Anything else (an emoji, or a stray filename) returns undefined so we
 * fall back to the emoji/placeholder path instead of attempting a fetch.
 */
function resolveImgUrl(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("/")) return s;
  return undefined;
}

/**
 * Only pass the raw value through as an emoji fallback if it is short
 * enough to plausibly BE an emoji. A URL or long filename must never
 * end up rendered inside a text span — that's what causes the giant
 * URL-bleed we've seen on broken images.
 */
function resolveEmojiFallback(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (s.length > 4) return undefined;                  // too long to be a single emoji
  if (/[a-zA-Z0-9/.:_\-\\]/.test(s)) return undefined; // looks like a URL / path / filename
  return s;
}

export default function CartPage() {
  const { cart, setCart, subtotal, totalItems, savedItems, saveForLater, moveToCart, removeSaved } = useCart();
  const { data: settings } = useSiteSettings();
  const { data: thresholds } = useSpendThresholds();

  useEffect(() => { document.title = `Your Cart (${totalItems}) | BundledMum`; }, [totalItems]);

  const serviceFeeEnabled = settings?.service_fee_enabled !== false;
  const serviceFee = serviceFeeEnabled ? (parseInt(settings?.service_fee) || 0) : 0;
  const serviceFeeLabel = settings?.service_fee_label || "Service & Packaging";

  const defaultFreeThreshold = parseInt(settings?.default_free_threshold) || 0;

  // Spend threshold discount
  const spendPrompt = thresholds?.length ? getSpendPrompt(subtotal, thresholds) : null;
  const spendDiscount = spendPrompt?.appliedDiscount || 0;
  // Delivery fee is NOT added in the cart total — it's only known once
  // the customer enters their full location at checkout. See the
  // "Delivery fee calculated at checkout" note in the order summary.
  const total = subtotal + serviceFee - spendDiscount;

  const updateQty = (key: string, newQty: number) => {
    if (newQty <= 0) setCart(prev => prev.filter(i => i._key !== key));
    else setCart(prev => prev.map(i => i._key === key ? { ...i, qty: newQty } : i));
  };

  const removeItem = (key: string) => setCart(prev => prev.filter(i => i._key !== key));

  const { data: allProductsData } = useAllProducts();
  const ALL_PRODUCTS = allProductsData || [];
  const cartIds = new Set(cart.map(i => i.id));
  const hasBaby = cart.some(i => ALL_PRODUCTS.find(p => p.id === i.id)?.category === "baby");
  const hasMum = cart.some(i => ALL_PRODUCTS.find(p => p.id === i.id)?.category === "mum");
  const crossSell = ALL_PRODUCTS
    .filter(p => !cartIds.has(p.id) && p.priority !== "nice-to-have")
    .filter(p => (hasBaby && p.category === "mum") || (hasMum && p.category === "baby") || (!hasBaby && !hasMum))
    .slice(0, 3);

  if (!totalItems && savedItems.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-20">
        <div className="max-w-[600px] mx-auto px-4 text-center animate-fade-up pt-10">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="pf text-2xl mb-2">Your cart is empty 🛍️</h1>
          <p className="font-body text-muted-foreground mb-6">Start building your perfect hospital bag</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link to="/bundles" className="rounded-pill bg-coral px-8 py-3 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive inline-block min-h-[48px] flex items-center justify-center">
              Browse Bundles →
            </Link>
            <Link to="/quiz" className="rounded-pill border-2 border-forest text-forest px-8 py-3 font-body font-semibold hover:bg-forest/5 interactive inline-block min-h-[48px] flex items-center justify-center">
              Take the Quiz →
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            <div className="bg-forest-light rounded-lg px-4 py-3 text-xs text-forest font-semibold">🚚 {defaultFreeThreshold ? `Free delivery over ${fmt(defaultFreeThreshold)}` : "Free delivery available"}</div>
            <div className="bg-forest-light rounded-lg px-4 py-3 text-xs text-forest font-semibold">🔒 Secure Paystack checkout</div>
            <div className="bg-forest-light rounded-lg px-4 py-3 text-xs text-forest font-semibold">💬 WhatsApp support</div>
          </div>

          {/* Popular items */}
          {ALL_PRODUCTS.length > 0 && (
            <div>
              <h3 className="pf text-lg text-forest mb-4">✨ Popular Items</h3>
              <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                  {ALL_PRODUCTS.filter(p => p.badge || p.rating >= 4.8).slice(0, 6).map(p => {
                    const brand = p.brands[Math.min(1, p.brands.length - 1)];
                    return (
                      <Link to="/shop" key={p.id} className="bg-card rounded-card shadow-card p-3 text-center min-w-[140px] max-w-[160px]">
                        <ProductImage imageUrl={p.imageUrl} emoji={p.baseImg} alt={p.name} className="h-20 w-full rounded-lg mb-2" emojiClassName="text-3xl" bgColor={brand?.color} />
                        <p className="text-[11px] font-semibold truncate mb-1">{p.name}</p>
                        <p className="text-forest text-xs font-bold">{fmt(brand?.price || 0)}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8">
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-forest text-sm font-semibold font-body mb-4 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </Link>
        <h1 className="pf text-2xl md:text-3xl mb-8">Your Cart ({totalItems})</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            <SpendMoreBanner variant="cart" />
            {cart.map(item => (
              <div key={item._key} className="bg-card rounded-card shadow-card p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <ProductImage imageUrl={resolveImgUrl(item.img)} emoji={resolveEmojiFallback(item.img) || resolveEmojiFallback(item.baseImg)} alt={item.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-warm-cream" emojiClassName="text-xl sm:text-2xl" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body font-semibold text-[13px] sm:text-sm leading-tight line-clamp-2">{item.name}</h3>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                      {item.selectedBrand && <span className="font-body text-[11px] text-forest">{item.selectedBrand.label}</span>}
                      {item.selectedSize && <span className="font-body text-[11px] text-text-light">Size: {item.selectedSize}</span>}
                      {item.selectedColor && <span className="font-body text-[11px] text-text-light">Color: {item.selectedColor}</span>}
                    </div>
                    <p className="font-body font-bold text-coral text-sm mt-1">{fmt(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => saveForLater(item._key)} className="text-text-light hover:text-forest interactive p-1" title="Save for later">
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeItem(item._key)} className="text-text-light hover:text-destructive interactive p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item._key, item.qty - 1)} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-warm-cream flex items-center justify-center interactive">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-body font-bold text-sm w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item._key, item.qty + 1)} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-warm-cream flex items-center justify-center interactive">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="font-body font-bold text-sm">{fmt(item.price * item.qty)}</p>
                </div>
              </div>
            ))}

            {savedItems.length > 0 && (
              <div className="mt-6">
                <h3 className="pf text-lg mb-3">💾 Saved for Later ({savedItems.length})</h3>
                <div className="space-y-2">
                  {savedItems.map(item => (
                    <div key={item._key} className="bg-warm-cream rounded-card p-3 flex items-center gap-3">
                      <ProductImage imageUrl={resolveImgUrl(item.img)} emoji={resolveEmojiFallback(item.img) || resolveEmojiFallback(item.baseImg)} alt={item.name} className="w-10 h-10 rounded-lg bg-card" emojiClassName="text-xl" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.name}</p>
                        <p className="text-coral text-xs font-bold">{fmt(item.price)}</p>
                      </div>
                      <button onClick={() => moveToCart(item._key)} className="rounded-pill bg-forest px-3 py-1.5 text-[11px] font-semibold text-primary-foreground font-body interactive">Move to Cart</button>
                      <button onClick={() => removeSaved(item._key)} className="text-text-light hover:text-destructive p-1"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {crossSell.length > 0 && totalItems > 0 && (
              <div className="mt-6">
                <h3 className="pf text-lg mb-3">💡 Mums also added</h3>
                <div className="grid grid-cols-3 gap-2">
                  {crossSell.map(p => {
                    const brand = p.brands[Math.min(1, p.brands.length - 1)];
                    return (
                      <div key={p.id} className="bg-card rounded-card shadow-card p-3 text-center">
                        <ProductImage imageUrl={p.imageUrl} emoji={p.baseImg} alt={p.name} className="h-16 w-full rounded-lg" emojiClassName="text-3xl" bgColor={brand.color} />
                        <p className="text-[11px] font-semibold truncate mb-1">{p.name}</p>
                        <p className="text-forest text-xs font-bold mb-2">{fmt(brand.price)}</p>
                        <Link to="/shop" className="text-forest text-[10px] font-semibold hover:underline">View →</Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-card rounded-card shadow-card p-6">
              <h2 className="pf text-lg mb-4">Order Summary</h2>

              <div className="space-y-2 font-body text-sm">
                <div className="flex justify-between"><span className="text-text-med">Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="bg-muted/40 rounded-lg px-3 py-2 flex items-start gap-2 text-xs text-text-med">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Delivery fee calculated at checkout. Enter your delivery
                    location to see the exact fee for your area.
                  </span>
                </div>
                {serviceFeeEnabled && (
                  <div className="flex justify-between">
                    <span className="text-text-med flex items-center gap-1">📦 {serviceFeeLabel}</span>
                    <span>{fmt(serviceFee)}</span>
                  </div>
                )}
                {spendDiscount > 0 && (
                  <div className="flex justify-between text-forest">
                    <span className="font-semibold">🎉 Spend Discount ({spendPrompt?.currentDiscount?.discount_percent}%)</span>
                    <span className="font-bold">-{fmt(spendDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between pf font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-forest">{fmt(total)}</span>
                </div>
              </div>

              <Link to="/checkout" className="mt-5 block w-full rounded-pill bg-forest py-3 text-center font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive">
                Proceed to Checkout 🔒
              </Link>
              <p className="text-center font-body text-xs text-text-light mt-3">Secured by Paystack · All cards accepted</p>
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
