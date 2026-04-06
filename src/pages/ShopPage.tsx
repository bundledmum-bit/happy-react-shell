import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PRODUCTS, ALL_PRODUCTS, type Product } from "@/data/products";
import { useCart, fmt, getBrandForBudget } from "@/lib/cart";
import { toast } from "sonner";
import ProductDetailModal from "@/components/ProductDetailModal";

function ProductCard({ product, defaultBudget = "standard", onAdd, onViewDetail }: { product: Product; defaultBudget?: string; onAdd: (item: any) => void; onViewDetail: () => void }) {
  const defaultBrand = getBrandForBudget(product, defaultBudget);
  const [selectedBrand, setSelectedBrand] = useState(defaultBrand);
  const { cart } = useCart();
  const isInCart = cart.some(c => c.id === product.id);
  const stockLabel = product.stock === 0 ? "out" : product.stock && product.stock <= 5 ? "low" : "in";
  const isOutOfStock = stockLabel === "out";

  const handleAdd = () => {
    if (product.sizes && product.sizes.length > 0) {
      onViewDetail();
      return;
    }
    onAdd({ ...product, selectedBrand, price: selectedBrand.price, name: `${product.name} (${selectedBrand.label})` });
  };

  // Track recently viewed
  const trackView = () => {
    try {
      const rv = JSON.parse(localStorage.getItem("bm-recently-viewed") || "[]");
      const filtered = rv.filter((id: number) => id !== product.id);
      filtered.unshift(product.id);
      localStorage.setItem("bm-recently-viewed", JSON.stringify(filtered.slice(0, 8)));
    } catch {}
  };

  return (
    <div className={`bg-card rounded-card shadow-card card-hover overflow-hidden ${isOutOfStock ? "opacity-60" : ""}`}>
      <div className="h-[170px] flex items-center justify-center text-6xl relative transition-colors cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${selectedBrand.color}, #fff)` }}
        onClick={() => { trackView(); onViewDetail(); }}>
        {product.badge && (
          <div className="absolute top-2.5 left-2.5 bg-coral text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wide">{product.badge}</div>
        )}
        {isOutOfStock && (
          <div className="absolute top-2.5 right-2.5 bg-foreground/70 text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-pill">Out of Stock</div>
        )}
        {stockLabel === "low" && (
          <div className="absolute top-2.5 right-2.5 bg-[#E65100] text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-pill">Only {product.stock} left!</div>
        )}
        {selectedBrand.img}
      </div>
      <div className="p-4">
        <h3 className="text-[13px] font-semibold mb-1 leading-tight min-h-[36px] cursor-pointer hover:text-forest transition-colors" onClick={() => { trackView(); onViewDetail(); }}>{product.name}</h3>
        <p className="text-text-med text-[10px] leading-relaxed mb-2 line-clamp-2">{product.description}</p>

        {/* Pack/Size info */}
        {product.packInfo && <p className="text-text-light text-[10px] mb-1">📦 {product.packInfo}</p>}
        {product.material && <p className="text-text-light text-[10px] mb-1">🧵 {product.material}</p>}
        {product.contents && <p className="text-text-light text-[10px] mb-1">📋 {product.contents.slice(0, 3).join(", ")}{product.contents.length > 3 ? "..." : ""}</p>}
        {product.allergenInfo && <p className="text-[#E65100] text-[10px] mb-1">⚠️ {product.allergenInfo}</p>}

        {/* Color options */}
        {product.genderRelevant && product.genderColors && (
          <p className="text-text-light text-[10px] mb-1">🎨 {Object.values(product.genderColors).join(" · ")}</p>
        )}

        {/* Brand selector */}
        <div className="mb-2.5">
          <div className="text-[10px] font-semibold text-text-light uppercase tracking-widest mb-1.5">Brand</div>
          <div className="flex flex-wrap gap-1">
            {product.brands.map(b => (
              <button key={b.id} onClick={() => setSelectedBrand(b)}
                className={`px-2 py-0.5 rounded-pill text-[10px] font-semibold border-[1.5px] transition-all font-body ${selectedBrand.id === b.id ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>
                {b.label} {fmt(b.price)}
                {b.id === defaultBrand.id && <span className="text-coral ml-0.5">★</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Size pills (if applicable) */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mb-2.5">
            <div className="text-[10px] font-semibold text-text-light uppercase tracking-widest mb-1">Size</div>
            <div className="flex flex-wrap gap-1">
              {product.sizes.map(s => (
                <span key={s} className="px-2 py-0.5 rounded-pill text-[10px] border border-border text-text-med font-body">{s}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-coral text-xs">⭐ {product.rating}</span>
          <span className="text-text-light text-[11px]">({product.reviews})</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-forest font-bold text-[17px] transition-all">{fmt(selectedBrand.price)}</div>
            {product.brands.length > 1 && (
              <div className="text-text-light text-[10px] mt-0.5">from {fmt(Math.min(...product.brands.map(b => b.price)))}</div>
            )}
          </div>
          {isOutOfStock ? (
            <span className="rounded-pill bg-border px-4 py-2 text-xs font-semibold text-text-light font-body">Sold Out</span>
          ) : isInCart ? (
            <Link to="/cart" className="rounded-pill bg-forest-light border border-forest text-forest px-3 py-1.5 text-[11px] font-semibold font-body interactive">
              {selectedBrand.label} in Cart ✓
            </Link>
          ) : (
            <button onClick={handleAdd} className="rounded-pill bg-forest px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-forest-deep font-body interactive">+ Add</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "all";
  const [budgetF, setBudgetF] = useState("standard");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const titles: Record<string, string> = { all: "All Products", baby: "Baby Shop", mum: "Mum Shop" };
    document.title = `${titles[tab] || "All Products"} | BundledMum`;
  }, [tab]);

  const raw = tab === "baby" ? PRODUCTS.baby : tab === "mum" ? PRODUCTS.mum : ALL_PRODUCTS;

  let filtered = raw.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Gray out products outside budget tier instead of hiding
  const isInBudget = (p: Product) => budgetF === "all" || p.tags.includes(`bundle:${budgetF}`);

  // Sort
  if (sortBy === "price-low") filtered.sort((a, b) => Math.min(...a.brands.map(br => br.price)) - Math.min(...b.brands.map(br => br.price)));
  if (sortBy === "price-high") filtered.sort((a, b) => Math.min(...b.brands.map(br => br.price)) - Math.min(...a.brands.map(br => br.price)));
  if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);

  // Sort: in-budget first
  if (budgetF !== "all") {
    filtered.sort((a, b) => (isInBudget(b) ? 1 : 0) - (isInBudget(a) ? 1 : 0));
  }

  // Recently viewed
  const recentlyViewedIds: number[] = (() => {
    try { return JSON.parse(localStorage.getItem("bm-recently-viewed") || "[]"); } catch { return []; }
  })();
  const recentlyViewed = recentlyViewedIds.map(id => ALL_PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 5) as Product[];

  const isBaby = tab === "baby";
  const isMum = tab === "mum";

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20" style={{ background: isBaby ? "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 100%)" : isMum ? "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 100%)" : "linear-gradient(135deg, #1A1A2E 0%, #2D3A5C 100%)" }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8 md:py-14">
          <h1 className="pf text-3xl md:text-[44px] text-primary-foreground mb-2">
            {isBaby ? "👶 Baby Shop" : isMum ? "💛 Mum Shop" : "🛍️ All Products"}
          </h1>
          <p className="text-primary-foreground/65 text-sm md:text-[15px] max-w-[480px]">
            {isBaby ? "Everything your newborn needs — from clothing to skincare to comfort." : isMum ? "Postpartum care and comfort essentials — because mum matters too." : "Everything BundledMum offers — baby, mum, and everything in between."}
          </p>
          <div className="mt-5 relative max-w-[480px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔍</span>
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-pill border-none bg-primary-foreground/15 text-primary-foreground text-sm font-body pl-10 pr-4 py-2.5 outline-none placeholder:text-primary-foreground/40" />
          </div>
        </div>
      </div>

      <div className="bg-card border-b border-border py-3 px-4 md:px-10 sticky top-[68px] z-50">
        <div className="max-w-[1200px] mx-auto">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <div className="flex gap-2 items-center min-w-max">
              <span className="text-text-med text-[13px] font-semibold mr-1">Shop:</span>
              {[{ key: "all", label: "All" }, { key: "baby", label: "👶 Baby" }, { key: "mum", label: "💛 Mum" }].map(t => (
                <button key={t.key} onClick={() => setSearchParams({ tab: t.key })}
                  className={`rounded-pill px-3 py-1.5 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap ${tab === t.key ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>
                  {t.label}
                </button>
              ))}
              <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />
              <span className="text-text-med text-[13px] font-semibold mr-1 whitespace-nowrap">Budget:</span>
              {[["all", "All"], ["starter", "🌱 Starter"], ["standard", "🌿 Standard"], ["premium", "✨ Premium"]].map(([v, l]) => (
                <button key={v} onClick={() => setBudgetF(v)}
                  className={`rounded-pill px-3 py-1.5 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap ${budgetF === v ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>
                  {l}
                </button>
              ))}
              <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-pill border-[1.5px] border-border px-3 py-1.5 text-xs font-semibold font-body bg-card text-text-med outline-none whitespace-nowrap flex-shrink-0">
                <option value="popular">Sort: Popular</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <span className="text-text-light text-xs whitespace-nowrap flex-shrink-0">{filtered.length} items</span>
            </div>
          </div>
          {budgetF !== "all" && (
            <div className="mt-1.5">
              <span className="bg-forest-light text-forest rounded-pill px-3 py-0.5 text-[11px] font-semibold">
                ✓ Brands pre-selected for {budgetF} — tap swatch to switch brand
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="pf text-xl mb-2">No products found</h2>
            <p className="text-text-med text-sm">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {filtered.map(p => {
              const inBudget = isInBudget(p);
              return (
                <div key={p.id} className={`relative ${!inBudget ? "opacity-50" : ""}`}>
                  <ProductCard
                    product={p}
                    defaultBudget={budgetF === "all" ? "standard" : budgetF}
                    onAdd={item => { addToCart(item); toast.success(`✓ ${item.name} added to cart`, { action: { label: "View Cart →", onClick: () => window.location.href = "/cart" } }); }}
                    onViewDetail={() => setDetailProduct(p)}
                  />
                  {!inBudget && (
                    <div className="absolute bottom-16 left-0 right-0 text-center">
                      <span className="bg-foreground/80 text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-pill">
                        Available in {p.tier.filter(t => t !== budgetF).join(" / ")} tier
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mt-12">
            <h3 className="pf text-lg text-forest mb-4">👀 Recently Viewed</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {recentlyViewed.map(p => (
                <div key={p.id} className="bg-card rounded-card shadow-card p-3 cursor-pointer hover:shadow-card-hover transition-all" onClick={() => setDetailProduct(p)}>
                  <div className="h-20 flex items-center justify-center text-3xl mb-2" style={{ backgroundColor: getBrandForBudget(p, "standard").color }}>
                    {p.baseImg}
                  </div>
                  <p className="text-xs font-semibold truncate">{p.name}</p>
                  <p className="text-forest text-xs font-bold">{fmt(getBrandForBudget(p, "standard").price)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product detail modal */}
      {detailProduct && (
        <ProductDetailModal product={detailProduct} defaultBudget={budgetF === "all" ? "standard" : budgetF} onClose={() => setDetailProduct(null)} />
      )}
    </div>
  );
}
