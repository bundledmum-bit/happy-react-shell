import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useBundles } from "@/hooks/useSupabaseData";
import type { Bundle } from "@/lib/supabaseAdapters";

export default function BundlesPage() {
  const [hospitalF, setHospitalF] = useState("all");
  const [deliveryF, setDeliveryF] = useState("all");
  const [tierF, setTierF] = useState("all");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const { data: bundles, isLoading } = useBundles();
  const allBundles = bundles || [];

  useEffect(() => { document.title = "Pre-Packed Hospital Bags | BundledMum"; }, []);

  const filtered = allBundles.filter(b => {
    if (hospitalF !== "all" && b.hospitalType !== hospitalF) return false;
    if (deliveryF !== "all" && b.deliveryType !== deliveryF) return false;
    if (tierF !== "all" && b.tier.toLowerCase() !== tierF) return false;
    return true;
  });

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const compareBundles = compareIds.map(id => allBundles.find(b => b.id === id)!).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-[68px]" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1A3D2E 100%)" }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-14">
          <h1 className="pf text-3xl md:text-[46px] text-primary-foreground mb-2.5">🏥 Pre-Packed Hospital Bag Bundles</h1>
          <p className="text-primary-foreground/70 text-sm md:text-base max-w-[580px] leading-relaxed">
            Get all your baby things in one place — no market runs & stress. Every item researched, sourced, and packed for the Nigerian delivery experience.
          </p>
          <div className="flex gap-5 mt-5 flex-wrap">
            {[[String(allBundles.length), "Bundles"], ["100+", "Products inside"], ["2", "Hospital types"]].map(([v, l]) => (
              <div key={l}><div className="pf text-coral text-xl font-bold">{v}</div><div className="text-primary-foreground/50 text-[11px]">{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border-b border-border py-3 px-4 md:px-10 sticky top-[68px] z-50">
        <div className="max-w-[1200px] mx-auto">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <div className="flex gap-2 items-center min-w-max">
              <span className="text-text-med text-[13px] font-semibold whitespace-nowrap">Hospital:</span>
              {[["all", "All"], ["public", "🏥 Public"], ["private", "🏨 Private"], ["gift", "🎁 Gift"]].map(([v, l]) => (
                <button key={v} onClick={() => setHospitalF(v)} className={`rounded-pill px-3 py-1.5 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap ${hospitalF === v ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>{l}</button>
              ))}
              <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />
              <span className="text-text-med text-[13px] font-semibold whitespace-nowrap">Delivery:</span>
              {[["all", "All"], ["vaginal", "Vaginal"], ["csection", "C-Section"]].map(([v, l]) => (
                <button key={v} onClick={() => setDeliveryF(v)} className={`rounded-pill px-3 py-1.5 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap ${deliveryF === v ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>{l}</button>
              ))}
              <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />
              {[["all", "All Tiers"], ["basic", "Basic"], ["premium", "✨ Premium"]].map(([v, l]) => (
                <button key={v} onClick={() => setTierF(v)} className={`rounded-pill px-3 py-1.5 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap ${tierF === v ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>{l}</button>
              ))}
              {compareIds.length >= 2 && (
                <button onClick={() => setShowCompare(true)} className="ml-2 rounded-pill bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground font-body interactive whitespace-nowrap">
                  Compare ({compareIds.length}) →
                </button>
              )}
              <span className="text-text-light text-xs whitespace-nowrap flex-shrink-0">{filtered.length} bundles</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8 md:py-12">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="bg-card rounded-card shadow-card h-[400px] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(b => (
              <BundleCard key={b.id} bundle={b} compareSelected={compareIds.includes(b.id)} onToggleCompare={() => toggleCompare(b.id)} />
            ))}
          </div>
        )}
      </div>

      {showCompare && compareBundles.length >= 2 && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowCompare(false)}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
          <div className="relative bg-card rounded-t-[20px] sm:rounded-[20px] shadow-2xl max-w-[900px] w-full max-h-[85vh] overflow-y-auto p-4 sm:p-6" onClick={e => e.stopPropagation()}>
            <h2 className="pf text-xl mb-4">📊 Compare Bundles</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-text-light text-xs">Feature</th>
                    {compareBundles.map(b => <th key={b.id} className="text-center py-2 px-3"><span className="text-lg">{b.icon}</span><br /><span className="text-xs font-bold">{b.name}</span></th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Price", ...compareBundles.map(b => fmt(b.price))],
                    ["Tier", ...compareBundles.map(b => b.tier)],
                    ["Items", ...compareBundles.map(b => String(b.babyItems.length + b.mumItems.length))],
                    ["Baby Items", ...compareBundles.map(b => String(b.babyItems.length))],
                    ["Mum Items", ...compareBundles.map(b => String(b.mumItems.length))],
                    ["Savings", ...compareBundles.map(b => fmt(b.separateTotal - b.price))],
                  ].map(row => (
                    <tr key={row[0]} className="border-b border-border/50">
                      <td className="py-2 pr-4 text-text-med text-xs font-semibold">{row[0]}</td>
                      {row.slice(1).map((v, i) => <td key={i} className="py-2 px-3 text-center text-xs font-semibold">{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setShowCompare(false)} className="mt-4 rounded-pill bg-forest px-6 py-2.5 text-sm font-semibold text-primary-foreground font-body interactive">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function BundleCard({ bundle: b, compareSelected, onToggleCompare }: { bundle: Bundle; compareSelected: boolean; onToggleCompare: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { addToCart, cart } = useCart();
  const isInCart = cart.some(c => c.id === b.id);
  const totalItems = b.babyItems.length + b.mumItems.length;
  const savings = b.separateTotal - b.price;
  const savingsPercent = b.separateTotal > 0 ? Math.round((savings / b.separateTotal) * 100) : 0;

  const handleAdd = () => {
    addToCart({ id: b.id, name: `${b.name} — ${b.tier}`, price: b.price, img: b.icon, baseImg: b.icon, brands: [{ id: "default", label: b.tier, price: b.price, img: b.icon, tier: 1 }], selectedBrand: { id: "default", label: b.tier, price: b.price, img: b.icon, tier: 1 } });
    toast.success(`✓ ${b.name} added to cart!`, { action: { label: "View Cart →", onClick: () => window.location.href = "/cart" } });
  };

  return (
    <div className="bg-card rounded-card shadow-card card-hover overflow-hidden">
      <Link to={`/bundles/${b.id}`} className="block">
        <div className="w-full aspect-[4/3] relative flex flex-col items-center justify-center overflow-hidden p-4" style={{ background: `linear-gradient(145deg, ${b.color}18, ${b.color}05, #fafafa)` }}>
          <div className="w-16 h-16 rounded-card flex items-center justify-center text-3xl mb-2.5" style={{ background: `linear-gradient(135deg, ${b.color}, ${b.color}BB)`, boxShadow: `0 8px 24px ${b.color}44` }}>
            {b.icon}
          </div>
          <div className="flex gap-1 flex-wrap justify-center max-w-[130px]">
            {(b.babyItems.concat(b.mumItems)).slice(0, 6).map((item, i) => (
              <div key={i} className="w-6 h-6 bg-card rounded-md flex items-center justify-center text-xs shadow-sm">{item.emoji || "📦"}</div>
            ))}
            {totalItems > 6 && <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold" style={{ background: b.lightColor, color: b.color }}>+{totalItems - 6}</div>}
          </div>
          <div className="absolute top-2 left-2 text-[8px] font-bold px-2 py-0.5 rounded-pill" style={{ background: b.tier === "Premium" ? "#FCE4EC" : "#E3F2FD", color: b.tier === "Premium" ? "#880E4F" : "#1565C0" }}>
            {b.tier === "Premium" ? "✨ PREMIUM" : "BASIC"}
          </div>
          <div className="absolute top-2 right-2 bg-midnight/50 text-primary-foreground text-[8px] font-semibold px-2 py-0.5 rounded-pill">{totalItems} items</div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex gap-1.5 flex-wrap mb-2">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-pill" style={{ background: b.lightColor, color: b.color }}>
            {b.hospitalType === "public" ? "🏥 Public" : b.hospitalType === "private" ? "🏨 Private" : "🎁 Gift"}
          </span>
          {b.deliveryType && (
            <span className="bg-warm-cream text-text-med text-[9px] font-semibold px-2 py-0.5 rounded-pill border border-border/50">
              {b.deliveryType === "vaginal" ? "Vaginal" : "C-Section"}
            </span>
          )}
        </div>
        <Link to={`/bundles/${b.id}`}>
          <h3 className="font-bold text-sm mb-1 min-h-[36px] leading-tight hover:text-forest transition-colors">{b.name}</h3>
        </Link>
        <p className="text-text-med text-[10px] leading-[1.5] mb-2 line-clamp-2">{b.tagline}</p>

        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-forest font-semibold font-body mb-2.5">
          {expanded ? "Hide items" : `View all ${totalItems} items`} {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {expanded && (
          <div className="mb-3 animate-fade-in space-y-2 max-h-[200px] overflow-y-auto text-xs">
            {[["For Baby 👶", b.babyItems], ["For Mum 💛", b.mumItems]].map(([label, items]) => (
              <div key={label as string}>
                <p className="font-bold text-[10px] uppercase text-text-light mb-1">{label as string}</p>
                {(items as typeof b.babyItems).map((item, i) => (
                  <div key={i} className="flex justify-between py-0.5 border-b border-border/30 last:border-0">
                    <span className="text-[11px] flex items-center gap-1">
                      <span>{item.emoji || "📦"}</span> {item.name} — <span className="text-text-light">{item.brand}</span>
                    </span>
                    <span className="text-forest font-bold text-[10px] ml-2 flex-shrink-0">{fmt(item.price)}</span>
                  </div>
                ))}
              </div>
            ))}
            {savings > 0 && (
              <div className="pt-1.5 border-t border-border">
                <p className="text-forest font-bold text-[11px]">
                  Bundle: {fmt(b.price)} · Save {fmt(savings)} ({savingsPercent}%) vs buying separately
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-coral text-[10px]">⭐ 4.9</span>
          <span className="text-text-light text-[10px]">· {totalItems} items inside</span>
          {savings > 0 && <span className="text-forest text-[10px] font-semibold">· Save {fmt(savings)}</span>}
        </div>

        <div className="flex justify-between items-center gap-2 mb-2">
          <div>
            <div className="pf font-bold text-lg" style={{ color: b.color }}>{fmt(b.price)}</div>
            {b.separateTotal > b.price && <div className="text-text-light line-through text-[10px]">{fmt(b.separateTotal)}</div>}
          </div>
          {isInCart ? (
            <Link to="/cart" className="rounded-pill bg-forest-light border border-forest text-forest px-3.5 py-2 text-[11px] font-semibold font-body interactive flex-shrink-0">In Cart ✓</Link>
          ) : (
            <button onClick={handleAdd} className="rounded-pill px-3.5 py-2 text-[11px] font-semibold text-primary-foreground font-body flex-shrink-0 bg-forest hover:bg-forest-deep interactive">+ Add to Cart</button>
          )}
        </div>

        <button onClick={onToggleCompare} className={`w-full text-center text-[10px] font-semibold font-body py-1 rounded-pill border transition-all ${compareSelected ? "border-coral bg-coral/10 text-coral" : "border-border text-text-light hover:text-forest hover:border-forest"}`}>
          {compareSelected ? "✓ Selected for compare" : "Compare"}
        </button>
      </div>
    </div>
  );
}
