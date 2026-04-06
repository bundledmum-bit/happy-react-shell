import { useState } from "react";
import { X, Star, ShoppingBag } from "lucide-react";
import { type Product } from "@/data/products";
import { useCart, fmt, getBrandForBudget } from "@/lib/cart";
import { bundles } from "@/data/bundles";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Props {
  product: Product;
  defaultBudget?: string;
  onClose: () => void;
}

export default function ProductDetailModal({ product, defaultBudget = "standard", onClose }: Props) {
  const defaultBrand = getBrandForBudget(product, defaultBudget);
  const [selectedBrand, setSelectedBrand] = useState(defaultBrand);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const { cart, addToCart } = useCart();
  const isInCart = cart.some(c => c.id === product.id);

  const relatedBundles = bundles.filter(b =>
    [...b.babyItems, ...b.mumItems].some(i => i.name.toLowerCase().includes(product.name.toLowerCase().split(" ")[0]))
  );

  const handleAdd = () => {
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

  const stockLabel = product.stock === 0 ? "out" : product.stock && product.stock <= 5 ? "low" : "in";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div className="relative bg-card rounded-t-[20px] sm:rounded-[20px] shadow-2xl max-w-[680px] w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition-colors">
          <X className="h-4 w-4" />
        </button>

        {/* Hero */}
        <div className="h-48 md:h-56 flex items-center justify-center relative" style={{ backgroundColor: selectedBrand.color || "#F0F7F4" }}>
          {product.badge && (
            <span className="absolute top-3 left-3 bg-coral text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-pill uppercase">{product.badge}</span>
          )}
          <span className="text-7xl md:text-8xl">{selectedBrand.img || product.baseImg}</span>
        </div>

        <div className="p-5 md:p-7">
          <h2 className="pf text-xl md:text-2xl font-bold mb-1">{product.name}</h2>
          <p className="text-text-med text-sm leading-relaxed mb-3">{product.description}</p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.rating) ? "text-coral fill-coral" : "text-border"}`} />
              ))}
            </div>
            <span className="text-sm font-semibold">{product.rating}</span>
            <span className="text-text-light text-xs">({product.reviews} reviews)</span>
          </div>

          {/* Pack info / Material / Contents */}
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
            {product.allergenInfo && (
              <div className="bg-[#FFF3E0] rounded-lg px-3 py-2 text-xs text-[#E65100]"><span className="font-semibold">⚠️ </span>{product.allergenInfo}</div>
            )}
            {product.genderRelevant && product.genderColors && (
              <div className="bg-warm-cream rounded-lg px-3 py-2 text-xs">
                <span className="font-semibold">🎨 Available in: </span>
                {Object.entries(product.genderColors).map(([k, v]) => (
                  <span key={k} className="capitalize">{k}: {v} </span>
                ))}
              </div>
            )}
          </div>

          {/* Brand selector */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-text-light uppercase tracking-wider mb-2">Choose Brand</p>
            <div className="flex flex-wrap gap-2">
              {product.brands.map(b => (
                <button key={b.id} onClick={() => setSelectedBrand(b)}
                  className={`px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px] transition-all font-body flex items-center gap-1.5 ${selectedBrand.id === b.id ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>
                  {b.label} — {fmt(b.price)}
                  {b.id === defaultBrand.id && <span className="text-coral text-[9px]">★ Recommended</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Size selector */}
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

          {/* Stock */}
          {stockLabel === "low" && (
            <p className="text-[#E65100] text-xs font-semibold mb-3">🔥 Only {product.stock} left!</p>
          )}

          {/* Price + Add */}
          <div className="flex items-center justify-between gap-4 mb-4 pt-3 border-t border-border">
            <div>
              <p className="pf text-2xl font-bold text-forest">{fmt(selectedBrand.price)}</p>
              {product.brands.length > 1 && <p className="text-text-light text-[11px]">from {fmt(Math.min(...product.brands.map(b => b.price)))}</p>}
            </div>
            {stockLabel === "out" ? (
              <button className="rounded-pill bg-border px-6 py-2.5 text-sm font-semibold text-text-light cursor-not-allowed">
                Out of Stock
              </button>
            ) : isInCart ? (
              <Link to="/cart" className="rounded-pill bg-forest-light border border-forest text-forest px-6 py-2.5 text-sm font-semibold font-body interactive">
                In Cart ✓
              </Link>
            ) : (
              <button onClick={handleAdd} className="rounded-pill bg-forest px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-forest-deep font-body interactive flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </button>
            )}
          </div>

          {/* Why included */}
          <div className="bg-forest-light rounded-lg p-3 text-xs text-forest mb-4">
            <span className="font-semibold">💡 Why mums love this: </span>{getWhyText()}
          </div>

          {/* Related bundles */}
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
