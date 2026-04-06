import { useParams, Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { toast } from "sonner";
import { ArrowLeft, Share2 } from "lucide-react";
import { useEffect } from "react";
import { useBundle, useBundles } from "@/hooks/useSupabaseData";
import type { BundleItem } from "@/lib/supabaseAdapters";

export default function BundleDetailPage() {
  const { bundleId } = useParams();
  const { data: bundle, isLoading } = useBundle(bundleId || "");
  const { data: allBundles } = useBundles();
  const { addToCart, cart } = useCart();

  useEffect(() => {
    if (bundle) document.title = `${bundle.name} | BundledMum`;
  }, [bundle]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-border border-t-forest rounded-full animate-spin" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-background pt-24 text-center">
        <h1 className="pf text-2xl mb-4">Bundle not found</h1>
        <Link to="/bundles" className="text-forest font-semibold hover:underline">← Back to Bundles</Link>
      </div>
    );
  }

  const isInCart = cart.some(c => c.id === bundle.id);
  const totalItems = bundle.babyItems.length + bundle.mumItems.length;
  const savings = bundle.separateTotal - bundle.price;
  const savingsPercent = bundle.separateTotal > 0 ? Math.round((savings / bundle.separateTotal) * 100) : 0;

  const upgradable = bundle.tier === "Basic" && allBundles
    ? allBundles.find(b => b.hospitalType === bundle.hospitalType && b.deliveryType === bundle.deliveryType && b.tier === "Premium")
    : null;

  const handleAdd = () => {
    addToCart({
      id: bundle.id,
      name: `${bundle.name} — ${bundle.tier}`,
      price: bundle.price,
      img: bundle.icon,
      baseImg: bundle.icon,
      brands: [{ id: "default", label: bundle.tier, price: bundle.price, img: bundle.icon, tier: 1 }],
      selectedBrand: { id: "default", label: bundle.tier, price: bundle.price, img: bundle.icon, tier: 1 },
    });
    toast.success(`✓ ${bundle.name} added to cart!`, {
      action: { label: "View Cart →", onClick: () => (window.location.href = "/cart") },
    });
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `Check out the ${bundle.name} bundle on BundledMum! ${totalItems} items for ${fmt(bundle.price)}. ${url}`;
    navigator.clipboard.writeText(text).then(() => toast.success("Link copied!"));
  };

  const renderItemRow = (item: BundleItem, i: number) => (
    <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{item.emoji || "📦"}</span>
        <div>
          <p className="text-sm font-semibold">{item.name}</p>
          <p className="text-text-light text-[11px]">{item.brand}</p>
        </div>
      </div>
      <span className="text-sm font-bold flex-shrink-0">{fmt(item.price)}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20" style={{ background: `linear-gradient(135deg, ${bundle.color}CC, ${bundle.color}88)` }}>
        <div className="max-w-[900px] mx-auto px-4 md:px-10 py-8 md:py-14">
          <Link to="/bundles" className="text-primary-foreground/60 text-xs hover:text-primary-foreground/80 mb-3 inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> All Bundles
          </Link>

          <nav className="text-primary-foreground/40 text-[11px] mb-4" aria-label="Breadcrumb">
            <ol className="flex flex-wrap gap-1" itemScope itemType="https://schema.org/BreadcrumbList">
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link to="/" itemProp="item" className="hover:text-primary-foreground/60"><span itemProp="name">Home</span></Link>
                <meta itemProp="position" content="1" />
              </li>
              <li className="mx-1">›</li>
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link to="/bundles" itemProp="item" className="hover:text-primary-foreground/60"><span itemProp="name">Hospital Bags</span></Link>
                <meta itemProp="position" content="2" />
              </li>
              <li className="mx-1">›</li>
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <span itemProp="name" className="text-primary-foreground/70">{bundle.name}</span>
                <meta itemProp="position" content="3" />
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-pill bg-primary-foreground/15 text-primary-foreground">
              {bundle.hospitalType === "public" ? "🏥 Public" : bundle.hospitalType === "private" ? "🏨 Private" : "🎁 Gift"}
            </span>
            {bundle.deliveryType && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-pill bg-primary-foreground/15 text-primary-foreground">
                {bundle.deliveryType === "vaginal" ? "Vaginal" : "C-Section"}
              </span>
            )}
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-pill bg-primary-foreground/15 text-primary-foreground">
              {bundle.tier === "Premium" ? "✨ Premium" : "Basic"}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-pill bg-primary-foreground/15 text-primary-foreground">
              {totalItems} items
            </span>
          </div>

          <div className="flex items-start gap-3 sm:gap-4 mb-3">
            <span className="text-4xl sm:text-5xl flex-shrink-0">{bundle.icon}</span>
            <div className="min-w-0">
              <h1 className="pf text-xl sm:text-2xl md:text-4xl text-primary-foreground leading-tight">{bundle.name}</h1>
              <p className="text-primary-foreground/70 text-xs sm:text-sm mt-1">{bundle.tagline}</p>
            </div>
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <span className="pf text-3xl font-bold text-primary-foreground">{fmt(bundle.price)}</span>
            {savings > 0 && (
              <>
                <span className="text-primary-foreground/50 line-through text-sm">{fmt(bundle.separateTotal)}</span>
                <span className="bg-coral text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-pill">
                  Save {fmt(savings)} ({savingsPercent}%)
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            {isInCart ? (
              <Link to="/cart" className="rounded-pill bg-primary-foreground text-forest px-8 py-3 font-body font-semibold text-sm interactive text-center">
                In Cart ✓ — View Cart
              </Link>
            ) : (
              <button onClick={handleAdd} className="rounded-pill bg-coral px-6 sm:px-8 py-3 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-sm text-center">
                Add Full Bundle — {fmt(bundle.price)}
              </button>
            )}
            <button onClick={handleShare} className="rounded-pill border-2 border-primary-foreground/30 px-5 py-3 text-primary-foreground/80 font-body font-semibold text-sm hover:bg-primary-foreground/10 interactive flex items-center justify-center gap-2">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 md:px-10 py-8 md:py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card rounded-card shadow-card p-5 md:p-6">
            <h3 className="pf text-lg text-forest mb-4">👶 For Baby ({bundle.babyItems.length} items)</h3>
            {bundle.babyItems.map(renderItemRow)}
          </div>
          <div className="bg-card rounded-card shadow-card p-5 md:p-6">
            <h3 className="pf text-lg text-forest mb-4">💛 For Mum ({bundle.mumItems.length} items)</h3>
            {bundle.mumItems.map(renderItemRow)}
          </div>
        </div>

        <div className="bg-forest-light rounded-card p-5 mt-6 text-center">
          <p className="text-forest text-sm font-semibold">
            Bundle price: <span className="text-lg font-bold">{fmt(bundle.price)}</span>
            {savings > 0 && (
              <span className="text-text-med text-xs ml-2">
                (Items separately: {fmt(bundle.separateTotal)} — You save <span className="text-forest font-bold">{fmt(savings)}</span>)
              </span>
            )}
          </p>
        </div>

        {upgradable && (
          <div className="bg-warm-cream border-2 border-coral/30 rounded-card p-5 mt-6">
            <h3 className="pf text-lg text-coral mb-2">✨ Upgrade to Premium?</h3>
            <p className="text-text-med text-sm mb-3">
              For {fmt(upgradable.price - bundle.price)} more, get the Premium version with {upgradable.babyItems.length + upgradable.mumItems.length} items and top-tier brands.
            </p>
            <Link to={`/bundles/${upgradable.id}`} className="rounded-pill bg-coral px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-coral-dark inline-block interactive">
              View Premium Bundle →
            </Link>
          </div>
        )}

        <div className="mt-8 text-center">
          {isInCart ? (
            <Link to="/cart" className="rounded-pill bg-forest px-10 py-4 font-body font-semibold text-primary-foreground text-[15px] interactive inline-block">
              Go to Cart →
            </Link>
          ) : (
            <button onClick={handleAdd} className="rounded-pill bg-forest px-10 py-4 font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive text-[15px]">
              Add Full Bundle to Cart — {fmt(bundle.price)} 🔒
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
