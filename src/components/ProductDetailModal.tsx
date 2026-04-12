import { useState, useEffect } from "react";
import { X, Star, ShoppingBag } from "lucide-react";
import QtyControl from "@/components/QtyControl";
import { useCart, fmt, getBrandForBudget } from "@/lib/cart";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useBundles } from "@/hooks/useSupabaseData";
import type { Product } from "@/lib/supabaseAdapters";
import { getProductImageUrl } from "@/lib/supabaseAdapters";
import ProductImage from "@/components/ProductImage";
import { trackEvent } from "@/lib/analytics";

interface Props {
  product: Product;
  defaultBudget?: string;
  onClose: () => void;
}

export default function ProductDetailModal({ product, defaultBudget = "standard", onClose }: Props) {
  const defaultBrand = getBrandForBudget(product, defaultBudget);
  const [selectedBrand, setSelectedBrand] = useState(defaultBrand);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const { cart, addToCart, updateQty } = useCart();
  const cartItem = cart.find(c => c.id === product.id);
  const isInCart = !!cartItem;
  const { data: allBundles } = useBundles();

  // Track product view
  useEffect(() => {
    trackEvent("product_viewed", { product_id: product.id, product_name: product.name });
  }, [product.id, product.name]);

  const relatedBundles = (allBundles || []).filter(b =>
    [...b.babyItems, ...b.mumItems].some(i => i.name.toLowerCase().includes(product.name.toLowerCase().split(" ")[0]))
  );

  // Brand image swap
  const displayImage = selectedBrand?.imageUrl || product.imageUrl;
  const isOutOfStock = selectedBrand?.inStock === false || selectedBrand?.stockQuantity === 0;
  const isLowStock = selectedBrand?.stockQuantity != null && selectedBrand.stockQuantity > 0 && selectedBrand.stockQuantity <= 5;

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
    if (typeof product.whyIncluded === "string") return product.whyIncluded;
    return Object.values(product.whyIncluded)[0] || "";
  };

  const showSalePrice = selectedBrand?.compareAtPrice && selectedBrand.compareAtPrice > selectedBrand.price;
  const savings = showSalePrice ? selectedBrand.compareAtPrice! - selectedBrand.price : 0;
  const savingsPercent = showSalePrice ? Math.round((savings / selectedBrand.compareAtPrice!) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div className="relative bg-card rounded-t-[20px] sm:rounded-[20px] shadow-2xl max-w-[680px] w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div className="h-48 md:h-56 flex items-center justify-center relative overflow-hidden transition-all"
          style={{ backgroundColor: displayImage ? '#f5f5f5' : (selectedBrand.color || "#F0F7F4") }}>
          {product.badge && (
            <span className="absolute top-3 left-3 bg-coral text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-pill uppercase z-10">{product.badge}</span>
          )}
          {showSalePrice && (
            <span className="absolute top-3 right-12 bg-destructive text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-pill z-10">
              Save {savingsPercent}%
            </span>
          )}
          <ProductImage imageUrl={displayImage} emoji={selectedBrand.img || product.baseImg} alt={product.name} className="w-full h-full object-contain p-4" emojiClassName="text-7xl md:text-8xl" />
        </div>

        <div className="p-5 md:p-7">
          <h2 className="pf text-xl md:text-2xl font-bold mb-1">{product.name}</h2>
          <p className="text-text-med text-sm leading-relaxed mb-3">{product.description}</p>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.rating) ? "text-coral fill-coral" : "text-border"}`} />
              ))}
            </div>
            <span className="text-sm font-semibold">{product.rating}</span>
            <span className="text-text-light text-xs">({product.reviews} reviews)</span>
          </div>

          <div className="space-y-2 mb-4">
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
            {product.allergenInfo && (
              <div className="bg-[#FFF3E0] rounded-lg px-3 py-2 text-xs text-[#E65100]"><span className="font-semibold">⚠️ </span>{product.allergenInfo}</div>
            )}
          </div>

          <div className="mb-4">
            <p className="text-[11px] font-semibold text-text-light uppercase tracking-wider mb-2">Choose Brand</p>
            <div className="flex flex-wrap gap-2">
              {product.brands.map(b => {
                const brandOos = b.inStock === false || b.stockQuantity === 0;
                return (
                  <button key={b.id} onClick={() => setSelectedBrand(b)}
                    className={`px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px] transition-all font-body flex items-center gap-1.5 ${brandOos ? "opacity-50" : ""} ${selectedBrand.id === b.id ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>
                    {b.logoUrl && <img src={b.logoUrl} alt="" className="w-4 h-4 object-contain" />}
                    {b.label} — {fmt(b.price)}
                    {b.compareAtPrice && b.compareAtPrice > b.price && (
                      <span className="line-through text-text-light text-[10px]">{fmt(b.compareAtPrice)}</span>
                    )}
                    {brandOos && <span className="text-destructive text-[9px]">OOS</span>}
                    {b.id === defaultBrand.id && !brandOos && <span className="text-coral text-[9px]">★</span>}
                  </button>
                );
              })}
            </div>
            {isOutOfStock && product.brands.some(b => b.inStock !== false && b.stockQuantity !== 0) && (
              <p className="text-xs text-coral mt-1.5">This brand is out of stock. Try another brand above.</p>
            )}
          </div>

          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-text-light uppercase tracking-wider mb-2">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px] transition-all font-body ${selectedSize === s ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLowStock && (
            <p className="text-[#E65100] text-xs font-semibold mb-3">🔥 Only {selectedBrand.stockQuantity} left!</p>
          )}

          <div className="flex items-center justify-between gap-4 mb-4 pt-3 border-t border-border">
            <div>
              <p className="pf text-2xl font-bold text-forest">{fmt(selectedBrand.price)}</p>
              {showSalePrice && (
                <div className="flex items-center gap-2">
                  <p className="text-text-light text-sm line-through">{fmt(selectedBrand.compareAtPrice!)}</p>
                  <span className="text-xs font-semibold text-destructive">Save ₦{savings.toLocaleString()}</span>
                </div>
              )}
              {!showSalePrice && product.brands.length > 1 && <p className="text-text-light text-[11px]">from {fmt(Math.min(...product.brands.map(b => b.price)))}</p>}
            </div>
            {isOutOfStock ? (
              <button className="rounded-pill bg-border px-6 py-2.5 text-sm font-semibold text-text-light cursor-not-allowed">
                Out of Stock
              </button>
            ) : isInCart && cartItem ? (
              <div className="flex items-center gap-3">
                <QtyControl qty={cartItem.qty} onUpdate={(newQty) => updateQty(cartItem._key, newQty)} size="md" maxQty={selectedBrand.stockQuantity ?? undefined} />
                <Link to="/cart" className="text-forest text-sm font-semibold hover:underline font-body">
                  View Cart →
                </Link>
              </div>
            ) : (
              <button onClick={handleAdd} className="rounded-pill bg-forest px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-forest-deep font-body interactive flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </button>
            )}
          </div>

          {getWhyText() && (
            <div className="bg-forest-light rounded-lg p-3 text-xs text-forest mb-4">
              <span className="font-semibold">💡 Why mums love this: </span>{getWhyText()}
            </div>
          )}

          {relatedBundles.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-text-light uppercase tracking-wider mb-2">Also included in these bundles</p>
              <div className="flex flex-wrap gap-2">
                {relatedBundles.slice(0, 4).map(b => (
                  <Link key={b.id} to={`/bundles/${b.id}`} className="bg-warm-cream rounded-pill px-3 py-1 text-xs font-semibold text-text-med hover:text-forest transition-colors">
                    {b.icon} {b.name} — {fmt(b.price)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
