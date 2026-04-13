import { useParams, Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { toast } from "sonner";
import { ArrowLeft, Share2, ArrowLeftRight, Plus, Trash2, ZoomIn, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useBundle, useBundles, useAllProducts } from "@/hooks/useSupabaseData";
import type { BundleItem } from "@/lib/supabaseAdapters";
import ProductImage from "@/components/ProductImage";
import BundleItemSwapPopup from "@/components/BundleItemSwapPopup";
import BundleImageZoom from "@/components/BundleImageZoom";
import ShareModal from "@/components/ShareModal";

export default function BundleDetailPage() {
  const { bundleId } = useParams();
  const { data: bundle, isLoading } = useBundle(bundleId || "");
  const { data: allBundles } = useBundles();
  const { addToCart, cart } = useCart();

  const [customBabyItems, setCustomBabyItems] = useState<BundleItem[] | null>(null);
  const [customMumItems, setCustomMumItems] = useState<BundleItem[] | null>(null);
  const [swapPopup, setSwapPopup] = useState<{ open: boolean; section: "baby" | "mum"; swapIndex?: number } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (bundle && !customBabyItems) {
      setCustomBabyItems([...bundle.babyItems]);
      setCustomMumItems([...bundle.mumItems]);
    }
  }, [bundle]);

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

  const babyItems = customBabyItems || bundle.babyItems;
  const mumItems = customMumItems || bundle.mumItems;
  const allItems = [...babyItems, ...mumItems];
  const customTotal = allItems.reduce((s, i) => s + i.price, 0);
  const isCustomized = customBabyItems !== null && (
    JSON.stringify(customBabyItems) !== JSON.stringify(bundle.babyItems) ||
    JSON.stringify(customMumItems) !== JSON.stringify(bundle.mumItems)
  );
  const displayPrice = isCustomized ? customTotal : bundle.price;
  const totalItems = babyItems.length + mumItems.length;
  const separateTotal = isCustomized ? customTotal : bundle.separateTotal;
  const savings = separateTotal - displayPrice;
  const savingsPercent = separateTotal > 0 ? Math.round((savings / separateTotal) * 100) : 0;
  const isInCart = allItems.length > 0 && allItems.every(item => cart.some(c => c.bundleName === bundle.name && (c.id === item.productId || c.id === item.name)));

  const upgradable = bundle.upsellBundleId && allBundles
    ? allBundles.find(b => b.id === bundle.upsellBundleId || b.slug === bundle.upsellBundleId)
    : (bundle.tier === "Basic" && allBundles
      ? allBundles.find(b => b.hospitalType === bundle.hospitalType && b.deliveryType === bundle.deliveryType && b.tier === "Premium")
      : null);

  const handleAdd = () => {
    // Add each individual product as a separate cart item
    allItems.forEach(item => {
      addToCart({
        id: item.productId || item.name,
        name: item.name,
        price: item.price,
        img: item.imageUrl || item.emoji || "📦",
        baseImg: item.imageUrl || item.emoji || "📦",
        brands: [{ id: item.brandId || "default", label: item.brand, price: item.price, img: item.imageUrl || item.emoji || "📦", tier: 1 }],
        selectedBrand: { id: item.brandId || "default", label: item.brand, price: item.price, img: item.imageUrl || item.emoji || "📦", tier: 1 },
        bundleName: bundle.name,
      });
    });
    toast.success(`✓ ${bundle.name} (${allItems.length} items) added to cart!`, {
      action: { label: "View Cart →", onClick: () => (window.location.href = "/cart") },
    });
  };

  const shareUrl = isCustomized
    ? `https://bundledmum.com/bundles/${bundle.slug || bundle.id}?custom=1`
    : `https://bundledmum.com/bundles/${bundle.slug || bundle.id}`;

  const shareText = `Check out ${isCustomized ? "my customized " : "the "}${bundle.name} bundle on BundledMum! ${totalItems} items for ${fmt(displayPrice)}.`;

  const handleSwap = (section: "baby" | "mum", index: number) => {
    setSwapPopup({ open: true, section, swapIndex: index });
  };

  const handleAddNew = (section: "baby" | "mum") => {
    setSwapPopup({ open: true, section });
  };

  const handleRemoveItem = (section: "baby" | "mum", index: number) => {
    if (section === "baby") {
      setCustomBabyItems(prev => prev ? prev.filter((_, i) => i !== index) : []);
    } else {
      setCustomMumItems(prev => prev ? prev.filter((_, i) => i !== index) : []);
    }
    toast.success("Item removed");
  };

  const handleSwapSelect = (newItem: BundleItem) => {
    if (!swapPopup) return;
    const { section, swapIndex } = swapPopup;
    if (swapIndex !== undefined) {
      if (section === "baby") {
        setCustomBabyItems(prev => prev ? prev.map((item, i) => i === swapIndex ? newItem : item) : []);
      } else {
        setCustomMumItems(prev => prev ? prev.map((item, i) => i === swapIndex ? newItem : item) : []);
      }
      toast.success("Product swapped!");
    } else {
      if (section === "baby") {
        setCustomBabyItems(prev => [...(prev || []), newItem]);
      } else {
        setCustomMumItems(prev => [...(prev || []), newItem]);
      }
      toast.success("Product added!");
    }
  };

  const existingNames = allItems.map(i => i.name);

  const renderItemRow = (item: BundleItem, index: number, section: "baby" | "mum") => (
    <div key={`${section}-${index}`} className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      {/* Product image */}
      <button
        className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted relative group"
        onClick={() => item.imageUrl && setZoomImage(item.imageUrl)}
        aria-label={`Zoom ${item.name}`}
      >
        <ProductImage
          imageUrl={item.imageUrl}
          emoji={item.emoji}
          alt={item.name}
          className="w-full h-full"
          emojiClassName="text-xl"
        />
        {item.imageUrl && (
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
            <ZoomIn className="h-3.5 w-3.5 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-tight truncate">{item.name}</p>
        <p className="text-muted-foreground text-[11px]">{item.brand}</p>
        <p className="text-forest font-bold text-[12px] mt-0.5">{fmt(item.price)}</p>
      </div>

      {/* Action buttons – always visible on mobile */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => handleSwap(section, index)}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-forest-light hover:bg-forest/20 transition-colors"
          title="Swap product"
          aria-label="Swap product"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 text-forest" />
        </button>
        <button
          onClick={() => handleRemoveItem(section, index)}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 transition-colors"
          title="Remove product"
          aria-label="Remove product"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {zoomImage && <BundleImageZoom src={zoomImage} alt="Product" onClose={() => setZoomImage(null)} />}

      {showShare && (
        <ShareModal
          onClose={() => setShowShare(false)}
          title={bundle.name}
          subtitle={`${totalItems} items · ${bundle.tier}`}
          items={allItems.map(i => ({ name: i.name, price: i.price }))}
          totalPrice={displayPrice}
          badge={isCustomized ? "✨ Customized Bundle" : bundle.tier}
          shareUrl={shareUrl}
          shareText={shareText}
          hospitalType={bundle.hospitalType}
          itemCount={totalItems}
        />
      )}

      {swapPopup?.open && (
        <BundleItemSwapPopup
          open
          onClose={() => setSwapPopup(null)}
          section={swapPopup.section}
          swappingItem={swapPopup.swapIndex !== undefined
            ? (swapPopup.section === "baby" ? babyItems[swapPopup.swapIndex] : mumItems[swapPopup.swapIndex])
            : null}
          onSelect={handleSwapSelect}
          existingItemNames={existingNames}
        />
      )}

      {/* Hero Header – compact on mobile */}
      <div className="pt-[68px]" style={{ background: `linear-gradient(135deg, ${bundle.color}CC, ${bundle.color}88)` }}>
        <div className="max-w-[900px] mx-auto px-4 md:px-10 py-5 md:py-14">
          <Link to="/bundles" className="text-primary-foreground/60 text-xs hover:text-primary-foreground/80 mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> All Bundles
          </Link>

          <nav className="text-primary-foreground/40 text-[11px] mb-3" aria-label="Breadcrumb">
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

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              bundle.hospitalType === "public" ? "🏥 Public" : bundle.hospitalType === "private" ? "🏨 Private" : "🎁 Gift",
              bundle.deliveryType ? (bundle.deliveryType === "vaginal" ? "Vaginal" : "C-Section") : null,
              bundle.tier === "Premium" ? "✨ Premium" : "Basic",
              `${totalItems} items`,
            ].filter(Boolean).map((label, i) => (
              <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-pill bg-primary-foreground/15 text-primary-foreground">
                {label}
              </span>
            ))}
            {isCustomized && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-pill bg-coral text-primary-foreground">
                ✏️ Customized
              </span>
            )}
          </div>

          <h1 className="pf text-xl md:text-3xl text-primary-foreground leading-tight mb-1">{bundle.name}</h1>
          <p className="text-primary-foreground/70 text-xs md:text-sm mb-4 line-clamp-2">{bundle.tagline}</p>

          {/* Price */}
          <div className="flex items-end gap-2 flex-wrap mb-4">
            <span className="pf text-2xl md:text-3xl font-bold text-primary-foreground">{fmt(displayPrice)}</span>
            {savings > 0 && !isCustomized && (
              <>
                <span className="text-primary-foreground/50 line-through text-sm">{fmt(bundle.separateTotal)}</span>
                <span className="bg-coral text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-pill">
                  Save {fmt(savings)} ({savingsPercent}%)
                </span>
              </>
            )}
          </div>

          {/* CTA row */}
          <div className="flex gap-2">
            {isInCart ? (
              <Link to="/cart" className="rounded-pill bg-primary-foreground text-forest px-6 py-2.5 font-body font-semibold text-sm interactive text-center flex-1 md:flex-none">
                In Cart ✓ — View Cart
              </Link>
            ) : (
              <button onClick={handleAdd} className="rounded-pill bg-coral px-5 py-2.5 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-sm text-center flex-1 md:flex-none">
                Add Bundle — {fmt(displayPrice)}
              </button>
            )}
            <button onClick={() => setShowShare(true)} className="rounded-pill border-2 border-primary-foreground/30 px-4 py-2.5 text-primary-foreground/80 font-body font-semibold text-sm hover:bg-primary-foreground/10 interactive flex items-center gap-1.5">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="max-w-[900px] mx-auto px-4 md:px-10 py-6 md:py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Baby Items */}
          <div className="bg-card rounded-card shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="pf text-base text-forest">👶 For Baby ({babyItems.length})</h3>
              <button
                onClick={() => handleAddNew("baby")}
                className="flex items-center gap-1.5 text-xs font-semibold text-forest bg-forest-light hover:bg-forest/20 rounded-pill px-3 py-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="px-4">
              {babyItems.map((item, i) => renderItemRow(item, i, "baby"))}
              {babyItems.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-6">No items yet — tap "Add" above</p>
              )}
            </div>
          </div>

          {/* Mum Items */}
          <div className="bg-card rounded-card shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="pf text-base text-forest">💛 For Mum ({mumItems.length})</h3>
              <button
                onClick={() => handleAddNew("mum")}
                className="flex items-center gap-1.5 text-xs font-semibold text-forest bg-forest-light hover:bg-forest/20 rounded-pill px-3 py-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="px-4">
              {mumItems.map((item, i) => renderItemRow(item, i, "mum"))}
              {mumItems.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-6">No items yet — tap "Add" above</p>
              )}
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-forest-light rounded-card p-4 mt-5 text-center">
          <p className="text-forest text-sm font-semibold">
            {isCustomized ? "Custom bundle" : "Bundle"} total: <span className="text-lg font-bold">{fmt(displayPrice)}</span>
            {savings > 0 && !isCustomized && (
              <span className="text-muted-foreground text-xs ml-2">
                (Save <span className="text-forest font-bold">{fmt(savings)}</span>)
              </span>
            )}
          </p>
          {isCustomized && (
            <button
              onClick={() => { setCustomBabyItems([...bundle.babyItems]); setCustomMumItems([...bundle.mumItems]); }}
              className="text-xs text-forest hover:underline mt-1.5"
            >
              Reset to original bundle
            </button>
          )}
        </div>

        {/* Proceed to Checkout CTA */}
        <div className="mt-5 text-center">
          {isInCart ? (
            <Link to="/cart" className="inline-block w-full rounded-pill py-3.5 font-body font-semibold text-primary-foreground text-sm interactive text-center" style={{ backgroundColor: "#F4845F" }}>
              Proceed to Checkout — {fmt(displayPrice)}
            </Link>
          ) : (
            <button onClick={handleAdd} className="w-full rounded-pill py-3.5 font-body font-semibold text-primary-foreground text-sm interactive" style={{ backgroundColor: "#F4845F" }}>
              Add to Cart — {fmt(displayPrice)}
            </button>
          )}
        </div>

        {/* Upsell */}
        {upgradable && (
          <div className="bg-warm-cream border-2 border-coral/30 rounded-card p-4 mt-5">
            <h3 className="pf text-base text-coral mb-1.5">✨ Upgrade to Premium?</h3>
            <p className="text-muted-foreground text-xs mb-3">
              {bundle.upsellText || `For ${fmt(upgradable.price - bundle.price)} more, get ${upgradable.babyItems.length + upgradable.mumItems.length} items with top-tier brands.`}
            </p>
            <Link to={`/bundles/${upgradable.id}`} className="rounded-pill bg-coral px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-coral-dark inline-block interactive">
              View Premium →
            </Link>
          </div>
        )}
      </div>

      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-[56px] md:bottom-0 inset-x-0 z-40 md:hidden bg-card border-t border-border px-4 py-3 safe-area-bottom">
        {isInCart ? (
          <Link to="/cart" className="block w-full rounded-pill bg-forest text-center py-3 font-body font-semibold text-primary-foreground text-sm interactive">
            In Cart ✓ — View Cart
          </Link>
        ) : (
          <button onClick={handleAdd} className="w-full rounded-pill bg-coral py-3 font-body font-semibold text-primary-foreground text-sm hover:bg-coral-dark interactive">
            Add Bundle — {fmt(displayPrice)}
          </button>
        )}
      </div>
    </div>
  );
}
