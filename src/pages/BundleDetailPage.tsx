import { useParams, Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { toast } from "sonner";
import { ArrowLeft, Share2, ArrowLeftRight, Plus, Trash2, ZoomIn } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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

  // Customizable items state
  const [customBabyItems, setCustomBabyItems] = useState<BundleItem[] | null>(null);
  const [customMumItems, setCustomMumItems] = useState<BundleItem[] | null>(null);
  const [swapPopup, setSwapPopup] = useState<{ open: boolean; section: "baby" | "mum"; swapIndex?: number } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  // Initialize custom items from bundle
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
  const isInCart = cart.some(c => c.id === bundle.id);

  const upgradable = bundle.upsellBundleId && allBundles
    ? allBundles.find(b => b.id === bundle.upsellBundleId || b.slug === bundle.upsellBundleId)
    : (bundle.tier === "Basic" && allBundles
      ? allBundles.find(b => b.hospitalType === bundle.hospitalType && b.deliveryType === bundle.deliveryType && b.tier === "Premium")
      : null);

  const handleAdd = () => {
    addToCart({
      id: bundle.id,
      name: `${bundle.name}${isCustomized ? " (Customized)" : ""} — ${bundle.tier}`,
      price: displayPrice,
      img: bundle.icon,
      baseImg: bundle.icon,
      brands: [{ id: "default", label: bundle.tier, price: displayPrice, img: bundle.icon, tier: 1 }],
      selectedBrand: { id: "default", label: bundle.tier, price: displayPrice, img: bundle.icon, tier: 1 },
    });
    toast.success(`✓ ${bundle.name} added to cart!`, {
      action: { label: "View Cart →", onClick: () => (window.location.href = "/cart") },
    });
  };

  // Build shareable URL with customization params
  const shareUrl = isCustomized
    ? `https://bundledmum.com/bundles/${bundle.slug || bundle.id}?custom=1`
    : `https://bundledmum.com/bundles/${bundle.slug || bundle.id}`;

  const shareText = `Check out ${isCustomized ? "my customized " : "the "}${bundle.name} bundle on BundledMum! ${totalItems} items for ${fmt(displayPrice)}.`;

  // Swap/Add/Remove handlers
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
      // Swapping existing item
      if (section === "baby") {
        setCustomBabyItems(prev => prev ? prev.map((item, i) => i === swapIndex ? newItem : item) : []);
      } else {
        setCustomMumItems(prev => prev ? prev.map((item, i) => i === swapIndex ? newItem : item) : []);
      }
      toast.success("Product swapped!");
    } else {
      // Adding new item
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
    <div key={`${section}-${index}`} className="flex items-center gap-2.5 py-3 border-b border-border/40 last:border-0 group">
      {/* Product image with zoom */}
      <div
        className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-muted cursor-pointer relative group/img"
        onClick={() => item.imageUrl && setZoomImage(item.imageUrl)}
      >
        <ProductImage
          imageUrl={item.imageUrl}
          emoji={item.emoji}
          alt={item.name}
          className="w-full h-full"
          emojiClassName="text-xl"
        />
        {item.imageUrl && (
          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="h-3.5 w-3.5 text-primary-foreground opacity-0 group-hover/img:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{item.name}</p>
        <p className="text-muted-foreground text-[11px]">{item.brand}</p>
      </div>

      <span className="text-sm font-bold flex-shrink-0 mr-1">{fmt(item.price)}</span>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => handleSwap(section, index)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          title="Swap product"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 text-forest" />
        </button>
        <button
          onClick={() => handleRemoveItem(section, index)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors"
          title="Remove product"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
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

      {/* Hero Header */}
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
            {isCustomized && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-pill bg-coral text-primary-foreground">
                ✏️ Customized
              </span>
            )}
          </div>

          <div className="flex items-start gap-3 sm:gap-4 mb-3">
            <span className="text-4xl sm:text-5xl flex-shrink-0">{bundle.icon}</span>
            <div className="min-w-0">
              <h1 className="pf text-xl sm:text-2xl md:text-4xl text-primary-foreground leading-tight">{bundle.name}</h1>
              <p className="text-primary-foreground/70 text-xs sm:text-sm mt-1">{bundle.tagline}</p>
            </div>
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <span className="pf text-3xl font-bold text-primary-foreground">{fmt(displayPrice)}</span>
            {savings > 0 && !isCustomized && (
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
                Add {isCustomized ? "Custom " : "Full "}Bundle — {fmt(displayPrice)}
              </button>
            )}
            <button onClick={() => setShowShare(true)} className="rounded-pill border-2 border-primary-foreground/30 px-5 py-3 text-primary-foreground/80 font-body font-semibold text-sm hover:bg-primary-foreground/10 interactive flex items-center justify-center gap-2">
              <Share2 className="h-4 w-4" /> Share Bundle
            </button>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="max-w-[900px] mx-auto px-4 md:px-10 py-8 md:py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Baby Items */}
          <div className="bg-card rounded-card shadow-card p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="pf text-lg text-forest">👶 For Baby ({babyItems.length})</h3>
              <button
                onClick={() => handleAddNew("baby")}
                className="flex items-center gap-1 text-xs font-semibold text-forest hover:text-forest-deep transition-colors min-h-[44px] px-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>
            {babyItems.map((item, i) => renderItemRow(item, i, "baby"))}
            {babyItems.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">No items yet</p>
            )}
          </div>

          {/* Mum Items */}
          <div className="bg-card rounded-card shadow-card p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="pf text-lg text-forest">💛 For Mum ({mumItems.length})</h3>
              <button
                onClick={() => handleAddNew("mum")}
                className="flex items-center gap-1 text-xs font-semibold text-forest hover:text-forest-deep transition-colors min-h-[44px] px-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>
            {mumItems.map((item, i) => renderItemRow(item, i, "mum"))}
            {mumItems.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">No items yet</p>
            )}
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-forest-light rounded-card p-5 mt-6 text-center">
          <p className="text-forest text-sm font-semibold">
            {isCustomized ? "Custom bundle" : "Bundle"} price: <span className="text-lg font-bold">{fmt(displayPrice)}</span>
            {savings > 0 && !isCustomized && (
              <span className="text-muted-foreground text-xs ml-2">
                (Items separately: {fmt(bundle.separateTotal)} — You save <span className="text-forest font-bold">{fmt(savings)}</span>)
              </span>
            )}
          </p>
          {isCustomized && (
            <button
              onClick={() => { setCustomBabyItems([...bundle.babyItems]); setCustomMumItems([...bundle.mumItems]); }}
              className="text-xs text-forest hover:underline mt-2"
            >
              Reset to original bundle
            </button>
          )}
        </div>

        {/* Upsell */}
        {upgradable && (
          <div className="bg-warm-cream border-2 border-coral/30 rounded-card p-5 mt-6">
            <h3 className="pf text-lg text-coral mb-2">✨ Upgrade to Premium?</h3>
            <p className="text-muted-foreground text-sm mb-3">
              {bundle.upsellText || `For ${fmt(upgradable.price - bundle.price)} more, get the Premium version with ${upgradable.babyItems.length + upgradable.mumItems.length} items and top-tier brands.`}
            </p>
            <Link to={`/bundles/${upgradable.id}`} className="rounded-pill bg-coral px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-coral-dark inline-block interactive">
              View Premium Bundle →
            </Link>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          {isInCart ? (
            <Link to="/cart" className="rounded-pill bg-forest px-10 py-4 font-body font-semibold text-primary-foreground text-[15px] interactive inline-block">
              Go to Cart →
            </Link>
          ) : (
            <button onClick={handleAdd} className="rounded-pill bg-forest px-10 py-4 font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive text-[15px]">
              Add {isCustomized ? "Custom " : "Full "}Bundle to Cart — {fmt(displayPrice)} 🔒
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
