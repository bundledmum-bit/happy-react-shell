import { useState } from "react";
import { Link } from "react-router-dom";
import { bundles } from "@/data/bundles";
import { useCart, fmt } from "@/lib/cart";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function BundlesPage() {
  const [hospitalF, setHospitalF] = useState("all");
  const [deliveryF, setDeliveryF] = useState("all");
  const [tierF, setTierF] = useState("all");

  const filtered = bundles.filter(b => {
    if (hospitalF !== "all" && b.hospitalType !== hospitalF) return false;
    if (deliveryF !== "all" && b.deliveryType !== deliveryF) return false;
    if (tierF !== "all" && b.tier.toLowerCase() !== tierF) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1A3D2E 100%)" }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8 md:py-14">
          <h1 className="pf text-3xl md:text-[46px] text-primary-foreground mb-2.5">🏥 Pre-Packed Hospital Bag Bundles</h1>
          <p className="text-primary-foreground/70 text-sm md:text-base max-w-[580px] leading-relaxed">
            Every item researched, sourced, and packed for the Nigerian delivery experience. Choose your hospital type, delivery method, and budget.
          </p>
          <div className="flex gap-5 mt-5 flex-wrap">
            {[["10", "Bundles"], ["100+", "Products inside"], ["2", "Hospital types"]].map(([v, l]) => (
              <div key={l}><div className="pf text-coral text-xl font-bold">{v}</div><div className="text-primary-foreground/50 text-[11px]">{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border-b border-border py-3 px-4 md:px-10 sticky top-[68px] z-50">
        <div className="max-w-[1200px] mx-auto flex gap-2 flex-wrap items-center">
          <span className="text-text-med text-[13px] font-semibold">Hospital:</span>
          {[["all", "All"], ["public", "🏥 Public"], ["private", "🏨 Private"], ["gift", "🎁 Gift"]].map(([v, l]) => (
            <button key={v} onClick={() => setHospitalF(v)} className={`rounded-pill px-3 py-1.5 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap ${hospitalF === v ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>{l}</button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <span className="text-text-med text-[13px] font-semibold">Delivery:</span>
          {[["all", "All"], ["vaginal", "Vaginal"], ["csection", "C-Section"]].map(([v, l]) => (
            <button key={v} onClick={() => setDeliveryF(v)} className={`rounded-pill px-3 py-1.5 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap ${deliveryF === v ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>{l}</button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          {[["all", "All Tiers"], ["basic", "Basic"], ["premium", "✨ Premium"]].map(([v, l]) => (
            <button key={v} onClick={() => setTierF(v)} className={`rounded-pill px-3 py-1.5 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap ${tierF === v ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med"}`}>{l}</button>
          ))}
          <span className="ml-auto text-text-light text-xs">{filtered.length} bundles</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8 md:py-12">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(b => <BundleCard key={b.id} bundle={b} />)}
        </div>
      </div>
    </div>
  );
}

function BundleCard({ bundle: b }: { bundle: typeof bundles[0] }) {
  const [expanded, setExpanded] = useState(false);
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const totalItems = b.babyItems.length + b.mumItems.length;

  const handleAdd = () => {
    addToCart({ id: b.id, name: `${b.name} — ${b.tier}`, price: b.price, img: b.icon, baseImg: b.icon, brands: [{ id: "default", label: b.tier, price: b.price, img: b.icon, tier: 1 }], selectedBrand: { id: "default", label: b.tier, price: b.price, img: b.icon, tier: 1 } });
    setAdded(true);
    toast.success(`✓ ${b.name} added to cart!`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-card rounded-card shadow-card card-hover overflow-hidden">
      <div className="w-full aspect-[4/3] relative flex flex-col items-center justify-center overflow-hidden p-4" style={{ background: `linear-gradient(145deg, ${b.color}18, ${b.color}05, #fafafa)` }}>
        <div className="w-16 h-16 rounded-card flex items-center justify-center text-3xl mb-2.5" style={{ background: `linear-gradient(135deg, ${b.color}, ${b.color}BB)`, boxShadow: `0 8px 24px ${b.color}44` }}>
          {b.icon}
        </div>
        <div className="flex gap-1 flex-wrap justify-center max-w-[130px]">
          {(b.babyItems.concat(b.mumItems)).slice(0, 6).map((item, i) => (
            <div key={i} className="w-6 h-6 bg-card rounded-md flex items-center justify-center text-xs shadow-sm">{item.name.substring(0, 2) === "Ne" ? "🧷" : "📦"}</div>
          ))}
          {totalItems > 6 && <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold" style={{ background: b.lightColor, color: b.color }}>+{totalItems - 6}</div>}
        </div>
        <div className="absolute top-2 left-2 text-[8px] font-bold px-2 py-0.5 rounded-pill" style={{ background: b.tier === "Premium" ? "#FCE4EC" : "#E3F2FD", color: b.tier === "Premium" ? "#880E4F" : "#1565C0" }}>
          {b.tier === "Premium" ? "✨ PREMIUM" : "BASIC"}
        </div>
        <div className="absolute top-2 right-2 bg-midnight/50 text-primary-foreground text-[8px] font-semibold px-2 py-0.5 rounded-pill">{totalItems} items</div>
      </div>

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
        <h3 className="font-bold text-sm mb-1 min-h-[36px] leading-tight">{b.name}</h3>
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
                    <span className="text-[11px]">{item.name}</span>
                    <span className="text-text-light text-[10px] ml-2 flex-shrink-0">{item.brand}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-coral text-[10px]">⭐ 4.9</span>
          <span className="text-text-light text-[10px]">· {totalItems} items inside</span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="pf font-bold text-lg" style={{ color: b.color }}>{fmt(b.price)}</div>
          <button onClick={handleAdd} className={`rounded-pill px-3.5 py-2 text-[11px] font-semibold text-primary-foreground font-body flex-shrink-0 ${added ? "bg-green-600" : "bg-forest hover:bg-forest-deep"} interactive`}>
            {added ? "✓ Added" : "+ Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
