import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { useBundles } from "@/hooks/useSupabaseData";
import type { Bundle } from "@/lib/supabaseAdapters";
import ProductImage from "@/components/ProductImage";

export default function BundlesPage() {
  const [hospitalF, setHospitalF] = useState("all");
  const [deliveryF, setDeliveryF] = useState("all");
  const [tierF, setTierF] = useState("all");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const { data: bundles, isLoading } = useBundles();
  const allBundles = bundles || [];

  useEffect(() => { document.title = "Pre-Packed Hospital Lists | BundledMum"; }, []);

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
          <h1 className="pf text-3xl md:text-[46px] text-primary-foreground mb-2.5">🏥 Our Pre-Packed Hospital Lists</h1>
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
              <span className="text-muted-foreground text-[13px] font-semibold whitespace-nowrap">Hospital:</span>
              {[["all", "All"], ["public", "🏥 Public"], ["private", "🏨 Private"], ["gift", "🎁 Gift"]].map(([v, l]) => (
                <button key={v} onClick={() => setHospitalF(v)} className={`rounded-pill px-3 py-2 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap min-h-[44px] ${hospitalF === v ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-muted-foreground"}`}>{l}</button>
              ))}
              <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />
              <span className="text-muted-foreground text-[13px] font-semibold whitespace-nowrap">Delivery:</span>
              {[["all", "All"], ["vaginal", "Vaginal"], ["csection", "C-Section"]].map(([v, l]) => (
                <button key={v} onClick={() => setDeliveryF(v)} className={`rounded-pill px-3 py-2 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap min-h-[44px] ${deliveryF === v ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-muted-foreground"}`}>{l}</button>
              ))}
              <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />
              {[["all", "All Tiers"], ["starter", "Starter"], ["standard", "Standard"], ["premium", "✨ Premium"]].map(([v, l]) => (
                <button key={v} onClick={() => setTierF(v)} className={`rounded-pill px-3 py-2 text-xs font-semibold border-[1.5px] transition-all font-body whitespace-nowrap min-h-[44px] ${tierF === v ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-muted-foreground"}`}>{l}</button>
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
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
  const isInCart = [...b.babyItems, ...b.mumItems].length > 0 && [...b.babyItems, ...b.mumItems].some(item => cart.some(c => c.bundleName === b.name));
  const totalItems = b.babyItems.length + b.mumItems.length;
  const savings = b.separateTotal - b.price;
  const savingsPercent = b.separateTotal > 0 ? Math.round((savings / b.separateTotal) * 100) : 0;

  // Collect up to 4 unique product images from bundle items
  const itemImages = [...b.babyItems, ...b.mumItems]
    .filter(i => i.imageUrl)
    .slice(0, 4);

  const handleAdd = () => {
    const allItems = [...b.babyItems, ...b.mumItems];
    allItems.forEach(item => {
      addToCart({
        id: item.productId || item.name,
        name: item.name,
        price: item.price,
        img: item.imageUrl || item.emoji || "📦",
        baseImg: item.imageUrl || item.emoji || "📦",
        brands: [{ id: item.brandId || "default", label: item.brand, price: item.price, img: item.imageUrl || item.emoji || "📦", tier: 1 }],
        selectedBrand: { id: item.brandId || "default", label: item.brand, price: item.price, img: item.imageUrl || item.emoji || "📦", tier: 1 },
        bundleName: b.name,
      });
    });
    toast.success(`✓ ${b.name} (${allItems.length} items) added to cart!`, { action: { label: "View Cart →", onClick: () => window.location.href = "/cart" } });
  };

  return (
    <div className="bg-card rounded-card shadow-card card-hover overflow-hidden flex flex-col">
      <Link to={`/bundles/${b.id}`} className="block">
        {/* Visual hero area with product image collage */}
        <div className="w-full aspect-[4/3] relative overflow-hidden" style={{ background: `linear-gradient(145deg, ${b.color}15, ${b.color}08, hsl(var(--muted)))` }}>
          {/* Bundle image or product image grid */}
          {b.imageUrl ? (
            <img src={b.imageUrl} alt={b.name} className="w-full h-full object-cover" loading="lazy" />
          ) : itemImages.length >= 4 ? (
            /* 2x2 grid of product images */
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[2px] p-3">
              {itemImages.slice(0, 4).map((item, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-card shadow-sm">
                  <ProductImage
                    imageUrl={item.imageUrl}
                    emoji={item.emoji}
                    alt={item.name}
                    className="w-full h-full"
                    emojiClassName="text-2xl"
                  />
                </div>
              ))}
            </div>
          ) : itemImages.length >= 1 ? (
            /* Single featured image with mini items */
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="w-[65%] aspect-square rounded-2xl overflow-hidden bg-card shadow-lg">
                <ProductImage
                  imageUrl={itemImages[0].imageUrl}
                  emoji={itemImages[0].emoji}
                  alt={itemImages[0].name}
                  className="w-full h-full"
                  emojiClassName="text-4xl"
                />
              </div>
              {/* Mini floating thumbnails */}
              <div className="absolute bottom-3 right-3 flex gap-1.5">
                {[...b.babyItems, ...b.mumItems].slice(1, 4).map((item, i) => (
                  <div key={i} className="w-10 h-10 rounded-lg overflow-hidden bg-card shadow-md border-2 border-card">
                    <ProductImage
                      imageUrl={item.imageUrl}
                      emoji={item.emoji}
                      alt={item.name}
                      className="w-full h-full"
                      emojiClassName="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Fallback: icon centered */
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${b.color}, ${b.color}BB)`, boxShadow: `0 8px 24px ${b.color}44` }}>
                <Package className="h-10 w-10 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-muted-foreground">{totalItems} items included</span>
            </div>
          )}

          {/* Tier badge */}
          <div className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-pill backdrop-blur-sm" style={{
            background: b.tier === "Premium" ? "rgba(252,228,236,0.9)"
                      : b.tier === "Standard" ? "rgba(232,245,233,0.9)"
                      : "rgba(227,242,253,0.9)",
            color: b.tier === "Premium" ? "#880E4F"
                 : b.tier === "Standard" ? "#2E7D32"
                 : "#1565C0"
          }}>
            {b.tier === "Premium" ? "✨ PREMIUM" : b.tier === "Standard" ? "STANDARD" : "STARTER"}
          </div>
          {/* Item count */}
          <div className="absolute top-2.5 right-2.5 bg-foreground/60 backdrop-blur-sm text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-pill">
            {totalItems} items
          </div>
          {/* Savings strip */}
          {savings > 0 && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/60 to-transparent pt-6 pb-2 px-3">
              <span className="text-primary-foreground text-[11px] font-bold">Save {fmt(savings)} ({savingsPercent}%)</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
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
                  <div key={i} className="flex items-center gap-2 py-1 border-b border-border/30 last:border-0">
                    <div className="w-7 h-7 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <ProductImage
                        imageUrl={item.imageUrl}
                        emoji={item.emoji}
                        alt={item.name}
                        className="w-full h-full"
                        emojiClassName="text-xs"
                      />
                    </div>
                    <span className="text-[11px] flex-1 min-w-0 truncate">
                      {item.name} — <span className="text-text-light">{item.brand}</span>
                    </span>
                    <span className="text-forest font-bold text-[10px] ml-1 flex-shrink-0">{fmt(item.price)}</span>
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
        </div>

        {/* Spacer to push price/CTA to bottom */}
        <div className="mt-auto" />

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
