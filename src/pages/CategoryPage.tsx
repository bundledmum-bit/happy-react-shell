import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adaptProducts, isProductOOS, type Brand, type Product } from "@/lib/supabaseAdapters";
import { useCart, fmt } from "@/lib/cart";
import { toast } from "sonner";
import ProductDetailDrawer from "@/components/ProductDetailDrawer";
import ProductImage from "@/components/ProductImage";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useCategoryPagePins, type SectionPinnedProduct } from "@/hooks/useMerchandising";

// Solid coloured header bars — mirrors CuratedSections so category pages
// have the same look and feel as shop pages. The body of each section card
// sits on white so brand cards read clearly against the saturated bar.
const HEADER_PALETTE: Array<{ bar: string; text: string }> = [
  { bar: "bg-coral",       text: "text-white" },
  { bar: "bg-forest",      text: "text-white" },
  { bar: "bg-mint",        text: "text-forest" },
  { bar: "bg-warm-cream",  text: "text-forest" },
];

const BRAND_COLS =
  "id, product_id, brand_name, price, tier, is_default_for_tier, size_variant, in_stock, stock_quantity, display_order, image_url, thumbnail_url, logo_url, compare_at_price, images, cost_price, weight_range_kg, pack_count, diaper_type, sku";
const PRODUCT_COLS = `*, brands(${BRAND_COLS}), product_sizes(*), product_colors(*), product_tags(*), product_images(*)`;

function useCategoryProducts(slug: string) {
  return useQuery({
    queryKey: ["category_products", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLS)
        .eq("subcategory", slug)
        .eq("is_active", true)
        .is("deleted_at", null);
      if (error) throw error;
      const rows = data || [];
      // Sort: stage_order ASC NULLS LAST, then name ASC.
      rows.sort((a: any, b: any) => {
        const aSO = a.stage_order == null ? Number.POSITIVE_INFINITY : a.stage_order;
        const bSO = b.stage_order == null ? Number.POSITIVE_INFINITY : b.stage_order;
        if (aSO !== bSO) return aSO - bSO;
        return (a.name || "").localeCompare(b.name || "");
      });
      return adaptProducts(rows);
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export default function CategoryPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: allProducts, isLoading: loadingAll } = useCategoryProducts(slug);
  const { data: pinnedProducts, isLoading: loadingPins } = useCategoryPagePins(slug);
  const { data: categories } = useProductCategories();
  const category = (categories || []).find(c => c.slug === slug);
  const [detail, setDetail] = useState<{ product: Product; brandId?: string } | null>(null);

  const heading = category?.merch_page_label?.trim() || category?.name || slug;

  useEffect(() => {
    document.title = `${heading || "Category"} | BundledMum`;
  }, [heading]);

  // Merge pins (already in order, carrying display_label/default_brand_id)
  // with the rest of the category products, dedupe by product.id. Pins
  // win the slot they occupy. Non-pinned products get null overrides so
  // the downstream renderer can treat the array uniformly.
  const products = useMemo<SectionPinnedProduct[]>(() => {
    const pins = pinnedProducts || [];
    const rest = allProducts || [];
    const seen = new Set<string>();
    const merged: SectionPinnedProduct[] = [];
    for (const pin of pins) {
      if (!seen.has(pin.product.id)) {
        seen.add(pin.product.id);
        merged.push(pin);
      }
    }
    for (const p of rest) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        merged.push({ product: p, displayLabel: null, defaultBrandId: null });
      }
    }
    return merged;
  }, [pinnedProducts, allProducts]);

  const isLoading = loadingAll || loadingPins;
  const totalProducts = products.length;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 pt-[68px]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 pt-4 md:pt-6">
        <nav className="text-xs text-muted-foreground mb-3">
          <Link to="/shop" className="hover:text-foreground">Shop</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground font-medium">{heading}</span>
        </nav>
        <div className="flex items-center gap-3 mb-2">
          {category?.icon && <span className="text-3xl">{category.icon}</span>}
          <h1 className="pf text-2xl md:text-3xl font-bold">{heading}</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          {totalProducts} product{totalProducts === 1 ? "" : "s"}
        </p>

        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-5 w-40 bg-muted rounded mb-3 animate-pulse" />
                <div className="flex gap-3 overflow-hidden">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="w-[35vw] md:w-[180px] h-[260px] bg-card rounded-card animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="pf text-xl mb-2">No products in this category yet</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Check back soon — we're constantly adding new items.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 border-[1.5px] border-forest text-forest rounded-pill px-5 py-2.5 text-sm font-semibold hover:bg-forest/5 min-h-[44px]"
            >
              Back to Shop
            </Link>
          </div>
        ) : (
          <div className="space-y-5 md:space-y-6">
            {products.map((pin, idx) => (
              <ProductSection
                key={pin.product.id}
                pin={pin}
                palette={HEADER_PALETTE[idx % HEADER_PALETTE.length]}
                onOpenDetail={(brandId) => setDetail({ product: pin.product, brandId })}
              />
            ))}
          </div>
        )}
      </div>

      <ProductDetailDrawer
        product={detail?.product || null}
        selectedBrandId={detail?.brandId}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

function ProductSection({
  pin,
  palette,
  onOpenDetail,
}: {
  pin: SectionPinnedProduct;
  palette: { bar: string; text: string };
  onOpenDetail: (brandId?: string) => void;
}) {
  const product = pin.product;
  const sectionHeading = pin.displayLabel?.trim() || product.name;
  const brandCount = product.brands.length;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Reorder brands for the swiper so the pin's default brand sits at slot 0.
  // Don't filter — every brand still renders, just in a new order.
  const orderedBrands = useMemo(() => {
    const list = product.brands.slice();
    if (pin.defaultBrandId) {
      const idx = list.findIndex(b => b.id === pin.defaultBrandId);
      if (idx > 0) {
        const [b] = list.splice(idx, 1);
        list.unshift(b);
      }
    }
    return list;
  }, [product.brands, pin.defaultBrandId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth);
    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [orderedBrands]);

  const brandCountBadge = (
    <span className={`text-[11px] md:text-xs font-semibold whitespace-nowrap ${palette.text} opacity-80`}>
      ({brandCount} brand{brandCount === 1 ? "" : "s"})
    </span>
  );

  return (
    <section className="rounded-2xl shadow-sm overflow-hidden bg-card">
      <div className={`${palette.bar} ${palette.text} px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between gap-3`}>
        <h2 className="pf text-base md:text-lg font-bold truncate">{sectionHeading}</h2>
        {/* Desktop: always show brand count */}
        <span className="hidden md:inline">{brandCountBadge}</span>
        {/* Mobile: swipe hint when overflow, brand count otherwise */}
        <span className="md:hidden">
          {hasOverflow ? (
            <span className={`text-[11px] font-semibold animate-pulse whitespace-nowrap ${palette.text}`}>
              Swipe for more →
            </span>
          ) : (
            brandCountBadge
          )}
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 snap-x snap-mandatory overflow-x-auto p-4 md:p-6 scrollbar-hide"
      >
        {orderedBrands.map(brand => (
          <BrandCard
            key={brand.id}
            product={product}
            brand={brand}
            onOpenDetail={() => onOpenDetail(brand.id)}
          />
        ))}
      </div>
    </section>
  );
}

function BrandCard({
  product,
  brand,
  onOpenDetail,
}: {
  product: Product;
  brand: Brand;
  onOpenDetail: () => void;
}) {
  const { addToCart } = useCart();
  const image = brand.imageUrl || product.imageUrl || null;
  const showSale = brand.compareAtPrice && brand.compareAtPrice > brand.price;

  // Pack label preference: pack_count if integer > 0, else weight range, else hide row.
  const packLabel = useMemo(() => {
    if (brand.packCount && Number.isFinite(brand.packCount) && Number.isInteger(brand.packCount) && brand.packCount > 0) {
      return `${brand.packCount}pcs`;
    }
    if (brand.weightRangeKg) return brand.weightRangeKg;
    return null;
  }, [brand.packCount, brand.weightRangeKg]);

  // A brand card is OOS if: product-level flag is set, OR this specific brand is OOS.
  const isOutOfStock = isProductOOS(product) || brand.inStock === false;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart({
      ...product,
      selectedBrand: brand,
      price: brand.price,
      name: `${product.name} (${brand.label})`,
    });
    toast.success(`✓ ${product.name} (${brand.label}) added`, {
      action: { label: "View Cart →", onClick: () => (window.location.href = "/cart") },
    });
  };

  return (
    <div
      className={`snap-start shrink-0 w-[35vw] md:w-[180px] bg-card rounded-card shadow-card overflow-hidden flex flex-col ${isOutOfStock ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={onOpenDetail}
        className="block w-full text-left"
        aria-label={`View ${product.name} ${brand.label}`}
      >
        <div className="relative aspect-square w-full bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
          {isOutOfStock ? (
            <span className="absolute top-1.5 left-1.5 bg-[#E53935] text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-pill z-10">
              Out of Stock
            </span>
          ) : showSale ? (
            <span className="absolute top-1.5 right-1.5 bg-destructive text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-pill z-10">
              Sale
            </span>
          ) : null}
          <ProductImage
            imageUrl={image}
            emoji={brand.img || product.baseImg}
            alt={`${product.name} ${brand.label}`}
            className="w-full h-full"
            emojiClassName="text-5xl"
          />
        </div>
      </button>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="text-[14px] font-bold leading-tight line-clamp-2 cursor-pointer" onClick={onOpenDetail}>
          {brand.label}
        </div>
        {packLabel && (
          <div className="text-[11px] text-muted-foreground">{packLabel}</div>
        )}
        <div className="flex items-baseline gap-1.5 mt-auto">
          <span className="text-[16px] font-bold text-forest">{fmt(brand.price)}</span>
          {showSale && (
            <span className="text-[11px] text-muted-foreground line-through">{fmt(brand.compareAtPrice!)}</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className="mt-2 w-full rounded-pill text-primary-foreground text-xs font-semibold py-2 min-h-[36px] disabled:cursor-not-allowed"
          style={{ backgroundColor: isOutOfStock ? "#bbb" : "#F4845F" }}
        >
          {isOutOfStock ? "Sold Out" : "+ Add"}
        </button>
      </div>
    </div>
  );
}
