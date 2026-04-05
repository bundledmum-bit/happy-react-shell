import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { babyProducts, mumProducts, allProducts, type Product } from "@/data/products";
import { useCart, fmt } from "@/lib/cart";
import { toast } from "sonner";

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "all";
  const [budget, setBudget] = useState<string>("all");

  const products = tab === "baby" ? babyProducts : tab === "mum" ? mumProducts : allProducts;

  const filtered = budget === "all"
    ? products
    : products.filter(p => p.brands.some(b =>
        budget === "starter" ? b.tier === 1 :
        budget === "standard" ? b.tier === 2 :
        b.tier === 3
      ));

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20" style={{ background: "linear-gradient(135deg, #F4845F 0%, #D4613C 100%)" }}>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display font-black text-3xl md:text-5xl text-primary-foreground mb-3">Shop All Products</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all", label: "All" },
            { key: "baby", label: "For Baby 👶" },
            { key: "mum", label: "For Mum 💛" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setSearchParams({ tab: t.key })}
              className={`rounded-pill px-5 py-2 text-sm font-display font-bold interactive ${
                tab === t.key ? "bg-forest text-primary-foreground" : "bg-warm-grey text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Budget filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { key: "all", label: "All Budgets" },
            { key: "starter", label: "Starter" },
            { key: "standard", label: "Standard" },
            { key: "premium", label: "Premium" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setBudget(f.key)}
              className={`rounded-pill px-4 py-1.5 text-xs font-body font-bold whitespace-nowrap interactive ${
                budget === f.key ? "bg-forest text-primary-foreground" : "bg-warm-grey text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const [selectedTier, setSelectedTier] = useState(p.brands[0].tier);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const selected = p.brands.find(b => b.tier === selectedTier) || p.brands[0];

  const handleAdd = () => {
    addToCart({ id: p.id, name: p.name, brand: selected.brand, price: selected.price, emoji: p.emoji, category: p.category });
    toast.success("✓ Added to cart");
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-card rounded-card shadow-card hover:shadow-card-hover interactive flex flex-col overflow-hidden">
      <div className="relative h-28 flex items-center justify-center bg-warm-grey">
        <span className="text-5xl md:text-6xl">{p.emoji}</span>
        {p.badge && (
          <span className="absolute top-2 left-2 bg-coral text-primary-foreground rounded-pill px-2 py-0.5 text-[10px] font-bold">{p.badge}</span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-display font-bold text-sm mb-1 line-clamp-2">{p.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-coral text-xs">⭐ {p.rating}</span>
          <span className="text-muted-foreground text-[10px]">({p.reviews})</span>
        </div>

        {p.brands.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {p.brands.map(b => (
              <button
                key={b.tier}
                onClick={() => setSelectedTier(b.tier)}
                className={`rounded-pill px-2 py-0.5 text-[10px] font-bold interactive ${
                  selectedTier === b.tier ? "bg-forest text-primary-foreground" : "bg-warm-grey text-foreground"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground font-body mb-1">{selected.brand}</p>
        <p className="font-display font-bold text-lg text-coral mb-2">{fmt(selected.price)}</p>
        {p.brands.length > 1 && (
          <p className="text-[10px] text-muted-foreground font-body mb-2">from {fmt(Math.min(...p.brands.map(b => b.price)))}</p>
        )}

        <button
          onClick={handleAdd}
          className={`mt-auto rounded-pill py-2 text-xs font-display font-bold interactive ${
            added ? "bg-mint text-forest" : "bg-forest text-primary-foreground hover:bg-forest-deep"
          }`}
        >
          {added ? "✓ Added" : "+ Add"}
        </button>
      </div>
    </div>
  );
}
