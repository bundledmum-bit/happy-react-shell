import { useParams, Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { toast } from "sonner";
import { ArrowLeft, Share2, ArrowLeftRight, Plus, Trash2, X, Pencil } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useBundle, useBundles, useAllProducts } from "@/hooks/useSupabaseData";
import type { BundleItem } from "@/lib/supabaseAdapters";
import ProductImage from "@/components/ProductImage";
import BundleItemSwapPopup from "@/components/BundleItemSwapPopup";
import ShareModal from "@/components/ShareModal";

export default function BundleDetailPage() {
  const { bundleId } = useParams();
  const { data: bundle, isLoading } = useBundle(bundleId || "");
  const { data: allBundles } = useBundles();
  const { data: allProducts } = useAllProducts();
  const { addToCart, cart } = useCart();

  // Fast lookup by product_id so we can resolve a BundleItem back to its
  // full Product (brands, sizes, subcategory) when the attribute picker
  // opens.
  const productMap = useMemo(() => {
    const map = new Map<string, any>();
    (allProducts || []).forEach(p => map.set(p.id, p));
    return map;
  }, [allProducts]);

  const [customBabyItems, setCustomBabyItems] = useState<BundleItem[] | null>(null);
  const [customMumItems, setCustomMumItems] = useState<BundleItem[] | null>(null);
  const [customHospitalItems, setCustomHospitalItems] = useState<BundleItem[] | null>(null);
  const [customConvenienceItems, setCustomConvenienceItems] = useState<BundleItem[] | null>(null);
  const [swapPopup, setSwapPopup] = useState<{ open: boolean; section: "baby" | "mum" | "hospital" | "convenience"; swapIndex?: number } | null>(null);
  const [attrPicker, setAttrPicker] = useState<{ item: BundleItem; section: "baby" | "mum" | "hospital" | "convenience"; index: number } | null>(null);
  const [pickerBrandId, setPickerBrandId] = useState<string>("");
  const [pickerSize, setPickerSize] = useState<string>("");
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (bundle && !customBabyItems) {
      setCustomBabyItems([...bundle.babyItems]);
      setCustomMumItems([...bundle.mumItems]);
      setCustomHospitalItems([...bundle.hospitalItems]);
      setCustomConvenienceItems([...bundle.convenienceItems]);
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
  const hospitalItems = customHospitalItems || bundle.hospitalItems;
  const convenienceItems = customConvenienceItems || bundle.convenienceItems;
  const allItems = [...babyItems, ...mumItems, ...hospitalItems, ...convenienceItems];
  const customTotal = allItems.reduce((s, i) => s + i.price, 0);
  const isCustomized = customBabyItems !== null && (
    JSON.stringify(customBabyItems) !== JSON.stringify(bundle.babyItems) ||
    JSON.stringify(customMumItems) !== JSON.stringify(bundle.mumItems) ||
    JSON.stringify(customHospitalItems) !== JSON.stringify(bundle.hospitalItems) ||
    JSON.stringify(customConvenienceItems) !== JSON.stringify(bundle.convenienceItems)
  );
  const displayPrice = isCustomized ? customTotal : bundle.price;
  const totalItems = babyItems.length + mumItems.length + hospitalItems.length + convenienceItems.length;
  const separateTotal = isCustomized ? customTotal : bundle.separateTotal;
  const savings = separateTotal - displayPrice;
  const savingsPercent = separateTotal > 0 ? Math.round((savings / separateTotal) * 100) : 0;
  const isInCart = allItems.length > 0 && allItems.every(item => cart.some(c => c.bundleName === bundle.name && (c.id === item.productId || c.id === item.name)));

  const upgradable = bundle.upsellBundleId && allBundles
    ? allBundles.find(b => b.id === bundle.upsellBundleId || b.slug === bundle.upsellBundleId)
    : (bundle.tier !== "Premium" && allBundles
      ? allBundles.find(b => b.tier === "Premium")
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

  const handleSwap = (section: "baby" | "mum" | "hospital" | "convenience", index: number) => {
    setSwapPopup({ open: true, section, swapIndex: index });
  };

  const handleAddNew = (section: "baby" | "mum" | "hospital" | "convenience") => {
    setSwapPopup({ open: true, section });
  };

  const handleRemoveItem = (section: "baby" | "mum" | "hospital" | "convenience", index: number) => {
    if (section === "baby") {
      setCustomBabyItems(prev => prev ? prev.filter((_, i) => i !== index) : []);
    } else if (section === "hospital") {
      setCustomHospitalItems(prev => prev ? prev.filter((_, i) => i !== index) : []);
    } else if (section === "convenience") {
      setCustomConvenienceItems(prev => prev ? prev.filter((_, i) => i !== index) : []);
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
      } else if (section === "hospital") {
        setCustomHospitalItems(prev => prev ? prev.map((item, i) => i === swapIndex ? newItem : item) : []);
      } else if (section === "convenience") {
        setCustomConvenienceItems(prev => prev ? prev.map((item, i) => i === swapIndex ? newItem : item) : []);
      } else {
        setCustomMumItems(prev => prev ? prev.map((item, i) => i === swapIndex ? newItem : item) : []);
      }
      toast.success("Product swapped!");
    } else {
      if (section === "baby") {
        setCustomBabyItems(prev => [...(prev || []), newItem]);
      } else if (section === "hospital") {
        setCustomHospitalItems(prev => [...(prev || []), newItem]);
      } else if (section === "convenience") {
        setCustomConvenienceItems(prev => [...(prev || []), newItem]);
      } else {
        setCustomMumItems(prev => [...(prev || []), newItem]);
      }
      toast.success("Product added!");
    }
  };

  const existingNames = allItems.map(i => i.name);

  const handleAttrConfirm = (
    selectedBrand: { id: string; label: string; price: number; imageUrl?: string | null },
    selectedSize?: string
  ) => {
    if (!attrPicker) return;
    const { section, index } = attrPicker;
    const updated: BundleItem = {
      ...attrPicker.item,
      brand: selectedBrand.label,
      price: selectedBrand.price,
      brandId: selectedBrand.id,
      imageUrl: selectedBrand.imageUrl || attrPicker.item.imageUrl,
    };
    if (section === "baby")
      setCustomBabyItems(prev => prev!.map((it, i) => i === index ? updated : it));
    else if (section === "mum")
      setCustomMumItems(prev => prev!.map((it, i) => i === index ? updated : it));
    else if (section === "hospital")
      setCustomHospitalItems(prev => prev!.map((it, i) => i === index ? updated : it));
    else
      setCustomConvenienceItems(prev => prev!.map((it, i) => i === index ? updated : it));
    setAttrPicker(null);
    toast.success(`Updated to ${selectedBrand.label}${selectedSize ? ` · ${selectedSize}` : ""}`);
  };

  const openAttrPicker = (item: BundleItem, section: "baby" | "mum" | "hospital" | "convenience", index: number) => {
    const fullProduct = item.productId ? productMap.get(item.productId) : null;
    setPickerBrandId(item.brandId || fullProduct?.brands?.[0]?.id || "");
    setPickerSize(fullProduct?.sizes?.[0] || "");
    setAttrPicker({ item, section, index });
  };

  const renderItemRow = (item: BundleItem, index: number, section: "baby" | "mum" | "hospital" | "convenience") => (
    <div key={`${section}-${index}`} className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      {/* Product image + name/brand — tap to edit brand, size, colour */}
      <button
        onClick={() => openAttrPicker(item, section, index)}
        className="flex-1 min-w-0 flex items-center gap-3 text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-muted/40 transition-colors group"
        aria-label={`Edit ${item.name}`}
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted relative">
          <ProductImage
            imageUrl={item.imageUrl}
            emoji={item.emoji}
            alt={item.name}
            className="w-full h-full"
            emojiClassName="text-xl"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-tight truncate flex items-center gap-1.5">
            {item.name}
            <Pencil className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </p>
          <p className="text-muted-foreground text-[11px]">{item.brand}</p>
          <p className="text-forest font-bold text-[12px] mt-0.5">{fmt(item.price)}</p>
        </div>
      </button>

      {/* Action buttons – always visible on mobile */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => handleSwap(section, index)}
          className="w-10 h-10 p-2 rounded-full flex items-center justify-center bg-forest-light hover:bg-forest/20 transition-colors"
          title="Swap product"
          aria-label="Swap product"
        >
          <ArrowLeftRight className="h-4 w-4 text-forest" />
        </button>
        <button
          onClick={() => handleRemoveItem(section, index)}
          className="w-10 h-10 p-2 rounded-full flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 transition-colors"
          title="Remove product"
          aria-label="Remove product"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </button>
      </div>
    </div>
  );

  // Resolved product for the current attribute picker (if any)
  const pickerProduct = attrPicker?.item.productId ? productMap.get(attrPicker.item.productId) : null;
  const pickerSelectedBrand = pickerProduct?.brands?.find((b: any) => b.id === pickerBrandId)
    || pickerProduct?.brands?.[0];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Attribute picker — change brand / size / colour for a bundle item */}
      {attrPicker && (
        <div
          className="fixed inset-0 z-[950] flex items-end sm:items-center justify-center"
          onClick={() => setAttrPicker(null)}
        >
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
          <div
            className="relative bg-card rounded-t-[20px] sm:rounded-[20px] shadow-2xl w-full sm:max-w-[480px] max-h-[85vh] flex flex-col animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-4 border-b border-border">
              <div className="flex-1 min-w-0 pr-3">
                <h3 className="pf text-lg font-bold leading-tight">{attrPicker.item.name}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">Change brand, size or colour</p>
              </div>
              <button onClick={() => setAttrPicker(null)} className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 flex-shrink-0" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!pickerProduct ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Product details not available
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Brands */}
                {pickerProduct.brands?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Brand</p>
                    <div className="flex flex-wrap gap-2">
                      {pickerProduct.brands.map((b: any) => {
                        const selected = pickerBrandId === b.id;
                        const oos = b.inStock === false || b.stockQuantity === 0;
                        return (
                          <button
                            key={b.id}
                            onClick={() => !oos && setPickerBrandId(b.id)}
                            disabled={oos}
                            className={`px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px] transition-all font-body ${oos ? "opacity-40 cursor-not-allowed" : ""} ${selected ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-muted-foreground hover:border-forest/40"}`}
                          >
                            {b.label} · {fmt(b.price)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {pickerProduct.sizes && pickerProduct.sizes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {pickerProduct.sizes.map((s: string) => {
                        const selected = pickerSize === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setPickerSize(s)}
                            className={`px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px] transition-all font-body ${selected ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-muted-foreground hover:border-forest/40"}`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {pickerProduct && pickerSelectedBrand && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => handleAttrConfirm(
                    { id: pickerSelectedBrand.id, label: pickerSelectedBrand.label, price: pickerSelectedBrand.price, imageUrl: pickerSelectedBrand.imageUrl ?? null },
                    pickerSize || undefined
                  )}
                  className="w-full rounded-pill bg-forest text-primary-foreground py-3 font-semibold text-sm hover:bg-forest-deep transition-colors"
                >
                  Confirm — {fmt(pickerSelectedBrand.price)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
            ? (swapPopup.section === "baby"
                ? babyItems[swapPopup.swapIndex]
                : swapPopup.section === "hospital"
                  ? hospitalItems[swapPopup.swapIndex]
                  : mumItems[swapPopup.swapIndex])
            : null}
          onSelect={handleSwapSelect}
          existingItemNames={existingNames}
        />
      )}

      {/* Hero Header – compact on mobile */}
      <div className="pt-[68px]" style={{ background: `linear-gradient(135deg, ${bundle.color}CC, ${bundle.color}88)` }}>
        <div className="max-w-[900px] mx-auto px-4 md:px-10 py-5 md:py-14">
          <Link to="/bundles" className="text-primary-foreground/60 text-xs hover:text-primary-foreground/80 mb-2 inline-flex items-center gap-1 py-2 -my-2">
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
              bundle.tier === "Premium" ? "✨ Premium" : bundle.tier === "Standard" ? "Standard" : "Starter",
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

          {/* Hospital Consumables */}
          {hospitalItems.length > 0 && (
            <div className="bg-card rounded-card shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="pf text-base text-forest">🏥 Hospital Consumables ({hospitalItems.length})</h3>
                <button
                  onClick={() => handleAddNew("hospital")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-forest bg-forest-light hover:bg-forest/20 rounded-pill px-3 py-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <div className="px-4">
                {hospitalItems.map((item, i) => renderItemRow(item, i, "hospital"))}
              </div>
            </div>
          )}

          {/* Convenience Extras */}
          {convenienceItems.length > 0 && (
            <div className="bg-card rounded-card shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="pf text-base text-forest">✨ Convenience Extras ({convenienceItems.length})</h3>
                <button
                  onClick={() => handleAddNew("convenience")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-forest bg-forest-light hover:bg-forest/20 rounded-pill px-3 py-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <div className="px-4">
                {convenienceItems.map((item, i) => renderItemRow(item, i, "convenience"))}
              </div>
            </div>
          )}
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
              onClick={() => { setCustomBabyItems([...bundle.babyItems]); setCustomMumItems([...bundle.mumItems]); setCustomHospitalItems([...bundle.hospitalItems]); setCustomConvenienceItems([...bundle.convenienceItems]); }}
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
