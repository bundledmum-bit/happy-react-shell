import { useState, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Star, ShoppingBag } from "lucide-react";
import QtyControl from "@/components/QtyControl";
import { useCart, fmt, getBrandForBudget } from "@/lib/cart";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { Product } from "@/lib/supabaseAdapters";
import ProductImage from "@/components/ProductImage";
import { trackEvent } from "@/lib/analytics";
import { useSiteSettings } from "@/hooks/useSupabaseData";

interface Props {
  product: Product | null;
  defaultBudget?: string;
  onClose: () => void;
}

export default function ProductDetailDrawer({ product, defaultBudget = "standard", onClose }: Props) {
  if (!product) return null;

  return (
    <Drawer open={!!product} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[calc(100vh-60px)] flex flex-col outline-none">
        <DrawerInner product={product} defaultBudget={defaultBudget} onClose={onClose} />
      </DrawerContent>
    </Drawer>
  );
}

function DrawerInner({ product, defaultBudget, onClose }: { product: Product; defaultBudget: string; onClose: () => void }) {
  const defaultBrand = getBrandForBudget(product, defaultBudget);
  const [selectedBrand, setSelectedBrand] = useState(defaultBrand);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const { cart, addToCart, updateQty } = useCart();
  const { data: settings } = useSiteSettings();
  const cartItem = cart.find(c => c.id === product.id);
  const isInCart = !!cartItem;

  const deliveryText = settings?.delivery_text || "Delivery: 1–3 business days";

  useEffect(() => {
    trackEvent("product_viewed", { product_id: product.id, product_name: product.name });
  }, [product.id, product.name]);

  const displayImage = selectedBrand?.imageUrl || product.imageUrl;
  const isOutOfStock = selectedBrand?.inStock === false || selectedBrand?.stockQuantity === 0;
  const isLowStock = selectedBrand?.stockQuantity != null && selectedBrand.stockQuantity > 0 && selectedBrand.stockQuantity <= 5;
  const showSalePrice = selectedBrand?.compareAtPrice && selectedBrand.compareAtPrice > selectedBrand.price;
  const savings = showSalePrice ? selectedBrand.compareAtPrice! - selectedBrand.price : 0;
  const savingsPercent = showSalePrice ? Math.round((savings / selectedBrand.compareAtPrice!) * 100) : 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size.");
      return;
    }
    addToCart({
      ...product,
      selectedBrand,
      price: selectedBrand.price,
      name: `${product.name} (${selectedBrand.label})`,
      selectedSize,
    });
    toast.success(`✓ ${product.name} added to cart`, {
      action: { label: "View Cart →", onClick: () => window.location.href = "/cart" },
    });
  };

  const getWhyText = () => {
    if (!product.whyIncluded) return "";
    if (typeof product.whyIncluded === "string") return product.whyIncluded;
    return Object.values(product.whyIncluded)[0] || "";
  };

  return (
    <>
      <div className="overflow-y-auto flex-1 overscroll-contain">
        {/* Product Image */}
        <div className="h-52 md:h-64 flex items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: displayImage ? '#f5f5f5' : (selectedBrand.color || "#F0F7F4") }}>
          {product.badge && (
            <span className="absolute top-3 left-3 bg-coral text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-pill uppercase z-10">{product.badge}</span>
          )}
          {showSalePrice && (
            <span className="absolute top-3 right-3 bg-destructive text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-pill z-10">
              Save {savingsPercent}%
            </span>
          )}
          <ProductImage imageUrl={displayImage} emoji={selectedBrand.img || product.baseImg} alt={product.name} className="w-full h-full object-contain p-4" emojiClassName="text-7xl" />
        </div>

        <div className="p-5">
          {/* Name & Description */}
          <h2 className="pf text-xl font-bold mb-1">{product.name}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-3">{product.description}</p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.rating) ? "text-coral fill-coral" : "text-border"}`} />
              ))}
            </div>
            <span className="text-sm font-semibold">{product.rating}</span>
            <span className="text-muted-foreground text-xs">({product.reviews} reviews)</span>
          </div>

          {/* Delivery Estimate */}
          <div className="bg-forest-light rounded-lg px-3 py-2 text-xs text-forest font-semibold mb-3">
            🚚 {deliveryText}
          </div>

          {/* Product Details */}
          <div className="space-y-2 mb-3">
            {product.packInfo && (
              <div className="bg-warm-cream rounded-lg px-3 py-2 text-xs"><span className="font-semibold">📦 </span>{product.packInfo}</div>
            )}
            {product.material && (
              <div className="bg-warm-cream rounded-lg px-3 py-2 text-xs"><span className="font-semibold">🧵 Material: </span>{product.material}</div>
            )}
            {product.contents && product.contents.length > 0 && (
              <div className="bg-warm-cream rounded-lg px-3 py-2 text-xs">
                <span className="font-semibold">📋 Includes: </span>{product.contents.join(" · ")}
              </div>
            )}
            {product.safetyInfo && (
              <div className="bg-warm-cream rounded-lg px-3 py-2 text-xs"><span className="font-semibold">🛡️ </span>{product.safetyInfo}</div>
            )}
          </div>

          {/* Brand Selector */}
          <div className="mb-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Choose Brand</p>
            <div className="flex flex-wrap gap-2">
              {product.brands.map(b => {
                const brandOos = b.inStock === false || b.stockQuantity === 0;
                return (
                  <button key={b.id} onClick={() => setSelectedBrand(b)}
                    className={`min-h-[44px] px-3 py-2 rounded-pill text-xs font-semibold border-[1.5px] transition-all font-body flex items-center gap-1.5 ${brandOos ? "opacity-50" : ""} ${selectedBrand.id === b.id ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-muted-foreground"}`}>
                    {b.logoUrl && <img src={b.logoUrl} alt="" className="w-4 h-4 object-contain" />}
                    {b.label} — {fmt(b.price)}
                    {b.compareAtPrice && b.compareAtPrice > b.price && (
                      <span className="line-through text-muted-foreground text-[10px]">{fmt(b.compareAtPrice)}</span>
                    )}
                    {brandOos && <span className="text-destructive text-[9px]">OOS</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`min-h-[44px] px-3 py-2 rounded-pill text-xs font-semibold border-[1.5px] transition-all font-body ${selectedSize === s ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-muted-foreground"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLowStock && (
            <p className="text-[#E65100] text-xs font-semibold mb-3">🔥 Only {selectedBrand.stockQuantity} left!</p>
          )}

          {/* Why Included */}
          {getWhyText() && (
            <div className="bg-forest-light rounded-lg p-3 text-xs text-forest mb-3">
              <span className="font-semibold">💡 Why mums love this: </span>{getWhyText()}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="sticky bottom-0 bg-card border-t border-border p-4 flex items-center justify-between gap-4 z-10">
        <div>
          <p className="pf text-xl font-bold text-forest">{fmt(selectedBrand.price)}</p>
          {showSalePrice && (
            <p className="text-muted-foreground text-xs line-through">{fmt(selectedBrand.compareAtPrice!)}</p>
          )}
        </div>
        {isOutOfStock ? (
          <button className="rounded-pill bg-border px-6 py-3 text-sm font-semibold text-muted-foreground cursor-not-allowed min-h-[44px]">
            Out of Stock
          </button>
        ) : isInCart && cartItem ? (
          <div className="flex items-center gap-3">
            <QtyControl qty={cartItem.qty} onUpdate={(newQty) => updateQty(cartItem._key, newQty)} size="md" maxQty={selectedBrand.stockQuantity ?? undefined} />
            <Link to="/cart" className="text-forest text-sm font-semibold hover:underline font-body">
              Cart →
            </Link>
          </div>
        ) : (
          <button onClick={handleAdd} className="rounded-pill bg-forest px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-forest-deep font-body interactive flex items-center gap-2 min-h-[44px]">
            <ShoppingBag className="h-4 w-4" /> Add to Cart
          </button>
        )}
      </div>
    </>
  );
}