import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PRODUCTS, ALL_PRODUCTS, type Product } from "@/data/products";
import { useCart, fmt, getBrandForBudget } from "@/lib/cart";
import { toast } from "sonner";

function ProductCard({ product, defaultBudget = "standard", onAdd }: { product: Product; defaultBudget?: string; onAdd: (item: any) => void }) {
  const defaultBrand = getBrandForBudget(product, defaultBudget);
  const [selectedBrand, setSelectedBrand] = useState(defaultBrand);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd({ ...product, selectedBrand, price: selectedBrand.price, name: `${product.name} (${selectedBrand.label})` });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-card rounded-card shadow-card card-hover overflow-hidden cursor-default">
      <div className="h-[170px] flex items-center justify-center text-6xl relative transition-colors" style={{ background: `linear-gradient(135deg, ${selectedBrand.color}, #fff)` }}>
        {product.badge && (
          <div className="absolute top-2.5 left-2.5 bg-coral text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wide">{product.badge}</div>
        )}
        {selectedBrand.img}
      </div>
      <div className="p-4">
        <h4 className="text-[13px] font-semibold mb-2 leading-tight min-h-[36px]">{product.name}</h4>
        <div className="mb-3">
          <div className="text-[10px] font-semibold text-text-light uppercase tracking-widest mb-1.5">Brand</div>
          <div className="flex flex-wrap gap-1">
            {product.brands.map(b => (
              <button key={b.id} onClick={() => setSelectedBrand(b)}
                className={`px-2.5 py-1 rounded-pill text-[11px] font-semibold border-[1.5px] transition-all font-body ${selectedBrand.id === b.id ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
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
          <button onClick={handleAdd} className={`rounded-pill px-4 py-2 text-xs font-semibold text-primary-foreground transition-all font-body ${added ? "bg-green-600" : "bg-forest hover:bg-forest-deep"}`}>
            {added ? "✓ Added" : "+ Add"}
          </button>
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
  const { addToCart } = useCart();

  const raw = tab === "baby" ? PRODUCTS.baby : tab === "mum" ? PRODUCTS.mum : ALL_PRODUCTS;

  const filtered = raw.filter(p => {
    if (budgetF !== "all" && !p.tags.includes(`bundle:${budgetF}`)) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-text-med text-[13px] font-semibold mr-1">Shop:</span>
            {[{ key: "all", label: "All" }, { key: "baby", label: "👶 Baby" }, { key: "mum", label: "💛 Mum" }].map(t => (
              <button key={t.key} onClick={() => setSearchParams({ tab: t.key })}
                className={`rounded-pill px-3 py-1.5 text-xs font-semibold border-[1.5px] transition-all font-body ${tab === t.key ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>
                {t.label}
              </button>
            ))}
            <div className="w-px h-5 bg-border mx-1" />
            <span className="text-text-med text-[13px] font-semibold mr-1">Budget:</span>
            {[["all", "All"], ["starter", "🌱 Starter"], ["standard", "🌿 Standard"], ["premium", "✨ Premium"]].map(([v, l]) => (
              <button key={v} onClick={() => setBudgetF(v)}
                className={`rounded-pill px-3 py-1.5 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap ${budgetF === v ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>
                {l}
              </button>
            ))}
            <span className="ml-auto text-text-light text-xs">{filtered.length} items</span>
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
            <h3 className="pf text-xl mb-2">No products found</h3>
            <p className="text-text-med text-sm">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} defaultBudget={budgetF === "all" ? "standard" : budgetF}
                onAdd={item => { addToCart(item); toast.success("Added to cart"); }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
